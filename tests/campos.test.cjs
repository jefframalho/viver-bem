// Testes da Entrega 3b (campos de formulário) e da preservação da lógica de negócio.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {digitais,blocos,scriptPrincipal}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g,'');
const R=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

// ---------- Lógica de negócio intacta ----------
// Funções de interface alteradas de propósito, com o motivo. Qualquer outra diferença falha.
const ALTERADAS_DE_PROPOSITO={
  'Store.init':'Entrega 0: corrige inicialização do modo demonstração',
  'function appShell':'Entrega 2: moldura (menu, barra superior)',
  'function field':'Entrega 3b: aria-required nos campos obrigatórios',
  'function formPaciente':'Entrega 3b: classe .fsec nos títulos de seção',
  'function showErr':'Entrega 3b: mensagem de erro com role="alert"',
  'function pgPacientes':'Entrega 3b: upload "Importar planilha" acessível',
  'function pgConciliacao':'Entrega 3b: upload "Importar extrato" acessível',
  'function evoExtras':'Entrega 3b: upload "Tirar ou anexar foto" acessível',
  'function pgEscala':'Entrega 3c: data do dia com classe .data-dia (só apresentação)',
  'function pgFamAgenda':'Entrega 3c: data do dia com classe .data-dia (só apresentação)',
  'function pgFamInicio':'Entrega 3c: data no início da linha com classe .data-dia',
  'function pgMeus':'Entrega 3c: data no cabeçalho do profissional com classe .data-dia',
  'function pgPacienteProf':'Entrega 3c: data do próximo plantão com classe .data-dia',
  'function pgDisponiveis':'Entrega 3c: data no título do plantão disponível com classe .data-dia',
  'function verTele':'Entrega 3c: data da teleconsulta com classe .data-dia',
  'function pgPainel':'Entrega 4: fileira única de indicadores do dia e cabeçalhos de seção (só HTML)',
  'function painelBreak':'Entrega 4: devolve os indicadores sem contêiner; Atrasados/Em andamento como links (só HTML)',
  'function painelMes':'Entrega 4: cabeçalhos de seção leves no lugar de faixas (só HTML)',
  'function pgLogin':'Entrega 9: logotipo horizontal no login (só o src da imagem)',
  'function pubShell':'Entrega 9: logotipo horizontal no cabeçalho público (só o src da imagem)',
};

test('lógica de negócio idêntica ao commit-base (exceto interface listada)',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
  const atual=digitais(html);
  const sumiram=Object.keys(base).filter(k=>!(k in atual));
  const mudaram=Object.keys(base).filter(k=>k in atual&&base[k]!==atual[k]&&!(k in ALTERADAS_DE_PROPOSITO));
  assert.deepEqual(sumiram,[],'blocos removidos: '+sumiram.join(', '));
  assert.deepEqual(mudaram,[],'blocos alterados sem autorização: '+mudaram.join(', '));
});

test('chegada, saída, evolução, validação e geolocalização não mudaram',()=>{
  const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
  const atual=digitais(html);
  for(const k of ['ACT.checkin','ACT.checkout','ACT.saveEvo','const missing','function readFields','const podeChegar','const exigeLocal','const raioDe','const regInfo','listener change','listener click'])
    assert.equal(atual[k],base[k],k+' foi alterado');
});

// ---------- Campos ----------
test('asterisco fica na mesma linha do rótulo; campo e ajuda abaixo',()=>{
  const f=decl('.f');
  assert.match(f,/flex-direction:row/); assert.match(f,/flex-wrap:wrap/);
  assert.ok(R.some(r=>r.sel.startsWith('.f>:not(.req)')&&/flex:1 1 100%/.test(r.dec)),'campo/ajuda ocupam a linha inteira');
  assert.match(decl('.req'),/color:var\(--bad\)/);
});

test('campos padronizados: borda 1px, 40px, foco com anel azul, desabilitado e erro',()=>{
  const c=decl('input');
  assert.match(c,/border:1px solid var\(--line-strong\)/); assert.match(c,/min-height:40px/);
  assert.match(decl('input:focus'),/box-shadow:0 0 0 3px color-mix\(in srgb,var\(--focus\)/);
  assert.match(decl('input:disabled'),/cursor:not-allowed/);
  assert.match(decl('input[aria-invalid="true"]'),/border-color:var\(--bad\)/);
});

test('erro identificável por texto e ícone, não só por cor',()=>{
  assert.match(decl('.err::before'),/content:"!"/);
  const codigo=blocos(scriptPrincipal(html))['function showErr'];
  const raiz={filhos:[],appendChild(e){this.filhos.push(e)}};
  const c={raiz,$:()=>null,document:{createElement:()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v},scrollIntoView(){}})}};
  vm.createContext(c); vm.runInContext(codigo+';showErr(raiz,"Preencha o campo \\"Nome\\".")',c);
  const e=raiz.filhos[0];
  assert.equal(e.textContent,'Preencha o campo "Nome".'); assert.equal(e.attrs.role,'alert'); assert.equal(e.hidden,false);
});

test('campo obrigatório gerado tem aria-required, sem "required" nativo (validação inalterada)',()=>{
  const codigo=blocos(scriptPrincipal(html))['function field'];
  const c={esc:x=>String(x)}; vm.createContext(c); vm.runInContext(codigo+';globalThis.f=field;',c);
  const obr=c.f({k:'nome',l:'Nome do paciente',req:1},'');
  const opc=c.f({k:'obs',l:'Observação'},'');
  assert.match(obr,/<label class="f">Nome do paciente <i class="req">\*<\/i><input id="f_nome" aria-required="true"/);
  assert.doesNotMatch(obr,/\srequired[\s>=]/);
  assert.doesNotMatch(opc,/aria-required/);
  const sel=c.f({k:'uf',l:'Estado',t:'select',req:1,o:['CE']},'');
  assert.match(sel,/<select id="f_uf" aria-required="true">/);
});

// ---------- Uploads acessíveis ----------
test('os três uploads ficam focáveis (sem hidden) dentro de um botão-rótulo',()=>{
  for(const id of ['pacFile','bkFile','evFotoIn']){
    const m=html.match(new RegExp(`<label class="btn[^"]*">[^<]*(?:\\$\\{[^}]*\\})?[^<]*<input type="file" id="${id}"[^>]*>`));
    assert.ok(m,`${id} deve estar dentro de label.btn`);
    assert.doesNotMatch(m[0],/\shidden[\s>]/,`${id} não pode ter hidden`);
    assert.match(m[0],/class="sr"/,`${id} deve usar a classe .sr`);
  }
  assert.match(decl('label.btn:has(input:focus-visible)'),/outline:2px solid var\(--focus\)/);
});

// ---------- Toque no celular ----------
test('controles pequenos ganham área de toque de 44px no celular',()=>{
  const ini=css.indexOf('@media (max-width:899px),(pointer:coarse){\n  input,select{min-height:44px}');
  assert.ok(ini>=0,'bloco de toque não encontrado');
  const bloco=css.slice(ini,css.indexOf('\n}',ini));
  assert.match(bloco,/\.btn-sm::after,\.chipbtn::after\{content:"";position:absolute;inset:-4px 0;min-height:44px\}/);
  assert.match(bloco,/\.x\{width:44px;height:44px\}/);
  assert.match(bloco,/\.checks label,\.consent\{min-height:44px/);
});

test('campos de uma mesma linha alinham pela base (ajuda não desalinha as caixas)',()=>{
  assert.match(decl('.fgrid'),/align-items:end/);
});
