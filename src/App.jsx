import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

/* ══════════════════════════════════════════
   VERSION
══════════════════════════════════════════ */
const VERSION = 'v17';

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
  async get(k) {
    try { const s = await get(ref(db,k)); return s.exists() ? s.val() : null; }
    catch(e) { console.error('Firebase get error:', k, e); return null; }
  },
  async set(k,v) {
    try { await set(ref(db,k),v); }
    catch(e) { console.error('Firebase set error:', k, e); throw e; }
  },
};

/* ══════════════════════════════════════════
   IMAGE COMPRESSION
   1000px max, 75% quality — sharp enough
   to read clearly while staying lean
══════════════════════════════════════════ */
const compressImage = (file) => new Promise((resolve, reject) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    const ratio = Math.min(1000/img.width, 1000/img.height, 1);
    canvas.width  = Math.round(img.width  * ratio);
    canvas.height = Math.round(img.height * ratio);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', 0.75));
  };
  img.onerror = reject;
  img.src = URL.createObjectURL(file);
});

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
// CRITICAL: Use LOCAL date, not UTC.
// toISOString() returns UTC — at 8pm Pacific that's already next day UTC.
// This was causing tasks to save to tomorrow's key, so they never reset.
const TODAY = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
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
  pins: { mom:'1234', dad:'5678', isabella:'1111', jocelyn:'2222' },
  tasks: { isabella: makeRoutine('ib'), jocelyn: makeRoutine('jc') },
};

