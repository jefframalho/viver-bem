// Garante que a moldura (menu lateral e barra superior) preserva navegação, grupos e ações.
// Roda o script principal em uma VM em modo demonstração, sem rede e sem Firebase.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');

const html=readFileSync('public/index.html','utf8');
const principal=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const FIREBASE_CONFIG'));
const inicio=principal.indexOf('/* =================== INÍCIO');
const a=principal.indexOf('const FIREBASE_CONFIG = '), b=principal.indexOf('};',a)+2;
const codigo=principal.slice(0,a)+'const FIREBASE_CONFIG = null;'+principal.slice(b,inicio);

function elemento(){
  const alvo=function(){};
  return new Proxy(alvo,{
    get:(t,k)=>typeof k==='symbol'?undefined:(k in t?t[k]:['innerHTML','textContent','value','className'].includes(k)?'':elemento()),
    set:(t,k,v)=>{t[k]=v;return true;},
    apply:()=>elemento(),
  });
}

async function montar(){
  const memoria={};
  const c={console,document:elemento(),window:elemento(),navigator:{},
    localStorage:{getItem:k=>memoria[k]??null,setItem:(k,v)=>{memoria[k]=String(v);},removeItem:k=>{delete memoria[k];}},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    location:{hash:'',search:'',protocol:'http:',origin:'http://localhost',href:'http://localhost/public/index.html'},
    matchMedia:()=>({matches:false,addEventListener(){}}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
    URL,URLSearchParams,Intl,Date,Math,JSON,crypto:globalThis.crypto,TextEncoder,TextDecoder,addEventListener(){},removeEventListener(){}};
  vm.createContext(c);
  vm.runInContext(codigo,c);
  await vm.runInContext('Store.init()',c);
  return c;
}

function shell(c,sessao,tela,hash=''){
  c.location.hash=hash?'#'+hash:'';
  vm.runInContext(`S=${JSON.stringify(sessao)}; globalThis.__html=appShell(${JSON.stringify(tela)},'<p>CORPO</p>');`,c);
  return c.__html;
}

const chaves=nav=>nav.flatMap(n=>n[0]==='grp'?n[3].map(x=>x[0]):n[0]==='sep'?[]:[n[0]]);

test('menu da administração mantém todos os links, grupos e ações',async()=>{
  const c=await montar();
  const out=shell(c,{role:'admin',nome:'Administração'},'pacientes','pacientes');
  const nav=vm.runInContext('ADMIN_NAV',c);
  for(const k of chaves(nav)) assert.match(out,new RegExp(`href="#${k}"`),`link #${k}`);
  assert.equal((out.match(/<details class="nav-grp"/g)||[]).length,nav.filter(n=>n[0]==='grp').length,'grupos');
  assert.match(out,/<a href="#pacientes" aria-current="page">/);
  assert.match(out,/<details class="nav-grp" open><summary>[\s\S]*?<span>Cadastros<\/span>/,'grupo da tela atual aberto');
  assert.match(out,/data-act="menu"/);
  assert.match(out,/data-act="logout"/);
  assert.match(out,/id="fBusca"/);
  assert.match(out,/class="tb-title">Pacientes</);
  assert.match(out,/<p>CORPO<\/p>/);
});

test('selos de contagem têm rótulo acessível',async()=>{
  const c=await montar();
  const out=shell(c,{role:'admin',nome:'Administração'},'painel','painel');
  const selos=[...out.matchAll(/<span class="badge" aria-label="(\d+) pendentes?">(\d+)<\/span>/g)];
  assert.ok(selos.length>0,'há selos nos dados de exemplo');
  for(const s of selos) assert.equal(s[1],s[2]);
});

test('profissional e família recebem seus próprios menus',async()=>{
  const c=await montar();
  const prof=vm.runInContext('Store.all("profissionais").find(p=>p.status==="ativo")',c);
  const outP=shell(c,{role:'prof',profId:prof.id,nome:prof.nome},'meus','meus');
  for(const k of chaves(vm.runInContext('PROF_NAV',c))) assert.match(outP,new RegExp(`href="#${k}"`));
  assert.doesNotMatch(outP,/href="#financeiro"/,'profissional não vê menu financeiro');
  assert.doesNotMatch(outP,/id="fBusca"/,'busca geral só para a equipe');
  const pac=vm.runInContext('Store.all("pacientes")[0]',c);
  const outF=shell(c,{role:'paciente',pacId:pac.id,nome:'Família'},'inicio','inicio');
  for(const k of chaves(vm.runInContext('FAM_NAV',c))) assert.match(outF,new RegExp(`href="#${k}"`));
  assert.doesNotMatch(outF,/href="#pacientes"/,'família não vê cadastro de pacientes');
  assert.match(outF,/class="tb-title">Início</);
});
