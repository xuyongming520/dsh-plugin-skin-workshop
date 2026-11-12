export const WORKSHOP_CSS = `
.sw-page{--sw-ui-bg:var(--dsw-alias-bg-base,#f5f7fa);--sw-ui-card:var(--dsw-alias-bg-layer-1,#fff);--sw-ui-ink:var(--dsw-alias-label-primary,#202832);--sw-ui-muted:var(--dsw-alias-label-secondary,#66717f);--sw-ui-line:var(--dsw-alias-border-l2,#dfe5eb);--sw-ui-accent:var(--bt-accent,var(--dsw-alias-brand-primary,#0f1115));--sw-ui-accent-ink:var(--bt-accent-ink,var(--dsw-alias-label-primary-foreground,#fff));height:100%;min-height:0;overflow:auto;container-type:inline-size;background:var(--sw-ui-bg);color:var(--sw-ui-ink);font:14px/1.5 var(--dsw-font-family,system-ui,sans-serif)}
.sw-page *{box-sizing:border-box}
.sw-page :is(button,input,select){font:inherit}
.sw-page :is(button,input,select):focus-visible,.sw-setting button:focus-visible,.sw-livebar button:focus-visible{outline:2px solid var(--sw-ui-accent,var(--dsw-alias-brand-primary,#4d6bfe));outline-offset:3px}
.sw-page button{cursor:pointer}
.sw-page button:disabled{opacity:.45;cursor:not-allowed}
.sw-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;max-width:960px;margin:0 auto;padding:calc(18px + var(--dsh-frame-top-clearance,0px)) 28px 16px;padding-inline-start:max(28px,var(--dsh-frame-leading-clearance,0px))}
.sw-top-title{display:flex;align-items:baseline;gap:10px;min-width:0;flex-wrap:wrap}
.sw-title{font-size:19px;line-height:1.3;letter-spacing:-.02em;margin:0;font-weight:650}
.sw-top-tag{font-size:11px;color:var(--sw-ui-muted)}
.sw-top-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--sw-ui-muted);min-width:0}
.sw-top-notice{max-width:960px;margin:0 auto;padding:0 28px 12px;padding-inline-start:max(28px,var(--dsh-frame-leading-clearance,0px))}
.sw-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sw-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border-radius:10px;border:1px solid var(--sw-ui-line);background:var(--sw-ui-card);color:var(--sw-ui-ink);font-size:12px!important;line-height:18px;white-space:nowrap;transition:background .16s,transform .16s,box-shadow .16s}
.sw-btn:hover:not(:disabled){background:color-mix(in srgb,var(--sw-ui-accent) 7%,var(--sw-ui-card));box-shadow:0 3px 10px #00000008}
.sw-btn:active:not(:disabled){transform:translateY(1px)}
/* brand-primary-invert is NOT a foreground token in DSH: in light mode it
   is the same near-black as brand-primary. Use the paired label foreground. */
.sw-btn--primary{background:var(--sw-ui-accent);color:var(--sw-ui-accent-ink);border-color:transparent}
.sw-btn--primary:hover:not(:disabled){background:var(--sw-ui-accent);filter:brightness(.95)}
.sw-btn--ghost{background:transparent;border-color:transparent;color:var(--sw-ui-muted)}
.sw-btn--danger{color:var(--dsw-alias-state-danger-primary,#c93848)}
.sw-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--sw-ui-line);background:var(--sw-ui-card);padding:3px 8px;border-radius:999px;font-size:10px;line-height:16px;font-weight:500;color:var(--sw-ui-muted);max-width:100%;overflow-wrap:anywhere}
.sw-badge--active{color:var(--sw-ui-accent);border-color:color-mix(in srgb,var(--sw-ui-accent) 24%,transparent);background:color-mix(in srgb,var(--sw-ui-accent) 7%,var(--sw-ui-card))}
.sw-workspace{max-width:960px;margin:0 auto;padding:4px 28px 40px;min-width:0}
.sw-section-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}
.sw-section-head h2,.sw-section-head h3{margin:0;font-size:14px;font-weight:600}
.sw-subtle{font-size:11px;color:var(--sw-ui-muted);line-height:1.65}
.sw-templates{display:grid;gap:12px}
.sw-card{position:relative;display:block;padding:5px;width:100%;min-width:0;border:1px solid var(--sw-ui-line);border-radius:15px;background:var(--sw-ui-card);color:var(--sw-ui-ink);text-align:left;transition:transform .2s,border-color .2s,box-shadow .2s;overflow:hidden;animation:sw-enter .25s ease-out backwards}
.sw-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px #0000000c;border-color:color-mix(in srgb,var(--sw-ui-accent) 40%,var(--sw-ui-line))}
.sw-card[aria-pressed=true]{border-color:var(--sw-ui-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--sw-ui-accent) 10%,transparent)}
.sw-card-copy{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 7px 5px}
.sw-card-name{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw-card-desc{display:block;padding:0 7px 7px;font-size:10px;line-height:16px;color:var(--sw-ui-muted)}
.sw-card-tag{font-size:8px;letter-spacing:.09em;font-weight:600;color:var(--sw-ui-muted)}
.sw-empty{border:1px dashed var(--sw-ui-line);border-radius:12px;padding:20px 14px;text-align:center;color:var(--sw-ui-muted);font-size:12px;line-height:1.7}
.sw-saved{display:grid;gap:10px}
.sw-segment{display:inline-flex;gap:3px;border:1px solid var(--sw-ui-line);padding:3px;border-radius:9px;background:var(--sw-ui-card)}
.sw-segment button{border:0;border-radius:6px;background:none;color:var(--sw-ui-muted);padding:3px 8px;font-size:11px;line-height:18px}
.sw-segment button[aria-pressed=true]{background:color-mix(in srgb,var(--sw-ui-accent) 10%,var(--sw-ui-card));color:var(--sw-ui-accent)}
.sw-preview-wrap{padding:6px;border:1px solid var(--sw-ui-line);background:var(--sw-ui-card);border-radius:18px;box-shadow:0 10px 30px #00000008}
.sw-preview-caption{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:9px 4px 3px;font-size:10px;color:var(--sw-ui-muted)}
/* The thumbnail is an explicit mock shell, not a screenshot of the user's chat. */
.sw-mini{position:relative;isolation:isolate;overflow:hidden;height:296px;border-radius:12px;background:var(--sw-base);color:var(--sw-ink);font:11px/1.5 system-ui,sans-serif;text-align:left;pointer-events:none}
.sw-mini-bg{position:absolute;inset:-24px;background-image:var(--sw-wallpaper);background-size:var(--sw-image-size);background-position:var(--sw-image-position);background-repeat:var(--sw-image-repeat);opacity:var(--sw-image-opacity);filter:blur(var(--sw-image-blur));transform:scale(var(--sw-image-zoom));transform-origin:var(--sw-image-position)}
.sw-mini-shade{position:absolute;inset:0;background:#000;opacity:var(--sw-image-dim)}
.sw-mini-inner{position:relative;display:grid;grid-template-columns:26% minmax(0,1fr);height:100%;padding:12px;gap:12px}
.sw-mini-side{background:var(--sw-pane);backdrop-filter:blur(var(--sw-blur));border-radius:var(--sw-radius);border:var(--sw-border) solid var(--sw-edge);box-shadow:var(--sw-shadow);padding:12px 8px;min-width:0}
.sw-mini-logo{display:flex;align-items:center;gap:4px;margin-bottom:28px;font-size:9px;letter-spacing:.12em;font-weight:600}
.sw-mini-logo i{width:8px;height:8px;border-radius:50%;background:#4d6bfe}
.sw-mini-nav{padding:7px;margin-bottom:4px;border-radius:var(--sw-control-radius);font-size:10px;color:var(--sw-muted);white-space:nowrap;overflow:hidden}
.sw-mini-nav:first-of-type{background:var(--sw-control-fill);box-shadow:var(--sw-bevel),inset 0 0 0 var(--sw-border) var(--sw-line);color:var(--sw-ink)}
.sw-mini-chat{display:flex;flex-direction:column;gap:12px;min-width:0;background:var(--sw-reading-pane);border-radius:var(--sw-radius)}
.sw-mini-title{background:var(--sw-header);color:var(--sw-header-ink);border-radius:var(--sw-radius);border:var(--sw-border) solid var(--sw-edge);box-shadow:var(--sw-bevel);padding:7px 9px;font-size:10px;display:flex;justify-content:space-between;align-items:center}
.sw-mini-dots{letter-spacing:2px;font-size:10px;opacity:.65}
.sw-mini-bubble{padding:10px 11px;border-radius:var(--sw-radius);background:var(--sw-pane);backdrop-filter:blur(var(--sw-blur));box-shadow:inset 0 0 0 var(--sw-border) var(--sw-line);max-width:88%;align-self:flex-start}
.sw-mini-bubble--user{align-self:flex-end;max-width:90%;background:var(--sw-solid);box-shadow:var(--sw-bevel);font-size:10px}
.sw-mini-compose{margin-top:auto;display:flex;align-items:center;gap:8px;justify-content:space-between;padding:10px;border-radius:var(--sw-radius);border:var(--sw-border) solid var(--sw-edge);background:var(--sw-pane);backdrop-filter:blur(var(--sw-blur));box-shadow:var(--sw-bevel),var(--sw-shadow);font-size:10px;color:var(--sw-muted)}
.sw-mini-send{display:inline-grid;place-items:center;flex:none;width:22px;height:22px;border-radius:var(--sw-control-radius);background:var(--sw-ui-accent);color:var(--sw-ui-accent-ink)}
.sw-mini--small{height:104px;border-radius:10px}
.sw-mini--small .sw-mini-inner{padding:7px;gap:7px;grid-template-columns:27% minmax(0,1fr)}
.sw-mini--small .sw-mini-side{padding:6px;border-radius:min(var(--sw-radius),8px)}
.sw-mini--small .sw-mini-logo{height:4px;margin:4px 0 10px;background:var(--sw-muted);width:65%;opacity:.55;border-radius:2px;font-size:0}
.sw-mini--small .sw-mini-logo i{display:none}
.sw-mini--small .sw-mini-nav{font-size:0;padding:3px;margin:0 0 4px;height:7px;border-radius:min(var(--sw-radius),3px)}
.sw-mini--small .sw-mini-chat{gap:5px}
.sw-mini--small .sw-mini-title{height:12px;padding:0 4px;font-size:0;border-radius:min(var(--sw-radius),4px)}
.sw-mini--small .sw-mini-dots{font-size:6px}
.sw-mini--small .sw-mini-bubble{font-size:0;width:65%;height:15px;padding:0;border-radius:min(var(--sw-radius),5px)}
.sw-mini--small .sw-mini-bubble--user{width:43%;height:13px}
.sw-mini--small .sw-mini-compose{font-size:0;padding:3px 5px;height:17px;border-radius:min(var(--sw-radius),5px)}
.sw-mini--small .sw-mini-send{width:10px;height:10px;font-size:7px;border-radius:min(var(--sw-radius),3px)}
.sw-recipe{display:flex;align-items:center;gap:10px;padding:14px 4px 0;min-width:0}
.sw-recipe>span{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0}
.sw-recipe small{font-size:10px;color:var(--sw-ui-muted)}
.sw-recipe strong{font-size:12px;font-weight:550;overflow-wrap:anywhere}
.sw-recipe>i{font-size:13px;font-style:normal;font-weight:300;color:var(--sw-ui-muted)}
.sw-name-field{margin:18px 0}
.sw-editor-tabs{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.sw-editor-tabs button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;flex:0 1 auto;padding:8px 14px;border:1px solid transparent;border-radius:11px;background:transparent;color:var(--sw-ui-muted);text-align:left;transition:background .16s,color .16s,border-color .16s}
.sw-editor-tabs button:hover{background:color-mix(in srgb,var(--sw-ui-accent) 4%,transparent);color:var(--sw-ui-ink)}
.sw-editor-tabs button[aria-selected=true]{background:var(--sw-ui-card);border-color:var(--sw-ui-line);color:var(--sw-ui-ink)}
.sw-tab-title{font-size:12.5px;font-weight:600;line-height:1.5}
.sw-tab-hint{font-size:10px;line-height:1.5;opacity:.78;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.sw-panel-lead{font-size:11.5px;color:var(--sw-ui-muted);line-height:1.85;margin:0 0 16px}
.sw-tab-panel{padding:22px;border:1px solid var(--sw-ui-line);border-radius:14px;background:var(--sw-ui-card);min-width:0}
.sw-tab-panel[hidden]{display:none}
.sw-tab-panel>.sw-block-head:first-child{margin-top:0}
.sw-dropzone{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;box-sizing:border-box;margin:2px 0 15px;padding:26px 20px 24px;border:1.5px dashed color-mix(in srgb,var(--sw-ui-accent) 26%,var(--sw-ui-line));border-radius:16px;background:linear-gradient(180deg,color-mix(in srgb,var(--sw-ui-accent) 7%,var(--sw-ui-card)),color-mix(in srgb,var(--sw-ui-accent) 2%,var(--sw-ui-card)));color:var(--sw-ui-ink);text-align:center;cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
.sw-dropzone:hover{border-color:var(--sw-ui-accent);background:linear-gradient(180deg,color-mix(in srgb,var(--sw-ui-accent) 12%,var(--sw-ui-card)),color-mix(in srgb,var(--sw-ui-accent) 4%,var(--sw-ui-card)))}
.sw-dropzone:active{transform:scale(.995)}
.sw-dropzone--active{border-color:var(--sw-ui-accent);border-style:solid;background:color-mix(in srgb,var(--sw-ui-accent) 14%,var(--sw-ui-card))}
.sw-dropzone:disabled{cursor:progress;opacity:.75}
.sw-dropzone-icon{width:32px;height:32px;margin-bottom:4px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;color:var(--sw-ui-accent);opacity:.75}
.sw-dropzone strong{font-size:15px;font-weight:650;line-height:1.4}
.sw-dropzone-main{font-size:12px;color:var(--sw-ui-muted)}
.sw-dropzone small{font-size:10px;line-height:1.7;color:var(--sw-ui-muted)}
.sw-dropzone-note{opacity:.72}
.sw-savebar-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.sw-saved:empty{display:none}
.sw-block{margin-top:26px;padding-top:22px;border-top:1px solid var(--sw-ui-line);min-width:0}
.sw-block:first-of-type{margin-top:10px;padding-top:0;border-top:0}
.sw-block-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px}
.sw-block-index{flex:none;display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--sw-ui-line);border-radius:8px;background:var(--sw-ui-card);color:var(--sw-ui-muted);font-size:10px;font-weight:650;font-variant-numeric:tabular-nums}
.sw-block-copy{min-width:0}
.sw-block-copy h3{font-size:15px;font-weight:600;margin:0 0 4px;line-height:1.4}
.sw-block-copy p{font-size:11px;color:var(--sw-ui-muted);line-height:1.8;margin:0}
.sw-sub-head{margin-top:22px}
.sw-sub-head h4{font-size:12px;font-weight:600;margin:0 0 4px;color:var(--sw-ui-ink)}
.sw-mine-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
/* Starter presets are a compact, secondary grid inside 我的皮肤. */
.sw-saved,.sw-templates{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sw-templates .sw-card{padding:3px;border-radius:11px}
.sw-templates .sw-card-copy{padding:7px 4px 3px}
.sw-templates .sw-card-desc,.sw-templates .sw-card-tag{display:none}
.sw-templates .sw-card-name{font-size:11px}
.sw-templates .sw-mini--small{height:70px}
.sw-control-heading{margin-bottom:18px}
.sw-control-heading h3{font-size:14px;font-weight:600;margin:0 0 5px}
.sw-control-heading p{font-size:11px;color:var(--sw-ui-muted);line-height:1.8;margin:0}
.sw-theme-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.sw-theme-option{position:relative;display:flex;flex-direction:column;gap:2px;padding:7px;border:1px solid var(--sw-ui-line);border-radius:13px;color:var(--sw-ui-ink);background:var(--sw-ui-card);text-align:left;min-width:0;transition:transform .2s,border-color .2s,box-shadow .2s}
.sw-theme-option:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--sw-ui-accent) 45%,var(--sw-ui-line));box-shadow:0 8px 18px #0000000c}
.sw-theme-option[data-current=true]{border-color:var(--sw-ui-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--sw-ui-accent) 12%,transparent)}
.sw-theme-main{display:flex;flex-direction:column;gap:9px;width:100%;padding:0;border:0;background:none;color:inherit;text-align:left;min-width:0}
.sw-theme-kit{align-self:flex-start;margin:2px 5px 3px;padding:4px 9px;border:1px solid color-mix(in srgb,var(--sw-ui-accent) 26%,var(--sw-ui-line));border-radius:999px;background:transparent;color:var(--sw-ui-accent);font-size:10px;line-height:16px;transition:background .16s}
.sw-theme-kit:hover{background:color-mix(in srgb,var(--sw-ui-accent) 9%,var(--sw-ui-card))}
.sw-theme-preview{display:block;min-width:0}
.sw-theme-preview .sw-mini--small{height:104px;border-radius:9px}
.sw-theme-copy{display:flex;flex-direction:column;gap:3px;padding:0 5px 5px;min-width:0}
.sw-theme-name{display:flex;align-items:center;gap:6px;min-width:0}
.sw-theme-copy strong{font-size:12.5px;font-weight:600}
.sw-theme-copy small{font-size:10px;line-height:1.7;color:var(--sw-ui-muted)}

.sw-theme-copy{display:flex;flex:1;flex-direction:column;gap:4px;min-width:0}
.sw-theme-copy strong{font-size:12px;font-weight:600}
.sw-theme-copy small{font-size:10px;line-height:1.7;color:var(--sw-ui-muted)}
.sw-theme-check{width:12px;flex:none;font-size:11px;color:var(--sw-ui-accent)}
.sw-hint{font-size:11px;color:var(--sw-ui-muted);line-height:1.8;margin:13px 0 0}
.sw-hint--warn{padding:10px 12px;border:1px solid color-mix(in srgb,#cb8d30 35%,var(--sw-ui-line));background:color-mix(in srgb,#cb8d30 6%,var(--sw-ui-card));border-radius:9px;color:var(--sw-ui-ink)}
.sw-block>.sw-details{margin-top:18px}
.sw-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}
.sw-background-picker{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px;align-items:stretch}
.sw-background-picker .sw-bg-option span{height:54px}
.sw-background-current{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:10px 0 18px;font-size:11px;color:var(--sw-ui-muted)}
.sw-material-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px}
.sw-reading-control{padding:16px;border:1px solid var(--sw-ui-line);border-radius:12px;background:color-mix(in srgb,var(--sw-ui-accent) 3%,var(--sw-ui-card));min-width:0}
.sw-quick-opacity{margin-top:14px;gap:10px}
.sw-quick-opacity .sw-subtle{margin-right:2px}
.sw-reading-icon{display:block;margin-bottom:18px;font:600 26px/1.2 system-ui,sans-serif;letter-spacing:-.04em}
.sw-details>.sw-control-grid{margin-top:16px}
.sw-field{display:flex;flex-direction:column;gap:7px;min-width:0;color:var(--sw-ui-ink);font-size:12px}
.sw-field-title{display:flex;justify-content:space-between;align-items:center;gap:8px}
.sw-field :is(input[type=text],select){width:100%;min-width:0;height:36px;border:1px solid var(--sw-ui-line);border-radius:9px;background:var(--sw-ui-card);color:var(--sw-ui-ink);padding:6px 9px;font-size:12px}
.sw-field input[type=range]{display:block;width:100%;margin:2px 0;accent-color:var(--sw-ui-accent);height:18px;cursor:pointer}
.sw-field output{font-size:11px;color:var(--sw-ui-muted);font-variant-numeric:tabular-nums}
.sw-field:has(input:disabled){opacity:.5}
.sw-control-stack{display:grid;gap:15px}
.sw-bg-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:6px}
.sw-bg-option{display:flex;flex-direction:column;gap:6px;min-width:0;border:1px solid var(--sw-ui-line);border-radius:10px;padding:5px;background:var(--sw-ui-card);color:var(--sw-ui-muted);font-size:11px!important;line-height:16px;text-align:center;overflow:hidden;transition:border-color .16s,transform .16s}
.sw-bg-option span{display:block;height:56px;border-radius:7px;background-size:cover;background-position:center;box-shadow:inset 0 0 0 1px #00000010}
.sw-bg-option:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--sw-ui-accent) 45%,var(--sw-ui-line))}
.sw-bg-option[aria-pressed=true]{border-color:var(--sw-ui-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--sw-ui-accent) 12%,transparent);color:var(--sw-ui-ink)}
.sw-upload{width:100%;padding:12px 8px;border:1px dashed color-mix(in srgb,var(--sw-ui-accent) 45%,var(--sw-ui-line));border-radius:10px;background:color-mix(in srgb,var(--sw-ui-accent) 3%,var(--sw-ui-card));color:var(--sw-ui-accent);font-size:12px!important;display:flex;flex-direction:column;gap:3px;align-items:center}
.sw-upload small{font-size:9px;color:var(--sw-ui-muted)}
.sw-details{border-top:1px solid var(--sw-ui-line);padding-top:12px}
.sw-details summary{font-size:11px;color:var(--sw-ui-muted);cursor:pointer}
.sw-details>.sw-control-stack{margin-top:14px}
.sw-toggle{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--sw-ui-muted);cursor:pointer}
.sw-toggle input{accent-color:var(--sw-ui-accent);width:14px;height:14px}
.sw-savebar{display:flex;flex-direction:column;gap:12px;margin-top:20px;padding:16px 18px;border:1px solid var(--sw-ui-line);border-radius:14px;background:color-mix(in srgb,var(--sw-ui-accent) 3%,var(--sw-ui-card))}
.sw-savebar .sw-name-field{margin:0}
.sw-notice{display:flex;align-items:center;gap:10px;justify-content:space-between;border:1px solid var(--sw-ui-line);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.65;background:var(--sw-ui-card);color:var(--sw-ui-muted);overflow-wrap:anywhere;margin-top:12px}
.sw-notice--error{border-color:#d6606544;background:color-mix(in srgb,#da5362 5%,var(--sw-ui-card));color:var(--sw-ui-ink)}
.sw-notice--confirm{flex-wrap:wrap;border-color:color-mix(in srgb,var(--sw-ui-accent) 40%,var(--sw-ui-line))}
.sw-note{font-size:10px;line-height:1.8;color:var(--sw-ui-muted);margin:16px 0 0}
.sw-settings-section{color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui,sans-serif)}
.sw-settings-section>h2{font-size:16px;font-weight:500}
.sw-setting{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 12px;border-bottom:.5px solid var(--dsw-alias-border-l2);box-sizing:border-box;flex-wrap:wrap}
.sw-setting-copy{flex:1 1 200px;min-width:0;font-size:14px;line-height:20px}
.sw-setting-copy p{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);margin:4px 0 0}
.sw-setting button{font:14px/22px var(--dsw-font-family,system-ui,sans-serif);padding:6px 12px;border:0;border-radius:10px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);cursor:pointer}
.sw-livebar{position:fixed;z-index:950;right:16px;bottom:16px;max-width:calc(100vw - 32px);box-sizing:border-box;display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;color:#212b37;padding:12px 14px;border:1px solid #cdd4dc;border-radius:14px;box-shadow:0 12px 40px #0003;font:12px/18px system-ui,sans-serif}
.sw-livebar[hidden]{display:none}
.sw-livebar span{max-width:260px;overflow-wrap:anywhere}
.sw-livebar button{padding:6px 10px;background:#edf1f5;color:#243145;border:1px solid #d6dde6;border-radius:8px;font:inherit;cursor:pointer}
.sw-livebar .sw-livebar__keep{background:var(--bt-accent,var(--dsw-alias-brand-primary,#0f1115));border-color:transparent;color:var(--bt-accent-ink,var(--dsw-alias-label-primary-foreground,#fff))}
.sw-livebar small{flex-basis:100%;color:#b42335;font-size:11px}
body[data-ds-dark-theme] .sw-livebar{background:#242a34;color:#f0f3f7;border-color:#4c5665}
body[data-ds-dark-theme] .sw-livebar button{background:#343e4d;color:#f0f3f7;border-color:#5d6b7e}
body[data-ds-dark-theme] .sw-livebar .sw-livebar__keep{background:var(--bt-accent,var(--dsw-alias-brand-primary,#fafafa));border-color:transparent;color:var(--bt-accent-ink,var(--dsw-alias-label-primary-foreground,#0f1115))}
body[data-ds-dark-theme] .sw-livebar small{color:#ffacb3}
@container (max-width:800px){.sw-workspace{padding:4px 20px 32px}.sw-background-picker,.sw-material-controls{grid-template-columns:minmax(0,1fr);gap:16px}.sw-theme-options{grid-template-columns:minmax(0,1fr)}.sw-block{margin-top:20px;padding-top:18px}.sw-top{padding-left:20px;padding-right:20px}}
@container (max-width:600px){.sw-workspace{padding:4px 16px 28px}.sw-templates{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sw-card{border-radius:11px;padding:3px}.sw-card-copy{padding:7px 4px 3px}.sw-card-desc,.sw-card-tag{display:none}.sw-card-name{font-size:11px}.sw-mini--small{height:78px}.sw-saved{grid-template-columns:repeat(2,minmax(0,1fr))}.sw-top{padding-left:16px;padding-right:16px}.sw-title{font-size:23px}.sw-control-grid{grid-template-columns:minmax(0,1fr)}.sw-block-head{gap:9px}.sw-block-index{width:22px;height:22px;font-size:9px}.sw-recipe{gap:7px}.sw-recipe strong{font-size:11px}.sw-mini{height:270px}.sw-mini--small{height:78px}.sw-mini-inner{padding:9px;gap:8px}.sw-mini-side{padding:9px 5px}.sw-mini-nav{padding:7px 4px;font-size:9px}.sw-mini-title{padding:6px}.sw-mini-bubble{padding:8px;max-width:96%}.sw-savebar{position:static;border-top:1px solid var(--sw-ui-line);padding-top:16px}.sw-savebar .sw-actions{flex-wrap:wrap}}
@media (prefers-reduced-motion:reduce){.sw-page *{animation:none!important;transition:none!important}.sw-card:hover{transform:none}.sw-btn:active{transform:none}}
.sw-page[data-motion="off"] *{animation:none!important;transition:none!important}
.sw-page[data-motion="off"] .sw-card:hover,.sw-page[data-motion="off"] .sw-btn:active{transform:none}
@keyframes sw-enter{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

/* Background echo card: shows the picked image instead of a bare prompt. */
.sw-bgcard{display:grid;grid-template-columns:132px minmax(0,1fr);gap:14px;align-items:stretch;margin:2px 0 14px;padding:10px;border:1px solid var(--sw-ui-line);border-radius:14px;background:var(--sw-ui-card)}
.sw-bgcard-thumb{min-height:88px;border-radius:10px;background-size:cover;background-position:center;background-repeat:no-repeat;box-shadow:inset 0 0 0 1px #00000012}
.sw-bgcard-copy{display:flex;flex-direction:column;gap:4px;min-width:0;justify-content:center}
.sw-bgcard-copy strong{font-size:13px;font-weight:650}
.sw-bgcard-copy>span{font-size:11px;line-height:1.7;color:var(--sw-ui-muted)}
.sw-bgcard-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.sw-reading-control--top{margin-top:16px}
.sw-advanced{margin-top:18px}
.sw-more{flex:none;align-self:center}
.sw-more>summary{margin-top:0}
.sw-more-actions{margin-top:10px;gap:8px}
.sw-savebar-primary{margin-left:auto}
.sw-name-field{max-width:340px;margin:0}
.sw-bgcard--active{border-color:var(--sw-ui-accent);background:color-mix(in srgb,var(--sw-ui-accent) 6%,var(--sw-ui-card))}
.sw-applied{font-size:12px;color:var(--sw-ui-muted)}
.sw-notice{display:flex;align-items:center;gap:10px;justify-content:space-between}
.sw-savebar-head h3{font-size:13px;font-weight:650;margin:0 0 3px}
.sw-savebar-head p{font-size:11px;line-height:1.7;color:var(--sw-ui-muted);margin:0 0 4px}
.sw-savebar-secondary{margin-left:auto}
`
