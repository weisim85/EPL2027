import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ============================================================
// BUILD VERSION — bump to bust PWA cache on deploy
// ============================================================
const BUILD_VERSION = "epl2027-v1.2";

// ============================================================
// MAN CITY COLOR THEME
// ============================================================
const C = {
  bg:     "#070e1a",
  card:   "#0c1826",
  sky:    "#6cabdd",
  gold:   "#f59e0b",
  green:  "#10b981",
  red:    "#ef4444",
  muted:  "#64748b",
  border: "#1a2d42",
  text:   "#f0f8ff",
  sub:    "#93c5fd",
  accent: "#38bdf8",
  purple: "#7c3aed",
};

const ST = {
  container: { background: C.bg, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: C.text },
  topbar: { position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", gap: 12, height: 52, padding: "0 14px", background: "#050c16", borderBottom: `1px solid ${C.border}` },
  burger: { background: "#0f1e30", color: C.sky, border: `1px solid ${C.border}`, borderRadius: 8, width: 38, height: 38, fontSize: 18, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  topbarTitle: { fontSize: 15, fontWeight: 800, color: C.text, display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 },
  topbarSub: { color: C.sub, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  shell: { display: "flex", alignItems: "flex-start", minHeight: "calc(100dvh - 52px)" },
  overlay: { position: "fixed", inset: "52px 0 0 0", background: "rgba(0,0,0,0.6)", zIndex: 44 },
  sidebar: (open, mobile) => {
    const base = { width: 232, flexShrink: 0, background: "#0a1520", borderRight: `1px solid ${C.border}`, overflowY: "auto", flexDirection: "column", padding: "14px 0", boxSizing: "border-box" };
    if (mobile) return { ...base, position: "fixed", top: 52, left: 0, height: "calc(100dvh - 52px)", display: "flex", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.22s ease", zIndex: 45 };
    return { ...base, position: "sticky", top: 52, alignSelf: "flex-start", height: "calc(100dvh - 52px)", display: open ? "flex" : "none" };
  },
  sideBrand: { padding: "2px 18px 14px", borderBottom: `1px solid ${C.border}`, marginBottom: 8 },
  sideTitle: { fontSize: 18, fontWeight: 900, background: `linear-gradient(90deg,${C.sky},#ffffff,${C.sky})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px", lineHeight: 1.2 },
  sideSub: { color: C.muted, fontSize: 10, marginTop: 3 },
  sideNav: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  sideBtn: (active) => ({ display: "flex", alignItems: "center", gap: 12, width: "calc(100% - 16px)", margin: "1px 8px", padding: "11px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, textAlign: "left", background: active ? C.sky : "transparent", color: active ? "#06121f" : C.sub, transition: "all 0.15s" }),
  sideIcon: { fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 },
  sideFooter: { padding: "14px 18px 2px", fontSize: 10, color: C.muted, borderTop: `1px solid ${C.border}`, lineHeight: 1.6, whiteSpace: "pre-line" },
  content: { flex: 1, minWidth: 0 },
  card: { background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, marginBottom: 10 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { color: C.muted, textAlign: "left", padding: "4px 6px", fontWeight: 600, fontSize: 11 },
  td: { padding: "7px 6px", borderTop: `1px solid ${C.border}`, fontSize: 12 },
  input: { background: "#070e1a", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "9px 12px", fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box", appearance: "none" },
  btn: { background: C.sky, color: "#070e1a", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 800, cursor: "pointer", fontSize: 13, width: "100%", marginTop: 8 },
  lbl: { color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 5 },
  matchRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "#070e1a", marginBottom: 5, gap: 8 },
  score: (played) => ({ padding: "3px 10px", borderRadius: 6, background: played ? "#0e2040" : "#141428", color: played ? C.sky : C.muted, fontWeight: 700, fontSize: 13, minWidth: 48, textAlign: "center" }),
  loading: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 36, color: C.muted, fontSize: 13 },
};

// ============================================================
// EPL 2026/27 TEAM DATA
// ============================================================
const BADGE = {
  "Arsenal": "🔴", "Aston Villa": "🟣", "Bournemouth": "🍒",
  "Brentford": "🐝", "Brighton": "🔵", "Chelsea": "💙",
  "Coventry City": "🩵", "Crystal Palace": "🦅", "Everton": "🔵",
  "Fulham": "⬛", "Hull City": "🐯", "Ipswich Town": "🔵",
  "Leeds United": "⬜", "Liverpool": "🔴", "Manchester City": "🩵",
  "Manchester United": "👹", "Newcastle United": "⚫",
  "Nottingham Forest": "🌲", "Sunderland": "🔴", "Tottenham Hotspur": "🐓",
};

const STRENGTH = {
  "Arsenal": 90, "Manchester City": 87, "Manchester United": 85,
  "Aston Villa": 83, "Liverpool": 82, "Bournemouth": 77,
  "Chelsea": 74, "Newcastle United": 74, "Brighton": 73,
  "Tottenham Hotspur": 72, "Sunderland": 72, "Crystal Palace": 70,
  "Brentford": 69, "Fulham": 68, "Leeds United": 66,
  "Nottingham Forest": 64, "Everton": 63,
  "Ipswich Town": 57, "Coventry City": 56, "Hull City": 54,
};

const HOME_BOOST = 3.0;
const TEAMS = Object.keys(BADGE).sort();
const NEW_TEAMS = new Set(["Coventry City", "Ipswich Town", "Hull City"]);

const EUROPEAN = {
  "Arsenal": "UCL", "Manchester City": "UCL", "Manchester United": "UCL",
  "Aston Villa": "UCL", "Liverpool": "UCL",
  "Bournemouth": "UEL", "Sunderland": "UEL", "Crystal Palace": "UEL",
  "Brighton": "UECL",
};

const KEY_PLAYERS = {
  "Arsenal":           { "B. Saka": 4.0, "M. Ødegaard": 4.5, "P. Hincapie": 3.0, "L. Trossard": 3.0 },
  "Manchester City":   { "E. Haaland": 5.0, "T. Reijnders": 3.5, "R. Cherki": 3.5, "P. Foden": 3.5 },
  "Manchester United": { "B. Sesko": 4.0, "B. Fernandes": 4.0, "B. Mbeumo": 3.5, "M. Cunha": 3.0 },
  "Aston Villa":       { "O. Watkins": 4.0, "M. Rogers": 3.5, "E. Buendía": 3.0 },
  "Liverpool":         { "F. Wirtz": 4.5, "A. Isak": 4.5, "V. Munoz": 3.0 },
  "Bournemouth":       { "A. Semenyo": 3.5, "Rayan": 4.0, "A. Scott": 3.5 },
  "Chelsea":           { "C. Palmer": 4.5, "N. Jackson": 3.5, "M. Caicedo": 3.0 },
  "Newcastle United":  { "B. Guimarães": 4.0, "J. Pedro": 3.5, "K. Trippier": 2.5 },
  "Tottenham Hotspur": { "H. Son": 4.5, "D. Kulusevski": 3.5, "J. van Hecke": 3.0 },
  "Sunderland":        { "H. Wright": 3.5, "E. Mason-Clark": 3.0, "B. Thomas": 2.5 },
  "Brighton":          { "S. Mitoma": 3.5, "E. Ferguson": 3.5, "J. Enciso": 3.0 },
  "Crystal Palace":    { "E. Eze": 4.0, "M. Olise": 3.5, "J. Mateta": 3.0 },
  "Brentford":         { "I. Thiago": 4.5, "C. Nørgaard": 3.0, "M. Damsgaard": 3.0 },
  "Fulham":            { "A. Jiménez": 3.5, "T. Cairney": 3.0, "T. Muniz": 3.0 },
  "Leeds United":      { "W. Gnonto": 3.5, "J. Piroe": 3.0, "C. Cooper": 2.5 },
  "Nottingham Forest": { "C. Wood": 3.5, "E. Anderson": 3.5, "A. Awoniyi": 3.0 },
  "Everton":           { "D. Calvert-Lewin": 3.5, "A. Doucoure": 3.0, "J. Pickford": 2.5 },
  "Coventry City":     { "M. O'Hare": 3.0, "H. Godden": 2.5, "K. Hamer": 3.0 },
  "Ipswich Town":      { "C. Akpom": 3.0, "C. Kipre": 2.5, "D. O'Shea": 2.5 },
  "Hull City":         { "J. Gelhardt": 3.0, "M. Belloumi": 3.0, "M. van Ewijk": 2.5 },
};

let STRENGTH_OVERRIDES = {};
let SHARED_RAPID_KEY = "7ef4efbb75mshfd60b373d3b17dcp1770a3jsn54dd6ff58ab4";

function getStr(t) { return STRENGTH_OVERRIDES[t] ?? STRENGTH[t] ?? 60; }

function adjustedStrength(team, absent = []) {
  const base = STRENGTH[team] || 60;
  const keys = KEY_PLAYERS[team] || {};
  let pen = 0;
  absent.forEach(name => {
    const key = Object.keys(keys).find(k =>
      k.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(k.toLowerCase().split(" ").pop())
    );
    if (key) pen += keys[key];
  });
  return Math.max(40, base - pen);
}

// ============================================================
// POISSON PREDICTION ENGINE
// ============================================================
const MAX_G = 8;
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function r1(n) { return Math.round(n * 10) / 10; }
function r2(n) { return Math.round(n * 100) / 100; }
function poissonP(lam, k) {
  let f = 1; for (let i = 2; i <= k; i++) f *= i;
  return Math.exp(-lam) * Math.pow(lam, k) / f;
}
function buildMatrix(lA, lB) {
  const m = []; let tot = 0;
  for (let i = 0; i <= MAX_G; i++) for (let j = 0; j <= MAX_G; j++) {
    const p = poissonP(lA, i) * poissonP(lB, j);
    m.push({ home: i, away: j, probability: p }); tot += p;
  }
  return m.map(r => ({ ...r, probability: r.probability / tot }));
}

let BOOKMAKER_CACHE = {};

function predictMatch(teamA, teamB, isHome = true) {
  const sA = getStr(teamA) + (isHome ? HOME_BOOST : 0);
  const sB = getStr(teamB) + (!isHome ? HOME_BOOST : 0);
  const diff = (sA - sB) / 10;
  let lA = clamp((2.65 / 2) * Math.exp(diff * 0.18), 0.25, 4.2);
  let lB = clamp((2.65 / 2) * Math.exp(-diff * 0.18), 0.25, 4.2);

  const bk = BOOKMAKER_CACHE[`${teamA}-${teamB}`];
  let blended = false;
  if (bk?.homeWin && bk?.draw && bk?.awayWin) {
    const rH = 1/bk.homeWin, rD = 1/bk.draw, rA = 1/bk.awayWin, t = rH+rD+rA;
    const mx0 = buildMatrix(lA, lB);
    let hw=0,dr=0,aw=0;
    mx0.forEach(({home,away,probability})=>{ if(home>away)hw+=probability; else if(home===away)dr+=probability; else aw+=probability; });
    hw=0.4*hw+0.6*(rH/t); dr=0.4*dr+0.6*(rD/t); aw=0.4*aw+0.6*(rA/t);
    const ratio=hw/aw, tot=lA+lB;
    lA=clamp(tot*Math.sqrt(ratio)/(Math.sqrt(ratio)+1),0.25,4.2);
    lB=clamp(tot-lA,0.25,4.2); blended=true;
  }

  const matrix = buildMatrix(lA, lB);
  let homeWin=0,draw=0,awayWin=0,over25=0,bttsY=0;
  matrix.forEach(({home,away,probability})=>{
    if(home>away)homeWin+=probability; else if(home===away)draw+=probability; else awayWin+=probability;
    if(home+away>2.5)over25+=probability;
    if(home>0&&away>0)bttsY+=probability;
  });

  const sorted = [...matrix].sort((a,b)=>b.probability-a.probability);
  const best = sorted[0];
  const topScores = sorted.slice(0,8).map(s=>({ score:`${s.home}-${s.away}`, prob:r1(s.probability*100) }));
  const htBest = [...buildMatrix(lA*0.44,lB*0.44)].sort((a,b)=>b.probability-a.probability)[0];
  const topOut = Math.max(homeWin,draw,awayWin);
  const confidence = topOut>=0.55?"High":topOut>=0.44?"Medium":"Low";

  return {
    predictedScore:`${best.home}-${best.away}`,
    halfTimeScore:`${htBest.home}-${htBest.away}`,
    probabilities:{
      homeWin:r1(homeWin*100),draw:r1(draw*100),awayWin:r1(awayWin*100),
      over25:r1(over25*100),under25:r1((1-over25)*100),
      bttsYes:r1(bttsY*100),bttsNo:r1((1-bttsY)*100),
    },
    xG:{[teamA]:r2(lA),[teamB]:r2(lB)},
    topScores,matrix,confidence,blended,
  };
}

// ============================================================
// SHARED MINI COMPONENTS
// ============================================================
function FormStrip({ team, form = [] }) {
  if (!form.length) return <span style={{ color: C.muted, fontSize: 10 }}>Season not started</span>;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {form.map((r, i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: r==="W"?C.green:r==="D"?C.gold:C.red, display:"flex",alignItems:"center",justifyContent:"center", fontSize:8,fontWeight:800,color:"#070e1a" }}>{r}</div>
      ))}
    </div>
  );
}

function StatBox({ label, value, color = C.text }) {
  return (
    <div style={{ background:"#070e1a",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 7px",textAlign:"center",flex:1,minWidth:68 }}>
      <div style={{ color:C.muted,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:4 }}>{label}</div>
      <div style={{ color,fontSize:16,fontWeight:900 }}>{value}</div>
    </div>
  );
}

// ============================================================
// TAB: POWER RANKINGS
// ============================================================
function PowerRankingsView() {
  const sorted = [...TEAMS].sort((a,b)=>getStr(b)-getStr(a));
  const max = getStr(sorted[0]);
  const euroColors = { UCL:"#fbbf24", UEL:"#f97316", UECL:"#60a5fa" };

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ ...ST.lbl,marginBottom:2 }}>⚡ 2026/27 POWER RANKINGS</div>
        <div style={{ color:C.muted,fontSize:11,marginBottom:14,lineHeight:1.5 }}>
          Ratings based on 2025/26 finish + confirmed summer transfers. Window closes 1 Sep 2026.
        </div>
        {sorted.map((team,i) => {
          const str = getStr(team);
          const pct = (str/max)*100;
          const euro = EUROPEAN[team];
          const isNew = NEW_TEAMS.has(team);
          return (
            <div key={team} style={{ marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ color:i<3?C.gold:C.muted,fontSize:11,fontWeight:700,width:20 }}>#{i+1}</span>
                  <span style={{ fontSize:18 }}>{BADGE[team]}</span>
                  <span style={{ fontSize:12,fontWeight:800 }}>{team}</span>
                  {isNew && <span style={{ fontSize:9,fontWeight:800,background:"#0f1e30",color:C.sky,padding:"1px 6px",borderRadius:99 }}>↑ NEW</span>}
                  {euro && <span style={{ fontSize:9,fontWeight:800,color:euroColors[euro] }}>{euro}</span>}
                </div>
                <span style={{ fontSize:14,fontWeight:900,color:i===0?C.gold:C.sky }}>{str}</span>
              </div>
              <div style={{ height:5,background:C.border,borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${pct}%`,background:i===0?C.gold:i<5?C.sky:i<10?C.accent:C.muted,borderRadius:3 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TAB: SEASON TABLE
// ============================================================
const EMPTY_TABLE = TEAMS.map(team=>({ team,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0 }));

function SeasonTableView() {
  const [standings, setStandings] = useState(EMPTY_TABLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [usingLive, setUsingLive] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const [manualRows, setManualRows] = useState([]);
  const [mHome, setMHome] = useState("Arsenal");
  const [mAway, setMAway] = useState("Liverpool");
  const [mHG, setMHG] = useState("1");
  const [mAG, setMAG] = useState("0");
  const timerRef = useRef(null);

  const normEPL = (name) => {
    const MAP = {"Manchester City":"Manchester City","Man City":"Manchester City","Arsenal":"Arsenal","Liverpool":"Liverpool","Chelsea":"Chelsea","Manchester United":"Manchester United","Man Utd":"Manchester United","Man United":"Manchester United","Aston Villa":"Aston Villa","Tottenham":"Tottenham Hotspur","Tottenham Hotspur":"Tottenham Hotspur","Spurs":"Tottenham Hotspur","Newcastle":"Newcastle United","Newcastle United":"Newcastle United","Brighton":"Brighton","Brighton & Hove Albion":"Brighton","Brentford":"Brentford","Fulham":"Fulham","Crystal Palace":"Crystal Palace","Bournemouth":"Bournemouth","AFC Bournemouth":"Bournemouth","Everton":"Everton","Nottingham Forest":"Nottingham Forest","Leeds":"Leeds United","Leeds United":"Leeds United","Sunderland":"Sunderland","Coventry":"Coventry City","Coventry City":"Coventry City","Ipswich":"Ipswich Town","Ipswich Town":"Ipswich Town","Hull":"Hull City","Hull City":"Hull City"};
    return MAP[name] || name;
  };

  const fetchTable = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const resp = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/standings");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const entries = data?.standings?.[0]?.entries || data?.children?.[0]?.standings?.entries || [];
      if (!entries.length) throw new Error("No standings data");
      const parsed = entries.map(e => {
        const name = e?.team?.displayName || e?.team?.name || "";
        const stats = {};
        (e?.stats||[]).forEach(s=>{ stats[s.name]=s.value; });
        return { team:normEPL(name)||name, P:Math.round(stats.gamesPlayed??0), W:Math.round(stats.wins??0), D:Math.round(stats.ties??0), L:Math.round(stats.losses??0), GF:Math.round(stats.pointsFor??0), GA:Math.round(stats.pointsAgainst??0), GD:Math.round(stats.pointDifferential??0), Pts:Math.round(stats.points??0) };
      }).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF);
      setStandings(parsed); setUsingLive(true); setLastUpdate(new Date());
    } catch(e) {
      setError(`ESPN: ${e.message}. Showing current table.`);
    }
    setLoading(false);
  }, []);

  useEffect(()=>{ fetchTable(); },[]);
  useEffect(()=>{
    if(autoRefresh) timerRef.current=setInterval(fetchTable,120000);
    return ()=>clearInterval(timerRef.current);
  },[autoRefresh,fetchTable]);

  const computedStandings = useMemo(()=>{
    if(!manualRows.length) return standings;
    const map = {};
    standings.forEach(r=>{ map[r.team]={...r}; });
    TEAMS.forEach(t=>{ if(!map[t]) map[t]={team:t,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0}; });
    manualRows.forEach(({home,away,hg,ag})=>{
      const h=map[home]; const a=map[away];
      if(!h||!a) return;
      h.P++; a.P++; h.GF+=hg; h.GA+=ag; h.GD=h.GF-h.GA; a.GF+=ag; a.GA+=hg; a.GD=a.GF-a.GA;
      if(hg>ag){h.W++;h.Pts+=3;a.L++;}else if(hg===ag){h.D++;h.Pts++;a.D++;a.Pts++;}else{a.W++;a.Pts+=3;h.L++;}
    });
    return Object.values(map).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF);
  },[standings,manualRows]);

  const addResult = ()=>{ const hg=parseInt(mHG,10),ag=parseInt(mAG,10); if(mHome===mAway||isNaN(hg)||isNaN(ag)) return; setManualRows(p=>[...p,{home:mHome,away:mAway,hg,ag}]); };
  const fmtTime=(d)=>d?d.toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"}):"";

  const getZone=(pos)=>{
    if(pos<=5) return {color:"#fbbf24",label:"UCL"};
    if(pos===6||pos===7) return {color:"#f97316",label:"UEL"};
    if(pos===8) return {color:"#60a5fa",label:"UECL"};
    if(pos>=18) return {color:C.red,label:"REL"};
    return {color:"transparent",label:""};
  };

  const shortName=(name)=>name.replace("Manchester","Man").replace("Tottenham Hotspur","Spurs").replace("Nottingham Forest","Nott'm F").replace("Coventry City","Coventry").replace("Ipswich Town","Ipswich").replace("Hull City","Hull").replace("Leeds United","Leeds").replace("Newcastle United","Newcastle").replace("Crystal Palace","C. Palace").replace("Aston Villa","A. Villa");

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <div style={{ ...ST.lbl,marginBottom:0 }}>🏆 PREMIER LEAGUE 2026/27{usingLive&&<span style={{ marginLeft:8,color:C.green,fontSize:9,fontWeight:700 }}>● LIVE</span>}</div>
          {lastUpdate&&<span style={{ color:C.muted,fontSize:10 }}>{fmtTime(lastUpdate)}</span>}
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={fetchTable} disabled={loading} style={{ ...ST.btn,marginTop:0,flex:1 }}>{loading?"⏳":"🔄 Refresh"}</button>
          <button onClick={()=>setAutoRefresh(a=>!a)} style={{ ...ST.btn,marginTop:0,flex:1,background:autoRefresh?"#0a1e30":"#0f1e30",color:autoRefresh?C.sky:C.muted }}>{autoRefresh?"⏱ Auto ON":"⏱ Auto"}</button>
        </div>
        <div style={{ color:C.muted,fontSize:10,marginTop:6 }}>ESPN · No API key · Season starts 21 Aug 2026</div>
        {error&&<div style={{ color:C.gold,fontSize:11,marginTop:5 }}>{error}</div>}
      </div>

      {/* Zone legend */}
      <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
        {[{label:"UCL (Top 5)",color:"#fbbf24"},{label:"UEL (6–7)",color:"#f97316"},{label:"UECL (8)",color:"#60a5fa"},{label:"Relegation",color:C.red}].map(({label,color})=>(
          <div key={label} style={{ display:"flex",alignItems:"center",gap:4 }}>
            <div style={{ width:8,height:8,borderRadius:2,background:color }} />
            <span style={{ color:C.muted,fontSize:9 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...ST.card,padding:"10px 8px",overflowX:"auto" }}>
        <table style={{ ...ST.table,minWidth:0 }}>
          <thead>
            <tr>{["#","Club","P","W","D","L","GF","GA","GD","Pts"].map(h=><th key={h} style={{ ...ST.th,textAlign:h==="Club"?"left":"center",paddingBottom:8 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {computedStandings.map((row,i)=>{
              const zone=getZone(i+1);
              const isNew=NEW_TEAMS.has(row.team);
              return (
                <tr key={row.team} onClick={()=>setHighlight(highlight===row.team?null:row.team)} style={{ cursor:"pointer",background:highlight===row.team?"#0f1e30":"transparent" }}>
                  <td style={{ ...ST.td,paddingLeft:2 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:3 }}>
                      <div style={{ width:3,height:22,borderRadius:2,background:zone.color,flexShrink:0 }} />
                      <span style={{ color:C.muted,minWidth:16,textAlign:"right" }}>{i+1}</span>
                    </div>
                  </td>
                  <td style={{ ...ST.td,fontWeight:700,whiteSpace:"nowrap" }}>
                    <span style={{ marginRight:4 }}>{BADGE[row.team]||"⚽"}</span>
                    <span style={{ fontSize:11 }}>{shortName(row.team)}</span>
                    {isNew&&<span style={{ marginLeft:3,fontSize:8,color:C.sky,fontWeight:800 }}>↑</span>}
                  </td>
                  <td style={{ ...ST.td,textAlign:"center",color:C.muted }}>{row.P}</td>
                  <td style={{ ...ST.td,textAlign:"center",color:C.green,fontWeight:row.W>0?800:400 }}>{row.W}</td>
                  <td style={{ ...ST.td,textAlign:"center",color:C.gold }}>{row.D}</td>
                  <td style={{ ...ST.td,textAlign:"center",color:row.L>0?C.red:C.muted }}>{row.L}</td>
                  <td style={{ ...ST.td,textAlign:"center" }}>{row.GF}</td>
                  <td style={{ ...ST.td,textAlign:"center" }}>{row.GA}</td>
                  <td style={{ ...ST.td,textAlign:"center",color:row.GD>0?C.green:row.GD<0?C.red:C.muted,fontWeight:700 }}>{row.GD>0?`+${row.GD}`:row.GD}</td>
                  <td style={{ ...ST.td,textAlign:"center",color:C.sky,fontWeight:900,fontSize:13 }}>{row.Pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manual entry */}
      <div style={ST.card}>
        <div style={ST.lbl}>➕ ADD RESULT MANUALLY</div>
        <div style={{ display:"flex",gap:6,alignItems:"flex-end" }}>
          <div style={{ flex:2 }}>
            <div style={ST.lbl}>HOME</div>
            <select value={mHome} onChange={e=>setMHome(e.target.value)} style={{ ...ST.input,fontSize:11 }}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}</option>)}</select>
          </div>
          <div style={{ display:"flex",gap:4,alignItems:"center",paddingBottom:2 }}>
            <input value={mHG} onChange={e=>setMHG(e.target.value)} style={{ ...ST.input,width:40,textAlign:"center",padding:"9px 4px" }} type="number" min="0" max="20" />
            <span style={{ color:C.muted,fontWeight:900 }}>–</span>
            <input value={mAG} onChange={e=>setMAG(e.target.value)} style={{ ...ST.input,width:40,textAlign:"center",padding:"9px 4px" }} type="number" min="0" max="20" />
          </div>
          <div style={{ flex:2 }}>
            <div style={ST.lbl}>AWAY</div>
            <select value={mAway} onChange={e=>setMAway(e.target.value)} style={{ ...ST.input,fontSize:11 }}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}</option>)}</select>
          </div>
        </div>
        <button onClick={addResult} style={ST.btn} disabled={mHome===mAway}>➕ Add Result</button>
        {manualRows.length>0&&(
          <div style={{ marginTop:10 }}>
            {manualRows.map((r,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderTop:`1px solid ${C.border}`,fontSize:11 }}>
                <span>{BADGE[r.home]} {r.home}</span>
                <span style={{ color:C.sky,fontWeight:800 }}>{r.hg}–{r.ag}</span>
                <span>{BADGE[r.away]} {r.away}</span>
                <button onClick={()=>setManualRows(p=>p.filter((_,j)=>j!==i))} style={{ background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12 }}>✕</button>
              </div>
            ))}
            <button onClick={()=>setManualRows([])} style={{ ...ST.btn,background:"#1a0505",color:C.red,marginTop:8 }}>Clear All</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: LIVE SCORES
// ============================================================
function LiveScoresView({ onLiveUpdate }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef(null);

  const fetchScores = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const resp = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const events = data?.events || [];
      const parsed = events.map(ev => {
        const comp = ev?.competitions?.[0];
        const home = comp?.competitors?.find(c=>c.homeAway==="home");
        const away = comp?.competitors?.find(c=>c.homeAway==="away");
        const status = comp?.status;
        const goals = [];
        (comp?.details||[]).forEach(d=>{ if(d?.type?.text?.toLowerCase().includes("goal")) goals.push({ player:d?.athletesInvolved?.[0]?.displayName||"", team:d?.team?.shortDisplayName||"", time:d?.clock?.displayValue?.replace("'","")||"", detail:d?.type?.text?.includes("Penalty")?"P":d?.type?.text?.includes("Own")?"OG":"" }); });
        const state=status?.type?.state;
        return { id:ev.id, home:home?.team?.displayName||"", away:away?.team?.displayName||"", homeScore:home?.score!=null?Number(home.score):null, awayScore:away?.score!=null?Number(away.score):null, minute:status?.displayClock?.replace("'","")||"", status:state==="in"?"LIVE":state==="post"?"FT":"NS", kickoff:ev?.date||"", goals };
      }).filter(m=>m.home&&m.away);
      setMatches(parsed); setLastUpdate(new Date()); onLiveUpdate?.(parsed);
      if(!parsed.length) setError("No EPL matches today. Season starts 21 Aug 2026.");
    } catch(e) { setError(`Feed error: ${e.message}`); }
    setLoading(false);
  },[]);

  useEffect(()=>{ fetchScores(); },[]);
  useEffect(()=>{
    if(autoRefresh) timerRef.current=setInterval(fetchScores,60000);
    return()=>clearInterval(timerRef.current);
  },[autoRefresh,fetchScores]);

  const fmtKO=(iso)=>iso?new Date(iso).toLocaleString("en-MY",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kuala_Lumpur"})+" MYT":"";
  const liveCount=matches.filter(m=>m.status==="LIVE").length;

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <div style={{ ...ST.lbl,marginBottom:0 }}>🔴 EPL LIVE SCORES{liveCount>0&&<span style={{ marginLeft:8,background:C.green,color:"#070e1a",borderRadius:99,padding:"1px 7px",fontSize:10 }}>{liveCount} LIVE</span>}</div>
          {lastUpdate&&<span style={{ color:C.muted,fontSize:10 }}>{lastUpdate.toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"})}</span>}
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={fetchScores} disabled={loading} style={{ ...ST.btn,marginTop:0,flex:1 }}>{loading?"⏳":"🔄 Refresh"}</button>
          <button onClick={()=>setAutoRefresh(a=>!a)} style={{ ...ST.btn,marginTop:0,flex:1,background:autoRefresh?"#0a1e30":"#0f1e30",color:autoRefresh?C.sky:C.muted }}>{autoRefresh?"⏱ Auto ON":"⏱ Auto"}</button>
        </div>
        <div style={{ color:C.muted,fontSize:10,marginTop:6 }}>ESPN · No API key · Auto-refresh 60s</div>
        {error&&<div style={{ color:C.gold,fontSize:11,marginTop:6 }}>{error}</div>}
      </div>

      {matches.length===0&&!loading&&!error&&(
        <div style={{ ...ST.card,textAlign:"center",color:C.muted,padding:30 }}>
          <div style={{ fontSize:28,marginBottom:8 }}>📅</div>
          <div style={{ fontSize:13,fontWeight:700 }}>2026/27 Season starts 21 August 2026</div>
          <div style={{ fontSize:11,marginTop:4 }}>Arsenal (champions) open at home</div>
        </div>
      )}

      {matches.map(m=>{
        const isLive=m.status==="LIVE", isDone=m.status==="FT", hasScore=m.homeScore!==null&&m.awayScore!==null;
        return (
          <div key={m.id} style={{ ...ST.card,borderColor:isLive?C.green:C.border,background:isLive?"#061a0e":C.card,position:"relative",overflow:"hidden" }}>
            {isLive&&<div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.green},#34d399,${C.green})` }} />}
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:8 }}>
              <span>Premier League 2026/27</span>
              <span style={{ color:isLive?C.green:isDone?C.muted:C.gold,fontWeight:isLive?800:400 }}>
                {isLive&&<span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:C.green,marginRight:4 }} />}
                {isLive?`LIVE ${m.minute}'`:isDone?"FT":fmtKO(m.kickoff)}
              </span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ flex:1,textAlign:"right",fontSize:13,fontWeight:700 }}>{BADGE[m.home]||"⚽"} {m.home}</div>
              <div style={{ minWidth:64,textAlign:"center" }}>
                {hasScore?<span style={{ fontSize:20,fontWeight:900,color:isLive?C.green:C.sky }}>{m.homeScore} – {m.awayScore}</span>:<span style={{ color:C.muted,fontSize:13 }}>vs</span>}
              </div>
              <div style={{ flex:1,fontSize:13,fontWeight:700 }}>{BADGE[m.away]||"⚽"} {m.away}</div>
            </div>
            {m.goals?.length>0&&(
              <div style={{ marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:6 }}>
                {m.goals.map((g,i)=><div key={i} style={{ fontSize:11,color:C.muted,marginBottom:2 }}>⚽ {g.time}' {g.player} ({g.team}){g.detail?` ${g.detail}`:""}</div>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: MATCH INTEL
// ============================================================
function IntelView({ onStrengthOverride }) {
  const RAPID_HOST = "free-api-live-football-data.p.rapidapi.com";
  const [rapidKey, setRapidKey] = useState(SHARED_RAPID_KEY);
  const [savedKey, setSavedKey] = useState(SHARED_RAPID_KEY);
  const [intel, setIntel] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingLive, setUsingLive] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [aiSummary, setAiSummary] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [predictions, setPredictions] = useState({});
  const [predLoading, setPredLoading] = useState({});
  const [manualHome, setManualHome] = useState("Arsenal");
  const [manualAway, setManualAway] = useState("Manchester City");

  const normEPL=(name)=>{const M={"Manchester City":"Manchester City","Man City":"Manchester City","Arsenal":"Arsenal","Liverpool":"Liverpool","Chelsea":"Chelsea","Manchester United":"Manchester United","Man Utd":"Manchester United","Aston Villa":"Aston Villa","Tottenham":"Tottenham Hotspur","Tottenham Hotspur":"Tottenham Hotspur","Newcastle":"Newcastle United","Newcastle United":"Newcastle United","Brighton":"Brighton","Brighton & Hove Albion":"Brighton","Brentford":"Brentford","Fulham":"Fulham","Crystal Palace":"Crystal Palace","Bournemouth":"Bournemouth","Everton":"Everton","Nottingham Forest":"Nottingham Forest","Leeds United":"Leeds United","Sunderland":"Sunderland","Coventry City":"Coventry City","Ipswich Town":"Ipswich Town","Hull City":"Hull City"};return M[name]||name;};

  const rapidFetch=async(path,key)=>{
    const resp=await fetch(`https://${RAPID_HOST}${path}`,{headers:{"x-rapidapi-host":RAPID_HOST,"x-rapidapi-key":key,"Content-Type":"application/json"}});
    if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  };

  const fetchLiveIntel=async(key)=>{
    setLoading(true);setError("");setUsingLive(false);
    try {
      let fixtures=[];
      try{ const d=await rapidFetch("/football-live-matches",key);const all=d?.response||d?.data||[];fixtures=all.filter(f=>f?.league?.name?.toLowerCase().includes("premier")||f?.league?.id===39||f?.league?.id==="39"); }catch(e){}
      if(!fixtures.length){try{const today=new Date().toISOString().split("T")[0];const d=await rapidFetch(`/football-get-matches-by-league-and-season?leagueId=39&season=2026&date=${today}`,key);fixtures=d?.response||d?.data||[];}catch(e){}}
      if(!fixtures.length){setError("✅ API connected. No live EPL fixtures today. Add match manually below.");setSavedKey(key);SHARED_RAPID_KEY=key;setLoading(false);return;}
      const intelMap={};
      await Promise.all(fixtures.map(async(fix)=>{
        const fid=fix?.fixture?.id||fix?.id;
        const home=normEPL(fix?.teams?.home?.name||fix?.homeTeam?.name||"");
        const away=normEPL(fix?.teams?.away?.name||fix?.awayTeam?.name||"");
        if(!home||!away) return;
        const matchKey=`${home}-${away}`;
        let homeLU=null,awayLU=null;
        try{const d=await rapidFetch(`/football-get-lineups?matchId=${fid}`,key);const l=d?.response||d?.data||[];homeLU=l.find(x=>normEPL(x?.team?.name||"")===home);awayLU=l.find(x=>normEPL(x?.team?.name||"")===away);}catch(e){}
        let homeInj=[],awayInj=[];
        try{const d=await rapidFetch(`/football-injuries?matchId=${fid}`,key);const inj=d?.response||d?.data||[];homeInj=inj.filter(i=>normEPL(i?.team?.name||"")===home);awayInj=inj.filter(i=>normEPL(i?.team?.name||"")===away);}catch(e){}
        const parseLU=(lu)=>{ const s=Array.isArray(lu?.startXI)?lu.startXI.slice(0,11).map(p=>p?.player?.name||p?.name||"").filter(Boolean):[];return{confirmed:s.length>=11,formation:lu?.formation||"Unknown",starters:s,injuries:[],suspensions:[],doubts:[]}; };
        const parseInj=(arr)=>({injuries:arr.filter(i=>i?.player?.type!=="Suspension").map(i=>`${i?.player?.name||""} (${i?.player?.reason||"Injured"})`),suspensions:arr.filter(i=>i?.player?.type==="Suspension").map(i=>i?.player?.name||"")});
        intelMap[matchKey]={kickoff:fix?.fixture?.date||"",home,away,status:fix?.fixture?.status?.long||"Scheduled",homeLineup:{...(homeLU?parseLU(homeLU):{confirmed:false,formation:"Pending",starters:[],doubts:[]}), ...parseInj(homeInj)},awayLineup:{...(awayLU?parseLU(awayLU):{confirmed:false,formation:"Pending",starters:[],doubts:[]}), ...parseInj(awayInj)},news:[],oddsMovement:""};
      }));
      if(Object.keys(intelMap).length){setIntel(intelMap);setSavedKey(key);SHARED_RAPID_KEY=key;setUsingLive(true);}
      else setError("Fixtures found but could not parse. Add manually below.");
    }catch(e){setError(`API Error: ${e.message}`);}
    setLoading(false);
  };

  const addManualMatch=()=>{
    if(!manualHome||!manualAway||manualHome===manualAway) return;
    const matchKey=`${manualHome}-${manualAway}`;
    const homeStr=STRENGTH[manualHome]||60,awayStr=STRENGTH[manualAway]||60,diff=homeStr-awayStr;
    const favoured=Math.abs(diff)<5?"Evenly matched":diff>0?manualHome:manualAway;
    setIntel(prev=>({...prev,[matchKey]:{kickoff:new Date().toISOString(),home:manualHome,away:manualAway,venue:"Premier League",status:"Pre-match",homeLineup:{confirmed:false,formation:"Unknown",starters:[],injuries:[],suspensions:[],doubts:[]},awayLineup:{confirmed:false,formation:"Unknown",starters:[],injuries:[],suspensions:[],doubts:[]},news:[`⚡ Strength: ${manualHome} (${homeStr}) vs ${manualAway} (${awayStr})`,`📊 ${favoured} favoured on model ratings`,`🔑 Lineups available ~60min before KO via RapidAPI`],oldsMovement:""}}));
    setExpanded(matchKey);
  };

  const applyOverride=(matchKey,matchData)=>{
    const hA=[...(matchData.homeLineup.injuries||[]).map(i=>i.split(" (")[0]),...(matchData.homeLineup.suspensions||[])];
    const aA=[...(matchData.awayLineup.injuries||[]).map(i=>i.split(" (")[0]),...(matchData.awayLineup.suspensions||[])];
    const adjHome=adjustedStrength(matchData.home,hA),adjAway=adjustedStrength(matchData.away,aA);
    const newOv={...overrides,[matchData.home]:adjHome,[matchData.away]:adjAway};
    setOverrides(newOv); onStrengthOverride?.(newOv);
  };

  const clearOverride=(matchData)=>{ const newOv={...overrides};delete newOv[matchData.home];delete newOv[matchData.away];setOverrides(newOv);onStrengthOverride?.(newOv); };

  const getAiBriefing=async(matchKey,matchData)=>{
    setAiLoading(p=>({...p,[matchKey]:true}));
    try{
      const abH=[...(matchData.homeLineup?.injuries||[]),...(matchData.homeLineup?.suspensions||[])].join(", ")||"None";
      const abA=[...(matchData.awayLineup?.injuries||[]),...(matchData.awayLineup?.suspensions||[])].join(", ")||"None";
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:700,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:`Search for "${matchData.home} vs ${matchData.away} Premier League 2026-27 lineup injury team news" then write 3-paragraph EPL pre-match analyst briefing:\n1. How do absences/lineup shape change the dynamic?\n2. Which side does this favour and why?\n3. One specific betting angle.\nMatch: ${matchData.home} (${matchData.homeLineup?.formation||"?"}) vs ${matchData.away} (${matchData.awayLineup?.formation||"?"}).\nAbsent — ${matchData.home}: ${abH} | ${matchData.away}: ${abA}.\n150 words max. Analyst tone.`}]})});
      const data=await resp.json();
      setAiSummary(p=>({...p,[matchKey]:data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||""}));
    }catch(e){setAiSummary(p=>({...p,[matchKey]:`AI briefing unavailable. Model: ${matchData.home} (${getStr(matchData.home)}) vs ${matchData.away} (${getStr(matchData.away)}).`}));}
    setAiLoading(p=>({...p,[matchKey]:false}));
  };

  const getFullPrediction=async(matchKey,matchData)=>{
    setPredLoading(p=>({...p,[matchKey]:true}));
    try{
      const pred=predictMatch(matchData.home,matchData.away,true);
      const abH=[...(matchData.homeLineup?.injuries||[]),...(matchData.homeLineup?.suspensions||[])].join(", ")||"None";
      const abA=[...(matchData.awayLineup?.injuries||[]),...(matchData.awayLineup?.suspensions||[])].join(", ")||"None";
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:`EPL 2026-27 betting analyst. Search current odds for "${matchData.home} vs ${matchData.away} Premier League odds".\n\n**BOOKMAKER ODDS**\nList odds from Pinnacle/Bet365/OddsPortal:\n- ${matchData.home} Win: [odds]\n- Draw: [odds]\n- ${matchData.away} Win: [odds]\n- Over 2.5: [odds]\n- Asian Handicap line\n\n**RESULT PREDICTION**\nPredicted: [X-X]\n\n**WIN PROBABILITY**\n${matchData.home}: [X]%  Draw: [X]%  ${matchData.away}: [X]%\n\n**MODEL CROSS-CHECK**\nPoisson: ${matchData.home} ${pred.probabilities.homeWin}% / Draw ${pred.probabilities.draw}% / ${matchData.away} ${pred.probabilities.awayWin}%\nxG: ${pred.xG[matchData.home]} – ${pred.xG[matchData.away]} | Score: ${pred.predictedScore}\nAbsent — ${matchData.home}: ${abH} | ${matchData.away}: ${abA}\n\n**VALUE BET FLAG**\nVALUE or SKIP based on model vs market divergence >8%.\n\n**TACTICAL SUMMARY**\n2 sentences max.`}]})});
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data=await resp.json();
      setPredictions(p=>({...p,[matchKey]:data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||""}));
    }catch(e){
      const pred=predictMatch(matchData.home,matchData.away,true);
      setPredictions(p=>({...p,[matchKey]:`**RESULT PREDICTION**\nPredicted score: ${pred.predictedScore}\n\n**WIN PROBABILITY (Model)**\n${matchData.home}: ${pred.probabilities.homeWin}%\nDraw: ${pred.probabilities.draw}%\n${matchData.away}: ${pred.probabilities.awayWin}%\n\nxG: ${pred.xG[matchData.home]} – ${pred.xG[matchData.away]}\nConfidence: ${pred.confidence}\n\n⚠️ Live odds unavailable — model only.`}));
    }
    setPredLoading(p=>({...p,[matchKey]:false}));
  };

  const fmtKO=(d)=>d?new Date(d).toLocaleString("en-MY",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kuala_Lumpur"})+" MYT":"";

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ ...ST.lbl,marginBottom:8 }}>🏥 MATCH INTEL — Lineups · Injuries · AI Briefing</div>
        <div style={{ color:C.muted,fontSize:11,lineHeight:1.5,marginBottom:10 }}>
          Connect <strong style={{ color:C.text }}>Free API Live Football Data</strong> on RapidAPI for live EPL lineups, injuries & suspensions.
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <input style={{ ...ST.input,flex:1,fontFamily:"monospace",fontSize:11 }} placeholder="x-rapidapi-key..." value={rapidKey} onChange={e=>setRapidKey(e.target.value)} type="password" />
          <button onClick={()=>rapidKey.trim()&&fetchLiveIntel(rapidKey.trim())} disabled={loading||!rapidKey.trim()} style={{ ...ST.btn,marginTop:0,width:"auto",padding:"9px 16px" }}>{loading?"⏳":"Fetch"}</button>
        </div>
        {savedKey&&!loading&&<button onClick={()=>fetchLiveIntel(savedKey)} style={{ ...ST.btn,background:"#0f1e30",color:C.sky }}>🔄 Refresh Intel</button>}
        <div style={{ marginTop:8,fontSize:10,color:usingLive?C.green:C.gold }}>{usingLive?"✅ Live lineups from API":"⚡ Manual mode — add match below"}</div>
        {error&&<div style={{ color:error.startsWith("✅")?C.green:C.red,fontSize:11,marginTop:6 }}>{error}</div>}
      </div>

      <div style={ST.card}>
        <div style={ST.lbl}>➕ ADD MATCH MANUALLY</div>
        <div style={{ display:"flex",gap:8 }}>
          <div style={{ flex:1 }}><div style={ST.lbl}>HOME</div><select value={manualHome} onChange={e=>setManualHome(e.target.value)} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}</option>)}</select></div>
          <div style={{ color:C.muted,fontWeight:900,fontSize:12,paddingTop:22 }}>VS</div>
          <div style={{ flex:1 }}><div style={ST.lbl}>AWAY</div><select value={manualAway} onChange={e=>setManualAway(e.target.value)} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}</option>)}</select></div>
        </div>
        <button onClick={addManualMatch} style={ST.btn} disabled={manualHome===manualAway}>➕ Add Match Intel Card</button>
      </div>

      {Object.entries(intel).map(([matchKey,match])=>{
        const isExpanded=expanded===matchKey;
        const hasOverride=overrides[match.home]||overrides[match.away];
        const homeAbsent=[...(match.homeLineup?.injuries||[]).map(i=>i.split(" (")[0]),...(match.homeLineup?.suspensions||[])];
        const awayAbsent=[...(match.awayLineup?.injuries||[]).map(i=>i.split(" (")[0]),...(match.awayLineup?.suspensions||[])];
        const baseHome=STRENGTH[match.home]||60,baseAway=STRENGTH[match.away]||60;
        const adjHome=adjustedStrength(match.home,homeAbsent),adjAway=adjustedStrength(match.away,awayAbsent);

        return (
          <div key={matchKey} style={ST.card}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:14,fontWeight:900 }}>{BADGE[match.home]||"⚽"} {match.home} <span style={{ color:C.muted }}>vs</span> {BADGE[match.away]||"⚽"} {match.away}</div>
                <div style={{ color:C.muted,fontSize:10,marginTop:3 }}>
                  🕐 {fmtKO(match.kickoff)} · {match.status}
                  {match.homeLineup?.confirmed?<span style={{ color:C.green,marginLeft:6 }}>✅ Confirmed</span>:<span style={{ color:C.gold,marginLeft:6 }}>⏳ Expected</span>}
                </div>
              </div>
              <button onClick={()=>setExpanded(isExpanded?null:matchKey)} style={{ background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11 }}>{isExpanded?"▲":"▼"}</button>
            </div>

            <div style={{ display:"flex",gap:8,marginTop:10 }}>
              {[{team:match.home,base:baseHome,adj:adjHome},{team:match.away,base:baseAway,adj:adjAway}].map(({team,base,adj})=>(
                <div key={team} style={{ flex:1,background:"#070e1a",borderRadius:8,padding:"8px 10px" }}>
                  <div style={{ fontSize:10,color:C.muted,marginBottom:3 }}>{BADGE[team]} {team}</div>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:16,fontWeight:900,color:adj<base?C.red:C.sky }}>{adj}</span>
                    {adj<base&&<span style={{ fontSize:10,color:C.red }}>↓{base-adj}</span>}
                    {adj===base&&<span style={{ fontSize:10,color:C.muted }}>base</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex",gap:6,marginTop:8 }}>
              <button onClick={()=>applyOverride(matchKey,match)} style={{ flex:1,background:hasOverride?"#0a1e30":"#0f1e30",border:`1px solid ${hasOverride?C.sky:C.border}`,color:hasOverride?C.sky:C.accent,borderRadius:7,padding:"7px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>{hasOverride?"✅ Strength adjusted":"⚡ Apply to model"}</button>
              {hasOverride&&<button onClick={()=>clearOverride(match)} style={{ background:"#1a0505",border:`1px solid ${C.red}`,color:C.red,borderRadius:7,padding:"7px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>Reset</button>}
            </div>

            {isExpanded&&(
              <div style={{ marginTop:12 }}>
                <div style={{ display:"flex",gap:8,marginBottom:12 }}>
                  {[{label:match.home,lu:match.homeLineup},{label:match.away,lu:match.awayLineup}].map(({label,lu})=>(
                    <div key={label} style={{ flex:1,background:"#070e1a",borderRadius:8,padding:10 }}>
                      <div style={{ fontWeight:700,fontSize:11,marginBottom:5 }}>{BADGE[label]} {label}</div>
                      <div style={{ color:C.sky,fontSize:10,marginBottom:5 }}>{lu?.formation} {lu?.confirmed?"✅":"⏳"}</div>
                      {lu?.starters?.slice(0,11).map((p,i)=><div key={i} style={{ fontSize:10,color:C.muted,padding:"2px 0",borderTop:i===0?"none":`1px solid ${C.border}` }}>{p}</div>)}
                      {lu?.injuries?.length>0&&<div style={{ marginTop:6 }}><div style={{ color:C.red,fontSize:9,fontWeight:700,letterSpacing:1 }}>🏥 INJURED</div>{lu.injuries.map((inj,i)=><div key={i} style={{ fontSize:10,color:C.red }}>{inj}</div>)}</div>}
                      {lu?.suspensions?.length>0&&<div style={{ marginTop:4 }}><div style={{ color:C.gold,fontSize:9,fontWeight:700,letterSpacing:1 }}>🟨 SUSPENDED</div>{lu.suspensions.map((s,i)=><div key={i} style={{ fontSize:10,color:C.gold }}>{s}</div>)}</div>}
                      {lu?.doubts?.length>0&&<div style={{ marginTop:4 }}><div style={{ color:C.muted,fontSize:9,fontWeight:700 }}>❓ DOUBTS</div>{lu.doubts.map((d,i)=><div key={i} style={{ fontSize:10,color:C.muted }}>{d}</div>)}</div>}
                    </div>
                  ))}
                </div>

                {match.news?.length>0&&<div style={{ marginBottom:10 }}>{match.news.map((n,i)=><div key={i} style={{ fontSize:11,color:C.muted,padding:"5px 8px",background:"#070e1a",borderRadius:6,marginBottom:4 }}>{n}</div>)}</div>}
                {match.oddsMovement&&<div style={{ fontSize:11,color:C.gold,padding:"6px 10px",background:"#1a1200",borderRadius:6,marginBottom:10 }}>📈 {match.oddsMovement}</div>}

                <div style={{ marginBottom:10 }}>
                  {predictions[matchKey]?(
                    <div style={{ background:"#070e1a",border:`1px solid ${C.border}`,borderRadius:10,padding:12 }}>
                      <div style={{ color:C.sky,fontSize:10,fontWeight:800,marginBottom:8,letterSpacing:1 }}>📊 PREDICTION + ODDS ANALYSIS</div>
                      {predictions[matchKey].split("\n").map((line,i)=>{ const isBold=line.startsWith("**");const text=line.replace(/\*\*/g,""); return <div key={i} style={{ fontSize:isBold?10:11,fontWeight:isBold?800:400,color:isBold?C.sky:C.muted,marginTop:isBold?8:2,lineHeight:1.5 }}>{text}</div>; })}
                    </div>
                  ):(
                    <button onClick={()=>getFullPrediction(matchKey,match)} disabled={predLoading[matchKey]} style={{ ...ST.btn,marginTop:0,background:predLoading[matchKey]?"#0f1e30":"#0a1e30",color:predLoading[matchKey]?C.muted:C.sky }}>{predLoading[matchKey]?"⏳ Searching odds...":"📊 Get Prediction + Bookmaker Odds"}</button>
                  )}
                </div>

                {aiSummary[matchKey]?(
                  <div style={{ background:"#07101e",border:`1px solid ${C.border}`,borderRadius:10,padding:12 }}>
                    <div style={{ color:"#60a5fa",fontSize:10,fontWeight:800,marginBottom:6,letterSpacing:1 }}>🤖 AI PRE-MATCH BRIEFING</div>
                    <p style={{ color:C.muted,fontSize:11,lineHeight:1.6,margin:0 }}>{aiSummary[matchKey]}</p>
                  </div>
                ):(
                  <button onClick={()=>getAiBriefing(matchKey,match)} disabled={aiLoading[matchKey]} style={{ ...ST.btn,background:"#0f1e30",color:C.sky }}>{aiLoading[matchKey]?"⏳ Generating briefing...":"🤖 Get AI Pre-Match Briefing"}</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!Object.keys(intel).length&&!loading&&(
        <div style={{ ...ST.card,textAlign:"center",color:C.muted,padding:28 }}>
          <div style={{ fontSize:24,marginBottom:8 }}>🏥</div>
          <div style={{ fontSize:12,marginBottom:4 }}>No match intel loaded yet.</div>
          <div style={{ fontSize:11 }}>Connect RapidAPI or add a match manually above.</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: PREDICT MATCH
// ============================================================
function PredictView() {
  const [home,setHome]=useState("Arsenal");
  const [away,setAway]=useState("Manchester City");
  const [result,setResult]=useState(null);
  const [aiText,setAiText]=useState("");
  const [loading,setLoading]=useState(false);
  const [query,setQuery]=useState("");

  const predict=async()=>{
    if(!home||!away||home===away) return;
    setLoading(true);setAiText("");setResult(null);
    const pred=predictMatch(home,away,true);
    setResult({...pred,home,away});
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`Expert EPL analyst. 150-word preview for 2026/27: ${home} vs ${away}.\nModel: ${pred.predictedScore} (${home} ${pred.probabilities.homeWin}% / Draw ${pred.probabilities.draw}% / ${away} ${pred.probabilities.awayWin}%).\nContext: Arsenal are defending champions. Man City post-Pep rebuild with Reijnders/Cherki. Man Utd 3rd under Carrick. Liverpool lost Salah but have Wirtz+Isak. Three promoted: Coventry, Ipswich, Hull.\nCover: tactical battle, key individual matchup, one market insight. Sharp analyst tone.`}]})});
      const data=await resp.json();
      setAiText(data.content?.map(c=>c.text||"").join("")||"");
    }catch(e){setAiText("AI preview unavailable.");}
    setLoading(false);
  };

  const askAI=async()=>{
    if(!query.trim()) return;
    setLoading(true);setAiText("");setResult(null);
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:`EPL 2026/27 expert. Search for latest info then answer: "${query}"\nContext: Arsenal champions (85pts). Man Utd 3rd under Carrick. Man City post-Pep. Liverpool have Wirtz+Isak. Promoted: Coventry, Ipswich, Hull.\n150 words max. Be specific.`}]})});
      const data=await resp.json();
      setAiText(data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||"");
    }catch(e){setAiText("Query failed.");}
    setLoading(false);
  };

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ ...ST.lbl,marginBottom:10 }}>🔮 PREDICT ANY MATCH — 2026/27</div>
        <div style={{ display:"flex",gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={ST.lbl}>HOME</div>
            <select value={home} onChange={e=>setHome(e.target.value)} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t)?" ↑":""}</option>)}</select>
            <div style={{ marginTop:4,fontSize:10,color:C.muted }}>Rating: <strong style={{ color:C.sky }}>{getStr(home)+HOME_BOOST}</strong> (home)</div>
          </div>
          <div style={{ color:C.muted,fontWeight:900,fontSize:12,paddingTop:22 }}>VS</div>
          <div style={{ flex:1 }}>
            <div style={ST.lbl}>AWAY</div>
            <select value={away} onChange={e=>setAway(e.target.value)} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t)?" ↑":""}</option>)}</select>
            <div style={{ marginTop:4,fontSize:10,color:C.muted }}>Rating: <strong style={{ color:C.sky }}>{getStr(away)}</strong> (away)</div>
          </div>
        </div>
        <button onClick={predict} style={ST.btn} disabled={loading||home===away}>{loading?"Analysing...":"⚡ Predict Match"}</button>
      </div>

      {result&&!loading&&(
        <div style={ST.card}>
          <div style={{ textAlign:"center",marginBottom:12 }}>
            <div style={{ display:"flex",justifyContent:"center",gap:14,alignItems:"center",marginBottom:12 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:28 }}>{BADGE[result.home]}</div><div style={{ fontWeight:800,fontSize:12,marginTop:4 }}>{result.home}</div></div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:34,fontWeight:900,color:C.sky }}>{result.predictedScore}</div>
                <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>HT {result.halfTimeScore}</div>
              </div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:28 }}>{BADGE[result.away]}</div><div style={{ fontWeight:800,fontSize:12,marginTop:4 }}>{result.away}</div></div>
            </div>
            <div style={{ display:"flex",gap:3,height:5,borderRadius:3,overflow:"hidden",margin:"0 8px" }}>
              <div style={{ flex:result.probabilities.homeWin,background:C.sky }} />
              <div style={{ flex:result.probabilities.draw,background:C.gold }} />
              <div style={{ flex:result.probabilities.awayWin,background:C.red }} />
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginTop:5,fontSize:11 }}>
              <span style={{ color:C.sky }}>{result.probabilities.homeWin}% Home</span>
              <span style={{ color:C.gold }}>{result.probabilities.draw}% Draw</span>
              <span style={{ color:C.red }}>{result.probabilities.awayWin}% Away</span>
            </div>
            <div style={{ marginTop:6,color:C.muted,fontSize:11 }}>xG: {result.xG[result.home]} – {result.xG[result.away]} · Over 2.5: {result.probabilities.over25}% · BTTS: {result.probabilities.bttsYes}% · <strong style={{ color:result.confidence==="High"?C.green:result.confidence==="Medium"?C.gold:C.muted }}>{result.confidence}</strong>{result.blended&&<span style={{ marginLeft:6,color:C.green,fontSize:10 }}>🔀 Blended</span>}</div>
          </div>
          <div style={{ borderTop:`1px solid ${C.border}`,paddingTop:10 }}>
            <div style={ST.lbl}>TOP CORRECT SCORES</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
              {result.topScores.slice(0,6).map((s,i)=>(
                <div key={s.score} style={{ background:i===0?"#0a1e36":"#070e1a",border:`1px solid ${i===0?C.sky:C.border}`,borderRadius:7,padding:"6px 10px",textAlign:"center" }}>
                  <div style={{ fontSize:14,fontWeight:900,color:i===0?C.sky:C.text }}>{s.score}</div>
                  <div style={{ fontSize:9,color:C.muted,marginTop:1 }}>{s.prob}%</div>
                </div>
              ))}
            </div>
          </div>
          {aiText&&<div style={{ borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10 }}><div style={{ ...ST.lbl,color:"#60a5fa" }}>🤖 AI PREVIEW</div><p style={{ color:C.muted,fontSize:12,lineHeight:1.6,margin:0 }}>{aiText}</p></div>}
        </div>
      )}

      <div style={ST.card}>
        <div style={ST.lbl}>💬 ASK THE ANALYST</div>
        <input style={ST.input} placeholder='e.g. "Can Man Utd win the title?" or "Who are the relegation favourites?"' value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()} />
        <button onClick={askAI} style={ST.btn} disabled={loading}>{loading?"Thinking...":"🔍 Ask"}</button>
        {aiText&&!result&&<div style={{ marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:10 }}><p style={{ color:C.muted,fontSize:12,lineHeight:1.6,margin:0 }}>{aiText}</p></div>}
      </div>
    </div>
  );
}

