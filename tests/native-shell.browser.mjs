// Real React + Chromium, native shell DOM and native palette/header styles.
// No authenticated browser, real user data, Host API or replacement web server.
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { makeTemplate, exportSkinPack, STORAGE_KEY } from '../src/model.js'
import { NATIVE_FALLBACK_CSS, NATIVE_FIXTURE_EXTRAS, NATIVE_MOUNT } from './native-fixture.mjs'

const { chromium } = await import(process.env.DSH_TEST_PLAYWRIGHT || 'playwright-core')
const vendor = process.env.DSH_TEST_REACT_DIR
if (!vendor) throw new Error('Set DSH_TEST_REACT_DIR to the local React / ReactDOM / Scheduler test copies.')
const source = await readFile(process.env.DSH_TEST_CLIENT_BUNDLE || new URL('../client.js', import.meta.url), 'utf8')
const legacyXP = await readFile(new URL('../examples/xp.dsh-skin.json', import.meta.url), 'utf8')
const legacyGlass = await readFile(new URL('../examples/glass.dsh-skin.json', import.meta.url), 'utf8')
const modules = await Promise.all(Object.entries({ react: 'react', 'react-dom': 'react-dom', 'react-dom/client': 'react-dom-client', scheduler: 'scheduler' }).map(async ([id, file]) => `${JSON.stringify(id)}:function(require,module,exports){\n${await readFile(join(vendor, file + '.js'), 'utf8')}\n}`))
let nativeCSS = NATIVE_FALLBACK_CSS
if (process.env.DSH_TEST_HOST_REFERENCE_DIR) {
  nativeCSS = (await Promise.all(['theme', 'layout', 'sidebar', 'plugin-manager', 'conversation'].map((name) => readFile(join(process.env.DSH_TEST_HOST_REFERENCE_DIR, `dsh-client-ui-${name}`, 'styles-readable.css'), 'utf8')))).join('\n')
  console.log('Using complete native CSS decoded from installed DSH 0.2.2-rc.1, not the fallback fixture.')
} else console.log('Using representative native-shell CSS fixture. Set DSH_TEST_HOST_REFERENCE_DIR for complete installed styles.')
const bootstrap = `
const modules={${modules.join(',\n')}};const cache={};
function require(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Unknown module '+id);const m=cache[id]={exports:{}};modules[id](require,m,m.exports);return m.exports}
const React=require('react'),h=React.createElement;const registrations=new Map(),cleanups=[],layers=new Map();let seq=0,keys=new Set(),navigate=()=>{};
function applyTokens(){const values={};for(const layer of layers.values())for(const [key,pair]of Object.entries(layer.tokens))values[key]=pair[document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'];for(const key of keys)if(!(key in values))document.body.style.removeProperty(key);for(const [key,value]of Object.entries(values))document.body.style.setProperty(key,value);keys=new Set(Object.keys(values))}
window.__setDark=(dark)=>{document.body.toggleAttribute('data-ds-dark-theme',dark);document.documentElement.style.colorScheme=dark?'dark':'light';applyTokens()};window.__themeLayers=layers;
window.__ModuleLoader__={load(def){const plugin=def.factory(require);plugin.apply({
 effect(fn){const stop=fn();if(typeof stop==='function')cleanups.push(stop)},
 theme:{overrideTokens(source,tokens){const layer={seq:seq++,tokens};layers.set(source,layer);applyTokens();return()=>{if(layers.get(source)===layer){layers.delete(source);applyTokens()}}}},
 layout:{selectPanel:(id)=>navigate(id)},
 slots:{inject:(_name,fn)=>{const stop=fn();if(typeof stop==='function')cleanups.push(stop)},register:(def,component)=>{const key=def.name+':'+(def.key||def.id||'');registrations.set(key,{def,component});return()=>registrations.delete(key)}}
})}};
window.__disposePlugin=()=>{for(const stop of [...cleanups].reverse())stop()};
`
const script = `${bootstrap}\n${source}\n${NATIVE_MOUNT}`.replace(/<\/script/gi, '<\\/script')
const html = `<!doctype html><html data-platform="darwin"><head><meta charset="utf-8"><style>${nativeCSS}\n${NATIVE_FIXTURE_EXTRAS}</style></head><body data-unrelated="preserve"><div id="root"></div><script>${script}</script></body></html>`
const browser = await chromium.launch({ headless: true })
const artifacts = process.env.DSH_TEST_ARTIFACT_DIR
if (artifacts) await mkdir(artifacts, { recursive: true })
const openTab = async (name) => { await page.getByRole('tab', { name: new RegExp('^' + name) }).click() }
const openAdvanced = async () => { const s = page.locator('.sw-advanced>summary'); if (await s.count() && !(await page.locator('.sw-advanced').evaluate((el) => el.open))) await s.click() }
const failures = [], errors = [], external = [], observations = []
let passed = 0, page
const check = (label, okay, detail = '') => {
  if (!okay) { failures.push(label); console.error(`FAIL: ${label}`, detail); return }
  console.log(`PASS ${++passed}: ${label}`)
}
// CSS Color 4 color-mix() values are normalized through the browser's canvas,
// so these checks measure actual painted colors rather than string spellings.
async function actionContrast(locator) {
  return locator.evaluate(async (el) => {
    // Theme switches can animate the button background while its text changes
    // immediately. Measure the settled color, not an intermediate 160ms frame.
    void getComputedStyle(el).backgroundColor
    await Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {})))
    const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');
    const rgb=(value)=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]};
    const lum=(color)=>color.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const s=getComputedStyle(el),fg=rgb(s.color),bg=rgb(s.backgroundColor),a=lum(fg),b=lum(bg);
    return { fg, bg, ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05) };
  })
}
async function pixels(buffer, points) {
  return page.evaluate(async ({ data, points }) => {
    const image=new Image();image.src=data;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    return points.map(([x,y])=>[...ctx.getImageData(x,y,1,1).data].slice(0,3));
  }, { data:'data:image/png;base64,'+buffer.toString('base64'), points })
}
function colorContrast(a,b) {
  const lum=(rgb)=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)
  const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)
}
try {
  const context = await browser.newContext({ viewport:{ width:1360,height:1000 },acceptDownloads:true })
  context.setDefaultTimeout(12000)
  await context.route('**/*',(route)=>{
    if(new URL(route.request().url()).hostname!=='skin-native.test'){external.push(route.request().url());return route.abort()}
    return route.fulfill({status:200,contentType:'text/html',body:html})
  })
  page=await context.newPage();page.on('pageerror',(error)=>errors.push(error.message));page.on('dialog',(dialog)=>dialog.accept())
  await page.goto('http://skin-native.test/')
  await page.getByRole('heading',{name:'皮肤工坊'}).waitFor()
  check('Native fixture has no DS Bot accent variables (exercises native fallbacks)',await page.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--bt-accent').trim()===''))
  const beforeNativeAccent=await page.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--dsw-alias-state-business-primary'))
  const nativePalette=await page.evaluate(()=>Object.fromEntries(['--dsw-alias-bg-base','--dsw-alias-bg-layer-1','--dsw-alias-label-primary','--dsw-alias-label-secondary','--dsw-radius-md'].map(key=>[key,getComputedStyle(document.body).getPropertyValue(key).trim()])))
  const nativeNewRadius=await page.locator('.kB3qhq_newSession').evaluate(el=>getComputedStyle(el).borderRadius)
  await page.getByRole('button',{name:'原生示例聊天',exact:true}).click()
  const nativeComposer=await page.locator('[data-composer-card]').evaluate(el=>({radius:getComputedStyle(el).borderRadius,border:getComputedStyle(el).borderWidth,shadow:getComputedStyle(el).boxShadow,buttonRadius:getComputedStyle(el.querySelector('button')).borderRadius}))
  await page.getByRole('button',{name:'皮肤工坊',exact:true}).click()
  for(const dark of [false,true]){
    await page.evaluate(dark=>window.__setDark(dark),dark)
    const primary=page.getByRole('button',{name:'保存并应用',exact:true}),colors=await actionContrast(primary)
    observations.push({case:dark?'native-primary-dark':'native-primary-light',...colors})
    check(`Native ${dark?'dark':'light'} Save-and-apply is not black-on-black/white-on-white`,colors.ratio>=4.5,JSON.stringify(colors))
    await primary.hover();const hover=await actionContrast(primary)
    check(`Native ${dark?'dark':'light'} primary hover retains readable text`,hover.ratio>=4.5,JSON.stringify(hover))
    if(artifacts)await page.screenshot({animations:'disabled',path:join(artifacts,`native-workshop-${dark?'dark':'light'}.png`)})
    await page.mouse.move(1340,980)
  }
  await page.evaluate(()=>window.__setDark(false))

  // Check that adding skin backings cannot turn a layout ancestor into a fixed
  // containing block. This matters for Windows titlebar controls and menus.
  const geometry=[]
  for(const mode of ['darwin','windows','web']){
    await page.evaluate((mode)=>{
      const html=document.documentElement;html.removeAttribute('data-platform');html.removeAttribute('data-windows-titlebar');
      if(mode==='darwin')html.dataset.platform='darwin';
      if(mode==='windows'){html.dataset.platform='win32';html.setAttribute('data-windows-titlebar','');html.style.setProperty('--dsh-windows-titlebar-height','44px')}
    },mode)
    await page.getByRole('button',{name:'原生插件页',exact:true}).click()
    const before=await page.locator('.fixture-fixed-probe').boundingBox()
    const toggleBefore=await page.getByRole('button',{name:'原生折叠侧栏'}).boundingBox()
    await page.getByRole('button',{name:'皮肤工坊',exact:true}).click()
    await page.getByRole('button',{name:'保存并应用',exact:true}).click()
    await page.getByRole('button',{name:'原生插件页',exact:true}).click()
    const after=await page.locator('.fixture-fixed-probe').boundingBox()
    const toggleAfter=await page.getByRole('button',{name:'原生折叠侧栏'}).boundingBox()
    const sidebarFill=await page.locator('[data-slot="sidebar"]>.kB3qhq_root').evaluate(el=>getComputedStyle(el).backgroundColor)
    const ancestorBlur=await page.locator('.PIRFFq_sidebarCol').evaluate(el=>getComputedStyle(el).backdropFilter)
    const toggleHit=await page.getByRole('button',{name:'原生折叠侧栏'}).evaluate(el=>{const box=el.getBoundingClientRect();return el.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2))})
    geometry.push({mode,before,after,toggleBefore,toggleAfter,sidebarFill,ancestorBlur,toggleHit})
    check(`${mode}: native sidebar paints only one backing`,sidebarFill==='rgba(0, 0, 0, 0)')
    check(`${mode}: backdrop styling preserves viewport-fixed and native titlebar geometry`,JSON.stringify(before)===JSON.stringify(after)&&JSON.stringify(toggleBefore)===JSON.stringify(toggleAfter)&&ancestorBlur==='none'&&toggleHit)
    await page.getByRole('button',{name:'皮肤工坊',exact:true}).click()
    await page.getByRole('button',{name:'恢复默认',exact:true}).click()
  }
  await page.evaluate(()=>{document.documentElement.removeAttribute('data-windows-titlebar');document.documentElement.dataset.platform='darwin'})
  observations.push({case:'native-chrome-geometry',geometry})

  for(const [template,radius] of [['xp','6px'],['pixel','0px'],['glass','12px']]){
    const names={xp:'XP 复古',pixel:'像素方块',glass:'简约玻璃'}
    await openTab('我的皮肤')
    await page.getByRole('button',{name:'使用搭配：'+names[template],exact:true}).click()
    await page.getByRole('button',{name:'保存并应用',exact:true}).click()
    const actual=await page.locator('.kB3qhq_newSession').evaluate(el=>getComputedStyle(el).borderRadius)
    const navigation=await page.getByRole('button',{name:'皮肤工坊',exact:true}).evaluate(el=>getComputedStyle(el).backgroundImage)
    check(`${template}: native New Session uses template controls without replacing navigation`,actual===radius&&(template!=='xp'||navigation!=='none'),JSON.stringify({actual,navigation}))
  }
    await openTab('换主题')
  await page.getByRole('button',{name:'主题：原生风格',exact:true}).click()
  await page.getByRole('button',{name:'试穿 60 秒',exact:true}).click()
  const nativeAfter=await page.evaluate(()=>Object.fromEntries(['--dsw-alias-bg-base','--dsw-alias-bg-layer-1','--dsw-alias-label-primary','--dsw-alias-label-secondary','--dsw-radius-md'].map(key=>[key,getComputedStyle(document.body).getPropertyValue(key).trim()])))
  check('Native/background-only mode restores the exact host palette and radii after styled themes',JSON.stringify(nativeAfter)===JSON.stringify(nativePalette),JSON.stringify({nativePalette,nativeAfter}))
  check('Native/background-only mode never reshapes the New Session control',(await page.locator('.kB3qhq_newSession').evaluate(el=>getComputedStyle(el).borderRadius))===nativeNewRadius)
  await page.getByRole('button',{name:'原生示例聊天',exact:true}).click()
  const nativeComposerAfter=await page.locator('[data-composer-card]').evaluate(el=>({radius:getComputedStyle(el).borderRadius,border:getComputedStyle(el).borderWidth,shadow:getComputedStyle(el).boxShadow,buttonRadius:getComputedStyle(el.querySelector('button')).borderRadius}))
  check('Native/background-only material keeps original composer borders, shape, shadow and send-button shape',JSON.stringify(nativeComposerAfter)===JSON.stringify(nativeComposer),JSON.stringify({nativeComposer,nativeComposerAfter}))
  await page.getByRole('button',{name:'皮肤工坊',exact:true}).click()
  await page.getByRole('button',{name:'撤销试穿',exact:true}).click()
  await openTab('换主题')
  await page.getByRole('button',{name:'主题：现代简约',exact:true}).click()
    const image=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1100;const ctx=canvas.getContext('2d');
    const gradient=ctx.createLinearGradient(0,0,1600,1100);gradient.addColorStop(0,'#251945');gradient.addColorStop(.5,'#91245f');gradient.addColorStop(1,'#101a31');ctx.fillStyle=gradient;ctx.fillRect(0,0,1600,1100);
    for(const [x,y,r,color]of [[210,460,240,'#39217d'],[1100,320,220,'#d05489'],[1400,980,330,'#246c8e']]){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.locator('input[aria-label="上传壁纸文件"]').setInputFiles({name:'generated-test-wallpaper.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')})
  await page.getByText('壁纸已在本机压缩并嵌入皮肤。不会上传到外部服务。',{exact:true}).waitFor()
    await openTab('换皮肤')
  await openAdvanced()
  await page.getByLabel('面板不透明度',{exact:true}).press('Home')
  for(let step=0;step<65;step++)await page.getByLabel('面板不透明度',{exact:true}).press('ArrowRight')
  await page.getByLabel('皮肤名称',{exact:true}).fill('原生界面回归 · 自制壁纸')
  await page.getByRole('button',{name:'保存并应用',exact:true}).click()
  await page.getByRole('button',{name:'原生插件页',exact:true}).click()
  await page.locator('.w6M7KW_page').waitFor()
  const headerBefore=await page.locator('[data-natural]').evaluate(el=>getComputedStyle(el,'::before').backgroundColor)
  check('Resting native sticky header no longer paints an opaque blank rectangle',headerBefore==='rgba(0, 0, 0, 0)',headerBefore)
  const mainFill=await page.locator('.PIRFFq_mainPanel').evaluate(el=>getComputedStyle(el).backgroundColor)
  check('Native list has a translucent reading backing instead of raw photo under text',mainFill!=='rgba(0, 0, 0, 0)',mainFill)
  const points=[[24,680],[1150,38],[1260,620]],visible=await page.screenshot({animations:'disabled'})
  await page.locator('.sw-wallpaper').evaluate(el=>el.style.visibility='hidden')
  const hidden=await page.screenshot({animations:'disabled'})
  await page.locator('.sw-wallpaper').evaluate(el=>el.style.removeProperty('visibility'))
  const visiblePixels=await pixels(visible,points),hiddenPixels=await pixels(hidden,points)
  for(let index=0;index<points.length;index++){
    const delta=Math.max(...visiblePixels[index].map((v,i)=>Math.abs(v-hiddenPixels[index][i])))
    check(`Wallpaper visibly reaches ${['native left sidebar','top header','reading area'][index]} (screenshot pixel comparison)`,delta>=5,JSON.stringify({visible:visiblePixels[index],hidden:hiddenPixels[index],delta}))
  }
  observations.push({case:'wallpaper-visible-across-native-shell',points,visiblePixels,hiddenPixels,headerBefore,mainFill})
  if(artifacts)await writeFile(join(artifacts,'native-plugins-wallpaper-light.png'),visible)

  // Pixel-level contrast against both extremes of wallpaper, not just an
  // attractive, low-detail gradient. Local generated data URLs, no HTTP images.
  // The thin default deliberately trades contrast for a visible wallpaper, so
  // extreme wallpapers are recorded; readability is then guaranteed by the
  // explicit 「更清晰」 recipe, which is what the assertion checks.
  const extreme = [[false,'#000000'],[false,'#ffffff'],[true,'#000000'],[true,'#ffffff']]
  async function measureContrast(dark, color) {
    await page.evaluate(dark=>window.__setDark(dark),dark)
    await page.locator('.sw-wallpaper__image').evaluate((el,color)=>{el.style.backgroundImage='none';el.style.backgroundColor=color},color)
    const bg=(await pixels(await page.screenshot({animations:'disabled'}),[[1260,620]]))[0]
    const text=await page.locator('.w6M7KW_cardDesc').first().evaluate(el=>getComputedStyle(el).color)
    const foreground=text.match(/[\d.]+/g).slice(0,3).map(Number)
    return { foreground, bg, ratio:colorContrast(foreground,bg) }
  }
  for(const [dark,color] of extreme){
    observations.push({case:'reading-contrast-thin',dark,color,...await measureContrast(dark,color)})
  }
  await page.getByRole('button',{name:'皮肤工坊',exact:true}).click()
    await page.getByRole('button',{name:'更清晰',exact:true}).click()
  await page.getByRole('button',{name:'保存并应用',exact:true}).click()
  await page.getByRole('button',{name:'原生插件页',exact:true}).click()
  await page.locator('.w6M7KW_page').waitFor()
  for(const [dark,color] of extreme){
    const measured=await measureContrast(dark,color)
    check(`${dark?'Dark':'Light'} muted native list text stays readable over ${color} wallpaper once 「更清晰」 is used`,measured.ratio>=4.5,JSON.stringify(measured))
    observations.push({case:'reading-contrast-clear',dark,color,...measured})
  }
  await page.locator('.sw-wallpaper__image').evaluate(el=>{el.style.removeProperty('background-image');el.style.removeProperty('background-color')})
  if(artifacts)await page.screenshot({animations:'disabled',path:join(artifacts,'native-plugins-wallpaper-dark.png')})
  await page.evaluate(()=>window.__setDark(false))
  await page.locator('.w6M7KW_pageBody').evaluate(el=>el.scrollTop=330)
  await page.waitForFunction(()=>document.querySelector('[data-natural]').hasAttribute('data-scrolled'))
  const scrolled=await page.locator('[data-natural]').evaluate(el=>({fill:getComputedStyle(el,'::before').backgroundColor,blur:getComputedStyle(el,'::before').backdropFilter}))
  check('Scrolled sticky header has its own glass backing to prevent overlapping labels',scrolled.fill!=='rgba(0, 0, 0, 0)'&&scrolled.blur!=='none',JSON.stringify(scrolled))
  if(artifacts)await page.screenshot({animations:'disabled',path:join(artifacts,'native-plugins-scrolled.png')})

  await page.getByRole('button',{name:'原生示例聊天',exact:true}).click()
  const chatFill=await page.locator('.kiGsTW_root').evaluate(el=>getComputedStyle(el).backgroundColor)
  check('Native conversation inside the real main.conversation slot shares the wallpaper',chatFill==='rgba(0, 0, 0, 0)',chatFill)
  for(const dark of [false,true]){
    await page.evaluate(dark=>window.__setDark(dark),dark)
    const chatPoints=[[1250,38],[1260,620],[1260,990]]
    const shown=await page.screenshot({animations:'disabled'})
    await page.locator('.sw-wallpaper').evaluate(el=>el.style.visibility='hidden')
    const masked=await page.screenshot({animations:'disabled'})
    await page.locator('.sw-wallpaper').evaluate(el=>el.style.removeProperty('visibility'))
    const shownPixels=await pixels(shown,chatPoints),maskedPixels=await pixels(masked,chatPoints)
    for(let index=0;index<chatPoints.length;index++){
      const delta=Math.max(...shownPixels[index].map((value,i)=>Math.abs(value-maskedPixels[index][i])))
      check(`${dark?'Dark':'Light'} actual-slot chat wallpaper reaches ${['header','transcript','composer surround'][index]}`,delta>=5,JSON.stringify({shown:shownPixels[index],masked:maskedPixels[index],delta}))
    }
    observations.push({case:'actual-slot-conversation-wallpaper',dark,chatPoints,shownPixels,maskedPixels})
    if(artifacts)await writeFile(join(artifacts,`native-conversation-wallpaper-${dark?'dark':'light'}.png`),shown)
  }
  await page.evaluate(()=>window.__setDark(false))
  await page.getByRole('button',{name:'皮肤工坊',exact:true}).click()
  await page.getByRole('button',{name:'试穿 60 秒',exact:true}).click()
  const keep=page.getByRole('button',{name:'保留并应用',exact:true}),keepLight=await actionContrast(keep)
  check('Preview Keep has explicit readable primary styling despite the following hidden error element',keepLight.ratio>=4.5&&await keep.getAttribute('class')==='sw-livebar__keep',JSON.stringify(keepLight))
  await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}})
  await keep.click();await page.locator('.sw-livebar [role="alert"]').waitFor()
  const keepAfterError=await actionContrast(keep)
  check('Preview Keep remains readable when a persistence error is visible',keepAfterError.ratio>=4.5,JSON.stringify(keepAfterError))
  await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;window.__setDark(true)})
  const keepDark=await actionContrast(keep)
  check('Preview Keep also uses a paired foreground in native dark mode',keepDark.ratio>=4.5,JSON.stringify(keepDark))
  await page.getByRole('button',{name:'撤销试穿',exact:true}).click()
  await page.evaluate(()=>window.__setDark(false))
  check('Native accent/business color is untouched by all applications',beforeNativeAccent===await page.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--dsw-alias-state-business-primary')))
  const persisted=await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY)
  check('Complete recipes now persist an explicit version-2 schema',JSON.parse(persisted).version===2&&JSON.parse(persisted).active.skin.readingOpacity===80&&JSON.parse(persisted).active.skin.wallpaper.opacity===100)

  // Verify data-independent imported packs still work in the native fixture.
  await page.locator('input[aria-label="导入分享包文件"]').setInputFiles({name:'legacy.dsh-skin.json',mimeType:'application/json',buffer:Buffer.from(legacyXP)})
  await page.getByText('已导入到编辑器，尚未应用。可继续修改，或保存并应用。',{exact:true}).waitFor()
  check('Existing version-1 packs import without a migration or automatic application',await page.locator('body').getAttribute('data-sw-template')==='glass')
  await page.getByRole('button',{name:'恢复默认',exact:true}).click()
  await page.getByRole('button',{name:'原生插件页',exact:true}).click()
  check('Restore-default removes all native-shell backings and restores the host header',await page.evaluate(()=>!document.body.hasAttribute('data-sw-skin'))&&(await page.locator('[data-natural]').evaluate(el=>getComputedStyle(el,'::before').backgroundColor))!=='rgba(0, 0, 0, 0)')
  await page.evaluate(()=>window.__disposePlugin())
  check('Disposal removes wallpaper, all owned styles and the latest theme layer',await page.locator('.sw-wallpaper,.sw-livebar,style[data-skin-workshop]').count()===0&&await page.evaluate(()=>window.__themeLayers.size===0&&document.body.dataset.unrelated==='preserve'))
  const oldSkin=JSON.parse(legacyGlass).skin
  oldSkin.opacity=84.5 // Valid v1 data; never silently snap it to 85 on upgrade.
  const oldLibrary=JSON.stringify({version:1,skins:[{id:'skin-legacy',skin:oldSkin}],active:{id:'skin-legacy',skin:oldSkin}})
  await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key:STORAGE_KEY,value:oldLibrary})
  await page.reload();await page.getByRole('heading',{name:'皮肤工坊'}).waitFor()
  check('An actual persisted v1 library starts correctly and is not rewritten during adoption',await page.locator('body').getAttribute('data-sw-template')==='glass'&&await page.evaluate(key=>localStorage.getItem(key),STORAGE_KEY)===oldLibrary)
  await openAdvanced()
  check('Adopted v1 library retains fractional panel/reading opacity without slider snapping',await page.getByLabel('面板不透明度',{exact:true}).inputValue()==='84.5'&&await page.getByLabel('正文阅读遮罩',{exact:true}).inputValue()==='84.5'&&await page.getByLabel('壁纸不透明度',{exact:true}).inputValue()==='100')
  await page.getByRole('button',{name:'保存并应用',exact:true}).click()
  const upgraded=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY)
  check('Only an explicit save upgrades the library while keeping the saved and active ids',upgraded.version===2&&upgraded.skins.length===1&&upgraded.skins[0].id==='skin-legacy'&&upgraded.active.id==='skin-legacy')
  await page.evaluate(()=>window.__disposePlugin())
  check('No uncaught errors or external HTTP requests',errors.length===0&&external.length===0,JSON.stringify({errors,external}))
  if(artifacts)await writeFile(join(artifacts,'native-shell-checks.json'),JSON.stringify({passed,failures,observations,errors,external},null,2))
  assert.deepEqual(failures,[])
  console.log(`\n${passed} native-shell browser checks passed. Isolated native DOM/CSS regression, NOT authenticated desktop verification.`)
}catch(error){
  console.error('Browser errors:',errors)
  if(page&&!page.isClosed()&&artifacts)await page.screenshot({animations:'disabled',path:join(artifacts,'native-shell-failure.png')})
  throw error
}finally{await browser.close()}
