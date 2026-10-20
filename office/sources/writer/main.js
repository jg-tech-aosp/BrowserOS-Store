const W = Office;
const writerStyle=W.node('style');writerStyle.textContent=`
  .writer-wrap{flex:1;min-height:0;overflow:auto;padding:22px;background:var(--sidebar-bg)}
  .writer-page{max-width:820px;min-height:980px;margin:0 auto;padding:54px 64px;background:#fff;color:#202733;box-shadow:0 5px 22px #0003;border-radius:3px}
  #editor{min-height:850px;outline:none;font:16px/1.65 Georgia,serif;overflow-wrap:anywhere}#editor:empty:before{content:'Start writing…';color:#88909b;pointer-events:none}
  #editor p{margin:0 0 .65em}#editor h1,#editor h2,#editor h3{line-height:1.25;margin:.6em 0}#editor ul,#editor ol{padding-left:28px}#editor blockquote{margin:12px 0;padding-left:18px;border-left:3px solid #9ab5c8}
  #editor table{border-collapse:collapse;width:100%;margin:12px 0}#editor td,#editor th{border:1px solid #b6c4ce;min-width:35px;padding:8px;vertical-align:top}#editor img{max-width:100%;height:auto}
  .writer-find{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;border-bottom:1px solid var(--office-rim)}.writer-find[hidden]{display:none}.writer-find input{flex:1;min-width:100px}
  @media(max-width:620px){.writer-wrap{padding:10px}.writer-page{padding:26px 22px}.office-docname{display:none}}
`;
document.head.append(writerStyle);
document.body.innerHTML=`<main class="office-app">
  <header class="office-toolbar"><span class="office-brand">📝 Writer</span><button id="new">New</button><button id="open">Open</button><button id="save">Save</button><button id="saveas">Save As</button><button id="find-toggle">Find / Replace</button><button id="export-text">Export TXT</button><span id="docname" class="office-docname">Untitled</span></header>
  <div class="office-tools" role="toolbar" aria-label="Document formatting">
    <button data-cmd="undo" title="Undo">↶</button><button data-cmd="redo" title="Redo">↷</button>
    <select id="block" aria-label="Paragraph style"><option value="p">Paragraph</option><option value="h1">Title</option><option value="h2">Heading</option><option value="h3">Subheading</option><option value="blockquote">Quote</option></select>
    <select id="font" aria-label="Font"><option>Georgia</option><option>Arial</option><option>Verdana</option><option>Times New Roman</option><option>Courier New</option></select>
    <select id="size" aria-label="Font size"><option value="2">Small</option><option value="3" selected>Normal</option><option value="4">Large</option><option value="5">Larger</option><option value="6">Heading</option></select>
    <button data-cmd="bold" title="Bold" aria-pressed="false"><b>B</b></button><button data-cmd="italic" title="Italic" aria-pressed="false"><i>I</i></button><button data-cmd="underline" title="Underline" aria-pressed="false"><u>U</u></button><button data-cmd="strikeThrough" title="Strikethrough">S̶</button>
    <label>Text <input id="color" class="office-color" type="color" value="#202733"></label><label>Highlight <input id="highlight" class="office-color" type="color" value="#fff2a8"></label>
    <button data-cmd="justifyLeft" title="Align left">Left</button><button data-cmd="justifyCenter" title="Align center">Center</button><button data-cmd="justifyRight" title="Align right">Right</button>
    <button data-cmd="insertUnorderedList">• List</button><button data-cmd="insertOrderedList">1. List</button><button data-cmd="outdent" title="Decrease indent">⇤</button><button data-cmd="indent" title="Increase indent">⇥</button>
    <button id="link">Link</button><button id="table">Table</button><button id="picture">Picture</button><button data-cmd="removeFormat">Clear format</button>
  </div>
  <div class="writer-find" id="findbar" hidden><input id="find" placeholder="Find text" aria-label="Find text"><input id="replace" placeholder="Replace with" aria-label="Replacement text"><button id="find-next">Find next</button><button id="replace-one">Replace</button><button id="replace-all">Replace all</button><button id="find-close" aria-label="Close find bar">×</button></div>
  <section class="writer-wrap"><article class="writer-page"><div id="editor" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" aria-label="Document"></div></article></section>
  <footer id="status" class="office-status"></footer></main>`;
