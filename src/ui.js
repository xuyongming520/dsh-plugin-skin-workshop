import { TEMPLATE_INFO, BACKGROUND_INFO, COMBINATION_INFO, makeCombination, changeTemplate, cloneSkin, sameSkin, validateSkin, PREVIEW_SECONDS } from './model.js'
import { PRESET_BACKGROUNDS } from './backgrounds.js'
import { skinVariables } from './renderer.js'
import { readWallpaperFile, readSkinFile, downloadSkin } from './files.js'

export function createWorkshopUI(React, store, openWorkbench) {
  const h = React.createElement
  const combinations = Object.keys(COMBINATION_INFO).map((id) => ({ id, skin: makeCombination(id) }))
  // Three weak views instead of a busy sidebar. 换皮肤 comes first because a
  // wallpaper is what most people open the workshop for.
  const editorTabs = [['skin', '换皮肤', '壁纸与材质'], ['theme', '换主题', '配色与形状'], ['mine', '我的皮肤', '保存与导入']]
  let draftMemory = null
  const useWorkshop = () => React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  function WorkshopIcon({ size = 18 }) {
    return h('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M4 3.5h11.5v7H4zM6 10.5v2h6v4H9v-4M4 5H2.5v4H4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      h('path', { d: 'M7 6h5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }))
  }
  function useHostDark() {
    const [dark, setDark] = React.useState(() => document.body.hasAttribute('data-ds-dark-theme'))
    React.useEffect(() => {
      const observer = new MutationObserver(() => setDark(document.body.hasAttribute('data-ds-dark-theme')))
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
      return () => observer.disconnect()
    }, [])
    return dark
  }
  const Miniature = React.memo(function Miniature({ skin, dark, small = false }) {
    const variables = React.useMemo(() => skinVariables(skin, dark, true), [skin, dark])
    return h('div', { className: `sw-mini${small ? ' sw-mini--small' : ''}`, style: variables, 'aria-hidden': true, 'data-mini-template': skin.template },
      h('div', { className: 'sw-mini-bg' }), h('div', { className: 'sw-mini-shade' }),
      h('div', { className: 'sw-mini-inner' },
        h('div', { className: 'sw-mini-side' },
          h('div', { className: 'sw-mini-logo' }, h('i'), 'WORKSPACE'),
          ['我的对话', '灵感笔记', '工具收藏'].map((label) => h('div', { key: label, className: 'sw-mini-nav' }, label))),
        h('div', { className: 'sw-mini-chat' },
          h('div', { className: 'sw-mini-title' }, h('span', null, skin.template === 'xp' ? '我的复古工作室' : skin.template === 'pixel' ? '方块里的灵感' : '留一点空间给想象'), h('span', { className: 'sw-mini-dots' }, '•••')),
          h('div', { className: 'sw-mini-bubble sw-mini-bubble--user' }, '换个背景，不一定要换掉喜欢的主题。'),
          h('div', { className: 'sw-mini-bubble' }, '主题、壁纸和材质，各自调整，自由搭配。'),
          h('div', { className: 'sw-mini-compose' }, h('span', null, '写下新的想法…'), h('span', { className: 'sw-mini-send' }, '↑')))))
  })
  function Button({ children, tone = '', ...props }) {
    return h('button', { type: 'button', ...props, className: `sw-btn${tone ? ` sw-btn--${tone}` : ''}` }, children)
  }
  function Slider({ label, value, onChange, min = 0, max = 100, unit = '', step = 1, disabled = false }) {
    const id = React.useId()
    return h('label', { className: 'sw-field', htmlFor: id },
      h('span', { className: 'sw-field-title' }, h('span', null, label), h('output', { htmlFor: id }, `${value}${unit}`)),
      h('input', { id, type: 'range', value, min, max, step: Number.isInteger(value / step) ? step : 'any', disabled, 'aria-label': label, 'aria-valuetext': `${value}${unit}`, onChange: (event) => onChange(Math.round(Number(event.target.value) * 10) / 10) }))
  }
  function Select({ label, value, onChange, options, disabled = false }) {
    const id = React.useId()
    return h('label', { className: 'sw-field', htmlFor: id }, h('span', null, label),
      h('select', { id, value, disabled, 'aria-label': label, onChange: (event) => onChange(event.target.value) }, options.map(([key, text]) => h('option', { key, value: key }, text))))
  }
  function SkinCard({ skin, selected, active, onClick, dark, combination = null }) {
    const info = combination ? COMBINATION_INFO[combination] : TEMPLATE_INFO[skin.template]
    return h('button', { type: 'button', className: 'sw-card', 'aria-pressed': selected, 'aria-label': `${combination ? '使用搭配' : '编辑皮肤'}：${skin.name}`, onClick },
      h(Miniature, { skin, dark, small: true }),
      h('span', { className: 'sw-card-copy' }, h('span', { className: 'sw-card-name' }, skin.name),
        active ? h('span', { className: 'sw-badge sw-badge--active' }, '使用中') : h('span', { className: 'sw-card-tag' }, info.tag)),
      combination ? h('span', { className: 'sw-card-desc' }, info.description) : null)
  }

  function WorkshopPage() {
    const state = useWorkshop()
    const dark = useHostDark()
    const initial = React.useRef(draftMemory ?? {
      draft: cloneSkin(state.active?.skin ?? makeCombination()),
      baseline: cloneSkin(state.active?.skin ?? makeCombination()),
      selectedId: state.active?.id ?? null,
      editorTab: 'skin',
    }).current
    const [draft, setDraft] = React.useState(initial.draft)
    const [baseline, setBaseline] = React.useState(initial.baseline)
    const [selectedId, setSelectedId] = React.useState(initial.selectedId)
    const [editorTab, setEditorTab] = React.useState(initial.editorTab ?? 'skin')
    const [dragging, setDragging] = React.useState(false)
    const [justUploaded, setJustUploaded] = React.useState(false)
    const [undoSnapshot, setUndoSnapshot] = React.useState(null)
    // True when the draft holds edits the user has not applied yet.
    const [pending, setPending] = React.useState(false)
    const draftRef = React.useRef(null)
    const [message, setMessage] = React.useState('')
    const [error, setError] = React.useState('')
    const [busy, setBusy] = React.useState('')
    const [confirm, setConfirm] = React.useState(null)
    const imageInput = React.useRef(null)
    const skinInput = React.useRef(null)
    const operation = React.useRef(0)
    const mounted = React.useRef(true)
    const blockPrefix = React.useId()
    draftRef.current = draft
    const dirty = !sameSkin(draft, baseline)
    const dirtyRef = React.useRef(dirty)
    dirtyRef.current = dirty
    // The live slot is "what is on screen right now", not one of the user's saves.
    const LIVE_ID = 'skin-live'
    const savedSkins = state.skins.filter((entry) => entry.id !== LIVE_ID)
    const selectedSaved = savedSkins.some((entry) => entry.id === selectedId)
    const previewDraft = React.useMemo(() => ({ ...draft, name: draft.name.trim() || '未命名皮肤' }), [draft])
    const noBackground = draft.wallpaper.kind === 'none'
    const nativeStyle = draft.template === 'native'
    const backgroundLabel = draft.wallpaper.kind === 'image' ? '自定义壁纸' : noBackground ? '无背景图' : BACKGROUND_INFO[draft.wallpaper.preset]

    React.useEffect(() => {
      draftMemory = { draft, baseline, selectedId, editorTab }
    }, [draft, baseline, selectedId, editorTab])
    React.useEffect(() => {
      mounted.current = true
      return () => { mounted.current = false; operation.current++ }
    }, [])
    React.useEffect(() => {
      if (!pending) return undefined
      const warn = (event) => { event.preventDefault(); event.returnValue = '' }
      window.addEventListener('beforeunload', warn)
      return () => window.removeEventListener('beforeunload', warn)
    }, [pending])
    React.useEffect(() => {
      // The persistent preview bar can save while this page is mounted.
      if (!state.preview && state.active && sameSkin(state.active.skin, draft)) {
        if (selectedId !== state.active.id) setSelectedId(state.active.id)
        if (!sameSkin(baseline, state.active.skin)) setBaseline(cloneSkin(state.active.skin))
      }
    }, [state.active, state.preview, draft, baseline, selectedId])

    const run = (action) => {
      setError('')
      try { action() } catch (failure) { setError(failure?.message ?? '操作失败，请再试一次。') }
    }
    const editMeta = (change) => {
      setPending(true)
      setDraft((previous) => ({ ...previous, ...change }))
      setError('')
      setMessage('')
    }
    // Every visual control takes effect on its own; the debounce keeps a slider
    // drag from writing storage on each pixel of movement.
    const edit = (change) => {
      const next = typeof change === 'function' ? change(draftRef.current) : { ...draftRef.current, ...change }
      setDraft(next)
      setError('')
      setMessage('')
      applySoon(next)
    }
    // Changes remain local unless the user explicitly started a timed preview.
    React.useEffect(() => {
      if (!store.getSnapshot().preview) return
      try { store.updatePreview(previewDraft) } catch (failure) { setError(failure.message) }
    }, [previewDraft])
    const editWallpaper = (change) => edit((previous) => ({ ...previous, wallpaper: { ...previous.wallpaper, ...change } }))
    const replaceDraft = (skin, id = null, note = '', { pending: skipBaseline = false } = {}) => {
      setPending(true)
      operation.current++
      setBusy('')
      store.cancelPreview()
      setDraft(cloneSkin(skin))
      if (!skipBaseline) setBaseline(cloneSkin(skin))
      setSelectedId(id)
      setError('')
      setMessage(note)
    }
    const requestReplace = (action) => {
      if (dirtyRef.current) setConfirm({ text: '当前还有未保存的修改。继续载入整套搭配会放弃这些修改。', label: '放弃并切换', action })
      else action()
    }
    const switchTemplate = (template) => {
      const next = changeTemplate({ ...draft, name: draft.name.trim() || '未命名皮肤' }, template)
      applyNow({ ...next, name: draft.name }, `已切换到「${TEMPLATE_INFO[template].title}」。`)
    }
    const save = (apply = false, copy = false) => run(() => {
      const next = validateSkin(copy ? { ...draft, name: `${draft.name.trim().slice(0, 35)} 副本` } : draft)
      // Saving the live appearance creates a real entry; editing a saved skin
      // updates that one.
      const target = selectedSaved ? selectedId : null
      const id = store.save(next, { id: target, apply, copy })
      if (!apply) store.cancelPreview()
      setSelectedId(id)
      setDraft(cloneSkin(next))
      setBaseline(cloneSkin(next))
      if (apply) setPending(false)
      setMessage(apply ? '已保存并应用。下次打开仍会使用这款皮肤。' : '已保存到我的皮肤，当前外观没有改变。')
    })
    // A picked wallpaper or theme is a finished choice, not a draft: apply it at
    // once and offer one-step undo, so nobody has to look for a Save button.
    const applyNow = (skin, note) => run(() => {
      // An applied choice ends any running preview; otherwise the timed bar
      // would outlive the skin it was previewing.
      store.cancelPreview()
      // Applying needs a name; fall back to the theme title instead of refusing
      // the change just because the name field is empty.
      const next = validateSkin({ ...skin, name: (skin.name ?? '').trim() || TEMPLATE_INFO[skin.template].title })
      const previous = state.active ? cloneSkin(state.active) : null
      // Always write the live slot: browsing must not overwrite a named skin.
      const id = store.save(next, { id: LIVE_ID, apply: true, reuseId: true })
      setSelectedId(id)
      setDraft(cloneSkin(next))
      setBaseline(cloneSkin(next))
      setUndoSnapshot(previous ?? { id: null, skin: null })
      setPending(false)
      setError('')
      setMessage(note)
    })
    const liveTimer = React.useRef(null)
    const applySoon = (skin) => {
      setDraft((d) => skin)
      if (liveTimer.current) clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(() => { liveTimer.current = null; applyNow(skin, '') }, 300)
    }
    React.useEffect(() => () => { if (liveTimer.current) clearTimeout(liveTimer.current) }, [])
    const undoApplied = () => run(() => {
      if (undoSnapshot?.skin) {
        store.save(cloneSkin(undoSnapshot.skin), { id: undoSnapshot.id, apply: true })
        setSelectedId(undoSnapshot.id)
        setDraft(cloneSkin(undoSnapshot.skin))
        setBaseline(cloneSkin(undoSnapshot.skin))
      } else {
        store.restoreDefault()
        setDraft(makeCombination())
        setBaseline(makeCombination())
      }
      setUndoSnapshot(null)
      setMessage('已撤销这次更换。')
    })
    const remove = () => setConfirm({
      text: state.active?.id === selectedId ? '删除这款皮肤后会恢复 DSH 默认外观。要继续吗？' : '要从本机删除这款皮肤吗？建议先导出备份。',
      label: '确认删除',
      action: () => run(() => { store.remove(selectedId); replaceDraft(makeCombination(), null, '已删除。') }),
    })
    async function importFile(file) {
      if (!file) return
      const token = ++operation.current
      setBusy('import')
      setError('')
      try {
        const skin = await readSkinFile(file)
        if (!mounted.current || token !== operation.current) return
        requestReplace(() => replaceDraft(skin, null, '已导入到编辑器，尚未应用。确认无误后点「保存到我的皮肤」。', { pending: true }))
      } catch (failure) {
        if (mounted.current && token === operation.current) setError(failure.message)
      } finally {
        if (mounted.current && token === operation.current) setBusy('')
      }
    }
    async function uploadWallpaper(file) {
      if (!file) return
      const token = ++operation.current
      setBusy('image')
      setError('')
      try {
        const image = await readWallpaperFile(file)
        if (!mounted.current || token !== operation.current) return
        setJustUploaded(true)
        applyNow({ ...draft, wallpaper: { ...draft.wallpaper, kind: 'image', image } }, '壁纸已应用。')
      } catch (failure) {
        if (mounted.current && token === operation.current) setError(failure.message)
      } finally {
        if (mounted.current && token === operation.current) setBusy('')
      }
    }
    const tabKey = (event) => {
      const index = editorTabs.findIndex(([id]) => id === editorTab)
      const nextIndex = event.key === 'ArrowRight' ? (index + 1) % editorTabs.length : event.key === 'ArrowLeft' ? (index + editorTabs.length - 1) % editorTabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? editorTabs.length - 1 : -1
      if (nextIndex < 0) return
      event.preventDefault()
      const next = editorTabs[nextIndex][0]
      setEditorTab(next)
      event.currentTarget.parentElement.querySelector(`[data-editor-tab="${next}"]`)?.focus()
    }
    const panelProps = (id) => ({ id: `${blockPrefix}-panel-${id}`, role: 'tabpanel', 'aria-labelledby': `${blockPrefix}-tab-${id}`, hidden: editorTab !== id, className: 'sw-tab-panel' })
    const goSkin = () => setEditorTab('skin')
    // Theme cards reuse the current wallpaper and material so the four options
    // differ only in what a theme actually changes.
    const THEME_COMBINATION = { native: 'wallpaper', glass: 'glass', xp: 'xp', pixel: 'pixel' }
    const themeSample = (template) => {
      try { return changeTemplate(previewDraft, template) } catch { return makeCombination() }
    }
    const currentLabel = state.preview ? `${state.preview.skin.name} · 试穿 ${state.preview.seconds}s` : state.active?.skin.name ?? 'DSH 默认'
    return h('main', { className: 'sw-page', 'data-motion': draft.motion ? 'on' : 'off', 'aria-label': '皮肤工坊' },
      h('input', { ref: skinInput, type: 'file', accept: '.json,application/json', hidden: true, 'aria-label': '导入分享包文件', onChange: (event) => { const file = event.target.files?.[0]; event.target.value = ''; void importFile(file) } }),
      h('input', { ref: imageInput, type: 'file', accept: 'image/png,image/jpeg,image/webp', hidden: true, 'aria-label': '上传壁纸文件', onChange: (event) => { const file = event.target.files?.[0]; event.target.value = ''; void uploadWallpaper(file) } }),
      h('header', { className: 'sw-top' },
        h('div', { className: 'sw-top-title' },
          h('h1', { className: 'sw-title' }, '皮肤工坊'),
          h('span', { className: 'sw-top-tag' }, '换皮肤 · 换主题 · 我的皮肤')),
        h('div', { className: 'sw-top-meta' },
          h('span', null, '当前外观'),
          h('span', { className: 'sw-badge sw-badge--active', 'data-current-skin': true }, currentLabel),
          h(Button, { tone: 'ghost', onClick: () => run(() => { store.restoreDefault(); setMessage('') }) }, '恢复默认'))),
      state.notice ? h('div', { className: 'sw-top-notice' }, h('div', { className: 'sw-notice', role: 'status' }, h('span', null, state.notice), h(Button, { tone: 'ghost', onClick: store.dismissNotice, 'aria-label': '关闭状态提示' }, '×'))) : null,
      h('div', { className: 'sw-workspace' },
        confirm ? h('div', { className: 'sw-notice sw-notice--confirm', role: 'alert', style: { marginBottom: 12 } },
          h('span', null, confirm.text), h('div', { className: 'sw-actions' },
            h(Button, { onClick: () => setConfirm(null) }, '取消'),
            h(Button, { tone: 'primary', onClick: () => { const action = confirm.action; setConfirm(null); action() } }, confirm.label))) : null,
        error ? h('div', { className: 'sw-notice sw-notice--error', role: 'alert', style: { marginBottom: 12 } }, error) : null,
        h('div', { className: 'sw-editor-tabs', role: 'tablist', 'aria-label': '皮肤工坊视图' }, editorTabs.map(([id, title, hint]) => h('button', {
          key: id, id: `${blockPrefix}-tab-${id}`, type: 'button', role: 'tab', 'aria-selected': editorTab === id,
          'aria-controls': `${blockPrefix}-panel-${id}`, 'data-editor-tab': id, tabIndex: editorTab === id ? 0 : -1,
          onClick: () => setEditorTab(id), onKeyDown: tabKey,
        }, h('span', { className: 'sw-tab-title' }, title), h('span', { className: 'sw-tab-hint' }, hint)))),
        h('section', panelProps('skin'),
          h('p', { className: 'sw-panel-lead' }, '挑一张喜欢的图，工作台立刻换个心情。'),
          noBackground ? h('button', {
            type: 'button', className: `sw-dropzone${dragging ? ' sw-dropzone--active' : ''}`, disabled: !!busy,
            onClick: () => imageInput.current?.click(),
            onDragOver: (event) => { event.preventDefault(); if (!dragging) setDragging(true) },
            onDragLeave: () => setDragging(false),
            onDrop: (event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer?.files?.[0]; if (file) void uploadWallpaper(file) },
          },
          h('svg', { className: 'sw-dropzone-icon', viewBox: '0 0 48 48', 'aria-hidden': true },
            h('rect', { x: 5, y: 9, width: 38, height: 30, rx: 5 }),
            h('circle', { cx: 16, cy: 19, r: 4 }),
            h('path', { d: 'M8 34l11-11 8 8 6-5 9 8' })),
          h('strong', null, busy === 'image' ? '正在本机压缩…' : '上传一张壁纸'),
          h('span', { className: 'sw-dropzone-main' }, '把图片拖到这里，或点击选择'),
          h('small', null, 'PNG / JPEG / WebP · 原图最大 10 MB · 自动压到最长边 1920'),
          h('small', { className: 'sw-dropzone-note' }, '只在本机处理并嵌入皮肤，不会上传到任何外部服务。'))
          : h('div', {
            className: `sw-bgcard${dragging ? ' sw-bgcard--active' : ''}`,
            onDragOver: (event) => { event.preventDefault(); if (!dragging) setDragging(true) },
            onDragLeave: () => setDragging(false),
            onDrop: (event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer?.files?.[0]; if (file) void uploadWallpaper(file) },
          },
            // Echo the chosen background: the user must be able to see what they picked.
            h('div', {
              className: 'sw-bgcard-thumb', 'data-bg-preview': draft.wallpaper.kind,
              'aria-hidden': true,
              style: { backgroundImage: draft.wallpaper.kind === 'image' ? `url("${draft.wallpaper.image}")` : PRESET_BACKGROUNDS[draft.wallpaper.preset] },
            }),
            h('div', { className: 'sw-bgcard-copy' },
              h('strong', null, draft.wallpaper.kind === 'image'
                ? (justUploaded ? '✓ 壁纸已上传' : '当前壁纸')
                : `内置背景 · ${backgroundLabel}`),
              h('span', null, draft.wallpaper.kind === 'image'
                ? (justUploaded ? '已在本机压缩并嵌入皮肤，下方按钮可换一张或移除。' : '已嵌入皮肤，可换一张或移除。')
                : '来自工坊内置背景，点下面任意一张可替换。'),
              h('div', { className: 'sw-bgcard-actions' },
                h(Button, { disabled: !!busy, onClick: () => imageInput.current?.click() }, busy === 'image' ? '正在压缩…' : '换一张'),
                h(Button, { tone: 'ghost', onClick: () => { operation.current++; setBusy(''); setJustUploaded(false); editWallpaper({ kind: 'none', image: '' }) } }, '移除背景')))),
          h('div', { className: 'sw-bg-options', role: 'group', 'aria-label': '内置背景' }, Object.entries(BACKGROUND_INFO).map(([key, text]) => h('button', {
            key, type: 'button', className: 'sw-bg-option', 'aria-pressed': draft.wallpaper.kind === 'preset' && draft.wallpaper.preset === key,
            onClick: () => { operation.current++; setBusy(''); setJustUploaded(false); setEditorTab('skin'); applyNow({ ...draft, wallpaper: { ...draft.wallpaper, kind: 'preset', preset: key, image: '' } }, `已换成内置背景「${text}」。`) },
          }, h('span', { style: { backgroundImage: PRESET_BACKGROUNDS[key] } }), text))),
          h('div', { className: 'sw-reading-control sw-reading-control--top' }, h('span', { className: 'sw-reading-icon', 'aria-hidden': true }, 'Aa'),
            h(Slider, { label: '正文阅读遮罩', value: draft.readingOpacity, unit: '%', onChange: (readingOpacity) => applySoon({ ...draft, readingOpacity }) }),
            h('p', { className: 'sw-hint' }, `壁纸在正文里还剩「${100 - draft.readingOpacity}% 可见」。30–45% 壁纸清楚、字也能读；越高越像普通工作台。`)),
          h('div', { className: 'sw-actions sw-quick-opacity' }, h('span', { className: 'sw-subtle' }, '一键调节'),
            h(Button, { onClick: () => applyNow({ ...draft, material: 'glass', opacity: 40, readingOpacity: 30 }, '已切到更通透的观感。') }, '更通透'),
            h(Button, { onClick: () => applyNow({ ...draft, opacity: 80, readingOpacity: 80 }, '已切到更清晰的观感。') }, '更清晰')),
          draft.wallpaper.kind !== 'none' && draft.readingOpacity < 30 ? h('p', { className: 'sw-hint sw-hint--warn', role: 'status' }, '正文遮罩低于 30%，壁纸很显眼，但复杂图片上的小字可能发花。看不清就点「更清晰」，或把遮罩调回 40% 左右。') : null,
          h('details', { className: 'sw-details sw-advanced' }, h('summary', null, '高级：壁纸与面板'),
            h('div', { className: 'sw-control-heading sw-sub-head' }, h('h4', null, '壁纸细节'), h('p', null, '只影响图片本身，不动主题。')),
            h('div', { className: 'sw-control-grid' },
              h(Slider, { label: '壁纸不透明度', value: draft.wallpaper.opacity, unit: '%', disabled: noBackground, onChange: (opacity) => editWallpaper({ opacity }) }),
              h(Slider, { label: '背景模糊', value: draft.wallpaper.blur, max: 24, unit: 'px', disabled: noBackground, onChange: (blur) => editWallpaper({ blur }) }),
              h(Select, { label: '图片填充', value: draft.wallpaper.fit, disabled: noBackground, options: [['cover', '铺满'], ['contain', '完整显示'], ['tile', '平铺']], onChange: (fit) => editWallpaper({ fit }) }),
              h(Slider, { label: '横向位置', value: draft.wallpaper.x, unit: '%', disabled: noBackground, onChange: (x) => editWallpaper({ x }) }),
              h(Slider, { label: '纵向位置', value: draft.wallpaper.y, unit: '%', disabled: noBackground, onChange: (y) => editWallpaper({ y }) }),
              h(Slider, { label: '背景缩放', value: draft.wallpaper.zoom, min: 100, max: 180, unit: '%', disabled: noBackground, onChange: (zoom) => editWallpaper({ zoom }) }),
              h(Slider, { label: '背景压暗', value: draft.wallpaper.dim, max: 65, unit: '%', disabled: noBackground, onChange: (dim) => editWallpaper({ dim }) })),
            h('div', { className: 'sw-control-heading sw-sub-head' }, h('h4', null, '面板与磨砂'), h('p', null, '侧栏、输入框与气泡；与正文遮罩互不绑定。')),
            h('div', { className: 'sw-control-stack' },
              h(Select, { label: '面板材质', value: draft.material, options: [['glass', '磨砂玻璃'], ['solid', '不透明面板']], onChange: (material) => edit({ material }) }),
              h(Slider, { label: '面板不透明度', value: draft.opacity, unit: '%', disabled: draft.material === 'solid', onChange: (opacity) => edit({ opacity }) }),
              h(Slider, { label: '磨砂强度', value: draft.blur, max: 28, unit: 'px', disabled: draft.material === 'solid', onChange: (blur) => edit({ blur }) })),
            h('p', { className: 'sw-hint' }, '不透明面板只关闭面板透光与磨砂，正文遮罩仍可独立调节。菜单、弹窗和提示保留安全底色。'))),
        h('section', panelProps('theme'),
          h('p', { className: 'sw-panel-lead' }, '主题只改配色与控件形状，不动壁纸、材质和阅读遮罩。'),
          h('div', { className: 'sw-theme-options', role: 'group', 'aria-label': '主题风格选择' }, Object.entries(TEMPLATE_INFO).map(([id, info]) => h('div', {
            key: id, className: 'sw-theme-option', 'data-theme-option': id, 'data-current': draft.template === id ? 'true' : undefined,
          },
          h('button', {
            type: 'button', className: 'sw-theme-main', 'aria-label': `主题：${info.title}`, 'aria-pressed': draft.template === id,
            onClick: () => switchTemplate(id),
          },
          // Show the theme applied to the user's own wallpaper, so the choice is
          // a visual one instead of a letter badge.
          h('span', { className: 'sw-theme-preview', 'aria-hidden': true }, h(Miniature, { skin: themeSample(id), dark, small: true })),
          h('span', { className: 'sw-theme-copy' },
            h('span', { className: 'sw-theme-name' }, h('strong', null, info.title),
              draft.template === id ? h('span', { className: 'sw-badge sw-badge--active' }, '使用中') : null),
            h('small', null, info.description))),
          // Every theme has a matching set: its own background and material.
          h('button', {
            type: 'button', className: 'sw-theme-kit', 'data-theme-kit': id,
            'aria-label': `套用${info.title}的配套皮肤`,
            onClick: () => requestReplace(() => applyNow(
              makeCombination(THEME_COMBINATION[id]),
              `已应用「${COMBINATION_INFO[THEME_COMBINATION[id]].title}」配套：主题、背景与材质一起换上。`,
            )),
          }, '套用配套')))),
          h('p', { className: 'sw-hint' }, nativeStyle ? '原生风格不会覆盖宿主的配色与圆角；适合保留当前主题，只换背景。' : '强调色与明暗模式继续跟随 DSH，不会改动字体、导航位置或按钮功能。'),
          h('details', { className: 'sw-details' }, h('summary', null, '圆角、描边与阴影'),
            nativeStyle ? h('p', { className: 'sw-hint' }, '原生风格保留宿主控件形状。若想自定义这些参数，请选现代、复古或像素风格。') : null,
            h('div', { className: 'sw-control-grid' },
              h(Slider, { label: '圆角', value: draft.radius, max: 28, unit: 'px', disabled: nativeStyle, onChange: (radius) => edit({ radius }) }),
              h(Slider, { label: '描边', value: draft.border, max: 3, step: .5, unit: 'px', disabled: nativeStyle, onChange: (border) => edit({ border }) }),
              h(Slider, { label: '阴影', value: draft.shadow, max: 36, disabled: nativeStyle, onChange: (shadow) => edit({ shadow }) })))),
        h('section', panelProps('mine'),
          h('p', { className: 'sw-panel-lead' }, '存下来的整套搭配。导入分享包读的是别人导出的 .dsh-skin.json；图片请到「换皮肤」上传。'),
          h('div', { className: 'sw-mine-actions' },
            h(Button, { disabled: !!busy, onClick: () => skinInput.current?.click() }, busy === 'import' ? '正在读取…' : '导入分享包'),
            h('span', { className: 'sw-subtle' }, `${state.skins.length} / 16 款`)),
          savedSkins.length ? h('div', { className: 'sw-saved' }, savedSkins.map((entry) => h(SkinCard, {
            key: entry.id, skin: entry.skin, dark, selected: selectedId === entry.id, active: state.active?.id === entry.id,
            onClick: () => requestReplace(() => replaceDraft(entry.skin, entry.id)),
          }))) : h('div', { className: 'sw-empty' }, '把喜欢的搭配存下来。', h('br'), '主题、壁纸与材质一起保存。'),
          h('div', { className: 'sw-control-heading sw-sub-head' }, h('h4', null, '快速搭配'), h('p', null, '不想逐项调时载入一整套，再拆开改。')),
          h('div', { className: 'sw-templates' }, combinations.map(({ id, skin }) => h(SkinCard, {
            key: id, skin, dark, combination: id, selected: !selectedSaved && sameSkin(draft, skin),
            onClick: () => requestReplace(() => applyNow(skin, `已应用「${COMBINATION_INFO[id].title}」，整窗立刻生效。`)),
          }))),
          h('p', { className: 'sw-note' }, '仅保存在当前浏览器 / 设备。「导出分享包」包含整套参数与上传的壁纸，可发给同样安装了皮肤工坊的人。')),
        // This block exists for one job: keep the skin, or hand it to someone.
        h('div', { className: 'sw-savebar', 'data-share': true },
          h('div', { className: 'sw-savebar-head' },
            h('h3', null, '保存与分享'),
            h('p', null, '存下来，下次直接用；导出成分享包，别人导入就有一模一样的外观。')),
          h('label', { className: 'sw-field sw-name-field' }, h('span', null, '皮肤名称'), h('input', { type: 'text', value: draft.name, maxLength: 40, placeholder: '给这套皮肤起个名字', onChange: (event) => editMeta({ name: event.target.value }) })),
          h('div', { className: 'sw-savebar-row' },
            h('div', { className: 'sw-actions' },
              h(Button, { tone: 'primary', disabled: !!busy, onClick: () => save(true) }, selectedSaved ? '保存修改' : '保存到我的皮肤'),
              h(Button, { disabled: !!busy, onClick: () => run(() => { downloadSkin(draft); setMessage('已导出分享包，发给别人导入即可。') }) }, '导出分享包')),
            h('div', { className: 'sw-actions sw-savebar-secondary' },
              h(Button, { tone: 'ghost', disabled: !!busy, onClick: () => save(false, true) }, '另存为副本'),
              selectedSaved ? h(Button, { tone: 'danger', onClick: remove }, '删除这款皮肤') : null,
              h(Button, { tone: 'ghost', disabled: !!busy, onClick: () => run(() => { store.previewSkin(previewDraft, selectedId); setMessage('试穿 60 秒后自动恢复，也可在右下角提前结束。') }) }, `试穿 ${PREVIEW_SECONDS} 秒`)))),
        message ? h('div', { className: 'sw-notice', role: 'status' },
          h('span', null, message),
          undoSnapshot ? h(Button, { tone: 'ghost', onClick: undoApplied }, '撤销') : null) : null,
        h('div', { className: 'sw-recipe', 'aria-label': '当前搭配' },
          h('span', null, h('small', null, '主题'), h('strong', { 'data-recipe-theme': true }, TEMPLATE_INFO[draft.template].title)),
          h('i', { 'aria-hidden': true }, '＋'),
          h('span', null, h('small', null, '背景'), h('strong', { 'data-recipe-background': true }, backgroundLabel)),
          h('i', { 'aria-hidden': true }, '＋'),
          h('span', null, h('small', null, '材质'), h('strong', { 'data-recipe-material': true }, draft.material === 'solid' ? '不透明面板' : `磨砂玻璃 · ${draft.opacity}%`))),
        h('label', { className: 'sw-toggle', style: { marginTop: 12 } }, h('input', { type: 'checkbox', checked: draft.motion, onChange: (event) => editMeta({ motion: event.target.checked }) }), '工坊入场与悬停动效（尊重系统减少动态效果设置）'),
        h('p', { className: 'sw-note' }, '换皮肤管背景与材质，换主题管配色与控件形状，两块自由组合后整套保存。覆盖原生侧栏、标题与聊天等主要区域；第三方页面和内嵌网站不保证整套覆盖。复古、像素为风格化实现。')))
  }

  function SettingsSection({ close }) {
    const state = useWorkshop()
    const [error, setError] = React.useState('')
    return h('section', { className: 'sw-settings-section' }, h('h2', null, '皮肤工坊'),
      h('div', { className: 'sw-setting' }, h('div', { className: 'sw-setting-copy' }, '编辑与管理皮肤',
        h('p', null, `当前：${state.active?.skin.name ?? 'DSH 默认'}。主题风格、背景壁纸、面板材质与阅读遮罩，在同一个工坊中搭配。`)),
      h('button', { type: 'button', onClick: () => { try { openWorkbench(); close?.() } catch (failure) { setError(failure.message) } } }, '打开皮肤工坊')),
      h('div', { className: 'sw-setting' }, h('div', { className: 'sw-setting-copy' }, '恢复原生外观', h('p', null, '不删除已保存的皮肤，不改变原生强调色和明暗设置。')),
        h('button', { type: 'button', onClick: store.restoreDefault }, '恢复默认')),
      error ? h('p', { role: 'alert' }, error) : null)
  }
  return { WorkshopPage, WorkshopIcon, SettingsSection }
}
