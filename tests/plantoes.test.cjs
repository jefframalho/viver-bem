// Testes da Entrega 3e: linhas de plantão, modal de plantão e cartões de pacientes (só CSS).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {digitais}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');
const midia=(inicio)=>{const a=css.indexOf(inicio);assert.ok(a>=0,inicio);let n=0,i=css.indexOf('{',a);for(;i<css.length;i++){if(css[i]==='{')n++;else if(css[i]==='}'&&--n===0)break;}return css.slice(a,i+1);};

test('marcação de plantões, modal, chegada/saída, evolução e assinatura idêntica ao commit-base',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
  const atual=digitais(html);
  for(const k of ['function shiftRow','function plantaoView','ACT.plantao','ACT.checkin','ACT.checkout','ACT.saveEvo','function readEvo','function readEvoBase'])
    if(k in base) assert.equal(atual[k],base[k],k+' foi alterado');
});

test('linha de plantão: foco visível e coluna de horário sem quebrar "(+1)" no desktop',()=>{
  assert.match(decl('.shift'),/grid-template-columns:minmax\(120px,max-content\)/);
  assert.match(decl('.shift:focus-visible'),/outline:2px solid var\(--focus\)/);
});

test('celular: horário/situação em cima e paciente embaixo (pendências sem texto espremido)',()=>{
  const m=[...css.matchAll(/@media \(max-width:720px\)\{\n  \.shift\{[\s\S]*?\n\}/g)].map(x=>x[0]).join('');
  assert.match(m,/grid-template-areas:"t s" "w w"/);
  assert.match(m,/\.shift \.w b\{white-space:normal;overflow:visible\}/,'nome do paciente não é cortado');
  assert.match(m,/\.shift \.t small:first-child\{display:inline/,'data ao lado do horário');
  assert.match(m,/\.shift \.t small:last-child\{display:block/,'modalidade na linha de baixo');
});

test('modal de plantão: cartões aninhados viram seções; chegada/saída fixas no rodapé no celular',()=>{
  assert.match(decl('.modal-b .card'),/border:0;border-top:1px solid var\(--line\)/);
  assert.match(decl('.modal-b .card'),/background:transparent!important/);
  assert.match(decl('.modal-b details>summary'),/min-height:44px/);
  assert.ok(R.some(r=>r.sel.startsWith('.modal-b>.actions:has([data-act="checkin"],[data-act="checkout"])')&&/position:sticky;bottom:0/.test(r.dec)),'barra fixa só para ações de campo');
});

test('tarefas do plantão: compactas no desktop e 44px no toque',()=>{
  assert.match(decl('.tarefas li'),/min-height:36px/);
  assert.ok(R.some(r=>r.sel==='.tarefas li'&&/min-height:44px/.test(r.dec)),'44px no celular');
});

test('cartão de paciente do profissional com foco visível',()=>{
  assert.match(decl('a.pacard:focus-visible'),/outline:2px solid var\(--focus\)/);
});
