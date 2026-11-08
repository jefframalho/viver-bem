const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const html=readFileSync('public/index.html','utf8');
const helper=html.slice(html.indexOf('function publicVerified()'),html.indexOf('const PUBLIC ='));
const renderCode=html.slice(html.indexOf('async function render(){'),html.indexOf('window.addEventListener("hashchange", render);'));
function context(user,mode='firebase'){
 const root={innerHTML:''};let reads=0;
 const c={Store:{mode,auth:{currentUser:user}},route:()=>({r:'assinar',id:'secret-id'}),portalProfissional:false,pararAvisosFamilia:null,
  $:selector=>selector==='#root'?root:null,esc:x=>String(x),pubShell:x=>x,
  PUBLIC:{assinar:async()=>{reads++;return 'AUTHORIZED_CONTRACT'}},bindPublic(){},console};
 vm.createContext(c);vm.runInContext(helper+'\n'+renderCode,c);return {c,root,reads:()=>reads};
}
test('contract render performs no data read before verified authentication',async()=>{for(const user of [null,{uid:'u',email:'u@example.com',emailVerified:false}]){const x=context(user);await x.c.render();assert.equal(x.reads(),0);assert.doesNotMatch(x.root.innerHTML,/AUTHORIZED_CONTRACT/);}});
test('verified login allows rule-checked contract load',async()=>{const x=context({uid:'u',email:'u@example.com',emailVerified:true});await x.c.render();assert.equal(x.reads(),1);assert.match(x.root.innerHTML,/AUTHORIZED_CONTRACT/);});
test('permission failure clears stale contract and candidate from memory',async()=>{const x=context({uid:'u',email:'u@example.com',emailVerified:true});x.c.PUBLIC.assinar=async()=>{throw Error('permission-denied')};x.c.acomp={private:'old'};x.c.window={_ct:{private:'old'}};await x.c.render();assert.equal(x.c.acomp,null);assert.equal(x.c.window._ct,null);assert.match(x.root.innerHTML,/Acesso não autorizado/);});
test('service worker never intercepts Firebase or other dynamic responses',()=>{const handlers={};const c={URL,self:{location:{origin:'https://example.com'},registration:{scope:'https://example.com/public/'},addEventListener:(name,fn)=>handlers[name]=fn}};vm.createContext(c);vm.runInContext(readFileSync('public/sw.js','utf8'),c);for(const url of ['https://firestore.googleapis.com/v1/projects/private','https://identitytoolkit.googleapis.com/v1/accounts','https://example.com/public/index.html?token=secret','https://example.com/private']){let intercepted=false;handlers.fetch({request:{url,method:'GET'},respondWith(){intercepted=true}});assert.equal(intercepted,false,url);}});
test('all inline scripts parse without syntax errors',()=>{for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(m[1]));});
test('legacy contracts never accidentally select admin with no professional ID',()=>{const start=html.indexOf('  const candidate=Store.get("candidatos",d.refId);');const end=html.indexOf('  return {id:id||uid("ct-")',start);const code=html.slice(start,end)+'\nresult=candidate?.ownerUid||signer?.id||"";';for(const [tipo,d,users,candidate,expected] of [
 ['autonomo',{refId:'legacy'},[{id:'admin',role:'admin'}],null,''],
 ['autonomo',{refId:'candidate'},[{id:'admin',role:'admin'}],{ownerUid:'owner'},'owner'],
 ['autonomo',{refId:'pro',profId:'p1'},[{id:'admin',role:'admin'},{id:'professional',role:'prof',profId:'p1'}],null,'professional'],
 ['paciente',{refId:'pa1'},[{id:'admin',role:'admin'},{id:'family',role:'paciente',pacId:'pa1'}],null,'family']
 ]){const c={tipo,d,Store:{get:()=>candidate,all:()=>users}};vm.createContext(c);vm.runInContext(code,c);assert.equal(c.result,expected);}});
test('logout clears clinical cache but preserves public company config',()=>{const code=html.slice(html.indexOf('function clearUserState(){'),html.indexOf('function publicVerified(){'));const c={S:{role:'admin'},saveSession(){},acomp:{private:true},window:{_ct:{private:true}},COLS:['config','pacientes'],Store:{data:{config:[{nome:'Empresa'}],pacientes:[{nome:'Confidencial'}]}}};vm.createContext(c);vm.runInContext(code+'\nclearUserState();',c);assert.equal(c.S,null);assert.equal(c.acomp,null);assert.equal(c.window._ct,null);assert.equal(c.Store.data.pacientes.length,0);assert.equal(c.Store.data.config[0].nome,'Empresa');});
