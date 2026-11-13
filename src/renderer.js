import { WORKSHOP_ID, validateSkin } from './model.js'
import { PRESET_BACKGROUNDS } from './backgrounds.js'

export function skinVariables(input, dark = false, preview = false) {
  const s = validateSkin(input)
  const native = s.template === 'native'
  const retro = s.template === 'xp'
  const pixel = s.template === 'pixel'
  // Native mode consumes the existing host palette instead of overriding it.
  // The schematic preview uses paired fallback colors so its independent
  // light/dark switch never changes the real host's appearance.
  const host = (token, fallback) => native && !preview ? `var(${token},${fallback})` : fallback
  const solid = native ? host('--dsw-alias-bg-layer-1', dark ? '#232324' : '#ffffff') : dark ? (retro ? '#292a2c' : pixel ? '#2d302b' : '#242b34') : (retro ? '#f1eee2' : pixel ? '#e9e7dc' : '#f9fafb')
  const base = native ? host('--dsw-alias-bg-base', dark ? '#151517' : '#ffffff') : dark ? '#141a22' : (retro ? '#e8e7df' : '#edf1f5')
  const ink = native ? host('--dsw-alias-label-primary', dark ? '#fafafa' : '#0f1115') : dark ? '#eef1f5' : '#242a34'
  const muted = native ? host('--dsw-alias-label-secondary', dark ? '#cfd3d6' : '#61666b') : dark ? '#c8d0da' : '#45505f'
  const opacity = s.material === 'solid' ? 100 : s.opacity
  const pane = `color-mix(in srgb, ${solid} ${opacity}%, transparent)`
  const shadow = pixel
    ? `${Math.round(s.shadow / 4)}px ${Math.round(s.shadow / 4)}px 0 rgba(0,0,0,.24)`
    : `0 ${Math.round(s.shadow / 3)}px ${s.shadow}px rgba(0,0,0,${dark ? '.32' : '.13'})`
  const bevel = native ? 'inset 0 0 0 transparent' : retro ? 'inset 1px 1px 0 rgba(255,255,255,.75), inset -1px -1px 0 rgba(0,0,0,.24)' : pixel ? 'inset 2px 2px 0 rgba(255,255,255,.24), inset -2px -2px 0 rgba(0,0,0,.18)' : 'inset 0 1px 0 rgba(255,255,255,.2)'
  const wallpaper = s.wallpaper.kind === 'image' ? `url("${s.wallpaper.image}")` : s.wallpaper.kind === 'preset' ? PRESET_BACKGROUNDS[s.wallpaper.preset] : 'none'
  return {
    '--sw-base': base,
    '--sw-solid': solid,
    '--sw-pane': pane,
    // Reading protection is independent of both wallpaper and floating panels.
    '--sw-reading-pane': `color-mix(in srgb, ${solid} ${s.readingOpacity}%, transparent)`,
    // A scrolled sticky header shares the page's reading backing (slightly
    // stronger so labels stay legible), instead of turning into a white bar.
    '--sw-sticky-pane': `color-mix(in srgb, ${solid} ${Math.min(100, Math.max(40, s.readingOpacity + 10))}%, transparent)`,
    '--sw-ink': ink,
    '--sw-muted': muted,
    '--sw-line': native ? host('--dsw-alias-border-l2', dark ? 'rgba(255,255,255,.23)' : 'rgba(41,53,68,.22)') : dark ? 'rgba(255,255,255,.23)' : (pixel ? '#51564a' : 'rgba(41,53,68,.22)'),
    '--sw-edge': retro ? (dark ? '#4584c9' : '#2864b9') : 'var(--sw-line)',
    '--sw-radius': `${s.radius}px`,
    '--sw-control-radius': `${Math.min(s.radius, 12)}px`,
    '--sw-border': `${s.border}px`,
    '--sw-blur': `${s.material === 'solid' ? 0 : s.blur}px`,
    '--sw-shadow': s.shadow === 0 ? '0 0 0 transparent' : shadow,
    '--sw-bevel': bevel,
    '--sw-wallpaper': wallpaper,
    '--sw-image-size': s.wallpaper.fit === 'tile' ? '320px auto' : s.wallpaper.fit,
    '--sw-image-repeat': s.wallpaper.fit === 'tile' ? 'repeat' : 'no-repeat',
    '--sw-image-position': `${s.wallpaper.x}% ${s.wallpaper.y}%`,
    '--sw-image-zoom': String(s.wallpaper.zoom / 100),
    '--sw-image-opacity': String(s.wallpaper.opacity / 100),
    '--sw-image-blur': `${s.wallpaper.blur}px`,
    '--sw-image-dim': s.wallpaper.kind === 'none' ? '0' : String(s.wallpaper.dim / 100),
    '--sw-header': retro ? (dark ? 'linear-gradient(#365980, #254566)' : 'linear-gradient(#6ea5ed 0%, #2c70d0 25%, #1850a7 90%, #3574c9)') : pane,
    '--sw-header-ink': retro ? '#fff' : 'var(--sw-ink)',
    '--sw-control-fill': retro ? (dark ? 'linear-gradient(#383c40,#292b30)' : 'linear-gradient(#fffef6,#e5e1cd)') : pixel ? solid : pane,
  }
}

