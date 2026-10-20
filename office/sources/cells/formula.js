/* A bounded formula grammar. No eval, Function, property access, or networking. */
const CellsFormula = (()=>{
  const fail=code=>{throw Error(code);};
  function column(text){let n=0;for(const c of text.toUpperCase())n=n*26+c.charCodeAt(0)-64;return n-1;}
  function address(text){const m=/^\$?([A-Z]{1,3})\$?([1-9]\d*)$/i.exec(text);if(!m)fail('#REF!');return{r:Number(m[2])-1,c:column(m[1])};}
  function parse(source){
    if(source.length>2000)fail('#LIMIT!');let i=0,tokens=[];
    while(i<source.length){const rest=source.slice(i);let m;if(/^\s/.test(rest)){i++;continue;}
      if(m=/^(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_]*))!(\$?[A-Z]{1,3}\$?[1-9]\d*)/i.exec(rest)){tokens.push({type:'ref',sheet:(m[1]?.replace(/''/g,"'")||m[2]),...address(m[3])});}
      else if(m=/^(\$?[A-Z]{1,3}\$?[1-9]\d*)(?![A-Za-z0-9_])/i.exec(rest)){tokens.push({type:'ref',sheet:null,...address(m[1])});}
      else if(m=/^(\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest)){tokens.push({type:'literal',value:Number(m[0])});}
      else if(m=/^"((?:[^"]|"")*)"/.exec(rest)){tokens.push({type:'literal',value:m[1].replace(/""/g,'"')});}
      else if(m=/^[A-Za-z_][A-Za-z0-9_]*/.exec(rest)){tokens.push({type:'name',value:m[0].toUpperCase()});}
      else if(m=/^(<=|>=|<>|[+\-*/^&=<>():,%])/.exec(rest)){tokens.push({type:m[0]});}
      else fail('#ERROR!');i+=m[0].length;if(tokens.length>512)fail('#LIMIT!');
    }
    let p=0,depth=0;const peek=()=>tokens[p]?.type,take=type=>{if(peek()!==type)fail('#ERROR!');return tokens[p++];};
    function primary(){if(++depth>64)fail('#LIMIT!');let n;
      if(peek()==='literal')n=tokens[p++];
      else if(peek()==='ref'){n=tokens[p++];if(peek()===':'){p++;const end=take('ref');n={type:'range',start:n,end};}}
      else if(peek()==='name'){const name=tokens[p++].value;if(name==='TRUE'||name==='FALSE')n={type:'literal',value:name==='TRUE'};else{take('(');const args=[];if(peek()!==')'){do{args.push(expression());if(peek()!==',')break;p++;}while(true);}take(')');n={type:'call',name,args};}}
      else if(peek()==='('){p++;n=expression();take(')');}else fail('#ERROR!');
      while(peek()==='%'){p++;n={type:'binary',op:'/',a:n,b:{type:'literal',value:100}};}depth--;return n;
    }
    function unary(){if(peek()==='+'||peek()==='-'){const op=tokens[p++].type;return{type:'unary',op,a:unary()};}return primary();}
    function power(){const a=unary();if(peek()==='^'){p++;return{type:'binary',op:'^',a,b:power()};}return a;}
    function level(next,ops){let a=next();while(ops.includes(peek())){const op=tokens[p++].type;a={type:'binary',op,a,b:next()};}return a;}
    const product=()=>level(power,['*','/']),sum=()=>level(product,['+','-']),concat=()=>level(sum,['&']);
    function expression(){return level(concat,['=','<>','<','>','<=','>=']);}
    const tree=expression();if(p!==tokens.length)fail('#ERROR!');return tree;
  }
  const num=value=>{if(value===''||value==null)return 0;if(typeof value==='boolean')return Number(value);if(typeof value==='number')return value;if(typeof value==='string'&&value.trim()!==''&&Number.isFinite(Number(value)))return Number(value);fail('#VALUE!');};
  function evaluate(tree,read,range,tick){
    tick();const run=n=>evaluate(n,read,range,tick),flat=values=>values.flat(Infinity);
    if(tree.type==='literal')return tree.value;
    if(tree.type==='ref')return read(tree);
    if(tree.type==='range')return range(tree);
    if(tree.type==='unary')return(tree.op==='-'?-1:1)*num(run(tree.a));
    if(tree.type==='binary'){
      const a=run(tree.a),b=run(tree.b);if(Array.isArray(a)||Array.isArray(b))fail('#VALUE!');
      if(tree.op==='&')return String(a??'')+String(b??'');
      if(['=','<>','<','>','<=','>='].includes(tree.op)){const x=typeof a==='string'?a.toLowerCase():a,y=typeof b==='string'?b.toLowerCase():b;return({'=':()=>x===y,'<>':()=>x!==y,'<':()=>x<y,'>':()=>x>y,'<=':()=>x<=y,'>=':()=>x>=y}[tree.op])();}
      const x=num(a),y=num(b);if(tree.op==='/'&&y===0)fail('#DIV/0!');const value=({'+':()=>x+y,'-':()=>x-y,'*':()=>x*y,'/':()=>x/y,'^':()=>x**y}[tree.op])();if(!Number.isFinite(value))fail('#NUM!');return value;
    }
    if(tree.type==='call'){
      const args=tree.args;
      if(tree.name==='IF'){if(args.length<2||args.length>3)fail('#VALUE!');return run(args[0])?run(args[1]):args[2]?run(args[2]):false;}
      const values=flat(args.map(run)),numbers=values.filter(v=>typeof v==='number');
      switch(tree.name){case'SUM':return numbers.reduce((a,b)=>a+b,0);case'AVERAGE':if(!numbers.length)fail('#DIV/0!');return numbers.reduce((a,b)=>a+b,0)/numbers.length;case'MIN':return numbers.length?Math.min(...numbers):0;case'MAX':return numbers.length?Math.max(...numbers):0;case'COUNT':return numbers.length;case'COUNTA':return values.filter(v=>v!==''&&v!=null).length;case'ABS':if(values.length!==1)fail('#VALUE!');return Math.abs(num(values[0]));case'ROUND':{if(values.length!==2)fail('#VALUE!');const places=num(values[1]);if(!Number.isInteger(places)||Math.abs(places)>12)fail('#NUM!');const k=10**places,x=num(values[0]);return Math.sign(x)*Math.round(Math.abs(x)*k)/k;}case'AND':return values.every(Boolean);case'OR':return values.some(Boolean);case'NOT':if(values.length!==1)fail('#VALUE!');return!values[0];default:fail('#NAME?');}
    }fail('#ERROR!');
  }
  function engine(workbook){
    const cache=new Map(),visiting=new Set();let budget=120000,depth=0;
    const tick=()=>{if(--budget<0)fail('#LIMIT!');};
    function sheetFor(name,current){if(!name)return current;const found=workbook.sheets.find(s=>s.name.toLowerCase()===name.toLowerCase());if(!found)fail('#REF!');return found;}
    function readCell(sheet,r,c){tick();if(r<0||c<0||r>=sheet.rows||c>=sheet.cols)fail('#REF!');const key=sheet.id+':'+r+':'+c;if(cache.has(key)){const hit=cache.get(key);if(hit.error)fail(hit.error);return hit.value;}if(visiting.has(key))fail('#CYCLE!');if(++depth>128){depth--;fail('#LIMIT!');}visiting.add(key);
      try{const raw=sheet.cells[r+','+c]?.raw||'';let value=raw;
        if(raw.startsWith('=')){const ast=parse(raw.slice(1));value=evaluate(ast,ref=>readCell(sheetFor(ref.sheet,sheet),ref.r,ref.c),ref=>{const target=sheetFor(ref.start.sheet,sheet),endTarget=sheetFor(ref.end.sheet||ref.start.sheet,sheet);if(target!==endTarget)fail('#REF!');const result=[];const r1=Math.min(ref.start.r,ref.end.r),r2=Math.max(ref.start.r,ref.end.r),c1=Math.min(ref.start.c,ref.end.c),c2=Math.max(ref.start.c,ref.end.c);if((r2-r1+1)*(c2-c1+1)>10400)fail('#LIMIT!');for(let y=r1;y<=r2;y++)for(let x=c1;x<=c2;x++)result.push(readCell(target,y,x));return result;},tick);if(Array.isArray(value))fail('#VALUE!');}
        else if(raw.startsWith("'"))value=raw.slice(1);else if(raw.trim()!==''&&Number.isFinite(Number(raw)))value=Number(raw);else if(/^(true|false)$/i.test(raw.trim()))value=raw.trim().toLowerCase()==='true';
        if(typeof value==='number'&&!Number.isFinite(value))fail('#NUM!');
        cache.set(key,{value});return value;
      }catch(e){const error=/^#[A-Z0-9/?!]+$/.test(e.message)?e.message:'#ERROR!';cache.set(key,{error});throw Error(error);}finally{visiting.delete(key);depth--;}
    }
    return{value(sheet,r,c){try{return{value:readCell(sheet,r,c)};}catch(e){return{value:e.message,error:true};}}};
  }
  return{engine,address};
})();

