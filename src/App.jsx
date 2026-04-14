import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

/* ══════════════════════════════════════════
   FIREBASE
══════════════════════════════════════════ */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const db = getDatabase(initializeApp(firebaseConfig));
const S = {
  async get(k) { try { const s = await get(ref(db,k)); return s.exists() ? s.val() : null; } catch { return null; } },
  async set(k,v) { try { await set(ref(db,k),v); } catch {} },
};

/* ══════════════════════════════════════════
   IMAGE COMPRESSION
══════════════════════════════════════════ */
const compressImage = (file) => new Promise((resolve) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    const ratio = Math.min(800/img.width, 800/img.height, 1);
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', 0.6));
  };
  img.src = URL.createObjectURL(file);
});

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const TODAY = () => new Date().toISOString().slice(0,10);
const uid   = () => Math.random().toString(36).slice(2,9);
const EMOJIS = ['🪥','🛏️','🧹','🗑️','👗','📚','🍽️','🚿','🐕','🌿','💪','✏️','🎒','🧺','🍎','⭐','🎯','🎨','🎮','🍳','🌸','🌟','🎀','🦋','🐱','🦊','🌈','🏃','🪴','💅','🕷️','🫧','☀️','🌅','🌙','💆','💇','🧼'];
const TIME_GROUPS = ['morning','midday','afternoon','evening'];
const TIME_META = {
  morning:   { label:'Morning Routine', icon:'🌅', color:'#f59e0b' },
  midday:    { label:'Mid Day',         icon:'☀️', color:'#3b82f6' },
  afternoon: { label:'Afternoon',       icon:'🌤️', color:'#8b5cf6' },
  evening:   { label:'Evening',         icon:'🌙', color:'#6366f1' },
};

const MORNING_MANTRAS = [
  '"Today is going to be a great day"',
  '"Something wonderful is going to happen, I wonder what it is"',
  '"I can handle whatever comes my way today"',
  '"An exciting new chapter of my life is starting today"',
  '"I believe in myself"',
  '"I believe in my relationships"',
  '"I believe in my ability to live my best life"',
  '"I am so grateful for all that I have and all that is on its way"',
  '"I am a magnet for abundance and success"',
];
const MIDDAY_MANTRAS = [
  '"I am allowed to be a work in progress"',
  '"I give myself credit for how hard I am trying"',
  '"I can handle whatever comes my way today"',
  '"If I keep showing up, life will reward me"',
  '"Everything in my life is unfolding for my highest good"',
  '"I have an important contribution to make to the world"',
];

/* ══════════════════════════════════════════
   DEFAULT TASKS  (same structure for both girls)
   requiresProof: parent toggles per-task
   timeOfDay: groups display in kid view
   isMantras / isGoal / isGoalReview: special UI
══════════════════════════════════════════ */
const makeRoutine = (p) => [
  // ── MORNING ──────────────────────────────
  { id:`${p}m1`, title:'Morning Mantras',                    emoji:'🌅', recurring:true, minutes:10, requiresProof:false, timeOfDay:'morning', isMantras:true,     mantras:MORNING_MANTRAS, hasGratitude:true },
  { id:`${p}m2`, title:'Brush teeth',                        emoji:'🪥', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'morning' },
  { id:`${p}m3`, title:'Put deodorant on',                   emoji:'✨', recurring:true, minutes:3,  requiresProof:false, timeOfDay:'morning' },
  { id:`${p}m4`, title:'Put on fresh clean clothes',         emoji:'👗', recurring:true, minutes:5,  requiresProof:true,  timeOfDay:'morning' },
  { id:`${p}m5`, title:'Brush hair',                         emoji:'💇', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'morning' },
  { id:`${p}m6`, title:'Eat breakfast',                      emoji:'🍳', recurring:true, minutes:10, requiresProof:false, timeOfDay:'morning' },
  { id:`${p}m7`, title:'Make your bed',                      emoji:'🛏️', recurring:true, minutes:10, requiresProof:true,  timeOfDay:'morning' },
  { id:`${p}m8`, title:'Tidy up space before heading out',   emoji:'🧹', recurring:true, minutes:10, requiresProof:false, timeOfDay:'morning' },
  { id:`${p}m9`, title:"What's your goal for today?",        emoji:'🎯', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'morning', isGoal:true },
  // ── MID DAY ──────────────────────────────
  { id:`${p}d1`, title:'Mid Day Mantras',                    emoji:'☀️', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'midday',  isMantras:true, mantras:MIDDAY_MANTRAS },
  { id:`${p}d2`, title:'Eat lunch',                          emoji:'🍽️', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'midday' },
  { id:`${p}d3`, title:'Check wardrobe — clothes still clean?', emoji:'👔', recurring:true, minutes:3, requiresProof:false, timeOfDay:'midday' },
  { id:`${p}d4`, title:'Check hair — still looking good?',   emoji:'💆', recurring:true, minutes:3,  requiresProof:false, timeOfDay:'midday' },
  // ── AFTERNOON ────────────────────────────
  { id:`${p}a1`, title:'Do your homework',                   emoji:'📚', recurring:true, minutes:15, requiresProof:false, timeOfDay:'afternoon' },
  { id:`${p}a2`, title:'Eat afternoon snack',                emoji:'🍎', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'afternoon' },
  { id:`${p}a3`, title:'Prep for the afternoon',             emoji:'🎒', recurring:true, minutes:10, requiresProof:false, timeOfDay:'afternoon' },
  { id:`${p}a4`, title:'Check your room is clean',           emoji:'🧹', recurring:true, minutes:10, requiresProof:false, timeOfDay:'afternoon' },
  // ── EVENING ──────────────────────────────
  { id:`${p}e1`, title:'Eat dinner',                         emoji:'🍽️', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'evening' },
  { id:`${p}e2`, title:'Take a shower before 6:30pm',        emoji:'🚿', recurring:true, minutes:15, requiresProof:false, timeOfDay:'evening' },
  { id:`${p}e3`, title:'Brush teeth',                        emoji:'🪥', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'evening' },
  { id:`${p}e4`, title:'Prep hair for bed',                  emoji:'🌙', recurring:true, minutes:10, requiresProof:false, timeOfDay:'evening' },
  { id:`${p}e5`, title:'Clean bathroom upstairs',            emoji:'🧼', recurring:true, minutes:15, requiresProof:true,  timeOfDay:'evening' },
  { id:`${p}e6`, title:'Prep clothes for tomorrow',          emoji:'👗', recurring:true, minutes:10, requiresProof:false, timeOfDay:'evening' },
  { id:`${p}e7`, title:'Check if clothes need to be washed', emoji:'🧺', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'evening' },
  { id:`${p}e8`, title:'Tidy up room before bed',            emoji:'✨', recurring:true, minutes:10, requiresProof:true,  timeOfDay:'evening' },
  { id:`${p}e9`, title:'Did you accomplish your goal today?',emoji:'🌟', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'evening', isGoalReview:true },
  { id:`${p}e10`,title:'Go to bed on time',                  emoji:'💤', recurring:true, minutes:5,  requiresProof:false, timeOfDay:'evening' },
];

const DEFAULT = {
  pins: { parent:'1234', isabella:'1111', jocelyn:'2222' },
  tasks: { isabella: makeRoutine('ib'), jocelyn: makeRoutine('jc') },
};

