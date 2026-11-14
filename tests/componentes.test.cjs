// Testes da modernização de componentes (Entrega 3).
// 1) Preservação: nenhum data-act ou ID do commit-base pode desaparecer.
// 2) Botões: padrão visual, ações de campo destacadas, toque mínimo e contraste.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');

const html=readFileSync('public/index.html','utf8');
const base=JSON.parse(readFileSync('tests/fixtures/interface-base.json','utf8'));
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));

// Regras CSS como mapa "seletor -> declarações" (suficiente para o CSS deste arquivo)
function regras(texto){
  const out=[];
  for(const m of texto.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push({sel:m[1].trim(),dec:m[2]});
  return out;
}
const R=regras(css);
const decl=(seletor)=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(seletor)).map(r=>r.dec).join(';');
const bloco=(inicio)=>{ const a=css.indexOf(inicio); assert.ok(a>=0,'bloco não encontrado: '+inicio); let n=0,i=css.indexOf('{',a); for(;i<css.length;i++){ if(css[i]==='{')n++; else if(css[i]==='}'&&--n===0) break; } return css.slice(a,i+1); };

// Compara a quantidade de ocorrências: remover uma única ação repetida também falha.
// Conta só a marcação: seletores CSS como .btn[data-act="checkin"] não podem mascarar uma remoção.
const marcacao=html.replace(/<style[^>]*>[\s\S]*?<\/style>/g,'');
const ocorrencias=(atributo,valor)=>marcacao.split(`${atributo}="${valor}"`).length-1;

test('nenhum data-act do commit-base foi removido (nem uma ocorrência)',()=>{
  const faltando=Object.entries(base.dataAct).filter(([a,n])=>ocorrencias('data-act',a)<n).map(([a,n])=>`${a} (${ocorrencias('data-act',a)}/${n})`);
  assert.deepEqual(faltando,[],'data-act a menos: '+faltando.join(', '));
});

test('nenhum ID do commit-base foi removido (nem uma ocorrência)',()=>{
  const faltando=Object.entries(base.ids).filter(([id,n])=>ocorrencias('id',id)<n).map(([id,n])=>`${id} (${ocorrencias('id',id)}/${n})`);
  assert.deepEqual(faltando,[],'IDs a menos: '+faltando.join(', '));
});

test('chegada e saída continuam com as mesmas ações e IDs de plantão',()=>{
  for(const trecho of [
    'data-act="checkin" data-id="${p.id}"',
    'data-act="checkout" data-id="${p.id}"',
    'data-act="checkin" data-id="${atual.id}"',
    'data-act="saveEvo" data-id="${p.id}"',
  ]) assert.ok(html.includes(trecho),'trecho ausente: '+trecho);
});

test('botões principal e de campo usam o azul da marca (cobre não é mais botão)',()=>{
  assert.match(decl('.btn-primary'),/background:var\(--blue\)/);
  assert.match(decl('.btn-copper'),/background:var\(--blue\)/);
  assert.doesNotMatch(decl('.btn-copper'),/var\(--copper\)/);
  assert.match(decl('.btn-primary:hover'),/var\(--blue-hover\)/);
});

test('chegada e saída têm destaque e área de toque de pelo menos 44px',()=>{
  for(const sel of ['.btn[data-act="checkin"]','.btn[data-act="checkout"]']){
    const m=decl(sel).match(/min-height:(\d+)px/);
    assert.ok(m&&+m[1]>=44,`${sel} precisa de min-height >= 44px`);
  }
});

test('no celular os botões comuns têm 44px de altura mínima',()=>{
  const movel=bloco('@media (max-width:899px),(pointer:coarse){\n  .btn{min-height:44px}');
  assert.match(movel,/\.btn\{min-height:44px\}/);
});

test('exclusão é vermelha e discreta; foco é visível e azul',()=>{
  assert.match(decl('.btn-danger'),/color:var\(--bad\)/);
  assert.match(decl('.btn-danger'),/background:var\(--surface\)/);
  assert.match(decl(':focus-visible'),/outline:2px solid var\(--focus\)/);
});

// Contraste WCAG entre texto e fundo do botão principal (claro e escuro)
function lum(hex){ const c=hex.match(/[0-9a-f]{2}/gi).map(h=>parseInt(h,16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4); return .2126*c[0]+.7152*c[1]+.0722*c[2]; }
const contraste=(a,b)=>{ const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m); return (x+.05)/(y+.05); };
function tokens(trecho){ const t={}; for(const m of trecho.matchAll(/--([a-z0-9-]+):(#[0-9A-Fa-f]{6})/g)) t[m[1]]=m[2]; return t; }

test('contraste do botão principal atende WCAG AA (4,5:1) no claro e no escuro',()=>{
  const claro=tokens(bloco(':root{'));
  const escuro=tokens(bloco(':root[data-theme="dark"]{'));
  for(const [nome,t] of [['claro',claro],['escuro',escuro]]){
    for(const fundo of ['blue','blue-hover','blue-press']){
      const r=contraste(t['on-blue'],t[fundo]);
      assert.ok(r>=4.5,`${nome}: on-blue sobre ${fundo} = ${r.toFixed(2)}:1`);
    }
    const d=contraste(t.bad,t.surface);
    assert.ok(d>=4.5,`${nome}: texto de exclusão = ${d.toFixed(2)}:1`);
  }
});

test('botão de envio de arquivo mostra foco quando o campo interno é focado',()=>{
  assert.match(decl('label.btn:has(input:focus-visible)'),/outline:2px solid var\(--focus\)/);
});
