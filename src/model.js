// Portable appearance recipes are data, never CSS or executable code.
export const WORKSHOP_ID = '@local/violet-skin'
export const WORKSHOP_PANEL = 'skin-workshop'
// Keep the physical key so an installed 2.0 library is adopted without data loss.
export const STORAGE_KEY = 'dsh.skin-workshop.library.v1'
export const RECOVERY_KEY = 'dsh.skin-workshop.recovery.v1'
export const FORMAT = 'dsh-skin-workshop'
export const PACK_VERSION = 2
export const LIBRARY_VERSION = 2
export const MAX_IMAGE_CHARS = 720_000
export const MAX_PACK_BYTES = 1_100_000
export const MAX_STORAGE_CHARS = 2_100_000
export const MAX_SKINS = 16
export const PREVIEW_SECONDS = 60

export const TEMPLATE_INFO = {
  native: { title: '原生风格', tag: 'NATIVE', description: '保留宿主配色与控件形状，只调整背景和材质。' },
  // Retain the old glass id for existing recipes; glass itself is a material.
  glass: { title: '现代简约', tag: 'MODERN', description: '柔和圆角、轻量描边，背景和材质自由搭配。' },
  xp: { title: 'XP 复古', tag: 'RETRO', description: '蓝色窗框、米色底色与立体控件。' },
  pixel: { title: '像素方块', tag: 'PIXEL', description: '方正控件、像素描边与块状阴影。' },
}
export const BACKGROUND_INFO = { mist: '雾光渐变', meadow: '晴空草坡', blocks: '方块山谷' }
export const COMBINATION_INFO = {
  wallpaper: { title: '只换背景', template: 'native', tag: 'WALLPAPER', description: '原生主题 + 壁纸 + 轻磨砂，不改控件形状。' },
  glass: { title: '简约玻璃', template: 'glass', tag: 'GLASS', description: '现代主题 + 雾光背景 + 玻璃材质。' },
  xp: { title: 'XP 复古', template: 'xp', tag: 'RETRO', description: '复古主题 + 晴空草坡 + 立体控件。' },
  pixel: { title: '像素方块', template: 'pixel', tag: 'PIXEL', description: '像素主题 + 方块山谷 + 方正控件。' },
}

export function cloneSkin(value) { return JSON.parse(JSON.stringify(value)) }
export function sameSkin(a, b) { return JSON.stringify(a) === JSON.stringify(b) }

export function makeTemplate(template = 'glass') {
  if (!Object.hasOwn(TEMPLATE_INFO, template)) throw new Error('不支持这个主题风格。')
  const native = template === 'native'
  const modern = template === 'glass'
  return {
    name: TEMPLATE_INFO[template].title,
    template,
    material: modern ? 'glass' : 'solid',
    opacity: modern ? 72 : 100,
    blur: modern ? 16 : 0,
    readingOpacity: native ? 100 : modern ? 55 : 80,
    radius: native ? 12 : modern ? 18 : template === 'xp' ? 6 : 0,
    border: template === 'pixel' ? 2 : 1,
    shadow: template === 'pixel' ? 12 : 20,
    motion: true,
    wallpaper: {
      kind: native ? 'none' : 'preset',
      preset: native || modern ? 'mist' : template === 'xp' ? 'meadow' : 'blocks',
      image: '', fit: 'cover', x: 50, y: 50, zoom: 100,
      opacity: 100, dim: native ? 0 : modern ? 12 : 8, blur: 0,
    },
  }
}

export function makeCombination(id = 'wallpaper') {
  if (!Object.hasOwn(COMBINATION_INFO, id)) throw new Error('不支持这个快速搭配。')
  const info = COMBINATION_INFO[id]
  const skin = makeTemplate(info.template)
  skin.name = info.title
  if (id === 'wallpaper' || id === 'glass') {
    skin.material = 'glass'
    // The point of these two starters is a visible wallpaper: keep both the
    // floating panels and the reading backing thin enough to see it.
    skin.opacity = 55
    skin.blur = 14
    skin.readingOpacity = 45
    skin.wallpaper.kind = 'preset'
    skin.wallpaper.dim = 0
  }
  return skin
}

// A theme change affects only its color/shape recipe. It must not replace the
// user's wallpaper, material, reading protection, name or animation preference.
export function changeTemplate(input, template) {
  const previous = validateSkin(input)
  const defaults = makeTemplate(template)
  if (previous.template === template) return previous
  return validateSkin({ ...previous, template, radius: defaults.radius, border: defaults.border, shadow: defaults.shadow })
}

function checkObject(value, fields, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}格式不正确。`)
  for (const key of Object.keys(value)) {
    if (!fields.includes(key)) throw new Error(`${label}包含不支持的字段「${key.slice(0, 50)}」。不支持脚本、CSS 或外部资源。`)
  }
}
function checkChoice(value, choices, label) {
  if (!choices.includes(value)) throw new Error(`${label}不在支持的选项中。`)
  return value
}
function checkNumber(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label}必须在 ${min}–${max} 之间。`)
  return Math.round(value * 10) / 10
}

export function validateRaster(data) {
  if (typeof data !== 'string' || data.length > MAX_IMAGE_CHARS) throw new Error('壁纸太大，请先通过图片上传重新压缩。')
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data)
  if (!match || match[2].length % 4 !== 0) throw new Error('壁纸只接受内嵌 PNG、JPEG 或 WebP；不支持网址、SVG 和脚本。')
  let bytes
  try { bytes = atob(match[2].slice(0, 48)) } catch { throw new Error('壁纸的图片编码无效。') }
  const signature = match[1] === 'png'
    ? bytes.startsWith('\x89PNG\r\n\x1a\n')
    : match[1] === 'jpeg' ? bytes.startsWith('\xff\xd8\xff')
      : bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP'
  if (!signature) throw new Error('壁纸内容与声明的图片类型不一致。')
  return data
}

