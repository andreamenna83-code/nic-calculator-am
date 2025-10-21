
const NIC_OPTIONS = [3,4,5,6,7,8,9,10,12,13.5];
const STRENGTHS = [4,6,8,12,18,20];
const OFFICIAL_20_60 = {
  3:  [18],
  4:  [20,4],
  5:  [18,12],
  6:  [18,18],
  7:  [18,18,6],
  8:  [20,20,8],
  9:  [18,18,18],
  10: [20,20,20],
  12: [18,18,18,18],
  13.5: [20,20,20,20],
};
const PRESET_135_TYPES = ["50/50","50/50","Full PG","Full PG"];

const nicSelect = document.getElementById('nicSelect');
const typeSelect = document.getElementById('typeSelect');
const advToggle = document.getElementById('advToggle');
const advArea = document.getElementById('advArea');

NIC_OPTIONS.forEach(v => {
  const opt = document.createElement('option');
  opt.value = String(v);
  opt.textContent = `${v} mg/ml`;
  nicSelect.appendChild(opt);
});
nicSelect.value = '7';

let currentTab = '20-60';

document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    render();
  });
});

advToggle.addEventListener('change', render);
typeSelect.addEventListener('change', render);
nicSelect.addEventListener('change', render);

function comboLabelFromList(list){
  const counts = {};
  list.forEach(mg => counts[mg]=(counts[mg]||0)+1);
  return Object.entries(counts).sort((a,b)=>Number(b[0])-Number(a[0]))
    .map(([mg,c])=> `${c}×${mg}mg`).join(' + ');
}

function render(){
  const nic = Number(nicSelect.value);
  const typeGlobal = typeSelect.value;

  let shotMl, totalMl, targetVG, shotPG, shotVG;
  if(currentTab==='10-30'){ shotMl=10; totalMl=30; targetVG=0.5; shotPG=10; shotVG=0; }
  else if(currentTab==='20-60'){ shotMl=20; totalMl=60; targetVG=0.5; shotPG=20; shotVG=0; }
  else if(currentTab==='30-90'){ shotMl=30; totalMl=90; targetVG=0.7; shotPG=30; shotVG=0; }
  else if(currentTab==='mix10-60'){ shotMl=20; totalMl=60; targetVG=0.5; shotPG=10; shotVG=10; }
  else if(currentTab==='mix20-60'){ shotMl=20; totalMl=60; targetVG=0.5; shotPG=10; shotVG=10; }
  else if(currentTab==='mix30-60'){ shotMl=30; totalMl=60; targetVG=0.5; shotPG=15; shotVG=15; }
  else { shotMl=20; totalMl=60; targetVG=0.5; shotPG=20; shotVG=0; }

  document.getElementById('shotMl').textContent = `${shotMl} ml`;
  document.getElementById('totalMl').textContent = `${totalMl} ml`;
  document.getElementById('targetVG').textContent = `${Math.round(targetVG*100)}%`;
  const requiredMg = nic * totalMl;
  document.getElementById('nicReq').textContent = `${Math.round(requiredMg)} mg`;
  document.getElementById('nicEff').textContent = `${(requiredMg/totalMl).toFixed(2)} mg/ml`;
  document.getElementById('pgS').textContent = `${shotPG.toFixed(1)} ml`;

  let bottles;
  if(currentTab==='20-60'){
    bottles = OFFICIAL_20_60[nic];
  }else{
    bottles = optimizer(requiredMg, shotMl, totalMl).bottles;
  }

  let types = bottles.map(()=> typeGlobal);
  if(currentTab==='20-60' && nic===13.5){
    types = PRESET_135_TYPES.slice(0, bottles.length);
    typeSelect.disabled = true;
  }else{
    typeSelect.disabled = false;
  }

  advArea.innerHTML='';
  if(advToggle.checked){
    types.forEach((t, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'info';
      const sel = document.createElement('select');
      ['50/50','Full VG','Full PG'].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt; o.textContent = opt;
        if(opt===t) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', () => { types[idx] = sel.value; calc(); });
      const label = document.createElement('div');
      label.className = 'small';
      label.textContent = `Basetta ${idx+1} – ${bottles[idx]}mg`;
      wrap.appendChild(label);
      wrap.appendChild(sel);
      advArea.appendChild(wrap);
    });
    advArea.style.display = 'grid';
  }else{
    advArea.style.display = 'none';
  }

  function vgFrac(t){ return t==='50/50'?0.5:(t==='Full VG'?1:0); }

  function calc(){
    const combo = comboLabelFromList(bottles);
    document.getElementById('combo').textContent = combo || '—';
    document.getElementById('bcount').textContent = bottles.length ? `Basette totali: ${bottles.length} × 10 ml = ${bottles.length*10} ml` : '—';

    const vgFromBottles = types.reduce((acc,t)=> acc + 10 * vgFrac(t), 0);
    const pgFromBottles = bottles.length*10 - vgFromBottles;

    document.getElementById('vgB').textContent = `${vgFromBottles.toFixed(1)} ml`;
    document.getElementById('pgB').textContent = `${pgFromBottles.toFixed(1)} ml`;

    const desiredVG = totalMl * targetVG;
    const desiredPG = totalMl - desiredVG;

    const vgFromShot = shotVG;
    const pgFromShot = shotPG;

    const vgToAdd = Math.max(0, desiredVG - (vgFromBottles + vgFromShot));
    const pgToAdd = Math.max(0, desiredPG - (pgFromBottles + pgFromShot));

    const finalVG = vgFromBottles + vgFromShot + vgToAdd;
    const finalPG = pgFromBottles + pgFromShot + pgToAdd;
    const vgPct = finalVG + finalPG > 0 ? (finalVG/(finalVG+finalPG))*100 : 0;

    document.getElementById('vgAdd').textContent = `${vgToAdd.toFixed(1)} ml`;
    document.getElementById('pgAdd').textContent = `${pgToAdd.toFixed(1)} ml`;
    document.getElementById('vgF').textContent = `${finalVG.toFixed(1)} ml`;
    document.getElementById('pgF').textContent = `${finalPG.toFixed(1)} ml`;
    document.getElementById('ratio').textContent = `Rapporto finale stimato: ${vgPct.toFixed(1)}% VG / ${(100-vgPct).toFixed(1)}% PG`;
  }

  calc();
}
render();

function optimizer(requiredMg, shotMl, totalMl){
  const maxBottles = Math.floor((totalMl - shotMl)/10);
  let best = null;
  const strengths = STRENGTHS;
  function rec(idx, remaining, acc) {
    if(idx===strengths.length){
      if(remaining===0){
        let totalMg=0, bottles=[];
        for(let i=0;i<strengths.length;i++){
          totalMg += acc[i]*strengths[i]*10;
        }
        if(totalMg>=requiredMg){
          const excess = totalMg - requiredMg;
          const n = acc.reduce((s,c)=>s+c,0);
          if(!best || n < best.n || (n===best.n && excess < best.excess)){
            bottles=[];
            for(let i=strengths.length-1;i>=0;i--){
              for(let k=0;k<acc[i];k++) bottles.push(strengths[i]);
            }
            best = { n, excess, bottles, totalMg };
          }
        }
      }
      return;
    }
    for(let c=0;c<=remaining;c++){
      acc[idx]=c;
      rec(idx+1, remaining-c, acc);
    }
    acc[idx]=0;
  }
  for(let n=1;n<=maxBottles;n++){
    rec(0, n, new Array(strengths.length).fill(0));
    if(best) break;
  }
  return best || { bottles: [], n:0, totalMg:0 };
}