function cssDeclarations(variables) { return Object.entries(variables).map(([name, value]) => `${name}:${value}`).join(';') }

export function skinTokens(input) {
  const s = validateSkin(input)
  // Background-only mode must not recolor labels, adjust native radii, or
  // replace a theme selected in the host. Glass uses our local --sw-* variables.
  if (s.template === 'native') return {}
  const light = skinVariables(s)
  const dark = skinVariables(s, true)
  const tokens = {}
  const put = (name, l, d = l) => { tokens[name] = { light: l, dark: d } }
  for (const [name, value] of Object.entries({
    '--dsw-radius-xs': Math.min(s.radius, 4), '--dsw-radius-sm': Math.min(s.radius, 8),
    '--dsw-radius-md': Math.min(s.radius, 12), '--dsw-radius-lg': Math.min(s.radius, 16),
    '--dsw-radius-xl': s.radius, '--dsw-radius-panel': s.radius,
  })) put(name, `${value}px`)
  put('--dsw-alias-bg-base', light['--sw-base'], dark['--sw-base'])
  for (const name of ['--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3', '--dsw-specific-input-major', '--dsw-specific-menu']) put(name, light['--sw-solid'], dark['--sw-solid'])
  put('--dsw-specific-sidebar-fill', light['--sw-pane'], dark['--sw-pane'])
  put('--dsw-alias-label-primary', light['--sw-ink'], dark['--sw-ink'])
  put('--dsw-alias-label-secondary', light['--sw-muted'], dark['--sw-muted'])
  put('--dsw-alias-label-tertiary', light['--sw-muted'], dark['--sw-muted'])
  // Deliberately never set brand/accent, font-size, font-family or status tokens.
  return tokens
}