const DEFAULT_REWARDS = [
  { id:'rwd1', title:'Ice cream',               emoji:'🍦', stars:50   },
  { id:'rwd2', title:'15 min extra phone time', emoji:'📱', stars:75   },
  { id:'rwd3', title:'1 hour extra phone time', emoji:'📱', stars:200  },
  { id:'rwd4', title:'Going out',               emoji:'🚗', stars:300  },
  { id:'rwd5', title:'Art & craft supplies',    emoji:'🎨', stars:350  },
  { id:'rwd6', title:'All day phone time',      emoji:'📱', stars:600  },
  { id:'rwd7', title:'$10 cash',                emoji:'💵', stars:1000 },
];

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
  const [rewards,   setRewards]   = useState(DEFAULT_REWARDS);
  const [rewardReqs,setRewardReqs]= useState([]);
  const [toast,        setToast]       = useState('');
  const [fbStatus,     setFbStatus]    = useState('checking');
  const [currentParent,setCurrentParent]=useState('');
  const [activity,     setActivity]    = useState([]);
  const [avatars,      setAvatars]     = useState({ isabella:'', jocelyn:'' });
  const [alltime,      setAlltime]     = useState({ isabella:0,  jocelyn:0  });
  const [dailyEarned,  setDailyEarned] = useState({ isabella:0,  jocelyn:0  });
  const [loading,      setLoading]     = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

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

    // ── Date-change detection ──────────────────────────────────────
    // The Firebase listeners are date-keyed (cm-c-isabella-2026-04-15).
    // If the app stays open past midnight, listeners point to the old date.
    // Fix: reload the app whenever it regains focus on a new day.
    const loadedDate = TODAY();

    const checkDateChange = () => {
      if (!document.hidden && TODAY() !== loadedDate) {
        window.location.reload();
      }
    };

    // visibilitychange fires when user switches back to the app tab
    document.addEventListener('visibilitychange', checkDateChange);
    // pageshow handles iOS Safari back-forward cache
    window.addEventListener('pageshow', checkDateChange);
    // Also schedule a midnight reload as a safety net
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 5).getTime() - now.getTime();
    const midnightTimer = setTimeout(() => window.location.reload(), msUntilMidnight);

    // ── Load static config data once ──────────────────────────────
    const loadStatic = async () => {
      const today = TODAY();
      const [rawCfg, rawRwds, rawAct, ibAv, jcAv] = await Promise.all([
        S.get('cm-config'),
        S.get('cm-rewards'),
        S.get('cm-activity'),
        S.get('cm-avatar-isabella'),
        S.get('cm-avatar-jocelyn'),
      ]);
      let cfg = rawCfg ? JSON.parse(rawCfg) : DEFAULT;
      if (cfg.pins.parent && !cfg.pins.mom) {
        cfg.pins.mom = cfg.pins.parent;
        cfg.pins.dad = '5678';
        delete cfg.pins.parent;
      }

      // ── Daily cleanup ──────────────────────────────────────────
      // 1. Remove non-recurring tasks whose createdDate is before today
      let changed = false;
      ['isabella','jocelyn'].forEach(user => {
        const filtered = (cfg.tasks[user] || []).filter(t => {
          if (t.recurring) return true; // keep all recurring tasks
          if (!t.createdDate) return true; // legacy tasks with no date — keep
          return t.createdDate === today; // only show one-time tasks from today
        });
        if (filtered.length !== (cfg.tasks[user] || []).length) {
          cfg.tasks[user] = filtered;
          changed = true;
        }
      });

      // 2. Clear reward requests — keep pending/first_approved (still need action)
      //    and remove resolved ones from previous days
      const rawReqs = await S.get('cm-reward-requests');
      if (rawReqs) {
        const reqs = JSON.parse(rawReqs);
        const cleaned = reqs.filter(r => {
          // Always keep pending requests
          if (!r.status || r.status === 'pending' || r.status === 'first_approved') return true;
          // Keep resolved requests only from today
          const resolvedDate = r.resolvedAt?.slice(0, 10);
          const requestedDate = r.requestedAt?.slice(0, 10);
          return resolvedDate === today || requestedDate === today;
        });
        if (cleaned.length !== reqs.length) {
          await S.set('cm-reward-requests', JSON.stringify(cleaned));
        }
      }

      if (changed) await S.set('cm-config', JSON.stringify(cfg));
      setConfig(cfg);
      setRewards(rawRwds ? JSON.parse(rawRwds) : DEFAULT_REWARDS);
      setActivity(rawAct ? JSON.parse(rawAct) : []);
      setAvatars({ isabella: ibAv || '', jocelyn: jcAv || '' });
      setLoading(false);
    };
    loadStatic();

    // ── Firebase connection test ──────────────────────────────────
    // Write a tiny test value so we know Firebase is reachable.
    // Shows status in parent dashboard for easy diagnosis.
    set(ref(db, 'cm-connection-test'), new Date().toISOString())
      .then(() => setFbStatus('ok'))
      .catch(err => {
        const msg = err?.code || err?.message || 'unknown error';
        console.error('Firebase connection failed:', msg);
        setFbStatus(msg);
      });

    // ── Real-time listeners for all dynamic data ──────────────────
    // These fire immediately with current data AND whenever it changes,
    // so the parent dashboard always stays up to date in real time.
    const today = TODAY();
    const unsubs = [];

    const listen = (key, fn) => {
      const unsubscribe = onValue(ref(db, key), snap => {
        fn(snap.exists() ? snap.val() : null);
      });
      unsubs.push(unsubscribe);
    };

    // Task completions
    listen(`cm-c-isabella-${today}`, v => setComp(p => ({...p, isabella: v ? JSON.parse(v) : []})));
    listen(`cm-c-jocelyn-${today}`,  v => setComp(p => ({...p, jocelyn:  v ? JSON.parse(v) : []})));

    // Star balances
    listen('cm-b-isabella', v => setBal(p => ({...p, isabella: v ? parseInt(v) : 0})));
    listen('cm-b-jocelyn',  v => setBal(p => ({...p, jocelyn:  v ? parseInt(v) : 0})));

    // Photo proofs — each proof is stored as its own node:
    // cm-proofs/{user}/{date}/{taskId} = { photo, taskTitle, taskEmoji, submittedAt }
    // This avoids writing one giant JSON blob and makes updates atomic.
    listen(`cm-proofs/isabella/${today}`, v => setProofs(p => ({...p, isabella: v || {}})));
    listen(`cm-proofs/jocelyn/${today}`,  v => setProofs(p => ({...p, jocelyn:  v || {}})));

    // Daily goals
    listen(`cm-goal-isabella-${today}`, v => setGoals(p => ({...p, isabella: v || ''})));
    listen(`cm-goal-jocelyn-${today}`,  v => setGoals(p => ({...p, jocelyn:  v || ''})));

    // Reward requests
    listen('cm-reward-requests', v => setRewardReqs(v ? JSON.parse(v) : []));

    // Activity log
    listen('cm-activity', v => setActivity(v ? JSON.parse(v) : []));

    // All-time stars (lifetime total, never decreases)
    listen('cm-alltime-isabella', v => setAlltime(p => ({...p, isabella: v ? parseInt(v) : 0})));
    listen('cm-alltime-jocelyn',  v => setAlltime(p => ({...p, jocelyn:  v ? parseInt(v) : 0})));

    // Daily earned (resets each day automatically via date key)
    listen(`cm-daily-isabella-${today}`, v => setDailyEarned(p => ({...p, isabella: v ? parseInt(v) : 0})));
    listen(`cm-daily-jocelyn-${today}`,  v => setDailyEarned(p => ({...p, jocelyn:  v ? parseInt(v) : 0})));

    // Avatars (real-time so parent upload shows up immediately)
    listen('cm-avatar-isabella', v => setAvatars(p => ({...p, isabella: v || ''})));
    listen('cm-avatar-jocelyn',  v => setAvatars(p => ({...p, jocelyn:  v || ''})));

    // Clean up all listeners when component unmounts
    return () => {
      unsubs.forEach(fn => fn());
      document.removeEventListener('visibilitychange', checkDateChange);
      window.removeEventListener('pageshow', checkDateChange);
      clearTimeout(midnightTimer);
    };
  }, []);

  const saveConfig = async (c) => { setConfig(c); await S.set('cm-config', JSON.stringify(c)); };

  // Toggle requiresProof on a single task
  const toggleProofRequired = (user, taskId) => {
    const updated = config.tasks[user].map(t => t.id === taskId ? { ...t, requiresProof: !t.requiresProof } : t);
    saveConfig({ ...config, tasks: { ...config.tasks, [user]: updated } });
  };

  // Move a task up or down within its time-of-day group
  const reorderTask = (user, taskId, direction) => {
    const tasks = config.tasks[user];
    const task  = tasks.find(t => t.id === taskId);
    const group = task?.timeOfDay || 'general';
    const groupTasks = tasks.filter(t => (t.timeOfDay || 'general') === group);
    const groupIdx   = groupTasks.findIndex(t => t.id === taskId);
    if (direction === 'up'   && groupIdx === 0) return;
    if (direction === 'down' && groupIdx === groupTasks.length - 1) return;
    const neighborTask = groupTasks[direction === 'up' ? groupIdx - 1 : groupIdx + 1];
    const newTasks = [...tasks];
    const i = newTasks.findIndex(t => t.id === taskId);
    const j = newTasks.findIndex(t => t.id === neighborTask.id);
    [newTasks[i], newTasks[j]] = [newTasks[j], newTasks[i]];
    saveConfig({ ...config, tasks: { ...config.tasks, [user]: newTasks } });
  };

  // Edit the star value on an existing task
  const updateTaskStars = (user, taskId, stars) => {
    const updated = config.tasks[user].map(t => t.id === taskId ? { ...t, minutes: Math.max(1, stars) } : t);
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
    // Track alltime and daily only when earning (checking on), not when undoing
    if (checking) {
      const newAlltime = alltime[user] + task.minutes;
      const newDaily   = dailyEarned[user] + task.minutes;
      setAlltime(p => ({ ...p, [user]: newAlltime }));
      setDailyEarned(p => ({ ...p, [user]: newDaily }));
      await S.set(`cm-alltime-${user}`, String(newAlltime));
      await S.set(`cm-daily-${user}-${today}`, String(newDaily));
    } else {
      // Undo: deduct from daily (but not alltime — earned is earned)
      const newDaily = Math.max(0, dailyEarned[user] - task.minutes);
      setDailyEarned(p => ({ ...p, [user]: newDaily }));
      await S.set(`cm-daily-${user}-${today}`, String(newDaily));
    }
  };

  // Force complete (used by goal submit & mantra done)
  const completeTask = async (user, taskId) => {
    const today = TODAY();
    const task = config.tasks[user].find(t => t.id === taskId);
    if (!task || comp[user].includes(taskId)) return;
    const newComp = [...comp[user], taskId];
    const newBal  = bal[user] + task.minutes;
    const newAlltime = alltime[user] + task.minutes;
    const newDaily   = dailyEarned[user] + task.minutes;
    setComp(p => ({ ...p, [user]: newComp }));
    setBal(p  => ({ ...p, [user]: newBal  }));
    setAlltime(p => ({ ...p, [user]: newAlltime }));
    setDailyEarned(p => ({ ...p, [user]: newDaily }));
    await S.set(`cm-c-${user}-${today}`, JSON.stringify(newComp));
    await S.set(`cm-b-${user}`, String(newBal));
    await S.set(`cm-alltime-${user}`, String(newAlltime));
    await S.set(`cm-daily-${user}-${today}`, String(newDaily));
  };

  // Kid sets their daily goal
  const submitGoal = async (user, goalText) => {
    const today = TODAY();
    setGoals(p => ({ ...p, [user]: goalText }));
    await S.set(`cm-goal-${user}-${today}`, goalText);
    const goalTask = config.tasks[user].find(t => t.isGoal);
    if (goalTask) await completeTask(user, goalTask.id);
  };

  // Submit photo proof — each proof stored as its own Firebase node
  // Path: cm-proofs/{user}/{date}/{taskId}  ← no more giant JSON blobs
  const submitProof = async (user, taskId, photoBase64) => {
    const today = TODAY();
    const task  = config?.tasks[user]?.find(t => t.id === taskId);
    const data  = { photo: photoBase64, taskTitle: task?.title||'', taskEmoji: task?.emoji||'📸', submittedAt: new Date().toISOString() };
    // Optimistic local update so kid sees "pending" immediately
    setProofs(p => ({ ...p, [user]: { ...p[user], [taskId]: data } }));
    try {
      await set(ref(db, `cm-proofs/${user}/${today}/${taskId}`), data);
    } catch(err) {
      const errMsg = err?.code || err?.message || 'unknown';
      console.error('submitProof failed:', errMsg);
      // Revert local state
      setProofs(p => { const u = {...p[user]}; delete u[taskId]; return {...p, [user]: u}; });
      showToast(`⚠️ Firebase error: ${errMsg}`);
    }
  };

  // Parent approves proof — BOTH parents must approve
  // First parent: marks proof, task stays pending
  // Second parent (different): completes task, earns stars, deletes proof
  const approveProof = async (user, taskId) => {
    const today = TODAY();
    const proof = proofs[user]?.[taskId];
    if (!proof) return;
    if (proof.firstApprovalBy === currentParent) {
      showToast('You already approved this one!');
      return;
    }
    if (!proof.firstApprovalBy) {
      // First approval — update proof, wait for second parent
      await set(ref(db, `cm-proofs/${user}/${today}/${taskId}`), {
        ...proof, firstApprovalBy: currentParent, firstApprovedAt: new Date().toISOString(),
      });
    } else {
      // Second approval from other parent — complete task
      const task    = config.tasks[user].find(t => t.id === taskId);
      const newComp = [...comp[user], taskId];
      const newBal  = bal[user] + (task?.minutes || 0);
      const newAlltime = alltime[user] + (task?.minutes || 0);
      const newDaily   = dailyEarned[user] + (task?.minutes || 0);
      setComp(p => ({ ...p, [user]: newComp }));
      setBal(p  => ({ ...p, [user]: newBal  }));
      setAlltime(p => ({ ...p, [user]: newAlltime }));
      setDailyEarned(p => ({ ...p, [user]: newDaily }));
      await S.set(`cm-c-${user}-${today}`, JSON.stringify(newComp));
      await S.set(`cm-b-${user}`, String(newBal));
      await S.set(`cm-alltime-${user}`, String(newAlltime));
      await S.set(`cm-daily-${user}-${today}`, String(newDaily));
      await set(ref(db, `cm-proofs/${user}/${today}/${taskId}`), null);
    }
  };

  // Parent rejects proof — instant veto, one parent is enough
  const rejectProof = async (user, taskId) => {
    const today = TODAY();
    await set(ref(db, `cm-proofs/${user}/${today}/${taskId}`), null);
  };

  const redeem = async (user, mins) => {
    const newBal = Math.max(0, bal[user] - mins);
    setBal(p => ({ ...p, [user]: newBal }));
    await S.set(`cm-b-${user}`, String(newBal));
  };

  // Save the reward catalog
  const saveRewards = async (updated) => {
    setRewards(updated);
    await S.set('cm-rewards', JSON.stringify(updated));
  };

  // Upload avatar for a kid
  const saveAvatar = async (user, imageBase64) => {
    setAvatars(p => ({ ...p, [user]: imageBase64 }));
    await S.set(`cm-avatar-${user}`, imageBase64);
  };

  // Kid requests a reward
  const requestReward = async (user, reward) => {
    const req = { id: uid(), user, rewardId: reward.id, rewardTitle: reward.title, rewardEmoji: reward.emoji, stars: reward.stars, requestedAt: new Date().toISOString(), status: 'pending', note: '', resolvedBy: '', resolvedAt: '' };
    const updated = [...rewardReqs, req];
    setRewardReqs(updated);
    await S.set('cm-reward-requests', JSON.stringify(updated));
  };

  // Parent approves reward — BOTH parents must approve
  // First parent: marks request as first_approved
  // Second parent (different): fully approves, deducts stars, logs activity
  const approveRewardReq = async (reqId, note) => {
    const req = rewardReqs.find(r => r.id === reqId);
    if (!req) return;
    const approvals = req.approvals || [];
    if (approvals.includes(currentParent)) {
      showToast('You already approved this one!');
      return;
    }
    const newApprovals = [...approvals, currentParent];
    if (newApprovals.length >= 2) {
      // Both parents approved — fully grant it
      const newBal = Math.max(0, bal[req.user] - req.stars);
      setBal(p => ({ ...p, [req.user]: newBal }));
      await S.set(`cm-b-${req.user}`, String(newBal));
      const updatedReqs = rewardReqs.map(r => r.id === reqId
        ? { ...r, approvals: newApprovals, status: 'approved', resolvedBy: `${req.firstApprovalBy} & ${currentParent}`, resolvedAt: new Date().toISOString(), note: note || req.firstNote || '' }
        : r);
      setRewardReqs(updatedReqs);
      await S.set('cm-reward-requests', JSON.stringify(updatedReqs));
      const newActivity = [{ id: uid(), type: 'approved', by: `${req.firstApprovalBy} & ${currentParent}`, user: req.user, rewardTitle: req.rewardTitle, rewardEmoji: req.rewardEmoji, stars: req.stars, note: note || req.firstNote || '', timestamp: new Date().toISOString() }, ...activity].slice(0, 50);
      setActivity(newActivity);
      await S.set('cm-activity', JSON.stringify(newActivity));
    } else {
      // First approval — waiting for the other parent
      const updatedReqs = rewardReqs.map(r => r.id === reqId
        ? { ...r, approvals: newApprovals, status: 'first_approved', firstApprovalBy: currentParent, firstApprovalAt: new Date().toISOString(), firstNote: note || '' }
        : r);
      setRewardReqs(updatedReqs);
      await S.set('cm-reward-requests', JSON.stringify(updatedReqs));
    }
  };

  // Parent denies reward — no star change, resolve request, log activity
  const denyRewardReq = async (reqId, note) => {
    const req = rewardReqs.find(r => r.id === reqId);
    if (!req) return;
    const updatedReqs = rewardReqs.map(r => r.id === reqId
      ? { ...r, status: 'denied', resolvedBy: currentParent, resolvedAt: new Date().toISOString(), note }
      : r);
    setRewardReqs(updatedReqs);
    await S.set('cm-reward-requests', JSON.stringify(updatedReqs));
    const newActivity = [{ id: uid(), type: 'denied', by: currentParent, user: req.user, rewardTitle: req.rewardTitle, rewardEmoji: req.rewardEmoji, stars: req.stars, note, timestamp: new Date().toISOString() }, ...activity].slice(0, 50);
    setActivity(newActivity);
    await S.set('cm-activity', JSON.stringify(newActivity));
  };

  if (loading) return <div style={{minHeight:'100vh',background:'#0d0d2b',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'white',fontFamily:'sans-serif',fontSize:20}}>🌟 Loading Koda…</div></div>;

  if (view==='landing')   return <Landing onSelect={t=>{setPinTarget(t);setView('pin');}} avatars={avatars}/>;
  if (view==='pin')       return <PinScreen target={pinTarget} config={config} onSuccess={()=>{if(pinTarget==='mom'||pinTarget==='dad')setCurrentParent(pinTarget==='mom'?'Mom':'Dad');setView(pinTarget);}} onBack={()=>setView('landing')}/>;
  if (view==='mom'||view==='dad') return <><ParentView config={config} saveConfig={saveConfig} comp={comp} bal={bal} proofs={proofs} goals={goals} rewards={rewards} rewardReqs={rewardReqs} activity={activity} avatars={avatars} alltime={alltime} dailyEarned={dailyEarned} redeem={redeem} approveProof={approveProof} rejectProof={rejectProof} toggleProofRequired={toggleProofRequired} reorderTask={reorderTask} updateTaskStars={updateTaskStars} saveRewards={saveRewards} saveAvatar={saveAvatar} approveRewardReq={approveRewardReq} denyRewardReq={denyRewardReq} fbStatus={fbStatus} toggleTask={toggleTask} parentName={currentParent} logout={()=>setView('landing')}/>{toast&&<Toast msg={toast}/>}</>;
  if (view==='isabella')  return <><KidView user="isabella" theme="kawaii" tasks={config.tasks.isabella} comp={comp.isabella} proofs={proofs.isabella} goal={goals.isabella} rewards={rewards} rewardReqs={rewardReqs.filter(r=>r.user==='isabella')} bal={bal.isabella} alltime={alltime.isabella} dailyEarned={dailyEarned.isabella} avatar={avatars.isabella} onToggle={id=>toggleTask('isabella',id)} onComplete={id=>completeTask('isabella',id)} onSubmitProof={(id,p)=>submitProof('isabella',id,p)} onSetGoal={g=>submitGoal('isabella',g)} onRequestReward={r=>requestReward('isabella',r)} logout={()=>setView('landing')}/>{toast&&<Toast msg={toast}/>}</>;
  if (view==='jocelyn')   return <><KidView user="jocelyn"  theme="spidey" tasks={config.tasks.jocelyn}  comp={comp.jocelyn}  proofs={proofs.jocelyn}  goal={goals.jocelyn}  rewards={rewards} rewardReqs={rewardReqs.filter(r=>r.user==='jocelyn')}  bal={bal.jocelyn}  alltime={alltime.jocelyn}  dailyEarned={dailyEarned.jocelyn}  avatar={avatars.jocelyn}  onToggle={id=>toggleTask('jocelyn',id)}  onComplete={id=>completeTask('jocelyn',id)}  onSubmitProof={(id,p)=>submitProof('jocelyn',id,p)}  onSetGoal={g=>submitGoal('jocelyn',g)}  onRequestReward={r=>requestReward('jocelyn',r)}  logout={()=>setView('landing')}/>{toast&&<Toast msg={toast}/>}</>;
  return null;
}

