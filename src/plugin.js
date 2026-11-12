import { WORKSHOP_ID, WORKSHOP_PANEL } from './model.js'
import { WORKSHOP_CSS } from './ui-style.js'
import { createSkinRenderer } from './renderer.js'
import { createWorkshopStore } from './store.js'
import { createWorkshopUI } from './ui.js'

function installPreviewBar(store, doc = document) {
  const bar = doc.createElement('div')
  bar.className = 'sw-livebar'
  bar.hidden = true
  bar.setAttribute('role', 'region')
  bar.setAttribute('aria-label', '皮肤试穿控制')
  const label = doc.createElement('span')
  const undo = doc.createElement('button')
  undo.type = 'button'
  undo.className = 'sw-livebar__undo'
  undo.textContent = '撤销试穿'
  undo.onclick = () => store.cancelPreview()
  const keep = doc.createElement('button')
  keep.type = 'button'
  keep.className = 'sw-livebar__keep'
  keep.textContent = '保留并应用'
  const error = doc.createElement('small')
  error.setAttribute('role', 'alert')
  error.hidden = true
  keep.onclick = () => {
    try { store.keepPreview() }
    catch (failure) { error.hidden = false; error.textContent = failure.message }
  }
  bar.append(label, undo, keep, error)
  doc.body.appendChild(bar)
  let previousFocus = null
  let lastDeadline = null
  const render = () => {
    const preview = store.getSnapshot().preview
    if (preview && bar.hidden) previousFocus = doc.activeElement
    if (!preview && bar.contains(doc.activeElement) && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    bar.hidden = !preview
    if (preview) {
      label.textContent = `正在试穿「${preview.skin.name}」 · ${preview.seconds} 秒后恢复`
      if (lastDeadline !== preview.deadline) { error.hidden = true; error.textContent = '' }
      lastDeadline = preview.deadline
    } else { error.hidden = true; error.textContent = ''; lastDeadline = null }
  }
  const unsubscribe = store.subscribe(render)
  render()
  return () => { unsubscribe(); undo.onclick = null; keep.onclick = null; bar.remove() }
}

export function createPlugin(require) {
  const React = require('react')
  return {
    inject: ['slots', 'theme', 'layout'],
    apply(ctx) {
      let store
      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = WORKSHOP_ID
        style.dataset.skinWorkshop = 'editor'
        style.textContent = WORKSHOP_CSS
        document.head.appendChild(style)
        const renderer = createSkinRenderer(ctx.theme)
        let storage
        try { storage = window.localStorage } catch { storage = null }
        store = createWorkshopStore(storage, renderer)
        const releaseBar = installPreviewBar(store)
        return () => {
          releaseBar()
          store.dispose()
          style.remove()
        }
      })
      const { WorkshopPage, WorkshopIcon, SettingsSection } = createWorkshopUI(React, store, () => ctx.layout.selectPanel(WORKSHOP_PANEL))
      ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: WORKSHOP_PANEL }, WorkshopPage))
      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist', id: WORKSHOP_PANEL, order: 6, label: () => '皮肤工坊',
      }, WorkshopIcon))
      // A real settings section receives the host's `close` callback. Do not poke
      // a private DS Bot API or open a page invisibly behind its modal dialog.
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section', id: WORKSHOP_PANEL, order: 12, label: () => '皮肤工坊',
      }, SettingsSection))
      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon', id: WORKSHOP_PANEL,
      }, WorkshopIcon))
    },
  }
}
