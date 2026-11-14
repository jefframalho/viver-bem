// Testes da Entrega 3c: selos de situação, selo "Exemplo" e apresentação das datas.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {definicoes}=require('./helpers/estados.cjs');

const html=readFileSync('public/index.html','utf8');
const cssBruto=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
const css=cssBruto.replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

// ---------- Estados de negócio intactos ----------
test('estados, rótulos e classes de situação idênticos ao commit-base',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/estados-base.json','utf8')).definicoes;
  const atual=definicoes(html);
  for(const k of Object.keys(base)) assert.equal(atual[k],base[k],`definição alterada: ${k}`);
});

test('nenhuma classe de selo nova foi criada (só as 6 existentes)',()=>{
  const usadas=new Set([...html.matchAll(/\bpill (p-[a-z]+)/g)].map(m=>m[1]));
  for(const m of html.matchAll(/"(p-[a-z]+)"\]/g)) usadas.add(m[1]);
  assert.deepEqual([...usadas].sort(),['p-bad','p-blue','p-cop','p-mute','p-ok','p-warn']);
});

// ---------- Aparência dos selos ----------
test('selos com altura padronizada, ponto colorido e contorno suave',()=>{
  const p=decl('.pill');
  assert.match(p,/height:22px/); assert.match(p,/display:inline-flex/); assert.match(p,/white-space:nowrap/);
  assert.match(decl('.pill::before'),/border-radius:50%/);
  assert.match(decl('.p-mute::before'),/display:none/,'cancelado/inativo sem ponto (neutro)');
});

// Contraste WCAG de cada selo (texto sobre fundo), no claro e no escuro
const lum=h=>{const c=h.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const contraste=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05);};
const bloco=ini=>{const a=cssBruto.indexOf(ini);assert.ok(a>=0,ini);return cssBruto.slice(a,cssBruto.indexOf('}',a));};
const tokens=t=>{const o={};for(const m of t.matchAll(/--([a-z0-9-]+):([^;]+);/g))o[m[1]]=m[2].trim();return o;};
const resolve=(t,v)=>{for(let i=0;i<5&&/^var\(/.test(v);i++) v=t[v.match(/var\(--([a-z0-9-]+)\)/)[1]];return v;};
const SELOS={'p-ok':['st-ok-ink','ok-bg'],'p-warn':['st-warn-ink','warn-bg'],'p-bad':['st-bad-ink','bad-bg'],'p-blue':['st-info-ink','info-bg'],'p-cop':['st-prog-ink','copper-soft'],'p-mute':['st-mute-ink','st-mute-bg']};

test('todos os selos atendem WCAG AA (4,5:1) no claro e no escuro',()=>{
  const claro=tokens(bloco(':root{'));
  const escuro={...claro,...tokens(bloco(':root[data-theme="dark"]{'))};
  const falhas=[];
  for(const [nome,t] of [['claro',claro],['escuro',escuro]]) for(const [sel,[ink,bg]] of Object.entries(SELOS)){
    const r=contraste(resolve(t,`var(--${ink})`),resolve(t,`var(--${bg})`));
    if(r<4.5) falhas.push(`${nome} ${sel}: ${r.toFixed(2)}:1`);
  }
  assert.deepEqual(falhas,[]);
  // As classes usam de fato esses pares
  for(const [sel,[ink,bg]] of Object.entries(SELOS)){ const d=decl('.'+sel); assert.match(d,new RegExp(`color:var\\(--${ink}\\)`)); assert.match(d,new RegExp(`background:var\\(--${bg}\\)`)); }
});

test('modo escuro também usa os pares de selo dentro de @media (prefers-color-scheme:dark)',()=>{
  const m=cssBruto.match(/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\}\}/);
  assert.ok(m,'bloco escuro automático'); for(const k of ['st-ok-ink','st-prog-ink','st-mute-bg']) assert.match(m[1],new RegExp('--'+k+':'));
});

// ---------- Selo "Exemplo" ----------
test('selo "Exemplo" discreto, sem mudar o modo demonstração',()=>{
  const d=decl('.ex');
  assert.match(d,/font-weight:500/); assert.match(d,/dashed/); assert.match(d,/text-transform:lowercase/);
  assert.match(decl('.ex::first-letter'),/text-transform:uppercase/);
  assert.match(html,/const ex = o => o\?\.exemplo \? '<span class="ex">EXEMPLO<\/span>' : "";/);
});

// ---------- Datas ----------
test('datas por extenso: só a primeira letra maiúscula, sem "capitalize"',()=>{
  assert.doesNotMatch(html,/text-transform:capitalize/);
  assert.match(decl('.data-dia::first-letter'),/text-transform:uppercase/);
  // Datas que abrem um título ou linha usam a classe (8 pontos no sistema)
  assert.equal((html.match(/class="data-dia">\$\{(nx\?`\$\{)?fmtDayW\(/g)||[]).length,8);
});

test('::first-letter não é anulado por flex/grid nos títulos de cartão',()=>{
  // .card > h2 é flex; o título de data precisa voltar a ser bloco para a primeira letra funcionar
  assert.match(decl('.card>h2.data-dia'),/display:block/);
  assert.match(decl('span.data-dia'),/display:inline-block/);
});

test('a formatação da data em si não mudou (valor original, fuso e cálculo)',()=>{
  const linha=definicoes(html).fmtDayW;
  const c={}; vm.createContext(c); vm.runInContext(linha.replace(/^const /,'globalThis.')+';',c);
  const texto=c.fmtDayW('2026-11-12');
  assert.equal(texto,'quinta-feira, 12 de novembro');
  // O CSS só muda a primeira letra na tela:
  assert.equal(texto[0].toUpperCase()+texto.slice(1),'Quinta-feira, 12 de novembro');
});
