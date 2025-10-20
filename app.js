// Nic Calculator AM - vanilla JS
const NIC_OPTIONS = [3,4,5,6,7,8,9,10,12,13.5];
const STRENGTHS = [4,6,8,12,18,20];
// Official combos for 20->60 (mg values per bottle)
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
  13.5: [20,20,20,20], // preset types explained below
};
const PRESET_135_TYPES = ["50/50","50/50","Full PG","Full PG"];

const tabs = document.querySelectorAll('.tab');
let currentTab = '20-60'; // default start
tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTab = btn.dataset.tab;
  render();
}));

const nicSelect = document.getElementById('nicSelect');
NIC_OPTIONS.forEach(v => {
  const opt = document.createElement('option');
  opt.value = String(v);
  opt.textContent = `${v} mg/ml`;
  nicSelect.appendChild(opt);
});
nicSelect.value = '7';

const typeSelect = document.getElementById('typeSelect');
const advToggle = document.getElementById('advToggle');
const advArea = document.getElementById('advArea');

advToggle.addEventListener('change', render);
typeSelect.addEventListener('change', render);
nicSelect.addEventListener('change', render);

function vgFrac(t){ return t === '50/50' ? 0.5 : (t === 'Full VG' ? 1 : 0); }

function optimizer(requiredMg, shotMl, totalMl){
  const maxBottles = Math.floor((totalMl - shotMl)/10);
  let best = null;
  for(let n=1;n<=maxBottles;n++){
    // brute-force counts across strengths is heavy; try simple heuristic: prefer high strengths first
    // we'll generate combinations by recursion limited by n
    const combs = [];
    function rec(idx, remaining, cur){
      if(idx===STRENGTHS.length){
        if(remaining===0) combs.push(cur.slice());
        return;
      }
      for(let c=0;c<=remaining;c++){
        cur[idx]=c;
        rec(idx+1, remaining-c, cur);
      }
      cur.pop();
    }
    rec(0, n, []);
    for(const counts of combs){
      const totalMg = counts.reduce((acc,c,i)=> acc + c*STRENGTHS[i]*10, 0);
      if(totalMg >= requiredMg){
        const excess = totalMg - requiredMg;
        if(!best || n < best.n || (n===best.n && excess < best.excess)){
          best = { n, excess, counts, totalMg };
        }
      }
    }
    if(best) break;
  }
  if(!best) return { bottles: [], n:0, totalMg:0 };
  // expand to bottle list in descending strengths for readability
  const list = [];
  for(let i=STRENGTHS.length-1;i>=0;i--){
    for(let c=0;c<best.counts[i];c++) list.push(STRENGTHS[i]);
  }
  return { bottles:list, n:best.n, totalMg:best.totalMg };
}

function comboLabelFromList(list){
  const counts = {};
  list.forEach(mg => counts[mg]=(counts[mg]||0)+1);
  return Object.entries(counts).sort((a,b)=>Number(b[0])-Number(a[0]))
    .map(([mg,c])=> `${c}×${mg}mg`).join(' + ');
}

function render(){
  const nic = Number(nicSelect.value);
  const typeGlobal = typeSelect.value;
  // tab settings
  const [shotMl, totalMl, targetVG] = currentTab==='10-30' ? [10,30,0.5] : (currentTab==='20-60' ? [20,60,0.5] : [30,90,0.7]);
  document.getElementById('shotMl').textContent = `${shotMl} ml`;
  document.getElementById('totalMl').textContent = `${totalMl} ml`;
  document.getElementById('targetVG').textContent = `${Math.round(targetVG*100)}%`;
  const requiredMg = nic * totalMl;
  document.getElementById('nicReq').textContent = `${Math.round(requiredMg)} mg`;
  document.getElementById('nicEff').textContent = `${(requiredMg/totalMl).toFixed(2)} mg/ml`;

  let bottles;
  if(currentTab==='20-60'){
    bottles = OFFICIAL_20_60[nic];
  }else{
    // compute automatically, same proportions constraint is approximated by using min bottles heuristic under volume cap
    bottles = optimizer(requiredMg, shotMl, totalMl).bottles;
  }

  // preset for 13.5 in 20-60
  let types = bottles.map(()=> typeGlobal);
  if(currentTab==='20-60' && nic===13.5){
    types = PRESET_135_TYPES.slice(0, bottles.length);
    typeSelect.disabled = true;
  }else{
    typeSelect.disabled = false;
  }

  // advanced per-bottle UI
  const adv = advToggle.checked;
  advArea.innerHTML = '';
  if(adv){
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

  function calc(){
    // combination label
    const combo = comboLabelFromList(bottles);
    document.getElementById('combo').textContent = combo || '—';
    document.getElementById('bcount').textContent = bottles.length ? `Basette totali: ${bottles.length} × 10 ml = ${bottles.length*10} ml` : '—';

    // volumes from basettes
    const vgFromBottles = types.reduce((acc,t)=> acc + 10 * (t==='50/50'?0.5:(t==='Full VG'?1:0)), 0);
    const pgFromBottles = bottles.length*10 - vgFromBottles;
    const pgFromShot = shotMl;

    document.getElementById('vgB').textContent = `${vgFromBottles.toFixed(1)} ml`;
    document.getElementById('pgB').textContent = `${pgFromBottles.toFixed(1)} ml`;
    document.getElementById('pgS').textContent = `${pgFromShot.toFixed(1)} ml`;

    const desiredVG = totalMl * targetVG;
    const desiredPG = totalMl - desiredVG;
    const vgToAdd = Math.max(0, desiredVG - vgFromBottles);
    const pgToAdd = Math.max(0, desiredPG - (pgFromBottles + pgFromShot));

    const finalVG = vgFromBottles + vgToAdd;
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