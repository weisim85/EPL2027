import { useState, useMemo, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

// ============================================================
// DESIGN TOKENS — MoneyMap
// ============================================================
const C = {
  bg: "#070c0f",
  surface: "#0d1318",
  card: "#111a1f",
  border: "#1a2a32",
  accent: "#00c2ff",
  accentDim: "#005f7a",
  green: "#2dd87a",
  gold: "#f5c842",
  red: "#f04f4f",
  purple: "#a78bfa",
  orange: "#fb923c",
  text: "#e0eef5",
  sub: "#5f8fa8",
  muted: "#243642",
};

const fmt = (n, cur = "") => {
  if (n === undefined || n === null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  let s = abs >= 1_000_000 ? (n/1_000_000).toFixed(2)+"M"
        : abs >= 1_000 ? (n/1_000).toFixed(1)+"K"
        : n.toFixed(0);
  return cur ? `${cur} ${s}` : s;
};
const fmtFull = (n, cur = "") => {
  if (n === undefined || n === null || isNaN(n)) return "—";
  const s = Math.round(n).toLocaleString();
  return cur ? `${cur} ${s}` : s;
};
const pct = (n) => isNaN(n) ? "0%" : (n*100).toFixed(1)+"%";
const num = (v) => Number(v) || 0;

// ============================================================
// SHARED COMPONENTS
// ============================================================
const S = {
  page: { background: C.bg, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", color:C.text, paddingBottom:48 },
  header: { background:"linear-gradient(150deg,#0a1825 0%,#070c0f 100%)", borderBottom:`1px solid ${C.border}`, padding:"18px 16px 14px" },
  nav: { display:"flex", gap:5, padding:"10px 10px", borderBottom:`1px solid ${C.border}`, background:C.surface, overflowX:"auto" },
  navBtn: (a) => ({ padding:"6px 11px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:11, whiteSpace:"nowrap", background: a ? C.accent : C.muted, color: a ? "#070c0f" : C.sub }),
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:12 },
  label: { fontSize:10, fontWeight:700, color:C.sub, letterSpacing:1, marginBottom:5, display:"block" },
  input: { background:"#070c0f", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"10px 12px", fontSize:14, width:"100%", outline:"none", boxSizing:"border-box" },
  row: { display:"flex", gap:8, marginBottom:10 },
  btn: (color=C.accent) => ({ background:color, color: color===C.accent?"#070c0f":C.text, border:"none", borderRadius:10, padding:"11px 0", fontWeight:800, fontSize:13, width:"100%", cursor:"pointer", marginTop:6 }),
  sec: { padding:"0 12px" },
  statGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 },
  rCard: (color=C.accent) => ({ background:`${color}12`, border:`1px solid ${color}40`, borderRadius:12, padding:14, marginBottom:10 }),
};

const Stat = ({ label, value, color=C.accent, sub }) => (
  <div style={{ background:"#070c0f", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px" }}>
    <div style={{ fontSize:9, fontWeight:700, color:C.sub, letterSpacing:1, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:19, fontWeight:900, color }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{sub}</div>}
  </div>
);

const Bar = ({ value, max, color=C.accent }) => {
  const p = Math.min(100, Math.max(0, (value/max)*100));
  return (
    <div style={{ height:6, borderRadius:3, background:C.border, marginTop:6, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${p}%`, background:color, borderRadius:3, transition:"width 0.5s" }} />
    </div>
  );
};

const Field = ({ label, value, onChange, step=1, min=0, max, placeholder="0" }) => (
  <div style={{ marginBottom:10 }}>
    {label && <span style={S.label}>{label}</span>}
    <input type="number" value={value} onChange={e=>onChange(e.target.value)}
      step={step} min={min} max={max} placeholder={placeholder} style={S.input} />
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
    <span style={{ fontSize:13, color:C.text }}>{label}</span>
    <button onClick={()=>onChange(!value)} style={{
      background: value ? C.accent : C.muted,
      border:"none", borderRadius:999, padding:"4px 12px",
      color: value ? "#070c0f" : C.sub, fontWeight:700, fontSize:11, cursor:"pointer",
    }}>{value ? "ON" : "OFF"}</button>
  </div>
);

const Section = ({ title, color=C.accent, children, collapsible=false }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={S.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: open ? 12 : 0 }}
        onClick={()=>collapsible&&setOpen(!open)}>
        <div style={{ fontSize:11, fontWeight:800, color, letterSpacing:1 }}>{title}</div>
        {collapsible && <span style={{ color:C.sub, fontSize:14 }}>{open?"▲":"▼"}</span>}
      </div>
      {open && children}
    </div>
  );
};

// ============================================================
// BUDGET OVERVIEW (new — Monthly fixed commitments + buckets)
// ============================================================
function BudgetView({ currency }) {
  const [income, setIncome] = useState(8000);

  // Fixed commitments
  const [commitments, setCommitments] = useState([
    { id:1, label:"Rent / Mortgage",   amount:1800, category:"housing" },
    { id:2, label:"Car Loan",          amount:600,  category:"transport" },
    { id:3, label:"Utilities & Bills", amount:300,  category:"housing" },
    { id:4, label:"Groceries",         amount:600,  category:"food" },
    { id:5, label:"Insurance",         amount:400,  category:"insurance" },
    { id:6, label:"Parents / Family",  amount:500,  category:"family" },
    { id:7, label:"Subscriptions",     amount:100,  category:"lifestyle" },
  ]);

  // Saving buckets
  const [buckets, setBuckets] = useState([
    { id:1, label:"Emergency Fund",  target:30000, current:10000, monthly:500,  color:C.red },
    { id:2, label:"Retirement / EPF",target:500000,current:80000, monthly:1000, color:C.green },
    { id:3, label:"Holiday / Travel",target:10000, current:2000,  monthly:300,  color:C.gold },
    { id:4, label:"Home Purchase",   target:100000,current:15000, monthly:500,  color:C.accent },
  ]);

  // Insurance plans
  const [showInsurance, setShowInsurance] = useState(false);
  const [insurance, setInsurance] = useState([
    { id:1, label:"Life Insurance",      premium:150, coverage:500000, type:"life",     active:true },
    { id:2, label:"Medical Insurance",   premium:200, coverage:100000, type:"medical",  active:true },
    { id:3, label:"Critical Illness",    premium:180, coverage:200000, type:"critical", active:false },
    { id:4, label:"Personal Accident",   premium:50,  coverage:100000, type:"accident", active:true },
  ]);

  // Calculations
  const totalCommitments = commitments.reduce((s,c) => s + num(c.amount), 0);
  const totalBuckets = buckets.reduce((s,b) => s + num(b.monthly), 0);
  const totalInsurance = showInsurance ? insurance.filter(i=>i.active).reduce((s,i) => s + num(i.premium), 0) : 0;
  const totalOut = totalCommitments + totalBuckets + totalInsurance;
  const surplus = num(income) - totalOut;
  const savingsRate = num(income) > 0 ? totalBuckets / num(income) : 0;
  const commitRatio = num(income) > 0 ? totalCommitments / num(income) : 0;

  const updateCommit = (id, field, val) => setCommitments(c => c.map(i => i.id===id ? {...i,[field]:val} : i));
  const addCommit = () => setCommitments(c => [...c, { id: Date.now(), label:"New commitment", amount:0, category:"other" }]);
  const removeCommit = (id) => setCommitments(c => c.filter(i => i.id!==id));

  const updateBucket = (id, field, val) => setBuckets(b => b.map(i => i.id===id ? {...i,[field]:val} : i));
  const addBucket = () => setBuckets(b => [...b, { id:Date.now(), label:"New goal", target:10000, current:0, monthly:200, color:C.purple }]);
  const removeBucket = (id) => setBuckets(b => b.filter(i => i.id!==id));

  const updateInsurance = (id, field, val) => setInsurance(ins => ins.map(i => i.id===id ? {...i,[field]:val} : i));
  const addInsurance = () => setInsurance(ins => [...ins, { id:Date.now(), label:"New policy", premium:0, coverage:0, type:"other", active:true }]);

  const catColors = { housing:C.accent, transport:C.blue, food:C.green, insurance:C.purple, family:C.gold, lifestyle:C.orange, other:C.sub };

  return (
    <div style={S.sec}>
      {/* Income */}
      <Section title="💵 MONTHLY INCOME" color={C.green}>
        <Field label={`TAKE-HOME PAY (${currency})`} value={income} onChange={setIncome} />
      </Section>

      {/* Summary bar */}
      <div style={{ ...S.rCard(surplus >= 0 ? C.green : C.red) }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:800 }}>
            {surplus >= 0 ? "✅ You have breathing room" : "🚨 Overspending"}
          </div>
          <div style={{ fontSize:20, fontWeight:900, color: surplus >= 0 ? C.green : C.red }}>
            {fmtFull(Math.abs(surplus), currency)}
            <span style={{ fontSize:10, color:C.sub, fontWeight:400 }}> {surplus>=0?"left":"over"}</span>
          </div>
        </div>
        <Bar value={totalOut} max={num(income)} color={surplus >= 0 ? C.accent : C.red} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.sub, marginTop:6 }}>
          <span>Committed: {fmtFull(totalCommitments, currency)}</span>
          <span>Saving: {fmtFull(totalBuckets, currency)}</span>
          <span>Total out: {fmtFull(totalOut, currency)}</span>
        </div>
      </div>

      <div style={S.statGrid}>
        <Stat label="SAVINGS RATE" value={pct(savingsRate)} color={savingsRate>0.2?C.green:savingsRate>0.1?C.gold:C.red} sub="of income saved" />
        <Stat label="COMMITMENT RATIO" value={pct(commitRatio)} color={commitRatio<0.5?C.green:commitRatio<0.7?C.gold:C.red} sub="of income fixed" />
      </div>

      {/* Fixed Commitments */}
      <Section title="🔒 MONTHLY FIXED COMMITMENTS" color={C.accent} collapsible>
        {commitments.map(c => (
          <div key={c.id} style={{ display:"flex", gap:6, marginBottom:8, alignItems:"center" }}>
            <div style={{ width:4, height:36, borderRadius:2, background: catColors[c.category]||C.sub, flexShrink:0 }} />
            <input value={c.label} onChange={e=>updateCommit(c.id,"label",e.target.value)}
              style={{ ...S.input, flex:2, fontSize:12 }} />
            <input type="number" value={c.amount} onChange={e=>updateCommit(c.id,"amount",e.target.value)}
              style={{ ...S.input, flex:1, fontSize:12 }} />
            <button onClick={()=>removeCommit(c.id)}
              style={{ background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer" }}>×</button>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontSize:12, color:C.sub }}>Total fixed</span>
          <span style={{ fontSize:14, fontWeight:800, color:C.accent }}>{fmtFull(totalCommitments, currency)}</span>
        </div>
        <button onClick={addCommit} style={S.btn(C.accentDim)}>+ Add Commitment</button>
      </Section>

      {/* Saving Buckets */}
      <Section title="🪣 SAVING BUCKETS" color={C.gold} collapsible>
        {buckets.map(b => {
          const progress = Math.min(100, (num(b.current)/num(b.target))*100);
          const monthsLeft = num(b.target) - num(b.current) > 0 && num(b.monthly) > 0
            ? Math.ceil((num(b.target)-num(b.current))/num(b.monthly)) : 0;
          return (
            <div key={b.id} style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", gap:6, marginBottom:6 }}>
                <input value={b.label} onChange={e=>updateBucket(b.id,"label",e.target.value)}
                  style={{ ...S.input, flex:2, fontSize:12 }} />
                <button onClick={()=>removeBucket(b.id)}
                  style={{ background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer" }}>×</button>
              </div>
              <div style={{ display:"flex", gap:6, marginBottom:6 }}>
                <div style={{ flex:1 }}>
                  <span style={S.label}>TARGET</span>
                  <input type="number" value={b.target} onChange={e=>updateBucket(b.id,"target",e.target.value)} style={S.input} />
                </div>
                <div style={{ flex:1 }}>
                  <span style={S.label}>CURRENT</span>
                  <input type="number" value={b.current} onChange={e=>updateBucket(b.id,"current",e.target.value)} style={S.input} />
                </div>
                <div style={{ flex:1 }}>
                  <span style={S.label}>MONTHLY</span>
                  <input type="number" value={b.monthly} onChange={e=>updateBucket(b.id,"monthly",e.target.value)} style={S.input} />
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.sub, marginBottom:3 }}>
                <span>{progress.toFixed(0)}% funded</span>
                <span>{monthsLeft > 0 ? `${monthsLeft} months to goal` : "✅ Goal reached!"}</span>
              </div>
              <Bar value={progress} max={100} color={b.color} />
            </div>
          );
        })}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontSize:12, color:C.sub }}>Total saving</span>
          <span style={{ fontSize:14, fontWeight:800, color:C.gold }}>{fmtFull(totalBuckets, currency)}/mo</span>
        </div>
        <button onClick={addBucket} style={S.btn("#4a3200")}>+ Add Saving Goal</button>
      </Section>

      {/* Insurance — optional toggle */}
      <Section title="🛡️ INSURANCE COVERAGE" color={C.purple} collapsible>
        <Toggle label="Include insurance in budget" value={showInsurance} onChange={setShowInsurance} />
        {showInsurance && (
          <>
            {insurance.map(ins => (
              <div key={ins.id} style={{ marginBottom:10, padding:10, background:"#070c0f", borderRadius:10, border:`1px solid ${ins.active ? C.purple+"40" : C.border}`, opacity: ins.active ? 1 : 0.5 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <input value={ins.label} onChange={e=>updateInsurance(ins.id,"label",e.target.value)}
                    style={{ ...S.input, flex:1, fontSize:12, marginRight:8 }} />
                  <button onClick={()=>updateInsurance(ins.id,"active",!ins.active)} style={{
                    background: ins.active ? C.purple : C.muted, border:"none", borderRadius:6,
                    padding:"4px 10px", color: ins.active ? "#070c0f" : C.sub, fontWeight:700, fontSize:10, cursor:"pointer",
                  }}>{ins.active ? "Active" : "Off"}</button>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <div style={{ flex:1 }}>
                    <span style={S.label}>MONTHLY PREMIUM</span>
                    <input type="number" value={ins.premium} onChange={e=>updateInsurance(ins.id,"premium",e.target.value)} style={S.input} />
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={S.label}>COVERAGE</span>
                    <input type="number" value={ins.coverage} onChange={e=>updateInsurance(ins.id,"coverage",e.target.value)} style={S.input} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.sub }}>Total premiums</span>
              <span style={{ fontSize:14, fontWeight:800, color:C.purple }}>{fmtFull(totalInsurance, currency)}/mo</span>
            </div>
            <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>
              Total coverage: {fmtFull(insurance.filter(i=>i.active).reduce((s,i)=>s+num(i.coverage),0), currency)}
            </div>
            <button onClick={addInsurance} style={S.btn("#1a0f2a")}>+ Add Insurance Plan</button>
          </>
        )}
      </Section>
    </div>
  );
}

// ============================================================
// RETIREMENT CALCULATOR
// ============================================================
function RetirementCalc({ currency }) {
  const [age, setAge] = useState(30);
  const [retireAge, setRetireAge] = useState(60);
  const [lifeExp, setLifeExp] = useState(80);
  const [savings, setSavings] = useState(50000);
  const [monthly, setMonthly] = useState(2000);
  const [epf, setEpf] = useState(1500);
  const [ret, setRet] = useState(7);
  const [inflation, setInflation] = useState(3);
  const [monthlyNeeds, setMonthlyNeeds] = useState(5000);
  const [fixedCommit, setFixedCommit] = useState(0);

  const result = useMemo(() => {
    const years = num(retireAge) - num(age);
    const postYears = num(lifeExp) - num(retireAge);
    const mr = num(ret)/100/12;
    const totalMonthly = num(monthly) + num(epf);
    const fvSavings = num(savings) * Math.pow(1 + num(ret)/100, years);
    const fvContribs = totalMonthly * ((Math.pow(1+mr, years*12)-1)/mr);
    const totalAtRetirement = fvSavings + fvContribs;
    const inflatedMonthlyNeeds = num(monthlyNeeds) * Math.pow(1+num(inflation)/100, years);
    const annualNeeds = inflatedMonthlyNeeds * 12;
    const realRate = (num(ret)-num(inflation))/100;
    const neededAtRetirement = realRate > 0
      ? annualNeeds * (1-Math.pow(1+realRate,-postYears))/realRate
      : annualNeeds * postYears;
    const surplus = totalAtRetirement - neededAtRetirement;
    const funded = Math.min(100, (totalAtRetirement/neededAtRetirement)*100);
    const gap = Math.max(0, neededAtRetirement - fvSavings);
    const monthlyNeeded = gap > 0 && years > 0 ? gap/((Math.pow(1+mr,years*12)-1)/mr) : 0;
    const effectiveSavings = num(monthly) + num(epf) - num(fixedCommit);
    return { totalAtRetirement, neededAtRetirement, surplus, funded, monthlyNeeded, inflatedMonthlyNeeds, years, postYears, effectiveSavings };
  }, [age, retireAge, lifeExp, savings, monthly, epf, ret, inflation, monthlyNeeds, fixedCommit]);

  const onTrack = result.funded >= 100;

  return (
    <div style={S.sec}>
      <Section title="👤 YOUR PROFILE" color={C.accent}>
        <div style={S.row}>
          <div style={{flex:1}}><Field label="CURRENT AGE" value={age} onChange={setAge} min={18} /></div>
          <div style={{flex:1}}><Field label="RETIRE AT" value={retireAge} onChange={setRetireAge} /></div>
          <div style={{flex:1}}><Field label="LIFE EXPECT" value={lifeExp} onChange={setLifeExp} /></div>
        </div>
        <Field label={`CURRENT SAVINGS (${currency})`} value={savings} onChange={setSavings} />
        <div style={S.row}>
          <div style={{flex:1}}><Field label="MONTHLY SAVINGS" value={monthly} onChange={setMonthly} /></div>
          <div style={{flex:1}}><Field label="MONTHLY EPF" value={epf} onChange={setEpf} /></div>
        </div>
        <Field label={`FIXED COMMITMENTS TO DEDUCT (${currency})`} value={fixedCommit} onChange={setFixedCommit} />
        <Field label={`MONTHLY NEEDS AT RETIREMENT (${currency})`} value={monthlyNeeds} onChange={setMonthlyNeeds} />
        <div style={S.row}>
          <div style={{flex:1}}><Field label="ANNUAL RETURN %" value={ret} onChange={setRet} step={0.5} /></div>
          <div style={{flex:1}}><Field label="INFLATION %" value={inflation} onChange={setInflation} step={0.5} /></div>
        </div>
      </Section>

      <div style={S.rCard(onTrack ? C.green : C.red)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ fontSize:13, fontWeight:800 }}>{onTrack?"✅ ON TRACK":"⚠️ FUNDING GAP"}</div>
          <div style={{ fontSize:22, fontWeight:900, color: onTrack?C.green:C.red }}>{result.funded.toFixed(0)}%</div>
        </div>
        <Bar value={result.funded} max={100} color={onTrack?C.green:C.red} />
        <div style={{ fontSize:10, color:C.sub, marginTop:6 }}>{result.years}y to retire · {result.postYears}y in retirement</div>
      </div>

      <div style={S.statGrid}>
        <Stat label="AT RETIREMENT" value={fmt(result.totalAtRetirement,currency)} color={C.accent} />
        <Stat label="NEEDED" value={fmt(result.neededAtRetirement,currency)} color={C.gold} />
        <Stat label={result.surplus>=0?"SURPLUS":"SHORTFALL"} value={fmt(Math.abs(result.surplus),currency)} color={result.surplus>=0?C.green:C.red} />
        <Stat label="INFLATION-ADJ NEEDS/MO" value={fmt(result.inflatedMonthlyNeeds,currency)} color={C.accent} sub="at retirement" />
      </div>

      {!onTrack && (
        <div style={{ ...S.card, borderColor:C.red+"60", background:"#1a0808" }}>
          <div style={{ color:C.red, fontSize:11, fontWeight:800, marginBottom:4 }}>TO CLOSE THE GAP</div>
          <div style={{ color:C.text, fontSize:16, fontWeight:900 }}>{fmtFull(result.monthlyNeeded,currency)} <span style={{ fontSize:11, color:C.sub, fontWeight:400 }}>/ month additional</span></div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EMERGENCY FUND
// ============================================================
function EmergencyCalc({ currency }) {
  const [monthly, setMonthly] = useState(5000);
  const [months, setMonths] = useState(6);
  const [current, setCurrent] = useState(10000);
  const [dependents, setDependents] = useState(1);
  const [jobSecurity, setJobSecurity] = useState("medium");
  const [fixedCommit, setFixedCommit] = useState(2000);

  const result = useMemo(() => {
    const expenses = num(monthly) + num(fixedCommit);
    const jobMult = jobSecurity==="low"?1.5:jobSecurity==="high"?0.75:1;
    const depMult = dependents > 2 ? 9 : dependents > 0 ? 6 : 3;
    const recommended = expenses * depMult * jobMult;
    const target = expenses * num(months);
    const gap = Math.max(0, target - num(current));
    const funded = Math.min(100, (num(current)/target)*100);
    const monthsToFund = gap > 0 ? gap/(expenses*0.2) : 0;
    return { recommended, target, gap, funded, monthsToFund, expenses };
  }, [monthly, months, current, dependents, jobSecurity, fixedCommit]);

  return (
    <div style={S.sec}>
      <Section title="💰 EMERGENCY FUND" color={C.red}>
        <Field label={`MONTHLY LIVING EXPENSES (${currency})`} value={monthly} onChange={setMonthly} />
        <Field label={`MONTHLY FIXED COMMITMENTS (${currency})`} value={fixedCommit} onChange={setFixedCommit} />
        <div style={{ fontSize:10, color:C.sub, marginTop:-6, marginBottom:10 }}>Total protected: {fmtFull(result.expenses, currency)}/mo</div>
        <div style={S.row}>
          <div style={{flex:1}}>
            <span style={S.label}>TARGET MONTHS</span>
            <select value={months} onChange={e=>setMonths(e.target.value)} style={S.input}>
              {[3,4,5,6,9,12].map(m=><option key={m} value={m}>{m} months</option>)}
            </select>
          </div>
          <div style={{flex:1}}>
            <span style={S.label}>DEPENDENTS</span>
            <select value={dependents} onChange={e=>setDependents(Number(e.target.value))} style={S.input}>
              <option value={0}>None</option><option value={1}>1–2</option><option value={3}>3+</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <span style={S.label}>JOB SECURITY</span>
          <div style={{ display:"flex", gap:6 }}>
            {["low","medium","high"].map(j=>(
              <button key={j} onClick={()=>setJobSecurity(j)} style={{
                flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer",
                fontWeight:700, fontSize:11, textTransform:"capitalize",
                background: jobSecurity===j?C.red:C.muted, color: jobSecurity===j?"#fff":C.sub,
              }}>{j}</button>
            ))}
          </div>
        </div>
        <Field label={`CURRENT EMERGENCY FUND (${currency})`} value={current} onChange={setCurrent} />
      </Section>

      <div style={S.rCard(result.funded>=100?C.green:result.funded>=50?C.gold:C.red)}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontSize:13, fontWeight:800 }}>
            {result.funded>=100?"✅ Fully funded":result.funded>=50?"⚠️ Partially funded":"🚨 Under-funded"}
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:result.funded>=100?C.green:result.funded>=50?C.gold:C.red }}>
            {result.funded.toFixed(0)}%
          </div>
        </div>
        <Bar value={result.funded} max={100} color={result.funded>=100?C.green:result.funded>=50?C.gold:C.red} />
      </div>

      <div style={S.statGrid}>
        <Stat label="TARGET FUND" value={fmtFull(result.target,currency)} color={C.gold} />
        <Stat label="CURRENT" value={fmtFull(num(current),currency)} color={C.green} />
        <Stat label="SHORTFALL" value={fmtFull(result.gap,currency)} color={result.gap>0?C.red:C.green} />
        <Stat label="RECOMMENDED" value={fmtFull(result.recommended,currency)} color={C.accent} sub="by profile" />
      </div>

      {result.gap > 0 && (
        <Section title="📅 BUILD YOUR FUND" color={C.gold}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.sub, marginBottom:4 }}>
            <span>Save 20% of expenses monthly</span>
            <span style={{ color:C.text, fontWeight:700 }}>{fmtFull(result.expenses*0.2,currency)}/mo</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.sub }}>
            <span>Fully funded in</span>
            <span style={{ color:C.text, fontWeight:700 }}>{result.monthsToFund.toFixed(0)} months</span>
          </div>
        </Section>
      )}
    </div>
  );
}

// ============================================================
// LOAN CALCULATOR
// ============================================================
function LoanCalc({ currency }) {
  const [loanAmt, setLoanAmt] = useState(500000);
  const [rate, setRate] = useState(4.5);
  const [tenure, setTenure] = useState(30);
  const [loanType, setLoanType] = useState("reducing");
  const [extra, setExtra] = useState(0);

  const result = useMemo(() => {
    const P = num(loanAmt), r = num(rate)/100/12, n = num(tenure)*12;
    let monthly, totalPaid, totalInterest;
    if (loanType==="flat") {
      totalInterest = P*(num(rate)/100)*num(tenure);
      totalPaid = P + totalInterest;
      monthly = totalPaid / n;
    } else {
      monthly = r>0 ? P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1) : P/n;
      totalPaid = monthly * n;
      totalInterest = totalPaid - P;
    }
    let earlyMonths = n, earlyInterest = totalInterest;
    if (num(extra) > 0) {
      let bal=P, months=0, intPaid=0;
      while (bal>0 && months<n) {
        const intM = bal*r; intPaid+=intM;
        bal -= (monthly+num(extra)-intM); months++;
      }
      earlyMonths=months; earlyInterest=intPaid;
    }
    const schedule = [];
    let bal = P;
    for (let i=0;i<Math.min(12,n);i++) {
      const intPmt=bal*r, prinPmt=monthly-intPmt;
      bal-=prinPmt;
      schedule.push({ month:i+1, interest:intPmt, principal:prinPmt, balance:Math.max(0,bal) });
    }
    return { monthly, totalPaid, totalInterest, interestRatio:totalInterest/totalPaid,
      yearsSaved:(n-earlyMonths)/12, interestSaved:totalInterest-earlyInterest, schedule };
  }, [loanAmt, rate, tenure, loanType, extra]);

  return (
    <div style={S.sec}>
      <Section title="🏠 LOAN DETAILS" color={C.accent}>
        <Field label={`LOAN AMOUNT (${currency})`} value={loanAmt} onChange={setLoanAmt} />
        <div style={S.row}>
          <div style={{flex:1}}><Field label="ANNUAL RATE %" value={rate} onChange={setRate} step={0.1} /></div>
          <div style={{flex:1}}><Field label="TENURE (YEARS)" value={tenure} onChange={setTenure} /></div>
        </div>
        <div style={{ marginBottom:10 }}>
          <span style={S.label}>LOAN TYPE</span>
          <div style={{ display:"flex", gap:8 }}>
            {[["reducing","Reducing Balance"],["flat","Flat Rate"]].map(([v,l])=>(
              <button key={v} onClick={()=>setLoanType(v)} style={{
                flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer",
                fontWeight:700, fontSize:11, background:loanType===v?C.accent:C.muted, color:loanType===v?"#070c0f":C.sub,
              }}>{l}</button>
            ))}
          </div>
        </div>
        <Field label={`EXTRA MONTHLY PAYMENT (${currency})`} value={extra} onChange={setExtra} />
      </Section>

      <div style={{ ...S.rCard(C.accent), textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>MONTHLY PAYMENT</div>
        <div style={{ fontSize:32, fontWeight:900, color:C.accent }}>{fmtFull(result.monthly, currency)}</div>
      </div>

      <div style={S.statGrid}>
        <Stat label="TOTAL PAID" value={fmt(result.totalPaid,currency)} color={C.gold} />
        <Stat label="TOTAL INTEREST" value={fmt(result.totalInterest,currency)} color={C.red} />
        <Stat label="INTEREST RATIO" value={pct(result.interestRatio)} color={C.red} />
        <Stat label="PRINCIPAL" value={fmt(num(loanAmt),currency)} color={C.green} />
      </div>

      {num(extra) > 0 && (
        <div style={S.rCard(C.accent)}>
          <div style={{ color:C.accent, fontSize:11, fontWeight:800, marginBottom:8 }}>⚡ WITH EXTRA PAYMENTS</div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
            <span style={{ color:C.sub }}>Years saved</span>
            <span style={{ color:C.accent, fontWeight:700 }}>{result.yearsSaved.toFixed(1)} years</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:C.sub }}>Interest saved</span>
            <span style={{ color:C.accent, fontWeight:700 }}>{fmt(result.interestSaved,currency)}</span>
          </div>
        </div>
      )}

      <Section title="📊 FIRST 12 MONTHS BREAKDOWN" color={C.accent} collapsible>
        <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr 1fr", gap:4, fontSize:10 }}>
          {["Mo","Interest","Principal","Balance"].map(h=>(
            <div key={h} style={{ color:C.muted, fontWeight:700, paddingBottom:4 }}>{h}</div>
          ))}
          {result.schedule.map(row=>[
            <div key={`m${row.month}`} style={{ color:C.sub }}>{row.month}</div>,
            <div key={`i${row.month}`} style={{ color:C.red }}>{fmt(row.interest,currency)}</div>,
            <div key={`p${row.month}`} style={{ color:C.green }}>{fmt(row.principal,currency)}</div>,
            <div key={`b${row.month}`} style={{ color:C.text }}>{fmt(row.balance,currency)}</div>,
          ])}
        </div>
      </Section>
    </div>
  );
}

// ============================================================
// NET WORTH TRACKER
// ============================================================
function NetWorthCalc({ currency }) {
  const [assets, setAssets] = useState([
    { id:1, label:"Cash & Savings", value:50000 },
    { id:2, label:"EPF / Retirement", value:80000 },
    { id:3, label:"Property Value", value:400000 },
    { id:4, label:"Investments", value:30000 },
    { id:5, label:"Vehicle", value:40000 },
  ]);
  const [liabilities, setLiabilities] = useState([
    { id:1, label:"Home Loan", value:350000 },
    { id:2, label:"Car Loan", value:20000 },
    { id:3, label:"Credit Card", value:5000 },
  ]);

  const totalA = assets.reduce((s,a)=>s+num(a.value),0);
  const totalL = liabilities.reduce((s,l)=>s+num(l.value),0);
  const nw = totalA - totalL;
  const dr = totalA > 0 ? totalL/totalA : 0;

  const update = (list, setList, id, field, val) => setList(list.map(i=>i.id===id?{...i,[field]:val}:i));
  const add = (list, setList) => setList([...list,{id:Date.now(),label:"New item",value:0}]);
  const remove = (list, setList, id) => setList(list.filter(i=>i.id!==id));

  const Row = ({ item, list, setList }) => (
    <div style={{ display:"flex", gap:6, marginBottom:8 }}>
      <input value={item.label} onChange={e=>update(list,setList,item.id,"label",e.target.value)}
        style={{ ...S.input, flex:2, fontSize:12 }} />
      <input type="number" value={item.value} onChange={e=>update(list,setList,item.id,"value",e.target.value)}
        style={{ ...S.input, flex:1, fontSize:12 }} />
      <button onClick={()=>remove(list,setList,item.id)}
        style={{ background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer" }}>×</button>
    </div>
  );

  return (
    <div style={S.sec}>
      <div style={{ ...S.rCard(nw>=0?C.green:C.red), textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>NET WORTH</div>
        <div style={{ fontSize:34, fontWeight:900, color:nw>=0?C.green:C.red }}>{fmtFull(nw,currency)}</div>
        <div style={{ fontSize:10, color:C.sub, marginTop:6 }}>
          Debt ratio: {pct(dr)} · {dr<0.3?"✅ Healthy":dr<0.6?"⚠️ Moderate":"🚨 High debt"}
        </div>
      </div>

      <div style={S.statGrid}>
        <Stat label="TOTAL ASSETS" value={fmtFull(totalA,currency)} color={C.green} />
        <Stat label="TOTAL LIABILITIES" value={fmtFull(totalL,currency)} color={C.red} />
      </div>

      <Section title="📈 ASSETS" color={C.green} collapsible>
        {assets.map(a=>(
          <div key={a.id} style={{ marginBottom:4 }}>
            <Row item={a} list={assets} setList={setAssets} />
            <Bar value={num(a.value)} max={totalA} color={C.green} />
          </div>
        ))}
        <button onClick={()=>add(assets,setAssets)} style={S.btn("#0a2a15")}>+ Add Asset</button>
      </Section>

      <Section title="📉 LIABILITIES" color={C.red} collapsible>
        {liabilities.map(l=><Row key={l.id} item={l} list={liabilities} setList={setLiabilities} />)}
        <button onClick={()=>add(liabilities,setLiabilities)} style={S.btn("#2a0808")}>+ Add Liability</button>
      </Section>
    </div>
  );
}

// ============================================================
// FIRE CALCULATOR
// ============================================================
function FireCalc({ currency }) {
  const [age, setAge] = useState(30);
  const [nw, setNw] = useState(200000);
  const [annualSpend, setAnnualSpend] = useState(60000);
  const [annualSavings, setAnnualSavings] = useState(36000);
  const [annualFixed, setAnnualFixed] = useState(12000);
  const [retRate, setRetRate] = useState(7);
  const [withdrawRate, setWithdrawRate] = useState(4);
  const [fireType, setFireType] = useState("regular");

  const result = useMemo(() => {
    const spendMult = fireType==="lean"?0.75:fireType==="fat"?1.5:1;
    const totalSpend = (num(annualSpend) + num(annualFixed)) * spendMult;
    const fireNumber = totalSpend / (num(withdrawRate)/100);
    const r = num(retRate)/100;
    const s = num(annualSavings);
    let years=0, bal=num(nw);
    while (bal<fireNumber && years<100) { bal=bal*(1+r)+s; years++; }
    const fireAge = num(age) + years;
    const savingsRate = s / (s + totalSpend);
    const progress = Math.min(100, (num(nw)/fireNumber)*100);
    const monthlyPassive = fireNumber*(num(withdrawRate)/100)/12;
    return { fireNumber, years, fireAge, savingsRate, progress, monthlyPassive, totalSpend, gap:Math.max(0,fireNumber-num(nw)) };
  }, [age, nw, annualSpend, annualSavings, annualFixed, retRate, withdrawRate, fireType]);

  return (
    <div style={S.sec}>
      <Section title="🔥 FIRE TYPE" color={C.gold}>
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[["lean","🌱 Lean","75% spend"],["regular","⚡ Regular","100% spend"],["fat","🍔 Fat","150% spend"]].map(([v,l,s])=>(
            <button key={v} onClick={()=>setFireType(v)} style={{
              flex:1, padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer",
              background:fireType===v?C.gold:C.muted, color:fireType===v?"#070c0f":C.sub,
            }}>
              <div style={{ fontWeight:800, fontSize:11 }}>{l}</div>
              <div style={{ fontSize:9, opacity:0.8 }}>{s}</div>
            </button>
          ))}
        </div>
        <div style={S.row}>
          <div style={{flex:1}}><Field label="CURRENT AGE" value={age} onChange={setAge} min={18} /></div>
          <div style={{flex:1}}><Field label={`NET WORTH (${currency})`} value={nw} onChange={setNw} /></div>
        </div>
        <div style={S.row}>
          <div style={{flex:1}}><Field label="ANNUAL LIFESTYLE SPEND" value={annualSpend} onChange={setAnnualSpend} /></div>
          <div style={{flex:1}}><Field label="ANNUAL FIXED COMMITMENTS" value={annualFixed} onChange={setAnnualFixed} /></div>
        </div>
        <Field label="ANNUAL SAVINGS" value={annualSavings} onChange={setAnnualSavings} />
        <div style={S.row}>
          <div style={{flex:1}}><Field label="RETURN RATE %" value={retRate} onChange={setRetRate} step={0.5} /></div>
          <div style={{flex:1}}><Field label="WITHDRAW RATE %" value={withdrawRate} onChange={setWithdrawRate} step={0.5} /></div>
        </div>
      </Section>

      <div style={{ ...S.rCard(C.gold), textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>🔥 YOUR FIRE NUMBER</div>
        <div style={{ fontSize:32, fontWeight:900, color:C.gold }}>{fmtFull(result.fireNumber,currency)}</div>
        <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>
          = {fmtFull(result.monthlyPassive,currency)}/mo passive income
        </div>
        <Bar value={result.progress} max={100} color={C.gold} />
        <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>{result.progress.toFixed(0)}% there</div>
      </div>

      <div style={S.statGrid}>
        <Stat label="FIRE AGE" value={`Age ${result.fireAge}`} color={result.fireAge<50?C.green:result.fireAge<60?C.gold:C.red} sub={`${result.years}y away`} />
        <Stat label="SAVINGS RATE" value={pct(result.savingsRate)} color={result.savingsRate>0.5?C.green:result.savingsRate>0.3?C.gold:C.red} />
        <Stat label="ANNUAL SPEND" value={fmtFull(result.totalSpend,currency)} color={C.accent} sub={`${fireType} FIRE`} />
        <Stat label="STILL NEEDED" value={fmt(result.gap,currency)} color={result.gap===0?C.green:C.red} />
      </div>

      <Section title="💡 INSIGHTS" color={C.purple} collapsible>
        {[
          result.savingsRate < 0.3 && { text:"Boost savings rate above 50% — each 10% increase cuts ~3 years off FIRE timeline", color:C.gold },
          result.fireAge > 55 && { text:"Consider income side hustles or investment property to accelerate", color:C.accent },
          result.fireAge <= 45 && { text:"You're on track for early FIRE! Stay consistent and avoid lifestyle inflation", color:C.green },
          num(withdrawRate) > 4 && { text:`${withdrawRate}% withdrawal is aggressive — 4% is the historically safe rate (Trinity Study)`, color:C.red },
          num(annualFixed) > num(annualSpend)*0.5 && { text:"Fixed commitments are high relative to lifestyle spend — reducing debt speeds up FIRE", color:C.orange },
        ].filter(Boolean).map((ins,i)=>(
          <div key={i} style={{ fontSize:12, color:ins.color, marginBottom:8, paddingLeft:8, borderLeft:`2px solid ${ins.color}`, lineHeight:1.5 }}>
            {ins.text}
          </div>
        ))}
      </Section>
    </div>
  );
}

// ============================================================
// BOOKKEEPING — Personal Income & Expense Tracker
// ============================================================
const CATEGORIES = {
  income: ["Salary","Freelance","Bonus","Investment","Rental","Gift","Other Income"],
  expense: ["Food & Drinks","Transport","Shopping","Entertainment","Health","Education","Utilities","Rent","Insurance","Family","Travel","Subscriptions","Personal Care","Other"],
};

const CAT_COLORS = {
  "Salary": "#2dd87a", "Freelance": "#2dd87a", "Bonus": "#2dd87a",
  "Investment": "#00c2ff", "Rental": "#00c2ff", "Gift": "#a78bfa",
  "Other Income": "#5f8fa8",
  "Food & Drinks": "#fb923c", "Transport": "#f5c842", "Shopping": "#f04f4f",
  "Entertainment": "#a78bfa", "Health": "#00c2ff", "Education": "#2dd87a",
  "Utilities": "#5f8fa8", "Rent": "#f04f4f", "Insurance": "#a78bfa",
  "Family": "#f5c842", "Travel": "#fb923c", "Subscriptions": "#5f8fa8",
  "Personal Care": "#a78bfa", "Other": "#3d5445",
};

function BookkeepingView({ currency }) {
  const JBIN = "https://api.jsonbin.io/v3";
  const JKEY = "$2a$10$CXn8Xo3IaeZZLs4s3OOUGOCjLOChP5sH5IETANfEDXiRVsCycGAMG";
  const jH = { "Content-Type":"application/json", "X-Master-Key":JKEY, "X-Access-Key":JKEY };
  const genCode = () => "MM-"+Math.random().toString(36).substring(2,8).toUpperCase();
  const hashPin = (pin,code) => btoa(`${code}:${pin}`).slice(0,16);

  const [vaultCode,setVaultCode] = useState(()=>localStorage.getItem("mm_vault")||"");
  const [binId,setBinId] = useState(()=>localStorage.getItem("mm_bin")||"");
  const [screen,setScreen] = useState(()=>localStorage.getItem("mm_vault")?"loading":"home");
  const [pinInput,setPinInput] = useState("");
  const [newPin,setNewPin] = useState("");
  const [codeInput,setCodeInput] = useState("");
  const [vaultError,setVaultError] = useState("");
  const [syncing,setSyncing] = useState(false);
  const [lastSync,setLastSync] = useState(null);
  const [txns,setTxns] = useState([]);
  const [view,setView] = useState("log");
  const [showAdd,setShowAdd] = useState(false);
  const [filterMonth,setFilterMonth] = useState(()=>new Date().toISOString().slice(0,7));
  const [filterType,setFilterType] = useState("all");
  const [form,setForm] = useState({ date:new Date().toISOString().slice(0,10), type:"expense", category:"Food & Drinks", amount:"", note:"" });

  useEffect(()=>{
    if(screen==="loading"&&binId){ loadVault(binId); }
    else if(screen==="loading"){ setScreen("home"); }
  },[]);

  const createVault = async()=>{
    if(newPin.length!==4||isNaN(newPin)){setVaultError("PIN must be 4 digits");return;}
    setSyncing(true);setVaultError("");
    try{
      const code=genCode();
      const data={code,pinHash:hashPin(newPin,code),txns:[],createdAt:new Date().toISOString()};
      const resp=await fetch(`${JBIN}/b`,{method:"POST",headers:{...jH,"X-Bin-Name":`moneymap-${code}`,"X-Bin-Private":"false"},body:JSON.stringify(data)});
      if(!resp.ok)throw new Error("Failed to create vault");
      const r=await resp.json();
      setBinId(r.metadata.id);setVaultCode(code);setTxns([]);
      localStorage.setItem("mm_vault",code);localStorage.setItem("mm_bin",r.metadata.id);
      setLastSync(new Date());setScreen("vault");
    }catch(e){setVaultError(e.message);}
    setSyncing(false);
  };

  const joinVault = async()=>{
    if(!codeInput.trim()){setVaultError("Enter vault code");return;}
    if(pinInput.length!==4){setVaultError("PIN must be 4 digits");return;}
    setSyncing(true);setVaultError("");
    try{
      const code=codeInput.trim().toUpperCase();
      const sResp=await fetch(`${JBIN}/b?name=moneymap-${code}`,{headers:jH});
      if(!sResp.ok)throw new Error("Vault not found");
      const sData=await sResp.json();
      if(!sData.length)throw new Error("Vault not found. Check your code.");
      const fBinId=sData[0].id;
      const lResp=await fetch(`${JBIN}/b/${fBinId}/latest`,{headers:jH});
      const vData=(await lResp.json()).record;
      if(vData.pinHash!==hashPin(pinInput,code))throw new Error("Wrong PIN. Try again.");
      setBinId(fBinId);setVaultCode(code);setTxns(vData.txns||[]);
      localStorage.setItem("mm_vault",code);localStorage.setItem("mm_bin",fBinId);
      setLastSync(new Date());setScreen("vault");
    }catch(e){setVaultError(e.message);}
    setSyncing(false);
  };

  const loadVault = async(bid)=>{
    setSyncing(true);
    try{
      const resp=await fetch(`${JBIN}/b/${bid}/latest`,{headers:jH});
      const data=(await resp.json()).record;
      setTxns(data.txns||[]);setLastSync(new Date());setScreen("vault");
    }catch(e){setScreen("home");}
    setSyncing(false);
  };

  const syncCloud = async(newTxns)=>{
    if(!binId)return;
    try{
      const lResp=await fetch(`${JBIN}/b/${binId}/latest`,{headers:jH});
      const existing=(await lResp.json()).record;
      await fetch(`${JBIN}/b/${binId}`,{method:"PUT",headers:jH,body:JSON.stringify({...existing,txns:newTxns})});
      setLastSync(new Date());
    }catch(e){}
  };

  const save=(newTxns)=>{ setTxns(newTxns); syncCloud(newTxns); };
  const addTxn=()=>{
    if(!form.amount||isNaN(form.amount))return;
    const newTxns=[{...form,id:Date.now(),amount:Number(form.amount)},...txns];
    save(newTxns);
    setForm({date:new Date().toISOString().slice(0,10),type:form.type,category:form.category,amount:"",note:""});
    setShowAdd(false);
  };
  const deleteTxn=(id)=>save(txns.filter(t=>t.id!==id));
  const logout=()=>{
    localStorage.removeItem("mm_vault");localStorage.removeItem("mm_bin");
    setVaultCode("");setBinId("");setTxns([]);setPinInput("");setNewPin("");setCodeInput("");setScreen("home");
  };

  const filtered=txns.filter(t=>t.date.slice(0,7)===filterMonth&&(filterType==="all"||t.type===filterType));
  const totalIncome=filtered.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const net=totalIncome-totalExpense;
  const savingsRate=totalIncome>0?net/totalIncome:0;
  const byCat=filtered.reduce((acc,t)=>{
    if(!acc[t.category])acc[t.category]={total:0,count:0,type:t.type};
    acc[t.category].total+=t.amount;acc[t.category].count++;return acc;
  },{});
  const catList=Object.entries(byCat).sort((a,b)=>b[1].total-a[1].total);
  const monthHistory=useMemo(()=>{
    const months=[];
    for(let i=5;i>=0;i--){
      const d=new Date();d.setMonth(d.getMonth()-i);
      const m=d.toISOString().slice(0,7);
      const label=d.toLocaleString("en-MY",{month:"short",year:"2-digit"});
      const inc=txns.filter(t=>t.date.slice(0,7)===m&&t.type==="income").reduce((s,t)=>s+t.amount,0);
      const exp=txns.filter(t=>t.date.slice(0,7)===m&&t.type==="expense").reduce((s,t)=>s+t.amount,0);
      months.push({m,label,income:inc,expense:exp,net:inc-exp});
    }
    return months;
  },[txns]);
  const maxBar=Math.max(...monthHistory.map(m=>Math.max(m.income,m.expense)),1);
  const fmtDate=(d)=>new Date(d+"T00:00:00").toLocaleDateString("en-MY",{day:"numeric",month:"short"});
  const availableMonths=useMemo(()=>{
    const months=[...new Set(txns.map(t=>t.date.slice(0,7)))].sort().reverse();
    if(!months.includes(new Date().toISOString().slice(0,7)))months.unshift(new Date().toISOString().slice(0,7));
    return months;
  },[txns]);

  if(screen==="loading")return(<div style={{padding:24,textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⏳</div><div style={{color:C.sub,fontSize:13}}>Loading your vault...</div></div>);

  if(screen==="home")return(
    <div style={{padding:16}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:40,marginBottom:8}}>🔐</div>
        <div style={{fontSize:18,fontWeight:900,color:C.text}}>Your Money Vault</div>
        <div style={{color:C.sub,fontSize:12,marginTop:4,lineHeight:1.6}}>Cross-device sync with vault code + PIN</div>
      </div>
      <div style={S.card}>
        <div style={{color:C.accent,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:10}}>✨ CREATE NEW VAULT</div>
        <span style={S.label}>SET A 4-DIGIT PIN</span>
        <input type="number" value={newPin} onChange={e=>setNewPin(e.target.value.slice(0,4))} placeholder="e.g. 1234"
          style={{...S.input,textAlign:"center",fontSize:24,fontWeight:900,letterSpacing:8,marginBottom:10}} />
        <button onClick={createVault} disabled={syncing||newPin.length!==4}
          style={{...S.btn(),opacity:newPin.length!==4?0.5:1,marginTop:0}}>
          {syncing?"Creating...":"🔐 Create My Vault"}
        </button>
      </div>
      <div style={{textAlign:"center",color:C.muted,fontSize:12,margin:"4px 0"}}>— or —</div>
      <div style={S.card}>
        <div style={{color:C.gold,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:10}}>🚪 ACCESS EXISTING VAULT</div>
        <span style={S.label}>VAULT CODE</span>
        <input value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase())} placeholder="MM-XXXXXX"
          style={{...S.input,textAlign:"center",fontSize:16,fontWeight:800,letterSpacing:3,marginBottom:10}} />
        <span style={S.label}>YOUR PIN</span>
        <input type="number" value={pinInput} onChange={e=>setPinInput(e.target.value.slice(0,4))} placeholder="4-digit PIN"
          style={{...S.input,textAlign:"center",fontSize:20,fontWeight:900,letterSpacing:6,marginBottom:10}} />
        <button onClick={joinVault} disabled={syncing||!codeInput||pinInput.length!==4}
          style={{...S.btn("#1a1200"),color:C.gold,opacity:(!codeInput||pinInput.length!==4)?0.5:1,marginTop:0}}>
          {syncing?"Connecting...":"🚪 Access Vault"}
        </button>
      </div>
      {vaultError&&<div style={{color:C.red,fontSize:12,textAlign:"center",marginTop:8}}>{vaultError}</div>}
      <div style={{...S.card,background:"#070c0f",marginTop:8}}>
        <div style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:6}}>HOW IT WORKS</div>
        {[["🔐","Create a vault","Get a unique code like MM-ABC123"],["📌","Set a 4-digit PIN","Protects your vault"],["📱","Open on any device","Enter code + PIN to sync"],["☁️","Auto-syncs","Every transaction saves to cloud"]].map(([icon,title,sub])=>(
          <div key={title} style={{display:"flex",gap:10,marginBottom:8}}>
            <span style={{fontSize:16}}>{icon}</span>
            <div><div style={{fontSize:12,fontWeight:700,color:C.text}}>{title}</div><div style={{fontSize:11,color:C.sub}}>{sub}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return(
    <div style={S.sec}>
      <div style={{...S.card,background:"linear-gradient(135deg,#0a1825,#070c0f)",borderColor:C.accent+"40",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:C.sub,marginBottom:2}}>YOUR VAULT</div>
            <div style={{fontSize:18,fontWeight:900,color:C.accent,letterSpacing:2}}>{vaultCode}</div>
            {lastSync&&<div style={{fontSize:9,color:C.muted,marginTop:2}}>Synced {lastSync.toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"})}</div>}
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>loadVault(binId)} disabled={syncing} style={{background:C.muted,border:"none",borderRadius:8,padding:"6px 10px",color:C.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{syncing?"⏳":"🔄"}</button>
            <button onClick={logout} style={{background:"#1a0808",border:"none",borderRadius:8,padding:"6px 10px",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer"}}>Exit</button>
          </div>
        </div>
      </div>

      <div style={S.rCard(net>=0?C.green:C.red)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:C.sub,marginBottom:2}}>{new Date(filterMonth+"-01").toLocaleString("en-MY",{month:"long",year:"numeric"})}</div>
            <div style={{fontSize:11,fontWeight:800,color:net>=0?C.green:C.red}}>{net>=0?"✅ Surplus":"🚨 Deficit"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:26,fontWeight:900,color:net>=0?C.green:C.red}}>{fmtFull(Math.abs(net),currency)}</div>
            <div style={{fontSize:10,color:C.sub}}>Savings rate: {pct(savingsRate)}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:16}}>
          <div><div style={{fontSize:9,color:C.sub,marginBottom:2}}>INCOME</div><div style={{fontSize:14,fontWeight:800,color:C.green}}>{fmtFull(totalIncome,currency)}</div></div>
          <div><div style={{fontSize:9,color:C.sub,marginBottom:2}}>EXPENSES</div><div style={{fontSize:14,fontWeight:800,color:C.red}}>{fmtFull(totalExpense,currency)}</div></div>
          <div><div style={{fontSize:9,color:C.sub,marginBottom:2}}>TRANSACTIONS</div><div style={{fontSize:14,fontWeight:800,color:C.accent}}>{filtered.length}</div></div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{...S.input,flex:1,fontSize:12}}>
          {availableMonths.map(m=>(<option key={m} value={m}>{new Date(m+"-01").toLocaleString("en-MY",{month:"long",year:"numeric"})}</option>))}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{...S.input,flex:1,fontSize:12}}>
          <option value="all">All</option><option value="income">Income</option><option value="expense">Expense</option>
        </select>
      </div>

      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {[["log","📋 Log"],["category","🏷 Category"],["charts","📊 Charts"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:view===v?C.accent:C.muted,color:view===v?"#070c0f":C.sub}}>{l}</button>
        ))}
      </div>

      <button onClick={()=>setShowAdd(true)} style={{...S.btn(),marginBottom:12,marginTop:0}}>+ Add Transaction</button>

      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowAdd(false)}>
          <div style={{background:C.card,borderRadius:"16px 16px 0 0",padding:20,width:"100%",paddingBottom:32}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:14}}>New Transaction</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {["expense","income"].map(t=>(
                <button key={t} onClick={()=>setForm(f=>({...f,type:t,category:t==="income"?"Salary":"Food & Drinks"}))} style={{flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontWeight:800,fontSize:13,background:form.type===t?(t==="income"?C.green:C.red):C.muted,color:form.type===t?"#070c0f":C.sub}}>{t==="income"?"💚 Income":"🔴 Expense"}</button>
              ))}
            </div>
            <span style={S.label}>AMOUNT ({currency})</span>
            <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={{...S.input,fontSize:22,fontWeight:900,textAlign:"center",marginBottom:10}} autoFocus />
            <span style={S.label}>CATEGORY</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
              {CATEGORIES[form.type].map(cat=>(
                <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))} style={{padding:"5px 10px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:form.category===cat?CAT_COLORS[cat]||C.accent:C.muted,color:form.category===cat?"#070c0f":C.sub}}>{cat}</button>
              ))}
            </div>
            <span style={S.label}>DATE</span>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...S.input,marginBottom:10}} />
            <span style={S.label}>NOTE (optional)</span>
            <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="e.g. Lunch at Bangsar" style={{...S.input,marginBottom:14}} />
            <button onClick={addTxn} disabled={!form.amount} style={{...S.btn(form.type==="income"?C.green:C.red),opacity:!form.amount?0.5:1,marginTop:0}}>Add {form.type==="income"?"Income":"Expense"}</button>
          </div>
        </div>
      )}

      {view==="log"&&(filtered.length===0?<div style={{...S.card,textAlign:"center",color:C.sub,padding:24}}>No transactions this month.<br/><span style={{fontSize:11}}>Tap "+ Add Transaction" to start.</span></div>:filtered.map(t=>(
        <div key={t.id} style={{...S.card,display:"flex",alignItems:"center",gap:10,padding:"12px 14px"}}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:`${CAT_COLORS[t.category]||C.accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{t.type==="income"?"💚":"🔴"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text}}>{t.category}</div>
            <div style={{fontSize:10,color:C.sub,marginTop:1}}>{fmtDate(t.date)}{t.note?` · ${t.note}`:""}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:15,fontWeight:800,color:t.type==="income"?C.green:C.red}}>{t.type==="income"?"+":"-"}{fmtFull(t.amount,currency)}</div>
            <button onClick={()=>deleteTxn(t.id)} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer"}}>delete</button>
          </div>
        </div>
      )))}

      {view==="category"&&(catList.length===0?<div style={{...S.card,textAlign:"center",color:C.sub}}>No data this month.</div>:<>
        {catList.filter(([,v])=>v.type==="expense").length>0&&(<div style={S.card}><div style={{color:C.red,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:10}}>🔴 EXPENSES</div>{catList.filter(([,v])=>v.type==="expense").map(([cat,data])=>(<div key={cat} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:C.text,fontWeight:600}}>{cat}</span><span style={{color:CAT_COLORS[cat]||C.accent,fontWeight:700}}>{fmtFull(data.total,currency)}</span></div><div style={{height:5,borderRadius:3,background:C.border}}><div style={{height:"100%",width:`${(data.total/totalExpense)*100}%`,background:CAT_COLORS[cat]||C.accent,borderRadius:3}}/></div></div>))}</div>)}
        {catList.filter(([,v])=>v.type==="income").length>0&&(<div style={S.card}><div style={{color:C.green,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:10}}>💚 INCOME</div>{catList.filter(([,v])=>v.type==="income").map(([cat,data])=>(<div key={cat} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:C.text,fontWeight:600}}>{cat}</span><span style={{color:C.green,fontWeight:700}}>{fmtFull(data.total,currency)}</span></div><div style={{height:5,borderRadius:3,background:C.border}}><div style={{height:"100%",width:`${(data.total/totalIncome)*100}%`,background:C.green,borderRadius:3}}/></div></div>))}</div>)}
      </>)}

      {view==="charts"&&(<>
        <div style={S.card}>
          <div style={{color:C.accent,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:12}}>📊 6-MONTH OVERVIEW</div>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:120}}>
            {monthHistory.map(m=>(<div key={m.m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:90}}>
                <div style={{flex:1,background:C.green,borderRadius:"3px 3px 0 0",opacity:0.85,height:`${(m.income/maxBar)*100}%`,minHeight:m.income>0?4:0}}/>
                <div style={{flex:1,background:C.red,borderRadius:"3px 3px 0 0",opacity:0.85,height:`${(m.expense/maxBar)*100}%`,minHeight:m.expense>0?4:0}}/>
              </div>
              <div style={{fontSize:8,color:C.sub,textAlign:"center"}}>{m.label}</div>
              <div style={{fontSize:8,color:m.net>=0?C.green:C.red,fontWeight:700}}>{m.net>=0?"+":""}{fmt(m.net)}</div>
            </div>))}
          </div>
          <div style={{display:"flex",gap:16,marginTop:8,justifyContent:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.sub}}><div style={{width:10,height:10,background:C.green,borderRadius:2}}/> Income</div>
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.sub}}><div style={{width:10,height:10,background:C.red,borderRadius:2}}/> Expense</div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{color:C.accent,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:10}}>📅 MONTHLY SUMMARY</div>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:6,fontSize:11}}>
            {["Month","Income","Expense","Net"].map(h=>(<div key={h} style={{color:C.muted,fontWeight:700,fontSize:9,paddingBottom:4}}>{h}</div>))}
            {monthHistory.map(m=>[
              <div key={`l${m.m}`} style={{color:C.sub}}>{m.label}</div>,
              <div key={`i${m.m}`} style={{color:C.green}}>{fmt(m.income,currency)}</div>,
              <div key={`e${m.m}`} style={{color:C.red}}>{fmt(m.expense,currency)}</div>,
              <div key={`n${m.m}`} style={{color:m.net>=0?C.green:C.red,fontWeight:700}}>{fmt(m.net,currency)}</div>,
            ])}
          </div>
        </div>
        {catList.filter(([,v])=>v.type==="expense").length>0&&(<div style={S.card}>
          <div style={{color:C.red,fontSize:11,fontWeight:800,letterSpacing:1,marginBottom:10}}>🏆 TOP SPENDING</div>
          {catList.filter(([,v])=>v.type==="expense").slice(0,5).map(([cat,data],i)=>(<div key={cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{fontSize:16,width:24,textAlign:"center",color:C.sub}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:C.text}}>{cat}</div><div style={{height:4,borderRadius:2,background:C.border,marginTop:3}}><div style={{height:"100%",width:`${(data.total/catList.filter(([,v])=>v.type==="expense")[0][1].total)*100}%`,background:CAT_COLORS[cat]||C.accent,borderRadius:2}}/></div></div>
            <div style={{fontSize:13,fontWeight:800,color:CAT_COLORS[cat]||C.accent}}>{fmtFull(data.total,currency)}</div>
          </div>))}
        </div>)}
      </>)}
    </div>
  );
}
// ============================================================
// MAIN APP — MoneyMap
// ============================================================
// ============================================================
// INVEST TAB — Malaysian Investment Platform
// ============================================================

