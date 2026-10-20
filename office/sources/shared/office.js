/* BrowserOS Office shared chrome and document boundary. Included in each .beep. */
const Office = (() => {
  const style = document.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}body{margin:0;height:100vh;overflow:hidden;background:var(--bg,#101923);color:var(--text,#edf7ff);font:13px var(--font,system-ui,sans-serif)}
    :root{--office-island:var(--input-bg);--office-rim:color-mix(in srgb,var(--text) 12%,transparent);--office-selected:color-mix(in srgb,var(--accent) 18%,var(--input-bg))}
    button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}
    button,select,input:not([type=checkbox]):not([type=color]),textarea{border:1px solid var(--office-rim);border-radius:10px;background:var(--input-bg);padding:7px 10px;min-width:0}
    button{background:var(--hover);transition:background-color .18s,border-color .18s,box-shadow .18s,transform .14s}button:hover{border-color:var(--accent)}button:active:not(:disabled){transform:scale(.975)}
    button[aria-pressed=true],button.selected{background:var(--office-selected);border-color:color-mix(in srgb,var(--accent) 40%,var(--office-rim));box-shadow:inset 0 1px 0 #ffffff26,0 2px 5px #00102018}
    button.primary{background:var(--accent);color:white}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .office-app{height:100%;display:flex;flex-direction:column;min-width:0;min-height:0}.office-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:9px 12px;border-bottom:1px solid var(--office-rim);flex:none}
    .office-brand{font-weight:750;font-size:16px;margin-right:8px}.office-docname{margin-left:auto;color:var(--text-dim);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
    .office-tools{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 12px}.office-tools label{display:inline-flex;align-items:center;gap:5px;color:var(--text-dim);font-size:12px}.office-tools select{max-width:160px}
    .office-island{background:var(--office-island);border:1px solid var(--office-rim);border-radius:18px;box-shadow:inset 0 1px 0 #ffffff12,0 3px 9px #00081012}
    [data-office-glass=true] .office-tools{background:linear-gradient(135deg,#ffffff0c,transparent 65%)}
    .office-status{border-top:1px solid var(--office-rim);padding:6px 12px;font-size:11px;color:var(--text-dim);flex:none;min-height:27px}.office-workspace{display:flex;gap:12px;padding:12px;flex:1;min-height:0;min-width:0}
    .office-muted{color:var(--text-dim);font-size:12px;line-height:1.5}.office-field{display:flex;flex-direction:column;gap:5px;margin:10px 0}.office-field input,.office-field select,.office-field textarea{width:100%}.office-field textarea{resize:vertical;min-height:75px}
    .office-overlay{position:fixed;inset:0;background:#0008;display:grid;place-items:center;padding:18px;z-index:1000}.office-dialog{width:min(480px,100%);max-height:85vh;overflow:auto;padding:20px;background:var(--bg);border:1px solid var(--office-rim);border-radius:20px;box-shadow:0 18px 60px #0005}
    .office-dialog h2{font-size:18px;margin:0 0 14px}.office-dialog-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:16px}.office-dialog-list{display:flex;flex-direction:column;gap:6px;max-height:45vh;overflow:auto}.office-dialog-list button{text-align:left}
    .office-error{color:var(--text);padding:9px;border-left:3px solid #e56969;margin:8px 0;overflow-wrap:anywhere}.office-color{width:34px;height:30px;padding:2px;border:1px solid var(--office-rim);border-radius:8px;background:var(--input-bg)}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}button:active{transform:none!important}}
    [data-office-reduced=true] *,[data-office-reduced=true] *::before{animation:none!important;transition:none!important;scroll-behavior:auto!important}[data-office-reduced=true] button:active{transform:none!important}
    @media(forced-colors:active){.office-island,.office-dialog{background:Canvas;border-color:CanvasText;box-shadow:none}button[aria-pressed=true],button.selected{background:Highlight;color:HighlightText}}
  `;
  document.head.append(style);
  let theme = BOS.os.theme();
  function applyTheme(value) {
    theme = value || {};
    document.documentElement.dataset.officeGlass = String(theme.clearIce !== false && theme.transparency !== false);
    document.documentElement.dataset.officeReduced = String(theme.reduceMotion === true);
  }
  applyTheme(theme); BOS.on('themeChanged', applyTheme);
  const $ = (selector, root = document) => root.querySelector(selector);
  function node(tag, text, cls) { const el = document.createElement(tag); if (text != null) el.textContent = text; if (cls) el.className = cls; return el; }
  function button(text, action, cls) { const b = node('button', text, cls); b.type = 'button'; b.onclick = action; return b; }
  function field(label, input) { const wrap = node('label', null, 'office-field'); wrap.append(node('span', label), input); return wrap; }
  function modal(title, build, actions = []) {
    const previous = document.activeElement, overlay = node('div', null, 'office-overlay'), panel = node('section', null, 'office-dialog');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', title); panel.tabIndex = -1;
    const close = () => { overlay.remove(); if (previous?.isConnected) previous.focus(); };
    panel.append(node('h2', title)); const api = { panel, close };
    build(panel, api);
    const row = node('div', null, 'office-dialog-actions');
    for (const [label, action, primary] of actions) row.append(button(label, () => action(api), primary ? 'primary' : ''));
    panel.append(row); overlay.append(panel); document.body.append(overlay);
    overlay.addEventListener('keydown', event => {
      if(event.key === 'Escape'){event.preventDefault();event.stopPropagation();(api.cancel || close)();}
      if(event.key === 'Tab'){
        const items = [...panel.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
        if(!items.length){event.preventDefault();panel.focus();return;}
        const first=items[0],last=items.at(-1);
        if(event.shiftKey && (document.activeElement===first || document.activeElement===panel)){event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    });
    (panel.querySelector('input,select,textarea,button') || panel).focus(); return api;
  }
  function ask(title, message) { return new Promise(resolve => {
    const m=modal(title,p=>p.append(node('p',message,'office-muted')),[['Cancel',()=>finish(false)],['Continue',()=>finish(true),true]]);
    const finish=value=>{m.close();resolve(value);};m.cancel=()=>finish(false);
  }); }
  function prompt(title, label, value = '') { return new Promise(resolve => {
    const input=node('input');input.value=value;input.maxLength=100;
    const m=modal(title,p=>p.append(field(label,input)),[['Cancel',()=>finish(null)],['OK',()=>{if(input.value.trim())finish(input.value.trim());},true]]);
    const finish=value=>{m.close();resolve(value);};m.cancel=()=>finish(null);input.onkeydown=e=>{if(e.key==='Enter'&&input.value.trim())finish(input.value.trim());};input.select();
  }); }
  function error(message) { modal('Could not complete that', p=>p.append(node('p',String(message),'office-error')), [['Close',m=>m.close()]]); }
  async function pickFile(root, extensions, heading = 'Open a file') { return new Promise(resolve => {
    let folder=root, revision=0;
    const m=modal(heading,p=>{const list=node('div',null,'office-dialog-list');p.append(list);},[['Cancel',()=>finish(null)]]);
    const list=$('.office-dialog-list',m.panel), finish=value=>{m.close();resolve(value);};m.cancel=()=>finish(null);
    async function render(){
      const current=++revision;list.replaceChildren(node('p',folder,'office-muted'));
      try{const files=await BOS.fs.ls(folder);if(current!==revision||!list.isConnected)return;
        if(!Array.isArray(files))throw Error('Cannot read '+folder);
        if(folder!==root)list.append(button('↑ Parent folder',()=>{folder=folder.slice(0,folder.lastIndexOf('/'))||root;render();}));
        const matches=files.filter(f=>f.type==='dir'||extensions.some(ext=>f.name.toLowerCase().endsWith(ext)));
        if(!matches.length)list.append(node('p','No matching files here.','office-muted'));
        for(const f of matches)list.append(button((f.type==='dir'?'📁 ':'')+f.name,()=>{const path=folder+'/'+f.name;if(f.type==='dir'){folder=path;render();}else finish(path);}));
      }catch(e){list.append(node('p',e.message,'office-error'));}
    }render();
  }); }
  function filename(value, ext){const clean=String(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'').trim().slice(0,100);if(!clean)throw Error('Enter a file name');return clean.toLowerCase().endsWith(ext)?clean:clean+ext;}
  function decode(raw, format, latest){
    if(typeof raw!=='string'||raw.length>8_000_000)throw Error('This document is missing or too large');
    const data=JSON.parse(raw);if(!data||data.format!==format)throw Error('This is not a supported '+format.replace('browseros-','')+' document');
    if(!Number.isInteger(data.version)||data.version<1||data.version>latest)throw Error('This document requires a newer app version');return data;
  }
  // Native formats are versioned at this boundary. Future Office adapters must
  // translate into these models, never inject an imported UI or execute macros.
  function documentController({ext,format,version,serialize,load,reset,state}){
    let path=null,title='Untitled',dirty=false,busy=false,revision=0;
    const notify=message=>state({path,title,dirty,message});
    const api={get path(){return path;},get title(){return title;},get dirty(){return dirty;},touch(){revision++;dirty=true;notify();},notify,
      async save(as=false){if(busy)return;let target=path,name=title;
        if(as||!target){name=await prompt('Save '+ext.slice(1)+' document','Name',title==='Untitled'?'':title);if(!name)return;target='/Documents/'+filename(name,ext);}
        busy=true;notify('Saving…');try{
          const savedRevision=revision;
          const record=JSON.stringify({format,version,title:name.replace(new RegExp('\\'+ext+'$','i'),''),...serialize()});
          if(as||!path)target=await BOS.fs.writeUnique(target,record);else{const result=await BOS.fs.write(target,record);if(result!==null)throw Error(result?.error||'Save failed');}
          if(typeof target!=='string')throw Error('Save did not return a file path');path=target;title=path.split('/').pop().slice(0,-ext.length);dirty=revision!==savedRevision;notify('Saved '+path+(dirty?' · New edits remain unsaved':''));
        }catch(e){notify('Save failed');error(e.message);}finally{busy=false;}
      },
      async open(target){if(busy)return;if(dirty&&!await ask('Unsaved changes','Discard unsaved changes and open another document?'))return;
        target=target||await pickFile('/Documents',[ext]);if(!target)return;
        busy=true;try{const data=decode(await BOS.fs.read(target),format,version);await load(data);path=target;title=String(data.title||target.split('/').pop()).slice(0,100);dirty=false;notify('Opened '+target);}catch(e){error(e.message);}finally{busy=false;}
      },
      async new(){if(busy)return false;if(dirty&&!await ask('Unsaved changes','Discard unsaved changes and start a new document?'))return false;reset();path=null;title='Untitled';dirty=false;notify('New document');return true;},
    };return api;
  }
  function bindDocument(controller,openArgument=null){
    for(const [id,action] of [['new',()=>controller.new()],['open',()=>controller.open()],['save',()=>controller.save()],['saveas',()=>controller.save(true)]])$('#'+id).onclick=()=>Promise.resolve(action()).catch(e=>error(e.message));
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();controller.save(e.shiftKey);}});
    controller.notify();const args=BOS.os.args()||{};if(args.file||args.path)Promise.resolve(openArgument?openArgument(args.file||args.path):controller.open(args.file||args.path)).catch(e=>error(e.message));
  }
  async function imageData(path){
    if(typeof path!=='string'||!path.startsWith('/Pictures/'))throw Error('Choose a picture from /Pictures');
    const [raw,stat]=await Promise.all([BOS.fs.read(path),BOS.fs.stat(path)]);
    if(typeof raw!=='string'||raw.length>3_000_000)throw Error('Picture is missing or too large');
    if(/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(raw))return raw;
    if(!/^image\/(png|jpeg|gif|webp)$/.test(stat?.mime||'')||!/^[a-z0-9+/=\s]+$/i.test(raw))throw Error('Use a PNG, JPEG, GIF or WebP picture');
    return 'data:'+stat.mime+';base64,'+raw.replace(/\s/g,'');
  }
  return {$,node,button,field,modal,ask,prompt,error,pickFile,filename,decode,documentController,bindDocument,imageData,get theme(){return theme;}};
})();

