// Extrai as definições dos estados de negócio e da formatação de datas (para comparar com o commit-base).
const MAPAS=['PL_ST','PAC_ST','CONS_ST','ST_DIA','OP_ST','LOTE_ST','ST'];
const LINHAS=['fmtDayW','fmtDay','ex'];

function definicoes(html){
  const t=html.replace(/\r\n/g,'\n'), out={};
  for(const n of MAPAS){
    const m=[...t.matchAll(new RegExp(String.raw`\bconst ${n} ?= ?\{[^}]*\}`,'g'))].map(x=>x[0]);
    if(!m.length) throw new Error('mapa não encontrado: '+n);
    out[n]=m.join(' || ');
  }
  for(const n of LINHAS){
    const m=t.match(new RegExp(String.raw`\bconst ${n} ?= ?[^\n]*`));
    if(!m) throw new Error('definição não encontrada: '+n);
    out[n]=m[0];
  }
  return out;
}

module.exports={definicoes};
