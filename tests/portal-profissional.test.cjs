// Testes da Entrega 7: portal do profissional (somente CSS; chegada/saída intactas).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {digitais}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

test('telas do profissional: lógica idêntica (exceto data em pgMeus, já autorizada)',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
  const atual=digitais(html);
  for(const k of ['function pgMeusPacientes','function pgDisponibilidade','function pgRotasProf','function pgTeleProf','function pgMensagens','function pgPagamentos','function pgPerfil','ACT.checkin','ACT.checkout','function podeChegar'])
    if(k in base) assert.equal(atual[k],base[k],k+' alterado');
});
test('plantão de agora em destaque com barra azul',()=>{
  assert.match(decl('.agora'),/box-shadow:inset 4px 0 0 var\(--blue\)/);
});
test('atalhos em grade 2x2 compacta no celular, com foco visível',()=>{
  assert.ok(R.some(r=>r.sel==='.atalhos'&&/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(r.dec)));
  assert.match(decl('.atalho:focus-visible'),/outline:2px solid var\(--focus\)/);
});
