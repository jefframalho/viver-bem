// Garante que o modo demonstração inicializa em um aparelho sem dados salvos.
// Roda o script principal em uma VM, sem rede e sem Firebase (FIREBASE_CONFIG = null).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');

const html=readFileSync('public/index.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const principal=scripts.find(s=>s.includes('const FIREBASE_CONFIG'));

function semFirebase(code){
  const a=code.indexOf('const FIREBASE_CONFIG = ');
  const b=code.indexOf('};',a)+2;
  return code.slice(0,a)+'const FIREBASE_CONFIG = null;'+code.slice(b);
}

// Elemento falso: aceita qualquer propriedade ou chamada, sem tocar em nada real.
function elemento(){
  const alvo=function(){};
  return new Proxy(alvo,{
    get:(t,k)=>typeof k==='symbol'?undefined:(k in t?t[k]:['innerHTML','textContent','value','className'].includes(k)?'':elemento()),
    set:(t,k,v)=>{t[k]=v;return true;},
    apply:()=>elemento(),
  });
}

function contexto(){
  const armazenado={};
  const storage={getItem:k=>k in armazenado?armazenado[k]:null,setItem:(k,v)=>{armazenado[k]=String(v);},removeItem:k=>{delete armazenado[k];}};
  const document=elemento();
  const window=elemento();
  const c={console,document,window,localStorage:storage,sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    navigator:{},location:{hash:'',search:'',protocol:'http:',origin:'http://localhost',href:'http://localhost/public/index.html'},
    // Timers vazios: o teste não deve deixar tarefas agendadas rodando.
    matchMedia:()=>({matches:false,addEventListener(){}}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},
    URL,URLSearchParams,Intl,Date,Math,JSON,crypto:globalThis.crypto,TextEncoder,TextDecoder,
    addEventListener(){},removeEventListener(){},armazenado};
  vm.createContext(c);
  return c;
}

test('modo demonstração inicializa sem dados salvos (sem erro de Store.data nulo)',async()=>{
  const inicio=principal.indexOf('/* =================== INÍCIO');
  assert.ok(inicio>0,'marcador de início do script não encontrado');
  const c=contexto();
  vm.runInContext(semFirebase(principal.slice(0,inicio))+'\n;globalThis.__Store=Store;',c);
  assert.equal(c.__Store.mode,'demo');
  await c.__Store.init();
  assert.ok(c.__Store.data,'Store.data deve existir após init');
  assert.ok(c.__Store.all('pacientes').length>0,'dados de exemplo de pacientes');
  assert.ok(c.__Store.all('contratos').length>0,'contratos de exemplo gerados');
  assert.ok(c.armazenado['viverbem-sistema-v7'],'dados de exemplo salvos só no aparelho');
});

test('modo demonstração reaproveita dados já salvos no aparelho',async()=>{
  const inicio=principal.indexOf('/* =================== INÍCIO');
  const c=contexto();
  c.armazenado['viverbem-sistema-v7']=JSON.stringify({pacientes:[{id:'p1',nome:'Teste'}]});
  vm.runInContext(semFirebase(principal.slice(0,inicio))+'\n;globalThis.__Store=Store;',c);
  await c.__Store.init();
  assert.equal(c.__Store.all('pacientes').length,1);
  assert.equal(c.__Store.all('pacientes')[0].nome,'Teste');
});
