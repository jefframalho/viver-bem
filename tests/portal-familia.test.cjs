// Testes da Entrega 8: portal do paciente/família (somente CSS; permissões e lógica intactas).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {digitais}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

test('telas da família: lógica idêntica (agenda/início só ganharam a classe de data na 3c)',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
  const atual=digitais(html);
  for(const k of ['function pgFamServicos','function pgFamTele','function pgFamMed','function pgFamCuidado','function acompanharAvisosFamilia'])
    if(k in base) assert.equal(atual[k],base[k],k+' alterado');
});
test('rotas e menu da família inalterados',()=>{
  assert.match(html,/const FAM = \{inicio:pgFamInicio, servicos:pgFamServicos, teleconsulta:pgFamTele, agenda:pgFamAgenda, medicoes:pgFamMed, cuidado:pgFamCuidado\};/);
  assert.match(html,/const FAM_NAV = \[\["inicio","Início"\],\["servicos","Serviços"\],\["teleconsulta","Teleconsultas"\],\["agenda","Agenda"\],\["medicoes","Minhas medições"\],\["cuidado","Plano e relatórios"\]\];/);
});
test('etiquetas em listas quebram linha em vez de estourar o cartão',()=>{
  const d=decl('.chips>.pill');
  assert.match(d,/white-space:normal/); assert.match(d,/max-width:100%/); assert.match(d,/height:auto/);
});