function readSkin(input, legacy = false) {
  const skinFields = ['name', 'template', 'material', 'opacity', 'blur', 'radius', 'border', 'shadow', 'motion', 'wallpaper']
  const wallpaperFields = ['kind', 'preset', 'image', 'fit', 'x', 'y', 'zoom', 'dim', 'blur']
  if (!legacy) { skinFields.push('readingOpacity'); wallpaperFields.push('opacity') }
  checkObject(input, skinFields, '皮肤')
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 40 || /[\x00-\x1f\x7f]/.test(input.name)) {
    throw new Error('请填写 1–40 个字符的皮肤名称。')
  }
  checkObject(input.wallpaper, wallpaperFields, '壁纸')
  const w = input.wallpaper
  const kind = checkChoice(w.kind, ['preset', 'image', 'none'], '背景类型')
  if (typeof w.image !== 'string') throw new Error('壁纸数据格式不正确。')
  if (kind !== 'image' && w.image !== '') throw new Error('非图片背景不应包含隐藏图片数据。')
  if (typeof input.motion !== 'boolean') throw new Error('动效开关格式不正确。')
  const material = checkChoice(input.material, ['glass', 'solid'], '面板材质')
  const opacity = checkNumber(input.opacity, legacy ? 65 : 0, 100, '面板不透明度')
  return {
    name: input.name.trim(),
    template: checkChoice(input.template, legacy ? ['glass', 'xp', 'pixel'] : Object.keys(TEMPLATE_INFO), '主题风格'),
    material,
    opacity,
    blur: checkNumber(input.blur, 0, 28, '磨砂强度'),
    // Preserve 2.0.1's effective reading backing exactly when adopting v1 data.
    readingOpacity: legacy ? (material === 'glass' ? Math.max(80, opacity) : 80) : checkNumber(input.readingOpacity, 0, 100, '正文阅读遮罩'),
    radius: checkNumber(input.radius, 0, 28, '圆角'),
    border: checkNumber(input.border, 0, 3, '描边'),
    shadow: checkNumber(input.shadow, 0, 36, '阴影'),
    motion: input.motion,
    wallpaper: {
      kind,
      preset: checkChoice(w.preset, Object.keys(BACKGROUND_INFO), '内置背景'),
      image: kind === 'image' ? validateRaster(w.image) : '',
      fit: checkChoice(w.fit, ['cover', 'contain', 'tile'], '图片填充方式'),
      x: checkNumber(w.x, 0, 100, '背景横向位置'),
      y: checkNumber(w.y, 0, 100, '背景纵向位置'),
      zoom: checkNumber(w.zoom, 100, 180, '背景缩放'),
      opacity: legacy ? 100 : checkNumber(w.opacity, 0, 100, '壁纸不透明度'),
      dim: checkNumber(w.dim, 0, 65, '背景压暗'),
      blur: checkNumber(w.blur, 0, 24, '背景模糊'),
    },
  }
}

export function validateSkin(input) { return readSkin(input) }
export function exportSkinPack(skin) {
  return JSON.stringify({ format: FORMAT, version: PACK_VERSION, skin: validateSkin(skin) }, null, 2)
}
export function parseSkinPack(text) {
  if (typeof text !== 'string' || text.length > MAX_PACK_BYTES) throw new Error('皮肤包太大，最多接收 1.1 MB。')
  let data
  try { data = JSON.parse(text) } catch { throw new Error('无法读取这个 JSON 皮肤包，请选择导出的 .dsh-skin.json 文件。') }
  checkObject(data, ['format', 'version', 'skin'], '皮肤包')
  if (data.format !== FORMAT || ![1, PACK_VERSION].includes(data.version)) throw new Error('不是支持的皮肤工坊 v1 / v2 皮肤包；第三方插件的主题包暂不兼容。')
  return readSkin(data.skin, data.version === 1)
}

export function emptyLibrary() { return { version: LIBRARY_VERSION, skins: [], active: null } }
export function validateLibrary(data) {
  checkObject(data, ['version', 'skins', 'active'], '本机皮肤库')
  if (![1, LIBRARY_VERSION].includes(data.version) || !Array.isArray(data.skins) || data.skins.length > MAX_SKINS) throw new Error('本机皮肤库版本或数量无效。')
  const legacy = data.version === 1
  const ids = new Set()
  const skins = data.skins.map((entry) => {
    checkObject(entry, ['id', 'skin'], '皮肤记录')
    if (typeof entry.id !== 'string' || !/^skin-[a-zA-Z0-9-]{1,80}$/.test(entry.id) || ids.has(entry.id)) throw new Error('皮肤编号无效或重复。')
    ids.add(entry.id)
    return { id: entry.id, skin: readSkin(entry.skin, legacy) }
  })
  let active = null
  if (data.active !== null) {
    checkObject(data.active, ['id', 'skin'], '已应用皮肤')
    if (!ids.has(data.active.id)) throw new Error('已应用皮肤不在皮肤库中。')
    // Saving an edited recipe must not silently replace the applied snapshot.
    active = { id: data.active.id, skin: readSkin(data.active.skin, legacy) }
  }
  return { version: LIBRARY_VERSION, skins, active }
}
export function newSkinId() {
  return 'skin-' + (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)
}
