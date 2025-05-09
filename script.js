/* ===== CONSTANTS ===== */
const XP_GOOD = 20;     // XP gained per good habit
const XP_BAD  = 15;     // XP lost per bad habit
const MAX = 100;        // 0‑100 range for Aura and Bad %

/* ===== HELPERS ===== */
const $  = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const today  = () => new Date().toISOString().slice(0,10);
const needXP = lvl => Math.floor(100 + (lvl - 1) ** 1.7 * 15);

/* ===== PERSISTENCE ===== */
function loadXP(){return{xp:+localStorage.xp || 0, lvl:+localStorage.lvl || 1}}
function saveXP(o){localStorage.xp=o.xp; localStorage.lvl=o.lvl}

/* ===== DAILY INITIALISATION ===== */
function initDay(){
  if(localStorage.date !== today()){
    localStorage.date = today();
    localStorage.aura = 0;         // Aura starts at 0
    localStorage.bad  = 0;
    localStorage.doneG = '[]';
    localStorage.doneB = '[]';
  }
}
function hardReset(){
  localStorage.clear();
  initDay();
  applyDoneMarks();
  renderHome();
}

/* ===== DOM REFERENCES ===== */
const logo=$('#logo'), burger=$('#burger'), links=$('#navLinks');
const homeBtn=$('#homeTab'), actBtn=$('#activitiesTab'), home=$('#homePage'), acts=$('#activitiesPage');
const lvlT=$('#levelTitle'), lvlN=$('#levelDisplay'), xpBar=$('#xpBar'), xpTxt=$('#xpText');
const auraRing=$('#auraRing'), badRing=$('#badRing'), auraTxt=$('#auraText'), badTxt=$('#badText');
const doneTxt=$('#habitsDone'), remain=$('#remainingList'), reset=$('#resetBtn');
const gInputs=$$('#goodList input'), bInputs=$$('#badList input');
const submit=$('#submitBtn'), popup=$('#popup');
const xpCh=$('#xpChange'), auCh=$('#auraChange'), bdCh=$('#badChange'), lvUp=$('#levelUpText');
$('#closePopup').onclick = ()=> popup.classList.add('hidden');

/* ===== NAVIGATION ===== */
homeBtn.onclick=showHome; actBtn.onclick=showActs; logo.onclick=showHome;
burger.onclick = ()=> links.classList.toggle('show');
function showHome(){homeBtn.classList.add('active');actBtn.classList.remove('active');home.classList.add('active');acts.classList.remove('active')}
function showActs(){actBtn.classList.add('active');homeBtn.classList.remove('active');acts.classList.add('active');home.classList.remove('active')}

/* ===== LEVEL TITLES ===== */
const titles=new Map([[1,'Initiate'],[2,'Novice'],[3,'Apprentice'],[4,'Practitioner'],[5,'Warrior'],[6,'Hero'],[10,'Master'],[15,'Ascendant'],[30,'Celestial'],[50,'Eternal'],[100,'Supreme']]);
const title = lvl => {let t='Adventurer'; for(const[k,v] of titles) if(lvl>=k) t=v; return t}

/* ===== DONE‑MARK LOGIC ===== */
function applyDoneMarks(){
  const dg=JSON.parse(localStorage.doneG||'[]');
  const db=JSON.parse(localStorage.doneB||'[]');
  gInputs.forEach((c,i)=>c.nextSibling.classList.toggle('done',!!dg[i]));
  bInputs.forEach((c,i)=>c.nextSibling.classList.toggle('done',!!db[i]));
}
function updateDoneArrays(dg,db){
  localStorage.doneG = JSON.stringify(dg);
  localStorage.doneB = JSON.stringify(db);
  applyDoneMarks();
}

/* ===== HOME RENDERING ===== */
function renderHome(){
  const {xp,lvl}=loadXP(), next=needXP(lvl);
  xpTxt.textContent = `${xp} / ${next} XP`;
  xpBar.style.width  = `${(xp/next)*100}%`;
  lvlN.textContent   = `Lv ${lvl}`; lvlT.textContent = title(lvl);

  const aura = +localStorage.aura, bad = +localStorage.bad;
  auraTxt.textContent = `Aura ${aura.toFixed(2)}%`;
  badTxt.textContent  = `Bad ${bad.toFixed(2)}%`;
  auraRing.style.setProperty('--p', aura);
  badRing .style.setProperty('--p', bad);

  const doneGood=JSON.parse(localStorage.doneG||'[]').filter(Boolean).length;
  doneTxt.textContent = `Good Habits ${doneGood} / ${gInputs.length}`;

  /* Remaining good list */
  remain.innerHTML='';
  gInputs.forEach((c,i)=>{
    if(!(JSON.parse(localStorage.doneG||'[]')[i])){
      const li=document.createElement('li');
      li.textContent = c.nextSibling.textContent;
      remain.append(li);
    }
  });
}

/* ===== SUBMISSION HANDLER ===== */
submit.onclick = () => {
  /* Dynamic per‑activity shares */
  const auraUnit = MAX / gInputs.length;      // gain / loss for Aura
  const badUnit  = MAX / bInputs.length;      // contribution to Bad %

  const dg = JSON.parse(localStorage.doneG||'[]');
  const db = JSON.parse(localStorage.doneB||'[]');

  let dxp = 0, dAura = 0, dBad = 0;

  /* Good activities */
  gInputs.forEach((c,i)=>{
    if(c.checked){
      dxp   += XP_GOOD;
      dAura += auraUnit;
      dg[i]  = true;
      c.checked = false;
    }
  });

  /* Bad activities */
  bInputs.forEach((c,i)=>{
    if(c.checked){
      dxp   -= XP_BAD;
      dAura -= auraUnit;
      dBad  += badUnit;
      db[i]  = true;
      c.checked = false;
    }
  });

  /* Update Aura / Bad, clamp to 0‑100 */
  let aura = +localStorage.aura + dAura;
  let bad  = +localStorage.bad  + dBad;
  aura = Math.max(0, Math.min(MAX, aura));
  bad  = Math.max(0, Math.min(MAX, bad));
  localStorage.aura = aura;
  localStorage.bad  = bad;

  /* Update XP / Level */
  let {xp,lvl} = loadXP(); xp = Math.max(0, xp + dxp);
  let leveled=false, oldLvl=lvl;
  while(xp >= needXP(lvl)){xp -= needXP(lvl); lvl++; leveled=true}
  saveXP({xp,lvl});

  updateDoneArrays(dg,db);

  /* Popup lines */
  xpCh.textContent   = `XP ${dxp>=0?'+':''}${dxp}`;
  auCh.textContent   = dAura ? `Aura ${dAura>=0?'+':''}${dAura.toFixed(2)}%` : '';
  bdCh.textContent   = dBad  ? `Bad +${dBad.toFixed(2)}%` : '';
  lvUp.textContent   = leveled ? `LEVEL UP! Lv ${oldLvl} → ${lvl} (${title(lvl)})` : '';
  [auCh,bdCh,lvUp].forEach(el=>el.style.display=el.textContent?'block':'none');
  popup.classList.remove('hidden');

  renderHome();
};

/* ===== RESET BUTTON ===== */
reset.onclick = ()=>{ if(confirm('Reset ALL progress?')) hardReset() };

/* ===== INIT ===== */
initDay();
applyDoneMarks();
renderHome();
