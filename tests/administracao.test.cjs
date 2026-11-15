// Testes da Entrega 6: financeiro e administração (somente CSS).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {digitais}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

test('telas financeiras e administrativas: lógica idêntica ao commit-base',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
  const atual=digitais(html);
  const fin=Object.keys(base).filter(k=>/function (pg(Fin|Despesas|Adiant|Folha|Extrato|Conciliacao|DRE|PreFat|FatLotes|OpANS|Tuss|MapTuss|Protocolos|RelTISS|Estoque|Inventario|Centros|Frequencia|Conferencia|Relatorios|Contratos|Funcionarios|Auditoria|Config)|folhaTabela|projecaoCaixa|loteView)/.test(k));
  assert.ok(fin.length>=15,'funções financeiras/administrativas encontradas: '+fin.length);
  const mudaram=fin.filter(k=>atual[k]!==base[k]&&k!=='function pgConciliacao');
  assert.deepEqual(mudaram,[],'alteradas: '+mudaram.join(', '));
});
test('auditoria: item selecionado em azul de seleção; abas com foco visível',()=>{
  assert.match(decl('.aud-item.on'),/background:var\(--info-bg\)/);
  assert.match(decl('.aud-tabs button:focus-visible'),/outline:2px solid var\(--focus\)/);
});
test('tabela vazia em modo cartão sem divisória de título',()=>{
  assert.match(css,/table\.t-cards td\.empty\{text-align:center;padding:var\(--sp-4\) 0;border-bottom:0;margin:0\}/);
});