/* ══════════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════════ */
const GLOBAL_CSS = `
  @keyframes twinkle   { 0%,100%{opacity:.2} 50%{opacity:.9} }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  @keyframes popIn     { 0%{transform:scale(0)} 65%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-9px)} 75%{transform:translateX(9px)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes sakura    { 0%{transform:translateY(-30px) rotate(0deg);opacity:.9} 100%{transform:translateY(105vh) rotate(400deg);opacity:0} }
  @keyframes pulse     { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.04)} }
  @keyframes webDrift  { 0%,100%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(3deg) scale(1.02)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes slideDown { from{opacity:0;max-height:0} to{opacity:1;max-height:1000px} }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
`;

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
export default function App() {
  const [view,      setView]      = useState('landing');
  const [pinTarget, setPinTarget] = useState(null);
  const [config,    setConfig]    = useState(null);
  const [comp,      setComp]      = useState({ isabella:[], jocelyn:[] });
  const [bal,       setBal]       = useState({ isabella:0,  jocelyn:0  });
  const [proofs,    setProofs]    = useState({ isabella:{}, jocelyn:{} });
  const [goals,     setGoals]     = useState({ isabella:'', jocelyn:'' });
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!document.getElementById('koda-fonts')) {
      const l = document.createElement('link'); l.id='koda-fonts'; l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Poppins:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(l);
    }
    if (!document.getElementById('koda-css')) {
      const s = document.createElement('style'); s.id='koda-css'; s.textContent=GLOBAL_CSS;
      document.head.appendChild(s);
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    const raw = await S.get('cm-config');
    const cfg = raw ? JSON.parse(raw) : DEFAULT;
    setConfig(cfg);
    const today = TODAY();
    const [ib,jc,ibB,jcB,ibP,jcP,ibG,jcG] = await Promise.all([
      S.get(`cm-c-isabella-${today}`), S.get(`cm-c-jocelyn-${today}`),
      S.get('cm-b-isabella'),          S.get('cm-b-jocelyn'),
      S.get(`cm-proofs-isabella-${today}`), S.get(`cm-proofs-jocelyn-${today}`),
      S.get(`cm-goal-isabella-${today}`),   S.get(`cm-goal-jocelyn-${today}`),
    ]);
    setComp({   isabella: ib  ? JSON.parse(ib)  : [], jocelyn: jc  ? JSON.parse(jc)  : [] });
    setBal({    isabella: ibB ? parseInt(ibB)    : 0,  jocelyn: jcB ? parseInt(jcB)   : 0  });
    setProofs({ isabella: ibP ? JSON.parse(ibP) : {}, jocelyn: jcP ? JSON.parse(jcP) : {} });
    setGoals({  isabella: ibG || '', jocelyn: jcG || '' });
    setLoading(false);
  };

  const saveConfig = async (c) => { setConfig(c); await S.set('cm-config', JSON.stringify(c)); };

  // Toggle requiresProof on a single task
  const toggleProofRequired = (user, taskId) => {
    const updated = config.tasks[user].map(t => t.id === taskId ? { ...t, requiresProof: !t.requiresProof } : t);
    saveConfig({ ...config, tasks: { ...config.tasks, [user]: updated } });
  };

  // Regular tap to complete (non-proof tasks)
  const toggleTask = async (user, taskId) => {
    const today = TODAY();
    const cur  = comp[user];
    const task = config.tasks[user].find(t => t.id === taskId);
    if (!task) return;
    const checking = !cur.includes(taskId);
    const newComp  = checking ? [...cur, taskId] : cur.filter(id => id !== taskId);
    const newBal   = Math.max(0, bal[user] + (checking ? task.minutes : -task.minutes));
    setComp(p => ({ ...p, [user]: newComp }));
    setBal(p  => ({ ...p, [user]: newBal  }));
    await S.set(`cm-c-${user}-${today}`, JSON.stringify(newComp));
    await S.set(`cm-b-${user}`, String(newBal));
  };

  // Force complete (used by goal submit & mantra done)
  const completeTask = async (user, taskId) => {
    const today = TODAY();
    const task = config.tasks[user].find(t => t.id === taskId);
    if (!task || comp[user].includes(taskId)) return;
    const newComp = [...comp[user], taskId];
    const newBal  = bal[user] + task.minutes;
    setComp(p => ({ ...p, [user]: newComp }));
    setBal(p  => ({ ...p, [user]: newBal  }));
    await S.set(`cm-c-${user}-${today}`, JSON.stringify(newComp));
    await S.set(`cm-b-${user}`, String(newBal));
  };

  // Kid sets their daily goal
  const submitGoal = async (user, goalText) => {
    const today = TODAY();
    setGoals(p => ({ ...p, [user]: goalText }));
    await S.set(`cm-goal-${user}-${today}`, goalText);
    const goalTask = config.tasks[user].find(t => t.isGoal);
    if (goalTask) await completeTask(user, goalTask.id);
  };

  // Submit photo proof — goes to pending
  const submitProof = async (user, taskId, photoBase64) => {
    const today = TODAY();
    const task  = config.tasks[user].find(t => t.id === taskId);
    const updated = { ...proofs[user], [taskId]: { photo: photoBase64, taskTitle: task?.title||'', taskEmoji: task?.emoji||'📸', submittedAt: new Date().toISOString() } };
    setProofs(p => ({ ...p, [user]: updated }));
    await S.set(`cm-proofs-${user}-${today}`, JSON.stringify(updated));
  };

  // Parent approves proof → task complete, stars earned, photo gone
  const approveProof = async (user, taskId) => {
    const today = TODAY();
    const task  = config.tasks[user].find(t => t.id === taskId);
    const newComp = [...comp[user], taskId];
    const newBal  = bal[user] + (task?.minutes || 0);
    setComp(p => ({ ...p, [user]: newComp }));
    setBal(p  => ({ ...p, [user]: newBal  }));
    await S.set(`cm-c-${user}-${today}`, JSON.stringify(newComp));
    await S.set(`cm-b-${user}`, String(newBal));
    const updated = { ...proofs[user] }; delete updated[taskId];
    setProofs(p => ({ ...p, [user]: updated }));
    await S.set(`cm-proofs-${user}-${today}`, JSON.stringify(updated));
  };

  // Parent rejects proof → task back to incomplete, photo gone
  const rejectProof = async (user, taskId) => {
    const today = TODAY();
    const updated = { ...proofs[user] }; delete updated[taskId];
    setProofs(p => ({ ...p, [user]: updated }));
    await S.set(`cm-proofs-${user}-${today}`, JSON.stringify(updated));
  };

  const redeem = async (user, mins) => {
    const newBal = Math.max(0, bal[user] - mins);
    setBal(p => ({ ...p, [user]: newBal }));
    await S.set(`cm-b-${user}`, String(newBal));
  };

  if (loading) return <div style={{minHeight:'100vh',background:'#0d0d2b',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'white',fontFamily:'sans-serif',fontSize:20}}>🌟 Loading Koda…</div></div>;

  if (view==='landing')   return <Landing onSelect={t=>{setPinTarget(t);setView('pin');}}/>;
  if (view==='pin')       return <PinScreen target={pinTarget} config={config} onSuccess={()=>setView(pinTarget)} onBack={()=>setView('landing')}/>;
  if (view==='parent')    return <ParentView config={config} saveConfig={saveConfig} comp={comp} bal={bal} proofs={proofs} goals={goals} redeem={redeem} approveProof={approveProof} rejectProof={rejectProof} toggleProofRequired={toggleProofRequired} logout={()=>setView('landing')}/>;
  if (view==='isabella')  return <KidView user="isabella" theme="kawaii" tasks={config.tasks.isabella} comp={comp.isabella} proofs={proofs.isabella} goal={goals.isabella} onToggle={id=>toggleTask('isabella',id)} onComplete={id=>completeTask('isabella',id)} onSubmitProof={(id,p)=>submitProof('isabella',id,p)} onSetGoal={g=>submitGoal('isabella',g)} bal={bal.isabella} logout={()=>setView('landing')}/>;
  if (view==='jocelyn')   return <KidView user="jocelyn"  theme="spidey" tasks={config.tasks.jocelyn}  comp={comp.jocelyn}  proofs={proofs.jocelyn}  goal={goals.jocelyn}  onToggle={id=>toggleTask('jocelyn',id)}  onComplete={id=>completeTask('jocelyn',id)}  onSubmitProof={(id,p)=>submitProof('jocelyn',id,p)}  onSetGoal={g=>submitGoal('jocelyn',g)}  bal={bal.jocelyn}  logout={()=>setView('landing')}/>;
  return null;
}

