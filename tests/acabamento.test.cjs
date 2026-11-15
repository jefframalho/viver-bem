// Testes do acabamento final: contraste dos pares de texto/componentes, logotipo otimizado, PWA e impressão.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync,statSync}=require('node:fs');
const vm=require('node:vm');

const html=readFileSync('public/index.html','utf8').replace(/\r\n/g,'\n');
const bloco=ini=>{const a=html.indexOf(ini);assert.ok(a>=0,ini);return html.slice(a,html.indexOf('}',a));};
const tok=t=>{const o={};for(const m of t.matchAll(/--([a-z0-9-]+):([^;]+);/g))o[m[1]]=m[2].trim();return o;};
const claro=tok(bloco(':root{')), escuro={...claro,...tok(bloco(':root[data-theme="dark"]{'))};
const res=(t,v)=>{for(let i=0;i<6&&/^var\(/.test(v);i++) v=t[v.match(/var\(--([a-z0-9-]+)\)/)[1]];return v;};
const lum=h=>{const c=h.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05);};

test('contraste WCAG AA de texto (4,5:1) e de bordas de campo (3:1, WCAG 1.4.11), claro e escuro',()=>{
  const pares=[['ink','bg',4.5],['ink','surface',4.5],['muted','bg',4.5],['muted','surface',4.5],['muted','surface-2',4.5],['blue','surface',4.5],
    ['side-ink','side',4.5],['side-muted','side',4.5],['side-accent-ink','side-accent',4.5],['bad','bad-bg',4.5],['warn','warn-bg',4.5],
    ['field-border','surface',3],['field-border','surface-2',3]];
  const falhas=[];
  for(const [nome,t] of [['claro',claro],['escuro',escuro]]) for(const [a,b,min] of pares){
    const v=cr(res(t,`var(--${a})`),res(t,`var(--${b})`)); if(v<min) falhas.push(`${nome} ${a}/${b}: ${v.toFixed(2)} < ${min}`);
  }
  assert.deepEqual(falhas,[]);
});

test('campos usam a borda acessível (--field-border)',()=>{
  assert.match(html,/input,select,textarea\{[^}]*border:1px solid var\(--field-border\)/);
});

test('logotipo horizontal otimizado existe, é leve e o original foi mantido',()=>{
  assert.match(html,/const LOGO_MENU = "\.\.\/logo-viverbem-horizontal\.jpg";/);
  assert.ok(existsSync('logo-viverbem-horizontal.jpg'));
  assert.ok(statSync('logo-viverbem-horizontal.jpg').size<80*1024,'menos de 80 KB');
  assert.ok(existsSync('logo-viverbem.png'),'arquivo original mantido');
});

test('PWA: cache com nova versão e mesma lista de arquivos; manifestos intactos',()=>{
  const sw=readFileSync('public/sw.js','utf8');
  assert.match(sw,/const CACHE = "viverbem-shell-v4";/);
  assert.match(sw,/const SHELL = \["\.\/index\.html", "\.\/manifest\.webmanifest", "\.\/icon-192\.png", "\.\/icon-512\.png"\];/);
  for(const m of ['public/manifest.webmanifest','public/profissional.webmanifest']){ const j=JSON.parse(readFileSync(m,'utf8')); assert.equal(j.theme_color,'#0F3550'); assert.equal(j.display,'standalone'); }
});

test('impressão: menu, barra superior e avisos continuam ocultos; tabelas com cabeçalho cinza',()=>{
  const ini=html.indexOf('@media print{'); assert.ok(ini>=0);
  const p=html.slice(ini,html.indexOf('\n}',ini));
  assert.match(p,/\.side,\.topbar,\.no-print,\.toast,\.scrim\{display:none!important\}/);
  assert.match(p,/th\{background:#eee!important\}/);
});

test('fontes: pré-conexão com o servidor de fontes antes da folha da Inter',()=>{
  const a=html.indexOf('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'), b=html.indexOf('family=Inter');
  assert.ok(a>0&&a<b);
});

test('impressão do contrato: só o modal, texto inteiro, sem botões',()=>{
  const blocos=[...html.matchAll(/@media print\{([\s\S]*?)\n\}/g)].map(m=>m[1]).join('\n');
  assert.match(blocos,/body:has\(>\.overlay\) > :not\(\.overlay\):not\(script\)\{display:none!important\}/);
  assert.match(blocos,/\.contract\{max-height:none!important;overflow:visible!important/);
  assert.match(blocos,/\.btn,\.chipbtn,\.x,\.chips:has\(\.chipbtn\)\{display:none!important\}/);
});