/* ══════════════════════════════════════════
   LANDING
══════════════════════════════════════════ */
function Landing({ onSelect, avatars }) {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0d2b 0%,#1a0533 60%,#0d1a2b 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Nunito',sans-serif",position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{textAlign:'center',marginBottom:36,position:'relative',zIndex:1}}>
        <div style={{fontSize:64,marginBottom:4,filter:'drop-shadow(0 0 24px rgba(255,220,80,0.8))'}}>🌟</div>
        <h1 style={{color:'white',fontSize:38,fontWeight:900,margin:'0 0 6px',letterSpacing:-1,fontFamily:"'Fredoka One',sans-serif"}}>Koda</h1>
        <p style={{color:'rgba(255,220,80,0.7)',fontSize:13,margin:0,letterSpacing:1}}>Do the thing. Earn the stars. ✨</p>
      </div>
      <div style={{width:'100%',maxWidth:380,position:'relative',zIndex:1}}>
        <LandingCard emoji="👩" name="Mom" sub="Mission Control" bg="linear-gradient(135deg,#be185d,#db2777)" border="rgba(251,182,206,0.4)" glow="rgba(219,39,119,0.3)" onClick={()=>onSelect('mom')}/>
        <LandingCard emoji="👨" name="Dad" sub="Mission Control" bg="linear-gradient(135deg,#1e3a5f,#243b80)" border="rgba(99,179,237,0.35)" glow="rgba(59,130,246,0.25)" onClick={()=>onSelect('dad')}/>
        <LandingCard emoji="🌸" name="Isabella" sub="✨ Your kawaii quests!" bg="linear-gradient(135deg,#7b2ff7,#f107a3)" border="rgba(255,182,213,0.5)" glow="rgba(241,7,163,0.3)" badge="アニメ" avatar={avatars.isabella} onClick={()=>onSelect('isabella')}/>
        <LandingCard emoji="🕷️" name="Jossy" sub="Your web of tasks awaits 💅" bg="linear-gradient(135deg,#8b0000,#e91e63)" border="rgba(255,100,150,0.4)" glow="rgba(220,0,50,0.3)" webDeco avatar={avatars.jocelyn} onClick={()=>onSelect('jocelyn')}/>
      </div>
      <div style={{marginTop:20,padding:'8px 18px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'rgba(255,255,255,0.3)',fontSize:11,position:'relative',zIndex:1,textAlign:'center'}}>
        🌟 Koda {VERSION} &nbsp;·&nbsp; Mom 1234 · Dad 5678 · Isabella 1111 · Jossy 2222
      </div>
    </div>
  );
}

function Stars() {
  const stars = Array.from({length:36},(_,i)=>({x:(i*37+13)%100,y:(i*53+7)%100,size:1+(i%3),delay:(i*0.4)%4,dur:2+(i%3)}));
  return <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{stars.map((s,i)=><div key={i} style={{position:'absolute',left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,borderRadius:'50%',background:'white',animation:`twinkle ${s.dur}s ${s.delay}s infinite`}}/>)}</div>;
}

function LandingCard({emoji,name,sub,bg,border,glow,badge,webDeco,avatar,onClick}) {
  const [hov,setHov]=useState(false);
  const webPat=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg stroke='rgba(255,255,255,0.18)' fill='none' stroke-width='0.7'%3E%3Ccircle cx='60' cy='60' r='15'/%3E%3Ccircle cx='60' cy='60' r='35'/%3E%3Ccircle cx='60' cy='60' r='55'/%3E%3Cline x1='60' y1='5' x2='60' y2='115'/%3E%3Cline x1='5' y1='60' x2='115' y2='60'/%3E%3Cline x1='18' y1='18' x2='102' y2='102'/%3E%3Cline x1='102' y1='18' x2='18' y2='102'/%3E%3C/g%3E%3C/svg%3E")`;
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:bg,border:`1.5px solid ${border}`,borderRadius:22,padding:'18px 22px',marginBottom:14,cursor:'pointer',display:'flex',alignItems:'center',gap:14,position:'relative',overflow:'hidden',boxShadow:hov?`0 12px 44px ${glow}`:`0 4px 22px rgba(0,0,0,0.45)`,transform:hov?'translateY(-3px) scale(1.01)':'none',transition:'all 0.25s cubic-bezier(.34,1.56,.64,1)'}}>
      {webDeco&&<div style={{position:'absolute',right:-20,top:-20,width:120,height:120,backgroundImage:webPat,backgroundSize:'contain',backgroundRepeat:'no-repeat',animation:'webDrift 6s ease infinite'}}/>}
      {/* Avatar circle or emoji */}
      {avatar
        ? <div style={{width:46,height:46,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:'2px solid rgba(255,255,255,0.4)',boxShadow:hov?`0 0 16px ${glow}`:'none',transition:'box-shadow 0.25s'}}>
            <img src={avatar} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          </div>
        : <div style={{fontSize:36,animation:hov?'float 1.5s ease infinite':'none',flexShrink:0}}>{emoji}</div>
      }
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
  const COLOR={mom:'#db2777',dad:'#3b82f6',isabella:'#f107a3',jocelyn:'#e91e63'};
  const NAME={mom:'Mom',dad:'Dad',isabella:'Isabella',jocelyn:'Jossy'};
  const ICON={mom:'👩',dad:'👨',isabella:'🌸',jocelyn:'🕷️'};
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
function ParentView({config,saveConfig,comp,bal,proofs,goals,rewards,rewardReqs,activity,avatars,alltime,dailyEarned,redeem,approveProof,rejectProof,toggleProofRequired,reorderTask,updateTaskStars,saveRewards,saveAvatar,approveRewardReq,denyRewardReq,fbStatus,toggleTask,parentName,logout}) {
  const [tab,setTab]=useState('overview');
  const [addFor,setAddFor]=useState(null);
  const [newTask,setNewTask]=useState({title:'',emoji:'⭐',recurring:true,minutes:15,requiresProof:false,timeOfDay:'morning'});
  const [showEmoji,setShowEmoji]=useState(false);
  const [redeemAmt,setRedeemAmt]=useState({isabella:'',jocelyn:''});
  const [newPins,setNewPins]=useState({mom:'',dad:'',isabella:'',jocelyn:''});
  const [savedMsg,setSavedMsg]=useState('');
  const pendingProofs  = Object.keys(proofs.isabella||{}).length+Object.keys(proofs.jocelyn||{}).length;
  const pendingRewards = rewardReqs.filter(r=>r.status==='pending').length;

  const addTask=user=>{
    if(!newTask.title.trim())return;
    const task = { id:uid(), ...newTask };
    // Non-recurring tasks get a creation date so they disappear tomorrow
    if (!task.recurring) task.createdDate = TODAY();
    saveConfig({...config,tasks:{...config.tasks,[user]:[...config.tasks[user],task]}});
    setNewTask({title:'',emoji:'⭐',recurring:true,minutes:15,requiresProof:false,timeOfDay:'morning'});
    setAddFor(null);setShowEmoji(false);
  };
  const delTask=(user,id)=>saveConfig({...config,tasks:{...config.tasks,[user]:config.tasks[user].filter(t=>t.id!==id)}});
  const doRedeem=user=>{const m=parseInt(redeemAmt[user]);if(!m||m<=0)return;redeem(user,m);setRedeemAmt(p=>({...p,[user]:''}));};
  const savePins=()=>{
    saveConfig({...config,pins:{mom:newPins.mom||config.pins.mom,dad:newPins.dad||config.pins.dad,isabella:newPins.isabella||config.pins.isabella,jocelyn:newPins.jocelyn||config.pins.jocelyn}});
    setNewPins({mom:'',dad:'',isabella:'',jocelyn:''});setSavedMsg('✅ PINs saved!');setTimeout(()=>setSavedMsg(''),2500);
  };

  const TABS=[
    {id:'overview',  label:'🏠', title:'Overview'},
    {id:'proof',     label:'📸', title:'Proof',    badge:pendingProofs},
    {id:'rewards',   label:'🎁', title:'Requests', badge:pendingRewards},
    {id:'activity',  label:'📋', title:'Activity'},
    {id:'store',     label:'🛍️', title:'Rewards'},
    {id:'isabella',  label:'🌸', title:'Isabella'},
    {id:'jocelyn',   label:'🕷️', title:'Jossy'},
    {id:'settings',  label:'⚙️', title:'Settings'},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#0a0f1e',fontFamily:"'Nunito',sans-serif",color:'white'}}>
      <div style={{background:'linear-gradient(135deg,#0f2a4a,#1a3a6e)',padding:'20px 20px 0',borderBottom:'1px solid rgba(99,179,237,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><div style={{fontWeight:900,fontSize:22}}>🌟 Koda</div><div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{parentName} · Mission Control · <span style={{color:'rgba(255,255,255,0.25)'}}>{VERSION}</span></div></div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            <button onClick={logout} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,padding:'6px 14px',color:'rgba(255,255,255,0.65)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Sign Out</button>
            <div style={{fontSize:11,color:fbStatus==='ok'?'#4ade80':fbStatus==='checking'?'rgba(255,255,255,0.4)':'#f87171'}}>
              {fbStatus==='ok'?'🟢 Firebase connected':fbStatus==='checking'?'⏳ Connecting…':`🔴 ${fbStatus}`}
            </div>
          </div>
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

        {tab==='overview'&&<ParentOverview comp={comp} bal={bal} proofs={proofs} goals={goals} config={config} rewardReqs={rewardReqs} avatars={avatars} alltime={alltime} dailyEarned={dailyEarned} onShowProof={()=>setTab('proof')} onShowRewards={()=>setTab('rewards')}/>}
        {tab==='proof'&&<ProofInbox proofs={proofs} config={config} onApprove={approveProof} onReject={rejectProof} parentName={parentName}/>}
        {tab==='rewards'&&<RewardRequests rewardReqs={rewardReqs} bal={bal} onApprove={approveRewardReq} onDeny={denyRewardReq} parentName={parentName}/>}
        {tab==='activity'&&<ActivityLog activity={activity}/>}
        {tab==='store'&&<ManageRewards rewards={rewards} saveRewards={saveRewards}/>}

        {(tab==='isabella'||tab==='jocelyn')&&(
          <ParentTaskTab user={tab} tasks={config.tasks[tab]} comp={comp[tab]} proofs={proofs[tab]||{}} onAdd={()=>setAddFor(tab)} onDel={id=>delTask(tab,id)} onToggleProof={id=>toggleProofRequired(tab,id)} onReorder={(id,dir)=>reorderTask(tab,id,dir)} onUpdateStars={(id,s)=>updateTaskStars(tab,id,s)} onUndo={id=>toggleTask(tab,id)} addFor={addFor} newTask={newTask} setNewTask={setNewTask} showEmoji={showEmoji} setShowEmoji={setShowEmoji} onConfirm={()=>addTask(tab)} onCancel={()=>{setAddFor(null);setShowEmoji(false);}}/>
        )}

        {tab==='screentime'&&<>
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:16}}>⏱️ Screen Time Bank</h2>
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
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>⚙️ Settings</h2>

          {/* ── Backup & Restore ── */}
          <BackupRestore config={config} avatars={avatars} bal={bal} alltime={alltime}/>

          {/* Avatar upload */}
          <div style={{marginBottom:24}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:'rgba(255,255,255,0.8)'}}>🖼️ Kid Avatars</div>
            {[{key:'isabella',label:'🌸 Isabella'},{key:'jocelyn',label:'🕷️ Jossy'}].map(({key,label})=>(
              <div key={key} style={{display:'flex',alignItems:'center',gap:14,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'14px 16px',marginBottom:10}}>
                {avatars[key]
                  ? <img src={avatars[key]} alt={key} style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(255,255,255,0.3)',flexShrink:0}}/>
                  : <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'2px dashed rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{key==='isabella'?'🌸':'🕷️'}</div>
                }
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{label}</div>
                  <div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{avatars[key]?'Tap to change avatar':'No avatar set'}</div>
                </div>
                <label style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,padding:'6px 14px',color:'white',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>
                  {avatars[key]?'Change':'Upload'}
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={async e=>{
                    const file=e.target.files?.[0]; if(!file)return;
                    const canvas=document.createElement('canvas');
                    const ctx=canvas.getContext('2d');
                    const img=new Image();
                    img.onload=async()=>{
                      const size=Math.min(img.width,img.height);
                      canvas.width=200;canvas.height=200;
                      ctx.beginPath();ctx.arc(100,100,100,0,Math.PI*2);ctx.clip();
                      ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,200,200);
                      await saveAvatar(key,canvas.toDataURL('image/jpeg',0.85));
                    };
                    img.src=URL.createObjectURL(file);
                    e.target.value='';
                  }}/>
                </label>
              </div>
            ))}
          </div>

          <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:'rgba(255,255,255,0.8)'}}>🔐 Change PINs</div>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:16}}>Leave blank to keep current PIN</p>
          {[{key:'mom',label:'👩 Mom'},{key:'dad',label:'👨 Dad'},{key:'isabella',label:'🌸 Isabella'},{key:'jocelyn',label:'🕷️ Jossy'}].map(({key,label})=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:'block',color:'rgba(255,255,255,0.55)',fontSize:13,marginBottom:6}}>{label} <span style={{color:'rgba(255,255,255,0.25)'}}>— current: {config.pins[key]}</span></label>
              <input type="tel" maxLength={4} placeholder="New 4-digit PIN" value={newPins[key]||''} onChange={e=>setNewPins(p=>({...p,[key]:e.target.value.replace(/\D/g,'').slice(0,4)}))} style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:'10px 14px',color:'white',fontSize:16,fontFamily:'inherit',outline:'none'}}/>
            </div>
          ))}
          <button onClick={savePins} style={{width:'100%',background:'#2563eb',border:'none',borderRadius:12,padding:12,color:'white',fontWeight:700,cursor:'pointer',fontSize:15,fontFamily:'inherit',marginTop:8}}>Save PINs</button>
          {savedMsg&&<div style={{color:'#4ade80',textAlign:'center',marginTop:10,fontWeight:700}}>{savedMsg}</div>}
        </>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BACKUP & RESTORE
