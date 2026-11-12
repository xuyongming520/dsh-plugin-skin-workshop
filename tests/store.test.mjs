import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorkshopStore } from '../src/store.js'
import { makeTemplate, STORAGE_KEY, RECOVERY_KEY, cloneSkin } from '../src/model.js'

function setup(seed) {
  const data = new Map(seed ? [[STORAGE_KEY, seed]] : [])
  let fail = false
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { if (fail) throw new Error('quota'); data.set(key, value) } }
  const paints = []
  let disposed = false
  const renderer = { paint: (skin) => paints.push(skin === null ? null : cloneSkin(skin)), dispose: () => { disposed = true } }
  const callbacks = new Set()
  const events = new Map()
  let time = 0
  const eventTarget = { addEventListener: (name, callback) => events.set(name, callback), removeEventListener: (name) => events.delete(name) }
  const store = createWorkshopStore(storage, renderer, {
    now: () => time,
    setInterval: (callback) => { callbacks.add(callback); return callback },
    clearInterval: (callback) => callbacks.delete(callback),
    eventTarget,
  })
  return { store, data, paints, events, callbacks, get disposed() { return disposed }, fail: () => { fail = true }, advance: (amount) => { time += amount; for (const cb of [...callbacks]) cb() } }
}

test('fresh install leaves native appearance and never reads old violet color preferences', () => {
  const x = setup()
  assert.equal(x.store.getSnapshot().active, null)
  assert.deepEqual(x.paints, [null])
  assert.equal(x.data.size, 0)
  x.store.dispose()
})
test('save, reload, edit-without-apply, explicit application and reset are distinct', () => {
  const x = setup()
  const id = x.store.save(makeTemplate('xp'), { apply: true })
  const reload = setup(x.data.get(STORAGE_KEY))
  assert.equal(reload.store.getSnapshot().active.id, id)
  assert.equal(reload.paints.at(-1).template, 'xp')
  const changed = { ...makeTemplate('xp'), radius: 20 }
  x.store.save(changed, { id })
  assert.equal(x.store.getSnapshot().skins[0].skin.radius, 20)
  assert.equal(x.store.getSnapshot().active.skin.radius, 6)
  x.store.save(changed, { id, apply: true })
  assert.equal(x.paints.at(-1).radius, 20)
  x.store.restoreDefault()
  assert.equal(x.paints.at(-1), null)
  assert.equal(x.store.getSnapshot().skins.length, 1)
  assert.equal(JSON.parse(x.data.get(STORAGE_KEY)).active, null)
  x.store.dispose(); reload.store.dispose()
})
test('preview and live adjustments never write durable state or extend the deadline', () => {
  const x = setup()
  x.store.save(makeTemplate('xp'), { apply: true })
  const before = x.data.get(STORAGE_KEY)
  x.store.previewSkin(makeTemplate('pixel'))
  x.advance(59_000)
  x.store.updatePreview({ ...makeTemplate('pixel'), border: 3 })
  assert.equal(x.store.getSnapshot().preview.seconds, 1)
  assert.equal(x.data.get(STORAGE_KEY), before)
  x.advance(1000)
  assert.equal(x.store.getSnapshot().preview, null)
  assert.equal(x.paints.at(-1).template, 'xp')
  assert.equal(x.callbacks.size, 0)
  assert.equal(x.data.get(STORAGE_KEY), before)
  x.store.dispose()
})
test('reload while previewing restores only the last durable application', () => {
  const x = setup()
  x.store.save(makeTemplate('glass'), { apply: true })
  x.store.previewSkin(makeTemplate('pixel'))
  const reload = setup(x.data.get(STORAGE_KEY))
  assert.equal(reload.store.getSnapshot().preview, null)
  assert.equal(reload.paints.at(-1).template, 'glass')
  x.store.dispose(); reload.store.dispose()
})
test('keep preview saves it; cancel restores the previous skin; restarting owns one timer', () => {
  const x = setup()
  x.store.previewSkin(makeTemplate('pixel'))
  x.store.previewSkin(makeTemplate('xp'))
  assert.equal(x.callbacks.size, 1)
  const id = x.store.keepPreview()
  assert.equal(x.store.getSnapshot().active.id, id)
  assert.equal(x.store.getSnapshot().skins.length, 1)
  assert.equal(x.callbacks.size, 0)
  x.store.previewSkin(makeTemplate('glass'))
  x.store.cancelPreview()
  assert.equal(x.paints.at(-1).template, 'xp')
  x.store.dispose()
})
test('duplicate creates a new id; deleting the active skin restores default', () => {
  const x = setup()
  const id = x.store.save(makeTemplate(), { apply: true })
  const copy = x.store.save(makeTemplate(), { id, copy: true })
  assert.notEqual(copy, id)
  x.store.remove(id)
  assert.equal(x.store.getSnapshot().active, null)
  assert.equal(x.store.getSnapshot().skins.length, 1)
  assert.equal(x.paints.at(-1), null)
  x.store.dispose()
})
test('failed saves neither replace durable data nor falsely apply a skin', () => {
  const x = setup()
  x.store.save(makeTemplate('xp'), { apply: true })
  const before = x.data.get(STORAGE_KEY)
  x.fail()
  assert.throws(() => x.store.save(makeTemplate('pixel'), { apply: true }), /保存失败/)
  assert.equal(x.data.get(STORAGE_KEY), before)
  assert.equal(x.paints.at(-1).template, 'xp')
  assert.equal(x.store.getSnapshot().skins.length, 1)
  x.store.restoreDefault()
  assert.equal(x.paints.at(-1), null)
  assert.match(x.store.getSnapshot().notice, /重新加载后可能恢复旧皮肤/)
  x.store.dispose()
})
test('corrupt storage is preserved and backed up before the next successful save', () => {
  const broken = '{broken JSON'
  const x = setup(broken)
  assert.equal(x.paints.at(-1), null)
  assert.equal(x.data.get(STORAGE_KEY), broken)
  assert.match(x.store.getSnapshot().notice, /没有删除/)
  x.store.save(makeTemplate('xp'))
  assert.equal(x.data.get(RECOVERY_KEY), broken)
  assert.equal(JSON.parse(x.data.get(STORAGE_KEY)).skins.length, 1)
  x.store.dispose()
})
test('cross-window updates cancel preview, synchronize library and ignore invalid data', () => {
  const x = setup()
  const other = setup()
  other.store.save(makeTemplate('xp'), { apply: true })
  x.store.previewSkin(makeTemplate('glass'))
  x.events.get('storage')({ key: STORAGE_KEY, newValue: other.data.get(STORAGE_KEY) })
  assert.equal(x.store.getSnapshot().preview, null)
  assert.equal(x.paints.at(-1).template, 'xp')
  x.events.get('storage')({ key: STORAGE_KEY, newValue: '{broken' })
  assert.equal(x.paints.at(-1).template, 'xp')
  assert.match(x.store.getSnapshot().notice, /无效/)
  x.events.get('storage')({ key: null, newValue: null })
  assert.equal(x.paints.at(-1), null)
  x.store.dispose(); other.store.dispose()
})
test('disposal releases timer, storage listener and latest renderer state once', () => {
  const x = setup()
  x.store.previewSkin(makeTemplate('xp'))
  x.store.dispose(); x.store.dispose()
  assert.equal(x.disposed, true)
  assert.equal(x.callbacks.size, 0)
  assert.equal(x.events.size, 0)
})