export function skinHostCSS(input) {
  const s = validateSkin(input)
  const light = skinVariables(s)
  const dark = skinVariables(s, true)
  const difference = Object.fromEntries(Object.entries(dark).filter(([key, value]) => value !== light[key]))
  const root = 'html body[data-sw-skin][data-sw-template]'
  const styled = `${root}:not([data-sw-template="native"])`
  return `
${root}{${cssDeclarations(light)};isolation:isolate;background:var(--sw-base)!important}
${styled}{--bt-main:var(--sw-base);--bt-sidebar:var(--sw-pane);--bt-card:var(--sw-solid);
 --bt-ink:var(--sw-ink);--bt-ink-2:var(--sw-muted);--bt-ink-3:var(--sw-muted);
 --bt-line:var(--sw-line);--bt-line-2:var(--sw-line);--bt-bubble:var(--sw-pane);
 --bt-glass-bg:var(--sw-pane);--bt-glass-rim:var(--sw-line);--bt-glass-shadow:var(--sw-shadow)}
${root}[data-ds-dark-theme]{${cssDeclarations(difference)}}
${root}>.sw-wallpaper{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;background:var(--sw-base)}
${root} .sw-wallpaper__image{position:absolute;inset:-28px;background-image:var(--sw-wallpaper);background-size:var(--sw-image-size);background-position:var(--sw-image-position);background-repeat:var(--sw-image-repeat);opacity:var(--sw-image-opacity);filter:blur(var(--sw-image-blur));transform:scale(var(--sw-image-zoom));transform-origin:var(--sw-image-position)}
${root} .sw-wallpaper__shade{position:absolute;inset:0;background:#000;opacity:var(--sw-image-dim)}
/* Paint each shell surface ONCE. Never clear unrelated third-party roots. */
${root} [data-slot="root"]>[class*="_frame"],
${root} [data-slot="root"]>[class*="_frame"]>[class*="_centerCol"]{background:transparent!important}
${root} [data-slot="root"]>[class*="_frame"]::before{background:var(--sw-pane)!important}
${root} [data-slot="root"]>[class*="_frame"]>[class*="_centerCol"]>[class*="_mainPanel"]{background:var(--sw-reading-pane);color:var(--sw-ink)}
/* main -> main.conversation -> ConversationRoot is the real shell hierarchy.
   Retain the direct-main adapter for older hosts; never clear unrelated roots. */
${root} [data-slot="main"]>[class*="_root"]:has(>[data-slot="conversation.header"]),
${root} [data-slot="main.conversation"] [class*="_root"]:has(>[data-slot="conversation.header"]),
${root} .sw-page{background:transparent!important}
/* Blur belongs to a decorative backing, NOT a layout ancestor: fixed native
   titlebar controls and menus must remain anchored to the viewport. */
${root} [data-slot="root"]>[class*="_frame"]>[class*="_sidebarCol"]{background:transparent!important;isolation:isolate}
${styled} [data-slot="root"]>[class*="_frame"]>[class*="_sidebarCol"]{box-shadow:inset calc(-1 * var(--sw-border)) 0 var(--sw-edge)}
${root} [data-slot="root"]>[class*="_frame"]:not([data-sidebar-drawer])>[class*="_sidebarCol"]{position:relative}
${root} [data-slot="root"]>[class*="_frame"]>[class*="_sidebarCol"]::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:var(--sw-pane);backdrop-filter:blur(var(--sw-blur));-webkit-backdrop-filter:blur(var(--sw-blur))}
${root} [data-slot="sidebar"]>[class*="_root"]{background:transparent!important}
${root}:has(.bt-leftcol) [data-slot="root"]>[class*="_frame"]>[class*="_sidebarCol"]::before{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none}
${root} .bt-leftcol{background:var(--sw-pane)!important;backdrop-filter:blur(var(--sw-blur));-webkit-backdrop-filter:blur(var(--sw-blur))}
${styled} .bt-leftcol{box-shadow:inset calc(-1 * var(--sw-border)) 0 var(--sw-edge)}
${root} .bt-leftcol[data-left="drawer"],
${root} [data-sidebar-drawer] [class*="_sidebarCol"]::before{background:var(--sw-solid)!important}
/* Native plugin-manager sticky title shares the reading backing at rest and
   gets a protected glass backing while the list scrolls underneath it. */
${root} [data-global-panel] [data-natural]:has([data-plugin-header-part]):not([data-scrolled])::before{background:transparent!important}
${root} [data-global-panel] [data-natural][data-scrolled]:has([data-plugin-header-part])::before{background:var(--sw-sticky-pane)!important;backdrop-filter:blur(var(--sw-blur));-webkit-backdrop-filter:blur(var(--sw-blur))}
${root} [data-slot="conversation.header"]>header{background:transparent!important}
${root} [data-slot="conversation.header"]>header:has(.bt-head)::before{background:transparent!important}
/* The active conversation composer has its own opaque bottom fade. Keep the
   sticky positioning and controls; share the existing reading backing below. */
${root} [data-slot="main.conversation"] [data-composer-seat][data-conversation-region="composer"]{background:transparent!important}
/* Material applies in every theme, geometry/retro recipes do not apply in
   native mode. Dialog/menu tokens always retain opaque fills. */
${root} :is([data-composer-card],.bt-pill){background:var(--sw-pane)!important;backdrop-filter:blur(var(--sw-blur))!important;-webkit-backdrop-filter:blur(var(--sw-blur))!important}
${root}:not([data-bt-layout="flat"]) .bt-bubble{background:var(--sw-pane);backdrop-filter:blur(var(--sw-blur))}
${styled} [data-slot="sidebar"] :is(button[class*="_panelRow"],button[class*="_newSession"]){border-radius:var(--sw-control-radius);corner-shape:round}
${styled} [data-slot="sidebar"] button[class*="_newSession"]{background:var(--sw-control-fill);color:var(--sw-ink);box-shadow:var(--sw-bevel),inset 0 0 0 var(--sw-border) var(--sw-line)}
${root}[data-sw-template="xp"] [data-slot="sidebar"] button[class*="_panelActive"]{background:var(--sw-header);color:var(--sw-header-ink)}
${root}[data-sw-template="pixel"] [data-slot="sidebar"] button[class*="_panelActive"]{background:var(--sw-control-fill);box-shadow:var(--sw-bevel),2px 2px 0 rgba(0,0,0,.3)}
${styled} :is(.bt-panel,.bt-settings,.bt-set-card){border-radius:var(--sw-radius);background:var(--sw-solid);box-shadow:inset 0 0 0 var(--sw-border) var(--sw-line)}
${styled} :is([data-composer-card],.bt-pill){border-radius:var(--sw-radius)!important;corner-shape:round;border:var(--sw-border) solid var(--sw-edge)!important;box-shadow:var(--sw-bevel),var(--sw-shadow)!important;color:var(--sw-ink)}
${styled} .bt-pill{background:var(--sw-header)!important;color:var(--sw-header-ink)}
${styled}:not([data-bt-layout="flat"]) .bt-bubble{color:var(--sw-ink);border-radius:var(--sw-radius)!important;box-shadow:inset 0 0 0 var(--sw-border) var(--sw-line)}
${styled} .bt-ububble{border-radius:var(--sw-radius)!important}
${styled} :is(.bt-row,.bt-tab,.bt-soft,.bt-input,.bt-select,.bt-settings-item,[data-slot="sidebar.panellist"] button){border-radius:var(--sw-control-radius);corner-shape:round}
${styled} :is(.bt-row[aria-current="page"],.bt-soft,.bt-input,.bt-select){box-shadow:var(--sw-bevel),inset 0 0 0 var(--sw-border) var(--sw-line)}
${root}[data-sw-template="xp"] :is(.bt-soft,.bt-select){background:var(--sw-control-fill);color:var(--sw-ink)}
${root}[data-sw-template="xp"] :is(.bt-row[aria-current="page"],.bt-tab[aria-selected="true"]){background:var(--sw-header);color:var(--sw-header-ink)}
${root}[data-sw-template="xp"] .bt-row[aria-current="page"] .bt-row-preview{color:#ecf3ff}
${root}[data-sw-template="pixel"] :is(.bt-soft,.bt-row[aria-current="page"]){background:var(--sw-control-fill);box-shadow:var(--sw-bevel),2px 2px 0 rgba(0,0,0,.3)}
${root}[data-sw-template="pixel"] [data-composer-card] button[class*="_primary"]{border-radius:var(--sw-control-radius)!important;box-shadow:inset 2px 2px 0 #ffffff40,inset -2px -2px 0 #00000040}
${root}[data-sw-template="xp"] [data-composer-card] button[class*="_primary"]{border-radius:var(--sw-control-radius)!important;box-shadow:inset 1px 1px 0 #ffffff60,inset -1px -1px 0 #00000040}
/* Keep focus rings, disabled states and all navigation/drag geometry. */
${s.motion ? '' : `${root} .sw-wallpaper__image{transition:none}`}
`
}