// ---- STATIC MARKET DATA (Updated Jun 2026) ----
const MARKET_DATA = {
  klseIndex: { value: 1612.45, change: +0.34, updated: "Jun 2026" },
  products: [
    // Blue Chips
    { id:"maybank", name:"Maybank (MAY)", cat:"bluechip", ticker:"1155", sector:"Banking", divYield:6.2, peRatio:12.1, risk:"low", minInvest:100, returnPA:7.5, desc:"Malaysia's largest bank. Consistent dividend payer. Defensive stock.", link:"bursamarketplace.com" },
    { id:"pbbank", name:"Public Bank (PBK)", cat:"bluechip", ticker:"1295", sector:"Banking", divYield:4.8, peRatio:13.5, risk:"low", minInvest:100, returnPA:6.8, desc:"One of Asia's best-run banks. Low NPL, steady growth.", link:"" },
    { id:"tenaga", name:"Tenaga Nasional (TNB)", cat:"bluechip", ticker:"5347", sector:"Utilities", divYield:4.1, peRatio:14.2, risk:"low", minInvest:100, returnPA:5.5, desc:"Malaysia's national electricity utility. Regulated returns.", link:"" },
    { id:"celcomdigi", name:"CelcomDigi (CDB)", cat:"bluechip", ticker:"6947", sector:"Telco", divYield:5.9, peRatio:28.3, risk:"low", minInvest:50, returnPA:6.2, desc:"Malaysia's largest telco by subscribers post-merger.", link:"" },
    { id:"ioicorp", name:"IOI Corp (1961)", cat:"bluechip", ticker:"1961", sector:"Plantation", divYield:3.2, peRatio:18.7, risk:"medium", minInvest:100, returnPA:7.0, desc:"Leading integrated palm oil player. CPO price sensitive.", link:"" },
    // Penny Stocks
    { id:"dsonic", name:"Dagang Nexchange (DNEX)", cat:"penny", ticker:"4456", sector:"Tech/Oil", divYield:0, peRatio:22.1, risk:"high", minInvest:50, returnPA:15.0, desc:"Digital services + oil concession. High volatility.", link:"" },
    { id:"ucrest", name:"UCrest (0005)", cat:"penny", ticker:"0005", sector:"HealthTech", divYield:0, peRatio:null, risk:"high", minInvest:20, returnPA:20.0, desc:"Healthcare IoT play. Speculative, loss-making.", link:"" },
    // Bonds
    { id:"mgs10", name:"MGS 10-Year", cat:"bond", ticker:null, sector:"Gov Bond", divYield:3.95, peRatio:null, risk:"low", minInvest:1000, returnPA:3.95, desc:"Malaysian Government Securities. Risk-free benchmark.", link:"" },
    { id:"kwsp", name:"EPF Dividend", cat:"bond", ticker:null, sector:"Retirement", divYield:5.5, peRatio:null, risk:"low", minInvest:1, returnPA:5.5, desc:"EPF conventional account. Historically 5-6% p.a. Guaranteed by govt.", link:"" },
    // Unit Trusts
    { id:"prs", name:"PRS (Private Retirement)", cat:"unittrust", ticker:null, sector:"Retirement", divYield:null, peRatio:null, risk:"medium", minInvest:100, returnPA:7.0, desc:"Tax relief up to RM3,000/yr. Various risk profiles.", link:"ppa.my" },
    { id:"asb", name:"Amanah Saham Bumiputera", cat:"unittrust", ticker:null, sector:"Gov Linked", divYield:5.0, peRatio:null, risk:"low", minInvest:1, returnPA:5.0, desc:"Gov-linked unit trust. Bumiputera only. Capital guaranteed.", link:"asnb.com.my" },
    { id:"asnb", name:"Amanah Saham Nasional (ASN)", cat:"unittrust", ticker:null, sector:"Gov Linked", divYield:4.5, peRatio:null, risk:"low", minInvest:10, returnPA:4.5, desc:"Open to all Malaysians. Stable returns. Low volatility.", link:"asnb.com.my" },
    // P2P
    { id:"fundaztic", name:"Fundaztic", cat:"p2p", ticker:null, sector:"SME Lending", divYield:null, peRatio:null, risk:"high", minInvest:50, returnPA:12.0, desc:"SC-licensed P2P. SME financing. Default risk applies.", link:"fundaztic.com" },
    { id:"quickash", name:"QuicKash", cat:"p2p", ticker:null, sector:"SME Lending", divYield:null, peRatio:null, risk:"high", minInvest:100, returnPA:11.0, desc:"SC-licensed. Higher returns, higher default risk.", link:"quickash.com.my" },
    { id:"capbay", name:"CapBay", cat:"p2p", ticker:null, sector:"Supply Chain Finance", divYield:null, peRatio:null, risk:"medium", minInvest:100, returnPA:8.5, desc:"Supply chain financing. Invoice-backed. Lower risk than typical P2P.", link:"capbay.com" },
    // Digital Platforms
    { id:"versa", name:"Versa Cash", cat:"digital", ticker:null, sector:"Money Market", divYield:null, peRatio:null, risk:"low", minInvest:1, returnPA:3.8, desc:"Kenanga Money Market Fund via app. Liquid, better than savings account.", link:"versa-app.com" },
    { id:"stashaway", name:"StashAway", cat:"digital", ticker:null, sector:"Robo-Advisor", divYield:null, peRatio:null, risk:"medium", minInvest:1, returnPA:8.0, desc:"ETFS-based robo-advisor. Global diversification. SC-licensed.", link:"stashaway.my" },
    { id:"wahed", name:"Wahed Invest", cat:"digital", ticker:null, sector:"Shariah Robo", divYield:null, peRatio:null, risk:"medium", minInvest:50, returnPA:7.5, desc:"Shariah-compliant robo-advisor. Sukuk + Islamic equity.", link:"wahed.com" },
    { id:"merchantrade", name:"Merchantrade Money", cat:"digital", ticker:null, sector:"E-Wallet/Savings", divYield:null, peRatio:null, risk:"low", minInvest:1, returnPA:3.0, desc:"E-wallet with savings feature. PIDM protected.", link:"" },
    // FD / Digibanks
    { id:"maybank_fd", name:"Maybank FD (12m)", cat:"fd", ticker:null, sector:"Fixed Deposit", divYield:null, peRatio:null, risk:"low", minInvest:1000, returnPA:2.85, desc:"12-month FD. PIDM insured up to RM250k.", link:"maybank2u.com" },
    { id:"gxbank", name:"GXBank Savings", cat:"digibank", ticker:null, sector:"Digibank", divYield:null, peRatio:null, risk:"low", minInvest:1, returnPA:3.0, desc:"GX Bank (Grab-backed). Up to 3% p.a. savings. PIDM insured.", link:"gxbank.com.my" },
    { id:"boost", name:"Boost Bank", cat:"digibank", ticker:null, sector:"Digibank", divYield:null, peRatio:null, risk:"low", minInvest:1, returnPA:2.7, desc:"Boost Bank digital savings. PIDM insured.", link:"boostbank.my" },
    { id:"aeon", name:"AEON Bank", cat:"digibank", ticker:null, sector:"Digibank", divYield:null, peRatio:null, risk:"low", minInvest:1, returnPA:2.5, desc:"AEON Bank (Islamic). Shariah-compliant. PIDM insured.", link:"" },
  ],
};

