/* ===== CONSTANTS ===== */
const XP_GOOD = 20;      // XP gained per good activity
const XP_BAD  = 15;      // XP lost per bad activity

/* ===== HELPERS ===== */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const today = () => new Date().toISOString().slice(0,10);

/* NEW: tougher exponential XP curve  (150 × 1.5^(lvl‑1)) */
const needXP = lvl => Math.round(150 * Math.pow(1.5, lvl - 1));

/* ===== PERSISTENCE ===== */
function loadXP(){return{xp:+localStorage.xp||0,l:+localStorage.lvl||1}}
function saveXP(xp,l){localStorage.xp=xp;localStorage.lvl=l}

/* ===== DAILY RESET ===== */
function initDay(){
  if(localStorage.date !== today()){
    localStorage.date  = today();
    localStorage.aura  = 0;
    localStorage.bad   = 0;
    localStorage.doneG = '[]';
    localStorage.doneB = '[]';
  }
}

/* ===== DOM READY ===== */
document.addEventListener('DOMContentLoaded',()=>{

  /* --- DOM refs --- */
  const navLinks=$('#navLinks'), burger=$('#burger'), logo=$('#logo');
  const homeBtn=$('#homeTab'), actBtn=$('#activitiesTab');
  const home=$('#homePage'),  acts=$('#activitiesPage');

  const lvlT=$('#levelTitle'), lvlN=$('#levelDisplay');
  const xpFill=$('#xpBar .fill'),   xpVal=$('#xpValue');
  const auraFill=$('#auraBar .fill'),auraVal=$('#auraValue');
  const badFill=$('#badBar .fill'), badVal=$('#badValue');

  const doneTxt=$('#habitsDone'), remain=$('#remainingList');
  const gInputs=$$('#goodList input'), bInputs=$$('#badList input');

  const submit=$('#submitBtn'), reset=$('#resetBtn');
  const popup=$('#popup'), closePop=$('#closePopup');
  const xpCh=$('#xpChange'), auCh=$('#auraChange'),
        bdCh=$('#badChange'), lvUp=$('#levelUpText');

  /* --- title helper --- */
  const titles=new Map([[1,'Initiate'],[2,'Novice'],[3,'Apprentice'],[4,'Practitioner'],[5,'Warrior'],
                        [6,'Hero'],[10,'Master'],[15,'Ascendant'],[30,'Celestial'],[50,'Eternal'],[100,'Supreme']]);
  const title=l=>{let t='Adventurer';for(const[k,v]of titles)if(l>=k)t=v;return t;}

  /* --- bar helper --- */
  function setBar(fill,val){
    const pct=Math.min(Math.abs(val),100)/2;
    fill.style.width=pct+'%';
    if(val>=0){fill.style.left='50%';fill.style.background='var(--good)';}
    else      {fill.style.left=`${50-pct}%`;fill.style.background='var(--bad)';}
  }

  /* --- done marks --- */
  function applyDone(){
    const g=JSON.parse(localStorage.doneG||'[]');
    const b=JSON.parse(localStorage.doneB||'[]');
    gInputs.forEach((c,i)=>c.nextSibling.classList.toggle('done',!!g[i]));
    bInputs.forEach((c,i)=>c.nextSibling.classList.toggle('done',!!b[i]));
  }

  /* --- render --- */
  function render(){
    const {xp,l}=loadXP();
    xpVal.textContent=xp; setBar(xpFill,xp);
    const aura=+localStorage.aura, bad=+localStorage.bad;
    auraVal.textContent=aura.toFixed(2)+'%';
    badVal.textContent =bad .toFixed(2)+'%';
    setBar(auraFill,aura); setBar(badFill,bad);
    lvlN.textContent=`Lv ${l}`; lvlT.textContent=title(l);
    doneTxt.textContent=`Good Habits ${JSON.parse(localStorage.doneG||'[]').filter(Boolean).length} / ${gInputs.length}`;
    remain.innerHTML='';
    gInputs.forEach((c,i)=>{
      if(!JSON.parse(localStorage.doneG||'[]')[i]){
        const li=document.createElement('li');
        li.textContent=c.nextSibling.textContent;
        remain.append(li);
      }
    });
  }

  /* --- navigation --- */
  function showHome(){homeBtn.classList.add('active');actBtn.classList.remove('active');home.classList.add('active');acts.classList.remove('active');navLinks.classList.remove('show')}
  function showActs(){actBtn.classList.add('active');homeBtn.classList.remove('active');acts.classList.add('active');home.classList.remove('active');navLinks.classList.remove('show')}
  homeBtn.onclick=showHome; actBtn.onclick=showActs; logo.onclick=showHome;
  burger.onclick=()=>navLinks.classList.toggle('show');

  /* --- submit logic --- */
  submit.onclick=()=>{
    const auUnit=100/gInputs.length, bdUnit=100/bInputs.length;
    const dg=JSON.parse(localStorage.doneG||'[]'), db=JSON.parse(localStorage.doneB||'[]');
    let dxp=0, da=0, dbp=0;

    gInputs.forEach((cb,i)=>{
      if(cb.checked){dxp+=XP_GOOD; da+=auUnit; dg[i]=true; cb.checked=false;}
    });
    bInputs.forEach((cb,i)=>{
      if(cb.checked){dxp-=XP_BAD; da-=auUnit; dbp+=bdUnit; db[i]=true; cb.checked=false;}
    });

    localStorage.aura=(+localStorage.aura)+da;
    localStorage.bad =(+localStorage.bad )+dbp;

    let {xp,l}=loadXP(); xp+=dxp; let up=false,old=l;
    while(xp>=needXP(l)){xp-=needXP(l);l++;up=true}
    saveXP(xp,l);

    localStorage.doneG=JSON.stringify(dg);localStorage.doneB=JSON.stringify(db);applyDone();

    xpCh.textContent=`XP ${dxp>=0?'+':''}${dxp}`;
    auCh.textContent=da ? `Aura ${da>=0?'+':''}${da.toFixed(2)}%` : '';
    bdCh.textContent=dbp? `Bad +${dbp.toFixed(2)}%` : '';
    lvUp.textContent   =up ? `LEVEL UP! Lv ${old} → ${l} (${title(l)})` : '';
    [auCh,bdCh,lvUp].forEach(el=>el.style.display=el.textContent?'block':'none');

    popup.classList.remove('hidden');
    render();
  };

  /* --- popup controls --- */
  function hidePopup(){popup.classList.add('hidden');}
  closePop.onclick=hidePopup;
  popup.addEventListener('click',e=>{if(e.target===popup)hidePopup()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!popup.classList.contains('hidden'))hidePopup()});

  /* --- reset --- */
  reset.onclick=()=>{if(confirm('Reset ALL progress?')){localStorage.clear();initDay();applyDone();render();}}

  /* --- boot --- */
  initDay(); applyDone(); render();
});