/* ══════════════════════════════════════════
   LANDING
══════════════════════════════════════════ */
function Landing({ onSelect }) {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0d2b 0%,#1a0533 60%,#0d1a2b 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Nunito',sans-serif",position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{textAlign:'center',marginBottom:36,position:'relative',zIndex:1}}>
        <div style={{fontSize:64,marginBottom:4,filter:'drop-shadow(0 0 24px rgba(255,220,80,0.8))'}}>🌟</div>
        <h1 style={{color:'white',fontSize:38,fontWeight:900,margin:'0 0 6px',letterSpacing:-1,fontFamily:"'Fredoka One',sans-serif"}}>Koda</h1>
        <p style={{color:'rgba(255,220,80,0.7)',fontSize:13,margin:0,letterSpacing:1}}>Do the thing. Earn the stars. ✨</p>
      </div>
      <div style={{width:'100%',maxWidth:380,position:'relative',zIndex:1}}>
        <LandingCard emoji="👨‍👩‍👧‍👦" name="Parent" sub="Mission Control" bg="linear-gradient(135deg,#1e3a5f,#243b80)" border="rgba(99,179,237,0.35)" glow="rgba(59,130,246,0.25)" onClick={()=>onSelect('parent')}/>
        <LandingCard emoji="🌸" name="Isabella" sub="✨ Your kawaii quests!" bg="linear-gradient(135deg,#7b2ff7,#f107a3)" border="rgba(255,182,213,0.5)" glow="rgba(241,7,163,0.3)" badge="アニメ" onClick={()=>onSelect('isabella')}/>
        <LandingCard emoji="🕷️" name="Jossy" sub="Your web of tasks awaits 💅" bg="linear-gradient(135deg,#8b0000,#e91e63)" border="rgba(255,100,150,0.4)" glow="rgba(220,0,50,0.3)" webDeco onClick={()=>onSelect('jocelyn')}/>
      </div>
      <div style={{marginTop:20,padding:'8px 18px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.3)',fontSize:11,position:'relative',zIndex:1,textAlign:'center'}}>
        🌟 Koda &nbsp;·&nbsp; Default PINs: Parent 1234 · Isabella 1111 · Jossy 2222
      </div>
    </div>
  );
}

function Stars() {
  const stars = Array.from({length:36},(_,i)=>({x:(i*37+13)%100,y:(i*53+7)%100,size:1+(i%3),delay:(i*0.4)%4,dur:2+(i%3)}));
  return <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{stars.map((s,i)=><div key={i} style={{position:'absolute',left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,borderRadius:'50%',background:'white',animation:`twinkle ${s.dur}s ${s.delay}s infinite`}}/>)}</div>;
}

function LandingCard({emoji,name,sub,bg,border,glow,badge,webDeco,onClick}) {
  const [hov,setHov]=useState(false);
  const webPat=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg stroke='rgba(255,255,255,0.18)' fill='none' stroke-width='0.7'%3E%3Ccircle cx='60' cy='60' r='15'/%3E%3Ccircle cx='60' cy='60' r='35'/%3E%3Ccircle cx='60' cy='60' r='55'/%3E%3Cline x1='60' y1='5' x2='60' y2='115'/%3E%3Cline x1='5' y1='60' x2='115' y2='60'/%3E%3Cline x1='18' y1='18' x2='102' y2='102'/%3E%3Cline x1='102' y1='18' x2='18' y2='102'/%3E%3C/g%3E%3C/svg%3E")`;
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:bg,border:`1.5px solid ${border}`,borderRadius:22,padding:'18px 22px',marginBottom:14,cursor:'pointer',display:'flex',alignItems:'center',gap:14,position:'relative',overflow:'hidden',boxShadow:hov?`0 12px 44px ${glow}`:`0 4px 22px rgba(0,0,0,0.45)`,transform:hov?'translateY(-3px) scale(1.01)':'none',transition:'all 0.25s cubic-bezier(.34,1.56,.64,1)'}}>
      {webDeco&&<div style={{position:'absolute',right:-20,top:-20,width:120,height:120,backgroundImage:webPat,backgroundSize:'contain',backgroundRepeat:'no-repeat',animation:'webDrift 6s ease infinite'}}/>}
      <div style={{fontSize:36,animation:hov?'float 1.5s ease infinite':'none',flexShrink:0}}>{emoji}</div>
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8,color:'white',fontWeight:800,fontSize:20}}>
          {name}{badge&&<span style={{fontSize:11,background:'rgba(255,255,255,0.25)',borderRadius:6,padding:'2px 8px',fontWeight:700,letterSpacing:1}}>{badge}</span>}
        </div>
        <div style={{color:'rgba(255,255,255,0.72)',fontSize:13,marginTop:2}}>{sub}</div>
      </div>
      <div style={{color:'rgba(255,255,255,0.45)',fontSize:24}}>›</div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PIN SCREEN
