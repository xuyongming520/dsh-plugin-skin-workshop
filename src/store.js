import { STORAGE_KEY, RECOVERY_KEY, MAX_STORAGE_CHARS, MAX_SKINS, PREVIEW_SECONDS, emptyLibrary, validateLibrary, validateSkin, cloneSkin, newSkinId } from './model.js'

// One controller owns durable state and temporary preview. React never writes
// preferences during render, and preview never writes to localStorage.
export function createWorkshopStore(storage, renderer, options = {}) {
  const now = options.now ?? (() => Date.now())
  const interval = options.setInterval ?? globalThis.setInterval
  const clear = options.clearInterval ?? globalThis.clearInterval
  const eventTarget = options.eventTarget ?? globalThis.window
  let library = emptyLibrary()
  let preview = null
  let notice = ''
  let recovery = null
  let timer = null
  let disposed = false
  const listeners = new Set()
  let snapshot

  try {
    if (!storage) throw new Error('storage unavailable')
    const raw = storage.getItem(STORAGE_KEY)
    if (raw) {
      recovery = raw
      library = validateLibrary(JSON.parse(raw))
      recovery = null
    }
  } catch {
    notice = recovery
      ? '本机皮肤库无法读取，已安全回到 DSH 默认。原数据没有删除；下次保存前会先备份。'
      : '浏览器暂不允许本地存储。仍可试穿、导入和导出，保存与应用需要开放存储。'
  }
  renderer.paint(library.active?.skin ?? null)

  function publish() {
    snapshot = { ...library, preview, notice }
    for (const listener of listeners) listener()
  }
  function write(next) {
    if (!storage) throw new Error('无法访问本地存储。请先导出皮肤包，或允许此页面使用本地存储。')
    const validated = validateLibrary(next)
    const text = JSON.stringify(validated)
    if (text.length > MAX_STORAGE_CHARS) throw new Error('本机皮肤库容量不足。请先导出不常用的皮肤，再从库中删除。')
    try {
      if (recovery !== null) {
        // Keep an unreadable old library, rather than quietly overwriting it.
        const previous = storage.getItem(RECOVERY_KEY)
        if (previous !== null && previous !== recovery) throw new Error('recovery-conflict')
        storage.setItem(RECOVERY_KEY, recovery)
      }
      storage.setItem(STORAGE_KEY, text)
    } catch (error) {
      if (error.message === 'recovery-conflict') throw new Error('已有一份历史恢复备份。为避免覆盖数据，本次未保存；请先导出皮肤包。')
      throw new Error('本地保存失败，可能是容量不足或存储被禁用。没有覆盖已保存的皮肤；请先导出备份。')
    }
    recovery = null
    library = validated
    notice = ''
  }
  function stopTimer() {
    if (timer !== null) clear(timer)
    timer = null
  }
  function cancelPreview(message = '') {
    if (!preview) return
    stopTimer()
    preview = null
    renderer.paint(library.active?.skin ?? null)
    notice = message
    publish()
  }
  function tick() {
    if (!preview || disposed) return
    const seconds = Math.max(0, Math.ceil((preview.deadline - now()) / 1000))
    if (seconds === 0) return cancelPreview('试穿已到时，已恢复之前的外观。')
    if (preview.seconds !== seconds) {
      preview = { ...preview, seconds }
      publish()
    }
  }
  function save(skin, { id = null, copy = false, apply = false } = {}) {
    if (disposed) throw new Error('皮肤工坊已关闭，请刷新后再试。')
    const validated = validateSkin(skin)
    const exists = !copy && library.skins.some((entry) => entry.id === id)
    if (!exists && library.skins.length >= MAX_SKINS) throw new Error(`第一版最多保存 ${MAX_SKINS} 款皮肤。请先导出并删除不常用的皮肤。`)
    const key = exists ? id : newSkinId()
    const entry = { id: key, skin: validated }
    const skins = exists ? library.skins.map((item) => item.id === key ? entry : item) : [...library.skins, entry]
    write({ ...library, skins, active: apply ? cloneSkin(entry) : library.active })
    if (apply) {
      stopTimer()
      preview = null
      renderer.paint(library.active.skin)
    }
    publish()
    return key
  }
  function previewSkin(skin, id = null) {
    const validated = validateSkin(skin)
    stopTimer()
    renderer.paint(validated)
    preview = { skin: validated, id, deadline: now() + PREVIEW_SECONDS * 1000, seconds: PREVIEW_SECONDS }
    notice = ''
    timer = interval(tick, 250)
    publish()
  }
  function updatePreview(skin) {
    if (!preview) return
    const validated = validateSkin(skin)
    renderer.paint(validated)
    preview = { ...preview, skin: validated }
    publish()
  }
  function keepPreview() {
    if (!preview) return null
    return save(preview.skin, { id: preview.id, apply: true })
  }
  function restoreDefault() {
    stopTimer()
    preview = null
    try {
      write({ ...library, active: null })
      notice = '已恢复 DSH 原生外观，保存的皮肤仍在库中。'
    } catch (error) {
      // Recovery must remain possible even when storage is full or unavailable.
      library = { ...library, active: null }
      notice = `本次已恢复默认，但无法保存这个选择；重新加载后可能恢复旧皮肤。${error.message}`
    }
    renderer.paint(null)
    publish()
  }
  function remove(id) {
    if (!library.skins.some((entry) => entry.id === id)) return
    write({ ...library, skins: library.skins.filter((entry) => entry.id !== id), active: library.active?.id === id ? null : library.active })
    stopTimer()
    preview = null
    renderer.paint(library.active?.skin ?? null)
    publish()
  }
  function onStorage(event) {
    if ((event.key !== STORAGE_KEY && event.key !== null) || (event.storageArea && event.storageArea !== storage)) return
    try {
      const raw = event.key === null ? null : event.newValue
      const next = raw ? validateLibrary(JSON.parse(raw)) : emptyLibrary()
      stopTimer()
      preview = null
      library = next
      recovery = null
      renderer.paint(library.active?.skin ?? null)
      notice = '已同步另一个窗口中的皮肤库；当前未保存的编辑仍保留在编辑器里。'
      publish()
    } catch {
      recovery = event.newValue
      notice = '另一个窗口的皮肤数据无效，已忽略，当前外观未改变。'
      publish()
    }
  }
  const visibility = () => tick()
  eventTarget?.addEventListener?.('storage', onStorage)
  eventTarget?.document?.addEventListener?.('visibilitychange', visibility)
  publish()
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    save, remove, previewSkin, updatePreview, cancelPreview, keepPreview, restoreDefault,
    dismissNotice() { notice = ''; publish() },
    dispose() {
      if (disposed) return
      disposed = true
      stopTimer()
      preview = null
      eventTarget?.removeEventListener?.('storage', onStorage)
      eventTarget?.document?.removeEventListener?.('visibilitychange', visibility)
      renderer.dispose()
      listeners.clear()
    },
  }
}