// Risk allocation templates
const RISK_PROFILES = {
  conservative: {
    label: "🛡️ Conservative",
    color: "#2dd87a",
    desc: "Capital preservation. Stable returns. Minimal volatility.",
    alloc: { fd: 30, bond: 20, unittrust: 25, digital: 15, bluechip: 10, p2p: 0, penny: 0, digibank: 0 },
    expectedReturn: 4.5,
    maxDrawdown: 5,
    horizon: "1-3 years",
  },
  moderate: {
    label: "⚖️ Moderate",
    color: "#f5c842",
    desc: "Balanced growth and stability. Some market exposure.",
    alloc: { fd: 10, bond: 15, unittrust: 25, digital: 15, bluechip: 25, p2p: 10, penny: 0, digibank: 5 },
    expectedReturn: 7.5,
    maxDrawdown: 15,
    horizon: "3-7 years",
  },
  aggressive: {
    label: "🚀 Aggressive",
    color: "#f04f4f",
    desc: "Maximum growth. High volatility. Long-term horizon required.",
    alloc: { fd: 0, bond: 5, unittrust: 15, digital: 10, bluechip: 35, p2p: 20, penny: 15, digibank: 0 },
    expectedReturn: 12.0,
    maxDrawdown: 35,
    horizon: "7+ years",
  },
};

