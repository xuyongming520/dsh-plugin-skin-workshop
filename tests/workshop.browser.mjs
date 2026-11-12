// Isolated real-React/Chromium tests with a minimal DSH slot host. This is not
// an authenticated session in the user's desktop app. No real user data is read.
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { makeTemplate, exportSkinPack, STORAGE_KEY, RECOVERY_KEY } from '../src/model.js'

const { chromium } = await import(process.env.DSH_TEST_PLAYWRIGHT || 'playwright-core')
const vendor = process.env.DSH_TEST_REACT_DIR
if (!vendor) throw new Error('Set DSH_TEST_REACT_DIR to a directory with react.js, react-dom.js, react-dom-client.js and scheduler.js.')
const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const moduleNames = { react: 'react', 'react-dom': 'react-dom', 'react-dom/client': 'react-dom-client', scheduler: 'scheduler' }
const modules = await Promise.all(Object.entries(moduleNames).map(async ([id, file]) => `${JSON.stringify(id)}:function(require,module,exports){\n${await readFile(join(vendor, file + '.js'), 'utf8')}\n}`))
const fixtureCSS = `
:root{--dsw-alias-bg-base:#f6f8fa;--dsw-alias-bg-layer-1:#fff;--dsw-alias-bg-module-platform:#eef1f5;--dsw-alias-border-l2:#e0e5eb;--dsw-alias-label-primary:#202832;--dsw-alias-label-secondary:#647180;--dsw-alias-brand-primary:#4d6bfe;--dsw-alias-brand-primary-invert:#fff;--dsw-font-family:system-ui,sans-serif;--bt-accent:#4d6bfe;--bt-accent-ink:#fff;--bt-sidebar:#f7f7f7;--bt-main:#fcfcfc;--bt-ink:#141414;--bt-card:#fff;--bt-glass-bg:#ffffffd4;--bt-glass-rim:#ccc;--bt-glass-shadow:0 4px 18px #0001}
body[data-ds-dark-theme]{--dsw-alias-bg-base:#161a22;--dsw-alias-bg-layer-1:#222832;--dsw-alias-bg-module-platform:#2c3441;--dsw-alias-border-l2:#3d4756;--dsw-alias-label-primary:#edf2f8;--dsw-alias-label-secondary:#bbc4cf;--bt-sidebar:#1b1b1b;--bt-main:#141414;--bt-ink:#f2f2f2;--bt-card:#1f1f1f}
html,body,#root{height:100%;margin:0;font-family:system-ui,sans-serif}body{background:var(--dsw-alias-bg-base)}
.PIRFFq_frame{height:100%;display:grid;grid-template-columns:230px minmax(0,1fr);background:var(--dsw-alias-bg-base)}.PIRFFq_sidebarCol{background:var(--bt-sidebar)}.PIRFFq_centerCol,.PIRFFq_mainPanel{height:100%;min-height:0;min-width:0;display:flex;flex-direction:column}
.bt-leftcol{position:fixed;inset:0 auto 0 0;width:230px;box-sizing:border-box;padding:30px 18px;z-index:25;background:var(--bt-sidebar);color:var(--bt-ink);border-right:.5px solid #ccc}
.bt-row{display:block;margin:10px 0;padding:12px;text-align:left;width:100%;border:0;border-radius:12px;font:14px system-ui;background:transparent;color:inherit;cursor:pointer}.bt-row[aria-current=page]{background:#7c8fa522}
.fixture-label{font-size:10px;color:var(--bt-ink);opacity:.6;line-height:1.7;margin-top:18px}.fixture-dark{margin-top:28px;padding:8px;border:1px solid #8885;border-radius:8px;cursor:pointer;color:inherit;background:transparent}
.kiGsTW_root{height:100%;position:relative;box-sizing:border-box;display:flex;flex-direction:column;background:var(--bt-main);color:var(--bt-ink)}.fixture-chat{padding:28px;flex:1;display:flex;flex-direction:column;gap:24px}.bt-head{text-align:center}.bt-pill{background:var(--bt-glass-bg);color:var(--bt-ink);padding:12px 18px;border-radius:999px;border:0;font:14px system-ui}
.bt-bubble{align-self:flex-start;max-width:65%;border-radius:18px;padding:14px;background:#8882}.bt-ububble{align-self:flex-end;border-radius:18px;padding:12px;background:#26323f;color:#fff}.fixture-composer{padding:20px}
[data-composer-card]{display:flex!important;align-items:center!important;border-radius:22px!important;padding:12px!important;background:var(--bt-glass-bg)!important;backdrop-filter:blur(20px)!important;border:.5px solid var(--bt-glass-rim)!important;box-shadow:var(--bt-glass-shadow)!important}
[data-composer-input]{flex:1;outline:none;color:var(--bt-ink)}[data-composer-card] button.mock_primary{width:28px;height:28px;background:var(--bt-accent)!important;color:#fff!important;border-radius:50%!important;border:0}
@media(max-width:650px){.PIRFFq_frame{grid-template-columns:minmax(0,1fr)}.PIRFFq_sidebarCol,.bt-leftcol{display:none}}
`
const bootstrap = `
const modules={${modules.join(',\n')}};const cache={};
function require(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Unknown module '+id);const m=cache[id]={exports:{}};modules[id](require,m,m.exports);return m.exports}
const React=require('react'),h=React.createElement;const registrations=new Map();const cleanups=[];const layers=new Map();let seq=0;let keys=new Set();let navigate=()=>{};
function applyTokens(){const values={};for(const layer of layers.values())for(const [key,pair]of Object.entries(layer.tokens))values[key]=pair[document.body.hasAttribute('data-ds-dark-theme')?'dark':'light'];for(const key of keys)if(!(key in values))document.body.style.removeProperty(key);for(const [key,value]of Object.entries(values))document.body.style.setProperty(key,value);keys=new Set(Object.keys(values))}
window.__setDark=(dark)=>{document.body.toggleAttribute('data-ds-dark-theme',dark);document.documentElement.style.colorScheme=dark?'dark':'light';applyTokens()};
window.__themeLayers=layers;window.__fixtureCloseCount=0;window.__nativeAccent='#4d6bfe';
if(new URLSearchParams(location.search).has('legacy')){layers.set('@local/violet-skin',{seq:-1,tokens:{'--dsw-alias-brand-primary':{light:'#6058e8',dark:'#a49cff'},'--dsw-alias-bg-base':{light:'#ece5ff',dark:'#22172e'}}});applyTokens()}

window.__ModuleLoader__={load(def){const plugin=def.factory(require);window.__pluginServices=plugin.inject;plugin.apply({
 effect(fn){const stop=fn();if(typeof stop==='function')cleanups.push(stop)},
 theme:{overrideTokens(source,tokens){for(const value of Object.values(tokens))if(typeof value.light!=='string'||typeof value.dark!=='string')throw Error('Expected mode pair');const layer={seq:seq++,tokens};layers.set(source,layer);applyTokens();return()=>{if(layers.get(source)===layer){layers.delete(source);applyTokens()}}}},
 layout:{selectPanel:(id)=>navigate(id)},
 slots:{inject:(_name,cb)=>{const stop=cb();if(typeof stop==='function')cleanups.push(stop)},register:(def,component)=>{const key=def.name+':'+(def.key||def.id||'');registrations.set(key,{def,component});return()=>registrations.delete(key)}},
})}};
window.__disposePlugin=()=>{navigate('chat');for(const stop of [...cleanups].reverse())stop()};
`
const mount = `
function Fixture(){const [panel,setPanel]=React.useState('skin-workshop');navigate=setPanel;window.__navigate=setPanel;
const Workshop=registrations.get('main:skin-workshop')?.component;
const Settings=registrations.get('settings.section:skin-workshop')?.component;
return h(React.Fragment,null,
 h('aside',{className:'bt-leftcol'},h('strong',null,'测试工作区'),
  h('button',{className:'bt-row','aria-current':panel==='skin-workshop'?'page':undefined,onClick:()=>setPanel('skin-workshop')},'皮肤工坊'),
  h('button',{className:'bt-row',onClick:()=>setPanel('chat')},'示例聊天'),
  h('button',{className:'bt-row',onClick:()=>setPanel('settings')},'测试设置'),
  h('button',{className:'fixture-dark',onClick:()=>window.__setDark(!document.body.hasAttribute('data-ds-dark-theme'))},'宿主明暗切换'),
  h('p',{className:'fixture-label'},'隔离测试 · 非当前 DSH 截图',h('br'),'使用真实插件与 React，模拟宿主插槽。')),
 h('div',{'data-slot':'root',style:{display:'contents'}},h('div',{className:'PIRFFq_frame'},h('div',{className:'PIRFFq_sidebarCol'}),h('div',{className:'PIRFFq_centerCol'},h('div',{className:'PIRFFq_mainPanel','data-global-panel':panel==='chat'?undefined:true},h('div',{'data-slot':'main',style:{display:'contents'}},
 panel==='skin-workshop'&&Workshop?h(Workshop):panel==='settings'&&Settings?h(Settings,{close:()=>{window.__fixtureCloseCount++}}):h('div',{className:'kiGsTW_root'},
 h('div',{'data-slot':'conversation.header',style:{display:'contents'}},h('header',{className:'bt-head'},h('button',{className:'bt-pill'},'创作中的一天'))),h('div',{className:'fixture-chat'},h('div',{className:'bt-ububble'},'换一个环境，试试新的想法。'),h('div',{className:'bt-bubble'},'这是一条示例回复。侧栏、气泡和输入框已经跟随皮肤变化。')),
 h('div',{className:'fixture-composer'},h('div',{'data-composer-card':true},h('div',{'data-composer-input':true,contentEditable:true,suppressContentEditableWarning:true},'在这里输入…'),h('button',{className:'mock_primary','aria-label':'示例发送'},'↑'))))))))));}
require('react-dom/client').createRoot(document.getElementById('root')).render(h(Fixture));
`
const script = `${bootstrap}\n${source}\n${mount}`.replace(/<\/script/gi, '<\\/script')
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fixtureCSS}</style></head><body data-other-plugin="untouched"><div id="root"></div><script>${script}</script></body></html>`
const browser = await chromium.launch({ headless: true })
const artifacts = process.env.DSH_TEST_ARTIFACT_DIR
if (artifacts) await mkdir(artifacts, { recursive: true })
let passed = 0
const checks = []
const pass = (label) => { passed++; checks.push(label); console.log(`PASS ${passed}: ${label}`) }
const errors = []
const external = []
let page
const openTab = async (name) => {
  await page.getByRole('tab', { name: new RegExp('^' + name), exact: false }).click()
}
const selectStyle = async (id) => {
  await openTab('换主题')
  await page.getByRole('button', { name: '主题：' + { native: '原生风格', glass: '现代简约', xp: 'XP 复古', pixel: '像素方块' }[id], exact: true }).click()
  await openTab('换皮肤')
}
const openAdvanced = async () => {
  const summary = page.locator('.sw-advanced>summary')
  if (await summary.count() && !(await page.locator('.sw-advanced').evaluate((el) => el.open))) await summary.click()
}
const openMore = async () => {
  const summary = page.locator('.sw-more>summary')
  if (await summary.count() && !(await page.locator('.sw-more').evaluate((el) => el.open))) await summary.click()
}
const readDraft = async () => {
  const event = page.waitForEvent('download')
  await openMore()
  await page.getByRole('button', { name: '导出分享包', exact: true }).click()
  return JSON.parse(await readFile(await (await event).path(), 'utf8'))
}
try {
  const context = await browser.newContext({ viewport: { width: 1360, height: 1080 }, acceptDownloads: true })
  context.setDefaultTimeout(12000)
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).hostname !== 'skin.test') { external.push(route.request().url()); return route.abort() }
    return route.fulfill({ status: 200, contentType: 'text/html', body: html })
  })
  page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('dialog', (dialog) => dialog.accept())
  await page.goto('http://skin.test/?legacy=1')
  await page.getByRole('heading', { name: '皮肤工坊' }).waitFor()
  assert.equal(await page.locator('.sw-templates .sw-card').count(), 4)
  assert.equal(await page.locator('input[type=color]').count(), 0)
  assert.equal(await page.evaluate(() => document.body.hasAttribute('data-sw-skin')), false)
  assert.equal(await page.evaluate(() => window.__themeLayers.size), 0)
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--dsw-alias-brand-primary').trim()), '#4d6bfe')
  // Upload is the first thing on screen: one visible tab body, the drop zone.
  assert.equal(await page.getByRole('tab').count(), 3)
  assert.equal(await page.getByRole('tab', { name: /^换皮肤/ }).getAttribute('aria-selected'), 'true')
  assert.equal(await page.locator('.sw-tab-panel').count(), 3)
  // First screen: the background (prompt or echo card) plus the reading mask.
  assert.equal(await page.locator('[data-bg-preview]').count(), 1)
  assert.equal(await page.locator('[data-bg-preview]').getAttribute('data-bg-preview'), 'preset')
  // No large mock window in the header: the real page is the preview. The only
  // miniatures left are the small swatches on the skin cards.
  assert.equal(await page.locator('.sw-top .sw-mini').count(), 0)
  assert.equal(await page.locator('.sw-top').evaluate((el) => el.offsetHeight < 110), true)
  assert.equal(await page.locator('.sw-segment').count(), 0)
  // 恢复默认 lives in the header, not among the save buttons.
  assert.equal(await page.locator('.sw-top').getByRole('button', { name: '恢复默认', exact: true }).count(), 1)
  assert.equal(await page.getByLabel('正文阅读遮罩', { exact: true }).isVisible(), true)
  assert.equal(await page.getByRole('button', { name: '主题：原生风格', exact: true }).isVisible(), false)
  await openTab('换主题')
  assert.equal(await page.getByRole('button', { name: '主题：原生风格', exact: true }).isVisible(), true)
  assert.equal(await page.getByRole('button', { name: /上传一张壁纸/ }).isVisible(), false)
  await openTab('我的皮肤')
  assert.equal(await page.locator('.sw-templates .sw-card').count(), 4)
  await openTab('换皮肤')
  assert.equal(await page.locator('[data-recipe-theme]').innerText(), '原生风格')
  pass('Tabs replace the sidebar: upload-first 换皮肤 view, 换主题, 我的皮肤; hero keeps a live miniature')
  if (artifacts) await page.screenshot({ animations: 'disabled', path: join(artifacts, 'workshop-light.png') })

  await openTab('我的皮肤')
  await page.getByRole('button', { name: '使用搭配：XP 复古', exact: true }).click()
  await openTab('换皮肤')
  assert.equal(await page.locator('[data-recipe-theme]').innerText(), 'XP 复古')
  // A starter kit is a finished choice: it reaches the real shell at once.
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'xp')
  await page.getByRole('button', { name: '示例聊天', exact: true }).click()
  assert.equal(await page.locator('[data-composer-card]').evaluate((el) => getComputedStyle(el).borderRadius), '6px')
  assert.notEqual(await page.locator('.bt-pill').evaluate((el) => getComputedStyle(el).backgroundImage), 'none')
  await page.getByRole('button', { name: '皮肤工坊', exact: true }).click()
  await page.getByLabel('皮肤名称', { exact: true }).fill('我的复古皮肤')
  pass('A starter kit reaches the shell and composer at once; a rename stays a draft edit')

  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  assert.equal(await page.locator('.sw-saved .sw-card').count(), 1)
  assert.equal(await page.evaluate(() => window.__themeLayers.size), 1)
  await page.reload()
  await page.getByLabel('皮肤名称', { exact: true }).waitFor()
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'xp')
  assert.equal(await page.getByLabel('皮肤名称', { exact: true }).inputValue(), '我的复古皮肤')
  assert.equal(await page.locator('.sw-saved .sw-card').count(), 1)
  const accent = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bt-accent').trim())
  assert.equal(accent, '#4d6bfe')
  pass('Save-and-apply survives reload without overriding the host accent')

  // Choosing a theme is a finished choice: it applies at once, no Save step.
  await selectStyle('pixel')
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'pixel')
  assert.equal(await page.getByRole('button', { name: '保存并应用', exact: true }).count(), 0)
  // Typing a name only edits the draft, so the Save button comes back.
  await page.getByLabel('皮肤名称', { exact: true }).fill('像素工作室')
  assert.equal(await page.getByRole('button', { name: '保存并应用', exact: true }).isVisible(), true)
  await page.getByRole('button', { name: '示例聊天', exact: true }).click()
  assert.equal(await page.locator('[data-composer-card]').evaluate((el) => getComputedStyle(el).borderRadius), '0px')
  assert.equal(await page.locator('.mock_primary').evaluate((el) => getComputedStyle(el).borderRadius), '0px')
  assert.equal(await page.locator('.bt-leftcol').evaluate((el) => getComputedStyle(el).position), 'fixed')
  await page.getByRole('button', { name: '宿主明暗切换', exact: true }).click()
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--sw-ink').trim()), '#eef1f5')
  if (artifacts) await page.screenshot({ animations: 'disabled', path: join(artifacts, 'pixel-chat-dark.png') })
  await page.getByRole('button', { name: '皮肤工坊', exact: true }).click()
  pass('A chosen theme applies at once; pixel styling changes geometry and supports host dark mode')

  await openMore()
  await page.getByRole('button', { name: '另存为', exact: true }).click()
  assert.equal(await page.locator('.sw-saved .sw-card').count(), 2)
  assert.match(await page.getByLabel('皮肤名称', { exact: true }).inputValue(), /副本/)
  await page.getByLabel('皮肤名称', { exact: true }).fill('改个名称')
  await openTab('我的皮肤')
  await page.getByRole('button', { name: '使用搭配：简约玻璃', exact: true }).click()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  assert.equal(await page.getByLabel('皮肤名称', { exact: true }).inputValue(), '改个名称')
  await page.getByRole('button', { name: '使用搭配：简约玻璃', exact: true }).click()
  await page.getByRole('button', { name: '放弃并切换', exact: true }).click()
  assert.equal(await page.locator('[data-recipe-theme]').innerText(), '现代简约')
  pass('Duplicate makes a separate skin; template switches protect unsaved edits with a cancelable confirmation')

  // Import decoding can finish after the user has typed more changes.
  await page.evaluate(() => {
    window.__originalFileText = File.prototype.text
    File.prototype.text = function () {
      return window.__originalFileText.call(this).then((text) => new Promise((resolve) => { window.__releaseImport = () => resolve(text) }))
    }
  })
  await page.locator('input[aria-label="导入分享包文件"]').setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: Buffer.from(exportSkinPack(makeTemplate('xp'))) })
  await page.waitForFunction(() => typeof window.__releaseImport === 'function')
  await page.getByLabel('皮肤名称', { exact: true }).fill('读取期间的新修改')
  await page.evaluate(() => { File.prototype.text = window.__originalFileText; window.__releaseImport() })
  await page.getByRole('button', { name: '取消', exact: true }).click()
  assert.equal(await page.getByLabel('皮肤名称', { exact: true }).inputValue(), '读取期间的新修改')
  pass('An asynchronously completed import does not silently discard edits made while it was being read')

  // A generated local raster: no network image or user attachment is accessed.
  await openTab('换皮肤')
  const image = await page.evaluate(() => { const c=document.createElement('canvas');c.width=800;c.height=500;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,800,500);g.addColorStop(0,'#89c9bd');g.addColorStop(1,'#e9bb9c');x.fillStyle=g;x.fillRect(0,0,800,500);return c.toDataURL('image/png').split(',')[1] })
  await page.locator('input[aria-label="上传壁纸文件"]').setInputFiles({ name: 'original-wallpaper.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') })
  await page.locator('[data-bg-preview="image"]').waitFor()
  await page.getByLabel('皮肤名称', { exact: true }).fill('我的玻璃壁纸')
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY)
  assert.match(stored.active.skin.wallpaper.image, /^data:image\/webp;base64,/)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出分享包', exact: true }).click()
  const download = await downloadEvent
  assert.equal(download.suggestedFilename(), '我的玻璃壁纸.dsh-skin.json')
  const exported = await readFile(await download.path(), 'utf8')
  assert.equal(JSON.parse(exported).skin.wallpaper.image, stored.active.skin.wallpaper.image)
  await page.getByRole('button', { name: '恢复默认', exact: true }).click()
  await page.locator('input[aria-label="导入分享包文件"]').setInputFiles({ name: 'import.dsh-skin.json', mimeType: 'application/json', buffer: Buffer.from(exported) })
  await page.getByText('已导入到编辑器，尚未应用。确认无误后点「保存并应用」。', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.body.hasAttribute('data-sw-skin')), false)
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'glass')
  pass('Local wallpaper is rasterized; export includes pixels; importing validates and stages it without silently applying')

  assert.equal(JSON.parse(exported).version, 2)
  if (artifacts) await page.screenshot({ animations: 'disabled', path: join(artifacts, 'workshop-dark.png') })
  const compositionStorage = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  const savedComposition = JSON.parse(exported).skin

  // Roving keyboard focus across the three weak tabs stays deterministic.
  await openTab('换皮肤')
  await page.getByRole('tab', { name: /^换皮肤/ }).press('ArrowRight')
  assert.equal(await page.getByRole('tab', { name: /^换主题/ }).getAttribute('aria-selected'), 'true')
  await page.getByRole('tab', { name: /^换主题/ }).press('End')
  assert.equal(await page.getByRole('tab', { name: /^我的皮肤/ }).getAttribute('aria-selected'), 'true')
  await page.getByRole('tab', { name: /^我的皮肤/ }).press('Home')
  assert.equal(await page.getByRole('tab', { name: /^换皮肤/ }).getAttribute('aria-selected'), 'true')
  assert.equal(await page.locator('.sw-tab-panel').count(), 3)
  assert.equal(await page.locator('.sw-tab-panel:visible').count(), 1)
  pass('Roving keyboard focus moves between the three tabs and only one panel is shown at a time')

  await selectStyle('xp')
  const themed = (await readDraft()).skin
  assert.equal(themed.template, 'xp')
  assert.deepEqual(themed.wallpaper, savedComposition.wallpaper)
  for (const key of ['name', 'material', 'opacity', 'blur', 'readingOpacity']) assert.equal(themed[key], savedComposition[key])
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'xp')
  pass('Changing theme applies at once and still preserves the uploaded wallpaper, material, reading mask and name')

  if (artifacts) await page.screenshot({ animations: 'disabled', path: join(artifacts, 'workshop-material-dark.png') })
  await openAdvanced()
  await page.getByLabel('面板不透明度', { exact: true }).press('Home')
  assert.equal(await page.getByLabel('正文阅读遮罩', { exact: true }).inputValue(), String(savedComposition.readingOpacity))
  await page.getByLabel('正文阅读遮罩', { exact: true }).press('End')
  await openAdvanced()
  assert.equal(await page.getByLabel('面板不透明度', { exact: true }).inputValue(), '0')
  const material = (await readDraft()).skin
  assert.equal(material.opacity, 0)
  assert.equal(material.readingOpacity, 100)
  assert.equal(material.wallpaper.opacity, 100)
  await page.getByLabel('正文阅读遮罩', { exact: true }).press('Home')
  assert.equal(await page.getByText(/正文遮罩低于 30%/).isVisible(), true)
  await page.getByLabel('正文阅读遮罩', { exact: true }).press('End')
  assert.equal(await page.getByText(/正文遮罩低于 30%/).count(), 0)
  await page.getByRole('button', { name: '更通透', exact: true }).click()
  const thin = (await readDraft()).skin
  assert.deepEqual([thin.opacity, thin.readingOpacity, thin.material], [40, 30, 'glass'])
  assert.deepEqual(thin.wallpaper, savedComposition.wallpaper)
  await page.getByRole('button', { name: '更清晰', exact: true }).click()
  const thick = (await readDraft()).skin
  assert.deepEqual([thick.opacity, thick.readingOpacity], [80, 80])
  assert.deepEqual(thick.wallpaper, savedComposition.wallpaper)
  await page.getByLabel('正文阅读遮罩', { exact: true }).press('End')
  await openAdvanced()
  await page.getByLabel('面板不透明度', { exact: true }).press('Home')
  await openAdvanced()
  assert.equal(await page.getByLabel('面板材质', { exact: true }).inputValue(), 'glass')
  await openAdvanced()
  await page.getByLabel('面板材质', { exact: true }).selectOption('solid')
  await openAdvanced()
  assert.equal(await page.getByLabel('面板不透明度', { exact: true }).isDisabled(), true)
  await openAdvanced()
  assert.equal(await page.getByLabel('磨砂强度', { exact: true }).isDisabled(), true)
  assert.equal(await page.getByLabel('正文阅读遮罩', { exact: true }).isDisabled(), false)
  await openAdvanced()
  await page.getByLabel('面板材质', { exact: true }).selectOption('glass')
  pass('Panel opacity, wallpaper opacity and reading mask are independent; solid material does not lock reading controls')

  await page.getByRole('button', { name: '试穿 60 秒', exact: true }).click()
  await selectStyle('native')
  await page.getByRole('button', { name: '示例聊天', exact: true }).click()
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'native')
  assert.equal(await page.locator('[data-composer-card]').evaluate(el => getComputedStyle(el).borderRadius), '22px')
  assert.equal(await page.evaluate(() => Object.keys(window.__themeLayers.get('@local/violet-skin').tokens).length), 0)
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bt-accent').trim()), '#4d6bfe')
  await page.getByRole('button', { name: '皮肤工坊', exact: true }).click()
  pass('Background-only native style keeps host composer geometry, palette and accent even after a live style change')

  await openAdvanced()
  await page.getByLabel('壁纸不透明度', { exact: true }).press('Home')
  // Advanced sliders are draft edits; the first-screen controls already apply live.
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  assert.equal(await page.locator('.sw-wallpaper__image').evaluate(el => getComputedStyle(el).opacity), '0')
  await openAdvanced()
  assert.equal(await page.getByLabel('面板不透明度', { exact: true }).inputValue(), '0')
  assert.equal(await page.getByLabel('正文阅读遮罩', { exact: true }).inputValue(), '100')
  await openTab('换皮肤')
  await page.getByRole('button', { name: '移除背景', exact: true }).click()
  await openAdvanced()
  assert.equal(await page.getByLabel('壁纸不透明度', { exact: true }).isDisabled(), true)
  await openAdvanced()
  assert.equal(await page.getByLabel('图片填充', { exact: true }).isDisabled(), true)
  assert.equal(await page.locator('[data-recipe-theme]').innerText(), '原生风格')
  await page.getByRole('button', { name: '晴空草坡', exact: true }).click()
  await openAdvanced()
  assert.equal(await page.getByLabel('壁纸不透明度', { exact: true }).inputValue(), '0')
  assert.equal(await page.locator('[data-recipe-theme]').innerText(), '原生风格')
  await openAdvanced()
  await page.getByLabel('壁纸不透明度', { exact: true }).press('End')
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  assert.equal(await page.locator('.sw-wallpaper__image').evaluate(el => getComputedStyle(el).opacity), '1')
  pass('Wallpaper opacity reaches the actual layer; removing or replacing background never resets the chosen theme or other opacity controls')

  // Every immediate choice keeps a one-step undo, even with an empty name.
  const beforeTemplate = await page.locator('body').getAttribute('data-sw-template')
  await page.getByLabel('皮肤名称', { exact: true }).fill('')
  await selectStyle('pixel')
  assert.equal(await page.getByLabel('皮肤名称', { exact: true }).inputValue(), '像素方块')
  assert.equal(await page.locator('[data-recipe-theme]').innerText(), '像素方块')
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'pixel')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), beforeTemplate)
  await page.getByLabel('皮肤名称', { exact: true }).fill(savedComposition.name)
  pass('An immediate theme choice can be undone in one step, even with a temporarily empty name')

  const previousLibrary = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  const malicious = JSON.parse(exportSkinPack(makeTemplate()))
  malicious.skin.css = 'body{display:none}'
  await page.locator('input[aria-label="导入分享包文件"]').setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(malicious)) })
  await page.getByRole('alert').filter({ hasText: '不支持的字段' }).waitFor()
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), previousLibrary)
  await page.locator('input[aria-label="上传壁纸文件"]').setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg onload="alert(1)"></svg>') })
  await page.getByRole('alert').filter({ hasText: '请选择 PNG' }).waitFor()
  pass('Unsafe CSS packs and SVG wallpaper are rejected, without changing storage or current skin')

  await page.getByLabel('皮肤名称', { exact: true }).fill('无法保存的修改')
  await page.evaluate(() => { window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')} })
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '本地保存失败' }).waitFor()
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), previousLibrary)
  await page.evaluate(() => { Storage.prototype.setItem=window.__originalSetItem })
  pass('Quota failure is visible and never falsely reports a successful save')

  await openTab('我的皮肤')
  await page.getByRole('button', { name: '使用搭配：像素方块', exact: true }).click()
  await page.getByRole('button', { name: '放弃并切换', exact: true }).click({ timeout: 2000 }).catch(() => {})
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'pixel')
  const afterCombo = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
  // Preview a draft-only tweak: it must not be written and must roll back.
  await openTab('换皮肤')
  await openAdvanced()
  await page.getByLabel('面板不透明度', { exact: true }).press('Home')
  await page.clock.install()
  await page.getByRole('button', { name: '试穿 60 秒', exact: true }).click()
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'pixel')
  await page.clock.fastForward(61_000)
  await page.waitForFunction(() => document.querySelector('.sw-livebar')?.hidden === true)
  assert.equal(await page.locator('.sw-livebar').isVisible(), false)
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), afterCombo)
  pass('A real browser timer rolls back a 60-second preview and never writes storage')

  // Uploading answers immediately: the picked image is echoed with a success
  // label instead of disappearing into a silent state.
  await openTab('换皮肤')
  const uploadImage = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 64; c.height = 48; const x = c.getContext('2d'); x.fillStyle = '#c85a2a'; x.fillRect(0, 0, 64, 48); return c.toDataURL('image/png').split(',')[1] })
  await page.locator('input[aria-label="上传壁纸文件"]').setInputFiles({ name: 'echo.png', mimeType: 'image/png', buffer: Buffer.from(uploadImage, 'base64') })
  await page.locator('[data-bg-preview="image"]').waitFor()
  assert.equal(await page.locator('[data-bg-preview="image"]').count(), 1)
  assert.equal((await page.locator('.sw-bgcard-copy strong').innerText()).trim(), '✓ 壁纸已上传')
  assert.equal(await page.getByRole('button', { name: '换一张', exact: true }).isVisible(), true)
  pass('Choosing a file echoes the image back with a success label and a 换一张 action')

  // Dropping a file on the highlighted zone must run the same local pipeline.
  const dropSkin = (await readDraft()).skin.wallpaper.image
  await page.locator('.sw-dropzone, .sw-bgcard').first().evaluate((el) => {
    const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 80
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#3366cc'; ctx.fillRect(0, 0, 120, 80)
    const file = new File([new Blob([canvas.toDataURL('image/png').split(',')[1]], { type: 'text/plain' })], 'dragged.png', { type: 'image/png' })
    const blob = new Blob([Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]), (c) => c.charCodeAt(0))], { type: 'image/png' })
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'dragged.png', { type: 'image/png' }))
    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
    el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
    void file
  })
  await page.waitForFunction((previous) => {
    const root = document.querySelector('.sw-wallpaper__image')
    return root && root.style.backgroundImage !== previous
  }, dropSkin, { timeout: 8000 }).catch(() => {})
  await page.locator('[data-bg-preview="image"]').waitFor()
  // The picked image must be echoed back, not just accepted silently.
  assert.equal(await page.locator('[data-bg-preview="image"]').count(), 1)
  assert.match(await page.locator('[data-bg-preview="image"]').evaluate((el) => getComputedStyle(el).backgroundImage), /^url\("data:image\/webp;base64,/)
  assert.equal((await page.locator('.sw-bgcard-copy strong').innerText()).trim(), '✓ 壁纸已上传')
  assert.match((await readDraft()).skin.wallpaper.image, /^data:image\/webp;base64,/)
  pass('Dropping an image echoes it back as a preview with a success label, and runs the same local compression')

  // Each theme ships a matching set (its own background + material). The small
  // button on the card loads the whole kit, not just the palette.
  await openTab('换主题')
  await page.getByRole('button', { name: /^套用XP 复古的配套皮肤$/ }).click()
  const discard = page.getByRole('button', { name: '放弃并切换', exact: true })
  if (await discard.count()) await discard.click()
  const kit = (await readDraft()).skin
  assert.equal(kit.template, 'xp')
  assert.equal(kit.wallpaper.preset, 'meadow')
  assert.equal(kit.material, 'solid')
  assert.equal(kit.name, 'XP 复古')
  pass('A theme card can load its matching kit: theme, background and material together')
  // Restore the draft the following checks expect.
  await openTab('我的皮肤')
  await page.getByRole('button', { name: '使用搭配：像素方块', exact: true }).click()
  if (await page.getByRole('button', { name: '放弃并切换', exact: true }).count()) await page.getByRole('button', { name: '放弃并切换', exact: true }).click()
  await openTab('换皮肤')

  await page.setViewportSize({ width: 375, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const title of ['换皮肤', '换主题', '我的皮肤']) {
    await openTab(title)
    assert.equal(await page.locator('.sw-page').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), true)
    assert.equal(await page.locator('.sw-tab-panel:visible').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), true)
  }
  await openTab('换皮肤')
  assert.equal(await page.locator('.sw-card').first().evaluate((el) => getComputedStyle(el).animationName), 'none')
  await page.locator('.sw-page').evaluate((el) => el.scrollTop = 0)
  if (artifacts) await page.screenshot({ animations: 'disabled', path: join(artifacts, 'workshop-narrow-dark.png') })
  pass('375px layout stays within its container and honors reduced-motion')

  await page.setViewportSize({ width: 1360, height: 1080 })
  await page.evaluate(() => window.__navigate('settings'))
  await page.getByRole('button', { name: '打开皮肤工坊', exact: true }).click()
  assert.equal(await page.evaluate(() => window.__fixtureCloseCount), 1)
  await page.getByRole('heading', { name: '皮肤工坊' }).waitFor()
  pass('Settings entry navigates through the public layout service and calls the host-provided close callback')

  await page.getByRole('button', { name: '试穿 60 秒', exact: true }).click()
  await page.getByRole('button', { name: '保留并应用', exact: true }).click()
  assert.equal(await page.locator('body').getAttribute('data-sw-template'), 'pixel')
  await openMore()
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  assert.equal(await page.evaluate(() => document.body.hasAttribute('data-sw-skin')), false)
  assert.equal(await page.evaluate(() => window.__themeLayers.size), 0)
  pass('Keeping preview persists a skin; deleting the active skin returns to DSH default')

  await page.getByRole('button', { name: '试穿 60 秒', exact: true }).click()
  await page.getByRole('button', { name: '保留并应用', exact: true }).click()
  await selectStyle('xp')
  await page.evaluate(() => window.__disposePlugin())
  await page.locator('[data-composer-card]').waitFor()
  assert.equal(await page.evaluate(() => window.__themeLayers.size), 0)
  assert.equal(await page.locator('style[data-skin-workshop]').count(), 0)
  assert.equal(await page.locator('.sw-wallpaper,.sw-livebar').count(), 0)
  assert.equal(await page.locator('body').getAttribute('data-other-plugin'), 'untouched')
  assert.equal(await page.locator('[data-composer-card]').evaluate((el) => getComputedStyle(el).borderRadius), '22px')
  pass('Plugin disposal removes its latest token layer, CSS, wallpaper, preview bar and timers without touching other plugins')

  await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY)
  await page.reload()
  await page.getByText(/本机皮肤库无法读取/).waitFor()
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), '{broken')
  await openMore()
  await page.getByRole('button', { name: '仅保存', exact: true }).click()
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), RECOVERY_KEY), '{broken')
  pass('Corrupt preferences fail safely and are backed up before new saves')

  assert.deepEqual(errors, [])
  assert.deepEqual(external, [])
  pass('No uncaught browser errors and no external HTTP requests in the complete workflow')
  if (artifacts) await writeFile(join(artifacts, 'workshop-checks.json'), JSON.stringify({ passed, checks, errors, external }, null, 2))
  console.log(`\n${passed} browser checks passed. This is an isolated slot-host test, not desktop integration verification.`)
} catch (error) {
  console.error('Browser errors:', JSON.stringify(errors))
  if (page && !page.isClosed()) {
    console.error('Visible alerts:', JSON.stringify(await page.locator('[role=alert]').allTextContents()))
    if (artifacts) await page.screenshot({ animations: 'disabled', path: join(artifacts, 'workshop-failure.png') })
  }
  throw error
} finally { await browser.close() }