══════════════════════════════════════════ */
function PinScreen({target,config,onSuccess,onBack}) {
  const [digits,setDigits]=useState([]);
  const [err,setErr]=useState(false);
  const [shake,setShake]=useState(false);
  const COLOR={parent:'#3b82f6',isabella:'#f107a3',jocelyn:'#e91e63'};
  const NAME={parent:'Parent',isabella:'Isabella',jocelyn:'Jossy'};
  const ICON={parent:'🔐',isabella:'🌸',jocelyn:'🕷️'};
  const color=COLOR[target];
  const add=d=>{
    if(digits.length>=4)return;
    const next=[...digits,d]; setDigits(next);
    if(next.length===4){setTimeout(()=>{if(next.join('')===config.pins[target]){onSuccess();}else{setErr(true);setShake(true);setTimeout(()=>{setDigits([]);setErr(false);setShake(false);},700);}},150);}
  };
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0d2b,#1a0533)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Nunito',sans-serif",position:'relative'}}>
      <Stars/>
      <button onClick={onBack} style={{position:'absolute',top:24,left:24,zIndex:10,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:12,padding:'8px 16px',color:'rgba(255,255,255,0.8)',cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Back</button>
      <div style={{textAlign:'center',marginBottom:44,zIndex:1}}>
        <div style={{fontSize:54,marginBottom:10}}>{ICON[target]}</div>
        <h2 style={{color:'white',fontSize:26,fontWeight:800,margin:'0 0 6px'}}>{NAME[target]}</h2>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,margin:0}}>Enter your PIN to continue</p>
      </div>
      <div style={{display:'flex',gap:20,marginBottom:44,zIndex:1,animation:shake?'shake 0.5s ease':'none'}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:18,height:18,borderRadius:'50%',background:i<digits.length?color:'rgba(255,255,255,0.15)',border:`2px solid ${i<digits.length?color:'rgba(255,255,255,0.3)'}`,boxShadow:i<digits.length?`0 0 16px ${color}`:'none',transition:'all 0.2s ease'}}/>)}
      </div>
      {err&&<div style={{color:'#f87171',fontSize:14,marginBottom:16,zIndex:1}}>Wrong PIN — try again!</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,width:'100%',maxWidth:270,zIndex:1}}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i)=>(
          <button key={i} onClick={()=>d==='⌫'?setDigits(p=>p.slice(0,-1)):d!==''?add(String(d)):null} disabled={d===''}
            style={{height:64,background:d===''?'transparent':d==='⌫'?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.1)',border:d===''?'none':'1px solid rgba(255,255,255,0.15)',borderRadius:16,color:'white',fontSize:d==='⌫'?22:24,fontWeight:700,cursor:d===''?'default':'pointer',fontFamily:'inherit'}}>{d}</button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PARENT DASHBOARD
══════════════════════════════════════════ */
function ParentView({config,saveConfig,comp,bal,proofs,goals,redeem,approveProof,rejectProof,toggleProofRequired,logout}) {
  const [tab,setTab]=useState('overview');
  const [addFor,setAddFor]=useState(null);
  const [newTask,setNewTask]=useState({title:'',emoji:'⭐',recurring:true,minutes:15,requiresProof:false,timeOfDay:'morning'});
  const [showEmoji,setShowEmoji]=useState(false);
  const [redeemAmt,setRedeemAmt]=useState({isabella:'',jocelyn:''});
  const [newPins,setNewPins]=useState({parent:'',isabella:'',jocelyn:''});
  const [savedMsg,setSavedMsg]=useState('');
  const pendingCount=Object.keys(proofs.isabella||{}).length+Object.keys(proofs.jocelyn||{}).length;

  const addTask=user=>{
    if(!newTask.title.trim())return;
    saveConfig({...config,tasks:{...config.tasks,[user]:[...config.tasks[user],{id:uid(),...newTask}]}});
    setNewTask({title:'',emoji:'⭐',recurring:true,minutes:15,requiresProof:false,timeOfDay:'morning'});
    setAddFor(null);setShowEmoji(false);
  };
  const delTask=(user,id)=>saveConfig({...config,tasks:{...config.tasks,[user]:config.tasks[user].filter(t=>t.id!==id)}});
  const doRedeem=user=>{const m=parseInt(redeemAmt[user]);if(!m||m<=0)return;redeem(user,m);setRedeemAmt(p=>({...p,[user]:''}));};
  const savePins=()=>{
    saveConfig({...config,pins:{parent:newPins.parent||config.pins.parent,isabella:newPins.isabella||config.pins.isabella,jocelyn:newPins.jocelyn||config.pins.jocelyn}});
    setNewPins({parent:'',isabella:'',jocelyn:''});setSavedMsg('✅ PINs saved!');setTimeout(()=>setSavedMsg(''),2500);
  };

  const TABS=[{id:'overview',label:'🏠',title:'Overview'},{id:'proof',label:'📸',title:'Proof',badge:pendingCount},{id:'isabella',label:'🌸',title:'Isabella'},{id:'jocelyn',label:'🕷️',title:'Jossy'},{id:'rewards',label:'🏆',title:'Rewards'},{id:'settings',label:'⚙️',title:'Settings'}];

  return (
    <div style={{minHeight:'100vh',background:'#0a0f1e',fontFamily:"'Nunito',sans-serif",color:'white'}}>
      <div style={{background:'linear-gradient(135deg,#0f2a4a,#1a3a6e)',padding:'20px 20px 0',borderBottom:'1px solid rgba(99,179,237,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><div style={{fontWeight:900,fontSize:22}}>🌟 Koda</div><div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>Parent · Mission Control</div></div>
          <button onClick={logout} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,padding:'6px 14px',color:'rgba(255,255,255,0.65)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Sign Out</button>
        </div>
        <div style={{display:'flex',gap:2,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:'transparent',border:'none',borderBottom:`3px solid ${tab===t.id?'#60a5fa':'transparent'}`,padding:'8px 12px 12px',color:tab===t.id?'white':'rgba(255,255,255,0.45)',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?700:400,fontFamily:'inherit',whiteSpace:'nowrap',position:'relative'}}>
              {t.label} {t.title}
              {t.badge>0&&<span style={{position:'absolute',top:4,right:2,background:'#ef4444',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'20px',maxWidth:580,margin:'0 auto'}}>

        {tab==='overview'&&<ParentOverview comp={comp} bal={bal} proofs={proofs} goals={goals} config={config} onShowProof={()=>setTab('proof')}/>}
        {tab==='proof'&&<ProofInbox proofs={proofs} config={config} onApprove={approveProof} onReject={rejectProof}/>}

        {(tab==='isabella'||tab==='jocelyn')&&(
          <ParentTaskTab user={tab} tasks={config.tasks[tab]} comp={comp[tab]} proofs={proofs[tab]||{}} onAdd={()=>setAddFor(tab)} onDel={id=>delTask(tab,id)} onToggleProof={id=>toggleProofRequired(tab,id)} addFor={addFor} newTask={newTask} setNewTask={setNewTask} showEmoji={showEmoji} setShowEmoji={setShowEmoji} onConfirm={()=>addTask(tab)} onCancel={()=>{setAddFor(null);setShowEmoji(false);}}/>
        )}

        {tab==='rewards'&&<>
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:16}}>🏆 Screen Time Rewards</h2>
          {['isabella','jocelyn'].map(u=>{
            const color=u==='isabella'?'#f107a3':'#e91e63';
            const name=u==='isabella'?'🌸 Isabella':'🕷️ Jossy';
            return(
              <div key={u} style={{background:'rgba(255,255,255,0.04)',borderRadius:18,padding:20,marginBottom:16,border:`1px solid ${color}40`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <span style={{fontWeight:800,fontSize:18}}>{name}</span>
                  <span style={{background:`${color}22`,borderRadius:20,padding:'4px 14px',color,fontWeight:700,fontSize:14}}>🌟 {bal[u]} stars</span>
                </div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,marginBottom:10}}>Enter minutes given → Redeem to deduct from balance:</div>
                <div style={{display:'flex',gap:8}}>
                  <input type="number" placeholder="Minutes to redeem…" value={redeemAmt[u]} onChange={e=>setRedeemAmt(p=>({...p,[u]:e.target.value}))} style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:'8px 12px',color:'white',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
                  <button onClick={()=>doRedeem(u)} style={{background:color,border:'none',borderRadius:10,padding:'8px 18px',color:'white',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Redeem</button>
                </div>
              </div>
            );
          })}
        </>}

        {tab==='settings'&&<>
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>⚙️ Change PINs</h2>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:20}}>Leave blank to keep current PIN</p>
          {[{key:'parent',label:'👨‍👩‍👧 Parent'},{key:'isabella',label:'🌸 Isabella'},{key:'jocelyn',label:'🕷️ Jossy'}].map(({key,label})=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:'block',color:'rgba(255,255,255,0.55)',fontSize:13,marginBottom:6}}>{label} <span style={{color:'rgba(255,255,255,0.25)'}}>— current: {config.pins[key]}</span></label>
              <input type="tel" maxLength={4} placeholder="New 4-digit PIN" value={newPins[key]} onChange={e=>setNewPins(p=>({...p,[key]:e.target.value.replace(/\D/g,'').slice(0,4)}))} style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:'10px 14px',color:'white',fontSize:16,fontFamily:'inherit',outline:'none'}}/>
            </div>
          ))}
          <button onClick={savePins} style={{width:'100%',background:'#2563eb',border:'none',borderRadius:12,padding:12,color:'white',fontWeight:700,cursor:'pointer',fontSize:15,fontFamily:'inherit',marginTop:8}}>Save PINs</button>
          {savedMsg&&<div style={{color:'#4ade80',textAlign:'center',marginTop:10,fontWeight:700}}>{savedMsg}</div>}
        </>}
      </div>
    </div>
  );
}

