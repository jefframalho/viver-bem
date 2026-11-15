// Testes da Entrega 3d: tabelas responsivas (módulo de apresentação + CSS).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {blocos,scriptPrincipal}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');
const codigo=blocos(scriptPrincipal(html))['function prepararTabela'];

// ---------- DOM mínimo, só com o que prepararTabela usa ----------
function celula(conteudo={}){
  const c={attrs:{...(conteudo.attrs||{})},dataset:{},classes:new Set(),acao:!!conteudo.acao,
    hasAttribute:k=>k in c.attrs, querySelector:()=>c.acao?{}:null, classList:{add:x=>c.classes.add(x)}};
  return c;
}
const linha=(cels,clicavel)=>({children:cels.map(celula),attrs:{},dataset:{},tabIndex:undefined,
  hasAttribute(k){return k in this.attrs}, matches:s=>s==='tr.click[data-act]'&&clicavel});
function tabela({cabecalhos,numericas=[],linhas=[],clicaveis=false,classe=''}){
  const ths=cabecalhos.map((h,i)=>({textContent:h,classList:{contains:x=>x==='r'&&numericas.includes(i)}}));
  const trs=linhas.map(l=>linha(l,clicaveis));
  const t={dataset:{},classes:new Set(),trs,
    matches:s=>s==='.freq,.dre'&&/freq|dre/.test(classe),
    classList:{add:x=>t.classes.add(x),contains:x=>t.classes.has(x)},
    querySelector:s=>s.includes('tr.click[data-act]')&&clicaveis?trs[0]:null,
    querySelectorAll:s=>s.includes('>th')?ths:s.includes(':not([data-prep])')?trs.filter(tr=>!tr.dataset.prep):trs};
  return t;
}
function preparar(t){ const c={}; vm.createContext(c); vm.runInContext(codigo+';globalThis.p=prepararTabela;',c); c.p(t); return t; }
const tipo=t=>t.classes.has('t-matriz')?'matriz':t.classes.has('t-cards')?'cartões':'?';

test('módulo existe e não roda sem navegador (testes em VM continuam funcionando)',()=>{
  assert.ok(codigo,'função prepararTabela');
  assert.match(html,/if\(typeof MutationObserver!=="undefined"&&typeof document!=="undefined"&&document\.body\)\{/);
});

test('classificação: listas operacionais viram cartões; matrizes mantêm a tabela',()=>{
  const casos=[
    [{cabecalhos:['Paciente','Idade','Cidade','Complexidade','Responsável','Atendimento','Situação'],numericas:[],clicaveis:true},'cartões','lista de pacientes'],
    [{cabecalhos:['Produto','Categoria','Saldo','Mínimo','Custo','Valor'],numericas:[2,3,4,5],clicaveis:true},'cartões','estoque: numérico, mas a linha abre o produto'],
    [{cabecalhos:['Data','Paciente','Previsto','Chegada','Horas','Plantão','A receber','Situação'],numericas:[4,6]},'cartões','plantões do profissional (8 colunas)'],
    [{cabecalhos:['Centro','Receita','Profissionais','Materiais','Despesas','Resultado'],numericas:[1,2,3,4,5]},'matriz','centros de custo'],
    [{cabecalhos:['Profissional','Plantões','Previstas','Registradas','Bruto','A receber',''],numericas:[1,2,3,4,5]},'matriz','folha de pagamento'],
    [{cabecalhos:Array.from({length:9},(_,i)=>'C'+i),numericas:[]},'matriz','relatório extenso (9 colunas)'],
    [{cabecalhos:['Conta','Mês','%','Ano'],numericas:[],classe:'dre'},'matriz','DRE'],
    [{cabecalhos:['Profissional','1','2'],numericas:[],classe:'freq'},'matriz','frequência'],
  ];
  for(const [cfg,esperado,nome] of casos) assert.equal(tipo(preparar(tabela({...cfg,linhas:[cfg.cabecalhos.map(()=>({}))]}))),esperado,nome);
});

test('cartões: cada célula recebe o nome da coluna; vazias de colspan são ignoradas; ações marcadas',()=>{
  const t=preparar(tabela({cabecalhos:['Contrato','Tipo','Situação',''],linhas:[[{},{},{},{acao:true}],[{attrs:{colspan:'4'}}]]}));
  const [l1,l2]=t.trs;
  assert.deepEqual(l1.children.map(c=>c.dataset.label),['Contrato','Tipo','Situação','']);
  assert.ok(l1.children[3].classes.has('t-acoes'),'coluna de ações');
  assert.equal(l2.children[0].dataset.label,undefined,'linha "nenhum registro" (colspan) sem rótulo');
});

test('linhas clicáveis ganham foco por teclado; preparar duas vezes não muda nada',()=>{
  const t=preparar(tabela({cabecalhos:['Paciente','Cidade'],linhas:[[{},{}],[{},{}]],clicaveis:true}));
  assert.ok(t.trs.every(tr=>tr.tabIndex===0));
  t.trs[0].children[0].dataset.label='alterado'; preparar(t);
  assert.equal(t.trs[0].children[0].dataset.label,'alterado','segunda chamada é ignorada (data-prep)');
});

test('Enter/Espaço em linha clicável disparam o mesmo clique (sem nova ação)',()=>{
  assert.match(html,/if\(\(e\.key==="Enter"\|\|e\.key===" "\)&&e\.target\?\.matches\?\.\("tr\.click\[data-act\]"\)\)\{ e\.preventDefault\(\); e\.target\.click\(\); \}/);
  assert.match(decl('tr.click:focus-visible'),/outline:2px solid var\(--focus\)/);
});

test('CSS: cartões no celular, cabeçalho oculto só visualmente, conteúdo na coluna de valor',()=>{
  const ini=css.indexOf('@media (max-width:720px){'); assert.ok(ini>=0);
  const b=css.slice(ini,css.indexOf('\n}',ini));
  assert.match(b,/table\.t-cards>thead\{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\)/,'thead fica acessível a leitores de tela');
  assert.doesNotMatch(b,/thead\{display:none/);
  assert.match(b,/table\.t-cards td::before\{content:attr\(data-label\)/);
  assert.match(b,/table\.t-cards td>\*\{grid-column:2;justify-self:start/);
});

test('CSS: matrizes rolam dentro do componente com a 1ª coluna fixa; página não rola de lado',()=>{
  assert.match(decl('.tablewrap'),/overflow-x:auto/); assert.match(decl('.tablewrap'),/max-width:100%/);
  assert.match(decl('table.t-matriz td:first-child'),/position:sticky;left:0/);
  assert.match(decl('td.r'),/white-space:nowrap/,'valores monetários não quebram');
  assert.match(decl('td.r'),/text-align:right/,'valores à direita');
});

test('linhas inseridas depois (filtro/atualização parcial) também recebem rótulos e foco',()=>{
  const t=preparar(tabela({cabecalhos:['Paciente','Cidade'],linhas:[[{},{}]],clicaveis:true}));
  t.trs.push(linha([{},{}],true));             // nova linha chega na mesma tabela
  preparar(t);
  const nova=t.trs[1];
  assert.deepEqual(nova.children.map(c=>c.dataset.label),['Paciente','Cidade']);
  assert.equal(nova.tabIndex,0);
  assert.equal(tipo(t),'cartões','classificação não é refeita');
});
