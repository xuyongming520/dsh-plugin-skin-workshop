import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { makeTemplate, makeCombination, changeTemplate, validateSkin, exportSkinPack, parseSkinPack, validateRaster, validateLibrary, emptyLibrary, MAX_IMAGE_CHARS, MAX_SKINS, FORMAT, PACK_VERSION, LIBRARY_VERSION } from '../src/model.js'
import { skinTokens, skinVariables, skinHostCSS } from '../src/renderer.js'
import { WORKSHOP_CSS } from '../src/ui-style.js'

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6bkAAAAASUVORK5CYII='
const legacyPack = JSON.parse(await readFile(new URL('../examples/glass.dsh-skin.json', import.meta.url), 'utf8'))

test('four theme styles and four complete combinations validate and round trip', async () => {
  for (const id of ['native', 'glass', 'xp', 'pixel']) {
    const skin = makeTemplate(id)
    assert.deepEqual(validateSkin(skin), skin)
    assert.deepEqual(parseSkinPack(exportSkinPack(skin)), skin)
  }
  for (const id of ['wallpaper', 'glass', 'xp', 'pixel']) {
    const skin = makeCombination(id)
    assert.deepEqual(parseSkinPack(exportSkinPack(skin)), skin)
  }
  assert.equal(makeCombination().template, 'native')
  assert.equal(makeCombination().material, 'glass')
  const example = parseSkinPack(await readFile(new URL('../examples/background-only.dsh-skin.json', import.meta.url), 'utf8'))
  assert.deepEqual(example, makeCombination())
})
test('theme switching preserves every background, material and reading choice', () => {
  const original = makeCombination('glass')
  original.name = '自己的搭配'
  original.opacity = 35
  original.blur = 7
  original.readingOpacity = 90
  original.wallpaper = { ...original.wallpaper, kind: 'image', image: pixel, opacity: 55, x: 12, dim: 30 }
  for (const id of ['native', 'glass', 'xp', 'pixel']) {
    const changed = changeTemplate(original, id)
    for (const key of ['name', 'material', 'opacity', 'blur', 'readingOpacity', 'motion', 'wallpaper']) assert.deepEqual(changed[key], original[key])
    assert.equal(changed.template, id)
    assert.equal(changed.radius, id === 'glass' ? original.radius : makeTemplate(id).radius)
  }
  assert.deepEqual(changeTemplate(original, original.template), original)
  assert.equal(original.template, 'glass')
})
test('a style change alone never swaps a built-in background or removes a no-background choice', () => {
  for (const kind of ['preset', 'none']) {
    const skin = makeCombination('xp')
    skin.wallpaper.kind = kind
    skin.wallpaper.preset = 'meadow'
    assert.deepEqual(changeTemplate(skin, 'pixel').wallpaper, skin.wallpaper)
  }
})
test('background, floating panel and reading opacity have independent rendering variables', () => {
  const skin = makeCombination('glass')
  const base = skinVariables(skin)
  const panel = skinVariables({ ...skin, opacity: 20 })
  const reading = skinVariables({ ...skin, readingOpacity: 40 })
  const image = skinVariables({ ...skin, wallpaper: { ...skin.wallpaper, opacity: 0 } })
  assert.equal(panel['--sw-reading-pane'], base['--sw-reading-pane'])
  assert.equal(panel['--sw-image-opacity'], base['--sw-image-opacity'])
  assert.notEqual(panel['--sw-pane'], base['--sw-pane'])
  assert.equal(reading['--sw-pane'], base['--sw-pane'])
  assert.equal(reading['--sw-image-opacity'], base['--sw-image-opacity'])
  assert.notEqual(reading['--sw-reading-pane'], base['--sw-reading-pane'])
  assert.equal(image['--sw-pane'], base['--sw-pane'])
  assert.equal(image['--sw-reading-pane'], base['--sw-reading-pane'])
  assert.equal(image['--sw-image-opacity'], '0')
})
test('solid panels do not force the independent reading mask to be opaque', () => {
  const skin = { ...makeCombination('xp'), readingOpacity: 45 }
  assert.match(skinVariables(skin)['--sw-pane'], /100%, transparent/)
  assert.match(skinVariables(skin)['--sw-reading-pane'], /45%, transparent/)
  assert.equal(skinVariables(skin)['--sw-blur'], '0px')
})
test('native style applies no theme tokens and reads the running host palette', () => {
  const skin = makeCombination()
  assert.deepEqual(skinTokens(skin), {})
  assert.match(skinVariables(skin)['--sw-solid'], /var\(--dsw-alias-bg-layer-1,/)
  assert.match(skinVariables(skin)['--sw-ink'], /var\(--dsw-alias-label-primary,/)
  assert.doesNotMatch(skinVariables(skin, false, true)['--sw-ink'], /var\(/)
  assert.notEqual(skinVariables(skin, false, true)['--sw-ink'], skinVariables(skin, true, true)['--sw-ink'])
  const css = skinHostCSS(skin)
  assert.match(css, /:not\(\[data-sw-template="native"\]\) \[data-slot="sidebar"\]/)
  assert.match(css, /:not\(\[data-sw-template="native"\]\) :is\(\[data-composer-card\],\.bt-pill\)\{border-radius/)
})
test('round trip includes actual wallpaper pixels, not a machine-local path', () => {
  const skin = makeTemplate()
  skin.wallpaper = { ...skin.wallpaper, kind: 'image', image: pixel }
  assert.equal(parseSkinPack(exportSkinPack(skin)).wallpaper.image, pixel)
})
test('all numeric controls reject out-of-range, nonfinite, null and string values', () => {
  for (const [key, value] of [['radius', -1], ['border', 4], ['blur', 29], ['opacity', -1], ['opacity', 101], ['shadow', Infinity], ['radius', '5'], ['readingOpacity', -1], ['readingOpacity', 101], ['readingOpacity', null]]) {
    assert.throws(() => validateSkin({ ...makeTemplate(), [key]: value }))
  }
  for (const [key, value] of [['x', -1], ['y', 101], ['zoom', 181], ['dim', 66], ['blur', NaN], ['opacity', -1], ['opacity', '80']]) {
    const skin = makeTemplate(); skin.wallpaper[key] = value
    assert.throws(() => validateSkin(skin))
  }
  for (const n of [0, 35, 65, 100]) assert.equal(validateSkin({ ...makeTemplate(), opacity: n, readingOpacity: n }).opacity, n)
})
test('v2 fields are required, and future versions and executable/unknown fields stay rejected', () => {
  const base = JSON.parse(exportSkinPack(makeTemplate()))
  const missingReading = structuredClone(base); delete missingReading.skin.readingOpacity
  const missingOpacity = structuredClone(base); delete missingOpacity.skin.wallpaper.opacity
  for (const data of [
    { ...base, hooks: 'fetch("https://example.invalid")' },
    { ...base, version: 3 }, { ...base, format: 'other-plugin' },
    { ...base, skin: { ...base.skin, css: 'body{display:none}' } },
    { ...base, skin: { ...base.skin, material: 'url(test)' } },
    { ...base, skin: { ...base.skin, template: '__proto__' } },
    { ...base, skin: null }, [], null, missingReading, missingOpacity,
  ]) assert.throws(() => parseSkinPack(JSON.stringify(data)))
  assert.throws(() => parseSkinPack('{"format":"dsh-skin-workshop","version":2,"__proto__":{},"skin":{}}'))
  assert.throws(() => parseSkinPack('{broken'))
})
test('existing v1 examples import into v2 without changing the effective appearance', async () => {
  for (const id of ['glass', 'xp', 'pixel']) {
    const raw = JSON.parse(await readFile(new URL(`../examples/${id}.dsh-skin.json`, import.meta.url), 'utf8'))
    assert.equal(raw.version, 1)
    const skin = parseSkinPack(JSON.stringify(raw))
    assert.equal(skin.wallpaper.opacity, 100)
    assert.equal(skin.readingOpacity, raw.skin.material === 'glass' ? Math.max(80, raw.skin.opacity) : 80)
    const { readingOpacity, wallpaper, ...rest } = skin
    const { wallpaper: oldWallpaper, ...oldRest } = raw.skin
    assert.deepEqual(rest, oldRest)
    const { opacity, ...oldCompatibleWallpaper } = wallpaper
    assert.deepEqual(oldCompatibleWallpaper, oldWallpaper)
    assert.equal(JSON.parse(exportSkinPack(skin)).version, PACK_VERSION)
  }
})
test('v1 adoption preserves its implicit reading floor and rejects disguised v2 fields', () => {
  for (const opacity of [65, 92, 100]) {
    const raw = structuredClone(legacyPack)
    raw.skin.opacity = opacity
    assert.equal(parseSkinPack(JSON.stringify(raw)).readingOpacity, Math.max(80, opacity))
  }
  for (const change of [
    { ...legacyPack.skin, readingOpacity: 20 },
    { ...legacyPack.skin, template: 'native' },
    { ...legacyPack.skin, wallpaper: { ...legacyPack.skin.wallpaper, opacity: 20 } },
  ]) assert.throws(() => parseSkinPack(JSON.stringify({ ...legacyPack, skin: change })))
})
test('v1 library adoption retains ids and distinct saved/applied snapshots without mutating input', () => {
  const saved = structuredClone(legacyPack.skin)
  saved.opacity = 65
  const data = { version: 1, skins: [{ id: 'skin-1', skin: saved }], active: { id: 'skin-1', skin: legacyPack.skin } }
  const before = JSON.stringify(data)
  const current = validateLibrary(data)
  assert.equal(current.version, LIBRARY_VERSION)
  assert.equal(current.skins[0].id, 'skin-1')
  assert.equal(current.skins[0].skin.readingOpacity, 80)
  assert.equal(current.active.skin.readingOpacity, 84)
  assert.equal(JSON.stringify(data), before)
})
test('rejects URLs, SVG, HTML, MIME mismatches, invalid base64 and excessive raster data', () => {
  for (const data of ['https://example.invalid/wall.jpg', 'javascript:alert(1)', 'file:///tmp/pic.png', 'data:image/svg+xml;base64,PHN2Zy8+', 'data:text/html;base64,PHNjcmlwdD4=', 'data:image/png;base64,SGVsbG8=', 'data:image/png;base64,%%%=', 'data:image/png;base64,' + 'A'.repeat(MAX_IMAGE_CHARS)]) assert.throws(() => validateRaster(data))
  assert.equal(validateRaster(pixel), pixel)
})
test('no hidden image payloads, invalid names or wrong motion value', () => {
  const skin = makeTemplate()
  assert.throws(() => validateSkin({ ...skin, name: '' }))
  assert.throws(() => validateSkin({ ...skin, name: 'x'.repeat(41) }))
  assert.throws(() => validateSkin({ ...skin, name: 'bad\nname' }))
  assert.throws(() => validateSkin({ ...skin, motion: 'false' }))
  assert.throws(() => validateSkin({ ...skin, wallpaper: { ...skin.wallpaper, image: pixel } }))
})
test('v2 library validates distinct ids, limits and a separate applied snapshot', () => {
  const skin = makeTemplate()
  const data = { version: LIBRARY_VERSION, skins: [{ id: 'skin-1', skin }], active: { id: 'skin-1', skin: makeTemplate('xp') } }
  assert.deepEqual(validateLibrary(data), data)
  assert.throws(() => validateLibrary({ ...data, version: 3 }))
  assert.throws(() => validateLibrary({ ...data, skins: [...data.skins, ...data.skins] }))
  assert.throws(() => validateLibrary({ ...data, active: { ...data.active, id: 'missing' } }))
  assert.throws(() => validateLibrary({ ...data, skins: Array.from({ length: MAX_SKINS + 1 }, (_, i) => ({ id: `skin-${i}`, skin })) }))
  assert.deepEqual(validateLibrary(emptyLibrary()), emptyLibrary())
})
test('rendering preserves accent, typography, status tokens, layout and dark/light pairing', () => {
  for (const id of ['native', 'glass', 'xp', 'pixel']) {
    const skin = makeTemplate(id)
    for (const [name, value] of Object.entries(skinTokens(skin))) {
      assert.equal(typeof value.light, 'string')
      assert.equal(typeof value.dark, 'string')
      assert.doesNotMatch(name, /brand|accent|font|state-/)
    }
    const css = skinHostCSS(skin)
    assert.doesNotMatch(css, /--bt-accent\s*:|display\s*:\s*none|grid-template|position\s*:\s*fixed[^}]*\.bt-/)
    assert.ok(css.includes('[data-sw-skin]'))
    assert.ok(css.includes('[data-ds-dark-theme]'))
    assert.notEqual(skinVariables(skin)['--sw-solid'], skinVariables(skin, true)['--sw-solid'])
  }
})
test('reading mask follows light/dark colors while zero and full masks remain valid', () => {
  for (const readingOpacity of [0, 80, 100]) {
    const skin = { ...makeTemplate(), readingOpacity }
    assert.match(skinVariables(skin)['--sw-reading-pane'], new RegExp(`${readingOpacity}%, transparent`))
    assert.notEqual(skinVariables(skin)['--sw-reading-pane'], skinVariables(skin, true)['--sw-reading-pane'])
  }
})
test('removing wallpaper suppresses its dim layer instead of darkening an empty background', () => {
  const skin = makeTemplate()
  skin.wallpaper.kind = 'none'
  skin.wallpaper.dim = 65
  assert.equal(skinVariables(skin)['--sw-wallpaper'], 'none')
  assert.equal(skinVariables(skin)['--sw-image-dim'], '0')
})
test('native and preview action buttons keep the correct paired foreground', () => {
  assert.match(WORKSHOP_CSS, /--sw-ui-accent-ink:var\(--bt-accent-ink,var\(--dsw-alias-label-primary-foreground,#fff\)\)/)
  assert.match(WORKSHOP_CSS, /\.sw-btn--primary\{[^}]*color:var\(--sw-ui-accent-ink\)/)
  assert.match(WORKSHOP_CSS, /\.sw-livebar \.sw-livebar__keep\{[^}]*label-primary-foreground/)
  assert.doesNotMatch(WORKSHOP_CSS, /var\(--dsw-alias-brand-primary-invert[,)]|\.sw-livebar button:last-child/)
})
test('native adapters target shell slots, not arbitrary third-party root components', () => {
  const css = skinHostCSS(makeTemplate())
  assert.match(css, /\[data-slot="sidebar"\]>\[class\*="_root"\]/)
  assert.match(css, /\[data-plugin-header-part\]/)
  assert.match(css, /\[data-slot="main"\]>\[class\*="_root"\]:has\(>\[data-slot="conversation.header"\]\)/)
  assert.match(css, /\[data-slot="main.conversation"\] \[class\*="_root"\]:has\(>\[data-slot="conversation.header"\]\)/)
  assert.doesNotMatch(css, /\[data-slot="main"\]>\[class\*="_root"\]\s*\{/)
})
test('names are text only and never interpolated into host CSS', () => {
  const skin = makeTemplate()
  skin.name = '\";}body{display:none}/*'
  assert.doesNotMatch(skinHostCSS(skin), /body\{display:none/)
})
test('the richer format is explicitly v2; unknown styles and combinations are rejected', () => {
  const pack = JSON.parse(exportSkinPack(makeTemplate()))
  assert.equal(pack.format, FORMAT)
  assert.equal(pack.version, PACK_VERSION)
  assert.throws(() => makeTemplate('unknown'))
  assert.throws(() => makeCombination('unknown'))
})
