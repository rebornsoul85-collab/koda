import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────
   SUPABASE SETUP
   These values come from your .env file.
   Get them from: Supabase Dashboard → Project
   Settings → API
───────────────────────────────────────────── */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ─────────────────────────────────────────────
   STORAGE HELPERS  (Supabase)
   Uses a simple key/value table called
   "choremap_store". See README for the one-line
   SQL to create it.
───────────────────────────────────────────── */
const S = {
  async get(k) {
    try {
      const { data } = await supabase
        .from("choremap_store")
        .select("value")
        .eq("key", k)
        .maybeSingle();
      return data?.value ?? null;
    } catch { return null; }
  },
  async set(k, v) {
    try {
      await supabase
        .from("choremap_store")
        .upsert({ key: k, value: v }, { onConflict: "key" });
    } catch {}
  },
};

/* ─────────────────────────────────────────────
   HELPERS & CONSTANTS
───────────────────────────────────────────── */
const TODAY = () => new Date().toISOString().slice(0, 10);
const uid   = () => Math.random().toString(36).slice(2, 9);
const EMOJIS = ['🪥','🛏️','🧹','🗑️','👗','📚','🍽️','🚿','🐕','🌿','💪','✏️','🎒','🧺','🍎',
  '⭐','🎯','🎨','🎮','🍳','🌸','🌟','🎀','🦋','🐱','🦊','🌈','🏃','🪴','💅','🕷️','🫧'];

const DEFAULT = {
  pins: { parent: '1234', isabella: '1111', jocelyn: '2222' },
  tasks: {
    isabella: [
      { id: 'ib1', title: 'Brush teeth',               emoji: '🪥', recurring: true, minutes: 10 },
      { id: 'ib2', title: 'Make your bed',              emoji: '🛏️', recurring: true, minutes: 10 },
      { id: 'ib3', title: 'Clean your room',            emoji: '🧹', recurring: true, minutes: 15 },
      { id: 'ib4', title: 'Take out bedroom trash',     emoji: '🗑️', recurring: true, minutes: 10 },
      { id: 'ib5', title: 'Lay out clothes for tomorrow', emoji: '👗', recurring: true, minutes: 10 },
    ],
    jocelyn: [
      { id: 'jc1', title: 'Brush teeth',               emoji: '🪥', recurring: true, minutes: 10 },
      { id: 'jc2', title: 'Make your bed',              emoji: '🛏️', recurring: true, minutes: 10 },
      { id: 'jc3', title: 'Clean your room',            emoji: '🧹', recurring: true, minutes: 15 },
      { id: 'jc4', title: 'Take out bedroom trash',     emoji: '🗑️', recurring: true, minutes: 10 },
      { id: 'jc5', title: 'Lay out clothes for tomorrow', emoji: '👗', recurring: true, minutes: 10 },
    ],
  },
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes twinkle   { 0%,100%{opacity:.2} 50%{opacity:.9} }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes popIn     { 0%{transform:scale(0)} 65%{transform:scale(1.2)} 100%{transform:scale(1)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-9px)} 75%{transform:translateX(9px)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes sakura    { 0%{transform:translateY(-30px) rotate(0deg);opacity:.9} 100%{transform:translateY(105vh) rotate(400deg);opacity:0} }
  @keyframes pulse     { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.04)} }
  @keyframes webDrift  { 0%,100%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(3deg) scale(1.02)} }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
