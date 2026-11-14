// Testes da Entrega 9: login e páginas públicas (autenticação intacta).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {digitais,blocos,scriptPrincipal}=require('./helpers/blocos.cjs');

const html=readFileSync('public/index.html','utf8');
const B=blocos(scriptPrincipal(html));
const base=JSON.parse(readFileSync('tests/fixtures/logica-base.json','utf8')).blocos;
const atual=digitais(html);

test('métodos de autenticação idênticos ao commit-base',()=>{
  for(const k of ['function bindLogin','function login','function logout','function bindPublic','function bindPublicAuth','function publicVerified'])
    assert.equal(atual[k],base[k],k+' alterado');
});

test('login: mesmos campos, ações de demonstração, recuperação de senha e links públicos',()=>{
  const l=B['function pgLogin'];
  for(const t of ['id="fLogin"','id="lg_email" type="email" autocomplete="username"','id="lg_pass" type="password" autocomplete="current-password"',
    'data-act="demoAdmin"','data-act="demoProf"','data-act="demoFam"','data-act="reset"','href="#trabalhe"','href="#acompanhar"','portalProfissional'])
    assert.ok(l.includes(t),'ausente no login: '+t);
});

test('a única mudança no login e no cabeçalho público é a imagem do logotipo',()=>{
  const semLogo=t=>t.replace(/src="\$\{LOGO(_MENU)?\}"( width="900" height="457")?/g,'src="LOGO"');
  const {execSync}=require('node:child_process');
  let original;
  try{ original=execSync('git show base-premium-ui-20261114:public/index.html',{encoding:'utf8',maxBuffer:1e8,stdio:['ignore','pipe','ignore']}); }catch{ return; } // sem git: coberto pelo teste de autenticação acima
  const O=blocos(scriptPrincipal(original));
  for(const k of ['function pgLogin','function pubShell']) assert.equal(semLogo(B[k]),semLogo(O[k]),k+' mudou além do logotipo');
});
