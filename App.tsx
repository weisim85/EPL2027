import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ============================================================
// DESIGN TOKENS
// ============================================================
const C = {
  bg: "#080f0a", card: "#0d1a10", card2: "#111f14",
  emerald: "#10b981", gold: "#f59e0b", purple: "#7c3aed",
  red: "#ef4444", muted: "#6b7280", border: "#1a2e1e",
  text: "#f0fdf4", sub: "#86efac", accent: "#34d399",
};
const S = {
  app:   { background: C.bg, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: C.text },
  hdr:   { background: "linear-gradient(160deg,#050d07 0%,#0a1f0d 60%,#050d07 100%)", borderBottom: `1px solid ${C.border}`, padding: "18px 16px 14px", textAlign: "center" },
  nav:   { display: "flex", gap: 5, padding: "9px 10px", borderBottom: `1px solid ${C.border}`, background: C.card, overflowX: "auto" },
  nb:    (a) => ({ padding: "7px 13px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: a ? C.emerald : "#162219", color: a ? "#080f0a" : C.muted, whiteSpace: "nowrap", transition: "all 0.15s" }),
  card:  { background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 14, marginBottom: 10 },
  inp:   { background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "9px 12px", fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box", appearance: "none" },
  btn:   { background: C.emerald, color: "#080f0a", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 800, cursor: "pointer", fontSize: 13, width: "100%", marginTop: 8 },
  th:    { color: C.muted, textAlign: "left", padding: "4px 6px", fontWeight: 600, fontSize: 11 },
  td:    { padding: "7px 6px", borderTop: `1px solid ${C.border}`, fontSize: 12 },
  lbl:   { color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 5 },
};

// ============================================================
// 2026/27 EPL TEAMS — 17 retained + 3 promoted
// OUT: West Ham, Burnley, Wolverhampton
// IN:  Coventry City, Ipswich Town, Hull City
// ============================================================
const BADGE = {
  "Arsenal":           "🔴",
  "Aston Villa":       "🟣",
  "Bournemouth":       "🍒",
  "Brentford":         "🐝",
  "Brighton":          "🔵",
  "Chelsea":           "💙",
  "Coventry City":     "🩵",
  "Crystal Palace":    "🦅",
  "Everton":           "🔵",
  "Fulham":            "⬛",
  "Hull City":         "🐯",
  "Ipswich Town":      "🔵",
  "Leeds United":      "⬜",
  "Liverpool":         "🔴",
  "Manchester City":   "🩵",
  "Manchester United": "👹",
  "Newcastle United":  "⚫",
  "Nottingham Forest": "🌲",
  "Sunderland":        "🔴",
  "Tottenham Hotspur": "🐓",
};

// ============================================================
// STRENGTH RATINGS 2026/27
// Based on: 2025/26 finish + key transfers this summer
// Arsenal  — Champions, added Hincapie, lost nothing major        → 90
// Man City — 2nd, post-Pep rebuild, added Reijnders/Cherki/Donnarumma → 87
// Man Utd  — 3rd! Carrick era, Sesko+Mbeumo+Cunha added last summer → 85
// Aston Villa — 4th, Europa League winners, Emery squad deepening → 83
// Liverpool  — 5th, lost Salah+Robertson, new manager, added Wirtz/Isak last summer → 82
// Bournemouth — 6th, Europa League, settled system              → 77
// Sunderland  — 7th, Europa League, impressive but thin squad    → 72
// Brighton    — 8th, Conference League, lost van Hecke+Robertson → 73
// Crystal Palace — mid-table, Conference League winners          → 70
// Chelsea    — new manager Xabi Alonso, restructuring            → 74
// Brentford  — solid midtable, Igor Thiago 22 goals last season  → 69
// Newcastle  — sold Gordon to Barca, PSR-constrained            → 74
// Tottenham  — volatile, signed Robertson/Senesi/van Hecke       → 72
// Everton    — survived, new stadium, steady Dyche               → 63
// Fulham     — solid mid-table, Silva may leave                  → 68
// Leeds      — strong first PL season back, Farke philosophy     → 66
// Nottm Forest — survival mode, three managers last season       → 64
// Coventry City — promoted champions, 25yr absence               → 56
// Ipswich Town  — returning 2nd time, added Akpom+Kipre          → 57
// Hull City  — playoff winners, raw squad for PL                 → 54
// ============================================================
const STRENGTH = {
  "Arsenal":           90,
  "Manchester City":   87,
  "Manchester United": 85,
  "Aston Villa":       83,
  "Liverpool":         82,
  "Bournemouth":       77,
  "Chelsea":           74,
  "Newcastle United":  74,
  "Tottenham Hotspur": 72,
  "Sunderland":        72,
  "Brighton":          73,
  "Crystal Palace":    70,
  "Brentford":         69,
  "Fulham":            68,
  "Leeds United":      66,
  "Nottingham Forest": 64,
  "Everton":           63,
  "Ipswich Town":      57,
  "Coventry City":     56,
  "Hull City":         54,
};

const HOME_BOOST = 3.0;

// All 20 teams sorted alphabetically
const TEAMS = Object.keys(BADGE).sort();

// Pre-season form indicator — all blank for new season
const FORM = Object.fromEntries(TEAMS.map(t => [t, []]));

// Key players 2026/27 (updated for transfers)
const KEY_PLAYERS = {
  "Arsenal":           { "B. Saka": 4.0, "M. Ødegaard": 4.5, "P. Hincapie": 3.0, "L. Trossard": 3.0 },
  "Manchester City":   { "E. Haaland": 5.0, "T. Reijnders": 3.5, "R. Cherki": 3.5, "P. Foden": 3.5 },
  "Manchester United": { "B. Sesko": 4.0, "B. Fernandes": 4.0, "B. Mbeumo": 3.5, "M. Cunha": 3.0 },
  "Aston Villa":       { "O. Watkins": 4.0, "M. Rogers": 3.5, "E. Buendía": 3.0, "E. Konsa": 2.5 },
  "Liverpool":         { "F. Wirtz": 4.5, "A. Isak": 4.5, "V. Munoz": 3.0, "J. Jacquet": 3.0 },
  "Bournemouth":       { "Rayan": 4.0, "A. Scott": 3.5, "Kroupi Jr.": 3.0, "A. Semenyo": 3.5 },
  "Chelsea":           { "C. Palmer": 4.5, "N. Jackson": 3.5, "M. Caicedo": 3.0, "G. Quenda": 2.5 },
  "Newcastle United":  { "A. Isak": 0, "B. Guimarães": 4.0, "K. Trippier": 2.5, "J. Pedro": 3.5 },
  "Tottenham Hotspur": { "H. Son": 4.5, "D. Kulusevski": 3.5, "J. van Hecke": 3.0, "A. Robertson": 2.5 },
  "Sunderland":        { "H. Wright": 3.5, "E. Mason-Clark": 3.0, "B. Thomas": 2.5, "L. Kitching": 2.5 },
  "Brighton":          { "Z. Yohanna": 3.0, "S. Mitoma": 3.5, "E. Ferguson": 3.5, "J. Enciso": 3.0 },
  "Crystal Palace":    { "E. Eze": 4.0, "M. Olise": 3.5, "J. Mateta": 3.0, "W. Hughes": 2.5 },
  "Brentford":         { "I. Thiago": 4.5, "C. Nørgaard": 3.0, "K. Lewis-Potter": 3.0, "M. Damsgaard": 3.0 },
  "Fulham":            { "A. Jiménez": 3.5, "T. Cairney": 3.0, "K. Tete": 2.5, "T. Muniz": 3.0 },
  "Leeds United":      { "W. Gnonto": 3.5, "J. Piroe": 3.0, "C. Cooper": 2.5, "G. Struijk": 2.5 },
  "Nottingham Forest": { "C. Wood": 3.5, "E. Anderson": 3.5, "A. Awoniyi": 3.0, "N. Williams": 2.5 },
  "Everton":           { "D. Calvert-Lewin": 3.5, "A. Doucoure": 3.0, "J. Pickford": 2.5, "J. Harrison": 2.5 },
  "Coventry City":     { "K. Hamer": 3.0, "V. Gyökeres": 0, "M. O'Hare": 3.0, "H. Godden": 2.5 },
  "Ipswich Town":      { "C. Akpom": 3.0, "C. Kipre": 2.5, "D. O'Shea": 2.5, "L. Davis": 2.5 },
  "Hull City":         { "M. Belloumi": 3.0, "J. Gelhardt": 3.0, "M. van Ewijk": 2.5, "J. Rudoni": 2.5 },
};

// ============================================================
// PROMOTED / NEW BADGE
// ============================================================
const NEW_TEAMS = new Set(["Coventry City", "Ipswich Town", "Hull City"]);
const EUROPEAN = {
  "Arsenal":           "UCL",
  "Manchester City":   "UCL",
  "Manchester United": "UCL",
  "Aston Villa":       "UCL",
  "Liverpool":         "UCL",
  "Bournemouth":       "UEL",
  "Sunderland":        "UEL",
  "Brighton":          "UECL",
  "Crystal Palace":    "UEL",
};

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
  return m.map(row => ({ ...row, probability: row.probability / tot }));
}

let STRENGTH_OVERRIDES = {};
let BOOKMAKER_CACHE = {};
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

function predictMatch(teamA, teamB, isHome = true) {
  const sA = getStr(teamA) + (isHome ? HOME_BOOST : 0);
  const sB = getStr(teamB) + (!isHome ? HOME_BOOST : 0);
  const diff = (sA - sB) / 10;
  const base = 2.65;
  let lA = clamp((base / 2) * Math.exp(diff * 0.18), 0.25, 4.2);
  let lB = clamp((base / 2) * Math.exp(-diff * 0.18), 0.25, 4.2);

  const bk = BOOKMAKER_CACHE[`${teamA}-${teamB}`];
  let blended = false;
  if (bk?.homeWin && bk?.draw && bk?.awayWin) {
    const rH = 1 / bk.homeWin, rD = 1 / bk.draw, rA = 1 / bk.awayWin;
    const t = rH + rD + rA;
    const mx0 = buildMatrix(lA, lB);
    let hw = 0, dr = 0, aw = 0;
    mx0.forEach(({ home, away, probability }) => {
      if (home > away) hw += probability;
      else if (home === away) dr += probability;
      else aw += probability;
    });
    hw = 0.4 * hw + 0.6 * (rH / t);
    dr = 0.4 * dr + 0.6 * (rD / t);
    aw = 0.4 * aw + 0.6 * (rA / t);
    const ratio = hw / aw;
    const tot = lA + lB;
    lA = clamp(tot * Math.sqrt(ratio) / (Math.sqrt(ratio) + 1), 0.25, 4.2);
    lB = clamp(tot - lA, 0.25, 4.2);
    blended = true;
  }

  const matrix = buildMatrix(lA, lB);
  let homeWin = 0, draw = 0, awayWin = 0;
  let over25 = 0, bttsY = 0;
  matrix.forEach(({ home, away, probability }) => {
    if (home > away) homeWin += probability;
    else if (home === away) draw += probability;
    else awayWin += probability;
    if (home + away > 2.5) over25 += probability;
    if (home > 0 && away > 0) bttsY += probability;
  });

  const sorted = [...matrix].sort((a, b) => b.probability - a.probability);
  const best = sorted[0];
  const topScores = sorted.slice(0, 8).map(s => ({ score: `${s.home}-${s.away}`, prob: r1(s.probability * 100) }));
  const htMx = buildMatrix(lA * 0.44, lB * 0.44);
  const htBest = [...htMx].sort((a, b) => b.probability - a.probability)[0];
  const topOut = Math.max(homeWin, draw, awayWin);
  const confidence = topOut >= 0.55 ? "High" : topOut >= 0.44 ? "Medium" : "Low";

  return {
    predictedScore: `${best.home}-${best.away}`,
    halfTimeScore: `${htBest.home}-${htBest.away}`,
    probabilities: {
      homeWin: r1(homeWin * 100), draw: r1(draw * 100), awayWin: r1(awayWin * 100),
      over25: r1(over25 * 100), under25: r1((1 - over25) * 100),
      bttsYes: r1(bttsY * 100), bttsNo: r1((1 - bttsY) * 100),
    },
    xG: { [teamA]: r2(lA), [teamB]: r2(lB) },
    topScores, matrix, confidence, blended,
  };
}

// ============================================================
// BETTING UTILS
// ============================================================
function evalEdge(modelPct, decOdds) {
  if (!decOdds || decOdds <= 1) return null;
  const mp = modelPct / 100, ip = 1 / decOdds;
  const edgePct = r1((mp - ip) * 100);
  const fairOdds = r2(1 / mp);
  const verdict = edgePct >= 8 ? "VALUE" : edgePct >= 3 ? "SMALL VALUE" : edgePct >= -2 ? "FAIR" : "SKIP";
  return { modelProbability: r1(mp * 100), impliedProbability: r1(ip * 100), fairOdds, edgePct, verdict };
}
function splitLine(l) {
  const r = Math.round(Number(l) * 4) / 4;
  if (Number.isInteger(r * 2)) return [r, r];
  return r > 0 ? [r - 0.25, r + 0.25] : [r + 0.25, r - 0.25];
}
function settleAH(margin, line) {
  const adj = margin + line;
  return adj > 0 ? "win" : adj === 0 ? "push" : "lose";
}
function evalAH(pred, line, side, odds) {
  if (!pred?.matrix || !odds || odds <= 1) return null;
  const lines = splitLine(Number(line));
  const acc = { fullWin: 0, halfWin: 0, push: 0, halfLose: 0, fullLose: 0 };
  pred.matrix.forEach(({ home, away, probability }) => {
    const margin = side === "home" ? home - away : away - home;
    const [s1, s2] = lines.map(l => settleAH(margin, l));
    const wins = [s1, s2].filter(x => x === "win").length;
    const pushes = [s1, s2].filter(x => x === "push").length;
    const loses = [s1, s2].filter(x => x === "lose").length;
    if (wins === 2) acc.fullWin += probability;
    else if (wins === 1 && pushes === 1) acc.halfWin += probability;
    else if (pushes === 2) acc.push += probability;
    else if (pushes === 1 && loses === 1) acc.halfLose += probability;
    else if (loses === 2) acc.fullLose += probability;
    else { acc.halfWin += probability / 2; acc.halfLose += probability / 2; }
  });
  const ev = acc.fullWin * (odds - 1) + acc.halfWin * 0.5 * (odds - 1) - acc.halfLose * 0.5 - acc.fullLose;
  const evPct = r1(ev * 100);
  const winEq = r1((acc.fullWin + acc.halfWin * 0.5) * 100);
  const verdict = evPct >= 8 ? "VALUE" : evPct >= 3 ? "SMALL VALUE" : evPct >= -2 ? "FAIR" : "SKIP";
  return { fullWin: r1(acc.fullWin * 100), halfWin: r1(acc.halfWin * 100), push: r1(acc.push * 100), halfLose: r1(acc.halfLose * 100), fullLose: r1(acc.fullLose * 100), winEq, evPct, verdict };
}
function settleTG(total, line, dir) {
  const adj = dir === "over" ? total - line : line - total;
  return adj > 0 ? "win" : adj === 0 ? "push" : "lose";
}
function evalTG(pred, line, dir, odds) {
  if (!pred?.matrix || !odds || odds <= 1) return null;
  const lines = splitLine(Number(line));
  const acc = { fullWin: 0, halfWin: 0, push: 0, halfLose: 0, fullLose: 0 };
  pred.matrix.forEach(({ home, away, probability }) => {
    const total = home + away;
    const [s1, s2] = lines.map(l => settleTG(total, l, dir));
    const wins = [s1, s2].filter(x => x === "win").length;
    const pushes = [s1, s2].filter(x => x === "push").length;
    const loses = [s1, s2].filter(x => x === "lose").length;
    if (wins === 2) acc.fullWin += probability;
    else if (wins === 1 && pushes === 1) acc.halfWin += probability;
    else if (pushes === 2) acc.push += probability;
    else if (pushes === 1 && loses === 1) acc.halfLose += probability;
    else if (loses === 2) acc.fullLose += probability;
    else { acc.halfWin += probability / 2; acc.halfLose += probability / 2; }
  });
  const ev = acc.fullWin * (odds - 1) + acc.halfWin * 0.5 * (odds - 1) - acc.halfLose * 0.5 - acc.fullLose;
  const evPct = r1(ev * 100);
  const winEq = r1((acc.fullWin + acc.halfWin * 0.5) * 100);
  const verdict = evPct >= 8 ? "VALUE" : evPct >= 3 ? "SMALL VALUE" : evPct >= -2 ? "FAIR" : "SKIP";
  return { fullWin: r1(acc.fullWin * 100), halfWin: r1(acc.halfWin * 100), push: r1(acc.push * 100), halfLose: r1(acc.halfLose * 100), fullLose: r1(acc.fullLose * 100), winEq, evPct, verdict };
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function FormStrip({ team }) {
  const form = FORM[team] || [];
  if (!form.length) return <span style={{ color: C.muted, fontSize: 10 }}>No data yet</span>;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {form.map((r, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: "50%",
          background: r === "W" ? C.emerald : r === "D" ? C.gold : C.red,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8, fontWeight: 800, color: "#080f0a",
        }}>{r}</div>
      ))}
    </div>
  );
}

