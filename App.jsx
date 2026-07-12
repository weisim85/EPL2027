import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const BUILD_VERSION = "epl2027-v2.3";

const C = {
  bg:"#070e1a", card:"#0c1826", sky:"#6cabdd", gold:"#f59e0b",
  green:"#10b981", red:"#ef4444", muted:"#64748b", border:"#1a2d42",
  text:"#f0f8ff", sub:"#93c5fd", accent:"#38bdf8",
};

const ST = {
  container:{ background:C.bg, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", color:C.text, paddingTop:"env(safe-area-inset-top)" },
  topbar:{ position:"sticky", top:"env(safe-area-inset-top)", zIndex:50, display:"flex", alignItems:"center", gap:12, height:52, padding:"0 14px", background:"#050c16", borderBottom:`1px solid ${C.border}` },
  burger:{ background:"#0f1e30", color:C.sky, border:`1px solid ${C.border}`, borderRadius:8, width:38, height:38, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  topbarTitle:{ fontSize:15, fontWeight:800, color:C.text, display:"flex", alignItems:"baseline", gap:6, minWidth:0 },
  topbarSub:{ color:C.sub, fontWeight:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  shell:{ display:"flex", alignItems:"flex-start", minHeight:"calc(100dvh - 52px)" },
  overlay:{ position:"fixed", inset:"0", background:"rgba(0,0,0,0.6)", zIndex:44 },
  sidebar:(open,mobile)=>{
    const base={ width:232, flexShrink:0, background:"#0a1520", borderRight:`1px solid ${C.border}`, overflowY:"auto", flexDirection:"column", padding:"14px 0", boxSizing:"border-box" };
    if(mobile) return{ ...base, position:"fixed", top:0, left:0, height:"100dvh", paddingTop:"calc(env(safe-area-inset-top) + 14px)", display:"flex", transform:open?"translateX(0)":"translateX(-100%)", transition:"transform 0.22s ease", zIndex:45 };
    return{ ...base, position:"sticky", top:"calc(52px + env(safe-area-inset-top))", alignSelf:"flex-start", height:"calc(100dvh - 52px)", display:open?"flex":"none" };
  },
  sideBrand:{ padding:"2px 18px 14px", borderBottom:`1px solid ${C.border}`, marginBottom:8 },
  sideTitle:{ fontSize:18, fontWeight:900, background:`linear-gradient(90deg,${C.sky},#ffffff,${C.sky})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-0.5px", lineHeight:1.2 },
  sideSub:{ color:C.muted, fontSize:10, marginTop:3 },
  sideNav:{ flex:1, display:"flex", flexDirection:"column", gap:2 },
  sideBtn:(a)=>({ display:"flex", alignItems:"center", gap:12, width:"calc(100% - 16px)", margin:"1px 8px", padding:"11px 12px", borderRadius:9, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, textAlign:"left", background:a?C.sky:"transparent", color:a?"#06121f":C.sub, transition:"all 0.15s" }),
  sideIcon:{ fontSize:16, width:22, textAlign:"center", flexShrink:0 },
  sideFooter:{ padding:"14px 18px 2px", fontSize:10, color:C.muted, borderTop:`1px solid ${C.border}`, lineHeight:1.8 },
  content:{ flex:1, minWidth:0, paddingBottom:"env(safe-area-inset-bottom)" },
  card:{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:14, marginBottom:10 },
  input:{ background:"#070e1a", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"9px 12px", fontSize:13, width:"100%", outline:"none", boxSizing:"border-box", appearance:"none" },
  btn:{ background:C.sky, color:"#070e1a", border:"none", borderRadius:8, padding:"10px 18px", fontWeight:800, cursor:"pointer", fontSize:13, width:"100%", marginTop:8 },
  lbl:{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:5 },
  th:{ color:C.muted, textAlign:"left", padding:"4px 6px", fontWeight:600, fontSize:11 },
  td:{ padding:"7px 6px", borderTop:`1px solid ${C.border}`, fontSize:12 },
};

// ── TEAM DATA ──────────────────────────────────────────────
const BADGE = {
  "Arsenal":"🔴","Aston Villa":"🟣","Bournemouth":"🍒","Brentford":"🐝",
  "Brighton":"🔵","Chelsea":"💙","Coventry City":"🩵","Crystal Palace":"🦅",
  "Everton":"🔵","Fulham":"⬛","Hull City":"🐯","Ipswich Town":"🔵",
  "Leeds United":"⬜","Liverpool":"🔴","Manchester City":"🩵",
  "Manchester United":"👹","Newcastle United":"⚫","Nottingham Forest":"🌲",
  "Sunderland":"🔴","Tottenham Hotspur":"🐓",
};
const STRENGTH = {
  "Arsenal":90,"Manchester City":87,"Manchester United":85,"Aston Villa":83,
  "Liverpool":82,"Bournemouth":77,"Chelsea":74,"Newcastle United":74,
  "Brighton":73,"Tottenham Hotspur":72,"Sunderland":72,"Crystal Palace":70,
  "Brentford":69,"Fulham":68,"Leeds United":66,"Nottingham Forest":64,
  "Everton":63,"Ipswich Town":57,"Coventry City":56,"Hull City":54,
};
const EUROPEAN = {
  "Arsenal":"UCL","Manchester City":"UCL","Manchester United":"UCL",
  "Aston Villa":"UCL","Liverpool":"UCL","Bournemouth":"UEL",
  "Sunderland":"UEL","Crystal Palace":"UEL","Brighton":"UECL",
};
const KEY_PLAYERS = {
  "Arsenal":{"B. Saka":4.0,"M. Odegaard":4.5,"L. Trossard":3.0},
  "Manchester City":{"E. Haaland":5.0,"T. Reijnders":3.5,"P. Foden":3.5},
  "Manchester United":{"B. Sesko":4.0,"B. Fernandes":4.0,"B. Mbeumo":3.5},
  "Aston Villa":{"O. Watkins":4.0,"M. Rogers":3.5,"E. Buendia":3.0},
  "Liverpool":{"F. Wirtz":4.5,"A. Isak":4.5,"V. Munoz":3.0},
  "Bournemouth":{"A. Semenyo":3.5,"Rayan":4.0,"A. Scott":3.5},
  "Chelsea":{"C. Palmer":4.5,"N. Jackson":3.5,"M. Caicedo":3.0},
  "Newcastle United":{"B. Guimaraes":4.0,"J. Pedro":3.5,"K. Trippier":2.5},
  "Tottenham Hotspur":{"H. Son":4.5,"D. Kulusevski":3.5,"J. van Hecke":3.0},
  "Sunderland":{"H. Wright":3.5,"E. Mason-Clark":3.0,"B. Thomas":2.5},
  "Brighton":{"S. Mitoma":3.5,"E. Ferguson":3.5,"J. Enciso":3.0},
  "Crystal Palace":{"E. Eze":4.0,"M. Olise":3.5,"J. Mateta":3.0},
  "Brentford":{"I. Thiago":4.5,"C. Norgaard":3.0,"M. Damsgaard":3.0},
  "Fulham":{"A. Jimenez":3.5,"T. Cairney":3.0,"T. Muniz":3.0},
  "Leeds United":{"W. Gnonto":3.5,"J. Piroe":3.0,"C. Cooper":2.5},
  "Nottingham Forest":{"C. Wood":3.5,"E. Anderson":3.5,"A. Awoniyi":3.0},
  "Everton":{"D. Calvert-Lewin":3.5,"A. Doucoure":3.0,"J. Pickford":2.5},
  "Coventry City":{"M. OHare":3.0,"H. Godden":2.5,"K. Hamer":3.0},
  "Ipswich Town":{"C. Akpom":3.0,"C. Kipre":2.5,"D. OShea":2.5},
  "Hull City":{"J. Gelhardt":3.0,"M. Belloumi":3.0,"M. van Ewijk":2.5},
};
const NEW_TEAMS = new Set(["Coventry City","Ipswich Town","Hull City"]);
const TEAMS = Object.keys(BADGE).sort();
const HOME_BOOST = 3.0;
let STRENGTH_OVERRIDES = {};
let BOOKMAKER_CACHE = {};
function getStr(t){ return STRENGTH_OVERRIDES[t]??STRENGTH[t]??60; }
function adjustedStrength(team,absent=[]){
  const base=STRENGTH[team]||60, keys=KEY_PLAYERS[team]||{};
  let pen=0;
  absent.forEach(n=>{ const k=Object.keys(keys).find(k=>k.toLowerCase().includes(n.toLowerCase())||n.toLowerCase().includes(k.toLowerCase().split(" ").pop())); if(k) pen+=keys[k]; });
  return Math.max(40,base-pen);
}

// ── PREDICTION ENGINE ──────────────────────────────────────
function clamp(n,lo,hi){ return Math.min(hi,Math.max(lo,n)); }
function r1(n){ return Math.round(n*10)/10; }
function r2(n){ return Math.round(n*100)/100; }
function poissonP(lam,k){ let f=1; for(let i=2;i<=k;i++) f*=i; return Math.exp(-lam)*Math.pow(lam,k)/f; }
function buildMatrix(lA,lB){
  const m=[]; let tot=0;
  for(let i=0;i<=8;i++) for(let j=0;j<=8;j++){ const p=poissonP(lA,i)*poissonP(lB,j); m.push({home:i,away:j,probability:p}); tot+=p; }
  return m.map(r=>({...r,probability:r.probability/tot}));
}
function predictMatch(teamA,teamB,isHome=true){
  const sA=getStr(teamA)+(isHome?HOME_BOOST:0);
  const sB=getStr(teamB)+(!isHome?HOME_BOOST:0);
  const diff=(sA-sB)/10;
  let lA=clamp((2.65/2)*Math.exp(diff*0.18),0.25,4.2);
  let lB=clamp((2.65/2)*Math.exp(-diff*0.18),0.25,4.2);
  const bk=BOOKMAKER_CACHE[`${teamA}-${teamB}`];
  let blended=false;
  if(bk?.homeWin&&bk?.draw&&bk?.awayWin){
    const rH=1/bk.homeWin,rD=1/bk.draw,rA=1/bk.awayWin,t=rH+rD+rA;
    const mx0=buildMatrix(lA,lB); let hw=0,dr=0,aw=0;
    mx0.forEach(({home,away,probability})=>{ if(home>away)hw+=probability; else if(home===away)dr+=probability; else aw+=probability; });
    hw=0.4*hw+0.6*(rH/t); dr=0.4*dr+0.6*(rD/t); aw=0.4*aw+0.6*(rA/t);
    const ratio=hw/aw,tot=lA+lB;
    lA=clamp(tot*Math.sqrt(ratio)/(Math.sqrt(ratio)+1),0.25,4.2);
    lB=clamp(tot-lA,0.25,4.2); blended=true;
  }
  const matrix=buildMatrix(lA,lB);
  let homeWin=0,draw=0,awayWin=0,over25=0,bttsY=0;
  matrix.forEach(({home,away,probability})=>{
    if(home>away)homeWin+=probability; else if(home===away)draw+=probability; else awayWin+=probability;
    if(home+away>2.5)over25+=probability;
    if(home>0&&away>0)bttsY+=probability;
  });
  const sorted=[...matrix].sort((a,b)=>b.probability-a.probability);
  const best=sorted[0];
  const topScores=sorted.slice(0,8).map(s=>({score:`${s.home}-${s.away}`,prob:r1(s.probability*100)}));
  const htBest=[...buildMatrix(lA*0.44,lB*0.44)].sort((a,b)=>b.probability-a.probability)[0];
  const topOut=Math.max(homeWin,draw,awayWin);
  const confidence=topOut>=0.55?"High":topOut>=0.44?"Medium":"Low";
  return{
    predictedScore:`${best.home}-${best.away}`,halfTimeScore:`${htBest.home}-${htBest.away}`,
    probabilities:{homeWin:r1(homeWin*100),draw:r1(draw*100),awayWin:r1(awayWin*100),over25:r1(over25*100),under25:r1((1-over25)*100),bttsYes:r1(bttsY*100),bttsNo:r1((1-bttsY)*100)},
    xG:{[teamA]:r2(lA),[teamB]:r2(lB)},topScores,matrix,confidence,blended,
  };
}

// ── SWEEPSTAKE ─────────────────────────────────────────────
const JBASE="https://api.jsonbin.io/v3";
const JKEY="$2a$10$CXn8Xo3IaeZZLs4s3OOUGOCjLOChP5sH5IETANfEDXiRVsCycGAMG";
function genCode(){ return Math.random().toString(36).substring(2,8).toUpperCase(); }
function calcPoints(member,liveResults=[]){
  let pts=0;
  const picks=member.matchPicks||{};
  liveResults.forEach(m=>{
    if(m.status!=="FT"||m.homeScore===null) return;
    const pick=picks[`${m.home}-${m.away}`];
    if(!pick) return;
    const rOut=m.homeScore>m.awayScore?"home":m.awayScore>m.homeScore?"away":"draw";
    const pOut=pick.homeScore>pick.awayScore?"home":pick.awayScore>pick.homeScore?"away":"draw";
    if(pick.homeScore===m.homeScore&&pick.awayScore===m.awayScore) pts+=5;
    else if(rOut===pOut) pts+=2;
  });
  return pts+(member.manualPts||0);
}

function SweepstakeView({ liveResults=[] }){
  const [screen,setScreen]=useState("home");
  const [myName,setMyName]=useState(()=>localStorage.getItem("epl_sw_name")||"");
  const [champPick,setChampPick]=useState("");
  const [joinCode,setJoinCode]=useState("");
  const [roomCode,setRoomCode]=useState("");
  const [binId,setBinId]=useState("");
  const [myId,setMyId]=useState("");
  const [room,setRoom]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [matchPicks,setMatchPicks]=useState({});
  const [pickingMatch,setPickingMatch]=useState(null);
  const [homeIn,setHomeIn]=useState("1");
  const [awayIn,setAwayIn]=useState("0");
  const [myRooms,setMyRooms]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("epl_my_rooms")||"[]"); }catch(e){ return []; } });
  const [copied,setCopied]=useState(false);

  const jH={ "Content-Type":"application/json","X-Master-Key":JKEY,"X-Access-Key":JKEY };

  const getOrCreateLookup=async()=>{
    const stored=localStorage.getItem("epl2027_lookup");
    if(stored){
      try{ const r=await fetch(`${JBASE}/b/${stored}/latest`,{headers:jH}); if(r.ok) return{id:stored,data:(await r.json()).record||{}}; }catch(e){}
    }
    const r=await fetch(`${JBASE}/b`,{method:"POST",headers:{...jH,"X-Bin-Name":"epl2027-lookup","X-Bin-Private":"false"},body:JSON.stringify({})});
    if(!r.ok) throw new Error("Could not create room directory");
    const data=await r.json(); const newId=data.metadata.id;
    localStorage.setItem("epl2027_lookup",newId);
    return{id:newId,data:{}};
  };

  const updateLookup=async(code,bid)=>{
    try{ const{id,data}=await getOrCreateLookup(); await fetch(`${JBASE}/b/${id}`,{method:"PUT",headers:jH,body:JSON.stringify({...data,[code]:bid})}); }catch(e){}
  };

  const saveRooms=(rooms)=>{ localStorage.setItem("epl_my_rooms",JSON.stringify(rooms)); setMyRooms(rooms); };

  const createRoom=async()=>{
    if(!myName.trim()){ setError("Enter your name first"); return; }
    setLoading(true); setError("");
    try{
      const code=genCode(), id=genCode();
      const roomName=myName.trim()+" EPL 2026/27";
      const roomData={ code, name:roomName, createdAt:new Date().toISOString(), members:[{id,name:myName.trim(),champPick:champPick||null,matchPicks:{},joinedAt:new Date().toISOString()}] };
      const resp=await fetch(`${JBASE}/b`,{method:"POST",headers:{...jH,"X-Bin-Name":"epl27-"+code,"X-Bin-Private":"false"},body:JSON.stringify(roomData)});
      if(!resp.ok) throw new Error("HTTP "+resp.status);
      const data=await resp.json(); const newBinId=data.metadata.id;
      await updateLookup(code,newBinId);
      setBinId(newBinId); setRoomCode(code); setMyId(id); setRoom(roomData);
      localStorage.setItem("epl_sw_name",myName.trim());
      localStorage.setItem("epl_id_"+code,id);
      saveRooms([...myRooms.filter(r=>r.code!==code),{code,binId:newBinId,myId:id,name:roomName}]);
      setScreen("room");
    }catch(e){ setError(e.message); }
    setLoading(false);
  };

  const joinRoom=async()=>{
    if(!myName.trim()){ setError("Enter your name first"); return; }
    if(!joinCode.trim()){ setError("Enter room code"); return; }
    setLoading(true); setError("");
    try{
      const code=joinCode.trim().toUpperCase();
      const{data:lookup}=await getOrCreateLookup();
      const foundBinId=lookup[code];
      if(!foundBinId) throw new Error("Room not found. Check the code.");
      const resp=await fetch(`${JBASE}/b/${foundBinId}/latest`,{headers:jH});
      const roomData=(await resp.json()).record;
      const storedId=localStorage.getItem("epl_id_"+code);
      const existing=roomData.members?.find(m=>m.id===storedId||m.name.toLowerCase()===myName.trim().toLowerCase());
      let id=existing?existing.id:genCode();
      if(!existing){
        roomData.members=[...(roomData.members||[]),{id,name:myName.trim(),champPick:champPick||null,matchPicks:{},joinedAt:new Date().toISOString()}];
        await fetch(`${JBASE}/b/${foundBinId}`,{method:"PUT",headers:jH,body:JSON.stringify(roomData)});
      }
      localStorage.setItem("epl_sw_name",myName.trim());
      localStorage.setItem("epl_id_"+code,id);
      setBinId(foundBinId); setRoomCode(code); setMyId(id); setRoom(roomData);
      saveRooms([...myRooms.filter(r=>r.code!==code),{code,binId:foundBinId,myId:id,name:roomData.name}]);
      setScreen("room");
    }catch(e){ setError(e.message); }
    setLoading(false);
  };

  const refreshRoom=async()=>{
    if(!binId) return;
    try{ const resp=await fetch(`${JBASE}/b/${binId}/latest`,{headers:jH}); setRoom((await resp.json()).record); }catch(e){}
  };

  useEffect(()=>{
    if(screen!=="room"||!binId) return;
    const iv=setInterval(refreshRoom,30000);
    return()=>clearInterval(iv);
  },[screen,binId]);

  const savePick=async()=>{
    if(!binId||!myId||!pickingMatch) return;
    const key=`${pickingMatch.home}-${pickingMatch.away}`;
    const pick={homeScore:Number(homeIn),awayScore:Number(awayIn),pickedAt:new Date().toISOString()};
    setMatchPicks(p=>({...p,[key]:pick}));
    setPickingMatch(null);
    setLoading(true);
    try{
      const fresh=await fetch(`${JBASE}/b/${binId}/latest`,{headers:jH});
      const freshData=(await fresh.json()).record;
      const updated={...freshData,members:freshData.members.map(m=>m.id===myId?{...m,matchPicks:{...(m.matchPicks||{}),[key]:pick}}:m)};
      await fetch(`${JBASE}/b/${binId}`,{method:"PUT",headers:jH,body:JSON.stringify(updated)});
      setRoom(updated);
    }catch(e){ setError("Save failed"); }
    setLoading(false);
  };

  const copyCode=()=>{ navigator.clipboard?.writeText(roomCode).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const shareRoom=()=>{
    const url=window.location.origin+"?room="+roomCode;
    if(navigator.share) navigator.share({title:"EPL 2026/27 Sweepstake",text:"Join my EPL sweepstake! Code: "+roomCode,url});
    else{ navigator.clipboard?.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  const leaderboard=useMemo(()=>{
    if(!room?.members) return [];
    return [...room.members].map(m=>({...m,pts:calcPoints(m,liveResults),picks:Object.keys(m.matchPicks||{}).length})).sort((a,b)=>b.pts-a.pts);
  },[room,liveResults]);

  const myMember=room?.members?.find(m=>m.id===myId);
  const myPicks=myMember?.matchPicks||{};
  const upcoming=liveResults.filter(m=>m.status==="NS"||m.status==="LIVE").slice(0,10);
  const finished=liveResults.filter(m=>m.status==="FT").slice(-5);

  const howItWorks=[
    ["Pick your title winner","Choose which team lifts the trophy at season end","🎯"],
    ["Predict match scores","Pick scorelines for upcoming EPL fixtures before KO","⚽"],
    ["Earn points","Exact score 5pts - Correct result 2pts - Right champion 10pts","🏅"],
    ["Beat your mates","Create a private room, share the code, compete all season","🤜"],
  ];

  if(screen==="home") return (
    <div style={{padding:12}}>
      <div style={{background:"linear-gradient(135deg,#0a1826,#0f2040)",border:`1px solid ${C.sky}40`,borderRadius:14,padding:20,textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:32,marginBottom:8}}>🏆</div>
        <div style={{fontSize:20,fontWeight:900,background:`linear-gradient(90deg,${C.sky},#ffffff)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6}}>EPL Sweepstake 2026/27</div>
        <div style={{color:C.muted,fontSize:12,lineHeight:1.6}}>Pick scores. Back your club. Outsmart your mates.</div>
      </div>
      <div style={ST.card}>
        <div style={ST.lbl}>HOW IT WORKS</div>
        {howItWorks.map(([title,desc,icon])=>(
          <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
            <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:C.text}}>{title}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={ST.card}>
        <div style={ST.lbl}>YOUR DETAILS</div>
        <input style={ST.input} placeholder="Your name" value={myName} onChange={e=>setMyName(e.target.value)} />
        <div style={{...ST.lbl,marginTop:10}}>PICK YOUR 2026/27 CHAMPION</div>
        <select value={champPick} onChange={e=>setChampPick(e.target.value)} style={ST.input}>
          <option value="">Pick a team</option>
          {TEAMS.map(t=><option key={t} value={t}>{BADGE[t]} {t}</option>)}
        </select>
        {champPick&&<div style={{marginTop:8,padding:"8px 12px",background:"#0a1826",borderRadius:8,fontSize:12,color:C.sky,fontWeight:700}}>{"You back "+BADGE[champPick]+" "+champPick+" to win the league!"}</div>}
      </div>
      <button onClick={createRoom} disabled={loading||!myName.trim()} style={{...ST.btn,marginBottom:10,opacity:(!myName.trim()||loading)?0.5:1}}>{loading?"Creating...":"Create Room"}</button>
      <div style={ST.card}>
        <div style={ST.lbl}>JOIN A ROOM</div>
        <input style={ST.input} placeholder="Enter room code e.g. ABC123" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} />
        <button onClick={joinRoom} disabled={loading||!myName.trim()||!joinCode.trim()} style={{...ST.btn,opacity:(!myName.trim()||!joinCode.trim()||loading)?0.5:1}}>{loading?"Joining...":"Join Room"}</button>
      </div>
      {myRooms.length>0&&(
        <div style={ST.card}>
          <div style={ST.lbl}>MY ROOMS</div>
          {myRooms.map(r=>(
            <div key={r.code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontSize:12,fontWeight:800}}>{r.name||r.code}</div>
                <div style={{fontSize:10,color:C.muted}}>Code: <span style={{color:C.sky,fontWeight:700}}>{r.code}</span></div>
              </div>
              <button onClick={async()=>{
                setBinId(r.binId); setRoomCode(r.code); setMyId(r.myId); setLoading(true);
                try{ const resp=await fetch(`${JBASE}/b/${r.binId}/latest`,{headers:jH}); setRoom((await resp.json()).record); setScreen("room"); }catch(e){}
                setLoading(false);
              }} style={{background:"#0f1e30",border:`1px solid ${C.border}`,color:C.sky,borderRadius:7,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Enter</button>
            </div>
          ))}
        </div>
      )}
      {error&&<div style={{color:C.red,fontSize:12,marginTop:8,padding:"8px 12px",background:"#1a0505",borderRadius:8}}>{"Error: "+error}</div>}
    </div>
  );

  return (
    <div style={{padding:12}}>
      <div style={{background:"linear-gradient(135deg,#0a1826,#0f2040)",border:`1px solid ${C.sky}40`,borderRadius:14,padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:C.text}}>{room?.name||"My Room"}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{(room?.members?.length||0)+" members - Code: "}<span style={{color:C.sky,fontWeight:800}}>{roomCode}</span></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={copyCode} style={{background:"#0f1e30",border:`1px solid ${C.border}`,color:copied?C.green:C.sky,borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{copied?"Copied!":"Copy"}</button>
            <button onClick={shareRoom} style={{background:C.sky,border:"none",color:"#070e1a",borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Share</button>
          </div>
        </div>
        {myMember?.champPick&&<div style={{marginTop:10,padding:"6px 10px",background:"#070e1a",borderRadius:8,fontSize:11,color:C.gold}}>{"Your pick: "+(BADGE[myMember.champPick]||"")+" "+myMember.champPick}</div>}
        <div style={{display:"flex",gap:6,marginTop:10}}>
          <button onClick={refreshRoom} style={{flex:1,background:"#0f1e30",border:`1px solid ${C.border}`,color:C.accent,borderRadius:7,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>Refresh</button>
          <button onClick={()=>setScreen("home")} style={{flex:1,background:"#0f1e30",border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>Back to Rooms</button>
        </div>
      </div>

      <div style={ST.card}>
        <div style={ST.lbl}>LEADERBOARD</div>
        {leaderboard.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:12}}>No members yet. Share the code!</div>}
        {leaderboard.map((m,i)=>{
          const isMe=m.id===myId;
          const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1);
          return(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:`1px solid ${C.border}`,background:isMe?"#0a1826":"transparent",borderRadius:isMe?8:0,paddingLeft:isMe?8:0}}>
              <div style={{fontSize:16,width:28,textAlign:"center",flexShrink:0}}>{medal}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:isMe?900:700,color:isMe?C.sky:C.text}}>
                  {m.name}{isMe&&<span style={{marginLeft:6,fontSize:9,color:C.sky,background:"#0f1e30",padding:"1px 5px",borderRadius:99}}>YOU</span>}
                </div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.champPick?(BADGE[m.champPick]||"")+" "+m.champPick:"No champion pick"}{" - "}{m.picks+" picks"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:20,fontWeight:900,color:i===0?C.gold:isMe?C.sky:C.text}}>{m.pts}</div>
                <div style={{fontSize:9,color:C.muted}}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{...ST.card,background:"#07101e",borderColor:C.sky+"40"}}>
        <div style={{...ST.lbl,color:C.sky,marginBottom:10}}>HOW POINTS ARE SCORED</div>

        <div style={{background:"#0a1826",border:"1px solid "+C.gold+"60",borderRadius:10,padding:12,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:900,color:C.gold}}>EXACT SCORE</span>
            <span style={{fontSize:20,fontWeight:900,color:C.gold}}>5 pts</span>
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>You get the scoreline spot on.</div>
          <div style={{fontSize:11,color:C.text,marginTop:6,padding:"6px 10px",background:"#070e1a",borderRadius:6}}>
            You picked <b style={{color:C.gold}}>2-1</b> and it finished <b style={{color:C.gold}}>2-1</b> = <b style={{color:C.gold}}>5 pts</b>
          </div>
        </div>

        <div style={{background:"#0a1826",border:"1px solid "+C.green+"60",borderRadius:10,padding:12,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:900,color:C.green}}>CORRECT RESULT</span>
            <span style={{fontSize:20,fontWeight:900,color:C.green}}>2 pts</span>
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Right winner (or draw), wrong scoreline.</div>
          <div style={{fontSize:11,color:C.text,marginTop:6,padding:"6px 10px",background:"#070e1a",borderRadius:6}}>
            You picked <b style={{color:C.green}}>2-1</b> and it finished <b style={{color:C.green}}>3-0</b> = <b style={{color:C.green}}>2 pts</b>
            <div style={{color:C.muted,fontSize:10,marginTop:3}}>Home win predicted, home win happened.</div>
          </div>
        </div>

        <div style={{background:"#0a1826",border:"1px solid "+C.red+"60",borderRadius:10,padding:12,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:900,color:C.red}}>WRONG RESULT</span>
            <span style={{fontSize:20,fontWeight:900,color:C.red}}>0 pts</span>
          </div>
          <div style={{fontSize:11,color:C.text,marginTop:2,padding:"6px 10px",background:"#070e1a",borderRadius:6}}>
            You picked <b style={{color:C.red}}>2-1</b> and it finished <b style={{color:C.red}}>0-2</b> = <b style={{color:C.red}}>0 pts</b>
          </div>
        </div>

        <div style={{background:"#0a1826",border:"1px solid "+C.sky+"60",borderRadius:10,padding:12,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:13,fontWeight:900,color:C.sky}}>CHAMPION BONUS</span>
            <span style={{fontSize:20,fontWeight:900,color:C.sky}}>10 pts</span>
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Awarded once, at the end of the season, if the team you backed lifts the title.</div>
          <div style={{fontSize:11,color:C.text,marginTop:6,padding:"6px 10px",background:"#070e1a",borderRadius:6}}>
            Backed the champions = <b style={{color:C.sky}}>+10 pts</b><br/>
            <span style={{color:C.muted,fontSize:10}}>Anyone else = 0 pts. Your pick is locked once set.</span>
          </div>
        </div>

        <div style={{borderTop:"1px solid "+C.border,paddingTop:10}}>
          <div style={{...ST.lbl,marginBottom:6}}>THE RULES</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.9}}>
            1. Picks lock at kickoff. No pick, no points.<br/>
            2. Every EPL fixture is worth points. 380 matches a season.<br/>
            3. Leaderboard updates automatically as results come in.<br/>
            4. Highest total at the end of May 2027 wins bragging rights.
          </div>
        </div>

        <div style={{marginTop:10,padding:"8px 10px",background:"#0f1e30",borderRadius:8,fontSize:11,color:C.sky,textAlign:"center",fontWeight:700}}>
          Max per match = 5 pts. Season bonus = 10 pts.
        </div>
      </div>

      <div style={ST.card}>
        <div style={ST.lbl}>PICK UPCOMING MATCHES</div>
        {upcoming.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:12}}>No upcoming fixtures. Refresh Live Scores tab.</div>}
        {upcoming.map(m=>{
          const key=`${m.home}-${m.away}`;
          const myPick=myPicks[key];
          const isLive=m.status==="LIVE";
          return(
            <div key={key} style={{padding:"10px 0",borderTop:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700}}>{(BADGE[m.home]||"")+" "+m.home+" vs "+(BADGE[m.away]||"")+" "+m.away}</div>
                <span style={{fontSize:10,color:isLive?C.green:C.muted,fontWeight:isLive?800:400}}>{isLive?"LIVE":"Upcoming"}</span>
              </div>
              {myPick
                ?<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:C.sky,fontWeight:800}}>{"Your pick: "+myPick.homeScore+"-"+myPick.awayScore}</div>
                    {!isLive&&<button onClick={()=>{setPickingMatch(m);setHomeIn(String(myPick.homeScore));setAwayIn(String(myPick.awayScore));}} style={{background:"#0f1e30",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer"}}>Edit</button>}
                  </div>
                :<button onClick={()=>{setPickingMatch(m);setHomeIn("1");setAwayIn("0");}} disabled={isLive} style={{...ST.btn,marginTop:0,padding:"7px 0",fontSize:11,opacity:isLive?0.4:1}}>{"Pick Score"}</button>
              }
            </div>
          );
        })}
      </div>

      {finished.length>0&&(
        <div style={ST.card}>
          <div style={ST.lbl}>RECENT RESULTS</div>
          {finished.map(m=>{
            const key=`${m.home}-${m.away}`;
            const myPick=myPicks[key];
            const rOut=m.homeScore>m.awayScore?"home":m.awayScore>m.homeScore?"away":"draw";
            const pOut=myPick?(myPick.homeScore>myPick.awayScore?"home":myPick.awayScore>myPick.homeScore?"away":"draw"):null;
            const exact=myPick&&myPick.homeScore===m.homeScore&&myPick.awayScore===m.awayScore;
            const correct=pOut===rOut;
            return(
              <div key={key} style={{padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{fontWeight:700}}>{m.home+" "+m.homeScore+"-"+m.awayScore+" "+m.away}</span>
                  {myPick&&<span style={{color:exact?C.gold:correct?C.green:C.red,fontWeight:800}}>{exact?"Score +5":correct?"Result +2":"Miss 0"}</span>}
                </div>
                {myPick&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{"Your pick: "+myPick.homeScore+"-"+myPick.awayScore}</div>}
                {!myPick&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>No pick made</div>}
              </div>
            );
          })}
        </div>
      )}

      {error&&<div style={{color:C.red,fontSize:12,marginTop:8,padding:"8px 12px",background:"#1a0505",borderRadius:8}}>{"Error: "+error}</div>}

      {pickingMatch&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setPickingMatch(null)}>
          <div style={{background:C.card,borderRadius:"16px 16px 0 0",border:`1px solid ${C.border}`,padding:20,width:"100%",maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:14}}>Pick Score</div>
              <button onClick={()=>setPickingMatch(null)} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>X</button>
            </div>
            <div style={{textAlign:"center",fontSize:14,fontWeight:800,marginBottom:16}}>{(BADGE[pickingMatch.home]||"")+" "+pickingMatch.home+" vs "+(BADGE[pickingMatch.away]||"")+" "+pickingMatch.away}</div>
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginBottom:16}}>
              <input value={homeIn} onChange={e=>setHomeIn(e.target.value)} style={{...ST.input,width:64,textAlign:"center",fontSize:28,fontWeight:900,padding:"10px 4px"}} type="number" min="0" max="20" />
              <span style={{fontSize:24,fontWeight:900,color:C.muted}}>-</span>
              <input value={awayIn} onChange={e=>setAwayIn(e.target.value)} style={{...ST.input,width:64,textAlign:"center",fontSize:28,fontWeight:900,padding:"10px 4px"}} type="number" min="0" max="20" />
            </div>
            <button onClick={savePick} disabled={loading} style={{...ST.btn,marginTop:0}}>{loading?"Saving...":"Lock In Pick"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LIVE SCORES ────────────────────────────────────────────
function LiveScoresView({ onLiveUpdate }){
  const [matches,setMatches]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [lastUpdate,setLastUpdate]=useState(null);
  const [autoRefresh,setAutoRefresh]=useState(false);
  const timerRef=useRef(null);

  const fetchScores=useCallback(async()=>{
    setLoading(true); setError("");
    try{
      const resp=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard");
      if(!resp.ok) throw new Error("HTTP "+resp.status);
      const data=await resp.json();
      const parsed=(data?.events||[]).map(ev=>{
        const comp=ev?.competitions?.[0];
        const home=comp?.competitors?.find(c=>c.homeAway==="home");
        const away=comp?.competitors?.find(c=>c.homeAway==="away");
        const status=comp?.status;
        const state=status?.type?.state;
        return{id:ev.id,home:home?.team?.displayName||"",away:away?.team?.displayName||"",homeScore:home?.score!=null?Number(home.score):null,awayScore:away?.score!=null?Number(away.score):null,minute:status?.displayClock?.replace("'","")||"",status:state==="in"?"LIVE":state==="post"?"FT":"NS",kickoff:ev?.date||""};
      }).filter(m=>m.home&&m.away);
      setMatches(parsed); setLastUpdate(new Date()); onLiveUpdate?.(parsed);
      if(!parsed.length) setError("No EPL matches today. Season starts 22 Aug 2026.");
    }catch(e){ setError("Feed error: "+e.message); }
    setLoading(false);
  },[]);

  useEffect(()=>{ fetchScores(); },[]);
  useEffect(()=>{
    if(autoRefresh) timerRef.current=setInterval(fetchScores,60000);
    return()=>clearInterval(timerRef.current);
  },[autoRefresh,fetchScores]);

  const fmtKO=(iso)=>iso?new Date(iso).toLocaleString("en-MY",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kuala_Lumpur"})+" MYT":"";
  const liveCount=matches.filter(m=>m.status==="LIVE").length;

  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{...ST.lbl,marginBottom:0}}>
            {"EPL LIVE SCORES"+(liveCount>0?" - "+liveCount+" LIVE":"")}
          </div>
          {lastUpdate&&<span style={{color:C.muted,fontSize:10}}>{lastUpdate.toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"})}</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={fetchScores} disabled={loading} style={{...ST.btn,marginTop:0,flex:1}}>{loading?"Loading...":"Refresh"}</button>
          <button onClick={()=>setAutoRefresh(a=>!a)} style={{...ST.btn,marginTop:0,flex:1,background:autoRefresh?"#0a1e30":"#0f1e30",color:autoRefresh?C.sky:C.muted}}>{autoRefresh?"Auto ON":"Auto"}</button>
        </div>
        {error&&<div style={{color:C.gold,fontSize:11,marginTop:6}}>{error}</div>}
      </div>
      {matches.map(m=>{
        const isLive=m.status==="LIVE",isDone=m.status==="FT",hasScore=m.homeScore!==null&&m.awayScore!==null;
        return(
          <div key={m.id} style={{...ST.card,borderColor:isLive?C.green:C.border,background:isLive?"#061a0e":C.card}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:8}}>
              <span>Premier League 2026/27</span>
              <span style={{color:isLive?C.green:isDone?C.muted:C.gold,fontWeight:isLive?800:400}}>{isLive?"LIVE "+m.minute+"'":isDone?"FT":fmtKO(m.kickoff)}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,textAlign:"right",fontSize:13,fontWeight:700}}>{(BADGE[m.home]||"")+" "+m.home}</div>
              <div style={{minWidth:64,textAlign:"center"}}>
                {hasScore?<span style={{fontSize:20,fontWeight:900,color:isLive?C.green:C.sky}}>{m.homeScore+" - "+m.awayScore}</span>:<span style={{color:C.muted,fontSize:13}}>vs</span>}
              </div>
              <div style={{flex:1,fontSize:13,fontWeight:700}}>{(BADGE[m.away]||"")+" "+m.away}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── SEASON TABLE ───────────────────────────────────────────
function SeasonTableView(){
  const [standings,setStandings]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [usingLive,setUsingLive]=useState(false);

  const normName=(name)=>{
    const M={"Manchester City":"Manchester City","Man City":"Manchester City","Arsenal":"Arsenal","Liverpool":"Liverpool","Chelsea":"Chelsea","Manchester United":"Manchester United","Man Utd":"Manchester United","Aston Villa":"Aston Villa","Tottenham":"Tottenham Hotspur","Tottenham Hotspur":"Tottenham Hotspur","Newcastle":"Newcastle United","Newcastle United":"Newcastle United","Brighton":"Brighton","Brighton & Hove Albion":"Brighton","Brentford":"Brentford","Fulham":"Fulham","Crystal Palace":"Crystal Palace","Bournemouth":"Bournemouth","Everton":"Everton","Nottingham Forest":"Nottingham Forest","Leeds United":"Leeds United","Sunderland":"Sunderland","Coventry City":"Coventry City","Ipswich Town":"Ipswich Town","Hull City":"Hull City"};
    return M[name]||name;
  };

  const fetchTable=useCallback(async()=>{
    setLoading(true); setError("");
    try{
      const resp=await fetch("https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings");
      if(!resp.ok) throw new Error("HTTP "+resp.status);
      const data=await resp.json();
      let entries=[];
      if(data?.children?.length) entries=data.children.flatMap(ch=>ch?.standings?.entries||[]);
      else if(data?.standings?.entries) entries=data.standings.entries;
      else if(data?.standings?.[0]?.entries) entries=data.standings[0].entries;
      if(!entries.length) throw new Error("Season has not started yet");
      const parsed=entries.map(e=>{
        const stats={};
        (e?.stats||[]).forEach(s=>{ stats[s.name]=s.value; });
        return{team:normName(e?.team?.displayName||""),P:Math.round(stats.gamesPlayed||0),W:Math.round(stats.wins||0),D:Math.round(stats.ties||0),L:Math.round(stats.losses||0),GF:Math.round(stats.pointsFor||0),GA:Math.round(stats.pointsAgainst||0),GD:Math.round(stats.pointDifferential||0),Pts:Math.round(stats.points||0)};
      }).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF);
      setStandings(parsed); setUsingLive(true);
    }catch(e){ setError("ESPN: "+e.message); }
    setLoading(false);
  },[]);

  useEffect(()=>{ fetchTable(); },[]);

  const getZone=(pos)=>{
    if(pos<=5) return"#fbbf24";
    if(pos<=7) return"#f97316";
    if(pos===8) return"#60a5fa";
    if(pos>=18) return C.red;
    return"transparent";
  };
  const sn=(name)=>name.replace("Manchester","Man").replace("Tottenham Hotspur","Spurs").replace("Nottingham Forest","Nott m F").replace("Newcastle United","Newcastle").replace("Crystal Palace","C Palace").replace("Aston Villa","A Villa");

  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{...ST.lbl,marginBottom:0}}>{"PREMIER LEAGUE TABLE 2026/27"+(usingLive?" - LIVE":"")}</div>
        </div>
        <button onClick={fetchTable} disabled={loading} style={{...ST.btn,marginTop:0}}>{loading?"Loading...":"Refresh"}</button>
        {error&&<div style={{color:C.gold,fontSize:11,marginTop:6}}>{error}</div>}
      </div>
      {standings.length>0&&(
        <div style={{...ST.card,padding:"10px 8px",overflowX:"auto"}}>
          <table style={{...ST.table,minWidth:0}}>
            <thead>
              <tr>{["#","Club","P","W","D","L","GD","Pts"].map(h=><th key={h} style={{...ST.th,textAlign:h==="Club"?"left":"center"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {standings.map((row,i)=>(
                <tr key={row.team}>
                  <td style={{...ST.td,paddingLeft:2}}>
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <div style={{width:3,height:22,borderRadius:2,background:getZone(i+1),flexShrink:0}} />
                      <span style={{color:C.muted}}>{i+1}</span>
                    </div>
                  </td>
                  <td style={{...ST.td,fontWeight:700,whiteSpace:"nowrap"}}>{(BADGE[row.team]||"")+" "+sn(row.team)}{NEW_TEAMS.has(row.team)&&<span style={{marginLeft:3,fontSize:8,color:C.sky}}>up</span>}</td>
                  <td style={{...ST.td,textAlign:"center",color:C.muted}}>{row.P}</td>
                  <td style={{...ST.td,textAlign:"center",color:C.green}}>{row.W}</td>
                  <td style={{...ST.td,textAlign:"center",color:C.gold}}>{row.D}</td>
                  <td style={{...ST.td,textAlign:"center",color:row.L>0?C.red:C.muted}}>{row.L}</td>
                  <td style={{...ST.td,textAlign:"center",color:row.GD>0?C.green:row.GD<0?C.red:C.muted}}>{row.GD>0?"+"+row.GD:row.GD}</td>
                  <td style={{...ST.td,textAlign:"center",color:C.sky,fontWeight:900,fontSize:13}}>{row.Pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {standings.length===0&&!loading&&(
        <div style={{...ST.card,textAlign:"center",padding:24,color:C.muted}}>Season starts 22 Aug 2026. Tap Refresh to load table.</div>
      )}
    </div>
  );
}

// ── POWER RANKINGS ─────────────────────────────────────────
function PowerRankingsView(){
  const sorted=[...TEAMS].sort((a,b)=>getStr(b)-getStr(a));
  const max=getStr(sorted[0]);
  const euroColors={"UCL":"#fbbf24","UEL":"#f97316","UECL":"#60a5fa"};
  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={{...ST.lbl,marginBottom:2}}>POWER RANKINGS 2026/27</div>
        <div style={{color:C.muted,fontSize:11,marginBottom:14,lineHeight:1.5}}>Squad strength ratings based on 2025/26 finish and confirmed summer transfers.</div>
        {sorted.map((team,i)=>{
          const str=getStr(team),pct=(str/max)*100;
          const euro=EUROPEAN[team];
          return(
            <div key={team} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:i<3?C.gold:C.muted,fontSize:11,fontWeight:700,width:20}}>{"#"+(i+1)}</span>
                  <span style={{fontSize:18}}>{BADGE[team]}</span>
                  <span style={{fontSize:12,fontWeight:800}}>{team}</span>
                  {NEW_TEAMS.has(team)&&<span style={{fontSize:9,fontWeight:800,background:"#0f1e30",color:C.sky,padding:"1px 6px",borderRadius:99}}>NEW</span>}
                  {euro&&<span style={{fontSize:9,fontWeight:800,color:euroColors[euro]}}>{euro}</span>}
                </div>
                <span style={{fontSize:14,fontWeight:900,color:i===0?C.gold:C.sky}}>{str}</span>
              </div>
              <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:pct+"%",background:i===0?C.gold:i<5?C.sky:C.accent,borderRadius:3}} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PREDICT MATCH ──────────────────────────────────────────
function PredictView(){
  const [home,setHome]=useState("Arsenal");
  const [away,setAway]=useState("Manchester City");
  const [result,setResult]=useState(null);
  const [aiText,setAiText]=useState("");
  const [loading,setLoading]=useState(false);
  const [query,setQuery]=useState("");

  const predict=async()=>{
    if(!home||!away||home===away) return;
    setLoading(true); setAiText(""); setResult(null);
    const pred=predictMatch(home,away,true);
    setResult({...pred,home,away});
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,messages:[{role:"user",content:"EPL 2026/27 analyst. 150-word preview: "+home+" vs "+away+". Model: "+pred.predictedScore+" ("+home+" "+pred.probabilities.homeWin+"% / Draw "+pred.probabilities.draw+"% / "+away+" "+pred.probabilities.awayWin+"%). Arsenal are defending champions. Man City post-Pep rebuild. Man Utd resurgent under Carrick. Liverpool have Wirtz+Isak. Three promoted: Coventry, Ipswich, Hull. Sharp analyst tone."}]})});
      const data=await resp.json();
      setAiText(data.content?.map(c=>c.text||"").join("")||"");
    }catch(e){ setAiText("AI preview unavailable."); }
    setLoading(false);
  };

  const askAI=async()=>{
    if(!query.trim()) return;
    setLoading(true); setAiText(""); setResult(null);
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:"EPL 2026/27 expert. Search for latest info then answer: "+query+". Arsenal champions. Man Utd 3rd under Carrick. Man City post-Pep. Liverpool have Wirtz+Isak. Promoted: Coventry, Ipswich, Hull. 150 words max."}]})});
      const data=await resp.json();
      setAiText(data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||"");
    }catch(e){ setAiText("Query failed."); }
    setLoading(false);
  };

  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={{...ST.lbl,marginBottom:10}}>PREDICT ANY MATCH - 2026/27</div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}>
            <div style={ST.lbl}>HOME</div>
            <select value={home} onChange={e=>setHome(e.target.value)} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]+" "+t}</option>)}</select>
          </div>
          <div style={{color:C.muted,fontWeight:900,fontSize:12,paddingTop:22}}>VS</div>
          <div style={{flex:1}}>
            <div style={ST.lbl}>AWAY</div>
            <select value={away} onChange={e=>setAway(e.target.value)} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]+" "+t}</option>)}</select>
          </div>
        </div>
        <button onClick={predict} style={ST.btn} disabled={loading||home===away}>{loading?"Analysing...":"Predict Match"}</button>
      </div>
      {result&&!loading&&(
        <div style={ST.card}>
          <div style={{textAlign:"center",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"center",gap:14,alignItems:"center",marginBottom:12}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:28}}>{BADGE[result.home]}</div><div style={{fontWeight:800,fontSize:12,marginTop:4}}>{result.home}</div></div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:34,fontWeight:900,color:C.sky}}>{result.predictedScore}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{"HT "+result.halfTimeScore}</div>
              </div>
              <div style={{textAlign:"center"}}><div style={{fontSize:28}}>{BADGE[result.away]}</div><div style={{fontWeight:800,fontSize:12,marginTop:4}}>{result.away}</div></div>
            </div>
            <div style={{display:"flex",gap:3,height:5,borderRadius:3,overflow:"hidden",margin:"0 8px"}}>
              <div style={{flex:result.probabilities.homeWin,background:C.sky}} />
              <div style={{flex:result.probabilities.draw,background:C.gold}} />
              <div style={{flex:result.probabilities.awayWin,background:C.red}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:11}}>
              <span style={{color:C.sky}}>{result.probabilities.homeWin+"% Home"}</span>
              <span style={{color:C.gold}}>{result.probabilities.draw+"% Draw"}</span>
              <span style={{color:C.red}}>{result.probabilities.awayWin+"% Away"}</span>
            </div>
            <div style={{marginTop:6,color:C.muted,fontSize:11}}>{"xG: "+result.xG[result.home]+" - "+result.xG[result.away]+" - Over 2.5: "+result.probabilities.over25+"% - "+result.confidence+" confidence"}</div>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10}}>
            <div style={ST.lbl}>TOP CORRECT SCORES</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {result.topScores.slice(0,6).map((s,i)=>(
                <div key={s.score} style={{background:i===0?"#0a1e36":"#070e1a",border:`1px solid ${i===0?C.sky:C.border}`,borderRadius:7,padding:"6px 10px",textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:900,color:i===0?C.sky:C.text}}>{s.score}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:1}}>{s.prob+"%"}</div>
                </div>
              ))}
            </div>
          </div>
          {aiText&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10}}><div style={{...ST.lbl,color:"#60a5fa"}}>AI PREVIEW</div><p style={{color:C.muted,fontSize:12,lineHeight:1.6,margin:0}}>{aiText}</p></div>}
        </div>
      )}
      <div style={ST.card}>
        <div style={ST.lbl}>ASK THE ANALYST</div>
        <input style={ST.input} placeholder="e.g. Can Man Utd win the title?" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()} />
        <button onClick={askAI} style={ST.btn} disabled={loading}>{loading?"Thinking...":"Ask"}</button>
        {aiText&&!result&&<div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:10}}><p style={{color:C.muted,fontSize:12,lineHeight:1.6,margin:0}}>{aiText}</p></div>}
      </div>
    </div>
  );
}

