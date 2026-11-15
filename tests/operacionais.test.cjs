// Testes da Entrega 5: telas operacionais (somente CSS).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

test('listas de plantões com coluna de horário fixa no desktop (nomes alinhados)',()=>{
  assert.match(css,/@media \(min-width:721px\)\{\.shift\{grid-template-columns:148px minmax\(0,1fr\) auto\}\}/);
});
test('indicador de alerta em âmbar de atenção (não cobre)',()=>{
  assert.match(decl('.kpi.alert'),/background:var\(--warn-bg\)/);
  assert.doesNotMatch(decl('.kpi.alert'),/copper/);
});
test('fichas: caminho de volta com área de toque confortável',()=>{
  assert.match(decl('.pagehead .small a'),/min-height:28px/);
  assert.ok(R.some(r=>r.sel==='.pagehead .small a'&&/min-height:36px/.test(r.dec)),'36px no celular');
});
test('busca e filtros em largura total no celular; rótulos de gráficos legíveis',()=>{
  assert.ok(R.some(r=>r.sel==='.toolbar input,.toolbar select'&&/flex-basis:100%/.test(r.dec)));
  assert.match(decl('.trend svg text'),/font-size:11px!important/);
});
