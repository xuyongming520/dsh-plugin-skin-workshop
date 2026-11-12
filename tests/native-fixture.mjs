// Version-specific DOM / CSS fixture for the native DSH shell (0.2.2-rc.1).
// These hashed names are TEST INPUT, not selectors used by the plugin.
// Set DSH_TEST_HOST_REFERENCE_DIR to run against the complete installed native
// stylesheets instead of this small representative fallback. Neither mode is
// an authenticated desktop session, and no user preferences are accessed.
export const NATIVE_FALLBACK_CSS = `
body{--dsw-font-family:system-ui,sans-serif;--dsw-radius-md:12px;--dsw-radius-lg:16px;--dsw-radius-xl:20px;--dsw-alias-bg-base:#fff;--dsw-alias-bg-layer-1:#fff;--dsw-alias-bg-layer-2:#fff;--dsw-alias-bg-layer-3:#fff;--dsw-alias-bg-module-platform:#f3f5f8;--dsw-alias-border-l2:#0000001a;--dsw-alias-border-l3:#0000001f;--dsw-alias-brand-primary:#0f1115;--dsw-alias-brand-primary-invert:#0f1115;--dsw-alias-label-primary:#0f1115;--dsw-alias-label-primary-foreground:#fff;--dsw-alias-label-primary-inverted:#fff;--dsw-alias-label-secondary:#545557;--dsw-alias-label-tertiary:#6a6e74;--dsw-alias-state-business-primary:#4176e6;--dsw-specific-sidebar-fill:#f5f6f8;--dsw-alias-interactive-bg-hover:#0000000a}
body[data-ds-dark-theme]{--dsw-alias-bg-base:#141519;--dsw-alias-bg-layer-1:#202126;--dsw-alias-bg-layer-2:#292a30;--dsw-alias-bg-layer-3:#33353b;--dsw-alias-bg-module-platform:#292a30;--dsw-alias-border-l2:#ffffff1f;--dsw-alias-border-l3:#ffffff29;--dsw-alias-brand-primary:#fafafa;--dsw-alias-brand-primary-invert:#fafafa;--dsw-alias-label-primary:#fafafa;--dsw-alias-label-primary-foreground:#0f1115;--dsw-alias-label-primary-inverted:#292a30;--dsw-alias-label-secondary:#c1c5cb;--dsw-alias-label-tertiary:#adb2b8;--dsw-alias-state-business-primary:#7aaaff;--dsw-specific-sidebar-fill:#202126;--dsw-alias-interactive-bg-hover:#ffffff14}
.PIRFFq_frame{box-sizing:border-box;background:var(--dsw-alias-bg-base);grid-template-rows:minmax(0,1fr) auto;height:100%;display:grid;position:relative;overflow:hidden}
.PIRFFq_sidebarCol{background:var(--dsw-specific-sidebar-fill);border-right:.5px solid var(--dsw-alias-border-l3);grid-area:1/1;min-width:0;overflow:hidden}
.PIRFFq_centerCol{flex-direction:column;grid-area:1/2;min-width:0;display:flex;overflow:hidden}
.PIRFFq_mainPanel{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex}
.PIRFFq_rightbarCol{grid-area:1/3;min-width:0;position:relative;overflow:visible}
html[data-platform=darwin]{--dsh-frame-top-clearance:48px}
[data-platform=darwin] .PIRFFq_frame{background:transparent}
[data-platform=darwin] .PIRFFq_frame:not([data-sidebar-drawer]) .PIRFFq_sidebarCol{background:linear-gradient(to bottom,#7a9bf01a,#7a9bf000 35%,#8f89b800 68%,#8f89b817),color-mix(in srgb,color-mix(in srgb,var(--dsw-specific-sidebar-fill) 97%,#7a9bf0) 40%,transparent);border-right:none}
[data-platform=darwin] .PIRFFq_centerCol{background:var(--dsw-alias-bg-base);border-left:.5px solid var(--dsw-alias-border-l3)}
[data-windows-titlebar] .PIRFFq_frame{padding-top:var(--dsh-windows-titlebar-height);background:var(--dsw-specific-sidebar-fill)}
[data-windows-titlebar] .PIRFFq_frame::before{content:"";height:var(--dsh-windows-titlebar-height);background:var(--dsw-specific-sidebar-fill);-webkit-app-region:drag;position:absolute;inset:0 0 auto}
.PIRFFq_frame[data-sidebar-drawer] .PIRFFq_sidebarCol{position:absolute;inset:0 auto 0 0;z-index:71;width:280px}
.kB3qhq_root{height:100%;padding:6px 8px;box-sizing:border-box;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);flex-direction:column;font-size:14px;display:flex}
[data-platform=darwin] .kB3qhq_root{background:transparent}
.kB3qhq_topStrip{height:52px;display:flex;justify-content:flex-end;align-items:center;padding:0 12px}
.kB3qhq_logoRow{height:60px;display:flex;align-items:center;padding:8px}
.kB3qhq_brandName{font-size:18px;font-weight:600}
.kB3qhq_newSession{height:38px;margin:0 4px 10px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:#ffffff8c;color:var(--dsw-alias-label-primary)}
.kB3qhq_panelList{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}
.kB3qhq_panelRow{display:flex;align-items:center;min-height:36px;padding:7px 12px;border:0;border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;background:transparent}
.kB3qhq_panelActive{background:var(--dsw-alias-interactive-bg-hover)}
.kB3qhq_regionArea{flex:1;min-height:0}
.kB3qhq_footArea{padding:14px 8px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.kB3qhq_toggle{width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:transparent;border:0}
[data-windows-titlebar] .kB3qhq_toggle{position:fixed;top:8px;left:12px;z-index:30}
.w6M7KW_page{--plugin-page-inset:clamp(24px,4vw,48px);height:100%;padding:0 var(--plugin-page-inset);box-sizing:border-box;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;align-items:center}
.w6M7KW_page>.w6M7KW_pageBody{min-height:0;width:calc(100% + 2 * var(--plugin-page-inset));max-width:none;margin-inline:calc(-1 * var(--plugin-page-inset));box-sizing:border-box;padding:0 var(--plugin-page-inset) 48px;display:flex;flex-direction:column;flex:1;align-items:center;gap:32px;position:relative;overflow:hidden auto}
.w6M7KW_pageBody>*{flex:none;width:100%;max-width:960px}
.w6M7KW_pageBody>.w6M7KW_pageBar{width:calc(100% + 2 * var(--plugin-page-inset));max-width:none;margin-inline:calc(-1 * var(--plugin-page-inset));padding-inline:var(--plugin-page-inset);box-sizing:border-box;display:flex;flex-direction:column;position:sticky;top:0;z-index:2}
.w6M7KW_pageBar>.w6M7KW_pageHead{align-self:center;width:100%;max-width:960px;height:var(--plugin-header-rest-height);position:relative}
.w6M7KW_pageBar[data-natural] [data-plugin-header-part]{left:var(--plugin-part-x);top:var(--plugin-part-y);width:var(--plugin-part-width);margin:0;position:absolute}
.w6M7KW_pageBar[data-natural]::before{content:"";height:var(--plugin-header-paint-height,var(--plugin-header-rest-height));background:var(--dsw-alias-bg-base);pointer-events:none;position:absolute;inset:0 0 auto}
.w6M7KW_pageTitle{font-size:20px;font-weight:500;line-height:28px}
.w6M7KW_pageIntro{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.w6M7KW_toolbar{display:flex;gap:16px;align-items:center;justify-content:flex-end}
.w6M7KW_installedPanel{display:flex;flex-direction:column;gap:32px}
.w6M7KW_group{display:flex;flex-direction:column;gap:8px}
.w6M7KW_groupTitle{font-size:14px;font-weight:500;line-height:22px;margin:0}
.w6M7KW_cards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.w6M7KW_cardHead{display:flex;align-items:center;gap:14px;padding:8px}
.w6M7KW_cardIcon{width:48px;height:48px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-lg);display:grid;place-items:center}
.w6M7KW_cardMain{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.w6M7KW_cardTitle{font-size:14px;font-weight:500;line-height:20px}
.w6M7KW_cardOpen{color:inherit;background:transparent;border:0;padding:0;text-align:left}
.w6M7KW_cardDesc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:18px}
.kiGsTW_root{height:100%;display:flex;flex-direction:column;position:relative;background:var(--dsw-alias-bg-base)}
.kiGsTW_body{display:flex;flex-direction:column;flex:1;min-height:0;position:relative}
.kiGsTW_scrollBody{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto}
.kiGsTW_composerSeat{display:flex;flex-direction:column;flex:none;position:sticky;bottom:0;background:linear-gradient(180deg,transparent,var(--dsw-alias-bg-base) 36px)}
`