const editor=W.$('#editor');let selection=null,findOffset=0;
const fonts=new Set(['Georgia','Arial','Verdana','Times New Roman','Courier New']);
function cleanHTML(html){
  const parsed=new DOMParser().parseFromString(String(html),'text/html');
  const allowed=new Set(['A','B','BLOCKQUOTE','BR','DIV','EM','FONT','H1','H2','H3','HR','I','IMG','LI','OL','P','S','SPAN','STRIKE','STRONG','SUB','SUP','TABLE','TBODY','TD','TH','THEAD','TR','U','UL']);
  const banned=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','LINK','META','BASE','FORM','INPUT','BUTTON']);
  const walk=parent=>{for(const n of [...parent.childNodes]){
    if(n.nodeType===Node.COMMENT_NODE){n.remove();continue;}if(n.nodeType!==Node.ELEMENT_NODE)continue;
    if(banned.has(n.tagName)){n.remove();continue;}walk(n);
    if(!allowed.has(n.tagName)){n.replaceWith(...n.childNodes);continue;}
    const href=n.getAttribute('href'),src=n.getAttribute('src'),face=n.getAttribute('face'),size=n.getAttribute('size'),color=n.getAttribute('color');
    const styles={};for(const prop of ['color','background-color','text-align','font-weight','font-style','text-decoration','font-family','font-size']){const value=n.style.getPropertyValue(prop);if(value&&value.length<80&&!/url|expression|var\(|[<>]/i.test(value))styles[prop]=value;}
    for(const attr of [...n.attributes])n.removeAttribute(attr.name);
    for(const [prop,value]of Object.entries(styles)){
      if(prop==='font-family'&&!fonts.has(value.replace(/["']/g,'')))continue;
      if(prop==='font-size'&&!/^(?:[8-9]|[1-6][0-9]|7[0-2])(?:px|pt)$/.test(value))continue;
      n.style.setProperty(prop,value);
    }
    if(n.tagName==='A'&&href){try{const u=new URL(href);if(['https:','http:','mailto:'].includes(u.protocol))n.setAttribute('href',u.href);}catch{}}
    if(n.tagName==='IMG'){if(src&&src.length<3_000_000&&/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(src)){n.src=src;n.alt='Document picture';}else n.remove();}
    if(n.tagName==='FONT'){if(fonts.has(face))n.setAttribute('face',face);if(/^[1-7]$/.test(size||''))n.setAttribute('size',size);if(/^#[a-f0-9]{6}$/i.test(color||''))n.setAttribute('color',color);}
  }};walk(parsed.body);return parsed.body.innerHTML;
}
function stats(message){const text=editor.innerText,words=(text.trim().match(/\S+/g)||[]).length;W.$('#status').textContent=(message|| (doc.dirty?'Unsaved changes':doc.path||'New document'))+' · '+words+' words · '+text.length+' characters';}
const doc=W.documentController({ext:'.writer',format:'browseros-writer',version:2,
  serialize:()=>({html:cleanHTML(editor.innerHTML),page:{size:'A4',margin:54},metadata:{application:'Writer'}}),
  load(data){if(typeof data.html!=='string')throw Error('Document text is missing');const clean=cleanHTML(data.html);editor.innerHTML=clean;selection=null;findOffset=0;},
  reset(){editor.innerHTML='';selection=null;findOffset=0;},
  state({title,dirty,message}){W.$('#docname').textContent=title+(dirty?' •':'');stats(message);}
});
function remember(){const s=window.getSelection();if(s?.rangeCount&&editor.contains(s.getRangeAt(0).commonAncestorContainer))selection=s.getRangeAt(0).cloneRange();}
function restore(){editor.focus();if(selection&&editor.contains(selection.commonAncestorContainer)){const s=window.getSelection();s.removeAllRanges();s.addRange(selection);}}
function command(name,value=null){restore();document.execCommand(name,false,value);remember();doc.touch();syncFormatting();}
function syncFormatting(){for(const b of document.querySelectorAll('[data-cmd][aria-pressed]'))b.setAttribute('aria-pressed',String(document.queryCommandState(b.dataset.cmd)));}
document.addEventListener('selectionchange',()=>{remember();syncFormatting();});
for(const b of document.querySelectorAll('[data-cmd]')){b.onmousedown=e=>e.preventDefault();b.onclick=()=>command(b.dataset.cmd);}
for(const [id,cmd]of [['block','formatBlock'],['font','fontName'],['size','fontSize'],['color','foreColor'],['highlight','hiliteColor']])W.$('#'+id).onchange=e=>command(cmd,e.target.value);
editor.oninput=()=>{remember();doc.touch();};
editor.addEventListener('paste',e=>{e.preventDefault();const html=e.clipboardData.getData('text/html');if(html)command('insertHTML',cleanHTML(html));else command('insertText',e.clipboardData.getData('text/plain'));});
editor.addEventListener('drop',e=>e.preventDefault());
W.$('#link').onclick=async()=>{remember();const url=await W.prompt('Insert link','Web or email URL','https://');if(!url)return;try{const u=new URL(url);if(!['http:','https:','mailto:'].includes(u.protocol))throw Error('Use a web or email link');command('createLink',u.href);}catch(e){W.error(e.message);}};
W.$('#table').onclick=()=>{remember();const rows=W.node('input'),cols=W.node('input');rows.type=cols.type='number';rows.min=cols.min='1';rows.max='20';cols.max='10';rows.value='3';cols.value='3';W.modal('Insert table',p=>p.append(W.field('Rows (1–20)',rows),W.field('Columns (1–10)',cols)),[['Cancel',m=>m.close()],['Insert',m=>{const r=Number(rows.value),c=Number(cols.value);if(!Number.isInteger(r)||!Number.isInteger(c)||r<1||r>20||c<1||c>10)return;command('insertHTML','<table><tbody>'+Array.from({length:r},()=>'<tr>'+ '<td><br></td>'.repeat(c)+'</tr>').join('')+'</tbody></table><p><br></p>');m.close();},true]]);};
W.$('#picture').onclick=async()=>{remember();try{const path=await W.pickFile('/Pictures',['.png','.jpg','.jpeg','.gif','.webp'],'Insert a picture');if(!path)return;const url=await W.imageData(path);command('insertImage',url);}catch(e){W.error(e.message);}};
function textNodes(){const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT),nodes=[];let n;while(n=walker.nextNode())nodes.push(n);return nodes;}
function findNext(){const query=W.$('#find').value;if(!query)return;const nodes=textNodes(),text=nodes.map(n=>n.data).join('');let index=text.toLowerCase().indexOf(query.toLowerCase(),findOffset);if(index<0)index=text.toLowerCase().indexOf(query.toLowerCase());if(index<0){stats('No matches');return;}let start=null,end=null,offset=0;for(const n of nodes){if(start===null&&index<offset+n.length)start=[n,index-offset];if(index+query.length<=offset+n.length){end=[n,index+query.length-offset];break;}offset+=n.length;}
  if(!start||!end)return;const range=document.createRange();range.setStart(...start);range.setEnd(...end);selection=range;restore();findOffset=index+query.length;start[0].parentElement.scrollIntoView({block:'nearest'});stats('Match found');
}
W.$('#find-toggle').onclick=()=>{W.$('#findbar').hidden=false;W.$('#find').focus();};W.$('#find-close').onclick=()=>W.$('#findbar').hidden=true;W.$('#find').oninput=()=>findOffset=0;W.$('#find-next').onclick=findNext;
W.$('#replace-one').onclick=()=>{const q=W.$('#find').value;if(!q)return;if(!selection||selection.toString().toLowerCase()!==q.toLowerCase())findNext();if(selection?.toString().toLowerCase()===q.toLowerCase()){command('insertText',W.$('#replace').value);findOffset=0;findNext();}};
W.$('#replace-all').onclick=()=>{const query=W.$('#find').value;if(!query)return;const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp(escaped,'gi');let count=0;const copy=editor.cloneNode(true),walker=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())n.data=n.data.replace(pattern,()=>{count++;return W.$('#replace').value;});if(count){selection=document.createRange();selection.selectNodeContents(editor);command('insertHTML',cleanHTML(copy.innerHTML));}findOffset=0;stats('Replaced '+count+' matches');};
W.$('#export-text').onclick=async()=>{const name=await W.prompt('Export plain text','File name',doc.title);if(!name)return;try{const path=await BOS.fs.writeUnique('/Documents/'+W.filename(name,'.txt'),editor.innerText);stats('Exported '+path);}catch(e){W.error(e.message);}};
W.bindDocument(doc);editor.focus();