`;

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [view,      setView]      = useState('landing');
  const [pinTarget, setPinTarget] = useState(null);
  const [config,    setConfig]    = useState(null);
  const [comp,      setComp]      = useState({ isabella: [], jocelyn: [] });
  const [bal,       setBal]       = useState({ isabella: 0, jocelyn: 0 });
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // Inject Google Fonts
    if (!document.getElementById('choremap-fonts')) {
      const l = document.createElement('link');
      l.id = 'choremap-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Poppins:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(l);
    }
    if (!document.getElementById('choremap-css')) {
      const s = document.createElement('style');
      s.id = 'choremap-css'; s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    const raw = await S.get('cm-config');
    const cfg = raw ? JSON.parse(raw) : DEFAULT;
    setConfig(cfg);
    const today = TODAY();
    const [ib, jc, ibB, jcB] = await Promise.all([
      S.get(`cm-c-isabella-${today}`),
      S.get(`cm-c-jocelyn-${today}`),
      S.get('cm-b-isabella'),
      S.get('cm-b-jocelyn'),
    ]);
    setComp({ isabella: ib ? JSON.parse(ib) : [], jocelyn: jc ? JSON.parse(jc) : [] });
    setBal({ isabella: ibB ? parseInt(ibB) : 0, jocelyn: jcB ? parseInt(jcB) : 0 });
    setLoading(false);
  };

  const saveConfig = async (c) => { setConfig(c); await S.set('cm-config', JSON.stringify(c)); };

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

  const redeem = async (user, mins) => {
    const newBal = Math.max(0, bal[user] - mins);
    setBal(p => ({ ...p, [user]: newBal }));
    await S.set(`cm-b-${user}`, String(newBal));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0d2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontFamily: 'sans-serif', fontSize: 20 }}>🌟 Loading Koda…</div>
    </div>
  );

  if (view === 'landing')   return <Landing onSelect={t => { setPinTarget(t); setView('pin'); }} />;
  if (view === 'pin')       return <PinScreen target={pinTarget} config={config} onSuccess={() => setView(pinTarget)} onBack={() => setView('landing')} />;
  if (view === 'parent')    return <ParentView config={config} saveConfig={saveConfig} comp={comp} bal={bal} redeem={redeem} logout={() => setView('landing')} />;
  if (view === 'isabella')  return <IsabellaView tasks={config.tasks.isabella} comp={comp.isabella} toggle={id => toggleTask('isabella', id)} bal={bal.isabella} logout={() => setView('landing')} />;
  if (view === 'jocelyn')   return <JossyView tasks={config.tasks.jocelyn} comp={comp.jocelyn} toggle={id => toggleTask('jocelyn', id)} bal={bal.jocelyn} logout={() => setView('landing')} />;
  return null;
}

/* ═══════════════════════════════════════════
   LANDING SCREEN
═══════════════════════════════════════════ */
function Landing({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0d0d2b 0%, #1a0533 60%, #0d1a2b 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Nunito', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <Stars />
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 64, marginBottom: 4, filter: 'drop-shadow(0 0 24px rgba(255,220,80,0.8))' }}>🌟</div>
        <h1 style={{ color: 'white', fontSize: 38, fontWeight: 900, margin: '0 0 6px', letterSpacing: -1, fontFamily: "'Fredoka One', sans-serif" }}>Koda</h1>
        <p style={{ color: 'rgba(255,220,80,0.7)', fontSize: 13, margin: 0, letterSpacing: 1 }}>Do the thing. Earn the stars. ✨</p>
      </div>
      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        <LandingCard emoji="👨‍👩‍👧‍👦" name="Parent" sub="Manage tasks & rewards"
          bg="linear-gradient(135deg, #1e3a5f, #243b80)"
          border="rgba(99,179,237,0.35)" glow="rgba(59,130,246,0.25)"
          onClick={() => onSelect('parent')} />
        <LandingCard emoji="🌸" name="Isabella" sub="✨ Check your kawaii quests!"
          bg="linear-gradient(135deg, #7b2ff7, #f107a3)"
          border="rgba(255,182,213,0.5)" glow="rgba(241,7,163,0.3)"
          badge="アニメ"
          onClick={() => onSelect('isabella')} />
        <LandingCard emoji="🕷️" name="Jossy" sub="Your web of tasks awaits 💅"
          bg="linear-gradient(135deg, #8b0000, #e91e63)"
          border="rgba(255,100,150,0.4)" glow="rgba(220,0,50,0.3)"
          webDeco
          onClick={() => onSelect('jocelyn')} />
      </div>
      <div style={{ marginTop: 20, padding: '8px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.3)', fontSize: 11, position: 'relative', zIndex: 1, textAlign: 'center' }}>
        🌟 Koda &nbsp;·&nbsp; Default PINs: Parent 1234 &nbsp;·&nbsp; Isabella 1111 &nbsp;·&nbsp; Jossy 2222
      </div>
    </div>
  );
}

function Stars() {
  const stars = Array.from({ length: 36 }, (_, i) => ({
    x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100,
    size: 1 + (i % 3), delay: (i * 0.4) % 4, dur: 2 + (i % 3),
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: 'white', animation: `twinkle ${s.dur}s ${s.delay}s infinite` }} />
      ))}
    </div>
  );
}

function LandingCard({ emoji, name, sub, bg, border, glow, badge, webDeco, onClick }) {
  const [hov, setHov] = useState(false);
  const webPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg stroke='rgba(255,255,255,0.18)' fill='none' stroke-width='0.7'%3E%3Ccircle cx='60' cy='60' r='15'/%3E%3Ccircle cx='60' cy='60' r='35'/%3E%3Ccircle cx='60' cy='60' r='55'/%3E%3Cline x1='60' y1='5' x2='60' y2='115'/%3E%3Cline x1='5' y1='60' x2='115' y2='60'/%3E%3Cline x1='18' y1='18' x2='102' y2='102'/%3E%3Cline x1='102' y1='18' x2='18' y2='102'/%3E%3C/g%3E%3C/svg%3E")`;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 22, padding: '18px 22px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden', boxShadow: hov ? `0 12px 44px ${glow}` : `0 4px 22px rgba(0,0,0,0.45)`, transform: hov ? 'translateY(-3px) scale(1.01)' : 'none', transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)' }}>
      {webDeco && <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, backgroundImage: webPattern, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', animation: 'webDrift 6s ease infinite' }} />}
      <div style={{ fontSize: 36, animation: hov ? 'float 1.5s ease infinite' : 'none', flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 800, fontSize: 20 }}>
          {name}
          {badge && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.25)', borderRadius: 6, padding: '2px 8px', fontWeight: 700, letterSpacing: 1 }}>{badge}</span>}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 24, fontWeight: 300 }}>›</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PIN SCREEN
═══════════════════════════════════════════ */
function PinScreen({ target, config, onSuccess, onBack }) {
  const [digits, setDigits] = useState([]);
  const [err,    setErr]    = useState(false);
  const [shake,  setShake]  = useState(false);

  const COLOR = { parent: '#3b82f6', isabella: '#f107a3', jocelyn: '#e91e63' };
  const NAME  = { parent: 'Parent',  isabella: 'Isabella', jocelyn: 'Jossy' };
  const ICON  = { parent: '🔐',      isabella: '🌸',        jocelyn: '🕷️' };
  const color = COLOR[target];

  const addDigit = d => {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next.join('') === config.pins[target]) { onSuccess(); }
        else {
          setErr(true); setShake(true);
          setTimeout(() => { setDigits([]); setErr(false); setShake(false); }, 700);
        }
      }, 150);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0d2b, #1a0533)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Nunito', sans-serif", position: 'relative' }}>
      <Stars />
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 16px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>← Back</button>
      <div style={{ textAlign: 'center', marginBottom: 44, zIndex: 1 }}>
        <div style={{ fontSize: 54, marginBottom: 10 }}>{ICON[target]}</div>
        <h2 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>{NAME[target]}</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Enter your PIN to continue</p>
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 44, zIndex: 1, animation: shake ? 'shake 0.5s ease' : 'none' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: i < digits.length ? color : 'rgba(255,255,255,0.15)', border: `2px solid ${i < digits.length ? color : 'rgba(255,255,255,0.3)'}`, boxShadow: i < digits.length ? `0 0 16px ${color}` : 'none', transition: 'all 0.2s ease' }} />
        ))}
      </div>
      {err && <div style={{ color: '#f87171', fontSize: 14, marginBottom: 16, zIndex: 1 }}>Wrong PIN — try again!</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, width: '100%', maxWidth: 270, zIndex: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
          <button key={i}
            onClick={() => d === '⌫' ? setDigits(p => p.slice(0, -1)) : d !== '' ? addDigit(String(d)) : null}
            disabled={d === ''}
            style={{ height: 64, background: d === '' ? 'transparent' : d === '⌫' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.1)', border: d === '' ? 'none' : '1px solid rgba(255,255,255,0.15)', borderRadius: 16, color: 'white', fontSize: d === '⌫' ? 22 : 24, fontWeight: 700, cursor: d === '' ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PARENT DASHBOARD
═══════════════════════════════════════════ */
function ParentView({ config, saveConfig, comp, bal, redeem, logout }) {
  const [tab,       setTab]       = useState('overview');
  const [addFor,    setAddFor]    = useState(null);
  const [newTask,   setNewTask]   = useState({ title: '', emoji: '⭐', recurring: true, minutes: 15 });
  const [showEmoji, setShowEmoji] = useState(false);
  const [redeemAmt, setRedeemAmt] = useState({ isabella: '', jocelyn: '' });
  const [newPins,   setNewPins]   = useState({ parent: '', isabella: '', jocelyn: '' });
  const [savedMsg,  setSavedMsg]  = useState('');

  const addTask = user => {
    if (!newTask.title.trim()) return;
    const t = { id: uid(), ...newTask };
    saveConfig({ ...config, tasks: { ...config.tasks, [user]: [...config.tasks[user], t] } });
    setNewTask({ title: '', emoji: '⭐', recurring: true, minutes: 15 });
    setAddFor(null); setShowEmoji(false);
  };

  const delTask = (user, id) =>
    saveConfig({ ...config, tasks: { ...config.tasks, [user]: config.tasks[user].filter(t => t.id !== id) } });

  const doRedeem = user => {
    const m = parseInt(redeemAmt[user]);
    if (!m || m <= 0) return;
    redeem(user, m);
    setRedeemAmt(p => ({ ...p, [user]: '' }));
  };

  const savePins = () => {
    saveConfig({ ...config, pins: { parent: newPins.parent || config.pins.parent, isabella: newPins.isabella || config.pins.isabella, jocelyn: newPins.jocelyn || config.pins.jocelyn } });
    setNewPins({ parent: '', isabella: '', jocelyn: '' });
    setSavedMsg('✅ PINs saved!');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const TABS = [
    { id: 'overview', label: '🏠', title: 'Overview' },
    { id: 'isabella', label: '🌸', title: 'Isabella' },
    { id: 'jocelyn',  label: '🕷️', title: 'Jossy' },
    { id: 'rewards',  label: '🏆', title: 'Rewards' },
    { id: 'settings', label: '⚙️', title: 'Settings' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', fontFamily: "'Nunito', sans-serif", color: 'white' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f2a4a, #1a3a6e)', padding: '20px 20px 0', borderBottom: '1px solid rgba(99,179,237,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>🌟 Koda</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Parent · Mission Control</div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Sign Out</button>
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'transparent', border: 'none', borderBottom: `3px solid ${tab === t.id ? '#60a5fa' : 'transparent'}`, padding: '8px 14px 12px', color: tab === t.id ? 'white' : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>{t.label} {t.title}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: 560, margin: '0 auto' }}>

        {tab === 'overview' && <>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>📊 Today&apos;s Overview</h2>
          {['isabella', 'jocelyn'].map(u => {
            const tasks = config.tasks[u];
            const done  = comp[u].length;
            const total = tasks.length;
            const pct   = total > 0 ? Math.round(done / total * 100) : 0;
            const color = u === 'isabella' ? '#f107a3' : '#e91e63';
            const name  = u === 'isabella' ? '🌸 Isabella' : '🕷️ Jossy';
            return (
              <div key={u} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 18, marginBottom: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{name}</span>
                  <span style={{ color, fontWeight: 700 }}>{done}/{total} tasks</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 10, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 100, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>🌟 {bal[u]} Koda stars banked</div>
              </div>
            );
          })}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🌟 How Koda works</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>
              Each completed task earns screen-time stars (minutes). Visit the <strong>Rewards</strong> tab to redeem them once you&apos;ve given real screen time. Use the <strong>Isabella</strong> / <strong>Jossy</strong> tabs to add or remove tasks anytime.
            </div>
          </div>
        </>}

        {(tab === 'isabella' || tab === 'jocelyn') && (
          <TaskTab user={tab} tasks={config.tasks[tab]} comp={comp[tab]} onAdd={() => setAddFor(tab)} onDel={id => delTask(tab, id)} addFor={addFor} newTask={newTask} setNewTask={setNewTask} showEmoji={showEmoji} setShowEmoji={setShowEmoji} onConfirm={() => addTask(tab)} onCancel={() => { setAddFor(null); setShowEmoji(false); }} />
        )}

        {tab === 'rewards' && <>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>🏆 Screen Time Rewards</h2>
          {['isabella', 'jocelyn'].map(u => {
            const color = u === 'isabella' ? '#f107a3' : '#e91e63';
            const name  = u === 'isabella' ? '🌸 Isabella' : '🕷️ Jossy';
            return (
              <div key={u} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 20, marginBottom: 16, border: `1px solid ${color}40` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{name}</span>
                  <span style={{ background: `${color}22`, borderRadius: 20, padding: '4px 14px', color, fontWeight: 700, fontSize: 14 }}>🌟 {bal[u]} stars banked</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 10 }}>Enter minutes given → Redeem to deduct from balance:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" placeholder="Minutes to redeem…" value={redeemAmt[u]}
                    onChange={e => setRedeemAmt(p => ({ ...p, [u]: e.target.value }))}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
                  <button onClick={() => doRedeem(u)} style={{ background: color, border: 'none', borderRadius: 10, padding: '8px 18px', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Redeem</button>
                </div>
              </div>
            );
          })}
        </>}

        {tab === 'settings' && <>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>⚙️ Change PINs</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Leave blank to keep the current PIN</p>
          {[{ key: 'parent', label: '👨‍👩‍👧 Parent' }, { key: 'isabella', label: '🌸 Isabella' }, { key: 'jocelyn', label: '🕷️ Jossy' }].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 6 }}>
                {label} <span style={{ color: 'rgba(255,255,255,0.25)' }}>— current: {config.pins[key]}</span>
              </label>
              <input type="tel" maxLength={4} placeholder="New 4-digit PIN" value={newPins[key]}
                onChange={e => setNewPins(p => ({ ...p, [key]: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 16, fontFamily: 'inherit', outline: 'none' }} />
            </div>
          ))}
          <button onClick={savePins} style={{ width: '100%', background: '#2563eb', border: 'none', borderRadius: 12, padding: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', marginTop: 8 }}>Save PINs</button>
          {savedMsg && <div style={{ color: '#4ade80', textAlign: 'center', marginTop: 10, fontWeight: 700 }}>{savedMsg}</div>}
        </>}
      </div>
    </div>
  );
}

function TaskTab({ user, tasks, comp, onAdd, onDel, addFor, newTask, setNewTask, showEmoji, setShowEmoji, onConfirm, onCancel }) {
  const color = user === 'isabella' ? '#f107a3' : '#e91e63';
  const name  = user === 'isabella' ? '🌸 Isabella' : '🕷️ Jossy';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>{name}&apos;s Tasks</h2>
        <button onClick={onAdd} style={{ background: color, border: 'none', borderRadius: 10, padding: '8px 16px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>+ Add Task</button>
      </div>
      {addFor === user && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 18, marginBottom: 16, border: `1px solid ${color}50` }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>New Task</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 22, cursor: 'pointer' }}>{newTask.emoji}</button>
            <input placeholder="Task name…" value={newTask.title}
              onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          {showEmoji && (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 10, marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map(e => <span key={e} onClick={() => { setNewTask(p => ({ ...p, emoji: e })); setShowEmoji(false); }} style={{ fontSize: 22, cursor: 'pointer' }}>{e}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>⏱ Screen time minutes:</span>
            <input type="number" value={newTask.minutes}
              onChange={e => setNewTask(p => ({ ...p, minutes: parseInt(e.target.value) || 0 }))}
              style={{ width: 64, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>🔄 Recurring daily:</span>
            <Toggle on={newTask.recurring} color={color} onChange={() => setNewTask(p => ({ ...p, recurring: !p.recurring }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onConfirm} style={{ flex: 1, background: color, border: 'none', borderRadius: 10, padding: 10, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add Task</button>
            <button onClick={onCancel} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, padding: 10, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}
      {tasks.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 48 }}>No tasks yet — add one above!</div>}
      {tasks.map(task => {
        const done = comp.includes(task.id);
        return (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: done ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '13px 16px', marginBottom: 8 }}>
            <div style={{ fontSize: 22 }}>{task.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, textDecoration: done ? 'line-through' : 'none', color: done ? 'rgba(255,255,255,0.3)' : 'white' }}>{task.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.33)', fontSize: 12, marginTop: 2 }}>{task.recurring ? '🔄 Daily' : '📌 One-time'} · ⏱ {task.minutes} min{done ? ' · ✅ Done today' : ''}</div>
            </div>
            <button onClick={() => onDel(task.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '4px 10px', color: '#f87171', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ on, color, onChange }) {
  return (
    <div onClick={onChange} style={{ width: 44, height: 24, background: on ? color : 'rgba(255,255,255,0.15)', borderRadius: 100, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ISABELLA VIEW — Kawaii / Anime 🌸
═══════════════════════════════════════════ */
function IsabellaView({ tasks, comp, toggle, bal, logout }) {
  const done    = comp.length;
  const total   = tasks.length;
  const pct     = total > 0 ? Math.round(done / total * 100) : 0;
  const allDone = done === total && total > 0;
  const msg = done === 0 ? "Let's go, Isabella! がんばって！ 🌸"
    : done === total ? "ALL DONE! すごい！ You're amazing! 🎉"
    : done <= 1 ? `Great start! ${done} done ✨`
    : `${done} of ${total} done — keep going! 💫`;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #12003a 0%, #2d0068 50%, #12003a 100%)', fontFamily: "'Fredoka One', 'Nunito', sans-serif", color: 'white', position: 'relative', overflow: 'hidden' }}>
      <SakuraDecor />
      <div style={{ background: 'rgba(241,7,163,0.12)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,182,213,0.25)', padding: '20px 20px 16px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 26, letterSpacing: 0.5 }}>🌟 Isabella&apos;s Quest!</div>
            <div style={{ color: 'rgba(255,182,213,0.65)', fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>Koda says: がんばって！· {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(241,7,163,0.15)', border: '1px solid rgba(255,182,213,0.3)', borderRadius: 12, padding: '6px 14px', color: 'rgba(255,182,213,0.85)', cursor: 'pointer', fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Exit</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,210,230,0.9)', fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{msg}</span>
            <span style={{ fontWeight: 700, color: '#ffd700', fontFamily: "'Nunito', sans-serif" }}>{pct}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, height: 12, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #ff6eb4, #c44dff, #ffd700)', width: `${pct}%`, height: '100%', borderRadius: 100, transition: 'width 0.7s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 0 18px rgba(255,110,180,0.7)' }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 20px 4px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 20, padding: '6px 16px' }}>
          <span style={{ fontSize: 18 }}>🌟</span>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#ffd700', fontSize: 14 }}>{bal} Koda stars earned!</span>
        </div>
      </div>
      <div style={{ padding: '4px 20px 4px', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,182,213,0.4)', fontFamily: "'Nunito', sans-serif", letterSpacing: 2 }}>✦ 今日のタスク · Today&apos;s Tasks ✦</div>
      </div>
      <div style={{ padding: '8px 20px 100px', position: 'relative', zIndex: 2 }}>
        {tasks.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,182,213,0.4)', fontFamily: "'Nunito', sans-serif" }}>No tasks yet! Ask a parent to add some 🌸</div>}
        {tasks.map((task, i) => <KawaiiTask key={task.id} task={task} done={comp.includes(task.id)} onToggle={() => toggle(task.id)} delay={i * 70} />)}
      </div>
      {allDone && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f107a3, #7b2ff7)', borderRadius: 22, padding: '18px 32px', textAlign: 'center', zIndex: 10, boxShadow: '0 8px 44px rgba(241,7,163,0.5)', animation: 'pulse 2s ease infinite', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 30, marginBottom: 4 }}>🎉✨🌸</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>All Done!</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Koda is SO proud of you! すごい！ 🌟</div>
        </div>
      )}
    </div>
  );
}

function KawaiiTask({ task, done, onToggle, delay }) {
  const [pop, setPop] = useState(false);
  const handle = () => { if (!done) { setPop(true); setTimeout(() => setPop(false), 400); } onToggle(); };
  return (
    <div onClick={handle} style={{ display: 'flex', alignItems: 'center', gap: 14, background: done ? 'rgba(255,182,213,0.13)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${done ? 'rgba(255,182,213,0.4)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 18, padding: '14px 18px', marginBottom: 10, cursor: 'pointer', boxShadow: done ? '0 4px 20px rgba(241,7,163,0.12)' : 'none', transition: 'all 0.25s ease', animation: `fadeInUp 0.4s ${delay}ms both` }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: done ? 'linear-gradient(135deg, #f107a3, #7b2ff7)' : 'rgba(255,255,255,0.08)', border: `2px solid ${done ? 'transparent' : 'rgba(255,182,213,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: done ? '0 0 14px rgba(241,7,163,0.55)' : 'none', transition: 'all 0.25s ease', animation: pop ? 'popIn 0.35s ease' : 'none' }}>{done && <span style={{ fontSize: 16 }}>✨</span>}</div>
      <div style={{ fontSize: 26 }}>{task.emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: done ? 'line-through' : 'none', color: done ? 'rgba(255,255,255,0.35)' : 'white' }}>{task.title}</div>
        <div style={{ color: 'rgba(255,182,213,0.5)', fontSize: 12, marginTop: 2, fontFamily: "'Nunito', sans-serif" }}>{task.recurring ? '🔄 Every day' : '📌 Special task'} · ⭐ {task.minutes} min</div>
      </div>
      {done && <div style={{ fontSize: 20, animation: 'float 2s ease infinite' }}>🌸</div>}
    </div>
  );
}

function SakuraDecor() {
  const items = [
    { x: 8,  delay: 0,   dur: 8,  size: 18, icon: '🌸' },
    { x: 22, delay: 1.5, dur: 10, size: 14, icon: '✨' },
    { x: 40, delay: 3,   dur: 7,  size: 16, icon: '⭐' },
    { x: 58, delay: 0.8, dur: 11, size: 12, icon: '🌸' },
    { x: 72, delay: 2.2, dur: 9,  size: 20, icon: '💫' },
    { x: 85, delay: 4,   dur: 8,  size: 14, icon: '🎀' },
    { x: 93, delay: 1,   dur: 12, size: 16, icon: '🌟' },
    { x: 15, delay: 5,   dur: 9,  size: 13, icon: '✨' },
    { x: 50, delay: 6,   dur: 10, size: 18, icon: '🌸' },
    { x: 66, delay: 3.5, dur: 7,  size: 15, icon: '🎀' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {items.map((item, i) => (
        <div key={i} style={{ position: 'absolute', left: `${item.x}%`, top: '-30px', fontSize: item.size, animation: `sakura ${item.dur}s ${item.delay}s infinite linear`, opacity: 0.65 }}>{item.icon}</div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   JOSSY VIEW — Girly Spider-Man 🕷️💅
═══════════════════════════════════════════ */
function JossyView({ tasks, comp, toggle, bal, logout }) {
  const done    = comp.length;
  const total   = tasks.length;
  const pct     = total > 0 ? Math.round(done / total * 100) : 0;
  const allDone = done === total && total > 0;
  const msg = done === 0 ? "Time to sling some tasks, girl 🕷️"
    : done === total ? "ALL TASKS DONE! Your friendly neighborhood champ 🏆"
    : done <= 1 ? `${done} down — your spider sense is tingling! 💅`
    : done < total * 0.6 ? "Halfway there! No villain's stopping you 💪"
    : "Almost done! With great power… 🕸️";

  const webBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg stroke='rgba(255,130,170,0.10)' fill='none' stroke-width='0.8'%3E%3Ccircle cx='110' cy='110' r='20'/%3E%3Ccircle cx='110' cy='110' r='45'/%3E%3Ccircle cx='110' cy='110' r='70'/%3E%3Ccircle cx='110' cy='110' r='96'/%3E%3Cline x1='110' y1='14' x2='110' y2='206'/%3E%3Cline x1='14' y1='110' x2='206' y2='110'/%3E%3Cline x1='42' y1='42' x2='178' y2='178'/%3E%3Cline x1='178' y1='42' x2='42' y2='178'/%3E%3Cline x1='14' y1='75' x2='206' y2='145'/%3E%3Cline x1='75' y1='14' x2='145' y2='206'/%3E%3Cline x1='206' y1='75' x2='14' y2='145'/%3E%3Cline x1='145' y1='14' x2='75' y2='206'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1a0010 0%, #3d0020 50%, #1a0010 100%)', backgroundImage: webBg, backgroundSize: '220px 220px', fontFamily: "'Poppins', 'Nunito', sans-serif", color: 'white', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(160deg, rgba(26,0,16,0.7) 0%, rgba(61,0,32,0.5) 50%, rgba(26,0,16,0.7) 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ background: 'rgba(200,0,50,0.18)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,100,150,0.25)', padding: '20px 20px 16px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>🕷️ Jossy&apos;s Web</div>
            <div style={{ color: 'rgba(255,182,193,0.55)', fontSize: 12, fontWeight: 500 }}>Koda says: go get it 🌟 · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(233,30,99,0.15)', border: '1px solid rgba(255,100,150,0.3)', borderRadius: 12, padding: '6px 14px', color: 'rgba(255,182,193,0.8)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Exit</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,182,193,0.8)', fontWeight: 600 }}>{msg}</span>
            <span style={{ fontWeight: 700, color: '#ff6b9d' }}>{pct}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 10, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #8b0000, #e91e63, #ff6b9d)', width: `${pct}%`, height: '100%', borderRadius: 100, transition: 'width 0.7s cubic-bezier(.34,1.56,.64,1)', boxShadow: '0 0 16px rgba(233,30,99,0.65)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ color: 'rgba(255,182,193,0.4)', fontSize: 11 }}>{done} of {total} complete</span>
            <span style={{ color: 'rgba(255,182,193,0.4)', fontSize: 11 }}>🕸️ 🕷️</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 20px 4px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(233,30,99,0.15)', border: '1px solid rgba(255,107,157,0.35)', borderRadius: 20, padding: '6px 16px' }}>
          <span style={{ fontSize: 16 }}>🌟</span>
          <span style={{ fontWeight: 700, color: '#ff9dbe', fontSize: 14 }}>{bal} Koda stars earned 💅</span>
        </div>
      </div>
      <div style={{ padding: '10px 20px 100px', position: 'relative', zIndex: 2 }}>
        {tasks.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,182,193,0.35)' }}>No tasks yet! Ask a parent to add some 🕸️</div>}
        {tasks.map((task, i) => <SpideyTask key={task.id} task={task} done={comp.includes(task.id)} onToggle={() => toggle(task.id)} delay={i * 70} />)}
      </div>
      {allDone && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #8b0000, #e91e63, #ff6b9d)', borderRadius: 22, padding: '18px 32px', textAlign: 'center', zIndex: 10, boxShadow: '0 8px 44px rgba(220,0,50,0.55)', animation: 'pulse 2s ease infinite', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 30, marginBottom: 4 }}>🕷️ 💅 🏆</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>ALL DONE, JOSSY!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Koda thinks you&apos;re a total star 🌟</div>
        </div>
      )}
    </div>
  );
}

function SpideyTask({ task, done, onToggle, delay }) {
  const [pop, setPop] = useState(false);
  const handle = () => { if (!done) { setPop(true); setTimeout(() => setPop(false), 400); } onToggle(); };
  return (
    <div onClick={handle} style={{ display: 'flex', alignItems: 'center', gap: 14, background: done ? 'rgba(233,30,99,0.14)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${done ? 'rgba(255,107,157,0.4)' : 'rgba(255,100,150,0.1)'}`, borderRadius: 16, padding: '14px 18px', marginBottom: 10, cursor: 'pointer', boxShadow: done ? '0 4px 22px rgba(220,0,50,0.14)' : 'none', transition: 'all 0.25s ease', animation: `fadeInUp 0.4s ${delay}ms both` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: done ? 'linear-gradient(135deg, #8b0000, #e91e63)' : 'rgba(255,255,255,0.07)', border: `2px solid ${done ? 'transparent' : 'rgba(255,100,150,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: done ? '0 0 16px rgba(233,30,99,0.6)' : 'none', transition: 'all 0.25s ease', animation: pop ? 'popIn 0.35s ease' : 'none' }}>
        {done ? <span style={{ fontSize: 16 }}>🕷️</span> : <span style={{ color: 'rgba(255,100,150,0.35)', fontSize: 12 }}>○</span>}
      </div>
      <div style={{ fontSize: 24 }}>{task.emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, textDecoration: done ? 'line-through' : 'none', color: done ? 'rgba(255,255,255,0.3)' : 'white' }}>{task.title}</div>
        <div style={{ color: 'rgba(255,182,193,0.45)', fontSize: 12, marginTop: 2 }}>{task.recurring ? '🔄 Daily' : '📌 One-time'} · 🕸️ {task.minutes} min</div>
      </div>
      {done && <div style={{ fontSize: 18, animation: 'float 2s ease infinite' }}>💅</div>}
    </div>
  );
}