// ── TEAM INTEL ─────────────────────────────────────────────
function TeamIntelView(){
  const [team,setTeam]=useState("Manchester City");
  const [aiText,setAiText]=useState("");
  const [loading,setLoading]=useState(false);
  const str=STRENGTH[team]||60;
  const rank=[...TEAMS].sort((a,b)=>getStr(b)-getStr(a)).findIndex(t=>t===team)+1;
  const euroColors={"UCL":"#fbbf24","UEL":"#f97316","UECL":"#60a5fa"};

  const getAI=async()=>{
    setLoading(true); setAiText("");
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:'Search "'+team+' Premier League 2026-27 transfers preview" then write 200-word EPL 2026/27 preview: transfers in/out, tactical identity, season outlook. Strength '+str+'/100, ranked #'+rank+'. No bullets.'}]})});
      const data=await resp.json();
      setAiText(data.content?.filter(c=>c.type==="text").map(c=>c.text||"").join("")||"");
    }catch(e){ setAiText("AI unavailable."); }
    setLoading(false);
  };

  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={{...ST.lbl,marginBottom:10}}>TEAM DEEP DIVE - 2026/27</div>
        <select value={team} onChange={e=>{ setTeam(e.target.value); setAiText(""); }} style={ST.input}>{TEAMS.map(t=><option key={t} value={t}>{BADGE[t]+" "+t+(NEW_TEAMS.has(t)?" NEW":"")}</option>)}</select>
      </div>
      <div style={ST.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:26,marginBottom:4}}>{BADGE[team]}</div>
            <div style={{fontSize:16,fontWeight:900}}>{team}</div>
            <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
              <span style={{color:C.muted,fontSize:11}}>{"#"+rank+" in model"}</span>
              {EUROPEAN[team]&&<span style={{color:euroColors[EUROPEAN[team]],fontSize:11,fontWeight:700}}>{EUROPEAN[team]}</span>}
              {NEW_TEAMS.has(team)&&<span style={{color:C.sky,fontSize:11,fontWeight:700}}>Promoted</span>}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28,fontWeight:900,color:C.gold}}>{str}</div>
            <div style={{color:C.muted,fontSize:10,fontWeight:700}}>STRENGTH</div>
          </div>
        </div>
        {KEY_PLAYERS[team]&&(
          <div style={{marginBottom:12}}>
            <div style={ST.lbl}>KEY PLAYERS 2026/27</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {Object.entries(KEY_PLAYERS[team]).map(([name,rating])=>(
                <div key={name} style={{background:"#070e1a",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 9px",fontSize:11}}>
                  {name}<span style={{color:C.gold,marginLeft:5,fontSize:10,fontWeight:800}}>{"*"+rating}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={ST.card}>
        <div style={ST.lbl}>AI SEASON PREVIEW</div>
        <button onClick={getAI} disabled={loading} style={ST.btn}>{loading?"Searching latest news...":"Get "+team+" 2026/27 Preview"}</button>
        {aiText&&<div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:10}}><p style={{color:C.muted,fontSize:12,lineHeight:1.7,margin:0}}>{aiText}</p></div>}
      </div>
    </div>
  );
}

// ── TOP SCORERS ────────────────────────────────────────────
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

function TopScorersView(){
  const [scorers,setScorers]=useState(FALLBACK_SCORERS);
  const [loading,setLoading]=useState(false);
  const [view,setView]=useState("goals");

  const fetchScorers=async()=>{
    setLoading(true);
    try{
      const resp=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard");
      if(resp.ok){
        const data=await resp.json();
        const goalMap={};
        (data?.events||[]).forEach(ev=>{
          const comp=ev?.competitions?.[0];
          (comp?.details||[]).forEach(d=>{
            if(d?.scoringPlay||d?.type?.text?.toLowerCase().includes("goal")){
              const nm=d?.athletesInvolved?.[0]?.displayName;
              const tm=d?.team?.displayName||"";
              if(nm){ const k=nm+"|"+tm; goalMap[k]=(goalMap[k]||0)+1; }
            }
          });
        });
        const arr=Object.entries(goalMap).map(([k,v])=>{ const [name,team]=k.split("|"); return{name,team,goals:v,assists:0}; }).sort((a,b)=>b.goals-a.goals).slice(0,20).map((s,i)=>({...s,rank:i+1}));
        if(arr.length){ setScorers(arr); setLoading(false); return; }
      }
    }catch(e){}
    setScorers(FALLBACK_SCORERS);
    setLoading(false);
  };

  useEffect(()=>{ fetchScorers(); },[]);
  const seasonStarted=scorers.some(s=>s.goals>0);

  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{...ST.lbl,marginBottom:0}}>TOP SCORERS 2026/27</div>
          <button onClick={fetchScorers} disabled={loading} style={{background:"#0f1e30",border:`1px solid ${C.border}`,color:C.sky,borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>{loading?"...":"Refresh"}</button>
        </div>
        {!seasonStarted&&<div style={{color:C.gold,fontSize:11,marginBottom:8}}>Season starts 22 Aug 2026. Predicted key players shown.</div>}
      </div>
      {scorers.map((s,i)=>{
        const isMCity=s.team==="Manchester City";
        return(
          <div key={s.name+i} style={{...ST.card,padding:"10px 12px",borderColor:isMCity?C.sky:C.border,background:isMCity?"#0a1826":C.card}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,background:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7f32":"#0f1e30",color:i<3?"#070e1a":C.muted}}>{s.rank}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:isMCity?C.sky:C.text}}>{s.name}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:1}}>{(BADGE[s.team]||"")+" "+s.team}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:22,fontWeight:900,color:i===0?C.gold:C.sky,lineHeight:1}}>{s.goals}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:2}}>GOALS</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── RESULTS TRACKER ────────────────────────────────────────
function ResultsTrackerView({ liveResults=[] }){
  const [tracked,setTracked]=useState([]);
  const [filter,setFilter]=useState("all");

  useEffect(()=>{
    const played=liveResults.filter(m=>m.status==="FT"&&m.homeScore!==null);
    setTracked(played.map(m=>{
      const pred=predictMatch(m.home,m.away,true);
      const [ph,pa]=pred.predictedScore.split("-").map(Number);
      const predOut=ph>pa?"home":pa>ph?"away":"draw";
      const realOut=m.homeScore>m.awayScore?"home":m.awayScore>m.homeScore?"away":"draw";
      return{id:m.id,home:m.home,away:m.away,realScore:`${m.homeScore}-${m.awayScore}`,realOut,predScore:pred.predictedScore,predOut,outcomeCorrect:realOut===predOut,scoreCorrect:m.homeScore===ph&&m.awayScore===pa};
    }));
  },[liveResults]);

  const played=tracked.filter(m=>m.realScore);
  const correct=played.filter(m=>m.outcomeCorrect);
  const acc=played.length>0?Math.round(correct.length/played.length*100):0;
  const filtered=filter==="correct"?tracked.filter(m=>m.outcomeCorrect):filter==="wrong"?tracked.filter(m=>!m.outcomeCorrect):tracked;

  return(
    <div style={{padding:12}}>
      <div style={ST.card}>
        <div style={ST.lbl}>PREDICTION ACCURACY - 2026/27</div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[{label:"PLAYED",value:played.length},{label:"CORRECT",value:correct.length,color:C.green},{label:"ACCURACY",value:acc+"%",color:acc>=55?C.green:acc>=40?C.gold:C.red}].map(s=>(
            <div key={s.label} style={{flex:1,background:"#070e1a",borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
              <div style={{color:C.muted,fontSize:8,fontWeight:700}}>{s.label}</div>
              <div style={{color:s.color||C.text,fontSize:16,fontWeight:900,marginTop:3}}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {[["all","All"],["correct","Correct"],["wrong","Wrong"]].map(([id,label])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{flex:1,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:filter===id?C.sky:"#0f1e30",color:filter===id?"#070e1a":C.muted}}>{label}</button>
        ))}
      </div>
      {filtered.length===0&&<div style={{...ST.card,textAlign:"center",color:C.muted,padding:28}}>{tracked.length===0?"Tracking starts when the season kicks off 22 Aug 2026.":"No matches in this filter."}</div>}
      {filtered.map(m=>(
        <div key={m.id} style={{...ST.card,borderColor:m.outcomeCorrect?"#1e3a5f":"#7f1d1d",background:m.outcomeCorrect?"#07101e":"#0f0505"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:6}}>
            <span style={{color:C.muted}}>Premier League 2026/27</span>
            <span style={{color:m.outcomeCorrect?C.green:C.red,fontWeight:800}}>{m.outcomeCorrect?"CORRECT":"WRONG"+(m.scoreCorrect?" - SCORE HIT":"")}</span>
          </div>
          <div style={{textAlign:"center",fontSize:13,fontWeight:800,marginBottom:10}}>{(BADGE[m.home]||"")+" "+m.home+" vs "+(BADGE[m.away]||"")+" "+m.away}</div>
          <div style={{display:"flex",gap:8}}>
            {[{label:"REAL",score:m.realScore,color:C.sky},{label:"PREDICTED",score:m.predScore,color:C.gold}].map(col=>(
              <div key={col.label} style={{flex:1,background:"#070e1a",borderRadius:8,padding:"10px 6px",textAlign:"center"}}>
                <div style={{color:C.muted,fontSize:9,fontWeight:700}}>{col.label}</div>
                <div style={{fontSize:20,fontWeight:900,color:col.color,marginTop:4}}>{col.score}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("sweep");
  const [modelVersion,setModelVersion]=useState(0);
  const [liveResults,setLiveResults]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem("epl_live_results")||"[]"); }catch(e){ return []; }
  });
  const [isMobile,setIsMobile]=useState(()=>typeof window!=="undefined"?window.innerWidth<900:false);
  const [sidebarOpen,setSidebarOpen]=useState(()=>typeof window!=="undefined"?window.innerWidth>=900:true);
  const [installReady,setInstallReady]=useState(false);
  const [showIOSPrompt,setShowIOSPrompt]=useState(false);
  const [installDismissed,setInstallDismissed]=useState(false);

  useEffect(()=>{
    const onResize=()=>{ const mobile=window.innerWidth<900; setIsMobile(mobile); setSidebarOpen(!mobile); };
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);

  useEffect(()=>{
    const KEY="epl2027_build",prev=localStorage.getItem(KEY);
    if(prev===BUILD_VERSION) return;
    try{ localStorage.setItem(KEY,BUILD_VERSION); }catch(e){}
    if(!prev) return;
    (async()=>{ try{ if(window.caches?.keys){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); } }catch(e){} window.location.reload(); })();
  },[]);

  useEffect(()=>{
    const handler=()=>setInstallReady(true);
    window.addEventListener("pwaInstallReady",handler);
    if(window.deferredInstallPrompt) setInstallReady(true);
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    if(isIOS&&!window.navigator.standalone) setShowIOSPrompt(true);
    return()=>window.removeEventListener("pwaInstallReady",handler);
  },[]);

  const handleInstall=async()=>{
    if(window.deferredInstallPrompt){
      window.deferredInstallPrompt.prompt();
      const{outcome}=await window.deferredInstallPrompt.userChoice;
      if(outcome==="accepted"){ setInstallReady(false); setInstallDismissed(true); }
      window.deferredInstallPrompt=null;
    }
  };

  const handleLiveUpdate=useCallback((matches)=>{
    setLiveResults(matches);
    try{ localStorage.setItem("epl_live_results",JSON.stringify(matches)); }catch(e){}
  },[]);

  // App-wide background sync — keeps Sweepstake + Results in sync
  // regardless of which tab is open. Runs on load and every 90s.
  useEffect(()=>{
    let alive=true;
    const sync=async()=>{
      try{
        const resp=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard");
        if(!resp.ok) return;
        const data=await resp.json();
        const parsed=(data?.events||[]).map(ev=>{
          const comp=ev?.competitions?.[0];
          const home=comp?.competitors?.find(x=>x.homeAway==="home");
          const away=comp?.competitors?.find(x=>x.homeAway==="away");
          const st=comp?.status, state=st?.type?.state;
          return{id:ev.id,home:home?.team?.displayName||"",away:away?.team?.displayName||"",homeScore:home?.score!=null?Number(home.score):null,awayScore:away?.score!=null?Number(away.score):null,minute:st?.displayClock?.replace("'","")||"",status:state==="in"?"LIVE":state==="post"?"FT":"NS",kickoff:ev?.date||""};
        }).filter(m=>m.home&&m.away);
        if(alive&&parsed.length){
          setLiveResults(parsed);
          try{ localStorage.setItem("epl_live_results",JSON.stringify(parsed)); }catch(e){}
        }
      }catch(e){}
    };
    sync();
    const iv=setInterval(sync,90000);
    return()=>{ alive=false; clearInterval(iv); };
  },[]);

  const tabs=[
    {id:"sweep",icon:"🎯",full:"Sweepstake"},
    {id:"live",icon:"🔴",full:"Live Scores"},
    {id:"table",icon:"🏆",full:"Season Table"},
    {id:"rankings",icon:"⚡",full:"Power Rankings"},
    {id:"predict",icon:"🔮",full:"Predict Match"},
    {id:"teams",icon:"🔍",full:"Team Intel"},
    {id:"scorers",icon:"🥅",full:"Top Scorers"},
    {id:"results",icon:"📊",full:"Results Tracker"},
  ];

  const activeLabel=tabs.find(t=>t.id===tab)?.full||"";
  const selectTab=(id)=>{ setTab(id); if(isMobile) setSidebarOpen(false); };

  return(
    <div style={ST.container}>
      <style>{`
        *{box-sizing:border-box;}
        html,body,#root{background:#070e1a;margin:0;padding:0;}
        select option{background:#0c1826;color:#f0f8ff;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#070e1a;}
        ::-webkit-scrollbar-thumb{background:#1a2d42;border-radius:2px;}
      `}</style>

      {installReady&&!installDismissed&&(
        <div style={{background:"#0c1826",borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚽</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:800,color:C.text}}>Install EPL 2026/27</div>
            <div style={{fontSize:10,color:C.muted}}>Add to home screen</div>
          </div>
          <button onClick={handleInstall} style={{background:C.sky,color:"#070e1a",border:"none",borderRadius:7,padding:"7px 14px",fontWeight:800,fontSize:12,cursor:"pointer"}}>Install</button>
          <button onClick={()=>setInstallDismissed(true)} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:"0 4px"}}>X</button>
        </div>
      )}
      {showIOSPrompt&&!installDismissed&&(
        <div style={{background:"#0a1826",borderBottom:`1px solid ${C.border}`,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:800,color:C.text}}>Install EPL 2026/27</div>
            <button onClick={()=>setInstallDismissed(true)} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer"}}>X</button>
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Tap Share then Add to Home Screen to install as an app.</div>
        </div>
      )}

      <div style={ST.topbar}>
        <button style={ST.burger} onClick={()=>setSidebarOpen(o=>!o)}>☰</button>
        <div style={ST.topbarTitle}>
          <span>🩵 EPL 2026/27</span>
          <span style={ST.topbarSub}>{"· "+activeLabel}</span>
        </div>
      </div>

      {tab==="sweep"&&(
        <div style={{background:"linear-gradient(90deg,#050d1a,#0a1530,#050d1a)",borderBottom:`1px solid ${C.border}`,padding:"9px 14px",textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:800,color:C.sky,lineHeight:1.5,letterSpacing:0.2}}>
            Be Competitive · Support Your Club<br/>Outsmart Your Friends
          </div>
        </div>
      )}

      <div style={ST.shell}>
        {isMobile&&sidebarOpen&&<div style={ST.overlay} onClick={()=>setSidebarOpen(false)} />}
        <aside style={ST.sidebar(sidebarOpen,isMobile)}>
          <div style={ST.sideBrand}>
            <div style={ST.sideTitle}>Premier League</div>
            <div style={ST.sideSub}>2026/27 - Predict - Compete - Brag</div>
            <div style={{marginTop:8,fontSize:9,color:C.muted}}>Arsenal (Champions)</div>
            <div style={{fontSize:9,color:C.sky,marginTop:2}}>Coventry - Ipswich - Hull promoted</div>
          </div>
          <nav style={ST.sideNav}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>selectTab(t.id)} style={ST.sideBtn(tab===t.id)}>
                <span style={ST.sideIcon}>{t.icon}</span>
                <span>{t.full}</span>
              </button>
            ))}
          </nav>
          <div style={ST.sideFooter}>
            {"© 2026 EPL Predictor"}<br/>
            {"Not for betting - for fun!"}<br/>
            {BUILD_VERSION}
          </div>
        </aside>

        <main style={ST.content}>
          {tab==="sweep"    && <SweepstakeView liveResults={liveResults} />}
          {tab==="live"     && <LiveScoresView onLiveUpdate={handleLiveUpdate} />}
          {tab==="table"    && <SeasonTableView />}
          {tab==="rankings" && <PowerRankingsView />}
          {tab==="predict"  && <PredictView />}
          {tab==="teams"    && <TeamIntelView />}
          {tab==="scorers"  && <TopScorersView />}
          {tab==="results"  && <ResultsTrackerView liveResults={liveResults} />}
          <div style={{borderTop:`1px solid ${C.border}`,padding:"16px 16px 32px",marginTop:8,background:"#070e1a",textAlign:"center"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.sky,marginBottom:4}}>Not for betting - it is for fun!</div>
            <div style={{fontSize:10,color:C.muted,lineHeight:1.8}}>Predict scores, back your club and outsmart your friends.</div>
            <div style={{fontSize:10,color:C.muted}}>AI predictions for entertainment only.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