══════════════════════════════════════════ */
function BackupRestore({config, avatars, bal, alltime}) {
  const [status,    setStatus]    = useState('');
  const [restoring, setRestoring] = useState(false);
  const importRef = useRef(null);

  const BACKUP_KEYS = [
    'cm-config',
    'cm-rewards',
    'cm-activity',
    'cm-reward-requests',
    'cm-b-isabella',
    'cm-b-jocelyn',
    'cm-alltime-isabella',
    'cm-alltime-jocelyn',
    'cm-avatar-isabella',
    'cm-avatar-jocelyn',
  ];

  const doBackup = async () => {
    setStatus('⏳ Collecting data…');
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Also grab today's completions
      const allKeys = [
        ...BACKUP_KEYS,
        `cm-c-isabella-${today}`,
        `cm-c-jocelyn-${today}`,
        `cm-daily-isabella-${today}`,
        `cm-daily-jocelyn-${today}`,
      ];
      const values = await Promise.all(allKeys.map(k => S.get(k)));
      const backup = {
        version: VERSION,
        exportedAt: new Date().toISOString(),
        data: Object.fromEntries(allKeys.map((k, i) => [k, values[i]])),
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `koda-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('✅ Backup downloaded!');
      setTimeout(() => setStatus(''), 4000);
    } catch(e) {
      setStatus(`❌ Backup failed: ${e.message}`);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const doRestore = async (file) => {
    if (!file) return;
    setRestoring(true);
    setStatus('⏳ Reading backup file…');
    try {
      const text   = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data) throw new Error('Invalid backup file — missing data');
      setStatus(`⏳ Restoring ${Object.keys(backup.data).length} records…`);
      const entries = Object.entries(backup.data).filter(([, v]) => v !== null && v !== undefined);
      await Promise.all(entries.map(([k, v]) => S.set(k, typeof v === 'string' ? v : JSON.stringify(v))));
      setStatus(`✅ Restored! Backed up on ${new Date(backup.exportedAt).toLocaleDateString()}. Reload the app to see changes.`);
    } catch(e) {
      setStatus(`❌ Restore failed: ${e.message}`);
    } finally {
      setRestoring(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  return (
    <div style={{marginBottom:28}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:6,color:'rgba(255,255,255,0.8)'}}>💾 Backup & Restore</div>
      <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,marginBottom:14}}>
        Backup saves all tasks, stars, rewards, activity and avatars to a file on your phone. Use it to recover data or move to a new device.
      </div>

      <div style={{display:'flex',gap:10,marginBottom:12}}>
        {/* Backup */}
        <button onClick={doBackup} style={{flex:1,background:'rgba(59,130,246,0.15)',border:'1.5px solid rgba(59,130,246,0.4)',borderRadius:14,padding:'14px 10px',color:'#60a5fa',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <span style={{fontSize:24}}>📤</span>
          <span>Export Backup</span>
          <span style={{fontSize:10,fontWeight:400,color:'rgba(255,255,255,0.4)'}}>Downloads .json file</span>
        </button>

        {/* Restore */}
        <label style={{flex:1,background:'rgba(251,191,36,0.12)',border:'1.5px solid rgba(251,191,36,0.3)',borderRadius:14,padding:'14px 10px',color:'#fbbf24',fontWeight:700,cursor:restoring?'default':'pointer',fontSize:14,fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:4,opacity:restoring?0.6:1}}>
          <span style={{fontSize:24}}>📥</span>
          <span>{restoring?'Restoring…':'Import Backup'}</span>
          <span style={{fontSize:10,fontWeight:400,color:'rgba(255,255,255,0.4)'}}>Pick .json file</span>
          <input ref={importRef} type="file" accept=".json,application/json" disabled={restoring} onChange={e=>doRestore(e.target.files?.[0])} style={{display:'none'}}/>
        </label>
      </div>

      {status && (
        <div style={{background: status.startsWith('✅') ? 'rgba(74,222,128,0.12)' : status.startsWith('❌') ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${status.startsWith('✅') ? 'rgba(74,222,128,0.3)' : status.startsWith('❌') ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:12,padding:'10px 14px',fontSize:13,color: status.startsWith('✅') ? '#4ade80' : status.startsWith('❌') ? '#f87171' : 'rgba(255,255,255,0.7)',lineHeight:1.5}}>
          {status}
        </div>
      )}

      {/* Quick stats of what would be backed up */}
      <div style={{display:'flex',gap:8,marginTop:12}}>
        {[
          {label:'Tasks', val: (config?.tasks?.isabella?.length||0)+(config?.tasks?.jocelyn?.length||0)},
          {label:'Isa Stars', val: bal?.isabella||0},
          {label:'Jossy Stars', val: bal?.jocelyn||0},
          {label:'Isa All-Time', val: alltime?.isabella||0},
        ].map(({label,val})=>(
          <div key={label} style={{flex:1,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'6px 8px',textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:14,color:'white'}}>{val}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParentOverview({comp,bal,proofs,goals,config,rewardReqs,avatars,alltime,dailyEarned,onShowProof,onShowRewards}) {
  const pendingProofs  = Object.keys(proofs.isabella||{}).length+Object.keys(proofs.jocelyn||{}).length;
  const pendingRewards = rewardReqs.filter(r=>r.status==='pending'||r.status==='first_approved'||(r.status===undefined)).length;
  return(
    <>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:16}}>📊 Today&apos;s Overview</h2>
      {['isabella','jocelyn'].map(u=>{
        const tasks=config.tasks[u]; const done=comp[u].length; const total=tasks.length;
        const pct=total>0?Math.round(done/total*100):0;
        const color=u==='isabella'?'#f107a3':'#e91e63';
        const name=u==='isabella'?'Isabella':'Jossy';
        const pending=Object.keys(proofs[u]||{}).length;
        const avatar=avatars?.[u];
        return(
          <div key={u} style={{background:'rgba(255,255,255,0.04)',borderRadius:18,padding:18,marginBottom:12,border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              {avatar
                ? <img src={avatar} alt={name} style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',border:`2px solid ${color}`,flexShrink:0}}/>
                : <div style={{width:44,height:44,borderRadius:'50%',background:`${color}22`,border:`2px solid ${color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{u==='isabella'?'🌸':'🕷️'}</div>
              }
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:'white'}}>{name}</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{done}/{total} tasks done today</div>
              </div>
              {pending>0&&<span style={{color:'#fbbf24',fontWeight:700,fontSize:12}}>📸 {pending}</span>}
            </div>
            {/* Progress bar */}
            <div style={{background:'rgba(255,255,255,0.1)',borderRadius:100,height:8,overflow:'hidden',marginBottom:12}}>
              <div style={{background:color,width:`${pct}%`,height:'100%',borderRadius:100,transition:'width 0.6s ease'}}/>
            </div>
            {/* Star breakdown */}
            <div style={{display:'flex',gap:8}}>
              <div style={{flex:1,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontWeight:800,fontSize:16,color}}>{bal[u]}</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>🌟 Balance</div>
              </div>
              <div style={{flex:1,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontWeight:800,fontSize:16,color:'#c084fc'}}>{dailyEarned?.[u]||0}</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>⭐ Today</div>
              </div>
              <div style={{flex:1,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontWeight:800,fontSize:16,color:'#94a3b8'}}>{alltime?.[u]||0}</div>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>🏆 All Time</div>
              </div>
            </div>
            {goals[u]&&<div style={{color:'rgba(255,255,255,0.4)',fontSize:12,marginTop:8}}>🎯 Goal: &ldquo;{goals[u]}&rdquo;</div>}
          </div>
        );
      })}
      {pendingProofs>0&&(
        <div onClick={onShowProof} style={{background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.35)',borderRadius:14,padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,marginTop:4}}>
          <span style={{fontSize:28}}>📸</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:'#fbbf24'}}>{pendingProofs} photo{pendingProofs>1?'s':''} waiting for your approval!</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>Tap to review →</div>
          </div>
        </div>
      )}
      {pendingRewards>0&&(
        <div onClick={onShowRewards} style={{background:'rgba(99,179,237,0.1)',border:'1px solid rgba(99,179,237,0.35)',borderRadius:14,padding:'14px 18px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,marginTop:8}}>
          <span style={{fontSize:28}}>🎁</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:'#60a5fa'}}>{pendingRewards} reward request{pendingRewards>1?'s':''} waiting!</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>Tap to approve or deny →</div>
          </div>
        </div>
      )}
      <RewardQueue rewardReqs={rewardReqs} isParent={true}/>
    </>
  );
}