function ParentOverview({comp,bal,proofs,goals,config,onShowProof}) {
  const pendingCount=Object.keys(proofs.isabella||{}).length+Object.keys(proofs.jocelyn||{}).length;
  return(
    <>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:16}}>📊 Today&apos;s Overview</h2>
      {['isabella','jocelyn'].map(u=>{
        const tasks=config.tasks[u]; const done=comp[u].length; const total=tasks.length;
        const pct=total>0?Math.round(done/total*100):0;
        const color=u==='isabella'?'#f107a3':'#e91e63';
        const name=u==='isabella'?'🌸 Isabella':'🕷️ Jossy';
        const pending=Object.keys(proofs[u]||{}).length;
        return(
          <div key={u} style={{background:'rgba(255,255,255,0.04)',borderRadius:18,padding:18,marginBottom:12,border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontWeight:700,fontSize:16}}>{name}</span>
              <span style={{color,fontWeight:700}}>{done}/{total} done</span>
            </div>
            <div style={{background:'rgba(255,255,255,0.1)',borderRadius:100,height:10,overflow:'hidden',marginBottom:8}}>
              <div style={{background:color,width:`${pct}%`,height:'100%',borderRadius:100,transition:'width 0.6s ease'}}/>
            </div>
            <div style={{display:'flex',gap:12,fontSize:12,color:'rgba(255,255,255,0.4)',flexWrap:'wrap'}}>
              <span>🌟 {bal[u]} stars banked</span>
              {goals[u]&&<span style={{color:'rgba(255,255,255,0.6)'}}>🎯 Goal: &ldquo;{goals[u]}&rdquo;</span>}
              {pending>0&&<span style={{color:'#fbbf24',fontWeight:700}}>📸 {pending} awaiting approval</span>}
            </div>
          </div>
        );
      })}
      {pendingCount>0&&(
        <div onClick={onShowProof} style={{background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.35)',borderRadius:14,padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,marginTop:4}}>
          <span style={{fontSize:28}}>📸</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:'#fbbf24'}}>{pendingCount} photo{pendingCount>1?'s':''} waiting for your approval!</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>Tap to review →</div>
          </div>
        </div>
      )}
    </>
  );
}