export function createSkinRenderer(theme, doc = document) {
  // Claim/release only our source to clean up v1's stale-disposer layers.
  theme.overrideTokens(WORKSHOP_ID, {})()
  const style = doc.createElement('style')
  style.dataset.plugin = WORKSHOP_ID
  style.dataset.skinWorkshop = 'applied'
  doc.head.appendChild(style)
  const background = doc.createElement('div')
  background.className = 'sw-wallpaper'
  background.setAttribute('aria-hidden', 'true')
  background.hidden = true
  for (const kind of ['image', 'shade']) {
    const child = doc.createElement('div')
    child.className = `sw-wallpaper__${kind}`
    background.appendChild(child)
  }
  doc.body.prepend(background)
  const attrs = ['data-sw-skin', 'data-sw-template']
  const previous = attrs.map((key) => doc.body.getAttribute(key))
  let releaseTokens = null
  let currentTemplate = null
  let disposed = false
  function restoreAttributes() {
    if (doc.body.getAttribute('data-sw-skin') !== 'workshop') return
    attrs.forEach((key, i) => previous[i] === null ? doc.body.removeAttribute(key) : doc.body.setAttribute(key, previous[i]))
  }
  function paint(input) {
    if (disposed) return
    if (input === null) {
      style.textContent = ''
      background.hidden = true
      restoreAttributes()
      releaseTokens?.()
      releaseTokens = null
      currentTemplate = null
      return
    }
    const skin = validateSkin(input)
    const nextCSS = skinHostCSS(skin)
    // Keep the newest disposer: earlier same-source disposers become stale.
    const oldRelease = releaseTokens
    releaseTokens = theme.overrideTokens(WORKSHOP_ID, skinTokens(skin))
    oldRelease?.()
    style.textContent = nextCSS
    doc.body.setAttribute('data-sw-skin', 'workshop')
    doc.body.setAttribute('data-sw-template', skin.template)
    currentTemplate = skin.template
    background.hidden = false
  }
  function dispose() {
    if (disposed) return
    paint(null)
    disposed = true
    style.remove()
    background.remove()
  }
  return { paint, dispose, get currentTemplate() { return currentTemplate } }
}