function ProofInbox({proofs,config,onApprove,onReject,parentName}) {
  const all=[];
  ['isabella','jocelyn'].forEach(user=>Object.entries(proofs[user]||{}).forEach(([taskId,proof])=>all.push({user,taskId,...proof})));
  if(all.length===0)return(
    <div style={{textAlign:'center',padding:'60px 20px'}}>
      <div style={{fontSize:48,marginBottom:12}}>📭</div>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:16,fontWeight:600}}>No photos waiting!</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:13,marginTop:6}}>When the girls submit proof, it&apos;ll show up here.</div>
    </div>
  );
  const otherParent = parentName==='Mom' ? 'Dad' : 'Mom';
  return(
    <div>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>📸 Proof Inbox</h2>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:4}}>{all.length} photo{all.length>1?'s':''} waiting · <span style={{color:'#fbbf24'}}>Both parents must approve</span></p>
      <p style={{color:'rgba(255,255,255,0.3)',fontSize:12,marginBottom:20}}>Deny = instant rejection (one veto is enough)</p>
      {all.map((proof,i)=>{
        const isIsa=proof.user==='isabella';
        const color=isIsa?'#f107a3':'#e91e63';
        const name=isIsa?'🌸 Isabella':'🕷️ Jossy';
        const time=new Date(proof.submittedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
        const alreadyApproved = proof.firstApprovalBy===parentName;
        const firstApprovedBy = proof.firstApprovalBy;
        return(
          <div key={`${proof.user}-${proof.taskId}-${i}`} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${color}40`,borderRadius:18,overflow:'hidden',marginBottom:16}}>
            <div style={{position:'relative'}}>
              <img src={proof.photo} alt="proof" style={{width:'100%',maxHeight:280,objectFit:'cover',display:'block'}}/>
              <div style={{position:'absolute',top:10,left:10,background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'4px 12px',fontSize:13,fontWeight:700,color:'white'}}>{name}</div>
              <div style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'4px 12px',fontSize:12,color:'rgba(255,255,255,0.7)'}}>{time}</div>
            </div>
            <div style={{padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <span style={{fontSize:22}}>{proof.taskEmoji}</span>
                <span style={{fontWeight:700,fontSize:15}}>{proof.taskTitle}</span>
              </div>
              {/* Dual approval status */}
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'8px 12px',marginBottom:12,fontSize:12}}>
                {firstApprovedBy
                  ? <span style={{color:'#4ade80'}}>✅ {firstApprovedBy} approved · waiting for {firstApprovedBy==='Mom'?'Dad':'Mom'}</span>
                  : <span style={{color:'rgba(255,255,255,0.5)'}}>⏳ Waiting for both parents</span>}
              </div>
              {alreadyApproved
                ? <div style={{textAlign:'center',color:'#4ade80',fontWeight:700,padding:'8px',fontSize:14}}>✅ You approved this — waiting for {otherParent}</div>
                : (
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>onApprove(proof.user,proof.taskId)} style={{flex:1,background:'rgba(74,222,128,0.15)',border:'1.5px solid rgba(74,222,128,0.4)',borderRadius:12,padding:'10px',color:'#4ade80',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>
                      {firstApprovedBy ? `✅ Confirm (${otherParent})` : '✅ Approve'}
                    </button>
                    <button onClick={()=>onReject(proof.user,proof.taskId)} style={{flex:1,background:'rgba(239,68,68,0.12)',border:'1.5px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'10px',color:'#f87171',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>❌ Reject</button>
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ParentTaskTab({user,tasks,comp,proofs,onAdd,onDel,onToggleProof,onReorder,onUpdateStars,onUndo,addFor,newTask,setNewTask,showEmoji,setShowEmoji,onConfirm,onCancel}) {
  const color=user==='isabella'?'#f107a3':'#e91e63';
  const name=user==='isabella'?'🌸 Isabella':'🕷️ Jossy';
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
            <span style={{color:'rgba(255,255,255,0.55)',fontSize:13}}>🌟 Stars to earn:</span>
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
            {grpTasks.map((task, grpIdx)=>{
              const done=comp.includes(task.id);
              const pending=!!proofs[task.id];
              const isFirst=grpIdx===0;
              const isLast=grpIdx===grpTasks.length-1;
              return(
                <TaskRow key={task.id} task={task} done={done} pending={pending} isFirst={isFirst} isLast={isLast} color={color}
                  onReorder={onReorder} onToggleProof={onToggleProof} onDel={onDel} onUpdateStars={onUpdateStars} onUndo={onUndo}/>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({task,done,pending,isFirst,isLast,color,onReorder,onToggleProof,onDel,onUpdateStars,onUndo}) {
  const [editingStars, setEditingStars] = useState(false);
  const [starsVal,     setStarsVal]     = useState(task.minutes);

  const saveStars = () => {
    setEditingStars(false);
    const val = Math.max(1, parseInt(starsVal) || task.minutes);
    setStarsVal(val);
    if (val !== task.minutes) onUpdateStars(task.id, val);
  };

  // keep local val in sync if task.minutes changes externally
  useEffect(() => { setStarsVal(task.minutes); }, [task.minutes]);

  return(
    <div style={{display:'flex',alignItems:'center',gap:8,background:done?'rgba(74,222,128,0.07)':pending?'rgba(251,191,36,0.07)':'rgba(255,255,255,0.03)',border:`1px solid ${done?'rgba(74,222,128,0.2)':pending?'rgba(251,191,36,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:12,padding:'10px 12px',marginBottom:6}}>

      {/* ▲▼ reorder */}
      <div style={{display:'flex',flexDirection:'column',gap:2,flexShrink:0}}>
        <button onClick={()=>onReorder(task.id,'up')} disabled={isFirst}
          style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,width:22,height:22,color:isFirst?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.6)',cursor:isFirst?'default':'pointer',fontSize:11,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>▲</button>
        <button onClick={()=>onReorder(task.id,'down')} disabled={isLast}
          style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,width:22,height:22,color:isLast?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.6)',cursor:isLast?'default':'pointer',fontSize:11,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>▼</button>
      </div>

      {/* Emoji */}
      <div style={{fontSize:18,flexShrink:0}}>{task.emoji}</div>

      {/* Title + editable stars */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:13,textDecoration:done?'line-through':'none',color:done?'rgba(255,255,255,0.3)':'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:11}}>
            {task.isMantras&&'📖 · '}{task.isGoal&&'🎯 · '}
            {task.recurring ? '🔄 · ' : '📌 Today · '}
          </span>
          {/* Inline star editor */}
          <div style={{display:'flex',alignItems:'center',gap:3}}>
            <span style={{fontSize:11,color:'rgba(255,215,0,0.7)'}}>🌟</span>
            {editingStars ? (
              <input
                autoFocus
                type="number"
                value={starsVal}
                onChange={e=>setStarsVal(e.target.value)}
                onBlur={saveStars}
                onKeyDown={e=>{if(e.key==='Enter')saveStars();if(e.key==='Escape'){setEditingStars(false);setStarsVal(task.minutes);}}}
                style={{width:46,background:'rgba(255,215,0,0.15)',border:'1px solid rgba(255,215,0,0.5)',borderRadius:6,padding:'1px 6px',color:'#ffd700',fontSize:12,fontFamily:'inherit',outline:'none',textAlign:'center'}}
              />
            ) : (
              <button onClick={()=>setEditingStars(true)} title="Click to edit stars"
                style={{background:'rgba(255,215,0,0.1)',border:'1px solid rgba(255,215,0,0.25)',borderRadius:6,padding:'1px 8px',color:'rgba(255,215,0,0.8)',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
                {task.minutes} ✏️
              </button>
            )}
          </div>
          {done&&<span style={{color:'rgba(74,222,128,0.6)',fontSize:11}}>· ✅</span>}
          {pending&&<span style={{color:'#fbbf24',fontSize:11}}>· 📸</span>}
        </div>
      </div>

      {/* ↩ undo (parent only) — shown when task is completed */}
      {done && (
        <button onClick={()=>onUndo(task.id)} title="Undo this completion"
          style={{background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:8,padding:'4px 8px',color:'#fbbf24',cursor:'pointer',fontSize:12,fontFamily:'inherit',flexShrink:0}}>↩</button>
      )}

      {/* 📷 proof toggle — hidden when done */}
      {!done&&<button onClick={()=>onToggleProof(task.id)} title={task.requiresProof?'Photo proof ON — tap to turn off':'Tap to require photo proof'}
        style={{background:task.requiresProof?`${color}25`:'rgba(255,255,255,0.06)',border:`1px solid ${task.requiresProof?color:'rgba(255,255,255,0.15)'}`,borderRadius:8,padding:'4px 7px',color:task.requiresProof?color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:13,flexShrink:0}}>📷</button>}

      {/* ✕ delete */}
      <button onClick={()=>onDel(task.id)}
        style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'4px 8px',color:'#f87171',cursor:'pointer',fontSize:12,fontFamily:'inherit',flexShrink:0}}>✕</button>
    </div>
  );
}


function Toggle({on,color,onChange}) {
  return <div onClick={onChange} style={{width:44,height:24,background:on?color:'rgba(255,255,255,0.15)',borderRadius:100,cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}><div style={{position:'absolute',top:2,left:on?22:2,width:20,height:20,background:'white',borderRadius:'50%',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/></div>;
}

/* ══════════════════════════════════════════
   SHARED KID VIEW  (renders Isabella or Jossy)
══════════════════════════════════════════ */
function KidView({user,theme,tasks,comp,proofs,goal,rewards,rewardReqs,onToggle,onComplete,onSubmitProof,onSetGoal,onRequestReward,bal,alltime,dailyEarned,avatar,logout}) {
  const isIsa = theme==='kawaii';
  const [kidTab, setKidTab] = useState('tasks');
  // filter to today's visible tasks
  const todayStr = new Date().toISOString().slice(0, 10);
  const visibleTaskIds = tasks.filter(t => t.recurring || !t.createdDate || t.createdDate === todayStr).map(t => t.id);
  const done    = comp.filter(id => visibleTaskIds.includes(id)).length;
  const total   = visibleTaskIds.length;
  const pct     = total>0?Math.round(done/total*100):0;
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

  // progress msg
  const msg = done===0 ? (isIsa?"Let's go! がんばって！ 🌸":"Time to sling some tasks, girl 🕷️")
    : done===total ? (isIsa?"ALL DONE! すごい！ 🎉":"ALL DONE! Your friendly neighborhood champ 🏆")
    : done<=1 ? `Great start! ${done} done ✨`
    : `${done} of ${total} done — keep going! 💪`;

  // group tasks by timeOfDay — filter out expired one-time tasks
  const visibleTasks = tasks.filter(t => {
    if (t.recurring) return true;
    if (!t.createdDate) return true; // legacy
    return t.createdDate === todayStr;
  });
  const groups = {};
  visibleTasks.forEach(t=>{ const g=t.timeOfDay||'general'; if(!groups[g])groups[g]=[]; groups[g].push(t); });

  return(
    <div style={{minHeight:'100vh',...bgStyle,fontFamily:ff,color:'white',position:'relative',overflow:'hidden'}}>
      {isIsa&&<SakuraDecor/>}
      {!isIsa&&<div style={{position:'fixed',inset:0,background:'linear-gradient(160deg,rgba(26,0,16,0.7) 0%,rgba(61,0,32,0.5) 50%,rgba(26,0,16,0.7) 100%)',pointerEvents:'none',zIndex:0}}/>}

      {/* Header */}
      <div style={{background:headerBg,backdropFilter:'blur(14px)',borderBottom:`1px solid ${headerBdr}`,padding:'20px 20px 16px',position:'relative',zIndex:2}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {/* Avatar circle */}
            {avatar
              ? <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:`2px solid ${accentColor}`,boxShadow:`0 0 14px ${accentColor}60`}}>
                  <img src={avatar} alt={user} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
              : <div style={{fontSize:32,flexShrink:0}}>{isIsa?'🌸':'🕷️'}</div>
            }
            <div>
              <div style={{fontSize:22,fontWeight:isIsa?400:800}}>{title}</div>
              <div style={{color:isIsa?'rgba(255,182,213,0.65)':'rgba(255,182,193,0.55)',fontSize:12,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>
                {subtitle} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
              </div>
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
        {/* Tab bar */}
        <div style={{display:'flex',gap:6,marginTop:14,background:'rgba(255,255,255,0.06)',borderRadius:14,padding:4}}>
          {[{id:'tasks',label:'📋 Tasks'},{id:'store',label:'🏪 Reward Store'}].map(t=>(
            <button key={t.id} onClick={()=>setKidTab(t.id)} style={{flex:1,background:kidTab===t.id?isIsa?'linear-gradient(135deg,#f107a3,#7b2ff7)':'linear-gradient(135deg,#8b0000,#e91e63)':'transparent',border:'none',borderRadius:10,padding:'8px',color:'white',fontWeight:kidTab===t.id?700:400,cursor:'pointer',fontSize:13,fontFamily:"'Nunito',sans-serif",opacity:kidTab===t.id?1:0.5,transition:'all 0.2s',boxShadow:kidTab===t.id?`0 2px 8px ${isIsa?'#f107a340':'#e91e6340'}`:'none'}}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Star breakdown — 3 stats */}
      <div style={{padding:'12px 20px 4px',position:'relative',zIndex:2,display:'flex',gap:8}}>
        <div style={{flex:1,background:isIsa?'rgba(255,215,0,0.12)':'rgba(233,30,99,0.15)',border:`1px solid ${isIsa?'rgba(255,215,0,0.3)':'rgba(255,107,157,0.35)'}`,borderRadius:14,padding:'8px 12px',textAlign:'center'}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:20,color:isIsa?'#ffd700':'#ff9dbe'}}>{bal}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:1}}>🌟 Balance</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'8px 12px',textAlign:'center'}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:20,color:'#c084fc'}}>{dailyEarned||0}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:1}}>⭐ Today</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'8px 12px',textAlign:'center'}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:20,color:'#94a3b8'}}>{alltime||0}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:1}}>🏆 All Time</div>
        </div>
      </div>

      {/* STORE TAB */}
      {kidTab==='store'&&(
        <KidStore rewards={rewards} rewardReqs={rewardReqs} bal={bal} alltime={alltime} dailyEarned={dailyEarned} isIsa={isIsa} onRequest={onRequestReward}/>
      )}

      {/* TASKS TAB */}
      {kidTab==='tasks'&&<>

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
        {visibleTasks.length===0&&<div style={{textAlign:'center',padding:60,color:'rgba(255,182,213,0.4)',fontFamily:"'Nunito',sans-serif"}}>No tasks yet! Ask a parent to add some 🌸</div>}
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
      </>}
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
  if(done) {
    const canUndo = !task.requiresProof && !task.isMantras && !task.isGoal && !task.isGoalReview;
    return(
      <div style={{display:'flex',alignItems:'center',gap:14,background:`${accentColor}14`,border:`1.5px solid ${accentColor}40`,borderRadius:18,padding:'12px 16px',marginBottom:8,animation:`fadeInUp 0.4s ${delay}ms both`,boxShadow:`0 4px 20px ${accentColor}18`}}>
        <div style={{width:30,height:30,borderRadius:isIsa?10:'50%',background:doneGradient,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 12px ${accentColor}55`,flexShrink:0}}><span style={{fontSize:14}}>{checkIcon}</span></div>
        <div style={{fontSize:22}}>{task.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:14,textDecoration:'line-through',color:'rgba(255,255,255,0.35)'}}>{task.title}</div>
          <div style={{color:`${accentColor}80`,fontSize:11,marginTop:2,fontFamily:"'Nunito',sans-serif"}}>
            {task.requiresProof ? '✅ Approved by parent' : '✅ Done'} · 🌟 {task.minutes} min earned
          </div>
        </div>
        {canUndo ? (
          <button onClick={onToggle} title="Undo this task"
            style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,padding:'5px 10px',color:'rgba(255,255,255,0.45)',cursor:'pointer',fontSize:12,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>
            ↩ Undo
          </button>
        ) : (
          <div style={{fontSize:18,animation:'float 2s ease infinite'}}>{doneFloatIcon}</div>
        )}
      </div>
    );
  }

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

/* ══════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════ */
function Toast({ msg }) {
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
      background: msg.startsWith('⚠️') ? 'rgba(220,38,38,0.95)' : 'rgba(22,163,74,0.95)',
      color: 'white', borderRadius: 14, padding: '12px 20px',
      fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14,
      zIndex: 999, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap', animation: 'fadeInUp 0.3s ease',
    }}>{msg}</div>
  );
}

function SakuraDecor() {
  const items=[{x:8,delay:0,dur:8,size:18,icon:'🌸'},{x:22,delay:1.5,dur:10,size:14,icon:'✨'},{x:40,delay:3,dur:7,size:16,icon:'⭐'},{x:58,delay:0.8,dur:11,size:12,icon:'🌸'},{x:72,delay:2.2,dur:9,size:20,icon:'💫'},{x:85,delay:4,dur:8,size:14,icon:'🎀'},{x:93,delay:1,dur:12,size:16,icon:'🌟'},{x:15,delay:5,dur:9,size:13,icon:'✨'},{x:50,delay:6,dur:10,size:18,icon:'🌸'},{x:66,delay:3.5,dur:7,size:15,icon:'🎀'}];
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>{items.map((item,i)=><div key={i} style={{position:'absolute',left:`${item.x}%`,top:'-30px',fontSize:item.size,animation:`sakura ${item.dur}s ${item.delay}s infinite linear`,opacity:0.65}}>{item.icon}</div>)}</div>;
}

/* ══════════════════════════════════════════
   REWARD REQUESTS  (parent view)
══════════════════════════════════════════ */
function RewardRequests({rewardReqs,bal,onApprove,onDeny,parentName}) {
  const [active,setActive]=useState(null);
  const [note,setNote]=useState('');
  const otherParent=parentName==='Mom'?'Dad':'Mom';
  const pending=rewardReqs.filter(r=>!r.status||r.status==='pending'||r.status==='first_approved');
  const startAction=(id,action)=>{setActive({id,action});setNote('');};
  const cancel=()=>{setActive(null);setNote('');};
  const confirm=()=>{
    if(active.action==='deny'&&!note.trim())return;
    if(active.action==='approve')onApprove(active.id,note.trim());
    else onDeny(active.id,note.trim());
    setActive(null);setNote('');
  };
  if(pending.length===0)return(
    <div style={{textAlign:'center',padding:'60px 20px'}}>
      <div style={{fontSize:48,marginBottom:12}}>🎁</div>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:16,fontWeight:600}}>No pending requests!</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:13,marginTop:6}}>Check the 📋 Activity tab for past decisions.</div>
    </div>
  );
  return(
    <div>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>🎁 Reward Requests</h2>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:4}}>{pending.length} request{pending.length>1?'s':''} · <span style={{color:'#fbbf24'}}>Both parents must approve</span></p>
      <p style={{color:'rgba(255,255,255,0.3)',fontSize:12,marginBottom:20}}>Deny = instant rejection</p>
      {pending.map(req=>{
        const isIsa=req.user==='isabella';
        const color=isIsa?'#f107a3':'#e91e63';
        const name=isIsa?'🌸 Isabella':'🕷️ Jossy';
        const userBal=bal[req.user];
        const time=new Date(req.requestedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
        const isActiveReq=active?.id===req.id;
        const alreadyApproved=(req.approvals||[]).includes(parentName);
        const firstApprovalBy=req.firstApprovalBy;
        return(
          <div key={req.id} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${color}40`,borderRadius:18,padding:20,marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontWeight:700,fontSize:16,color}}>{name}</span>
              <span style={{color:'rgba(255,255,255,0.35)',fontSize:12}}>{time}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,background:'rgba(255,255,255,0.05)',borderRadius:14,padding:'12px 14px',marginBottom:10}}>
              <span style={{fontSize:32}}>{req.rewardEmoji}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:'white'}}>{req.rewardTitle}</div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:2}}>🌟 {req.stars} stars · Balance: <span style={{color:'#ffd700',fontWeight:700}}>{userBal}</span></div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'8px 12px',marginBottom:12,fontSize:12}}>
              {firstApprovalBy?<span style={{color:'#4ade80'}}>✅ {firstApprovalBy} approved · waiting for {firstApprovalBy==='Mom'?'Dad':'Mom'}</span>:<span style={{color:'rgba(255,255,255,0.5)'}}>⏳ Waiting for both parents</span>}
            </div>
            {isActiveReq?(
              <div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:13,marginBottom:6}}>
                  {active.action==='deny'?'❌ Reason for denying (required):':'✅ Leave a note (optional):'}
                </div>
                <textarea autoFocus placeholder={active.action==='deny'?'e.g. "Finish homework first"':' e.g. "Great job this week!"'} value={note} onChange={e=>setNote(e.target.value)} rows={3} style={{width:'100%',background:'rgba(255,255,255,0.07)',border:`1px solid ${active.action==='deny'?'rgba(239,68,68,0.4)':'rgba(74,222,128,0.4)'}`,borderRadius:12,padding:'10px 14px',color:'white',fontSize:14,fontFamily:'inherit',outline:'none',resize:'none',marginBottom:10}}/>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={confirm} disabled={active.action==='deny'&&!note.trim()} style={{flex:1,background:active.action==='approve'?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.15)',border:`1.5px solid ${active.action==='approve'?'rgba(74,222,128,0.4)':'rgba(239,68,68,0.4)'}`,borderRadius:12,padding:'10px',color:active.action==='approve'?'#4ade80':'#f87171',fontWeight:700,cursor:active.action==='deny'&&!note.trim()?'default':'pointer',fontSize:14,fontFamily:'inherit',opacity:active.action==='deny'&&!note.trim()?0.4:1}}>
                    {active.action==='approve'?'✅ Confirm Approval':'❌ Confirm Denial'}
                  </button>
                  <button onClick={cancel} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:12,padding:'10px 16px',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
                </div>
              </div>
            ):alreadyApproved?(
              <div style={{textAlign:'center',color:'#4ade80',fontWeight:700,padding:'8px',fontSize:14}}>
                ✅ You approved — waiting for {otherParent}
                <div style={{marginTop:8}}><button onClick={()=>startAction(req.id,'deny')} style={{background:'rgba(239,68,68,0.12)',border:'1.5px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'8px 16px',color:'#f87171',fontWeight:700,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>❌ Actually Deny</button></div>
              </div>
            ):(
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>startAction(req.id,'approve')} style={{flex:1,background:'rgba(74,222,128,0.15)',border:'1.5px solid rgba(74,222,128,0.4)',borderRadius:12,padding:'10px',color:'#4ade80',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>{firstApprovalBy?`✅ Confirm (${parentName})`:"✅ Approve"}</button>
                <button onClick={()=>startAction(req.id,'deny')} style={{flex:1,background:'rgba(239,68,68,0.12)',border:'1.5px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'10px',color:'#f87171',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>❌ Deny</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


/* ══════════════════════════════════════════
   ACTIVITY LOG  (parent view)
══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   REWARD QUEUE  — today's reward activity
   Visible to parents (Overview) and kids (Store)
   Resets automatically each new day
══════════════════════════════════════════ */
function RewardQueue({rewardReqs, isParent}) {
  const today = TODAY();
  // Show requests from today only
  const todayReqs = rewardReqs.filter(r => r.requestedAt?.startsWith(today) || r.resolvedAt?.startsWith(today));
  if (todayReqs.length === 0) return null;

  const pending     = todayReqs.filter(r => !r.status || r.status==='pending');
  const partial     = todayReqs.filter(r => r.status==='first_approved');
  const approved    = todayReqs.filter(r => r.status==='approved');
  const denied      = todayReqs.filter(r => r.status==='denied');

  const statusChip = (r) => {
    if(r.status==='approved')    return {label:'✅ Approved', color:'#4ade80', bg:'rgba(74,222,128,0.12)'};
    if(r.status==='denied')      return {label:'❌ Denied',   color:'#f87171', bg:'rgba(239,68,68,0.12)'};
    if(r.status==='first_approved') return {label:`⏳ ${r.firstApprovalBy} approved`, color:'#fbbf24', bg:'rgba(251,191,36,0.12)'};
    return {label:'⏳ Pending', color:'rgba(255,255,255,0.5)', bg:'rgba(255,255,255,0.06)'};
  };

  return(
    <div style={{marginTop: isParent ? 16 : 24}}>
      <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:14,color:'rgba(255,255,255,0.6)',marginBottom:12,letterSpacing:0.5,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>📅 TODAY&apos;S REWARD QUEUE</span>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontWeight:400}}>resets tomorrow</span>
      </div>
      {todayReqs.map(r => {
        const chip = statusChip(r);
        const isIsa = r.user==='isabella';
        const userName = isIsa ? '🌸 Isabella' : '🕷️ Jossy';
        return(
          <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'10px 14px',marginBottom:8}}>
            <span style={{fontSize:24,flexShrink:0}}>{r.rewardEmoji}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.rewardTitle}</div>
              {isParent && <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:1}}>{userName} · 🌟 {r.stars} stars</div>}
              {r.note && r.status==='denied' && <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,150,150,0.7)',fontStyle:'italic',marginTop:2}}>"{r.note}"</div>}
            </div>
            <div style={{background:chip.bg,borderRadius:20,padding:'3px 10px',color:chip.color,fontSize:11,fontWeight:700,fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',flexShrink:0}}>{chip.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityLog({activity}) {
  if(!activity||activity.length===0) return(
    <div style={{textAlign:'center',padding:'60px 20px'}}>
      <div style={{fontSize:48,marginBottom:12}}>📋</div>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:16,fontWeight:600}}>No activity yet!</div>
      <div style={{color:'rgba(255,255,255,0.3)',fontSize:13,marginTop:6}}>Approved and denied rewards will show up here.</div>
    </div>
  );
  const timeAgo=(ts)=>{
    const mins=Math.round((Date.now()-new Date(ts))/60000);
    if(mins<1)return'just now';if(mins<60)return`${mins}m ago`;
    const hrs=Math.round(mins/60);if(hrs<24)return`${hrs}h ago`;
    return`${Math.round(hrs/24)}d ago`;
  };
  return(
    <div>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>📋 Activity Log</h2>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:20}}>Recent reward decisions</p>
      {activity.slice(0,30).map(item=>{
        const isApproved=item.type==='approved';
        const isIsa=item.user==='isabella';
        const userColor=isIsa?'#f107a3':'#e91e63';
        const userName=isIsa?'Isabella':'Jossy';
        return(
          <div key={item.id} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${isApproved?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:16,padding:'14px 16px',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:item.note?8:0}}>
              <span style={{fontSize:24}}>{item.rewardEmoji}</span>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <span style={{fontWeight:700,color:isApproved?'#4ade80':'#f87171',fontSize:14}}>{isApproved?'✅ Approved':'❌ Denied'}</span>
                  <span style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>·</span>
                  <span style={{fontWeight:600,color:'white',fontSize:14}}>{item.rewardTitle}</span>
                  <span style={{color:'rgba(255,255,255,0.5)',fontSize:13}}>for</span>
                  <span style={{color:userColor,fontWeight:600,fontSize:13}}>{userName}</span>
                </div>
                <div style={{color:'rgba(255,255,255,0.35)',fontSize:11,marginTop:2}}>
                  by {item.by} · {timeAgo(item.timestamp)} · 🌟 {item.stars} stars
                </div>
              </div>
            </div>
            {item.note&&(
              <div style={{background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'8px 12px',fontSize:13,color:'rgba(255,255,255,0.7)',fontStyle:'italic'}}>
                &ldquo;{item.note}&rdquo;
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   MANAGE REWARDS  (parent view)
══════════════════════════════════════════ */
function ManageRewards({rewards,saveRewards}) {
  const [newReward,setNewReward]=useState({title:'',emoji:'🎁',stars:100});
  const [showEmoji,setShowEmoji]=useState(false);

  const add=()=>{
    if(!newReward.title.trim()||!newReward.stars)return;
    saveRewards([...rewards,{id:uid(),...newReward}]);
    setNewReward({title:'',emoji:'🎁',stars:100});
    setShowEmoji(false);
  };
  const del=(id)=>saveRewards(rewards.filter(r=>r.id!==id));

  return(
    <div>
      <h2 style={{fontWeight:800,fontSize:20,marginBottom:6}}>🛍️ Reward Store</h2>
      <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:20}}>Add, remove, or adjust rewards the girls can redeem</p>

      {/* Add new reward */}
      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:18,padding:18,marginBottom:24,border:'1px solid rgba(99,179,237,0.3)'}}>
        <div style={{fontWeight:700,marginBottom:12,color:'#60a5fa'}}>+ Add New Reward</div>
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <button onClick={()=>setShowEmoji(!showEmoji)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,padding:'8px 12px',fontSize:22,cursor:'pointer'}}>{newReward.emoji}</button>
          <input placeholder="Reward name…" value={newReward.title} onChange={e=>setNewReward(p=>({...p,title:e.target.value}))} style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:10,padding:'8px 12px',color:'white',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
        </div>
        {showEmoji&&<div style={{background:'rgba(0,0,0,0.3)',borderRadius:12,padding:10,marginBottom:10,display:'flex',flexWrap:'wrap',gap:8}}>{['🍦','📱','🚗','🎨','💵','🍕','🎮','🛍️','🎁','🌮','🍿','💅','🎭','🏊','🎤','🛒','🍰','✈️','🎪','🎯'].map(e=><span key={e} onClick={()=>{setNewReward(p=>({...p,emoji:e}));setShowEmoji(false);}} style={{fontSize:22,cursor:'pointer'}}>{e}</span>)}</div>}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <span style={{color:'rgba(255,255,255,0.55)',fontSize:13}}>🌟 Stars required:</span>
          <input type="number" value={newReward.stars} onChange={e=>setNewReward(p=>({...p,stars:parseInt(e.target.value)||0}))} style={{width:80,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.13)',borderRadius:8,padding:'6px 10px',color:'white',fontSize:14,fontFamily:'inherit',outline:'none'}}/>
        </div>
        <button onClick={add} style={{width:'100%',background:'#2563eb',border:'none',borderRadius:12,padding:'10px',color:'white',fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>Add Reward</button>
      </div>

      {/* Existing rewards */}
      {rewards.map(r=>(
        <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'12px 16px',marginBottom:8}}>
          <span style={{fontSize:28}}>{r.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:15,color:'white'}}>{r.title}</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,marginTop:2}}>🌟 {r.stars} stars</div>
          </div>
          <button onClick={()=>del(r.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'6px 10px',color:'#f87171',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>✕</button>
        </div>
      ))}
    </div>
  );
}
function KidStore({rewards,rewardReqs,bal,alltime,dailyEarned,isIsa,onRequest}) {
  const accentColor=isIsa?'#f107a3':'#e91e63';
  const doneGradient=isIsa?'linear-gradient(135deg,#f107a3,#7b2ff7)':'linear-gradient(135deg,#8b0000,#e91e63)';
  const starColor=isIsa?'#ffd700':'#ff9dbe';
  const ff=isIsa?"'Fredoka One','Nunito',sans-serif":"'Poppins','Nunito',sans-serif";

  return(
    <div style={{padding:'16px 20px 100px',position:'relative',zIndex:2}}>
      {/* Star breakdown */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <div style={{flex:1,background:`${accentColor}14`,border:`1px solid ${accentColor}40`,borderRadius:14,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:26,color:starColor}}>{bal}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>🌟 Balance</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:26,color:'#c084fc'}}>{dailyEarned||0}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>⭐ Today</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'12px 8px',textAlign:'center'}}>
          <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:26,color:'#94a3b8'}}>{alltime||0}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>🏆 All Time</div>
        </div>
      </div>

      <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:16,color:'rgba(255,255,255,0.8)',marginBottom:14}}>✨ Available Rewards</div>

      {rewards.map(reward=>{
        const canAfford=bal>=reward.stars;
        const alreadyRequested=rewardReqs.some(r=>r.rewardId===reward.id&&(!r.status||r.status==='pending'));
        const pct=Math.min(100,Math.round(bal/reward.stars*100));
        return(
          <div key={reward.id} style={{background:alreadyRequested?'rgba(99,179,237,0.1)':canAfford?`${accentColor}14`:'rgba(255,255,255,0.04)',border:`1.5px solid ${alreadyRequested?'rgba(99,179,237,0.35)':canAfford?`${accentColor}50`:'rgba(255,255,255,0.08)'}`,borderRadius:18,padding:'14px 16px',marginBottom:10,transition:'all 0.2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:canAfford?0:8}}>
              <span style={{fontSize:32}}>{reward.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:15,color:'white'}}>{reward.title}</div>
                <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:2}}>🌟 {reward.stars} stars</div>
              </div>
              {alreadyRequested
                ? <div style={{background:'rgba(99,179,237,0.2)',borderRadius:12,padding:'6px 12px',color:'#60a5fa',fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:12}}>⏳ Requested!</div>
                : <button onClick={canAfford?()=>onRequest(reward):undefined} disabled={!canAfford}
                    style={{background:canAfford?doneGradient:'rgba(255,255,255,0.08)',border:'none',borderRadius:12,padding:'8px 14px',color:'white',fontWeight:700,cursor:canAfford?'pointer':'default',fontSize:13,fontFamily:"'Nunito',sans-serif",opacity:canAfford?1:0.45,boxShadow:canAfford?`0 4px 12px ${accentColor}40`:'none',flexShrink:0}}>
                    {canAfford?'Redeem ✨':'🔒'}
                  </button>
              }
            </div>
            {!canAfford&&!alreadyRequested&&(
              <div style={{marginTop:6}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)'}}>Progress to reward</span>
                  <span style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:'rgba(255,255,255,0.35)'}}>{bal}/{reward.stars} 🌟</span>
                </div>
                <div style={{background:'rgba(255,255,255,0.1)',borderRadius:100,height:6,overflow:'hidden'}}>
                  <div style={{background:accentColor,width:`${pct}%`,height:'100%',borderRadius:100,transition:'width 0.5s ease',opacity:0.7}}/>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Recent decisions from parents */}
      {(()=>{
        const resolved=rewardReqs.filter(r=>r.status&&r.status!=='pending').slice(0,5);
        if(resolved.length===0)return null;
        return(
          <div style={{marginTop:24}}>
            <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:14,color:'rgba(255,255,255,0.5)',marginBottom:12,letterSpacing:0.5}}>📬 RECENT DECISIONS</div>
            {resolved.map(r=>(
              <div key={r.id} style={{background:r.status==='approved'?'rgba(74,222,128,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${r.status==='approved'?'rgba(74,222,128,0.25)':'rgba(239,68,68,0.25)'}`,borderRadius:14,padding:'12px 14px',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:r.note?6:0}}>
                  <span style={{fontSize:22}}>{r.rewardEmoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:13,color:'white'}}>{r.rewardTitle}</div>
                    <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,color:r.status==='approved'?'#4ade80':'#f87171',marginTop:1}}>
                      {r.status==='approved'?'✅ Approved':'❌ Denied'} by {r.resolvedBy}
                    </div>
                  </div>
                </div>
                {r.note&&<div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:'rgba(255,255,255,0.65)',fontStyle:'italic',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'6px 10px'}}>&ldquo;{r.note}&rdquo;</div>}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
