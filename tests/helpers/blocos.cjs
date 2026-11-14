// Extrai blocos de código do script principal e calcula uma impressão digital (SHA-256) de cada um.
// Usado para provar que a modernização visual não alterou lógica de negócio.
const crypto=require('node:crypto');

// Caracteres depois dos quais uma "/" inicia uma expressão regular (e não uma divisão).
const ANTES_DE_REGEX='(,=:[!&|?{};+-*%<>~^\n';

// Acha o fim de um bloco { ... } a partir da chave de abertura, ignorando strings, regex e comentários.
function fimDoBloco(t,abre){
  let n=0;
  for(let i=abre;i<t.length;i++){
    const c=t[i], d=t[i+1];
    if(c==='/'&&d==='/'){ i=t.indexOf('\n',i); if(i<0) return t.length; continue; }
    if(c==='/'&&d==='*'){ i=t.indexOf('*/',i+2)+1; continue; }
    if(c==='/'){ let j=i-1; while(j>=0&&(t[j]===' '||t[j]==='\t')) j--; if(j<0||ANTES_DE_REGEX.includes(t[j])||/\b(return|typeof|in|of)$/.test(t.slice(Math.max(0,j-6),j+1))){ i=pularRegex(t,i+1); continue; } }
    if(c==='"'||c==="'"){ for(i++;i<t.length&&t[i]!==c&&t[i]!=='\n';i++) if(t[i]==='\\') i++; continue; }
    if(c==='`'){ i=pularTemplate(t,i+1); continue; }
    if(c==='{') n++;
    else if(c==='}'){ n--; if(n===0) return i+1; }
  }
  return t.length;
}
function pularRegex(t,i){
  let classe=false;
  for(;i<t.length&&t[i]!=='\n';i++){
    const c=t[i];
    if(c==='\\'){ i++; continue; }
    if(c==='[') classe=true; else if(c===']') classe=false;
    else if(c==='/'&&!classe) return i;
  }
  return i;
}
// Percorre um template literal até o ` final, entrando em ${...} recursivamente.
function pularTemplate(t,i){
  for(;i<t.length;i++){
    const c=t[i];
    if(c==='\\'){ i++; continue; }
    if(c==='`') return i;
    if(c==='$'&&t[i+1]==='{'){ i=fimDoBloco(t,i+1)-1; }
  }
  return t.length;
}

// Métodos de primeiro nível dentro de um objeto { a(){...}, async b(){...} }
function metodos(bloco,prefixo,out){
  for(const m of bloco.matchAll(/^ {2}(?:async )?([A-Za-z0-9_$]+)\s*\([^)\n]*\)\s*\{/gm)){
    const abre=bloco.indexOf('{',m.index+m[0].length-1);
    let k=prefixo+'.'+m[1],j=2; while(out[k]) k=prefixo+'.'+m[1]+'#'+(j++);
    out[k]=bloco.slice(m.index,fimDoBloco(bloco,abre));
  }
}

function blocos(codigo){
  codigo=codigo.replace(/\r\n?/g,'\n');
  const out={};
  const add=(nome,ini)=>{ const abre=codigo.indexOf('{',ini); const fim=fimDoBloco(codigo,abre); let k=nome,j=2; while(out[k]) k=nome+'#'+(j++); out[k]=codigo.slice(ini,fim); return out[k]; };
  for(const m of codigo.matchAll(/^(?:async )?function ([A-Za-z0-9_$]+)\s*\(/gm)) add('function '+m[1],m.index);
  for(const m of codigo.matchAll(/^const (Store|ACT|CRUD)\s*=\s*\{/gm)){ const b=add('const '+m[1],m.index); delete out['const '+m[1]]; metodos(b,m[1],out); }
  for(const m of codigo.matchAll(/^Object\.assign\((ACT|CRUD|Store)\s*,\s*\{/gm)){ const abre=codigo.indexOf('{',m.index); metodos(codigo.slice(m.index,fimDoBloco(codigo,abre)),m[1],out); }
  for(const m of codigo.matchAll(/^document\.addEventListener\("([a-z]+)"/gm)) add('listener '+m[1],m.index);
  for(const m of codigo.matchAll(/^const (missing|fields|readFields|podeChegar|exigeLocal|raioDe|geoOf|regInfo|distM)\s*=/gm)){
    const fim=codigo.indexOf('\n',m.index); out['const '+m[1]]=codigo.slice(m.index,fim);
  }
  return out;
}

const scriptPrincipal=html=>[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const FIREBASE_CONFIG'));
const hash=t=>crypto.createHash('sha256').update(t).digest('hex').slice(0,16);
function digitais(html){ const b=blocos(scriptPrincipal(html)); return Object.fromEntries(Object.entries(b).map(([k,v])=>[k,hash(v)]).sort()); }

module.exports={digitais,blocos,scriptPrincipal};