const CAT_LABELS = {
  bluechip: "Blue Chip Stocks", penny: "Penny Stocks",
  bond: "Bonds / EPF", unittrust: "Unit Trusts",
  p2p: "P2P Lending", digital: "Digital Platforms",
  fd: "Fixed Deposits", digibank: "Digital Banks",
};
const CAT_COLORS = {
  bluechip: "#00c2ff", penny: "#f04f4f", bond: "#2dd87a",
  unittrust: "#a78bfa", p2p: "#fb923c", digital: "#f5c842",
  fd: "#5f8fa8", digibank: "#2dd87a",
};
const RISK_COLORS = { low:"#2dd87a", medium:"#f5c842", high:"#f04f4f" };

function InvestView({ currency }) {
  const [mode, setMode] = useState("beginner"); // beginner | intermediate
  const [investTab, setInvestTab] = useState("explore"); // explore | allocate | calculator | goals | watchlist
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [investAmount, setInvestAmount] = useState(5000);
  const [showDetail, setShowDetail] = useState(null);
  const [expertMode, setExpertMode] = useState(false);

  // Watchlist stored in localStorage
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mm_watchlist") || "[]"); } catch { return []; }
  });
  const [holdings, setHoldings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mm_holdings") || "[]"); } catch { return []; }
  });
  const [addingHolding, setAddingHolding] = useState(null);
  const [holdingUnits, setHoldingUnits] = useState("");
  const [holdingPrice, setHoldingPrice] = useState("");

  const saveWatchlist = (w) => { setWatchlist(w); localStorage.setItem("mm_watchlist", JSON.stringify(w)); };
  const saveHoldings = (h) => { setHoldings(h); localStorage.setItem("mm_holdings", JSON.stringify(h)); };

  const toggleWatch = (id) => {
    const w = watchlist.includes(id) ? watchlist.filter(x => x !== id) : [...watchlist, id];
    saveWatchlist(w);
  };

  const addHolding = (product) => {
    const units = parseFloat(holdingUnits) || 0;
    const price = parseFloat(holdingPrice) || 0;
    const existing = holdings.findIndex(h => h.id === product.id);
    const entry = { id: product.id, name: product.name, cat: product.cat, units, avgPrice: price, value: units * price };
    const newH = existing >= 0
      ? holdings.map((h, i) => i === existing ? entry : h)
      : [...holdings, entry];
    saveHoldings(newH);
    setAddingHolding(null); setHoldingUnits(""); setHoldingPrice("");
  };

  // Calculator state
  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcRate, setCalcRate] = useState(7);
  const [calcYears, setCalcYears] = useState(10);
  const [calcMonthly, setCalcMonthly] = useState(500);
  const [calcRisk, setCalcRisk] = useState("medium"); // low/medium/high

  // Goal state
  const [goalName, setGoalName] = useState("Retirement");
  const [goalTarget, setGoalTarget] = useState(1000000);
  const [goalCurrent, setGoalCurrent] = useState(50000);
  const [goalMonthly, setGoalMonthly] = useState(2000);
  const [goalReturn, setGoalReturn] = useState(7);

  // Filtered products
  const filtered = MARKET_DATA.products.filter(p => {
    const catMatch = selectedCat === "all" || p.cat === selectedCat;
    const riskMatch = selectedRisk === "all" || p.risk === selectedRisk;
    return catMatch && riskMatch;
  });

  // Allocation
  const profile = RISK_PROFILES[riskProfile];
  const allocation = Object.entries(profile.alloc)
    .filter(([,pct]) => pct > 0)
    .map(([cat, pct]) => ({
      cat, pct,
      amount: (investAmount * pct) / 100,
      color: CAT_COLORS[cat],
      label: CAT_LABELS[cat],
      products: MARKET_DATA.products.filter(p => p.cat === cat).slice(0, 2),
    }));

  // Calculator
  const r = calcRate / 100 / 12;
  const n = calcYears * 12;
  const fvLump = calcAmount * Math.pow(1 + calcRate / 100, calcYears);
  const fvMonthly = calcMonthly * ((Math.pow(1 + r, n) - 1) / r);
  const totalFV = fvLump + fvMonthly;
  const totalIn = calcAmount + calcMonthly * n;
  const totalReturn = totalFV - totalIn;
  const riskAdjusted = { low: 0.7, medium: 1.0, high: 1.3 }[calcRisk];
  const worstCase = totalFV * 0.65;
  const bestCase = totalFV * riskAdjusted * 1.2;

  // Goal projection
  const gr = goalReturn / 100 / 12;
  const gn = 12;
  let goalYears = 0, goalBal = goalCurrent;
  while (goalBal < goalTarget && goalYears < 100) {
    goalBal = goalBal * (1 + goalReturn / 100) + goalMonthly * 12;
    goalYears++;
  }
  const goalProgress = Math.min(100, (goalCurrent / goalTarget) * 100);

  // Watchlist total
  const totalWatchlistValue = holdings.reduce((s, h) => s + (h.value || 0), 0);
  const totalHoldingReturn = holdings.reduce((s, h) => {
    const prod = MARKET_DATA.products.find(p => p.id === h.id);
    return s + (prod ? (h.value * prod.returnPA / 100) : 0);
  }, 0);

  const fmtM = (n) => n >= 1000000 ? `${(n/1000000).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : n?.toFixed(0) || "0";

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ padding:"12px 12px 0", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.sub }}>
          🇲🇾 KLSE: <span style={{ color:C.green, fontWeight:700 }}>{MARKET_DATA.klseIndex.value}</span>
          <span style={{ color:C.green, fontSize:10 }}> ▲{MARKET_DATA.klseIndex.change}%</span>
          <span style={{ color:C.muted, fontSize:9 }}> · {MARKET_DATA.klseIndex.updated}</span>
        </div>
        <button onClick={() => setMode(mode === "beginner" ? "intermediate" : "beginner")} style={{
          background: C.muted, border:"none", borderRadius:20, padding:"4px 10px",
          color:C.sub, fontSize:10, fontWeight:700, cursor:"pointer"
        }}>{mode === "beginner" ? "📚 Beginner" : "📊 Intermediate"}</button>
      </div>

      {/* Sub tabs */}
      <div style={{ display:"flex", gap:4, padding:"0 12px", overflowX:"auto", marginBottom:12 }}>
        {[["explore","🔍 Explore"],["allocate","🎯 Allocate"],["calculator","🧮 Calculator"],["goals","🏁 Goals"],["watchlist","👁 Watchlist"]].map(([v,l]) => (
          <button key={v} onClick={() => setInvestTab(v)} style={{
            padding:"6px 10px", borderRadius:8, border:"none", cursor:"pointer",
            fontWeight:700, fontSize:11, whiteSpace:"nowrap",
            background: investTab===v ? C.accent : C.muted,
            color: investTab===v ? "#070c0f" : C.sub,
          }}>{l}</button>
        ))}
      </div>

      {/* ---- EXPLORE ---- */}
      {investTab === "explore" && (
        <div style={{ padding:"0 12px" }}>
          {/* Category filter */}
          <div style={{ display:"flex", gap:5, overflowX:"auto", marginBottom:8 }}>
            {[["all","All"],...Object.entries(CAT_LABELS)].map(([v,l]) => (
              <button key={v} onClick={() => setSelectedCat(v)} style={{
                padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer",
                fontSize:10, fontWeight:700, whiteSpace:"nowrap",
                background: selectedCat===v ? C.accent : C.muted,
                color: selectedCat===v ? "#070c0f" : C.sub,
              }}>{l}</button>
            ))}
          </div>
          {/* Risk filter */}
          <div style={{ display:"flex", gap:5, marginBottom:12 }}>
            {["all","low","medium","high"].map(r => (
              <button key={r} onClick={() => setSelectedRisk(r)} style={{
                flex:1, padding:"5px 0", borderRadius:8, border:"none", cursor:"pointer",
                fontSize:10, fontWeight:700, textTransform:"capitalize",
                background: selectedRisk===r ? (r==="all"?C.accent:RISK_COLORS[r]||C.accent) : C.muted,
                color: selectedRisk===r ? "#070c0f" : C.sub,
              }}>{r === "all" ? "All Risk" : r}</button>
            ))}
          </div>

          {filtered.map(p => (
            <div key={p.id} style={{ background:C.card, border:`1px solid ${showDetail===p.id?CAT_COLORS[p.cat]:C.border}`, borderRadius:12, padding:12, marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}
                onClick={() => setShowDetail(showDetail===p.id?null:p.id)}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:3 }}>
                    <span style={{ fontSize:9, fontWeight:800, color: CAT_COLORS[p.cat], background:`${CAT_COLORS[p.cat]}20`, borderRadius:4, padding:"2px 6px" }}>
                      {CAT_LABELS[p.cat]}
                    </span>
                    <span style={{ fontSize:9, fontWeight:700, color: RISK_COLORS[p.risk] }}>
                      {p.risk.toUpperCase()} RISK
                    </span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{p.name}</div>
                  {mode === "beginner" && <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{p.desc}</div>}
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:C.green }}>{p.returnPA}%</div>
                  <div style={{ fontSize:9, color:C.muted }}>est. p.a.</div>
                </div>
              </div>

              {showDetail === p.id && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
                    {[
                      ["Min. Invest", `${currency} ${p.minInvest}`],
                      ["Est. Return", `${p.returnPA}% p.a.`],
                      p.divYield && ["Div Yield", `${p.divYield}%`],
                      p.peRatio && ["P/E Ratio", p.peRatio],
                      ["Risk Level", p.risk.charAt(0).toUpperCase()+p.risk.slice(1)],
                      ["Category", CAT_LABELS[p.cat]],
                    ].filter(Boolean).map(([label, val]) => (
                      <div key={label} style={{ background:"#070c0f", borderRadius:8, padding:"8px 10px" }}>
                        <div style={{ fontSize:9, color:C.muted, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {mode === "beginner" && (
                    <div style={{ background:"#070c0f", borderRadius:8, padding:10, marginBottom:8 }}>
                      <div style={{ fontSize:10, color:C.accent, fontWeight:700, marginBottom:4 }}>📚 What is this?</div>
                      <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>{p.desc}</div>
                    </div>
                  )}

                  {/* Risk/Reward visual */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>RISK / REWARD</div>
                    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                      <span style={{ fontSize:10, color:C.green }}>Safe</span>
                      <div style={{ flex:1, height:6, background:C.border, borderRadius:3, position:"relative" }}>
                        <div style={{
                          position:"absolute", top:-2, width:10, height:10, borderRadius:"50%",
                          background: RISK_COLORS[p.risk], border:"2px solid #070c0f",
                          left: p.risk==="low"?"10%" : p.risk==="medium"?"48%":"80%",
                        }} />
                      </div>
                      <span style={{ fontSize:10, color:C.red }}>Risky</span>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => toggleWatch(p.id)} style={{
                      flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer",
                      fontWeight:700, fontSize:11,
                      background: watchlist.includes(p.id) ? C.gold+"30" : C.muted,
                      color: watchlist.includes(p.id) ? C.gold : C.sub,
                    }}>{watchlist.includes(p.id) ? "★ Watching" : "☆ Watch"}</button>
                    <button onClick={() => { setAddingHolding(p); setHoldingPrice(p.minInvest); }} style={{
                      flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer",
                      fontWeight:700, fontSize:11, background:C.accentDim, color:C.accent,
                    }}>+ Add Holding</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---- ALLOCATE ---- */}
      {investTab === "allocate" && (
        <div style={{ padding:"0 12px" }}>
          {/* Risk profile selector */}
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {Object.entries(RISK_PROFILES).map(([key, prof]) => (
              <button key={key} onClick={() => setRiskProfile(key)} style={{
                flex:1, padding:"10px 4px", borderRadius:10, border:"none", cursor:"pointer",
                background: riskProfile===key ? prof.color+"30" : C.muted,
                borderWidth:1, borderStyle:"solid", borderColor: riskProfile===key ? prof.color : "transparent",
              }}>
                <div style={{ fontSize:11, fontWeight:800, color: riskProfile===key ? prof.color : C.sub }}>{prof.label}</div>
                <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{prof.expectedReturn}% est.</div>
              </button>
            ))}
          </div>

          <div style={{ background:C.card, border:`1px solid ${profile.color}40`, borderRadius:12, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:12, color:profile.color, fontWeight:800, marginBottom:4 }}>{profile.label}</div>
            <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>{profile.desc}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              <div style={{ background:"#070c0f", borderRadius:8, padding:"8px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:C.muted }}>EXPECTED RETURN</div>
                <div style={{ fontSize:16, fontWeight:900, color:profile.color }}>{profile.expectedReturn}%</div>
              </div>
              <div style={{ background:"#070c0f", borderRadius:8, padding:"8px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:C.muted }}>MAX DRAWDOWN</div>
                <div style={{ fontSize:16, fontWeight:900, color:C.red }}>{profile.maxDrawdown}%</div>
              </div>
              <div style={{ background:"#070c0f", borderRadius:8, padding:"8px", textAlign:"center" }}>
                <div style={{ fontSize:9, color:C.muted }}>HORIZON</div>
                <div style={{ fontSize:12, fontWeight:800, color:C.text }}>{profile.horizon}</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <span style={S.label}>AMOUNT TO INVEST ({currency})</span>
            <input type="number" value={investAmount} onChange={e=>setInvestAmount(Number(e.target.value))}
              style={S.input} />
          </div>

          {/* Allocation breakdown */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:10 }}>📊 ALLOCATION BREAKDOWN</div>
            {allocation.map(a => (
              <div key={a.cat} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{a.label}</div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:12, fontWeight:800, color:a.color }}>{a.pct}%</span>
                    <span style={{ fontSize:11, color:C.sub }}> · {currency} {fmtM(a.amount)}</span>
                  </div>
                </div>
                <div style={{ height:6, borderRadius:3, background:C.border }}>
                  <div style={{ height:"100%", width:`${a.pct}%`, background:a.color, borderRadius:3 }} />
                </div>
                {mode === "beginner" && a.products.length > 0 && (
                  <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>
                    e.g. {a.products.map(p => p.name.split("(")[0].trim()).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {mode === "beginner" && (
            <div style={{ background:"#070c0f", border:`1px solid ${C.border}`, borderRadius:10, padding:12 }}>
              <div style={{ fontSize:10, color:C.accent, fontWeight:800, marginBottom:6 }}>💡 WHY THIS ALLOCATION?</div>
              {riskProfile === "conservative" && <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>You prioritise not losing money. Most funds go into guaranteed or near-guaranteed products (FD, bonds, ASB). Returns are lower but sleep is better.</div>}
              {riskProfile === "moderate" && <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>Balanced approach. Mix of stable (FD, bonds) and growth (blue chips, unit trusts). Suitable for most Malaysians building wealth over 5+ years.</div>}
              {riskProfile === "aggressive" && <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>Maximum growth focus. Heavy in stocks and P2P which can drop 30-40% in bad years. Only suitable if you won't need this money for 7+ years.</div>}
            </div>
          )}
        </div>
      )}

      {/* ---- CALCULATOR ---- */}
      {investTab === "calculator" && (
        <div style={{ padding:"0 12px" }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:12 }}>🧮 RISK-REWARD CALCULATOR</div>
            <div style={{ marginBottom:10 }}>
              <span style={S.label}>LUMP SUM ({currency})</span>
              <input type="number" value={calcAmount} onChange={e=>setCalcAmount(Number(e.target.value))} style={S.input} />
            </div>
            <div style={{ marginBottom:10 }}>
              <span style={S.label}>MONTHLY CONTRIBUTION ({currency})</span>
              <input type="number" value={calcMonthly} onChange={e=>setCalcMonthly(Number(e.target.value))} style={S.input} />
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <span style={S.label}>ANNUAL RETURN %</span>
                <input type="number" value={calcRate} onChange={e=>setCalcRate(Number(e.target.value))} step={0.5} style={S.input} />
              </div>
              <div style={{ flex:1 }}>
                <span style={S.label}>YEARS</span>
                <input type="number" value={calcYears} onChange={e=>setCalcYears(Number(e.target.value))} style={S.input} />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <span style={S.label}>RISK SCENARIO</span>
              <div style={{ display:"flex", gap:6 }}>
                {["low","medium","high"].map(r => (
                  <button key={r} onClick={() => setCalcRisk(r)} style={{
                    flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer",
                    fontWeight:700, fontSize:11, textTransform:"capitalize",
                    background: calcRisk===r ? RISK_COLORS[r] : C.muted,
                    color: calcRisk===r ? "#070c0f" : C.sub,
                  }}>{r}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:12, padding:14, marginBottom:8, textAlign:"center" }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4 }}>PROJECTED VALUE ({calcYears} YEARS)</div>
            <div style={{ fontSize:32, fontWeight:900, color:C.green }}>{currency} {fmtM(totalFV)}</div>
            <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>
              Total invested: {currency} {fmtM(totalIn)} · Gain: {currency} {fmtM(totalReturn)} ({((totalReturn/totalIn)*100).toFixed(0)}%)
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div style={{ background:"#1a0808", border:`1px solid ${C.red}40`, borderRadius:10, padding:12, textAlign:"center" }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>😰 WORST CASE</div>
              <div style={{ fontSize:18, fontWeight:900, color:C.red }}>{currency} {fmtM(worstCase)}</div>
              <div style={{ fontSize:9, color:C.muted }}>-35% scenario</div>
            </div>
            <div style={{ background:"#001a0d", border:`1px solid ${C.green}40`, borderRadius:10, padding:12, textAlign:"center" }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>🚀 BEST CASE</div>
              <div style={{ fontSize:18, fontWeight:900, color:C.green }}>{currency} {fmtM(bestCase)}</div>
              <div style={{ fontSize:9, color:C.muted }}>+20% scenario</div>
            </div>
          </div>

          {/* Compound breakdown */}
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:10 }}>📈 YEAR BY YEAR</div>
            {[1,3,5,10,15,20].filter(y => y <= calcYears || y === calcYears).map(y => {
              const ry = calcRate / 100;
              const ry12 = calcRate / 100 / 12;
              const ny = y * 12;
              const fvL = calcAmount * Math.pow(1 + ry, y);
              const fvM = calcMonthly * ((Math.pow(1 + ry12, ny) - 1) / ry12);
              const tot = fvL + fvM;
              return (
                <div key={y} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:11, color:C.sub }}>Year {y}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{currency} {fmtM(tot)}</span>
                </div>
              );
            })}
          </div>

          {mode === "beginner" && (
            <div style={{ background:"#070c0f", border:`1px solid ${C.border}`, borderRadius:10, padding:12 }}>
              <div style={{ fontSize:10, color:C.gold, fontWeight:800, marginBottom:4 }}>💡 WHAT THIS MEANS</div>
              <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>
                Investing {currency} {fmtM(calcAmount)} today + {currency} {fmtM(calcMonthly)}/month at {calcRate}% annually = {currency} {fmtM(totalFV)} in {calcYears} years.
                The power of compounding means your money makes money. Start early — waiting 5 years can cost you {currency} {fmtM(totalFV * 0.35)} in lost growth.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- GOALS ---- */}
      {investTab === "goals" && (
        <div style={{ padding:"0 12px" }}>
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:12 }}>🏁 INVESTMENT GOAL PLANNER</div>
            <div style={{ marginBottom:10 }}>
              <span style={S.label}>GOAL NAME</span>
              <input value={goalName} onChange={e=>setGoalName(e.target.value)} style={S.input} placeholder="e.g. Retirement, House, Education" />
            </div>
            <div style={{ marginBottom:10 }}>
              <span style={S.label}>TARGET AMOUNT ({currency})</span>
              <input type="number" value={goalTarget} onChange={e=>setGoalTarget(Number(e.target.value))} style={S.input} />
            </div>
            <div style={{ marginBottom:10 }}>
              <span style={S.label}>CURRENT SAVINGS ({currency})</span>
              <input type="number" value={goalCurrent} onChange={e=>setGoalCurrent(Number(e.target.value))} style={S.input} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}>
                <span style={S.label}>MONTHLY ADD ({currency})</span>
                <input type="number" value={goalMonthly} onChange={e=>setGoalMonthly(Number(e.target.value))} style={S.input} />
              </div>
              <div style={{ flex:1 }}>
                <span style={S.label}>RETURN RATE %</span>
                <input type="number" value={goalReturn} onChange={e=>setGoalReturn(Number(e.target.value))} step={0.5} style={S.input} />
              </div>
            </div>
          </div>

          {/* Goal result */}
          <div style={{ background:`${C.accent}12`, border:`1px solid ${C.accent}40`, borderRadius:12, padding:14, marginBottom:10 }}>
            <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>{goalName || "Your Goal"}</div>
            <div style={{ fontSize:28, fontWeight:900, color:C.accent }}>{goalYears >= 100 ? "100+" : goalYears} years</div>
            <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>to reach {currency} {fmtM(goalTarget)}</div>
            <div style={{ height:6, borderRadius:3, background:C.border, marginTop:10 }}>
              <div style={{ height:"100%", width:`${goalProgress}%`, background:C.accent, borderRadius:3 }} />
            </div>
            <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>{goalProgress.toFixed(0)}% funded · {currency} {fmtM(goalTarget - goalCurrent)} remaining</div>
          </div>

          {/* What if scenarios */}
          <div style={S.card}>
            <div style={{ fontSize:11, fontWeight:800, color:C.gold, marginBottom:10 }}>🎯 WHAT IF SCENARIOS</div>
            {[
              { label:"Double monthly savings", monthly: goalMonthly * 2, rate: goalReturn },
              { label:"Aggressive investing (12%)", monthly: goalMonthly, rate: 12 },
              { label:`${goalName} in ${Math.max(5,goalYears-5)} years`, monthly: null, rate: goalReturn },
            ].map((scenario, i) => {
              let sYears = 0, sBal = goalCurrent;
              const sMonthly = scenario.monthly || goalMonthly;
              const sRate = scenario.rate;
              while (sBal < goalTarget && sYears < 100) {
                sBal = sBal * (1 + sRate / 100) + sMonthly * 12;
                sYears++;
              }
              const monthlyNeeded = i === 2 ? (() => {
                const targetYrs = Math.max(5, goalYears - 5);
                const fvNeeded = goalTarget - goalCurrent * Math.pow(1 + goalReturn/100, targetYrs);
                const r12 = goalReturn/100/12;
                return fvNeeded / ((Math.pow(1+r12, targetYrs*12)-1)/r12);
              })() : null;
              return (
                <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, color:C.text, fontWeight:600 }}>{scenario.label}</div>
                  <div style={{ fontSize:11, color:C.gold, marginTop:2 }}>
                    {monthlyNeeded
                      ? `Need ${currency} ${fmtM(monthlyNeeded)}/mo`
                      : `${sYears >= 100 ? "100+" : sYears} years`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- WATCHLIST ---- */}
      {investTab === "watchlist" && (
        <div style={{ padding:"0 12px" }}>
          {/* Portfolio summary */}
          {holdings.length > 0 && (
            <div style={{ background:`${C.accent}12`, border:`1px solid ${C.accent}40`, borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:10, color:C.sub, marginBottom:4 }}>TOTAL PORTFOLIO VALUE</div>
              <div style={{ fontSize:28, fontWeight:900, color:C.accent }}>{currency} {fmtM(totalWatchlistValue)}</div>
              <div style={{ fontSize:11, color:C.green, marginTop:2 }}>Est. annual return: {currency} {fmtM(totalHoldingReturn)}</div>
            </div>
          )}

          {/* Holdings */}
          {holdings.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize:11, fontWeight:800, color:C.accent, marginBottom:10 }}>💼 MY HOLDINGS</div>
              {holdings.map(h => {
                const prod = MARKET_DATA.products.find(p => p.id === h.id);
                return (
                  <div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{h.name?.split("(")[0]?.trim()}</div>
                      <div style={{ fontSize:10, color:C.sub }}>{h.units} units @ {currency} {h.avgPrice}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:C.accent }}>{currency} {fmtM(h.value)}</div>
                      {prod && <div style={{ fontSize:9, color:C.green }}>+{currency} {fmtM(h.value * prod.returnPA / 100)}/yr</div>}
                      <button onClick={() => saveHoldings(holdings.filter(x => x.id !== h.id))}
                        style={{ background:"none", border:"none", color:C.muted, fontSize:10, cursor:"pointer" }}>remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Watchlist */}
          <div style={{ fontSize:11, fontWeight:800, color:C.gold, marginBottom:8 }}>⭐ WATCHING ({watchlist.length})</div>
          {watchlist.length === 0 ? (
            <div style={{ ...S.card, textAlign:"center", color:C.sub, padding:24 }}>
              No watchlist items yet.<br/>
              <span style={{ fontSize:11 }}>Explore products and tap ☆ Watch to add.</span>
            </div>
          ) : (
            watchlist.map(id => {
              const p = MARKET_DATA.products.find(x => x.id === id);
              if (!p) return null;
              return (
                <div key={id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:12, marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{p.name}</div>
                      <div style={{ fontSize:10, color:C.sub }}>{CAT_LABELS[p.cat]} · {p.risk} risk</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:18, fontWeight:900, color:C.green }}>{p.returnPA}%</div>
                      <div style={{ fontSize:9, color:C.muted }}>est. p.a.</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:8 }}>
                    <button onClick={() => { setAddingHolding(p); setInvestTab("watchlist"); }} style={{
                      flex:1, padding:"6px 0", borderRadius:8, border:"none", cursor:"pointer",
                      fontWeight:700, fontSize:11, background:C.accentDim, color:C.accent,
                    }}>+ Add Holding</button>
                    <button onClick={() => toggleWatch(id)} style={{
                      padding:"6px 10px", borderRadius:8, border:"none", cursor:"pointer",
                      fontWeight:700, fontSize:11, background:"#1a0808", color:C.red,
                    }}>✕ Remove</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Holding Modal */}
      {addingHolding && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:999, display:"flex", alignItems:"flex-end" }}
          onClick={() => setAddingHolding(null)}>
          <div style={{ background:C.card, borderRadius:"16px 16px 0 0", padding:20, width:"100%", paddingBottom:32 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:4 }}>Add Holding</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:14 }}>{addingHolding.name}</div>
            <span style={S.label}>UNITS / AMOUNT</span>
            <input type="number" value={holdingUnits} onChange={e=>setHoldingUnits(e.target.value)}
              placeholder="e.g. 1000 units or 5000 (amount)" style={{ ...S.input, marginBottom:10 }} autoFocus />
            <span style={S.label}>PRICE / UNIT ({currency})</span>
            <input type="number" value={holdingPrice} onChange={e=>setHoldingPrice(e.target.value)}
              placeholder="e.g. 9.50" style={{ ...S.input, marginBottom:14 }} />
            {holdingUnits && holdingPrice && (
              <div style={{ fontSize:12, color:C.accent, marginBottom:10, textAlign:"center" }}>
                Total value: {currency} {fmtM(parseFloat(holdingUnits) * parseFloat(holdingPrice))}
              </div>
            )}
            <button onClick={() => addHolding(addingHolding)}
              style={S.btn()}>✅ Save Holding</button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const [tab, setTab] = useState("budget");
  const [currency, setCurrency] = useState("MYR");

  const tabs = [
    { id:"budget",      label:"💳 Budget" },
    { id:"retirement",  label:"🏦 Retire" },
    { id:"emergency",   label:"🆘 Emergency" },
    { id:"loan",        label:"🏠 Loan" },
    { id:"networth",    label:"📊 Net Worth" },
    { id:"fire",        label:"🔥 FIRE" },
    { id:"invest",      label:"📈 Invest" },
    { id:"bookkeeping", label:"📒 Books" },
  ];

  return (
    <div style={S.page}>
      <Analytics />
      <div style={S.header}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:900, color:C.accent, letterSpacing:"-1px", margin:0 }}>
              Money<span style={{ color:C.text }}>Map</span>
            </h1>
            <div style={{ fontSize:11, color:C.sub, marginTop:3 }}>
              Personal Financial Planning · Free · Private
            </div>
          </div>
          <div>
            <span style={{ ...S.label, marginBottom:3 }}>CURRENCY</span>
            <input value={currency} onChange={e=>setCurrency(e.target.value.toUpperCase())}
              style={{ ...S.input, width:70, textAlign:"center", fontWeight:800, fontSize:13, padding:"6px 8px" }}
              maxLength={5} />
          </div>
        </div>
      </div>

      <div style={S.nav}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={S.navBtn(tab===t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ paddingTop:14 }}>
        {tab==="budget"      && <BudgetView currency={currency} />}
        {tab==="retirement"  && <RetirementCalc currency={currency} />}
        {tab==="emergency"   && <EmergencyCalc currency={currency} />}
        {tab==="loan"        && <LoanCalc currency={currency} />}
        {tab==="networth"    && <NetWorthCalc currency={currency} />}
        {tab==="fire"        && <FireCalc currency={currency} />}
        {tab==="invest"      && <InvestView currency={currency} />}
        {tab==="bookkeeping" && <BookkeepingView currency={currency} />}
      </div>
    </div>
  );
}