// ============================================================
// TAB: TEAM INTEL
// ============================================================
function TeamIntelView() {
  const [team,setTeam]=useState("Manchester City");
  const [aiText,setAiText]=useState("");
  const [loading,setLoading]=useState(false);
  const str=STRENGTH[team]||60;
  const rank=[...TEAMS].sort((a,b)=>getStr(b)-getStr(a)).findIndex(t=>t===team)+1;
  const euro=EUROPEAN[team];
  const isNew=NEW_TEAMS.has(team);
  const euroColors={UCL:"#fbbf24",UEL:"#f97316",UECL:"#60a5fa"};

  const getAI=async()=>{
    setLoading(true);setAiText("");
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:`Search for "${team} Premier League 2026-27 season preview transfers" then give a sharp 200-word EPL 2026/27 preview: (1) Key summer transfers in/out, (2) Tactical identity and manager, (3) Season outlook. Strength rating ${str}/100, ranked #${rank}.${euro?` In ${euro} this season.`:""}${isNew?" PROMOTED team.":""} No bullets. Analyst prose.`}]})});
      const data=await resp.json();
      setAiText(data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||"");
    }catch(e){setAiText("AI intel unavailable.");}
    setLoading(false);
  };

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ ...ST.lbl,marginBottom:10 }}>🔍 TEAM DEEP DIVE — 2026/27</div>
        <select value={team} onChange={e=>{setTeam(e.target.value);setAiText("");}} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t)?" ↑ NEW":""}</option>)}</select>
      </div>

      <div style={ST.card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
          <div>
            <div style={{ fontSize:26,marginBottom:4 }}>{BADGE[team]}</div>
            <div style={{ fontSize:16,fontWeight:900 }}>{team}</div>
            <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
              <span style={{ color:C.muted,fontSize:11 }}>#{rank} in model</span>
              {euro&&<span style={{ color:euroColors[euro],fontSize:11,fontWeight:700 }}>· {euro}</span>}
              {isNew&&<span style={{ color:C.sky,fontSize:11,fontWeight:700 }}>· ↑ Promoted</span>}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:28,fontWeight:900,color:C.gold }}>{str}</div>
            <div style={{ color:C.muted,fontSize:10,fontWeight:700 }}>STRENGTH</div>
          </div>
        </div>

        <div style={{ display:"flex",gap:5,marginBottom:14 }}>
          {[{label:"BASE",value:str},{label:"HOME",value:str+HOME_BOOST},{label:"EPL RANK",value:`#${rank}`}].map(s=>(
            <div key={s.label} style={{ flex:1,background:"#070e1a",borderRadius:8,padding:"8px 4px",textAlign:"center" }}>
              <div style={{ color:C.muted,fontSize:9,fontWeight:700 }}>{s.label}</div>
              <div style={{ color:C.sky,fontSize:18,fontWeight:900,marginTop:3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {KEY_PLAYERS[team]&&(
          <div style={{ marginBottom:12 }}>
            <div style={ST.lbl}>KEY PLAYERS 2026/27</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
              {Object.entries(KEY_PLAYERS[team]).filter(([,r])=>r>0).map(([name,rating])=>(
                <div key={name} style={{ background:"#070e1a",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 9px",fontSize:11 }}>
                  <span>{name}</span><span style={{ color:C.gold,marginLeft:5,fontSize:10,fontWeight:800 }}>★{rating}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={ST.lbl}>QUICK PREDICTIONS (HOME)</div>
        {[...TEAMS].filter(t=>t!==team).slice(0,5).map(opp=>{
          const pred=predictMatch(team,opp,true);
          return (
            <div key={opp} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12 }}>{BADGE[opp]} {opp}</div>
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                <span style={{ color:C.sky,fontWeight:800,fontSize:13 }}>{pred.predictedScore}</span>
                <span style={{ color:pred.probabilities.homeWin>=50?C.green:C.gold,fontSize:10 }}>{pred.probabilities.homeWin}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={ST.card}>
        <div style={ST.lbl}>🤖 AI SEASON PREVIEW</div>
        <button onClick={getAI} disabled={loading} style={ST.btn}>{loading?"⏳ Searching latest news...":`📊 Get ${team} 2026/27 Preview`}</button>
        {aiText&&<div style={{ marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10 }}><p style={{ color:C.muted,fontSize:12,lineHeight:1.7,margin:0 }}>{aiText}</p></div>}
      </div>
    </div>
  );
}

// ============================================================
// TAB: TOP SCORERS
// ============================================================
const FALLBACK_SCORERS=[
  {rank:1,name:"E. Haaland",team:"Manchester City",goals:0,assists:0},
  {rank:2,name:"A. Isak",team:"Liverpool",goals:0,assists:0},
  {rank:3,name:"B. Sesko",team:"Manchester United",goals:0,assists:0},
  {rank:4,name:"O. Watkins",team:"Aston Villa",goals:0,assists:0},
  {rank:5,name:"B. Saka",team:"Arsenal",goals:0,assists:0},
  {rank:6,name:"C. Palmer",team:"Chelsea",goals:0,assists:0},
  {rank:7,name:"I. Thiago",team:"Brentford",goals:0,assists:0},
  {rank:8,name:"H. Son",team:"Tottenham Hotspur",goals:0,assists:0},
  {rank:9,name:"F. Wirtz",team:"Liverpool",goals:0,assists:0},
  {rank:10,name:"B. Fernandes",team:"Manchester United",goals:0,assists:0},
];

function TopScorersView() {
  const [scorers,setScorers]=useState(null);
  const [assists,setAssists]=useState(null);
  const [loading,setLoading]=useState(false);
  const [lastUpdate,setLastUpdate]=useState(null);
  const [view,setView]=useState("goals");

  const fetchScorers=async()=>{
    setLoading(true);
    try{
      const resp=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/leaders");
      if(resp.ok){
        const data=await resp.json();
        const gL=data?.leaders?.find(l=>l.name?.toLowerCase().includes("goal")||l.abbreviation==="G");
        const aL=data?.leaders?.find(l=>l.name?.toLowerCase().includes("assist")||l.abbreviation==="A");
        if(gL?.leaders?.length){
          setScorers(gL.leaders.slice(0,20).map((p,i)=>({rank:i+1,name:p.athlete?.displayName||"",team:p.team?.displayName||"",goals:p.value||0,assists:0})));
          if(aL?.leaders?.length) setAssists(aL.leaders.slice(0,20).map((p,i)=>({rank:i+1,name:p.athlete?.displayName||"",team:p.team?.displayName||"",assists:p.value||0,goals:0})));
          setLastUpdate(new Date());setLoading(false);return;
        }
      }
    }catch(e){}
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:`Search "Premier League 2026-27 top scorers golden boot" and return top 20. Also "Premier League 2026-27 top assists". Return ONLY JSON:\n{"scorers":[{"rank":1,"name":"","team":"","goals":0,"assists":0}],"assists":[{"rank":1,"name":"","team":"","assists":0,"goals":0}]}`}]})});
      const data=await resp.json();
      const text=data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      if(parsed.scorers?.length){setScorers(parsed.scorers);if(parsed.assists?.length)setAssists(parsed.assists);}
      else setScorers(FALLBACK_SCORERS);
    }catch(e){setScorers(FALLBACK_SCORERS);}
    setLastUpdate(new Date());setLoading(false);
  };

  useEffect(()=>{fetchScorers();},[]);
  const displayList=view==="assists"?(assists||[]):(scorers||[]);
  const seasonStarted=scorers&&scorers.some(s=>s.goals>0);
  const fmtTime=(d)=>d?d.toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"}):"";

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div style={{ ...ST.lbl,marginBottom:0 }}>🥅 TOP SCORERS 2026/27</div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            {lastUpdate&&<span style={{ color:C.muted,fontSize:10 }}>{fmtTime(lastUpdate)}</span>}
            <button onClick={fetchScorers} disabled={loading} style={{ background:"#0f1e30",border:`1px solid ${C.border}`,color:C.sky,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer" }}>{loading?"⏳":"🔄"}</button>
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {[["goals","⚽ Goals"],["assists","🅰 Assists"]].map(([id,label])=>(
            <button key={id} onClick={()=>setView(id)} style={{ flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:view===id?C.sky:"#0f1e30",color:view===id?"#070e1a":C.muted }}>{label}</button>
          ))}
        </div>
        <div style={{ color:C.muted,fontSize:10,marginTop:6 }}>ESPN + AI · {seasonStarted?"Live data":"Season starts 21 Aug 2026 — predicted key players shown"}</div>
      </div>

      {!seasonStarted&&!loading&&<div style={{ ...ST.card,textAlign:"center",padding:16 }}><div style={{ fontSize:11,color:C.gold,marginBottom:4 }}>📅 Season starts 21 Aug 2026</div><div style={{ fontSize:11,color:C.muted }}>Showing predicted key players. Updates live once season begins.</div></div>}

      {displayList.map((s,i)=>{
        const isMCity=s.team==="Manchester City";
        const statVal=view==="assists"?s.assists:s.goals;
        return (
          <div key={`${s.name}-${i}`} style={{ ...ST.card,padding:"10px 12px",borderColor:isMCity?C.sky:C.border,background:isMCity?"#0a1826":C.card }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:32,height:32,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,background:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7f32":"#0f1e30",color:i<3?"#070e1a":C.muted }}>{s.rank}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:800,color:isMCity?C.sky:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{s.name}{isMCity&&<span style={{ marginLeft:6,fontSize:9,color:C.sky }}>🩵</span>}</div>
                <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>{BADGE[s.team]||"⚽"} {s.team}</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontSize:22,fontWeight:900,color:i===0?C.gold:C.sky,lineHeight:1 }}>{view==="assists"?s.assists:s.goals}</div>
                <div style={{ fontSize:9,color:C.muted,marginTop:2 }}>{view==="assists"?"AST":"GLS"}</div>
              </div>
            </div>
            {statVal>0&&<div style={{ marginTop:8,height:3,background:C.border,borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",borderRadius:2,width:`${Math.min(100,(statVal/(displayList[0]?(view==="assists"?displayList[0].assists:displayList[0].goals):1))*100)}%`,background:i===0?C.gold:isMCity?C.sky:C.accent }} /></div>}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: RESULTS TRACKER
// ============================================================
function ResultsTrackerView({ liveResults=[] }) {
  const [tracked,setTracked]=useState([]);
  const [filter,setFilter]=useState("all");

  useEffect(()=>{
    const played=liveResults.filter(m=>m.status==="FT"&&m.homeScore!==null);
    setTracked(played.map(m=>{
      const pred=predictMatch(m.home,m.away,true);
      const [ph,pa]=pred.predictedScore.split("-").map(Number);
      const predOut=ph>pa?"home":pa>ph?"away":"draw";
      const realOut=m.homeScore>m.awayScore?"home":m.awayScore>m.homeScore?"away":"draw";
      return{id:m.id,home:m.home,away:m.away,realScore:`${m.homeScore}-${m.awayScore}`,realOut,predScore:pred.predictedScore,predOut,pHome:pred.probabilities.homeWin,pDraw:pred.probabilities.draw,pAway:pred.probabilities.awayWin,outcomeCorrect:realOut===predOut,scoreCorrect:m.homeScore===ph&&m.awayScore===pa};
    }));
  },[liveResults]);

  const played=tracked.filter(m=>m.realScore),correct=played.filter(m=>m.outcomeCorrect),acc=played.length>0?Math.round(correct.length/played.length*100):0;
  const filtered=filter==="correct"?tracked.filter(m=>m.outcomeCorrect):filter==="wrong"?tracked.filter(m=>!m.outcomeCorrect):tracked;

  return (
    <div style={{ padding:12 }}>
      <div style={ST.card}>
        <div style={ST.lbl}>📈 PREDICTION ACCURACY — 2026/27</div>
        <div style={{ display:"flex",gap:6,marginBottom:10 }}>
          {[{label:"PLAYED",value:played.length},{label:"CORRECT",value:correct.length,color:C.green},{label:"ACCURACY",value:`${acc}%`,color:acc>=55?C.green:acc>=40?C.gold:C.red},{label:"SCORE HITS",value:played.filter(m=>m.scoreCorrect).length,color:C.gold}].map(s=>(
            <div key={s.label} style={{ flex:1,background:"#070e1a",borderRadius:8,padding:"8px 4px",textAlign:"center" }}>
              <div style={{ color:C.muted,fontSize:8,fontWeight:700 }}>{s.label}</div>
              <div style={{ color:s.color||C.text,fontSize:16,fontWeight:900,marginTop:3 }}>{s.value}</div>
            </div>
          ))}
        </div>
        {played.length>0&&<div style={{ height:4,borderRadius:2,background:C.border,overflow:"hidden" }}><div style={{ height:"100%",width:`${acc}%`,background:acc>=55?C.green:acc>=40?C.gold:C.red,borderRadius:2 }} /></div>}
      </div>
      <div style={{ display:"flex",gap:5,marginBottom:12 }}>
        {[["all","All"],["correct","✅ Correct"],["wrong","❌ Wrong"]].map(([id,label])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{ flex:1,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:filter===id?C.sky:"#0f1e30",color:filter===id?"#070e1a":C.muted }}>{label}</button>
        ))}
      </div>
      {filtered.length===0&&<div style={{ ...ST.card,textAlign:"center",color:C.muted,padding:28 }}><div style={{ fontSize:24,marginBottom:8 }}>🏁</div>{tracked.length===0?"Tracking starts when the 2026/27 season kicks off.":"No matches in this filter."}</div>}
      {filtered.map(m=>(
        <div key={m.id} style={{ ...ST.card,borderColor:m.outcomeCorrect?"#1e3a5f":"#7f1d1d",background:m.outcomeCorrect?"#07101e":"#0f0505" }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:6 }}>
            <span style={{ color:C.muted }}>Premier League 2026/27</span>
            <span style={{ color:m.outcomeCorrect?C.green:C.red,fontWeight:800 }}>{m.outcomeCorrect?"✅ CORRECT":"❌ WRONG"}{m.scoreCorrect?" 🎯":""}</span>
          </div>
          <div style={{ textAlign:"center",fontSize:13,fontWeight:800,marginBottom:10 }}>{BADGE[m.home]||"⚽"} {m.home} <span style={{ color:C.muted,fontWeight:400 }}>vs</span> {BADGE[m.away]||"⚽"} {m.away}</div>
          <div style={{ display:"flex",gap:8 }}>
            {[{label:"REAL",score:m.realScore,color:C.sky},{label:"PREDICTED",score:m.predScore,color:C.gold}].map(col=>(
              <div key={col.label} style={{ flex:1,background:"#070e1a",borderRadius:8,padding:"10px 6px",textAlign:"center" }}>
                <div style={{ color:C.muted,fontSize:9,fontWeight:700 }}>{col.label}</div>
                <div style={{ fontSize:20,fontWeight:900,color:col.color,marginTop:4 }}>{col.score}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================

// ============================================================
// TAB: SWEEPSTAKE — Friends league, champion pick, match picks
// Storage: JSONbin.io (free tier, no backend needed)
// ============================================================
const JSONBIN_BASE = "https://api.jsonbin.io/v3";
const JBIN_KEY = "$2a$10$CXn8Xo3IaeZZLs4s3OOUGOCjLOChP5sH5IETANfEDXiRVsCycGAMG";

// Points system
const PTS = { exactScore:5, correctOutcome:2, champCorrect:10, champWrong:0 };

function genCode() { return Math.random().toString(36).substring(2,8).toUpperCase(); }

function calcPoints(member, liveResults=[]) {
  let pts = 0;
  const picks = member.matchPicks || {};
  liveResults.forEach(m => {
    if (m.status !== "FT" || m.homeScore === null) return;
    const pick = picks[`${m.home}-${m.away}`];
    if (!pick) return;
    const realOut = m.homeScore > m.awayScore ? "home" : m.awayScore > m.homeScore ? "away" : "draw";
    const pickOut = pick.homeScore > pick.awayScore ? "home" : pick.awayScore > pick.homeScore ? "away" : "draw";
    if (pick.homeScore === m.homeScore && pick.awayScore === m.awayScore) pts += PTS.exactScore;
    else if (realOut === pickOut) pts += PTS.correctOutcome;
  });
  return pts + (member.manualPts || 0);
}

function SweepstakeView({ liveResults = [] }) {
  const [screen, setScreen] = useState("home"); // home | room
  const [myName, setMyName] = useState(()=>localStorage.getItem("epl_sw_name")||"");
  const [champPick, setChampPick] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [binId, setBinId] = useState("");
  const [myId, setMyId] = useState("");
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matchPicks, setMatchPicks] = useState({});
  const [pickingMatch, setPickingMatch] = useState(null);
  const [homeScoreInput, setHomeScoreInput] = useState("1");
  const [awayScoreInput, setAwayScoreInput] = useState("0");
  const [myRooms, setMyRooms] = useState(()=>{ try{return JSON.parse(localStorage.getItem("epl_my_rooms")||"[]");}catch{return[];} });
  const [copied, setCopied] = useState(false);

  const jH = { "Content-Type":"application/json","X-Master-Key":JBIN_KEY,"X-Access-Key":JBIN_KEY };
  const LOOKUP_KEY = "epl2027_lookup";

  const getOrCreateLookup = async () => {
    const stored = localStorage.getItem(LOOKUP_KEY);
    if (stored) {
      try {
        const r = await fetch(`${JSONBIN_BASE}/b/${stored}/latest`, { headers: jH });
        if (r.ok) return { id: stored, data: (await r.json()).record || {} };
      } catch {}
    }
    const r = await fetch(`${JSONBIN_BASE}/b`, {
      method:"POST", headers:{...jH,"X-Bin-Name":"epl2027-lookup","X-Bin-Private":"false"},
      body: JSON.stringify({})
    });
    if (!r.ok) throw new Error("Could not create room directory");
    const data = await r.json();
    const newId = data.metadata.id;
    localStorage.setItem(LOOKUP_KEY, newId);
    return { id: newId, data: {} };
  };

  const updateLookup = async (code, bid) => {
    try {
      const { id, data } = await getOrCreateLookup();
      await fetch(`${JSONBIN_BASE}/b/${id}`, { method:"PUT", headers:jH, body:JSON.stringify({...data,[code]:bid}) });
    } catch {}
  };

  const saveRooms = (rooms) => { localStorage.setItem("epl_my_rooms", JSON.stringify(rooms)); setMyRooms(rooms); };

  const createRoom = async () => {
    if (!myName.trim()) { setError("Enter your name first"); return; }
    setLoading(true); setError("");
    try {
      const code = genCode();
      const id = genCode();
      const roomData = {
        code, name:`${myName.trim()}\'s EPL 2026/27`,
        createdAt: new Date().toISOString(),
        members:[{ id, name:myName.trim(), champPick:champPick||null, matchPicks:{}, joinedAt:new Date().toISOString() }]
      };
      const resp = await fetch(`${JSONBIN_BASE}/b`, {
        method:"POST", headers:{...jH,"X-Bin-Name":`epl27-${code}`,"X-Bin-Private":"false"},
        body:JSON.stringify(roomData)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const newBinId = data.metadata.id;
      await updateLookup(code, newBinId);
      setBinId(newBinId); setRoomCode(code); setMyId(id); setRoom(roomData);
      localStorage.setItem("epl_sw_name", myName.trim());
      localStorage.setItem(`epl_id_${code}`, id);
      saveRooms([...myRooms.filter(r=>r.code!==code), { code, binId:newBinId, myId:id, name:roomData.name }]);
      setScreen("room");
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!myName.trim()) { setError("Enter your name first"); return; }
    if (!joinCode.trim()) { setError("Enter room code"); return; }
    setLoading(true); setError("");
    try {
      const code = joinCode.trim().toUpperCase();
      const { data: lookup } = await getOrCreateLookup();
      const foundBinId = lookup[code];
      if (!foundBinId) throw new Error("Room not found. Check the code and try again.");
      const resp = await fetch(`${JSONBIN_BASE}/b/${foundBinId}/latest`, { headers:jH });
      const roomData = (await resp.json()).record;
      const storedId = localStorage.getItem(`epl_id_${code}`);
      const existing = roomData.members?.find(m => m.id === storedId || m.name.toLowerCase() === myName.trim().toLowerCase());
      let id = existing ? existing.id : genCode();
      if (!existing) {
        roomData.members = [...(roomData.members||[]), { id, name:myName.trim(), champPick:champPick||null, matchPicks:{}, joinedAt:new Date().toISOString() }];
        await fetch(`${JSONBIN_BASE}/b/${foundBinId}`, { method:"PUT", headers:jH, body:JSON.stringify(roomData) });
      }
      localStorage.setItem("epl_sw_name", myName.trim());
      localStorage.setItem(`epl_id_${code}`, id);
      setBinId(foundBinId); setRoomCode(code); setMyId(id); setRoom(roomData);
      saveRooms([...myRooms.filter(r=>r.code!==code), { code, binId:foundBinId, myId:id, name:roomData.name }]);
      setScreen("room");
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const refreshRoom = async () => {
    if (!binId) return;
    try {
      const resp = await fetch(`${JSONBIN_BASE}/b/${binId}/latest`, { headers:jH });
      const data = (await resp.json()).record;
      setRoom(data);
    } catch {}
  };

  useEffect(() => {
    if (screen !== "room" || !binId) return;
    const iv = setInterval(refreshRoom, 30000);
    return () => clearInterval(iv);
  }, [screen, binId]);

  const savePick = async () => {
    if (!binId || !myId || !pickingMatch) return;
    const key = `${pickingMatch.home}-${pickingMatch.away}`;
    const pick = { homeScore:Number(homeScoreInput), awayScore:Number(awayScoreInput), pickedAt:new Date().toISOString() };
    const newPicks = { ...matchPicks, [key]:pick };
    setMatchPicks(newPicks);
    setPickingMatch(null);
    setLoading(true);
    try {
      const fresh = await fetch(`${JSONBIN_BASE}/b/${binId}/latest`, { headers:jH });
      const freshData = (await fresh.json()).record;
      const updated = {
        ...freshData,
        members: freshData.members.map(m => m.id === myId ? { ...m, matchPicks:{...(m.matchPicks||{}),[key]:pick} } : m)
      };
      await fetch(`${JSONBIN_BASE}/b/${binId}`, { method:"PUT", headers:jH, body:JSON.stringify(updated) });
      setRoom(updated);
    } catch(e) { setError("Save failed — check connection"); }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  const shareRoom = () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    if (navigator.share) {
      navigator.share({ title:"EPL 2026/27 Sweepstake", text:`Join my EPL 2026/27 sweepstake room! Code: ${roomCode}`, url });
    } else {
      navigator.clipboard?.writeText(url);
      setCopied(true); setTimeout(()=>setCopied(false),2000);
    }
  };

  // Leaderboard
  const leaderboard = useMemo(() => {
    if (!room?.members) return [];
    return [...room.members].map(m => ({
      ...m,
      pts: calcPoints(m, liveResults),
      picks: Object.keys(m.matchPicks||{}).length,
    })).sort((a,b)=>b.pts-a.pts);
  }, [room, liveResults]);

  const myMember = room?.members?.find(m=>m.id===myId);
  const myPicks = myMember?.matchPicks || {};

  // Upcoming EPL matches (from live results feed, but also show upcoming)
  const upcoming = liveResults.filter(m=>m.status==="NS"||m.status==="LIVE").slice(0,10);
  const finished = liveResults.filter(m=>m.status==="FT").slice(-5);

  // --- HOME SCREEN ---
  if (screen === "home") return (
    <div style={{ padding:12 }}>
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#0a1826,#0f2040)", border:`1px solid ${C.sky}40`, borderRadius:14, padding:20, textAlign:"center", marginBottom:14 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🏆</div>
        <div style={{ fontSize:20, fontWeight:900, background:`linear-gradient(90deg,${C.sky},#ffffff)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>
          EPL Sweepstake
        </div>
        <div style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>
          Pick scores. Back your club. Outsmart your mates.{"
"}The ultimate EPL season long competition.
        </div>
      </div>

      {/* How it works */}
      <div style={{ ...ST.card, marginBottom:14 }}>
        <div style={ST.lbl}>HOW IT WORKS</div>
        {[
          ["🎯","Pick your title winner","Choose which team lifts the trophy at the end of the season"},
          ["⚽","Predict match scores","Pick scorelines for upcoming EPL fixtures before KO"],
          ["🏅","Earn points","Exact score = 5pts · Correct result = 2pts · Right champion = 10pts"],
          ["🤜","Beat your mates","Create a private room, share the code, compete all season"],
        ].map(([icon,title,desc])=>(
          <div key={title} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"8px 0",borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:20,flexShrink:0 }}>{icon}</span>
            <div>
              <div style={{ fontSize:12,fontWeight:800,color:C.text }}>{title}</div>
              <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Name + champ pick */}
      <div style={ST.card}>
        <div style={ST.lbl}>YOUR DETAILS</div>
        <input style={ST.input} placeholder="Your name" value={myName} onChange={e=>setMyName(e.target.value)} />
        <div style={{ ...ST.lbl, marginTop:10 }}>PICK YOUR 2026/27 CHAMPION</div>
        <select value={champPick} onChange={e=>setChampPick(e.target.value)} style={ST.input}>
          <option value="">— Pick a team —</option>
          {TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}</option>)}
        </select>
        {champPick && (
          <div style={{ marginTop:8,padding:"8px 12px",background:"#0a1826",borderRadius:8,fontSize:12,color:C.sky,fontWeight:700 }}>
            🏆 You back {BADGE[champPick]} {champPick} to win the league!
          </div>
        )}
      </div>

      {/* Create / Join */}
      <div style={{ display:"flex",gap:8,marginBottom:10 }}>
        <button onClick={createRoom} disabled={loading||!myName.trim()} style={{ ...ST.btn,marginTop:0,flex:1,opacity:(!myName.trim()||loading)?0.5:1 }}>
          {loading?"⏳...":"🆕 Create Room"}
        </button>
      </div>

      <div style={ST.card}>
        <div style={ST.lbl}>JOIN A ROOM</div>
        <input style={ST.input} placeholder="Enter room code (e.g. ABC123)" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} />
        <button onClick={joinRoom} disabled={loading||!myName.trim()||!joinCode.trim()} style={{ ...ST.btn,opacity:(!myName.trim()||!joinCode.trim()||loading)?0.5:1 }}>
          {loading?"⏳...":"🚪 Join Room"}
        </button>
      </div>

      {/* Previous rooms */}
      {myRooms.length>0&&(
        <div style={ST.card}>
          <div style={ST.lbl}>MY ROOMS</div>
          {myRooms.map(r=>(
            <div key={r.code} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize:12,fontWeight:800 }}>{r.name||r.code}</div>
                <div style={{ fontSize:10,color:C.muted }}>Code: <span style={{ color:C.sky,fontWeight:700 }}>{r.code}</span></div>
              </div>
              <button onClick={()=>{ setBinId(r.binId);setRoomCode(r.code);setMyId(r.myId);setLoading(true);
                fetch(`${JSONBIN_BASE}/b/${r.binId}/latest`,{headers:jH}).then(res=>res.json()).then(data=>{setRoom(data.record);setScreen("room");setLoading(false);}).catch(()=>setLoading(false));
              }} style={{ background:"#0f1e30",border:`1px solid ${C.border}`,color:C.sky,borderRadius:7,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                Enter →
              </button>
            </div>
          ))}
        </div>
      )}

      {error&&<div style={{ color:C.red,fontSize:12,marginTop:8,padding:"8px 12px",background:"#1a0505",borderRadius:8 }}>⚠️ {error}</div>}
    </div>
  );

  // --- ROOM SCREEN ---
  const myRank = leaderboard.findIndex(m=>m.id===myId)+1;

  return (
    <div style={{ padding:12 }}>
      {/* Room header */}
      <div style={{ background:"linear-gradient(135deg,#0a1826,#0f2040)",border:`1px solid ${C.sky}40`,borderRadius:14,padding:16,marginBottom:12 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:14,fontWeight:900,color:C.text }}>{room?.name||"My Room"}</div>
            <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>
              {room?.members?.length||0} members · Code: <span style={{ color:C.sky,fontWeight:800 }}>{roomCode}</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:6 }}>
            <button onClick={copyCode} style={{ background:"#0f1e30",border:`1px solid ${C.border}`,color:copied?C.green:C.sky,borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
              {copied?"✅":"📋"} {copied?"Copied!":"Copy"}
            </button>
            <button onClick={shareRoom} style={{ background:C.sky,border:"none",color:"#070e1a",borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
              📤 Share
            </button>
          </div>
        </div>
        {myMember?.champPick&&(
          <div style={{ marginTop:10,padding:"6px 10px",background:"#070e1a",borderRadius:8,fontSize:11,color:C.gold }}>
            🏆 Your pick: <strong>{BADGE[myMember.champPick]} {myMember.champPick}</strong>
          </div>
        )}
        <div style={{ display:"flex",gap:6,marginTop:10 }}>
          <button onClick={refreshRoom} style={{ flex:1,background:"#0f1e30",border:`1px solid ${C.border}`,color:C.accent,borderRadius:7,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer" }}>🔄 Refresh</button>
          <button onClick={()=>setScreen("home")} style={{ flex:1,background:"#0f1e30",border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer" }}>← Rooms</button>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={ST.card}>
        <div style={ST.lbl}>🏅 LEADERBOARD</div>
        {leaderboard.length===0&&<div style={{ color:C.muted,fontSize:12,textAlign:"center",padding:12 }}>No members yet. Share the code!</div>}
        {leaderboard.map((m,i)=>{
          const isMe = m.id===myId;
          const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
          return (
            <div key={m.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:`1px solid ${C.border}`,background:isMe?"#0a1826":"transparent",borderRadius:isMe?8:0,paddingLeft:isMe?8:0 }}>
              <div style={{ fontSize:16,width:28,textAlign:"center",flexShrink:0 }}>{medal}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:isMe?900:700,color:isMe?C.sky:C.text,display:"flex",alignItems:"center",gap:6 }}>
                  {m.name}{isMe&&<span style={{ fontSize:9,color:C.sky,background:"#0f1e30",padding:"1px 5px",borderRadius:99 }}>YOU</span>}
                </div>
                <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>
                  {m.champPick?`🏆 ${BADGE[m.champPick]||""} ${m.champPick}`:"No champion pick"}
                  {" · "}{m.picks} pick{m.picks!==1?"s":""}
                </div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontSize:20,fontWeight:900,color:i===0?C.gold:isMe?C.sky:C.text }}>{m.pts}</div>
                <div style={{ fontSize:9,color:C.muted }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Points guide */}
      <div style={{ ...ST.card,background:"#07101e",borderColor:"#1a2d42" }}>
        <div style={ST.lbl}>POINTS SYSTEM</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 0",fontSize:11 }}>
          <span style={{ color:C.muted }}>Exact score</span><span style={{ textAlign:"right",color:C.gold,fontWeight:800 }}>+5 pts</span>
          <span style={{ color:C.muted }}>Correct result</span><span style={{ textAlign:"right",color:C.green,fontWeight:800 }}>+2 pts</span>
          <span style={{ color:C.muted }}>Right champion</span><span style={{ textAlign:"right",color:C.sky,fontWeight:800 }}>+10 pts</span>
          <span style={{ color:C.muted }}>Wrong champion</span><span style={{ textAlign:"right",color:C.muted }}>+0 pts</span>
        </div>
      </div>

      {/* My picks — upcoming matches */}
      <div style={ST.card}>
        <div style={ST.lbl}>⚽ PICK UPCOMING MATCHES</div>
        {upcoming.length===0&&(
          <div style={{ color:C.muted,fontSize:12,textAlign:"center",padding:12 }}>
            No upcoming fixtures available. Refresh Live Scores tab for latest matches.
          </div>
        )}
        {upcoming.map(m=>{
          const key = `${m.home}-${m.away}`;
          const myPick = myPicks[key];
          const isLive = m.status==="LIVE";
          return (
            <div key={key} style={{ padding:"10px 0",borderTop:`1px solid ${C.border}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                <div style={{ fontSize:12,fontWeight:700 }}>{BADGE[m.home]||"⚽"} {m.home} vs {BADGE[m.away]||"⚽"} {m.away}</div>
                <span style={{ fontSize:10,color:isLive?C.green:C.muted,fontWeight:isLive?800:400 }}>{isLive?`🔴 LIVE ${m.minute||""}'`:"Upcoming"}</span>
              </div>
              {myPick?(
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ fontSize:12,color:C.sky,fontWeight:800 }}>Your pick: {myPick.homeScore}–{myPick.awayScore}</div>
                  {!isLive&&<button onClick={()=>{setPickingMatch(m);setHomeScoreInput(String(myPick.homeScore));setAwayScoreInput(String(myPick.awayScore));}} style={{ background:"#0f1e30",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer" }}>Edit</button>}
                </div>
              ):(
                <button onClick={()=>{setPickingMatch(m);setHomeScoreInput("1");setAwayScoreInput("0");}} disabled={isLive} style={{ ...ST.btn,marginTop:0,padding:"7px 0",fontSize:11,opacity:isLive?0.4:1 }}>
                  {isLive?"Match started":"+ Pick Score"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent results with my picks */}
      {finished.length>0&&(
        <div style={ST.card}>
          <div style={ST.lbl}>📊 RECENT RESULTS</div>
          {finished.map(m=>{
            const key=`${m.home}-${m.away}`;
            const myPick=myPicks[key];
            const realOut=m.homeScore>m.awayScore?"home":m.awayScore>m.homeScore?"away":"draw";
            const pickOut=myPick?myPick.homeScore>myPick.awayScore?"home":myPick.awayScore>myPick.homeScore?"away":"draw":null;
            const exact=myPick&&myPick.homeScore===m.homeScore&&myPick.awayScore===m.awayScore;
            const correct=pickOut===realOut;
            return (
              <div key={key} style={{ padding:"8px 0",borderTop:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}>
                  <span style={{ fontWeight:700 }}>{m.home} {m.homeScore}–{m.awayScore} {m.away}</span>
                  {myPick&&<span style={{ color:exact?C.gold:correct?C.green:C.red,fontWeight:800 }}>{exact?"🎯 +5":correct?"✅ +2":"❌ 0"}</span>}
                </div>
                {myPick&&<div style={{ fontSize:10,color:C.muted,marginTop:2 }}>Your pick: {myPick.homeScore}–{myPick.awayScore}</div>}
                {!myPick&&<div style={{ fontSize:10,color:C.muted,marginTop:2 }}>No pick made</div>}
              </div>
            );
          })}
        </div>
      )}

      {error&&<div style={{ color:C.red,fontSize:12,marginTop:8,padding:"8px 12px",background:"#1a0505",borderRadius:8 }}>⚠️ {error}</div>}

      {/* Score picker modal */}
      {pickingMatch&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={()=>setPickingMatch(null)}>
          <div style={{ background:C.card,borderRadius:"16px 16px 0 0",border:`1px solid ${C.border}`,padding:20,width:"100%",maxWidth:500 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <div style={{ fontWeight:800,fontSize:14 }}>Pick Score</div>
              <button onClick={()=>setPickingMatch(null)} style={{ background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ textAlign:"center",fontSize:14,fontWeight:800,marginBottom:16 }}>
              {BADGE[pickingMatch.home]} {pickingMatch.home} <span style={{ color:C.muted }}>vs</span> {BADGE[pickingMatch.away]} {pickingMatch.away}
            </div>
            <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginBottom:16 }}>
              <input value={homeScoreInput} onChange={e=>setHomeScoreInput(e.target.value)} style={{ ...ST.input,width:64,textAlign:"center",fontSize:28,fontWeight:900,padding:"10px 4px" }} type="number" min="0" max="20" />
              <span style={{ fontSize:24,fontWeight:900,color:C.muted }}>–</span>
              <input value={awayScoreInput} onChange={e=>setAwayScoreInput(e.target.value)} style={{ ...ST.input,width:64,textAlign:"center",fontSize:28,fontWeight:900,padding:"10px 4px" }} type="number" min="0" max="20" />
            </div>
            <div style={{ fontSize:11,color:C.muted,textAlign:"center",marginBottom:12 }}>
              {BADGE[pickingMatch.home]} {pickingMatch.home} {homeScoreInput} – {awayScoreInput} {pickingMatch.away} {BADGE[pickingMatch.away]}
            </div>
            <button onClick={savePick} disabled={loading} style={{ ...ST.btn,marginTop:0 }}>{loading?"⏳ Saving...":"✅ Lock In Pick"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// MAIN APP — sidebar layout matching WC2026
// ============================================================
export default function App() {
  const [tab, setTab] = useState("sweep");
  const [modelVersion, setModelVersion] = useState(0);
  const [liveResults, setLiveResults] = useState([]);
  const [isMobile, setIsMobile] = useState(()=>typeof window!=="undefined"?window.innerWidth<900:false);
  const [sidebarOpen, setSidebarOpen] = useState(()=>typeof window!=="undefined"?window.innerWidth>=900:true);
  const [installReady, setInstallReady] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(()=>{
    const onResize=()=>{ const mobile=window.innerWidth<900; setIsMobile(mobile); setSidebarOpen(!mobile); };
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  // PWA cache buster
  useEffect(()=>{
    const KEY="epl2027_build",prev=localStorage.getItem(KEY);
    if(prev===BUILD_VERSION) return;
    try{localStorage.setItem(KEY,BUILD_VERSION);}catch(_){}
    if(!prev) return;
    (async()=>{ try{ if(window.caches?.keys){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)));} if(navigator.serviceWorker?.getRegistrations){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));} }catch(_){} window.location.reload(); })();
  },[]);

  // PWA install
  useEffect(()=>{
    const handler=()=>setInstallReady(true);
    window.addEventListener("pwaInstallReady",handler);
    if(window.deferredInstallPrompt) setInstallReady(true);
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone=window.navigator.standalone===true;
    if(isIOS&&!isStandalone) setShowIOSPrompt(true);
    return()=>window.removeEventListener("pwaInstallReady",handler);
  },[]);

  const handleInstall=async()=>{
    if(window.deferredInstallPrompt){
      window.deferredInstallPrompt.prompt();
      const{outcome}=await window.deferredInstallPrompt.userChoice;
      if(outcome==="accepted"){setInstallReady(false);setInstallDismissed(true);}
      window.deferredInstallPrompt=null;
    }
  };

  const handleLiveUpdate=useCallback((matches)=>{ setLiveResults(matches); },[]);
  const handleStrengthOverride=useCallback((overrides)=>{ STRENGTH_OVERRIDES=overrides; setModelVersion(n=>n+1); },[]);

  const tabs = [
    { id:"sweep",    icon:"🎯", full:"Sweepstake" },
    { id:"live",     icon:"🔴", full:"Live Scores" },
    { id:"table",    icon:"🏆", full:"Season Table" },
    { id:"rankings", icon:"⚡", full:"Power Rankings" },
    { id:"intel",    icon:"🏥", full:"Match Intel" },
    { id:"predict",  icon:"🔮", full:"Predict Match" },
    { id:"teams",    icon:"🔍", full:"Team Intel" },
    { id:"scorers",  icon:"🥅", full:"Top Scorers" },
    { id:"results",  icon:"📊", full:"Results Tracker" },
  ];

  const activeLabel=tabs.find(t=>t.id===tab)?.full||"";
  const selectTab=(id)=>{ setTab(id); if(isMobile) setSidebarOpen(false); };

  return (
    <div style={ST.container}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        select option{background:#0c1826;color:#f0f8ff;}
        *{box-sizing:border-box;}
        html,body,#root{background:#070e1a;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#070e1a;}
        ::-webkit-scrollbar-thumb{background:#1a2d42;border-radius:2px;}
      `}</style>

      {/* PWA install banner */}
      {installReady&&!installDismissed&&(
        <div style={{ background:"#0c1826",borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:22 }}>⚽</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:800,color:C.text }}>Install EPL 2026/27</div>
            <div style={{ fontSize:10,color:C.muted }}>Add to home screen for app experience</div>
          </div>
          <button onClick={handleInstall} style={{ background:C.sky,color:"#070e1a",border:"none",borderRadius:7,padding:"7px 14px",fontWeight:800,fontSize:12,cursor:"pointer" }}>Install</button>
          <button onClick={()=>setInstallDismissed(true)} style={{ background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:"0 4px" }}>✕</button>
        </div>
      )}
      {showIOSPrompt&&!installDismissed&&(
        <div style={{ background:"#0a1826",borderBottom:`1px solid ${C.border}`,padding:"10px 14px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:12,fontWeight:800,color:C.text }}>📲 Install EPL 2026/27</div>
            <button onClick={()=>setInstallDismissed(true)} style={{ background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ fontSize:11,color:C.muted,lineHeight:1.6 }}>Tap <strong style={{ color:C.sky }}>Share</strong> (□↑) then <strong style={{ color:C.sky }}>"Add to Home Screen"</strong></div>
        </div>
      )}

      {/* Topbar */}
      <div style={ST.topbar}>
        <button style={ST.burger} onClick={()=>setSidebarOpen(o=>!o)}>☰</button>
        <div style={ST.topbarTitle}>
          <span>🩵 EPL 2026/27</span>
          <span style={ST.topbarSub}>· {activeLabel}</span>
        </div>
      </div>
      {/* Hero tagline — only on sweepstake tab */}
      {tab==="sweep"&&(
        <div style={{ background:"linear-gradient(90deg,#050d1a,#0a1530,#050d1a)",borderBottom:`1px solid ${C.border}`,padding:"10px 16px",textAlign:"center" }}>
          <div style={{ fontSize:13,fontWeight:800,color:C.sky,letterSpacing:0.3 }}>
            🏆 Be Competitive · Support Your Club · Outsmart Your Friends
          </div>
        </div>
      )}

      <div style={ST.shell}>
        {/* Mobile backdrop */}
        {isMobile&&sidebarOpen&&<div style={ST.overlay} onClick={()=>setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside style={ST.sidebar(sidebarOpen,isMobile)}>
          <div style={ST.sideBrand}>
            <div style={ST.sideTitle}>Premier League</div>
            <div style={ST.sideSub}>2026/27 · Predict · Compete · Brag 🏆</div>
            <div style={{ marginTop:8,fontSize:9,color:C.muted }}>🏆 Arsenal (Champions)</div>
            <div style={{ fontSize:9,color:C.sky,marginTop:2 }}>↑ Coventry · Ipswich · Hull</div>
          </div>
          <nav style={ST.sideNav}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>selectTab(t.id)} style={ST.sideBtn(tab===t.id)}>
                <span style={ST.sideIcon}>{t.icon}</span>
                <span>{t.full}</span>
              </button>
            ))}
          </nav>
          <div style={ST.sideFooter}>{"© 2026 EPL Predictor\nAll rights reserved.\n"+BUILD_VERSION}</div>
        </aside>

        {/* Main content */}
        <main style={ST.content}>
          {tab==="sweep"    && <SweepstakeView liveResults={liveResults} />}
          {tab==="live"     && <LiveScoresView onLiveUpdate={handleLiveUpdate} />}
          {tab==="table"    && <SeasonTableView />}
          {tab==="rankings" && <PowerRankingsView />}
          {tab==="intel"    && <IntelView onStrengthOverride={handleStrengthOverride} />}
          {tab==="predict"  && <PredictView />}
          {tab==="teams"    && <TeamIntelView />}
          {tab==="scorers"  && <TopScorersView />}
          {tab==="results"  && <ResultsTrackerView liveResults={liveResults} />}

          <div style={{ borderTop:`1px solid ${C.border}`,padding:"16px 16px 32px",marginTop:8,background:"#070e1a" }}>
            <div style={{ fontSize:10,color:C.muted,textAlign:"center",lineHeight:1.8 }}>
              © 2026 EPL 2026/27 Predictor. All rights reserved.{"\n"}AI predictions for entertainment purposes. Always gamble responsibly.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