function EVCard({ title, data }) {
  if (!data) return null;
  const col = data.verdict === "VALUE" ? C.emerald : data.verdict === "SMALL VALUE" ? C.gold : data.verdict === "FAIR" ? C.accent : C.red;
  return (
    <div style={{ background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>{title}</span>
        <span style={{ color: col, fontSize: 12, fontWeight: 900 }}>{data.verdict}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 0", fontSize: 11 }}>
        {"modelProbability" in data && <>
          <span style={{ color: C.muted }}>Model prob</span><span style={{ textAlign: "right", color: C.accent }}>{data.modelProbability}%</span>
          <span style={{ color: C.muted }}>Market implied</span><span style={{ textAlign: "right" }}>{data.impliedProbability}%</span>
          <span style={{ color: C.muted }}>Fair odds</span><span style={{ textAlign: "right" }}>{data.fairOdds}</span>
          <span style={{ color: C.muted }}>Edge</span>
          <span style={{ textAlign: "right", fontWeight: 800, color: data.edgePct >= 0 ? C.emerald : C.red }}>
            {data.edgePct > 0 ? "+" : ""}{data.edgePct}%
          </span>
        </>}
        {"evPct" in data && <>
          <span style={{ color: C.muted }}>Full Win</span><span style={{ textAlign: "right", color: C.emerald }}>{data.fullWin}%</span>
          {data.halfWin > 0 && <><span style={{ color: C.muted }}>Half Win</span><span style={{ textAlign: "right", color: C.gold }}>{data.halfWin}%</span></>}
          {data.push > 0 && <><span style={{ color: C.muted }}>Push</span><span style={{ textAlign: "right" }}>{data.push}%</span></>}
          {data.halfLose > 0 && <><span style={{ color: C.muted }}>Half Lose</span><span style={{ textAlign: "right", color: C.gold }}>{data.halfLose}%</span></>}
          <span style={{ color: C.muted }}>Full Lose</span><span style={{ textAlign: "right", color: C.red }}>{data.fullLose}%</span>
          <span style={{ color: C.muted }}>Win Equiv</span><span style={{ textAlign: "right", color: C.accent }}>{data.winEq}%</span>
          <span style={{ color: C.muted }}>EV</span>
          <span style={{ textAlign: "right", fontWeight: 800, color: data.evPct >= 0 ? C.emerald : C.red }}>
            {data.evPct > 0 ? "+" : ""}{data.evPct}%
          </span>
        </>}
      </div>
    </div>
  );
}

// ============================================================
// TAB: POWER RANKINGS
// ============================================================
function PowerRankingsView() {
  const sorted = [...TEAMS].sort((a, b) => getStr(b) - getStr(a));
  const max = getStr(sorted[0]);
  const europeanColors = { UCL: "#fbbf24", UEL: "#f97316", UECL: "#60a5fa" };

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={{ ...S.lbl, marginBottom: 2 }}>⚡ 2026/27 POWER RANKINGS</div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 14, lineHeight: 1.5 }}>
          Strength ratings based on 2025/26 finish + confirmed summer transfers. Window closes 1 Sep 2026 — ratings will update.
        </div>
        {sorted.map((team, i) => {
          const str = getStr(team);
          const pct = (str / max) * 100;
          const euro = EUROPEAN[team];
          const isNew = NEW_TEAMS.has(team);
          return (
            <div key={team} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: i < 3 ? C.gold : C.muted, fontSize: 11, fontWeight: 700, width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 18 }}>{BADGE[team]}</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{team}</span>
                  {isNew && <span style={{ fontSize: 9, fontWeight: 800, background: "#1a2e1e", color: C.emerald, padding: "1px 6px", borderRadius: 99 }}>↑ NEW</span>}
                  {euro && <span style={{ fontSize: 9, fontWeight: 800, color: europeanColors[euro] }}>{euro}</span>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? C.gold : C.accent }}>{str}</span>
              </div>
              <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? C.gold : i < 5 ? C.emerald : i < 10 ? C.accent : C.muted, borderRadius: 3, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: "8px 10px", background: "#080f0a", borderRadius: 8 }}>
          <div style={{ ...S.lbl, marginBottom: 4 }}>RATING METHODOLOGY</div>
          <div style={{ color: C.muted, fontSize: 10, lineHeight: 1.6 }}>
            Ratings reflect squad depth, key additions/losses, and expected 26/27 performance. Arsenal (90) are champions with reinforced depth. Man City (87) rebuilding post-Pep. Man Utd (85) resurgent under Carrick after 71pts last season. Liverpool (82) weakened by Salah/Robertson exits but Wirtz+Isak offset losses.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: PREDICT MATCH