export const NATIVE_FIXTURE_EXTRAS = `
html,body,#root{height:100%;margin:0;font-family:system-ui,sans-serif}body{background:var(--dsw-alias-bg-base)}
.fixture-native-button{border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:13px/20px system-ui;padding:6px 12px;cursor:pointer}
.fixture-native-button--primary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}
.fixture-fixed-probe{position:fixed;right:18px;bottom:18px;width:24px;height:24px;pointer-events:none;opacity:0}
.fixture-native-foot{font-size:10px;line-height:1.6;padding:14px 8px;color:var(--dsw-alias-label-secondary)}
.fixture-native-chat{padding:28px;display:flex;flex-direction:column;flex:1;gap:24px;color:var(--dsw-alias-label-primary)}
.fixture-native-composer{padding:20px}.fixture-native-composer [data-composer-card]{padding:12px;display:flex;align-items:center;gap:10px}
.fixture-native-composer [data-composer-input]{flex:1;outline:none}
.fixture-native-composer button{width:28px;height:28px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground);border:0}
`

export const NATIVE_MOUNT = `
function NativePluginPage(){
 const part=(x,y,width)=>({'--plugin-part-x':x+'px','--plugin-part-y':y+'px','--plugin-part-width':width});
 return h('main',{className:'w6M7KW_page'},
  h('div',{className:'w6M7KW_pageBody',onScroll:(event)=>event.currentTarget.querySelector('[data-natural]').toggleAttribute('data-scrolled',event.currentTarget.scrollTop>0)},
   h('div',{className:'w6M7KW_pageBar','data-natural':true,style:{'--plugin-header-rest-height':'154px','--plugin-header-paint-height':'154px','--plugin-header-compact-height':'80px'}},
    h('header',{className:'w6M7KW_pageHead'},
     h('div',{className:'w6M7KW_pageHeading'},
      h('h1',{className:'w6M7KW_pageTitle','data-plugin-header-part':'title',style:part(0,76,'130px')},'插件'),
      h('p',{className:'w6M7KW_pageIntro','data-plugin-header-part':'intro',style:part(0,110,'250px')},'安装、启用和配置插件')),
     h('div',{className:'w6M7KW_toolbar','data-plugin-header-part':'toolbar',style:{...part(0,76,'220px'),'--plugin-part-x':'calc(100% - 220px)'}},
      h('button',{className:'fixture-native-button'},'刷新'),h('button',{className:'fixture-native-button fixture-native-button--primary'},'+ 添加插件')))),
   h('div',{className:'w6M7KW_installedPanel'},['内置插件配置','实验性插件'].map((group,index)=>
    h('section',{key:group,className:'w6M7KW_group','data-plugin-scope':'global','data-plugin-group':index?'bundles':'basic'},
     h('h2',{className:'w6M7KW_groupTitle'},group),
     h('ul',{className:'w6M7KW_cards'},['子智能体','网页搜索','Agent 循环','终端','自动授权审查','语音输入'].map((name)=>
      h('li',{key:name,className:'w6M7KW_card'},h('div',{className:'w6M7KW_cardHead'},
       h('span',{className:'w6M7KW_cardIcon','aria-hidden':true},'◇'),
       h('div',{className:'w6M7KW_cardMain'},h('button',{className:'w6M7KW_cardTitle w6M7KW_cardOpen'},name),h('span',{className:'w6M7KW_cardDesc'},'设置工作台中的工具与功能。内容为隔离测试样例。')))))))))),
  h('span',{className:'fixture-fixed-probe','aria-hidden':true}));
}
// Match ConversationPanel -> renderSlot('main.conversation') -> ConversationMainPanel.
// Omitting this slot made the old direct-main selector pass while real chats stayed opaque.
function NativeChat(){return h('div',{'data-slot':'main.conversation',style:{display:'contents'}},
 h('div',{className:'kiGsTW_root','data-phase':'active'},
  h('div',{'data-slot':'conversation.header',style:{display:'contents'}},
   h('header',{className:'kiGsTW_header','data-window-drag':true},h('div',{className:'fixture-native-chat'},'原生会话标题'))),
  h('div',{'data-slot':'conversation.content',style:{display:'contents'}},
   h('div',{className:'kiGsTW_body','data-conversation-content':'','data-conversation-region':'chat','data-content-phase':'active'},
    h('div',{className:'kiGsTW_scrollBody','data-conversation-scroll':''},
     h('div',{className:'fixture-native-chat'},'这是一段原生聊天测试文字。',h('div',null,'壁纸在整窗底层，阅读底板保护文字对比度。')),
     h('div',{className:'kiGsTW_composerSeat','data-composer-seat':'','data-conversation-region':'composer'},
      h('div',{className:'fixture-native-composer'},
       h('div',{'data-composer-card':true},h('div',{'data-composer-input':true,contentEditable:true,suppressContentEditableWarning:true},'在这里输入…'),h('button',{className:'fixture_primary','aria-label':'测试发送'},'↑')))
     )
    )
   )
  )
 ));}
function NativeFixture(){
 const [panel,setPanel]=React.useState('skin-workshop');navigate=setPanel;window.__navigate=setPanel;
 const Workshop=registrations.get('main:skin-workshop')?.component;
 const row=(id,label)=>h('button',{key:id,className:'kB3qhq_panelRow'+(panel===id?' kB3qhq_panelActive':''),'aria-current':panel===id?'page':undefined,onClick:()=>setPanel(id)},label);
 return h('div',{'data-slot':'root',style:{display:'contents'}},
  h('div',{className:'PIRFFq_frame',style:{gridTemplateColumns:'280px minmax(0,1fr) 0px'}},
   h('div',{className:'PIRFFq_sidebarCol'},h('div',{'data-slot':'sidebar',style:{display:'contents'}},
    h('aside',{className:'kB3qhq_root'},
     h('div',{className:'kB3qhq_topStrip','data-window-drag':true},h('button',{className:'kB3qhq_iconButton kB3qhq_toggle','aria-label':'原生折叠侧栏'},'◧')),
     h('div',{className:'kB3qhq_logoRow','data-window-drag':true},h('strong',{className:'kB3qhq_brandName'},'deepseek HARNESS')),
     h('button',{className:'kB3qhq_newSession'},'+ 新会话'),
     h('nav',{className:'kB3qhq_panelList','aria-label':'原生导航'},h('div',{'data-slot':'sidebar.panellist',style:{display:'contents'}},
      row('plugins','原生插件页'),row('skin-workshop','皮肤工坊'),row('chat','原生示例聊天'))),
     h('div',{className:'kB3qhq_regionArea'},h('div',{className:'fixture-native-foot'},'工作区',h('br'),'DS Bot',h('br'),'Chief')),
     h('div',{className:'kB3qhq_footArea fixture-native-foot'},'隔离测试 · 原生 DOM / 样式替身',h('br'),'不是已登录桌面界面')))),
   h('div',{className:'PIRFFq_centerCol'},h('div',{className:'PIRFFq_mainPanel','data-global-panel':panel==='chat'?undefined:true},
    h('div',{'data-slot':'main',style:{display:'contents'}},panel==='skin-workshop'&&Workshop?h(Workshop):panel==='plugins'?h(NativePluginPage):h(NativeChat)))),
   h('div',{className:'PIRFFq_rightbarCol','data-rightbar-col':true})));
}
require('react-dom/client').createRoot(document.getElementById('root')).render(h(NativeFixture));
`