function ProofInbox({proofs,config,onApprove,onReject}) {
  const all=[];
  ['isabella','jocelyn'].forEach(user=>Object.entries(proofs[user]||{}).forEach(([taskId,proof])=>all.push({user,taskId,...proof})));
  if(all.length===0)return(
    <div style={{textAlign:'center',padding:'60px 20px'}}>
      <div style={{fontSize:48,marginBottom:12}}>📭</div>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:16,fontWeight:600}}>No photos waiting!</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:13,marginTop:6}}>When the girls submit proof, it&apos;ll show up here.</div>
    </div>
  );
  return(
    <div>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>📸 Proof Inbox</h2>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:20}}>{all.length} photo{all.length>1?'s':''} waiting for review</p>
      {all.map((proof,i)=>{
        const isIsa=proof.user==='isabella';
        const color=isIsa?'#f107a3':'#e91e63';
        const name=isIsa?'🌸 Isabella':'🕷️ Jossy';
        const time=new Date(proof.submittedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
        return(
          <div key={`${proof.user}-${proof.taskId}-${i}`} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${color}40`,borderRadius:18,overflow:'hidden',marginBottom:16}}>
            <div style={{position:'relative'}}>
              <img src={proof.photo} alt="proof" style={{width:'100%',maxHeight:280,objectFit:'cover',display:'block'}}/>
              <div style={{position:'absolute',top:10,left:10,background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'4px 12px',fontSize:13,fontWeight:700,color:'white'}}>{name}</div>
              <div style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'4px 12px',fontSize:12,color:'rgba(255,255,255,0.7)'}}>{time}</div>
            </div>
            <div style={{padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <span style={{fontSize:22}}>{proof.taskEmoji}</span>
                <span style={{fontWeight:700,fontSize:15}}>{proof.taskTitle}</span>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>onApprove(proof.user,proof.taskId)} style={{flex:1,background:'rgba(74,222,128,0.15)',border:'1.5px solid rgba(74,222,128,0.4)',borderRadius:12,padding:'10px',color:'#4ade80',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>✅ Approve</button>
                <button onClick={()=>onReject(proof.user,proof.taskId)} style={{flex:1,background:'rgba(239,68,68,0.12)',border:'1.5px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'10px',color:'#f87171',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>❌ Reject</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ParentTaskTab({user,tasks,comp,proofs,onAdd,onDel,onToggleProof,addFor,newTask,setNewTask,showEmoji,setShowEmoji,onConfirm,onCancel}) {
  const color=user==='isabella'?'#f107a3':'#e91e63';
  const name=user==='isabella'?'🌸 Isabella':'🕷️ Jossy';
  // group by timeOfDay
  const groups={};
  tasks.forEach(t=>{ const g=t.timeOfDay||'general'; if(!groups[g])groups[g]=[]; groups[g].push(t); });
  const groupOrder=['morning','midday','afternoon','evening','general'];

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{fontWeight:800,fontSize:20,margin:0}}>{name}&apos;s Tasks</h2>
        <button onClick={onAdd} style={{background:color,border:'none',borderRadius:10,padding:'8px 16px',color:'white',fontWeight:700,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>+ Add Task</button>
      </div>

      {/* Camera proof legend */}
      <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'10px 14px',marginBottom:16,fontSize:12,color:'rgba(255,255,255,0.5)',display:'flex',gap:16}}>
        <span>📷 = photo proof required</span><span>🔘 = tap to complete</span>
        <span style={{color:'rgba(255,255,255,0.3)'}}>— tap the camera icon to toggle</span>
      </div>

      {addFor===user&&(
        <div style={{background:'rgba(255,255,255,0.05)',borderRadius:18,padding:18,marginBottom:16,border:`1px solid ${color}50`}}>
          <div style={{fontWeight:700,marginBottom:12}}>New Task</div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <button onClick={()=>setShowEmoji(!showEmoji)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,padding:'8px 12px',fontSize:22,cursor:'pointer'}}>{newTask.emoji}</button>
            <input placeholder="Task name…" value={newTask.title} onChange={e=>setNewTask(p=>({...p,title:e.target.value}))} style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:'8px 12px',color:'white',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
          </div>
          {showEmoji&&<div style={{background:'rgba(0,0,0,0.3)',borderRadius:12,padding:10,marginBottom:10,display:'flex',flexWrap:'wrap',gap:8}}>{EMOJIS.map(e=><span key={e} onClick={()=>{setNewTask(p=>({...p,emoji:e}));setShowEmoji(false);}} style={{fontSize:22,cursor:'pointer'}}>{e}</span>)}</div>}
          {/* Time of day */}
          <div style={{marginBottom:10}}>
            <label style={{color:'rgba(255,255,255,0.55)',fontSize:13,display:'block',marginBottom:6}}>🕐 Time of day:</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {Object.entries(TIME_META).map(([k,v])=>(
                <button key={k} onClick={()=>setNewTask(p=>({...p,timeOfDay:k}))} style={{background:newTask.timeOfDay===k?v.color:'rgba(255,255,255,0.08)',border:`1px solid ${newTask.timeOfDay===k?v.color:'rgba(255,255,255,0.15)'}`,borderRadius:20,padding:'4px 12px',color:'white',cursor:'pointer',fontSize:12,fontFamily:'inherit',fontWeight:newTask.timeOfDay===k?700:400}}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{color:'rgba(255,255,255,0.55)',fontSize:13}}>⏱ Screen time minutes:</span>
            <input type="number" value={newTask.minutes} onChange={e=>setNewTask(p=>({...p,minutes:parseInt(e.target.value)||0}))} style={{width:64,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:8,padding:'6px 10px',color:'white',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{color:'rgba(255,255,255,0.55)',fontSize:13}}>🔄 Recurring daily:</span>
            <Toggle on={newTask.recurring} color={color} onChange={()=>setNewTask(p=>({...p,recurring:!p.recurring}))}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <span style={{color:'rgba(255,255,255,0.55)',fontSize:13}}>📷 Requires photo proof:</span>
            <Toggle on={newTask.requiresProof} color={color} onChange={()=>setNewTask(p=>({...p,requiresProof:!p.requiresProof}))}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onConfirm} style={{flex:1,background:color,border:'none',borderRadius:10,padding:10,color:'white',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Add Task</button>
            <button onClick={onCancel} style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:10,color:'white',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tasks grouped by time */}
      {groupOrder.map(grp=>{
        const grpTasks=groups[grp]; if(!grpTasks||grpTasks.length===0)return null;
        const meta=TIME_META[grp]||{label:'Other',icon:'📋',color:'#64748b'};
        return(
          <div key={grp} style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,paddingBottom:6,borderBottom:`1px solid rgba(255,255,255,0.06)`}}>
              <span style={{fontSize:16}}>{meta.icon}</span>
              <span style={{fontWeight:700,fontSize:14,color:meta.color}}>{meta.label}</span>
              <span style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>({grpTasks.length})</span>
            </div>
            {grpTasks.map(task=>{
              const done=comp.includes(task.id);
              const pending=!!proofs[task.id];
              return(
                <div key={task.id} style={{display:'flex',alignItems:'center',gap:10,background:done?'rgba(74,222,128,0.07)':pending?'rgba(251,191,36,0.07)':'rgba(255,255,255,0.03)',border:`1px solid ${done?'rgba(74,222,128,0.2)':pending?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'10px 14px',marginBottom:6}}>
                  <div style={{fontSize:20}}>{task.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,textDecoration:done?'line-through':'none',color:done?'rgba(255,255,255,0.3)':'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
                    <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,marginTop:1}}>
                      {task.isMantras&&'📖 Mantras · '}
                      {task.isGoal&&'🎯 Goal · '}
                      {task.isGoalReview&&'🌟 Goal Review · '}
                      ⏱ {task.minutes}m
                      {done&&' · ✅'}
                      {pending&&<span style={{color:'#fbbf24'}}> · 📸 pending</span>}
                    </div>
                  </div>
                  {/* Proof toggle button */}
                  <button onClick={()=>onToggleProof(task.id)} title={task.requiresProof?'Photo proof ON — click to turn off':'No proof required — click to require photo'} style={{background:task.requiresProof?`${color}25`:'rgba(255,255,255,0.06)',border:`1px solid ${task.requiresProof?color:'rgba(255,255,255,0.15)'}`,borderRadius:8,padding:'4px 8px',color:task.requiresProof?color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:14,flexShrink:0}}>
                    📷
                  </button>
                  <button onClick={()=>onDel(task.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'4px 8px',color:'#f87171',cursor:'pointer',fontSize:12,fontFamily:'inherit',flexShrink:0}}>✕</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Toggle({on,color,onChange}) {
  return <div onClick={onChange} style={{width:44,height:24,background:on?color:'rgba(255,255,255,0.15)',borderRadius:100,cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}><div style={{position:'absolute',top:2,left:on?22:2,width:20,height:20,background:'white',borderRadius:'50%',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/></div>;
}

/* ══════════════════════════════════════════
   SHARED KID VIEW  (renders Isabella or Jossy)
══════════════════════════════════════════ */
function KidView({user,theme,tasks,comp,proofs,goal,onToggle,onComplete,onSubmitProof,onSetGoal,bal,logout}) {
  const isIsa = theme==='kawaii';
  const done  = comp.length;
  const total = tasks.length;
  const pct   = total>0?Math.round(done/total*100):0;
  const allDone = done===total&&total>0;

  const bgStyle    = isIsa ? {background:'linear-gradient(160deg,#12003a 0%,#2d0068 50%,#12003a 100%)'} : {background:'linear-gradient(160deg,#1a0010 0%,#3d0020 50%,#1a0010 100%)',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg stroke='rgba(255,130,170,0.10)' fill='none' stroke-width='0.8'%3E%3Ccircle cx='110' cy='110' r='20'/%3E%3Ccircle cx='110' cy='110' r='45'/%3E%3Ccircle cx='110' cy='110' r='70'/%3E%3Ccircle cx='110' cy='110' r='96'/%3E%3Cline x1='110' y1='14' x2='110' y2='206'/%3E%3Cline x1='14' y1='110' x2='206' y2='110'/%3E%3Cline x1='42' y1='42' x2='178' y2='178'/%3E%3Cline x1='178' y1='42' x2='42' y2='178'/%3E%3C/g%3E%3C/svg%3E")`,backgroundSize:'220px 220px'};
  const headerBg   = isIsa ? 'rgba(241,7,163,0.12)' : 'rgba(200,0,50,0.18)';
  const headerBdr  = isIsa ? 'rgba(255,182,213,0.25)' : 'rgba(255,100,150,0.25)';
  const accentColor= isIsa ? '#f107a3' : '#e91e63';
  const barBg      = isIsa ? 'linear-gradient(90deg,#ff6eb4,#c44dff,#ffd700)' : 'linear-gradient(90deg,#8b0000,#e91e63,#ff6b9d)';
  const starColor  = isIsa ? '#ffd700' : '#ff9dbe';
  const ff         = isIsa ? "'Fredoka One','Nunito',sans-serif" : "'Poppins','Nunito',sans-serif";
  const title      = isIsa ? "🌟 Isabella's Quest!" : "🕷️ Jossy's Web";
  const subtitle   = isIsa ? `Koda says: がんばって！` : `Koda says: go get it 🌟`;
  const allDoneMsg = isIsa ? "すごい！ Koda is SO proud of you! 🌸" : "Koda thinks you're a total star! 🌟";
  const allDoneEmoji = isIsa ? '🎉✨🌸' : '🕷️💅🏆';
  const btnExitBg  = isIsa ? 'rgba(241,7,163,0.15)' : 'rgba(233,30,99,0.15)';
  const btnExitBdr = isIsa ? 'rgba(255,182,213,0.3)' : 'rgba(255,100,150,0.3)';
  const btnExitClr = isIsa ? 'rgba(255,182,213,0.85)' : 'rgba(255,182,193,0.8)';
  const starBadgeBg  = isIsa ? 'rgba(255,215,0,0.12)' : 'rgba(233,30,99,0.15)';
  const starBadgeBdr = isIsa ? 'rgba(255,215,0,0.3)'  : 'rgba(255,107,157,0.35)';

  // progress msg
  const msg = done===0 ? (isIsa?"Let's go! がんばって！ 🌸":"Time to sling some tasks, girl 🕷️")
    : done===total ? (isIsa?"ALL DONE! すごい！ 🎉":"ALL DONE! Your friendly neighborhood champ 🏆")
    : done<=1 ? `Great start! ${done} done ✨`
    : `${done} of ${total} done — keep going! 💪`;

  // group tasks by timeOfDay
  const groups = {};
  tasks.forEach(t=>{ const g=t.timeOfDay||'general'; if(!groups[g])groups[g]=[]; groups[g].push(t); });

  return(
    <div style={{minHeight:'100vh',...bgStyle,fontFamily:ff,color:'white',position:'relative',overflow:'hidden'}}>
      {isIsa&&<SakuraDecor/>}
      {!isIsa&&<div style={{position:'fixed',inset:0,background:'linear-gradient(160deg,rgba(26,0,16,0.7) 0%,rgba(61,0,32,0.5) 50%,rgba(26,0,16,0.7) 100%)',pointerEvents:'none',zIndex:0}}/>}

      {/* Header */}
      <div style={{background:headerBg,backdropFilter:'blur(14px)',borderBottom:`1px solid ${headerBdr}`,padding:'20px 20px 16px',position:'relative',zIndex:2}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:24,fontWeight:isIsa?400:800}}>{title}</div>
            <div style={{color:isIsa?'rgba(255,182,213,0.65)':'rgba(255,182,193,0.55)',fontSize:12,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>
              {subtitle} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
            </div>
          </div>
          <button onClick={logout} style={{background:btnExitBg,border:`1px solid ${btnExitBdr}`,borderRadius:12,padding:'6px 14px',color:btnExitClr,cursor:'pointer',fontSize:13,fontFamily:"'Nunito',sans-serif"}}>Exit</button>
        </div>
        {/* Progress bar */}
        <div style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:13,color:isIsa?'rgba(255,210,230,0.9)':'rgba(255,182,193,0.8)',fontFamily:"'Nunito',sans-serif",fontWeight:700}}>{msg}</span>
            <span style={{fontWeight:700,color:isIsa?'#ffd700':'#ff6b9d',fontFamily:"'Nunito',sans-serif"}}>{pct}%</span>
          </div>
          <div style={{background:'rgba(255,255,255,0.15)',borderRadius:100,height:12,overflow:'hidden'}}>
            <div style={{background:barBg,width:`${pct}%`,height:'100%',borderRadius:100,transition:'width 0.7s cubic-bezier(.34,1.56,.64,1)',boxShadow:`0 0 18px ${accentColor}90`}}/>
          </div>
        </div>
      </div>

      {/* Stars badge */}
      <div style={{padding:'14px 20px 4px',position:'relative',zIndex:2}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:starBadgeBg,border:`1px solid ${starBadgeBdr}`,borderRadius:20,padding:'6px 16px'}}>
          <span style={{fontSize:16}}>🌟</span>
          <span style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,color:starColor,fontSize:14}}>{bal} Koda stars earned{isIsa?'!':" 💅"}</span>
        </div>
      </div>

      {/* Goal display (if set) */}
      {goal&&(
        <div style={{padding:'0 20px 4px',position:'relative',zIndex:2}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'6px 14px'}}>
            <span style={{fontSize:14}}>🎯</span>
            <span style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:'rgba(255,255,255,0.7)'}}>Today&apos;s goal: &ldquo;{goal}&rdquo;</span>
          </div>
        </div>
      )}

      {/* Task groups */}
      <div style={{padding:'8px 20px 120px',position:'relative',zIndex:2}}>
        {tasks.length===0&&<div style={{textAlign:'center',padding:60,color:'rgba(255,182,213,0.4)',fontFamily:"'Nunito',sans-serif"}}>No tasks yet! Ask a parent to add some 🌸</div>}
        {TIME_GROUPS.map(grp=>{
          const grpTasks=groups[grp]; if(!grpTasks||grpTasks.length===0)return null;
          const meta=TIME_META[grp];
          return(
            <div key={grp} style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10,paddingTop:4}}>
                <span style={{fontSize:18}}>{meta.icon}</span>
                <span style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:13,color:meta.color,letterSpacing:0.5,textTransform:'uppercase'}}>{meta.label}</span>
                <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)',marginLeft:6}}/>
              </div>
              {grpTasks.map((task,i)=>(
                <TaskItem key={task.id} task={task} done={comp.includes(task.id)} pending={!!proofs[task.id]} goal={goal} isIsa={isIsa} delay={i*60}
                  onToggle={()=>onToggle(task.id)}
                  onComplete={()=>onComplete(task.id)}
                  onSubmitProof={(photo)=>onSubmitProof(task.id,photo)}
                  onSetGoal={onSetGoal}
                />
              ))}
            </div>
          );
        })}
        {/* tasks without timeOfDay */}
        {groups.general&&groups.general.length>0&&groups.general.map((task,i)=>(
          <TaskItem key={task.id} task={task} done={comp.includes(task.id)} pending={!!proofs[task.id]} goal={goal} isIsa={isIsa} delay={i*60}
            onToggle={()=>onToggle(task.id)} onComplete={()=>onComplete(task.id)}
            onSubmitProof={(photo)=>onSubmitProof(task.id,photo)} onSetGoal={onSetGoal}
          />
        ))}
      </div>

      {allDone&&(
        <div style={{position:'fixed',bottom:30,left:'50%',transform:'translateX(-50%)',background:isIsa?'linear-gradient(135deg,#f107a3,#7b2ff7)':'linear-gradient(135deg,#8b0000,#e91e63,#ff6b9d)',borderRadius:22,padding:'18px 32px',textAlign:'center',zIndex:10,boxShadow:`0 8px 44px ${accentColor}80`,animation:'pulse 2s ease infinite',whiteSpace:'nowrap'}}>
          <div style={{fontSize:30,marginBottom:4}}>{allDoneEmoji}</div>
          <div style={{fontWeight:800,fontSize:18}}>All Done!</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'rgba(255,255,255,0.8)'}}>{allDoneMsg}</div>
        </div>
      )}
    </div>
  );
}