// ============================================================
function PredictView() {
  const [home, setHome] = useState("Arsenal");
  const [away, setAway] = useState("Liverpool");
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const predict = async () => {
    if (!home || !away || home === away) return;
    setLoading(true); setAiText(""); setResult(null);
    const pred = predictMatch(home, away, true);
    setResult({ ...pred, home, away });
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content:
          `Expert Premier League analyst. 150-word match preview for the 2026/27 season: ${home} vs ${away}.
Model: ${pred.predictedScore} (${home} ${pred.probabilities.homeWin}% / Draw ${pred.probabilities.draw}% / ${away} ${pred.probabilities.awayWin}%).
Context: Arsenal are defending champions (85pts). Man Utd resurgent under Carrick (71pts, 3rd last season). Liverpool lost Salah+Robertson but have Wirtz+Isak. Man City post-Pep rebuild with Reijnders/Cherki. Sunderland in Europa League. Three newly promoted sides: Coventry City (25yr absence), Ipswich Town, Hull City.
Cover: tactical matchup, key player battle, and one market insight. Sharp analyst tone, no filler.` }] })
      });
      const data = await resp.json();
      setAiText(data.content?.map(c => c.text || "").join("") || "");
    } catch (e) { setAiText("AI preview unavailable."); }
    setLoading(false);
  };

  const askAI = async () => {
    if (!query.trim()) return;
    setLoading(true); setAiText(""); setResult(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content:
          `EPL 2026/27 expert analyst. Search for the latest on this question before answering: "${query}"
Context: Arsenal are 26/27 defending champions (85pts). Man Utd 3rd under Carrick (71pts). Man City post-Pep with Reijnders+Cherki. Liverpool lost Salah but have Wirtz+Isak. Three promoted: Coventry City, Ipswich Town, Hull City. Answer in 150 words max. Be specific and analytical.` }] })
      });
      const data = await resp.json();
      setAiText(data.content?.filter(c => c.type === "text").map(c => c.text || "").join("") || "");
    } catch (e) { setAiText("Query failed."); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={{ ...S.lbl, marginBottom: 10 }}>🔮 PREDICT ANY MATCH — 2026/27</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={S.lbl}>HOME</div>
            <select value={home} onChange={e => setHome(e.target.value)} style={S.inp}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t) ? " ↑" : ""}</option>)}
            </select>
            <div style={{ marginTop: 5, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.muted }}>Rating: <strong style={{ color: C.accent }}>{getStr(home) + HOME_BOOST}</strong> (home)</span>
              {NEW_TEAMS.has(home) && <span style={{ fontSize: 9, color: C.emerald, fontWeight: 700 }}>↑ PROMOTED</span>}
            </div>
          </div>
          <div style={{ color: C.muted, fontWeight: 900, fontSize: 12, paddingTop: 22 }}>VS</div>
          <div style={{ flex: 1 }}>
            <div style={S.lbl}>AWAY</div>
            <select value={away} onChange={e => setAway(e.target.value)} style={S.inp}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t) ? " ↑" : ""}</option>)}
            </select>
            <div style={{ marginTop: 5 }}>
              <span style={{ fontSize: 10, color: C.muted }}>Rating: <strong style={{ color: C.accent }}>{getStr(away)}</strong> (away)</span>
            </div>
          </div>
        </div>
        <button onClick={predict} style={S.btn} disabled={loading || home === away}>
          {loading ? "Analysing..." : "⚡ Predict Match"}
        </button>
      </div>

      {result && !loading && (
        <div style={S.card}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, alignItems: "center", marginBottom: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>{BADGE[result.home]}</div>
                <div style={{ fontWeight: 800, fontSize: 12, marginTop: 4 }}>{result.home}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: C.emerald }}>{result.predictedScore}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>HT {result.halfTimeScore}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>{BADGE[result.away]}</div>
                <div style={{ fontWeight: 800, fontSize: 12, marginTop: 4 }}>{result.away}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 3, height: 5, borderRadius: 3, overflow: "hidden", margin: "0 8px" }}>
              <div style={{ flex: result.probabilities.homeWin, background: C.emerald }} />
              <div style={{ flex: result.probabilities.draw, background: C.gold }} />
              <div style={{ flex: result.probabilities.awayWin, background: C.red }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11 }}>
              <span style={{ color: C.emerald }}>{result.probabilities.homeWin}% Home</span>
              <span style={{ color: C.gold }}>{result.probabilities.draw}% Draw</span>
              <span style={{ color: C.red }}>{result.probabilities.awayWin}% Away</span>
            </div>
            <div style={{ marginTop: 6, color: C.muted, fontSize: 11 }}>
              xG: {result.xG[result.home]} – {result.xG[result.away]} · Over 2.5: {result.probabilities.over25}% · BTTS: {result.probabilities.bttsYes}%
              {" · "}Confidence: <strong style={{ color: result.confidence === "High" ? C.emerald : result.confidence === "Medium" ? C.gold : C.muted }}>{result.confidence}</strong>
              {result.blended && <span style={{ marginLeft: 6, color: C.emerald, fontSize: 10 }}>🔀 Odds blended</span>}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <div style={S.lbl}>TOP CORRECT SCORES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {result.topScores.slice(0, 6).map((s, i) => (
                <div key={s.score} style={{ background: i === 0 ? "#0f2a15" : "#080f0a", border: `1px solid ${i === 0 ? C.emerald : C.border}`, borderRadius: 7, padding: "6px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? C.emerald : C.text }}>{s.score}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{s.prob}%</div>
                </div>
              ))}
            </div>
          </div>
          {aiText && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 10 }}>
              <div style={{ ...S.lbl, color: "#60a5fa" }}>🤖 AI PREVIEW</div>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{aiText}</p>
            </div>
          )}
        </div>
      )}

      <div style={S.card}>
        <div style={S.lbl}>💬 ASK THE ANALYST</div>
        <input style={S.inp} placeholder='e.g. "Can Man Utd win the title?" or "Who are the relegation favourites?"'
          value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()} />
        <button onClick={askAI} style={S.btn} disabled={loading}>{loading ? "Thinking..." : "🔍 Ask"}</button>
        {aiText && !result && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{aiText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: BETTING PREDICTOR
// ============================================================
function BettingView({ modelVersion = 0 }) {
  const [home, setHome] = useState("Arsenal");
  const [away, setAway] = useState("Manchester City");
  const [isHome, setIsHome] = useState(true);
  const [market, setMarket] = useState("homeWin");
  const [mktOdds, setMktOdds] = useState("2.10");
  const [ahSide, setAhSide] = useState("home");
  const [ahLine, setAhLine] = useState("-0.5");
  const [ahOdds, setAhOdds] = useState("1.90");
  const [totalDir, setTotalDir] = useState("over");
  const [totalLine, setTotalLine] = useState("2.75");
  const [totalOdds, setTotalOdds] = useState("1.90");

  useEffect(() => {
    const apply = () => {
      const raw = sessionStorage.getItem("eplBettingAutofill");
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        if (p.home) setHome(p.home);
        if (p.away) setAway(p.away);
        if (p.market) setMarket(p.market);
        if (p.mktOdds) setMktOdds(p.mktOdds);
        if (p.ahLine) setAhLine(p.ahLine);
        if (p.ahOdds) setAhOdds(p.ahOdds);
        if (p.ahSide) setAhSide(p.ahSide);
        if (p.totalLine) setTotalLine(p.totalLine);
        if (p.totalOdds) setTotalOdds(p.totalOdds);
        if (p.totalDir) setTotalDir(p.totalDir);
      } catch (e) {}
    };
    apply();
    window.addEventListener("eplBettingAutofill", apply);
    return () => window.removeEventListener("eplBettingAutofill", apply);
  }, []);

  const prediction = useMemo(() => {
    if (!home || !away || home === away) return null;
    return predictMatch(home, away, isHome);
  }, [home, away, isHome, modelVersion]);

  const mktEV = useMemo(() => {
    if (!prediction) return null;
    const p = prediction.probabilities;
    const map = { homeWin: p.homeWin, draw: p.draw, awayWin: p.awayWin, over25: p.over25, under25: p.under25, bttsYes: p.bttsYes, bttsNo: p.bttsNo };
    return evalEdge(map[market] ?? 0, Number(mktOdds));
  }, [prediction, market, mktOdds]);

  const ahEV = useMemo(() => prediction ? evalAH(prediction, Number(ahLine), ahSide, Number(ahOdds)) : null, [prediction, ahLine, ahSide, ahOdds]);
  const tgEV = useMemo(() => prediction ? evalTG(prediction, Number(totalLine), totalDir, Number(totalOdds)) : null, [prediction, totalLine, totalDir, totalOdds]);

  const mainLean = useMemo(() => {
    if (!prediction) return null;
    const p = prediction.probabilities;
    return [{ l: `${home} Win`, v: p.homeWin }, { l: "Draw", v: p.draw }, { l: `${away} Win`, v: p.awayWin }].sort((a, b) => b.v - a.v)[0];
  }, [prediction, home, away]);

  const StatBox = ({ label, value, color = C.text }) => (
    <div style={{ background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 7px", textAlign: "center", flex: 1, minWidth: 68 }}>
      <div style={{ color: C.muted, fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 16, fontWeight: 900 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={S.lbl}>🎯 BETTING PREDICTOR — 2026/27</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={S.lbl}>HOME</div>
            <select value={home} onChange={e => setHome(e.target.value)} style={S.inp}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t) ? " ↑" : ""}</option>)}
            </select>
          </div>
          <div style={{ color: C.muted, fontWeight: 900, fontSize: 12, paddingTop: 20 }}>VS</div>
          <div style={{ flex: 1 }}>
            <div style={S.lbl}>AWAY</div>
            <select value={away} onChange={e => setAway(e.target.value)} style={S.inp}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t) ? " ↑" : ""}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={S.lbl}>VENUE</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map(h => (
              <button key={String(h)} onClick={() => setIsHome(h)} style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: isHome === h ? C.emerald : "#162219", color: isHome === h ? "#080f0a" : C.muted }}>
                {h ? `${home.split(" ")[0]} at Home` : `${away.split(" ")[0]} at Home`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {prediction && home !== away && (
        <>
          <div style={{ background: "linear-gradient(135deg,#0a1f0d,#0f2a15)", border: `2px solid ${C.emerald}`, borderRadius: 14, padding: 18, textAlign: "center", marginBottom: 10 }}>
            <div style={{ color: C.emerald, fontSize: 10, fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>PREDICTED SCORELINE</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center", marginBottom: 10 }}>
              <div><div style={{ fontSize: 26 }}>{BADGE[home]}</div><div style={{ fontSize: 11, fontWeight: 800, marginTop: 4 }}>{home.split(" ")[0]}</div></div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.gold }}>{prediction.predictedScore}</div>
                <div style={{ fontSize: 10, color: C.muted }}>HT {prediction.halfTimeScore}</div>
              </div>
              <div><div style={{ fontSize: 26 }}>{BADGE[away]}</div><div style={{ fontSize: 11, fontWeight: 800, marginTop: 4 }}>{away.split(" ")[0]}</div></div>
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>
              Model lean: <strong style={{ color: C.accent }}>{mainLean?.l} — {mainLean?.v}%</strong>
              {" · "}Confidence: <strong style={{ color: prediction.confidence === "High" ? C.emerald : prediction.confidence === "Medium" ? C.gold : C.muted }}>{prediction.confidence}</strong>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.lbl}>📈 PROBABILITIES</div>
            <div style={{ display: "flex", gap: 3, height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ flex: prediction.probabilities.homeWin, background: C.emerald }} />
              <div style={{ flex: prediction.probabilities.draw, background: C.gold }} />
              <div style={{ flex: prediction.probabilities.awayWin, background: C.red }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 12 }}>
              <span style={{ color: C.emerald }}>{prediction.probabilities.homeWin}% Home</span>
              <span style={{ color: C.gold }}>{prediction.probabilities.draw}% Draw</span>
              <span style={{ color: C.red }}>{prediction.probabilities.awayWin}% Away</span>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <StatBox label={`${home.split(" ")[0]} xG`} value={prediction.xG[home]} color={C.emerald} />
              <StatBox label={`${away.split(" ")[0]} xG`} value={prediction.xG[away]} color={C.red} />
              <StatBox label="OVER 2.5" value={`${prediction.probabilities.over25}%`} color={C.gold} />
              <StatBox label="BTTS YES" value={`${prediction.probabilities.bttsYes}%`} color={C.accent} />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.lbl}>💰 1X2 / MARKET EDGE</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}>
                <div style={S.lbl}>MARKET</div>
                <select value={market} onChange={e => setMarket(e.target.value)} style={S.inp}>
                  <option value="homeWin">{home} Win</option>
                  <option value="draw">Draw</option>
                  <option value="awayWin">{away} Win</option>
                  <option value="over25">Over 2.5</option>
                  <option value="under25">Under 2.5</option>
                  <option value="bttsYes">BTTS Yes</option>
                  <option value="bttsNo">BTTS No</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>DECIMAL ODDS</div>
                <input value={mktOdds} onChange={e => setMktOdds(e.target.value)} style={S.inp} type="number" step="0.01" min="1.01" />
              </div>
            </div>
            <EVCard title="1X2 Edge" data={mktEV} />
          </div>

          <div style={S.card}>
            <div style={S.lbl}>🧮 ASIAN HANDICAP</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}>
                <div style={S.lbl}>SIDE</div>
                <select value={ahSide} onChange={e => setAhSide(e.target.value)} style={S.inp}>
                  <option value="home">{home}</option>
                  <option value="away">{away}</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>LINE</div>
                <input value={ahLine} onChange={e => setAhLine(e.target.value)} style={S.inp} type="number" step="0.25" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>ODDS</div>
                <input value={ahOdds} onChange={e => setAhOdds(e.target.value)} style={S.inp} type="number" step="0.01" min="1.01" />
              </div>
            </div>
            <EVCard title="AH Expected Value" data={ahEV} />
          </div>

          <div style={S.card}>
            <div style={S.lbl}>⚽ TOTAL GOALS</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}>
                <div style={S.lbl}>DIRECTION</div>
                <select value={totalDir} onChange={e => setTotalDir(e.target.value)} style={S.inp}>
                  <option value="over">Over</option>
                  <option value="under">Under</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>LINE</div>
                <input value={totalLine} onChange={e => setTotalLine(e.target.value)} style={S.inp} type="number" step="0.25" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.lbl}>ODDS</div>
                <input value={totalOdds} onChange={e => setTotalOdds(e.target.value)} style={S.inp} type="number" step="0.01" min="1.01" />
              </div>
            </div>
            <EVCard title="Total Goals EV" data={tgEV} />
          </div>

          <div style={{ ...S.card, borderColor: "#7f1d1d", background: "#0f0505" }}>
            <div style={{ color: "#fca5a5", fontSize: 11, fontWeight: 800, marginBottom: 5 }}>⚠️ BANKROLL DISCIPLINE</div>
            <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.6, margin: 0 }}>Edge % compares model vs market — not a guarantee. Negative edge = skip. Max stake pre-defined per match. Never chase losses. Season is fresh — model uncertainty is higher early on.</p>
          </div>
        </>
      )}
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
        const home = comp?.competitors?.find(c => c.homeAway === "home");
        const away = comp?.competitors?.find(c => c.homeAway === "away");
        const status = comp?.status;
        const goals = [];
        (comp?.details || []).forEach(d => {
          if (d?.type?.text?.toLowerCase().includes("goal")) {
            goals.push({
              player: d?.athletesInvolved?.[0]?.displayName || "",
              team: d?.team?.shortDisplayName || "",
              time: d?.clock?.displayValue?.replace("'","") || "",
              detail: d?.type?.text?.includes("Penalty") ? "P" : d?.type?.text?.includes("Own") ? "OG" : "",
            });
          }
        });
        const state = status?.type?.state;
        return {
          id: ev.id,
          home: home?.team?.displayName || "",
          away: away?.team?.displayName || "",
          homeScore: home?.score != null ? Number(home.score) : null,
          awayScore: away?.score != null ? Number(away.score) : null,
          minute: status?.displayClock?.replace("'","") || "",
          status: state === "in" ? "LIVE" : state === "post" ? "FT" : "NS",
          kickoff: ev?.date || "",
          goals,
        };
      }).filter(m => m.home && m.away);
      setMatches(parsed);
      setLastUpdate(new Date());
      onLiveUpdate?.(parsed);
      if (!parsed.length) setError("No EPL matches today. Season starts 21 August 2026.");
    } catch (e) {
      setError(`Feed error: ${e.message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchScores(); }, []);
  useEffect(() => {
    if (autoRefresh) timerRef.current = setInterval(fetchScores, 60000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, fetchScores]);

  const fmtKO = (iso) => iso ? new Date(iso).toLocaleString("en-MY", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }) + " MYT" : "";
  const liveCount = matches.filter(m => m.status === "LIVE").length;

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ ...S.lbl, marginBottom: 0 }}>
            🔴 EPL LIVE SCORES — 2026/27
            {liveCount > 0 && <span style={{ marginLeft: 8, background: C.emerald, color: "#080f0a", borderRadius: 99, padding: "1px 7px", fontSize: 10 }}>{liveCount} LIVE</span>}
          </div>
          {lastUpdate && <span style={{ color: C.muted, fontSize: 10 }}>{lastUpdate.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchScores} disabled={loading} style={{ ...S.btn, marginTop: 0, flex: 1 }}>
            {loading ? "⏳" : "🔄 Refresh"}
          </button>
          <button onClick={() => setAutoRefresh(a => !a)} style={{ ...S.btn, marginTop: 0, flex: 1, background: autoRefresh ? "#0f2a15" : "#162219", color: autoRefresh ? C.emerald : C.muted }}>
            {autoRefresh ? "⏱ Auto ON" : "⏱ Auto"}
          </button>
        </div>
        <div style={{ color: C.muted, fontSize: 10, marginTop: 6 }}>ESPN · No API key · Season starts 21 Aug 2026</div>
        {error && <div style={{ color: C.gold, fontSize: 11, marginTop: 6 }}>{error}</div>}
      </div>

      {matches.length === 0 && !loading && !error && (
        <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 30 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>2026/27 Season starts 21 August 2026</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>Arsenal (champions) host Coventry City in the opening fixture</div>
        </div>
      )}

      {matches.map(m => {
        const isLive = m.status === "LIVE";
        const isDone = m.status === "FT";
        const hasScore = m.homeScore !== null && m.awayScore !== null;
        return (
          <div key={m.id} style={{ ...S.card, borderColor: isLive ? C.emerald : C.border, background: isLive ? "#061a0e" : C.card, position: "relative", overflow: "hidden" }}>
            {isLive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${C.emerald},#34d399,${C.emerald})` }} />}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 8 }}>
              <span>Premier League 2026/27</span>
              <span style={{ color: isLive ? C.emerald : isDone ? C.muted : C.gold, fontWeight: isLive ? 800 : 400 }}>
                {isLive && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.emerald, marginRight: 4 }} />}
                {isLive ? `LIVE ${m.minute}'` : isDone ? "FT" : fmtKO(m.kickoff)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: 700 }}>{BADGE[m.home] || "⚽"} {m.home}</div>
              <div style={{ minWidth: 64, textAlign: "center" }}>
                {hasScore ? <span style={{ fontSize: 20, fontWeight: 900, color: isLive ? C.emerald : C.accent }}>{m.homeScore} – {m.awayScore}</span>
                  : <span style={{ color: C.muted, fontSize: 13 }}>vs</span>}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{BADGE[m.away] || "⚽"} {m.away}</div>
            </div>
            {m.goals?.length > 0 && (
              <div style={{ marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                {m.goals.map((g, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                    ⚽ {g.time}' {g.player} ({g.team}){g.detail ? ` ${g.detail}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: ODDS CHECKER
// ============================================================
function OddsView() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingLive, setUsingLive] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchOdds = async (key) => {
    setLoading(true); setError(""); setUsingLive(false);
    try {
      const url = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${key}&regions=eu&markets=h2h,spreads,totals&oddsFormat=decimal`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (!Array.isArray(data) || !data.length) { setError("No live odds yet — season starts 21 Aug 2026."); setLoading(false); return; }
      const parsed = data.map(ev => {
        const home = ev.home_team; const away = ev.away_team;
        const bk = ev.bookmakers?.find(b => b.key === "pinnacle") || ev.bookmakers?.[0];
        const h2hM = bk?.markets?.find(m => m.key === "h2h");
        const totM = bk?.markets?.find(m => m.key === "totals");
        const spdM = bk?.markets?.find(m => m.key === "spreads");
        const hOut = h2hM?.outcomes?.find(o => o.name === ev.home_team);
        const aOut = h2hM?.outcomes?.find(o => o.name === ev.away_team);
        const dOut = h2hM?.outcomes?.find(o => o.name === "Draw");
        const totMap = {};
        totM?.outcomes?.forEach(o => { if (!totMap[o.point]) totMap[o.point] = {}; totMap[o.point][o.name.toLowerCase()] = o.price; });
        const tots = Object.entries(totMap).map(([l, v]) => ({ line: Number(l), over: v.over, under: v.under }));
        const ahMap = {};
        spdM?.outcomes?.forEach(o => { const k = Math.abs(o.point); if (!ahMap[k]) ahMap[k] = {}; if (o.name === ev.home_team) ahMap[k].homeOdds = o.price; else ahMap[k].awayOdds = o.price; ahMap[k].homeLine = o.point < 0 ? o.point : -o.point; });
        const ahs = Object.values(ahMap).slice(0, 2);
        if (home && away && hOut && dOut && aOut) BOOKMAKER_CACHE[`${home}-${away}`] = { homeWin: hOut.price, draw: dOut.price, awayWin: aOut.price };
        return { id: ev.id, home, away, kickoff: ev.commence_time, h2h: { home: hOut?.price, draw: dOut?.price, away: aOut?.price }, totals: tots, ah: ahs, source: bk?.title || "API" };
      });
      setMatches(parsed); setUsingLive(true); setSavedKey(key);
    } catch (e) { setError(`API Error: ${e.message}`); }
    setLoading(false);
  };

  const getModelP = (home, away, outcome) => {
    if (!home || !away || home === away) return null;
    const p = predictMatch(home, away, true).probabilities;
    return outcome === "home" ? p.homeWin : outcome === "draw" ? p.draw : p.awayWin;
  };

  const ModelEdge = ({ prob, odds }) => {
    if (!prob || !odds) return null;
    const edge = r1((prob / 100 - 1 / odds) * 100);
    const col = edge >= 5 ? C.emerald : edge >= 2 ? C.gold : edge >= -2 ? C.muted : C.red;
    return <span style={{ fontSize: 9, color: col, fontWeight: 700, display: "block" }}>Model: {prob}% | {edge > 0 ? "+" : ""}{edge}%</span>;
  };

  const fmtKO = (iso) => iso ? new Date(iso).toLocaleString("en-MY", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }) + " MYT" : "";

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={S.lbl}>📡 LIVE ODDS — the-odds-api.com</div>
        <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>
          Enter your API key for live EPL odds. Season starts 21 Aug 2026 — pre-season odds may be available earlier. EPL requires the paid plan.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...S.inp, flex: 1, fontFamily: "monospace", fontSize: 11 }} placeholder="Paste API key here..." value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" />
          <button onClick={() => apiKey.trim() && fetchOdds(apiKey.trim())} disabled={loading || !apiKey.trim()} style={{ ...S.btn, marginTop: 0, width: "auto", padding: "9px 16px" }}>
            {loading ? "⏳" : "Fetch"}
          </button>
        </div>
        {savedKey && <button onClick={() => fetchOdds(savedKey)} style={{ ...S.btn, background: "#162219", color: C.emerald }}>🔄 Refresh</button>}
        <div style={{ marginTop: 6, fontSize: 10, color: usingLive ? C.emerald : C.gold }}>
          {usingLive ? "✅ Live odds from API" : "⚠️ No odds loaded yet. Season starts 21 Aug 2026."}
        </div>
        {error && <div style={{ color: C.gold, fontSize: 11, marginTop: 5 }}>{error}</div>}
      </div>

      {matches.length === 0 && !loading && (
        <div style={{ ...S.card, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
          <div style={{ color: C.muted, fontSize: 12 }}>Connect your the-odds-api.com key above to load live match odds once the season begins.</div>
        </div>
      )}

      {matches.map(m => (
        <div key={m.id} style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{BADGE[m.home] || "⚽"} {m.home} <span style={{ color: C.muted, fontWeight: 400 }}>vs</span> {BADGE[m.away] || "⚽"} {m.away}</div>
          <div style={{ color: C.muted, fontSize: 10, marginBottom: 10 }}>{fmtKO(m.kickoff)} · {m.source}</div>
          {m.h2h?.home && (
            <div style={{ marginBottom: 10 }}>
              <div style={S.lbl}>1X2</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ label: m.home.split(" ")[0], odds: m.h2h.home, prob: getModelP(m.home, m.away, "home") },
                  { label: "Draw", odds: m.h2h.draw, prob: getModelP(m.home, m.away, "draw") },
                  { label: m.away.split(" ")[0], odds: m.h2h.away, prob: getModelP(m.home, m.away, "away") }].map(item => (
                  <div key={item.label} style={{ flex: 1, background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ color: C.muted, fontSize: 9, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.accent }}>{item.odds}</div>
                    <ModelEdge prob={item.prob} odds={item.odds} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {m.totals?.slice(0, 1).map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <div style={{ flex: 1, background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11 }}>Over {t.line}</span><span style={{ color: C.accent, fontWeight: 800 }}>{t.over}</span>
              </div>
              <div style={{ flex: 1, background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11 }}>Under {t.line}</span><span style={{ color: C.accent, fontWeight: 800 }}>{t.under}</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            {[["📊 1X2", "h2h"], ["⚽ O/U", "total"], ["🧮 AH", "ah"]].map(([label, type]) => (
              <button key={label} onClick={() => {
                const payload = { home: m.home, away: m.away,
                  ...(type === "h2h" ? { market: "homeWin", mktOdds: String(m.h2h?.home || "") }
                    : type === "total" ? { totalLine: String(m.totals?.[0]?.line || "2.5"), totalOdds: String(m.totals?.[0]?.over || ""), totalDir: "over" }
                    : { ahLine: String(m.ah?.[0]?.homeLine ?? "-0.5"), ahOdds: String(m.ah?.[0]?.homeOdds || ""), ahSide: "home" }),
                };
                sessionStorage.setItem("eplBettingAutofill", JSON.stringify(payload));
                window.dispatchEvent(new Event("eplBettingAutofill"));
              }} style={{ flex: 1, background: "#162219", border: `1px solid ${C.border}`, color: C.accent, borderRadius: 7, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB: TEAM INTEL
// ============================================================
function TeamIntelView() {
  const [team, setTeam] = useState("Arsenal");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);

  const str = STRENGTH[team] || 60;
  const rank = [...TEAMS].sort((a, b) => getStr(b) - getStr(a)).findIndex(t => t === team) + 1;
  const euro = EUROPEAN[team];
  const isNew = NEW_TEAMS.has(team);

  const getAI = async () => {
    setLoading(true); setAiText("");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content:
          `Search for the latest on "${team} Premier League 2026-27 season preview transfers" before answering.
Then give a sharp 200-word EPL 2026/27 preview for ${team}: (1) Key summer transfers in/out, (2) Tactical identity and manager's system, (3) Season outlook — title/Europe/mid-table/relegation threat?
Context: Strength rating ${str}/100, ranked #${rank} in our model. ${euro ? `In ${euro} this season.` : ""} ${isNew ? "PROMOTED team — back in the Premier League." : ""}
No bullet points. Analyst prose.` }] })
      });
      const data = await resp.json();
      setAiText(data.content?.filter(c => c.type === "text").map(c => c.text || "").join("") || "");
    } catch (e) { setAiText("AI intel unavailable."); }
    setLoading(false);
  };

  const europeanColors = { UCL: "#fbbf24", UEL: "#f97316", UECL: "#60a5fa" };

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={S.lbl}>🔍 TEAM DEEP DIVE — 2026/27</div>
        <select value={team} onChange={e => { setTeam(e.target.value); setAiText(""); }} style={S.inp}>
          {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}{NEW_TEAMS.has(t) ? " ↑ NEW" : ""}</option>)}
        </select>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{BADGE[team]}</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{team}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ color: C.muted, fontSize: 11 }}>Model rank #{rank}</span>
              {euro && <span style={{ color: europeanColors[euro], fontSize: 11, fontWeight: 700 }}>· {euro} 2026/27</span>}
              {isNew && <span style={{ color: C.emerald, fontSize: 11, fontWeight: 700 }}>· ↑ Promoted</span>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>{str}</div>
            <div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>STRENGTH</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
          {[
            { label: "BASE", value: str },
            { label: "HOME", value: str + HOME_BOOST },
            { label: "EPL RANK", value: `#${rank}` },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#080f0a", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ color: C.muted, fontSize: 9, fontWeight: 700 }}>{s.label}</div>
              <div style={{ color: C.accent, fontSize: 18, fontWeight: 900, marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {KEY_PLAYERS[team] && (
          <div style={{ marginBottom: 12 }}>
            <div style={S.lbl}>KEY PLAYERS 2026/27</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {Object.entries(KEY_PLAYERS[team]).filter(([, r]) => r > 0).map(([name, rating]) => (
                <div key={name} style={{ background: "#080f0a", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 9px", fontSize: 11 }}>
                  <span>{name}</span>
                  <span style={{ color: C.gold, marginLeft: 5, fontSize: 10, fontWeight: 800 }}>★{rating}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 0 }}>
          <div style={S.lbl}>QUICK PREDICTIONS (HOME vs TOP 5)</div>
          {["Arsenal", "Manchester City", "Liverpool", "Manchester United", "Aston Villa"].filter(t => t !== team).slice(0, 4).map(opp => {
            const pred = predictMatch(team, opp, true);
            return (
              <div key={opp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12 }}>{BADGE[opp]} {opp}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: C.emerald, fontWeight: 800, fontSize: 13 }}>{pred.predictedScore}</span>
                  <span style={{ color: pred.probabilities.homeWin >= 50 ? C.emerald : C.gold, fontSize: 10 }}>{pred.probabilities.homeWin}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.lbl}>🤖 AI SEASON PREVIEW</div>
        <button onClick={getAI} disabled={loading} style={S.btn}>
          {loading ? "⏳ Searching latest news..." : `📊 Get ${team} 2026/27 Preview`}
        </button>
        {aiText && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{aiText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TAB: LIVE RESULTS TRACKER
// ============================================================
function ResultsTrackerView({ liveResults = [] }) {
  const [tracked, setTracked] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const played = liveResults.filter(m => m.status === "FT" && m.homeScore !== null);
    const rows = played.map(m => {
      const pred = predictMatch(m.home, m.away, true);
      const [ph, pa] = pred.predictedScore.split("-").map(Number);
      const predOut = ph > pa ? "home" : pa > ph ? "away" : "draw";
      const realOut = m.homeScore > m.awayScore ? "home" : m.awayScore > m.homeScore ? "away" : "draw";
      return { id: m.id, home: m.home, away: m.away, realScore: `${m.homeScore}-${m.awayScore}`, realOut, predScore: pred.predictedScore, predOut, pHome: pred.probabilities.homeWin, pDraw: pred.probabilities.draw, pAway: pred.probabilities.awayWin, outcomeCorrect: realOut === predOut, scoreCorrect: m.homeScore === ph && m.awayScore === pa };
    });
    setTracked(rows);
  }, [liveResults]);

  const played = tracked.filter(m => m.realScore);
  const correct = played.filter(m => m.outcomeCorrect);
  const acc = played.length > 0 ? Math.round(correct.length / played.length * 100) : 0;
  const filtered = filter === "correct" ? tracked.filter(m => m.outcomeCorrect) : filter === "wrong" ? tracked.filter(m => !m.outcomeCorrect) : tracked;

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={S.lbl}>📈 PREDICTION ACCURACY — 2026/27</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[{ label: "PLAYED", value: played.length }, { label: "CORRECT", value: correct.length, color: C.emerald }, { label: "ACCURACY", value: `${acc}%`, color: acc >= 55 ? C.emerald : acc >= 40 ? C.gold : C.red }, { label: "SCORE HITS", value: played.filter(m => m.scoreCorrect).length, color: C.gold }].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#080f0a", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ color: C.muted, fontSize: 8, fontWeight: 700 }}>{s.label}</div>
              <div style={{ color: s.color || C.text, fontSize: 16, fontWeight: 900, marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>
        {played.length > 0 && (
          <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${acc}%`, background: acc >= 55 ? C.emerald : acc >= 40 ? C.gold : C.red, borderRadius: 2 }} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {[["all","All"], ["correct","✅ Correct"], ["wrong","❌ Wrong"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: filter === id ? C.emerald : "#162219", color: filter === id ? "#080f0a" : C.muted }}>
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 28 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🏁</div>
          {tracked.length === 0 ? "Tracking starts when the season kicks off on 21 Aug 2026." : "No matches in this filter."}
        </div>
      )}
      {filtered.map(m => (
        <div key={m.id} style={{ ...S.card, borderColor: m.outcomeCorrect ? "#065f46" : "#7f1d1d", background: m.outcomeCorrect ? "#050f07" : "#0f0505" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 6 }}>
            <span style={{ color: C.muted }}>Premier League 2026/27</span>
            <span style={{ color: m.outcomeCorrect ? C.emerald : C.red, fontWeight: 800 }}>
              {m.outcomeCorrect ? "✅ CORRECT" : "❌ WRONG"}{m.scoreCorrect ? " 🎯" : ""}
            </span>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            {BADGE[m.home] || "⚽"} {m.home} <span style={{ color: C.muted, fontWeight: 400 }}>vs</span> {BADGE[m.away] || "⚽"} {m.away}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ label: "REAL", score: m.realScore, color: C.accent }, { label: "PREDICTED", score: m.predScore, color: C.gold }].map(col => (
              <div key={col.label} style={{ flex: 1, background: "#080f0a", borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ color: C.muted, fontSize: 9, fontWeight: 700 }}>{col.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: col.color, marginTop: 4 }}>{col.score}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SHARED RAPID API KEY for Intel
// ============================================================
let SHARED_RAPID_KEY = "";

// ============================================================
// TAB: MATCH INTEL
// Live lineups, injuries, suspensions + AI briefing + odds prediction
// Uses: Free API Live Football Data (RapidAPI) + Anthropic AI
// ============================================================

// EPL-specific fallback intel for upcoming fixtures
// Format: "Home-Away" → intel object
const EPL_FALLBACK_INTEL = {};

// Generate generic intel when no fallback available
function generateEPLIntel(home, away, kickoff, venue) {
  const homeStr = STRENGTH[home] || 60;
  const awayStr = STRENGTH[away] || 60;
  const diff = homeStr - awayStr;
  const favoured = Math.abs(diff) < 5 ? "Evenly matched" : diff > 0 ? `${home} favoured` : `${away} favoured`;
  return {
    kickoff, home, away, venue: venue || "Premier League",
    status: "Pre-match",
    homeLineup: { confirmed: false, formation: "Unknown — check closer to KO", starters: [], injuries: [], suspensions: [], doubts: [] },
    awayLineup: { confirmed: false, formation: "Unknown — check closer to KO", starters: [], injuries: [], suspensions: [], doubts: [] },
    news: [
      `⚡ Strength: ${home} (${homeStr}) vs ${away} (${awayStr})`,
      `📊 ${favoured} per model ratings`,
      `🔑 Confirmed lineups available ~60min before kickoff via RapidAPI`,
    ],
    oddsMovement: "Connect Odds tab for latest market prices",
  };
}

// Normalise team names from API → our BADGE keys
const EPL_TEAM_MAP = {
  "Manchester City": "Manchester City",
  "Man City": "Manchester City",
  "Arsenal": "Arsenal",
  "Liverpool": "Liverpool",
  "Chelsea": "Chelsea",
  "Manchester United": "Manchester United",
  "Man Utd": "Manchester United",
  "Man United": "Manchester United",
  "Aston Villa": "Aston Villa",
  "Tottenham": "Tottenham Hotspur",
  "Tottenham Hotspur": "Tottenham Hotspur",
  "Spurs": "Tottenham Hotspur",
  "Newcastle": "Newcastle United",
  "Newcastle United": "Newcastle United",
  "Brighton": "Brighton",
  "Brighton & Hove Albion": "Brighton",
  "Brentford": "Brentford",
  "Fulham": "Fulham",
  "Crystal Palace": "Crystal Palace",
  "Bournemouth": "Bournemouth",
  "AFC Bournemouth": "Bournemouth",
  "Everton": "Everton",
  "Nottingham Forest": "Nottingham Forest",
  "Nott'm Forest": "Nottingham Forest",
  "Leeds": "Leeds United",
  "Leeds United": "Leeds United",
  "Sunderland": "Sunderland",
  "Coventry": "Coventry City",
  "Coventry City": "Coventry City",
  "Ipswich": "Ipswich Town",
  "Ipswich Town": "Ipswich Town",
  "Hull": "Hull City",
  "Hull City": "Hull City",
};
function normEPL(name) { return EPL_TEAM_MAP[name] || name; }

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

  // Manual match entry for when no live fixtures
  const [manualHome, setManualHome] = useState("Arsenal");
  const [manualAway, setManualAway] = useState("Manchester City");

  const rapidFetch = async (path, key) => {
    const resp = await fetch(`https://${RAPID_HOST}${path}`, {
      headers: {
        "x-rapidapi-host": RAPID_HOST,
        "x-rapidapi-key": key,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} on ${path}`);
    return resp.json();
  };

  const fetchLiveIntel = async (key) => {
    setLoading(true); setError(""); setUsingLive(false);
    try {
      // Try live matches first
      let fixtures = [];
      try {
        const liveData = await rapidFetch("/football-live-matches", key);
        const all = liveData?.response || liveData?.data || [];
        fixtures = all.filter(f =>
          f?.league?.name?.toLowerCase().includes("premier") ||
          f?.league?.id === 39 || f?.league?.id === "39"
        );
      } catch (e) {}

      // Try today's EPL fixtures (league_id=39 for EPL on RapidAPI)
      if (!fixtures.length) {
        try {
          const today = new Date().toISOString().split("T")[0];
          const fixData = await rapidFetch(
            `/football-get-matches-by-league-and-season?leagueId=39&season=2026&date=${today}`, key
          );
          fixtures = fixData?.response || fixData?.data || [];
        } catch (e) {}
      }

      // Try all EPL fixtures for season
      if (!fixtures.length) {
        try {
          const fixData = await rapidFetch(`/football-get-all-matches-by-league?leagueId=39&season=2026`, key);
          const all = fixData?.response || fixData?.data || [];
          const today = new Date().toISOString().split("T")[0];
          fixtures = all.filter(f => {
            const d = f?.fixture?.date || f?.date || "";
            return d.startsWith(today);
          });
        } catch (e) {}
      }

      if (!fixtures.length) {
        setError("✅ API connected. No live EPL fixtures today. Use manual entry below or check back on matchday.");
        setSavedKey(key); SHARED_RAPID_KEY = key;
        setLoading(false); return;
      }

      // Parse each fixture — lineups + injuries
      const intelMap = {};
      await Promise.all(fixtures.map(async (fix) => {
        const fid = fix?.fixture?.id || fix?.id;
        const home = normEPL(fix?.teams?.home?.name || fix?.homeTeam?.name || "");
        const away = normEPL(fix?.teams?.away?.name || fix?.awayTeam?.name || "");
        if (!home || !away) return;
        const matchKey = `${home}-${away}`;

        let homeLU = null, awayLU = null;
        try {
          const luData = await rapidFetch(`/football-get-lineups?matchId=${fid}`, key);
          const lineups = luData?.response || luData?.data || [];
          homeLU = lineups.find(l => normEPL(l?.team?.name || "") === home);
          awayLU = lineups.find(l => normEPL(l?.team?.name || "") === away);
        } catch (e) {}

        let homeInj = [], awayInj = [];
        try {
          const injData = await rapidFetch(`/football-injuries?matchId=${fid}`, key);
          const injuries = injData?.response || injData?.data || [];
          homeInj = injuries.filter(i => normEPL(i?.team?.name || "") === home);
          awayInj = injuries.filter(i => normEPL(i?.team?.name || "") === away);
        } catch (e) {}

        const parseLineup = (lu) => {
          const starters = Array.isArray(lu?.startXI)
            ? lu.startXI.slice(0, 11).map(p => p?.player?.name || p?.name || "").filter(Boolean)
            : [];
          return { confirmed: starters.length >= 11, formation: lu?.formation || "Unknown", starters, injuries: [], suspensions: [], doubts: [] };
        };
        const parseInj = (arr) => ({
          injuries: arr.filter(i => i?.player?.type !== "Suspension").map(i => `${i?.player?.name || ""} (${i?.player?.reason || "Injured"})`),
          suspensions: arr.filter(i => i?.player?.type === "Suspension").map(i => i?.player?.name || ""),
        });

        const homeParsed = { ...(homeLU ? parseLineup(homeLU) : { confirmed: false, formation: "Pending", starters: [], doubts: [] }), ...parseInj(homeInj) };
        const awayParsed = { ...(awayLU ? parseLineup(awayLU) : { confirmed: false, formation: "Pending", starters: [], doubts: [] }), ...parseInj(awayInj) };
        const fallback = EPL_FALLBACK_INTEL[matchKey] || {};

        intelMap[matchKey] = {
          kickoff: fix?.fixture?.date || fix?.date || "",
          home, away,
          status: fix?.fixture?.status?.long || "Scheduled",
          homeLineup: homeParsed,
          awayLineup: awayParsed,
          news: fallback.news || [],
          oddsMovement: fallback.oddsMovement || "",
        };
      }));

      if (Object.keys(intelMap).length) {
        setIntel(intelMap);
        setSavedKey(key); SHARED_RAPID_KEY = key;
        setUsingLive(true);
      } else {
        setError("Fixtures found but could not parse. Try manual entry below.");
      }
    } catch (e) {
      setError(`API Error: ${e.message}. Check your key or use manual entry.`);
    }
    setLoading(false);
  };

  // Add a manually entered match to intel
  const addManualMatch = () => {
    if (!manualHome || !manualAway || manualHome === manualAway) return;
    const matchKey = `${manualHome}-${manualAway}`;
    const generated = generateEPLIntel(manualHome, manualAway, new Date().toISOString(), "Premier League");
    setIntel(prev => ({ ...prev, [matchKey]: generated }));
    setExpanded(matchKey);
  };

  // Adjust strength based on confirmed absences
  const applyOverride = (matchKey, matchData) => {
    const homeAbsent = [...(matchData.homeLineup.injuries || []).map(i => i.split(" (")[0]), ...(matchData.homeLineup.suspensions || [])];
    const awayAbsent = [...(matchData.awayLineup.injuries || []).map(i => i.split(" (")[0]), ...(matchData.awayLineup.suspensions || [])];
    const adjHome = adjustedStrength(matchData.home, homeAbsent);
    const adjAway = adjustedStrength(matchData.away, awayAbsent);
    const newOv = { ...overrides, [matchData.home]: adjHome, [matchData.away]: adjAway };
    setOverrides(newOv);
    onStrengthOverride?.(newOv);
  };

  const clearOverride = (matchData) => {
    const newOv = { ...overrides };
    delete newOv[matchData.home]; delete newOv[matchData.away];
    setOverrides(newOv);
    onStrengthOverride?.(newOv);
  };

  // AI pre-match briefing
  const getAiBriefing = async (matchKey, matchData) => {
    setAiLoading(prev => ({ ...prev, [matchKey]: true }));
    try {
      const absentHome = [...(matchData.homeLineup?.injuries || []), ...(matchData.homeLineup?.suspensions || [])].join(", ") || "None confirmed";
      const absentAway = [...(matchData.awayLineup?.injuries || []), ...(matchData.awayLineup?.suspensions || [])].join(", ") || "None confirmed";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 700,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content:
            `Search for the latest on "${matchData.home} vs ${matchData.away} Premier League 2026-27 lineup injury team news" then write a sharp 3-paragraph EPL pre-match analyst briefing:
1. How do the absences/lineup shape change the match dynamic?
2. Which side does this intel favour and why?
3. One specific betting angle based on this intel with reasoning.
Match: ${matchData.home} (${matchData.homeLineup?.formation || "?"}) vs ${matchData.away} (${matchData.awayLineup?.formation || "?"}).
Absent — ${matchData.home}: ${absentHome} | ${matchData.away}: ${absentAway}.
Odds movement: ${matchData.oddsMovement || "Not available"}.
150 words max. Analyst tone. Flag if lineup unconfirmed.` }]
        })
      });
      const data = await resp.json();
      const text = data.content?.filter(c => c.type === "text").map(c => c.text || "").join("") || "";
      setAiSummary(prev => ({ ...prev, [matchKey]: text }));
    } catch (e) {
      setAiSummary(prev => ({ ...prev, [matchKey]: `AI briefing unavailable. Model: ${matchData.home} (${getStr(matchData.home)}) vs ${matchData.away} (${getStr(matchData.away)}).` }));
    }
    setAiLoading(prev => ({ ...prev, [matchKey]: false }));
  };

  // Full prediction with web-searched odds
  const getFullPrediction = async (matchKey, matchData) => {
    setPredLoading(prev => ({ ...prev, [matchKey]: true }));
    try {
      const pred = predictMatch(matchData.home, matchData.away, true);
      const absentHome = [...(matchData.homeLineup?.injuries || []), ...(matchData.homeLineup?.suspensions || [])].join(", ") || "None";
      const absentAway = [...(matchData.awayLineup?.injuries || []), ...(matchData.awayLineup?.suspensions || [])].join(", ") || "None";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content:
            `You are a Premier League 2026-27 betting analyst. Search for current odds on: "${matchData.home} vs ${matchData.away} Premier League odds 2026"

Then provide a structured prediction report:

**BOOKMAKER ODDS CONSENSUS**
Search and list odds from Pinnacle, Bet365, or OddsPortal:
- ${matchData.home} Win: [odds]
- Draw: [odds]
- ${matchData.away} Win: [odds]
- Over 2.5 Goals: [odds]
- Asian Handicap line and odds

**RESULT PREDICTION**
Predicted scoreline: [X-X]

**WIN PROBABILITY**
${matchData.home}: [X]%  Draw: [X]%  ${matchData.away}: [X]%

**MODEL CROSS-CHECK**
Poisson model: ${matchData.home} ${pred.probabilities.homeWin}% / Draw ${pred.probabilities.draw}% / ${matchData.away} ${pred.probabilities.awayWin}%
Model xG: ${pred.xG[matchData.home]} – ${pred.xG[matchData.away]} | Predicted score: ${pred.predictedScore}
Absent — ${matchData.home}: ${absentHome} | ${matchData.away}: ${absentAway}

**VALUE BET FLAG**
State VALUE or SKIP based on odds vs model divergence >8%.

**TACTICAL SUMMARY**
2 sentences on key tactical factor.

Be specific with real odds if found. If unavailable, state "Odds not found" and use model only.` }]
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const text = data.content?.filter(c => c.type === "text").map(c => c.text || "").join("") || "";
      setPredictions(prev => ({ ...prev, [matchKey]: text }));
    } catch (e) {
      const pred = predictMatch(matchData.home, matchData.away, true);
      setPredictions(prev => ({
        ...prev,
        [matchKey]: `**RESULT PREDICTION**\nPredicted score: ${pred.predictedScore}\n\n**WIN PROBABILITY (Model)**\n${matchData.home}: ${pred.probabilities.homeWin}%\nDraw: ${pred.probabilities.draw}%\n${matchData.away}: ${pred.probabilities.awayWin}%\n\nxG: ${pred.xG[matchData.home]} – ${pred.xG[matchData.away]}\nConfidence: ${pred.confidence}\n\n⚠️ Live odds unavailable — model only. Verify on OddsPortal before betting.`,
      }));
    }
    setPredLoading(prev => ({ ...prev, [matchKey]: false }));
  };

  const fmtKO = (d) => d ? new Date(d).toLocaleString("en-MY", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }) + " MYT" : "";

  return (
    <div style={{ padding: 12 }}>
      {/* API Key */}
      <div style={S.card}>
        <div style={{ ...S.lbl, marginBottom: 8 }}>🏥 MATCH INTEL — Lineups · Injuries · AI Briefing</div>
        <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>
          Connect <strong style={{ color: C.text }}>Free API Live Football Data</strong> on RapidAPI for live EPL lineups ~60min before kickoff, injuries, and suspensions. Or enter any match manually below.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...S.inp, flex: 1, fontFamily: "monospace", fontSize: 11 }}
            placeholder="Paste x-rapidapi-key here..."
            value={rapidKey}
            onChange={e => setRapidKey(e.target.value)}
            type="password"
          />
          <button
            onClick={() => rapidKey.trim() && fetchLiveIntel(rapidKey.trim())}
            disabled={loading || !rapidKey.trim()}
            style={{ ...S.btn, marginTop: 0, width: "auto", padding: "9px 16px", opacity: (!rapidKey.trim() || loading) ? 0.5 : 1 }}
          >
            {loading ? "⏳" : "Fetch"}
          </button>
        </div>
        {savedKey && !loading && (
          <button onClick={() => fetchLiveIntel(savedKey)} style={{ ...S.btn, background: "#162219", color: C.emerald }}>
            🔄 Refresh Intel
          </button>
        )}
        <div style={{ marginTop: 8, fontSize: 10, color: usingLive ? C.emerald : C.gold }}>
          {usingLive ? "✅ Live lineups & injuries from API" : "⚡ Manual mode — add any match below"}
        </div>
        {error && <div style={{ color: error.startsWith("✅") ? C.emerald : C.red, fontSize: 11, marginTop: 6 }}>{error}</div>}
      </div>

      {/* Manual match entry */}
      <div style={S.card}>
        <div style={S.lbl}>➕ ADD MATCH MANUALLY</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={S.lbl}>HOME</div>
            <select value={manualHome} onChange={e => setManualHome(e.target.value)} style={S.inp}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}</option>)}
            </select>
          </div>
          <div style={{ color: C.muted, fontWeight: 900, fontSize: 12, paddingTop: 22 }}>VS</div>
          <div style={{ flex: 1 }}>
            <div style={S.lbl}>AWAY</div>
            <select value={manualAway} onChange={e => setManualAway(e.target.value)} style={S.inp}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={addManualMatch} style={S.btn} disabled={manualHome === manualAway}>
          ➕ Add Match Intel Card
        </button>
      </div>

      {/* Intel cards */}
      {Object.entries(intel).map(([matchKey, match]) => {
        const isExpanded = expanded === matchKey;
        const hasOverride = overrides[match.home] || overrides[match.away];
        const homeAbsent = [...(match.homeLineup?.injuries || []).map(i => i.split(" (")[0]), ...(match.homeLineup?.suspensions || [])];
        const awayAbsent = [...(match.awayLineup?.injuries || []).map(i => i.split(" (")[0]), ...(match.awayLineup?.suspensions || [])];
        const baseHome = STRENGTH[match.home] || 60;
        const baseAway = STRENGTH[match.away] || 60;
        const adjHome = adjustedStrength(match.home, homeAbsent);
        const adjAway = adjustedStrength(match.away, awayAbsent);

        return (
          <div key={matchKey} style={S.card}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>
                  {BADGE[match.home] || "⚽"} {match.home} <span style={{ color: C.muted }}>vs</span> {BADGE[match.away] || "⚽"} {match.away}
                </div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>
                  🕐 {fmtKO(match.kickoff)} · {match.status}
                  {match.homeLineup?.confirmed
                    ? <span style={{ color: C.emerald, marginLeft: 6 }}>✅ Lineup confirmed</span>
                    : <span style={{ color: C.gold, marginLeft: 6 }}>⏳ Lineup expected</span>}
                </div>
              </div>
              <button onClick={() => setExpanded(isExpanded ? null : matchKey)}
                style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11 }}>
                {isExpanded ? "▲" : "▼"}
              </button>
            </div>

            {/* Strength impact bars */}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[{ team: match.home, base: baseHome, adj: adjHome }, { team: match.away, base: baseAway, adj: adjAway }].map(({ team, base, adj }) => (
                <div key={team} style={{ flex: 1, background: "#080f0a", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{BADGE[team]} {team}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: adj < base ? C.red : C.accent }}>{adj}</span>
                    {adj < base && <span style={{ fontSize: 10, color: C.red }}>↓{base - adj} pts</span>}
                    {adj === base && <span style={{ fontSize: 10, color: C.muted }}>base</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Override controls */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => applyOverride(matchKey, match)}
                style={{ flex: 1, background: hasOverride ? "#0a2e1a" : "#162219", border: `1px solid ${hasOverride ? C.emerald : C.border}`, color: hasOverride ? C.emerald : C.accent, borderRadius: 7, padding: "7px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {hasOverride ? "✅ Strength adjusted" : "⚡ Apply to model"}
              </button>
              {hasOverride && (
                <button onClick={() => clearOverride(match)}
                  style={{ background: "#1a0505", border: `1px solid ${C.red}`, color: C.red, borderRadius: 7, padding: "7px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  Reset
                </button>
              )}
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{ marginTop: 12 }}>
                {/* Lineups side by side */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[{ label: match.home, lu: match.homeLineup }, { label: match.away, lu: match.awayLineup }].map(({ label, lu }) => (
                    <div key={label} style={{ flex: 1, background: "#080f0a", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 5 }}>{BADGE[label]} {label}</div>
                      <div style={{ color: C.accent, fontSize: 10, marginBottom: 5 }}>
                        {lu?.formation} {lu?.confirmed ? "✅" : "⏳"}
                      </div>
                      {lu?.starters?.slice(0, 11).map((p, i) => (
                        <div key={i} style={{ fontSize: 10, color: C.muted, padding: "2px 0", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>{p}</div>
                      ))}
                      {lu?.injuries?.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ color: C.red, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>🏥 INJURED</div>
                          {lu.injuries.map((inj, i) => <div key={i} style={{ fontSize: 10, color: C.red }}>{inj}</div>)}
                        </div>
                      )}
                      {lu?.suspensions?.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ color: C.gold, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>🟨 SUSPENDED</div>
                          {lu.suspensions.map((s, i) => <div key={i} style={{ fontSize: 10, color: C.gold }}>{s}</div>)}
                        </div>
                      )}
                      {lu?.doubts?.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ color: C.muted, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>❓ DOUBTS</div>
                          {lu.doubts.map((d, i) => <div key={i} style={{ fontSize: 10, color: C.muted }}>{d}</div>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* News feed */}
                {match.news?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ ...S.lbl, marginBottom: 6 }}>📰 MATCH NEWS</div>
                    {match.news.map((n, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.muted, padding: "5px 8px", background: "#080f0a", borderRadius: 6, marginBottom: 4 }}>{n}</div>
                    ))}
                  </div>
                )}

                {/* Odds movement */}
                {match.oddsMovement && (
                  <div style={{ fontSize: 11, color: C.gold, padding: "6px 10px", background: "#1a1200", borderRadius: 6, marginBottom: 10 }}>
                    📈 {match.oddsMovement}
                  </div>
                )}

                {/* Full prediction with bookmaker odds */}
                <div style={{ marginBottom: 10 }}>
                  {predictions[matchKey] ? (
                    <div style={{ background: "#080f0a", border: `1px solid #1a3a2a`, borderRadius: 10, padding: 12 }}>
                      <div style={{ color: C.emerald, fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>📊 PREDICTION + ODDS ANALYSIS</div>
                      {predictions[matchKey].split("\n").map((line, i) => {
                        const isBold = line.startsWith("**");
                        const text = line.replace(/\*\*/g, "");
                        return (
                          <div key={i} style={{ fontSize: isBold ? 10 : 11, fontWeight: isBold ? 800 : 400, color: isBold ? C.accent : C.muted, marginTop: isBold ? 8 : 2, lineHeight: 1.5 }}>
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <button onClick={() => getFullPrediction(matchKey, match)} disabled={predLoading[matchKey]}
                      style={{ ...S.btn, marginTop: 0, background: predLoading[matchKey] ? "#162219" : "#0a2a1a", color: predLoading[matchKey] ? C.muted : C.emerald }}>
                      {predLoading[matchKey] ? "⏳ Searching odds + predictions..." : "📊 Get Prediction + Bookmaker Odds"}
                    </button>
                  )}
                </div>

                {/* AI briefing */}
                {aiSummary[matchKey] ? (
                  <div style={{ background: "#080f1a", border: `1px solid #1a2a3e`, borderRadius: 10, padding: 12 }}>
                    <div style={{ color: "#60a5fa", fontSize: 10, fontWeight: 800, marginBottom: 6, letterSpacing: 1 }}>🤖 AI PRE-MATCH BRIEFING</div>
                    <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.6, margin: 0 }}>{aiSummary[matchKey]}</p>
                  </div>
                ) : (
                  <button onClick={() => getAiBriefing(matchKey, match)} disabled={aiLoading[matchKey]}
                    style={{ ...S.btn, background: "#162219", color: C.accent }}>
                    {aiLoading[matchKey] ? "⏳ Generating briefing..." : "🤖 Get AI Pre-Match Briefing"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!Object.keys(intel).length && !loading && (
        <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 28 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🏥</div>
          <div style={{ fontSize: 12, marginBottom: 4 }}>No match intel loaded yet.</div>
          <div style={{ fontSize: 11 }}>Connect RapidAPI key above for live fixtures, or add a match manually.</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: SEASON TABLE — Live from ESPN, manual fallback
// Full 20-team standings, auto-refresh, zone colours, form
// ============================================================

// Initial empty table — all zeros, sorted by STRENGTH as pre-season proxy
const EMPTY_TABLE = Object.keys(BADGE).sort().map((team, i) => ({
  team, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0,
}));

function SeasonTableView() {
  const [standings, setStandings] = useState(EMPTY_TABLE);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [usingLive, setUsingLive]   = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [highlight, setHighlight]     = useState(null);
  const timerRef = useRef(null);

  // Manual result entry state
  const [mHome, setMHome] = useState("Arsenal");
  const [mAway, setMAway] = useState("Liverpool");
  const [mHG, setMHG]     = useState("1");
  const [mAG, setMAG]     = useState("0");
  const [manualRows, setManualRows] = useState([]); // {home,away,hg,ag}[]

  const fetchTable = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const resp = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/standings"
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      // ESPN standings shape: data.standings[0].entries[]
      const entries = data?.standings?.[0]?.entries || data?.children?.[0]?.standings?.entries || [];

      if (!entries.length) throw new Error("No standings data");

      const parsed = entries.map(e => {
        const name = e?.team?.displayName || e?.team?.name || "";
        const stats = {};
        (e?.stats || []).forEach(s => { stats[s.name] = s.value; });
        return {
          team: normEPL(name) || name,
          P:   Math.round(stats.gamesPlayed   ?? stats.GP ?? 0),
          W:   Math.round(stats.wins          ?? stats.W  ?? 0),
          D:   Math.round(stats.ties          ?? stats.D  ?? 0),
          L:   Math.round(stats.losses        ?? stats.L  ?? 0),
          GF:  Math.round(stats.pointsFor     ?? stats.GF ?? 0),
          GA:  Math.round(stats.pointsAgainst ?? stats.GA ?? 0),
          GD:  Math.round(stats.pointDifferential ?? (stats.GF - stats.GA) ?? 0),
          Pts: Math.round(stats.points        ?? stats.Pts ?? 0),
        };
      }).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);

      setStandings(parsed);
      setUsingLive(true);
      setLastUpdate(new Date());
    } catch (e) {
      setError(`ESPN feed error: ${e.message}. Showing current table.`);
      // keep existing standings
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTable(); }, []);
  useEffect(() => {
    if (autoRefresh) timerRef.current = setInterval(fetchTable, 120000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, fetchTable]);

  // Merge manual results into standings
  const computedStandings = useMemo(() => {
    if (!manualRows.length) return standings;
    // Clone
    const map = {};
    standings.forEach(row => { map[row.team] = { ...row }; });
    // Ensure all 20 teams present
    TEAMS.forEach(t => { if (!map[t]) map[t] = { team: t, P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0 }; });

    manualRows.forEach(({ home, away, hg, ag }) => {
      const h = map[home]; const a = map[away];
      if (!h || !a) return;
      h.P++; a.P++;
      h.GF += hg; h.GA += ag; h.GD = h.GF - h.GA;
      a.GF += ag; a.GA += hg; a.GD = a.GF - a.GA;
      if (hg > ag) { h.W++; h.Pts += 3; a.L++; }
      else if (hg === ag) { h.D++; h.Pts++; a.D++; a.Pts++; }
      else { a.W++; a.Pts += 3; h.L++; }
    });
    return Object.values(map).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
  }, [standings, manualRows]);

  const addManualResult = () => {
    const hg = parseInt(mHG, 10); const ag = parseInt(mAG, 10);
    if (mHome === mAway || isNaN(hg) || isNaN(ag)) return;
    setManualRows(prev => [...prev, { home: mHome, away: mAway, hg, ag }]);
  };

  const fmtTime = (d) => d ? d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" }) : "";

  // Zone definitions for 2026/27
  const getZone = (pos) => {
    if (pos <= 5)  return { color: "#fbbf24", label: "UCL" };
    if (pos === 6) return { color: "#f97316", label: "UEL" };
    if (pos === 7) return { color: "#f97316", label: "UEL*" };
    if (pos === 8) return { color: "#60a5fa", label: "UECL" };
    if (pos >= 18) return { color: C.red,     label: "REL" };
    return { color: "transparent", label: "" };
  };

  return (
    <div style={{ padding: 12 }}>
      {/* Controls */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ ...S.lbl, marginBottom: 0 }}>
            🏆 PREMIER LEAGUE TABLE 2026/27
            {usingLive && <span style={{ marginLeft: 8, color: C.emerald, fontSize: 9, fontWeight: 700 }}>● LIVE</span>}
          </div>
          {lastUpdate && <span style={{ color: C.muted, fontSize: 10 }}>{fmtTime(lastUpdate)}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchTable} disabled={loading} style={{ ...S.btn, marginTop: 0, flex: 1 }}>
            {loading ? "⏳" : "🔄 Refresh"}
          </button>
          <button onClick={() => setAutoRefresh(a => !a)} style={{ ...S.btn, marginTop: 0, flex: 1, background: autoRefresh ? "#0a2e1a" : "#162219", color: autoRefresh ? C.emerald : C.muted }}>
            {autoRefresh ? "⏱ Auto ON" : "⏱ Auto"}
          </button>
        </div>
        {autoRefresh && <div style={{ color: C.emerald, fontSize: 10, marginTop: 5 }}>✅ Auto-refresh every 2 minutes</div>}
        <div style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>ESPN · No API key · Season starts 21 Aug 2026</div>
        {error && <div style={{ color: C.gold, fontSize: 11, marginTop: 5 }}>{error}</div>}
      </div>

      {/* Zone legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {[
          { label: "Champions League (Top 5)", color: "#fbbf24" },
          { label: "Europa League (6–7)", color: "#f97316" },
          { label: "Conference (8)", color: "#60a5fa" },
          { label: "Relegation (18–20)", color: C.red },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ color: C.muted, fontSize: 9 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div style={{ ...S.card, padding: "10px 8px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 340 }}>
          <thead>
            <tr>
              {["#","Club","P","W","D","L","GF","GA","GD","Pts"].map(h => (
                <th key={h} style={{ ...S.th, textAlign: h === "Club" ? "left" : "center", paddingBottom: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {computedStandings.map((row, i) => {
              const zone = getZone(i + 1);
              const isNew = NEW_TEAMS.has(row.team);
              return (
                <tr key={row.team}
                  onClick={() => setHighlight(highlight === row.team ? null : row.team)}
                  style={{ cursor: "pointer", background: highlight === row.team ? "#0f2a15" : "transparent", transition: "background 0.1s" }}>
                  <td style={{ ...S.td, paddingLeft: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 3, height: 22, borderRadius: 2, background: zone.color, flexShrink: 0 }} />
                      <span style={{ color: C.muted, minWidth: 16, textAlign: "right" }}>{i + 1}</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, fontWeight: 700, whiteSpace: "nowrap" }}>
                    <span style={{ marginRight: 4 }}>{BADGE[row.team] || "⚽"}</span>
                    <span style={{ fontSize: 11 }}>
                      {row.team
                        .replace("Manchester", "Man")
                        .replace("Tottenham Hotspur", "Spurs")
                        .replace("Nottingham Forest", "Nott'm F")
                        .replace("Coventry City", "Coventry")
                        .replace("Ipswich Town", "Ipswich")
                        .replace("Hull City", "Hull")
                        .replace("Leeds United", "Leeds")
                        .replace("Newcastle United", "Newcastle")
                        .replace("Crystal Palace", "C. Palace")
                        .replace("Aston Villa", "A. Villa")}
                    </span>
                    {isNew && <span style={{ marginLeft: 3, fontSize: 8, color: C.emerald, fontWeight: 800 }}>↑</span>}
                  </td>
                  <td style={{ ...S.td, textAlign: "center", color: C.muted }}>{row.P}</td>
                  <td style={{ ...S.td, textAlign: "center", color: C.emerald, fontWeight: row.W > 0 ? 800 : 400 }}>{row.W}</td>
                  <td style={{ ...S.td, textAlign: "center", color: C.gold }}>{row.D}</td>
                  <td style={{ ...S.td, textAlign: "center", color: row.L > 0 ? C.red : C.muted }}>{row.L}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{row.GF}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{row.GA}</td>
                  <td style={{ ...S.td, textAlign: "center", color: row.GD > 0 ? C.emerald : row.GD < 0 ? C.red : C.muted, fontWeight: 700 }}>
                    {row.GD > 0 ? `+${row.GD}` : row.GD}
                  </td>
                  <td style={{ ...S.td, textAlign: "center", color: C.accent, fontWeight: 900, fontSize: 13 }}>{row.Pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manual result entry */}
      <div style={S.card}>
        <div style={S.lbl}>➕ ADD RESULT MANUALLY</div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
          If ESPN feed is unavailable, enter results here to update the table.
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
          <div style={{ flex: 2 }}>
            <div style={S.lbl}>HOME</div>
            <select value={mHome} onChange={e => setMHome(e.target.value)} style={{ ...S.inp, fontSize: 11 }}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", paddingBottom: 2 }}>
            <input value={mHG} onChange={e => setMHG(e.target.value)} style={{ ...S.inp, width: 40, textAlign: "center", padding: "9px 4px" }} type="number" min="0" max="20" />
            <span style={{ color: C.muted, fontWeight: 900 }}>–</span>
            <input value={mAG} onChange={e => setMAG(e.target.value)} style={{ ...S.inp, width: 40, textAlign: "center", padding: "9px 4px" }} type="number" min="0" max="20" />
          </div>
          <div style={{ flex: 2 }}>
            <div style={S.lbl}>AWAY</div>
            <select value={mAway} onChange={e => setMAway(e.target.value)} style={{ ...S.inp, fontSize: 11 }}>
              {TEAMS.map(t => <option key={t} value={t}>{BADGE[t]} {t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={addManualResult} style={S.btn} disabled={mHome === mAway}>
          ➕ Add Result
        </button>
        {manualRows.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={S.lbl}>MANUALLY ENTERED ({manualRows.length})</div>
            {manualRows.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderTop: `1px solid ${C.border}`, fontSize: 11 }}>
                <span>{BADGE[r.home]} {r.home}</span>
                <span style={{ color: C.accent, fontWeight: 800 }}>{r.hg} – {r.ag}</span>
                <span>{BADGE[r.away]} {r.away}</span>
                <button onClick={() => setManualRows(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 12 }}>✕</button>
              </div>
            ))}
            <button onClick={() => setManualRows([])} style={{ ...S.btn, background: "#1a0505", color: C.red, marginTop: 8 }}>
              Clear All Manual Results
            </button>
          </div>
        )}
      </div>

      {/* Top scorers quick-fetch */}
      <div style={{ ...S.card, background: "#080f1a", borderColor: "#1a2a3e" }}>
        <div style={S.lbl}>ℹ️ 2026/27 SEASON INFO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0", fontSize: 11 }}>
          <span style={{ color: C.muted }}>Season start</span><span style={{ textAlign: "right" }}>21 Aug 2026</span>
          <span style={{ color: C.muted }}>Season end</span><span style={{ textAlign: "right" }}>30 May 2027</span>
          <span style={{ color: C.muted }}>Defending champions</span><span style={{ textAlign: "right", color: C.gold }}>🔴 Arsenal</span>
          <span style={{ color: C.muted }}>Promoted</span><span style={{ textAlign: "right", color: C.emerald }}>Coventry · Ipswich · Hull</span>
          <span style={{ color: C.muted }}>UCL spots</span><span style={{ textAlign: "right" }}>Top 5</span>
          <span style={{ color: C.muted }}>UEL spots</span><span style={{ textAlign: "right" }}>6th, 7th (+ FA Cup)</span>
          <span style={{ color: C.muted }}>UECL spot</span><span style={{ textAlign: "right" }}>8th (+ League Cup)</span>
          <span style={{ color: C.muted }}>Transfer deadline</span><span style={{ textAlign: "right" }}>1 Sep 2026</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState("rankings");
  const [modelVersion, setModelVersion] = useState(0);
  const [liveResults, setLiveResults] = useState([]);
  const handleLiveUpdate = useCallback((matches) => { setLiveResults(matches); }, []);

  const handleStrengthOverride = useCallback((overrides) => {
    STRENGTH_OVERRIDES = overrides;
    setModelVersion(n => n + 1);
  }, []);

  const tabs = [
    { id: "rankings", label: "⚡ Rankings" },
    { id: "table",    label: "🏆 Table" },
    { id: "live",     label: "🔴 Live" },
    { id: "intel",    label: "🏥 Intel" },
    { id: "predict",  label: "🔮 Predict" },
    { id: "betting",  label: "🎯 Betting" },
    { id: "odds",     label: "📡 Odds" },
    { id: "teams",    label: "🔍 Teams" },
    { id: "results",  label: "📊 Results" },
  ];

  return (
    <div style={S.app}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        select option { background: #0d1a10; color: #f0fdf4; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #080f0a; }
        ::-webkit-scrollbar-thumb { background: #1a2e1e; border-radius: 2px; }
      `}</style>
      <div style={S.hdr}>
        <div style={{ fontSize: "clamp(18px,4.5vw,26px)", fontWeight: 900, background: "linear-gradient(90deg,#34d399,#f59e0b,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>
          ⚽ Premier League 2026/27
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>AI Predictor · Live Scores · Betting Edge</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 6, fontSize: 10 }}>
          <span style={{ color: C.emerald }}>🏆 Arsenal (Champions)</span>
          <span style={{ color: C.gold }}>↑ Coventry · Ipswich · Hull</span>
        </div>
      </div>
      <div style={S.nav}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={S.nb(tab === t.id)}>{t.label}</button>)}
      </div>
      <div>
        {tab === "rankings" && <PowerRankingsView />}
        {tab === "table"    && <SeasonTableView />}
        {tab === "live"     && <LiveScoresView onLiveUpdate={handleLiveUpdate} />}
        {tab === "intel"    && <IntelView onStrengthOverride={handleStrengthOverride} />}
        {tab === "predict"  && <PredictView />}
        {tab === "betting"  && <BettingView modelVersion={modelVersion} />}
        {tab === "odds"     && <OddsView />}
        {tab === "teams"    && <TeamIntelView />}
        {tab === "results"  && <ResultsTrackerView liveResults={liveResults} />}
      </div>
    </div>
  );
}
