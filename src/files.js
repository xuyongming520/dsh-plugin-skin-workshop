import { MAX_IMAGE_CHARS, MAX_PACK_BYTES, validateRaster, parseSkinPack, exportSkinPack } from './model.js'

function loadRasterImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 32_000_000 || Math.max(image.naturalWidth, image.naturalHeight) > 12_000) {
        reject(new Error('图片尺寸过大，请先缩小到 3200 万像素以内。'))
      } else resolve(image)
    }
    image.onerror = () => reject(new Error('图片损坏或无法解码，请换一张 PNG、JPEG 或 WebP。'))
    image.src = url
  })
}

export async function readWallpaperFile(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('请选择 PNG、JPEG 或 WebP 图片；不接收 SVG 或 GIF。')
  if (file.size > 10 * 1024 * 1024) throw new Error('原图不能超过 10 MB，请先压缩后再上传。')
  const objectURL = URL.createObjectURL(file)
  try {
    const image = await loadRasterImage(objectURL)
    const canvas = document.createElement('canvas')
    let scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法处理图片，请换个浏览器再试。')
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const result = canvas.toDataURL('image/webp', Math.max(.55, .86 - attempt * .06))
      if (result.length <= MAX_IMAGE_CHARS) return validateRaster(result)
      scale *= .8
    }
    throw new Error('这张图片压缩后仍太大，请先降低分辨率再上传。')
  } finally { URL.revokeObjectURL(objectURL) }
}

export async function readSkinFile(file) {
  if (!file || file.size > MAX_PACK_BYTES) throw new Error('请选择不超过 1.1 MB 的 .dsh-skin.json 皮肤包。')
  const skin = parseSkinPack(await file.text())
  if (skin.wallpaper.kind === 'image') await loadRasterImage(skin.wallpaper.image)
  return skin
}

export function downloadSkin(skin) {
  const text = exportSkinPack(skin)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const filename = skin.name.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/^\.+/, '').slice(0, 48) || 'my-skin'
  anchor.href = url
  anchor.download = `${filename}.dsh-skin.json`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser's download handler a chance to consume the blob first.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
