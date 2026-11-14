// Testes da Entrega 4: Dashboard sem repetições, mesmos cálculos e mesmos destinos.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {blocos,scriptPrincipal}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const B=blocos(scriptPrincipal(html));

test('fileira "Operação de hoje" sem repetir Em andamento/Atrasados',()=>{
  const p=B['function pgPainel'];
  assert.match(p,/<div class="kpis kpis-hoje">[\s\S]*\$\{painelBreak\(hoje,grp\)\}[\s\S]*Receita prevista/);
  assert.equal((p.match(/grp\.andamento\.n|grp\.atrasado\.n/g)||[]).length,0,'contagens repetidas removidas da 1ª fileira');
  assert.doesNotMatch(p,/eyebrow-line/);
});

test('cálculos do painel preservados (mesmas expressões)',()=>{
  const p=B['function pgPainel'];
  for(const trecho of [
    'const hoje=Store.all("plantoes").filter(p=>p.data===t&&p.status!=="cancelado")',
    'grp[k].n++; grp[k].v+=(+p.valorCobrado||0);',
    'const receita=hoje.filter(p=>p.status!=="falta").reduce((a,p)=>a+(+p.valorCobrado||0),0);',
    '<b>${hoje.length}</b>','<b>${brl(receita)}</b>',
  ]) assert.ok(p.includes(trecho),'expressão ausente: '+trecho);
  const pb=B['function painelBreak'];
  assert.ok(pb.includes('const n=grp[k].n, pc=tot?Math.round(n/tot*100):0'),'percentual igual ao original');
});

test('status do dia: 4 indicadores; Atrasados e Em andamento continuam levando a #ponto',()=>{
  const c={}; vm.createContext(c); vm.runInContext(B['function painelBreak']+';globalThis.pb=painelBreak;',c);
  const grp={nao:{n:1},atrasado:{n:2},andamento:{n:0},concluido:{n:1}};
  const out=c.pb([1,2,3,4],grp);
  assert.equal((out.match(/class="kpi kpi-st /g)||[]).length,4);
  assert.match(out,/<a class="kpi kpi-st kpi-atrasado" href="#ponto">[\s\S]*?<b>2<\/b><span class="num">50%<\/span>/);
  assert.match(out,/<a class="kpi kpi-st kpi-andamento" href="#ponto">[\s\S]*?<b>0<\/b><span class="num">0%<\/span>/);
  assert.match(out,/<div class="kpi kpi-st kpi-concluido">[\s\S]*?<b>1<\/b><span class="num">25%<\/span>/);
});

test('seções leves no lugar de faixas dentro do painel; número de destaque sem estilo inline',()=>{
  const m=B['function painelMes'];
  assert.doesNotMatch(m,/class="pagehead"/); assert.doesNotMatch(m,/eyebrow-line/);
  assert.match(m,/<b class="num num-destaque">\$\{tot\}<\/b>/);
  assert.ok(m.includes('const mes=today().slice(0,7), st=prontStats(mes), nF=st.fin.length, pct=nF?Math.round(st.completos.length/nF*100):100;'),'cálculo de prontuários igual');
});