/* ── UNIFIED TASK ITEM ────────────────── */
function TaskItem({task,done,pending,goal,isIsa,delay,onToggle,onComplete,onSubmitProof,onSetGoal}) {
  const cameraRef    = useRef(null);
  const [uploading,  setUploading]  = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [goalText,   setGoalText]   = useState('');
  const [gratitude,  setGratitude]  = useState(['','','']);
  const [pop,        setPop]        = useState(false);

  const accentColor = isIsa ? '#f107a3' : '#e91e63';
  const doneGradient = isIsa ? 'linear-gradient(135deg,#f107a3,#7b2ff7)' : 'linear-gradient(135deg,#8b0000,#e91e63)';
  const checkIcon   = isIsa ? '✨' : '🕷️';
  const doneFloatIcon = isIsa ? '🌸' : '💅';
  const proofBtnBg  = isIsa ? 'linear-gradient(135deg,#f107a3,#7b2ff7)' : 'linear-gradient(135deg,#8b0000,#e91e63)';

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if(!file)return;
    setUploading(true);
    try { const c=await compressImage(file); await onSubmitProof(c); }
    finally { setUploading(false); if(cameraRef.current)cameraRef.current.value=''; }
  };

  const handleTap = () => {
    if(done||pending)return;
    setPop(true); setTimeout(()=>setPop(false),400); onToggle();
  };

  const submitGoal = () => {
    if(!goalText.trim())return;
    onSetGoal(goalText.trim());
  };

  const submitMantras = () => {
    onComplete();
    setExpanded(false);
  };

  // ── DONE state ──
  if(done) return(
    <div style={{display:'flex',alignItems:'center',gap:14,background:`${accentColor}14`,border:`1.5px solid ${accentColor}40`,borderRadius:18,padding:'12px 16px',marginBottom:8,animation:`fadeInUp 0.4s ${delay}ms both`,boxShadow:`0 4px 20px ${accentColor}18`}}>
      <div style={{width:30,height:30,borderRadius:isIsa?10:'50%',background:doneGradient,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 12px ${accentColor}55`,flexShrink:0}}><span style={{fontSize:14}}>{checkIcon}</span></div>
      <div style={{fontSize:22}}>{task.emoji}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,textDecoration:'line-through',color:'rgba(255,255,255,0.35)'}}>{task.title}</div>
        <div style={{color:`${accentColor}80`,fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>✅ Done · 🌟 {task.minutes} min earned</div>
      </div>
      <div style={{fontSize:18,animation:'float 2s ease infinite'}}>{doneFloatIcon}</div>
    </div>
  );

  // ── PENDING PROOF state ──
  if(pending) return(
    <div style={{display:'flex',alignItems:'center',gap:14,background:'rgba(251,191,36,0.1)',border:'1.5px solid rgba(251,191,36,0.35)',borderRadius:18,padding:'12px 16px',marginBottom:8,animation:`fadeInUp 0.4s ${delay}ms both`}}>
      <div style={{width:30,height:30,borderRadius:isIsa?10:'50%',background:'rgba(251,191,36,0.2)',border:'2px solid rgba(251,191,36,0.5)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:14,animation:'float 2s ease infinite'}}>⏳</span></div>
      <div style={{fontSize:22}}>{task.emoji}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:'white'}}>{task.title}</div>
        <div style={{color:'#fbbf24',fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>📸 Photo sent! Waiting for Mom/Dad…</div>
      </div>
    </div>
  );

  // ── MANTRAS task ──
  if(task.isMantras) return(
    <div style={{background:'rgba(255,255,255,0.05)',border:`1.5px solid rgba(255,255,255,0.1)`,borderRadius:18,marginBottom:8,overflow:'hidden',animation:`fadeInUp 0.4s ${delay}ms both`}}>
      <div onClick={()=>setExpanded(!expanded)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',cursor:'pointer'}}>
        <div style={{width:30,height:30,borderRadius:isIsa?10:'50%',background:'rgba(255,255,255,0.1)',border:'2px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:14}}>📖</div>
        <div style={{fontSize:22}}>{task.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:'white'}}>{task.title}</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>Tap to read · 🌟 {task.minutes} min</div>
        </div>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:18,transition:'transform 0.2s',transform:expanded?'rotate(90deg)':'none'}}>›</div>
      </div>
      {expanded&&(
        <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{paddingTop:12,marginBottom:12}}>
            {task.mantras.map((m,i)=>(
              <div key={i} style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:'rgba(255,255,255,0.85)',lineHeight:1.8,padding:'4px 0',borderBottom:i<task.mantras.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>{m}</div>
            ))}
          </div>
          {task.hasGratitude&&(
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:8}}>✏️ Name 3 things you&apos;re grateful for today:</div>
              {[0,1,2].map(i=>(
                <input key={i} placeholder={`Grateful for #${i+1}…`} value={gratitude[i]} onChange={e=>{const g=[...gratitude];g[i]=e.target.value;setGratitude(g);}} style={{width:'100%',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:'8px 12px',color:'white',fontSize:13,fontFamily:"'Nunito',sans-serif",outline:'none',marginBottom:6}}/>
              ))}
            </div>
          )}
          <button onClick={submitMantras} style={{width:'100%',background:doneGradient,border:'none',borderRadius:12,padding:'10px',color:'white',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 14px ${accentColor}40`}}>
            Done reading ✨
          </button>
        </div>
      )}
    </div>
  );

  // ── GOAL input task ──
  if(task.isGoal) return(
    <div style={{background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,215,0,0.25)',borderRadius:18,padding:'14px 16px',marginBottom:8,animation:`fadeInUp 0.4s ${delay}ms both`}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
        <div style={{fontSize:22}}>{task.emoji}</div>
        <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:'white'}}>What&apos;s your goal for today?</div>
      </div>
      <input placeholder="I want to accomplish…" value={goalText} onChange={e=>setGoalText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitGoal()}
        style={{width:'100%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,215,0,0.3)',borderRadius:12,padding:'10px 14px',color:'white',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',marginBottom:8}}/>
      <button onClick={submitGoal} disabled={!goalText.trim()} style={{width:'100%',background:goalText.trim()?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(255,255,255,0.1)',border:'none',borderRadius:12,padding:'9px',color:'white',fontWeight:700,cursor:goalText.trim()?'pointer':'default',fontSize:14,fontFamily:"'Nunito',sans-serif",opacity:goalText.trim()?1:0.5}}>
        Set my goal 🎯
      </button>
    </div>
  );

  // ── GOAL REVIEW task ──
  if(task.isGoalReview) {
    const hasGoal = !!goal;
    return(
      <div style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:18,padding:'12px 16px',marginBottom:8,animation:`fadeInUp 0.4s ${delay}ms both`}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:hasGoal?8:0}}>
          <div onClick={hasGoal?handleTap:undefined} style={{width:30,height:30,borderRadius:isIsa?10:'50%',background:'rgba(255,255,255,0.08)',border:'2px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:hasGoal?'pointer':'default',animation:pop?'popIn 0.35s ease':'none'}}><span style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>○</span></div>
          <div style={{fontSize:22}}>{task.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:'white'}}>{task.title}</div>
            {!hasGoal&&<div style={{color:'rgba(255,255,255,0.35)',fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>Set your morning goal first!</div>}
          </div>
          {task.requiresProof&&hasGoal&&(
            <>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:'none'}}/>
              <button onClick={()=>cameraRef.current?.click()} disabled={uploading} style={{background:proofBtnBg,border:'none',borderRadius:12,padding:'7px 12px',color:'white',fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>{uploading?'⏳':'📷'}</button>
            </>
          )}
          {!task.requiresProof&&hasGoal&&<button onClick={handleTap} style={{background:doneGradient,border:'none',borderRadius:12,padding:'7px 12px',color:'white',fontWeight:700,cursor:'pointer',fontSize:12,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>Done ✓</button>}
        </div>
        {hasGoal&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:'rgba(255,255,255,0.5)',paddingLeft:44}}>Your goal: &ldquo;{goal}&rdquo;</div>}
      </div>
    );
  }

  // ── PROOF REQUIRED task ──
  if(task.requiresProof) return(
    <div style={{display:'flex',alignItems:'center',gap:14,background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'12px 16px',marginBottom:8,animation:`fadeInUp 0.4s ${delay}ms both`}}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{display:'none'}}/>
      <div style={{fontSize:22}}>{task.emoji}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:'white'}}>{task.title}</div>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>{task.recurring?'🔄 Every day':'📌 Special'} · 🌟 {task.minutes} min · 📷 photo required</div>
      </div>
      <button onClick={()=>cameraRef.current?.click()} disabled={uploading} style={{background:proofBtnBg,border:'none',borderRadius:12,padding:'8px 12px',color:'white',fontWeight:700,cursor:uploading?'default':'pointer',fontSize:12,fontFamily:"'Nunito',sans-serif",display:'flex',alignItems:'center',gap:4,flexShrink:0,boxShadow:`0 4px 12px ${accentColor}40`,opacity:uploading?0.7:1}}>
        {uploading?<span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⏳</span>:'📷'}
        {uploading?'Sending…':'Prove it!'}
      </button>
    </div>
  );

  // ── REGULAR tap-to-complete task ──
  return(
    <div onClick={handleTap} style={{display:'flex',alignItems:'center',gap:14,background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'12px 16px',marginBottom:8,cursor:'pointer',transition:'all 0.2s ease',animation:`fadeInUp 0.4s ${delay}ms both`}}>
      <div style={{width:30,height:30,borderRadius:isIsa?10:'50%',background:'rgba(255,255,255,0.08)',border:`2px solid ${accentColor}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,animation:pop?'popIn 0.35s ease':'none',transition:'all 0.2s'}}><span style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>○</span></div>
      <div style={{fontSize:22}}>{task.emoji}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,color:'white'}}>{task.title}</div>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>{task.recurring?'🔄 Every day':'📌 Special'} · 🌟 {task.minutes} min</div>
      </div>
    </div>
  );
}

function SakuraDecor() {
  const items=[{x:8,delay:0,dur:8,size:18,icon:'🌸'},{x:22,delay:1.5,dur:10,size:14,icon:'✨'},{x:40,delay:3,dur:7,size:16,icon:'⭐'},{x:58,delay:0.8,dur:11,size:12,icon:'🌸'},{x:72,delay:2.2,dur:9,size:20,icon:'💫'},{x:85,delay:4,dur:8,size:14,icon:'🎀'},{x:93,delay:1,dur:12,size:16,icon:'🌟'},{x:15,delay:5,dur:9,size:13,icon:'✨'},{x:50,delay:6,dur:10,size:18,icon:'🌸'},{x:66,delay:3.5,dur:7,size:15,icon:'🎀'}];
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>{items.map((item,i)=><div key={i} style={{position:'absolute',left:`${item.x}%`,top:'-30px',fontSize:item.size,animation:`sakura ${item.dur}s ${item.delay}s infinite linear`,opacity:0.65}}>{item.icon}</div>)}</div>;
}
