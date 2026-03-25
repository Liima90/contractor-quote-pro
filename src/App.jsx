import { useState, useMemo, useEffect } from "react";

const DEFAULT_PRICING = {
  sanding: { sanding_rate: 2.50, stain_rate: 0.75, extra_coat_rate: 0.50, stairs_rate: 45, board_repair_rate: 25, furniture_moving_fee: 150, travel_fee: 75, minimum_job_fee: 350, deposit_pct: 50, tax_pct: 0 },
  installing: { install_rate: 3.50, removal_rate: 1.25, subfloor_light_rate: 0.75, subfloor_heavy_rate: 1.50, moisture_barrier_rate: 0.45, trim_rate: 2.50, transition_strip_rate: 35, stairs_install_rate: 65, diagonal_multiplier: 1.10, herringbone_multiplier: 1.20, travel_fee: 75, minimum_job_fee: 500, deposit_pct: 50, tax_pct: 0 },
  combo: { install_rate: 3.50, removal_rate: 1.25, subfloor_light_rate: 0.75, subfloor_heavy_rate: 1.50, moisture_barrier_rate: 0.45, trim_rate: 2.50, transition_strip_rate: 35, stairs_install_rate: 65, diagonal_multiplier: 1.10, herringbone_multiplier: 1.20, sanding_rate: 2.50, stain_rate: 0.75, extra_coat_rate: 0.50, stairs_sand_rate: 45, board_repair_rate: 25, furniture_moving_fee: 150, travel_fee: 75, minimum_job_fee: 650, deposit_pct: 50, tax_pct: 0 },
  painting: { wall_rate: 1.50, ceiling_rate: 1.25, trim_rate: 2.00, door_rate: 85, window_rate: 65, primer_rate: 0.45, minor_patch_rate: 35, major_patch_rate: 85, extra_coat_rate: 0.35, travel_fee: 75, minimum_job_fee: 300, deposit_pct: 50, tax_pct: 0 },
};
const SVC_ICONS = { sanding:"🪵", installing:"🔨", combo:"🪵🔨", painting:"🎨" };
const SVC_NAMES = { sanding:"Sanding Floors", installing:"Installing Floors", combo:"Install & Sand", painting:"Painting" };
const SVC_PREFIXES = { sanding:"SND", installing:"INS", combo:"I+S", painting:"PNT" };
const SVC_COLORS = { sanding:"#D97706", installing:"#3B82F6", combo:"#8B5CF6", painting:"#16A34A" };
const STATUS_C = { draft:{bg:"#1a2030",text:"#94A3B8",border:"#334155"}, sent:{bg:"#0c2040",text:"#60A5FA",border:"#2563EB"}, approved:{bg:"#0a2010",text:"#4ADE80",border:"#16A34A"}, rejected:{bg:"#2a0a0a",text:"#F87171",border:"#DC2626"}, completed:{bg:"#1a0a2a",text:"#C084FC",border:"#7C3AED"} };
const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (d,n) => { const dt=new Date(d+"T12:00:00"); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; };
const fmt = n => (parseFloat(n)||0).toFixed(2);
const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";

function Pill({status}) {
  const c = STATUS_C[status]||STATUS_C.draft;
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{status}</span>;
}
function Field({label,error,children}) {
  return <div style={{marginBottom:10}}><label style={{display:"block",fontSize:11,fontWeight:600,color:"#7D8590",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</label>{children}{error&&<div style={{fontSize:11,color:"#F87171",marginTop:2}}>{error}</div>}</div>;
}
function Toggle({label,value,onChange}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #21262D44"}}>
      <span style={{fontSize:14,color:"#E6EDF3"}}>{label}</span>
      <button onClick={()=>onChange(!value)} style={{width:46,height:26,borderRadius:13,background:value?"#F97316":"#30363D",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
        <div style={{position:"absolute",top:3,left:value?22:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
      </button>
    </div>
  );
}

// LocalStorage helpers — safe for environments that block storage
const canUseStorage = (() => { try { const k='__test'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; } catch { return false; } })();
const loadData = (key, fallback) => { if(!canUseStorage) return fallback; try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; } };
const saveData = (key, val) => { if(!canUseStorage) return; try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const loadPricing = () => {
  const saved = loadData("cqp_pricing", null);
  if(!saved) return DEFAULT_PRICING;
  const merged = {};
  for(const svc of Object.keys(DEFAULT_PRICING)){
    merged[svc] = {...DEFAULT_PRICING[svc], ...(saved[svc]||{})};
  }
  return merged;
};

export default function App() {
  const [quotes,setQuotes] = useState(()=>loadData("cqp_quotes",[]));
  const [pricing,setPricing] = useState(()=>loadPricing());
  const [company,setCompany] = useState(()=>loadData("cqp_company",{name:"",phone:"",email:"",address:"",city:"",state:"",zip:"",license:""}));
  const [screen,setScreen] = useState("home");
  const [prevScreen,setPrevScreen] = useState(null);
  const [selId,setSelId] = useState(null);
  const [printQ,setPrintQ] = useState(null);
  const selQuote = quotes.find(q=>q.id===selId);

  // Auto-save to localStorage whenever data changes
  useEffect(()=>saveData("cqp_quotes",quotes),[quotes]);
  useEffect(()=>saveData("cqp_pricing",pricing),[pricing]);
  useEffect(()=>saveData("cqp_company",company),[company]);

  const navigate = (to) => { setPrevScreen(screen); setScreen(to); };
  const goBack = () => {
    if(screen==="detail") { navigate("quotes"); return; }
    if(prevScreen && prevScreen !== screen) { const p=prevScreen; setPrevScreen(null); setScreen(p); return; }
    setScreen("home");
  };

  const saveQuote = q => {
    setQuotes(prev => prev.find(x=>x.id===q.id) ? prev.map(x=>x.id===q.id?q:x) : [q,...prev]);
    setSelId(q.id); navigate("detail");
  };
  const updateStatus = (id,status) => setQuotes(prev=>prev.map(q=>q.id===id?{...q,status}:q));
  const dupQuote = q => {
    const yr=new Date().getFullYear(); const cnt=quotes.filter(x=>x.service===q.service).length+1;
    const nq={...q,id:Date.now().toString(),quoteNumber:`${SVC_PREFIXES[q.service]}-${yr}-${String(cnt).padStart(4,"0")}`,status:"draft",createdAt:new Date().toISOString()};
    setQuotes(prev=>[nq,...prev]); setSelId(nq.id); navigate("detail");
  };
  const deleteQuote = id => setQuotes(prev=>prev.filter(q=>q.id!==id));

  if(printQ) return <PrintView quote={printQ} company={company} onClose={()=>setPrintQ(null)}/>;

  const curNav = ["sanding","installing","combo","painting"].includes(screen)?"home":screen==="detail"?"quotes":screen;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#0D1117",color:"#E6EDF3",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflow:"hidden",maxWidth:430,margin:"0 auto"}}>
      {/* Header */}
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#161B22",borderBottom:"1px solid #21262D",flexShrink:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {screen==="home"
            ? <><span style={{fontSize:22}}>✏️</span><span style={{fontSize:17,fontWeight:800,color:"#fff"}}>ContractorQuote <span style={{color:"#F97316"}}>Pro</span></span></>
            : <button onClick={goBack} style={{background:"none",border:"none",color:"#F97316",fontSize:15,fontWeight:700,cursor:"pointer",padding:0}}>← Back</button>}
        </div>
        <span style={{background:"#F9731622",color:"#F97316",border:"1px solid #F9731655",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>PRO</span>
      </header>

      {/* Main */}
      <main style={{flex:1,overflowY:"auto",overflowX:"hidden",paddingBottom:75}}>
        {screen==="home"      && <HomeScreen setScreen={navigate}/>}
        {screen==="sanding"   && <QuoteForm service="sanding"    pricing={pricing.sanding}    quotes={quotes} onSave={saveQuote} onBack={goBack}/>}
        {screen==="installing"&& <QuoteForm service="installing" pricing={pricing.installing} quotes={quotes} onSave={saveQuote} onBack={goBack}/>}
        {screen==="combo"     && <QuoteForm service="combo"      pricing={pricing.combo}      quotes={quotes} onSave={saveQuote} onBack={goBack}/>}
        {screen==="painting"  && <QuoteForm service="painting"   pricing={pricing.painting}   quotes={quotes} onSave={saveQuote} onBack={goBack}/>}
        {screen==="quotes"    && <DashboardScreen quotes={quotes} onSelect={id=>{setSelId(id);navigate("detail");}} onDup={dupQuote} onStatus={updateStatus} onDelete={deleteQuote}/>}
        {screen==="detail"    && selQuote && <DetailScreen quote={selQuote} onPrint={()=>setPrintQ(selQuote)} onStatus={updateStatus} onDup={dupQuote}/>}
        {screen==="settings"  && <SettingsScreen pricing={pricing} setPricing={setPricing} company={company} setCompany={setCompany}/>}
      </main>

      {/* Bottom Nav */}
      <nav style={{display:"flex",justifyContent:"space-around",padding:"8px 0 16px",background:"#161B22",borderTop:"1px solid #21262D",position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:20}}>
        {[{id:"home",icon:"🏠",label:"Home"},{id:"quotes",icon:"📋",label:"Quotes"},{id:"settings",icon:"⚙️",label:"Settings"}].map(i=>(
          <button key={i.id} onClick={()=>navigate(i.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",padding:"4px 24px",cursor:"pointer"}}>
            <span style={{fontSize:22}}>{i.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:curNav===i.id?"#F97316":"#7D8590",letterSpacing:"0.3px"}}>{i.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function HomeScreen({setScreen}) {
  const svcs = [
    {id:"sanding",   desc:"Sanding, staining, finish coats, repairs & stairs"},
    {id:"installing",desc:"Installation, removal, prep, trim & patterns"},
    {id:"combo",     desc:"Full floor service — install & sand in one quote"},
    {id:"painting",  desc:"Walls, ceilings, trim, doors, windows & prep"},
  ];
  return (
    <div style={{padding:"16px"}}>
      <div style={{textAlign:"center",padding:"20px 0 24px"}}>
        <div style={{fontSize:52,marginBottom:10}}>✏️</div>
        <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:"0 0 6px"}}>ContractorQuote <span style={{color:"#F97316"}}>Pro</span></h1>
        <p style={{fontSize:13,color:"#7D8590",margin:0}}>Create professional job quotes in minutes</p>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:"#7D8590",letterSpacing:"1px",marginBottom:12}}>START A NEW QUOTE</div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:28}}>
        {svcs.map(s=>(
          <button key={s.id} onClick={()=>setScreen(s.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"18px 16px",borderRadius:16,border:`1px solid ${SVC_COLORS[s.id]}44`,background:`${SVC_COLORS[s.id]}0D`,cursor:"pointer",textAlign:"left",width:"100%",transition:"transform 0.1s"}}>
            <div style={{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,background:SVC_COLORS[s.id]+"22",flexShrink:0}}>{SVC_ICONS[s.id]}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:"#E6EDF3",marginBottom:3}}>{SVC_NAMES[s.id]}</div>
              <div style={{fontSize:12,color:"#7D8590",lineHeight:1.4}}>{s.desc}</div>
            </div>
            <span style={{color:SVC_COLORS[s.id],fontSize:20,fontWeight:700}}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuoteForm({service,pricing,quotes,onSave,onBack}) {
  const p=pricing; const ac=SVC_COLORS[service];
  const inp = {width:"100%",padding:"11px 12px",background:"#0D1117",border:"1px solid #30363D",borderRadius:10,color:"#E6EDF3",fontSize:14,outline:"none",boxSizing:"border-box"};
  const card = {background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:14,marginBottom:14};

  const [name,setName]=useState(""); const [phone,setPhone]=useState(""); const [email,setEmail]=useState("");
  const [addr,setAddr]=useState(""); const [city,setCity]=useState(""); const [st,setSt]=useState(""); const [zip,setZip]=useState("");
  const [jobDate,setJobDate]=useState(todayStr()); const [valid,setValid]=useState(addDays(todayStr(),30)); const [notes,setNotes]=useState("");
  const [discount,setDiscount]=useState(""); const [applyTax,setApplyTax]=useState(false); const [travelOvr,setTravelOvr]=useState("");
  const [errs,setErrs]=useState({});
  // sanding
  const [sqft,setSqft]=useState(""); const [stain,setStain]=useState(false); const [xCoats,setXCoats]=useState("0");
  const [stairs,setStairs]=useState("0"); const [repairs,setRepairs]=useState("0"); const [furniture,setFurniture]=useState(false);
  // installing
  const [instSqft,setInstSqft]=useState(""); const [removeFloor,setRemoveFloor]=useState(false); const [remSqft,setRemSqft]=useState("");
  const [subfloor,setSubfloor]=useState("none"); const [moisture,setMoisture]=useState(false);
  const [trimFt,setTrimFt]=useState("0"); const [transStrips,setTransStrips]=useState("0");
  const [pattern,setPattern]=useState("straight"); const [instStairs,setInstStairs]=useState("0");
  const [matIncl,setMatIncl]=useState(false); const [matCost,setMatCost]=useState("");
  // painting
  const [wallSqft,setWallSqft]=useState(""); const [coats,setCoats]=useState("2");
  const [ceilings,setCeilings]=useState(false); const [ceilSqft,setCeilSqft]=useState("");
  const [trimP,setTrimP]=useState(false); const [trimLf,setTrimLf]=useState("0");
  const [doors,setDoors]=useState("0"); const [wins,setWins]=useState("0");
  const [primer,setPrimer]=useState(false); const [pxCoats,setPxCoats]=useState("0");
  const [minPatch,setMinPatch]=useState("0"); const [majPatch,setMajPatch]=useState("0");

  const calc = useMemo(()=>{
    const items=[]; const tv=parseFloat(travelOvr)||p.travel_fee;
    if(service==="sanding"){
      const sf=parseFloat(sqft)||0;
      if(sf>0) items.push({label:"Floor Sanding",qty:sf,unit:"sqft",up:p.sanding_rate,total:sf*p.sanding_rate});
      if(stain&&sf>0) items.push({label:"Stain Application",qty:sf,unit:"sqft",up:p.stain_rate,total:sf*p.stain_rate});
      const ec=parseInt(xCoats)||0;
      if(ec>0&&sf>0) items.push({label:"Extra Finish Coats",qty:sf*ec,unit:"sqft",up:p.extra_coat_rate,total:sf*ec*p.extra_coat_rate});
      const s=parseInt(stairs)||0; if(s>0) items.push({label:"Stair Sanding",qty:s,unit:"stairs",up:p.stairs_rate,total:s*p.stairs_rate});
      const r=parseInt(repairs)||0; if(r>0) items.push({label:"Board Repairs",qty:r,unit:"boards",up:p.board_repair_rate,total:r*p.board_repair_rate});
      if(furniture) items.push({label:"Furniture Moving",qty:1,unit:"flat",up:p.furniture_moving_fee,total:p.furniture_moving_fee});
    }
    if(service==="installing"){
      const sf=parseFloat(instSqft)||0;
      const pm=pattern==="diagonal"?p.diagonal_multiplier:pattern==="herringbone"?p.herringbone_multiplier:1;
      if(sf>0) items.push({label:"Floor Installation",qty:sf,unit:"sqft",up:p.install_rate*pm,total:sf*p.install_rate*pm});
      const rs=parseFloat(remSqft)||sf;
      if(removeFloor&&rs>0) items.push({label:"Floor Removal",qty:rs,unit:"sqft",up:p.removal_rate,total:rs*p.removal_rate});
      if(subfloor==="light"&&sf>0) items.push({label:"Subfloor Prep (Light)",qty:sf,unit:"sqft",up:p.subfloor_light_rate,total:sf*p.subfloor_light_rate});
      if(subfloor==="heavy"&&sf>0) items.push({label:"Subfloor Prep (Heavy)",qty:sf,unit:"sqft",up:p.subfloor_heavy_rate,total:sf*p.subfloor_heavy_rate});
      if(moisture&&sf>0) items.push({label:"Moisture Barrier",qty:sf,unit:"sqft",up:p.moisture_barrier_rate,total:sf*p.moisture_barrier_rate});
      const tl=parseFloat(trimFt)||0; if(tl>0) items.push({label:"Trim / Baseboards",qty:tl,unit:"lin ft",up:p.trim_rate,total:tl*p.trim_rate});
      const ts=parseInt(transStrips)||0; if(ts>0) items.push({label:"Transition Strips",qty:ts,unit:"each",up:p.transition_strip_rate,total:ts*p.transition_strip_rate});
      const is=parseInt(instStairs)||0; if(is>0) items.push({label:"Stair Installation",qty:is,unit:"stairs",up:p.stairs_install_rate,total:is*p.stairs_install_rate});
      const mc=parseFloat(matCost)||0; if(matIncl&&mc>0) items.push({label:"Materials",qty:1,unit:"flat",up:mc,total:mc});
    }
    if(service==="combo"){
      const sf=parseFloat(instSqft)||0;
      const pm=pattern==="diagonal"?p.diagonal_multiplier:pattern==="herringbone"?p.herringbone_multiplier:1;
      // Installing items
      if(sf>0) items.push({label:"Floor Installation",qty:sf,unit:"sqft",up:p.install_rate*pm,total:sf*p.install_rate*pm});
      const rs=parseFloat(remSqft)||sf;
      if(removeFloor&&rs>0) items.push({label:"Floor Removal",qty:rs,unit:"sqft",up:p.removal_rate,total:rs*p.removal_rate});
      if(subfloor==="light"&&sf>0) items.push({label:"Subfloor Prep (Light)",qty:sf,unit:"sqft",up:p.subfloor_light_rate,total:sf*p.subfloor_light_rate});
      if(subfloor==="heavy"&&sf>0) items.push({label:"Subfloor Prep (Heavy)",qty:sf,unit:"sqft",up:p.subfloor_heavy_rate,total:sf*p.subfloor_heavy_rate});
      if(moisture&&sf>0) items.push({label:"Moisture Barrier",qty:sf,unit:"sqft",up:p.moisture_barrier_rate,total:sf*p.moisture_barrier_rate});
      const tl=parseFloat(trimFt)||0; if(tl>0) items.push({label:"Trim / Baseboards",qty:tl,unit:"lin ft",up:p.trim_rate,total:tl*p.trim_rate});
      const ts=parseInt(transStrips)||0; if(ts>0) items.push({label:"Transition Strips",qty:ts,unit:"each",up:p.transition_strip_rate,total:ts*p.transition_strip_rate});
      const is2=parseInt(instStairs)||0; if(is2>0) items.push({label:"Stair Installation",qty:is2,unit:"stairs",up:p.stairs_install_rate,total:is2*p.stairs_install_rate});
      const mc=parseFloat(matCost)||0; if(matIncl&&mc>0) items.push({label:"Materials",qty:1,unit:"flat",up:mc,total:mc});
      // Sanding items
      const sandSf=parseFloat(sqft)||sf;
      if(sandSf>0) items.push({label:"Floor Sanding",qty:sandSf,unit:"sqft",up:p.sanding_rate,total:sandSf*p.sanding_rate});
      if(stain&&sandSf>0) items.push({label:"Stain Application",qty:sandSf,unit:"sqft",up:p.stain_rate,total:sandSf*p.stain_rate});
      const ec=parseInt(xCoats)||0;
      if(ec>0&&sandSf>0) items.push({label:"Extra Finish Coats",qty:sandSf*ec,unit:"sqft",up:p.extra_coat_rate,total:sandSf*ec*p.extra_coat_rate});
      const ss=parseInt(stairs)||0; if(ss>0) items.push({label:"Stair Sanding",qty:ss,unit:"stairs",up:p.stairs_sand_rate,total:ss*p.stairs_sand_rate});
      const r=parseInt(repairs)||0; if(r>0) items.push({label:"Board Repairs",qty:r,unit:"boards",up:p.board_repair_rate,total:r*p.board_repair_rate});
      if(furniture) items.push({label:"Furniture Moving",qty:1,unit:"flat",up:p.furniture_moving_fee,total:p.furniture_moving_fee});
    }
    if(service==="painting"){
      const ws=parseFloat(wallSqft)||0; const nc=parseInt(coats)||2;
      if(ws>0) items.push({label:"Wall Painting",qty:ws*nc,unit:"sqft",up:p.wall_rate,total:ws*nc*p.wall_rate});
      const cs=parseFloat(ceilSqft)||0;
      if(ceilings&&cs>0) items.push({label:"Ceiling Painting",qty:cs,unit:"sqft",up:p.ceiling_rate,total:cs*p.ceiling_rate});
      const tl=parseFloat(trimLf)||0;
      if(trimP&&tl>0) items.push({label:"Trim Painting",qty:tl,unit:"lin ft",up:p.trim_rate,total:tl*p.trim_rate});
      const d=parseInt(doors)||0; if(d>0) items.push({label:"Door Painting",qty:d,unit:"each",up:p.door_rate,total:d*p.door_rate});
      const w=parseInt(wins)||0; if(w>0) items.push({label:"Window Painting",qty:w,unit:"each",up:p.window_rate,total:w*p.window_rate});
      if(primer&&ws>0) items.push({label:"Primer",qty:ws,unit:"sqft",up:p.primer_rate,total:ws*p.primer_rate});
      const ec=parseInt(pxCoats)||0; if(ec>0&&ws>0) items.push({label:"Extra Coats",qty:ws*ec,unit:"sqft",up:p.extra_coat_rate,total:ws*ec*p.extra_coat_rate});
      const mn=parseInt(minPatch)||0; if(mn>0) items.push({label:"Minor Patching",qty:mn,unit:"each",up:p.minor_patch_rate,total:mn*p.minor_patch_rate});
      const mj=parseInt(majPatch)||0; if(mj>0) items.push({label:"Major Patching",qty:mj,unit:"each",up:p.major_patch_rate,total:mj*p.major_patch_rate});
    }
    if(tv>0) items.push({label:"Travel Fee",qty:1,unit:"flat",up:tv,total:tv});
    let sub=items.reduce((s,i)=>s+i.total,0);
    const min=p.minimum_job_fee;
    if(sub>0&&sub<min){items.push({label:"Minimum Job Adjustment",qty:1,unit:"flat",up:min-sub,total:min-sub});sub=min;}
    const da=parseFloat(discount)||0;
    const taxAmt=applyTax?(sub-da)*(p.tax_pct/100):0;
    const total=sub-da+taxAmt;
    return {items,sub,da,taxAmt,total,deposit:total*(p.deposit_pct/100)};
  },[service,p,sqft,stain,xCoats,stairs,repairs,furniture,instSqft,removeFloor,remSqft,subfloor,moisture,trimFt,transStrips,pattern,instStairs,matIncl,matCost,wallSqft,coats,ceilings,ceilSqft,trimP,trimLf,doors,wins,primer,pxCoats,minPatch,majPatch,discount,applyTax,travelOvr]);

  const doSave = () => {
    const e={};
    if(!name.trim())e.name="Required";
    if(!addr.trim())e.addr="Required";
    if(service==="sanding"&&!sqft)e.sqft="Required";
    if(service==="installing"&&!instSqft)e.sqft="Required";
    if(service==="combo"&&!instSqft)e.sqft="Required";
    if(service==="painting"&&!wallSqft)e.sqft="Required";
    setErrs(e); if(Object.keys(e).length) return;
    const yr=new Date().getFullYear(); const cnt=quotes.filter(q=>q.service===service).length+1;
    onSave({id:Date.now().toString(),quoteNumber:`${SVC_PREFIXES[service]}-${yr}-${String(cnt).padStart(4,"0")}`,service,status:"draft",customerName:name,customerPhone:phone,customerEmail:email,jobAddress:addr,city,state:st,zip,jobDate,validUntil:valid,notes,items:calc.items,subtotal:calc.sub,discountAmt:calc.da,taxAmt:calc.taxAmt,total:calc.total,deposit:calc.deposit,createdAt:new Date().toISOString()});
  };

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:ac+"15",border:`1px solid ${ac}33`,borderRadius:12,marginBottom:16}}>
        <span style={{fontSize:24}}>{SVC_ICONS[service]}</span>
        <div><div style={{fontSize:15,fontWeight:700,color:ac}}>New {SVC_NAMES[service]} Quote</div><div style={{fontSize:11,color:"#7D8590"}}>Fill in details to calculate your quote</div></div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:"#7D8590",letterSpacing:"1px",marginBottom:10}}>CUSTOMER & JOB INFO</div>
      <div style={card}>
        <Field label="Full Name *" error={errs.name}><input style={{...inp,...(errs.name?{borderColor:"#F87171"}:{})}} value={name} onChange={e=>setName(e.target.value)} placeholder="John Smith"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Phone"><input style={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(555) 000-0000" type="tel"/></Field>
          <Field label="Email"><input style={inp} value={email} onChange={e=>setEmail(e.target.value)} placeholder="john@email.com"/></Field>
        </div>
        <Field label="Job Address *" error={errs.addr}><input style={{...inp,...(errs.addr?{borderColor:"#F87171"}:{})}} value={addr} onChange={e=>setAddr(e.target.value)} placeholder="123 Main Street"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
          <Field label="City"><input style={inp} value={city} onChange={e=>setCity(e.target.value)} placeholder="Miami"/></Field>
          <Field label="State"><input style={inp} value={st} onChange={e=>setSt(e.target.value)} placeholder="FL"/></Field>
          <Field label="Zip"><input style={inp} value={zip} onChange={e=>setZip(e.target.value)} placeholder="33101"/></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Job Date"><input style={inp} type="date" value={jobDate} onChange={e=>setJobDate(e.target.value)}/></Field>
          <Field label="Valid Until"><input style={inp} type="date" value={valid} onChange={e=>setValid(e.target.value)}/></Field>
        </div>
        <Field label="Notes"><textarea style={{...inp,height:56,resize:"none"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Special instructions..."/></Field>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:ac,letterSpacing:"1px",marginBottom:10}}>{SVC_NAMES[service].toUpperCase()} DETAILS</div>
      <div style={{...card,borderColor:ac+"44"}}>
        {service==="sanding"&&<>
          <Field label="Total Square Feet *" error={errs.sqft}><input style={{...inp,...(errs.sqft?{borderColor:"#F87171"}:{})}} type="number" inputMode="decimal" value={sqft} onChange={e=>setSqft(e.target.value)} placeholder="e.g. 800"/></Field>
          <Toggle label="Include Stain?" value={stain} onChange={setStain}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <Field label="Extra Coats"><input style={inp} type="number" value={xCoats} onChange={e=>setXCoats(e.target.value)} placeholder="0"/></Field>
            <Field label="# Stairs"><input style={inp} type="number" value={stairs} onChange={e=>setStairs(e.target.value)} placeholder="0"/></Field>
          </div>
          <Field label="Board Repairs"><input style={inp} type="number" value={repairs} onChange={e=>setRepairs(e.target.value)} placeholder="0"/></Field>
          <Toggle label="Furniture Moving?" value={furniture} onChange={setFurniture}/>
        </>}
        {service==="installing"&&<>
          <Field label="Total Square Feet *" error={errs.sqft}><input style={{...inp,...(errs.sqft?{borderColor:"#F87171"}:{})}} type="number" inputMode="decimal" value={instSqft} onChange={e=>setInstSqft(e.target.value)} placeholder="e.g. 1200"/></Field>
          <Field label="Pattern Style"><select style={inp} value={pattern} onChange={e=>setPattern(e.target.value)}><option value="straight">Straight (Standard)</option><option value="diagonal">Diagonal (+10%)</option><option value="herringbone">Herringbone (+20%)</option></select></Field>
          <Toggle label="Remove Existing Floor?" value={removeFloor} onChange={setRemoveFloor}/>
          {removeFloor&&<Field label="Removal Sq Ft"><input style={inp} type="number" value={remSqft} onChange={e=>setRemSqft(e.target.value)} placeholder="Same as install"/></Field>}
          <Field label="Subfloor Prep"><select style={inp} value={subfloor} onChange={e=>setSubfloor(e.target.value)}><option value="none">None</option><option value="light">Light</option><option value="heavy">Heavy</option></select></Field>
          <Toggle label="Moisture Barrier?" value={moisture} onChange={setMoisture}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <Field label="Trim Lin. Ft."><input style={inp} type="number" value={trimFt} onChange={e=>setTrimFt(e.target.value)} placeholder="0"/></Field>
            <Field label="Transition Strips"><input style={inp} type="number" value={transStrips} onChange={e=>setTransStrips(e.target.value)} placeholder="0"/></Field>
          </div>
          <Field label="# Stairs"><input style={inp} type="number" value={instStairs} onChange={e=>setInstStairs(e.target.value)} placeholder="0"/></Field>
          <Toggle label="Materials Included?" value={matIncl} onChange={setMatIncl}/>
          {matIncl&&<Field label="Materials Cost ($)"><input style={inp} type="number" value={matCost} onChange={e=>setMatCost(e.target.value)} placeholder="0.00"/></Field>}
        </>}
        {service==="combo"&&<>
          <div style={{fontSize:11,fontWeight:700,color:"#3B82F6",letterSpacing:"0.5px",marginBottom:8}}>🔨 INSTALLATION</div>
          <Field label="Total Square Feet *" error={errs.sqft}><input style={{...inp,...(errs.sqft?{borderColor:"#F87171"}:{})}} type="number" inputMode="decimal" value={instSqft} onChange={e=>setInstSqft(e.target.value)} placeholder="e.g. 1200"/></Field>
          <Field label="Pattern Style"><select style={inp} value={pattern} onChange={e=>setPattern(e.target.value)}><option value="straight">Straight (Standard)</option><option value="diagonal">Diagonal (+10%)</option><option value="herringbone">Herringbone (+20%)</option></select></Field>
          <Toggle label="Remove Existing Floor?" value={removeFloor} onChange={setRemoveFloor}/>
          {removeFloor&&<Field label="Removal Sq Ft"><input style={inp} type="number" value={remSqft} onChange={e=>setRemSqft(e.target.value)} placeholder="Same as install"/></Field>}
          <Field label="Subfloor Prep"><select style={inp} value={subfloor} onChange={e=>setSubfloor(e.target.value)}><option value="none">None</option><option value="light">Light</option><option value="heavy">Heavy</option></select></Field>
          <Toggle label="Moisture Barrier?" value={moisture} onChange={setMoisture}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <Field label="Trim Lin. Ft."><input style={inp} type="number" value={trimFt} onChange={e=>setTrimFt(e.target.value)} placeholder="0"/></Field>
            <Field label="Transition Strips"><input style={inp} type="number" value={transStrips} onChange={e=>setTransStrips(e.target.value)} placeholder="0"/></Field>
          </div>
          <Field label="# Stairs (Install)"><input style={inp} type="number" value={instStairs} onChange={e=>setInstStairs(e.target.value)} placeholder="0"/></Field>
          <Toggle label="Materials Included?" value={matIncl} onChange={setMatIncl}/>
          {matIncl&&<Field label="Materials Cost ($)"><input style={inp} type="number" value={matCost} onChange={e=>setMatCost(e.target.value)} placeholder="0.00"/></Field>}
          <div style={{height:1,background:"#21262D",margin:"16px 0"}}/>
          <div style={{fontSize:11,fontWeight:700,color:"#D97706",letterSpacing:"0.5px",marginBottom:8}}>🪵 SANDING</div>
          <Field label="Sanding Sq Ft"><input style={inp} type="number" inputMode="decimal" value={sqft} onChange={e=>setSqft(e.target.value)} placeholder="Same as install if empty"/></Field>
          <Toggle label="Include Stain?" value={stain} onChange={setStain}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <Field label="Extra Coats"><input style={inp} type="number" value={xCoats} onChange={e=>setXCoats(e.target.value)} placeholder="0"/></Field>
            <Field label="# Stairs (Sand)"><input style={inp} type="number" value={stairs} onChange={e=>setStairs(e.target.value)} placeholder="0"/></Field>
          </div>
          <Field label="Board Repairs"><input style={inp} type="number" value={repairs} onChange={e=>setRepairs(e.target.value)} placeholder="0"/></Field>
          <Toggle label="Furniture Moving?" value={furniture} onChange={setFurniture}/>
        </>}
        {service==="painting"&&<>
          <Field label="Wall Square Feet *" error={errs.sqft}><input style={{...inp,...(errs.sqft?{borderColor:"#F87171"}:{})}} type="number" inputMode="decimal" value={wallSqft} onChange={e=>setWallSqft(e.target.value)} placeholder="e.g. 1500"/></Field>
          <Field label="Number of Coats"><input style={inp} type="number" value={coats} onChange={e=>setCoats(e.target.value)} placeholder="2"/></Field>
          <Toggle label="Include Ceilings?" value={ceilings} onChange={setCeilings}/>
          {ceilings&&<Field label="Ceiling Sq Ft"><input style={inp} type="number" value={ceilSqft} onChange={e=>setCeilSqft(e.target.value)} placeholder="0"/></Field>}
          <Toggle label="Include Trim?" value={trimP} onChange={setTrimP}/>
          {trimP&&<Field label="Trim Linear Feet"><input style={inp} type="number" value={trimLf} onChange={e=>setTrimLf(e.target.value)} placeholder="0"/></Field>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <Field label="# Doors"><input style={inp} type="number" value={doors} onChange={e=>setDoors(e.target.value)} placeholder="0"/></Field>
            <Field label="# Windows"><input style={inp} type="number" value={wins} onChange={e=>setWins(e.target.value)} placeholder="0"/></Field>
          </div>
          <Toggle label="Primer Needed?" value={primer} onChange={setPrimer}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:8}}>
            <Field label="Extra Coats"><input style={inp} type="number" value={pxCoats} onChange={e=>setPxCoats(e.target.value)} placeholder="0"/></Field>
            <Field label="Minor Patches"><input style={inp} type="number" value={minPatch} onChange={e=>setMinPatch(e.target.value)} placeholder="0"/></Field>
          </div>
          <Field label="Major Patches"><input style={inp} type="number" value={majPatch} onChange={e=>setMajPatch(e.target.value)} placeholder="0"/></Field>
        </>}
      </div>

      <div style={{fontSize:11,fontWeight:700,color:"#7D8590",letterSpacing:"1px",marginBottom:10}}>ADJUSTMENTS</div>
      <div style={{...card,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Discount ($)"><input style={inp} type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0.00"/></Field>
          <Field label="Travel Override ($)"><input style={inp} type="number" value={travelOvr} onChange={e=>setTravelOvr(e.target.value)} placeholder={`Default $${p.travel_fee}`}/></Field>
        </div>
        <Toggle label="Apply Tax?" value={applyTax} onChange={setApplyTax}/>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:"#7D8590",letterSpacing:"1px",marginBottom:10}}>LIVE QUOTE SUMMARY</div>
      <div style={{...card,background:"linear-gradient(135deg,#0D1117,#161B22)",borderColor:ac+"44",marginBottom:16}}>
        {calc.items.length===0
          ? <div style={{textAlign:"center",color:"#7D8590",fontSize:13,padding:"20px 0"}}>👆 Fill in the details above to see your quote</div>
          : <>
              {calc.items.map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #21262D33"}}>
                  <span style={{fontSize:13,color:"#E6EDF3"}}>{item.label}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#E6EDF3"}}>${fmt(item.total)}</span>
                </div>
              ))}
              <div style={{height:1,background:"#21262D",margin:"10px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,color:"#7D8590"}}>Subtotal</span><span style={{fontSize:12,color:"#7D8590"}}>${fmt(calc.sub)}</span></div>
              {calc.da>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,color:"#4ADE80"}}>Discount</span><span style={{fontSize:12,color:"#4ADE80"}}>-${fmt(calc.da)}</span></div>}
              {calc.taxAmt>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,color:"#7D8590"}}>Tax</span><span style={{fontSize:12,color:"#7D8590"}}>${fmt(calc.taxAmt)}</span></div>}
              <div style={{height:1,background:"#21262D",margin:"8px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                <span style={{fontSize:16,fontWeight:800,color:"#fff"}}>TOTAL</span>
                <span style={{fontSize:28,fontWeight:800,color:ac}}>${fmt(calc.total)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:ac+"18",border:`1px solid ${ac}33`,borderRadius:10,padding:"10px 14px",marginTop:10}}>
                <span style={{fontSize:12,color:ac,fontWeight:600}}>💰 Suggested Deposit ({p.deposit_pct}%)</span>
                <span style={{fontSize:16,fontWeight:700,color:ac}}>${fmt(calc.deposit)}</span>
              </div>
            </>
        }
      </div>

      <div style={{display:"flex",gap:10,paddingBottom:8}}>
        <button onClick={onBack} style={{flex:1,padding:14,borderRadius:12,background:"#21262D",border:"none",color:"#7D8590",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
        <button onClick={doSave} style={{flex:2,padding:14,borderRadius:12,background:`linear-gradient(135deg,${ac},${ac}bb)`,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 14px ${ac}44`}}>Save Quote →</button>
      </div>
    </div>
  );
}

function DashboardScreen({quotes,onSelect,onDup,onStatus,onDelete}) {
  const [search,setSearch]=useState(""); const [fSvc,setFSvc]=useState("all"); const [fSt,setFSt]=useState("all");
  const [confirmDel,setConfirmDel]=useState(null);
  const filtered=quotes.filter(q=>{
    const s=search.toLowerCase();
    const ms=!s||q.quoteNumber.toLowerCase().includes(s)||q.customerName.toLowerCase().includes(s)||(q.jobAddress||"").toLowerCase().includes(s);
    return ms&&(fSvc==="all"||q.service===fSvc)&&(fSt==="all"||q.status===fSt);
  });
  const cnt={total:quotes.length,draft:quotes.filter(q=>q.status==="draft").length,sent:quotes.filter(q=>q.status==="sent").length,approved:quotes.filter(q=>q.status==="approved").length,completed:quotes.filter(q=>q.status==="completed").length};
  const inp={width:"100%",padding:"11px 12px",background:"#0D1117",border:"1px solid #30363D",borderRadius:10,color:"#E6EDF3",fontSize:14,outline:"none",boxSizing:"border-box"};
  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["Total",cnt.total,"#94A3B8"],["Draft",cnt.draft,"#94A3B8"],["Sent",cnt.sent,"#60A5FA"],["Approved",cnt.approved,"#4ADE80"],["Done",cnt.completed,"#C084FC"]].map(([l,n,c])=>(
          <div key={l} style={{flex:1,background:"#161B22",border:"1px solid #21262D",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:c}}>{n}</div>
            <div style={{fontSize:10,color:"#7D8590",fontWeight:600,marginTop:1}}>{l}</div>
          </div>
        ))}
      </div>
      <input style={{...inp,marginBottom:10}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search quotes, customers..."/>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        {["all","sanding","installing","combo","painting"].map(s=>(
          <button key={s} onClick={()=>setFSvc(s)} style={{padding:"5px 10px",borderRadius:20,background:fSvc===s?`${SVC_COLORS[s]||"#F97316"}22`:"#161B22",border:`1px solid ${fSvc===s?SVC_COLORS[s]||"#F97316":"#21262D"}`,color:fSvc===s?SVC_COLORS[s]||"#F97316":"#7D8590",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            {s==="all"?"All":SVC_NAMES[s]?.split(" ")[0]}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {["all","draft","sent","approved","rejected","completed"].map(s=>(
          <button key={s} onClick={()=>setFSt(s)} style={{padding:"5px 10px",borderRadius:20,background:fSt===s?"#F9731622":"#161B22",border:`1px solid ${fSt===s?"#F97316":"#21262D"}`,color:fSt===s?"#F97316":"#7D8590",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            {s==="all"?"All Status":s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:44,marginBottom:12}}>📋</div><div style={{fontSize:13,color:"#7D8590"}}>{quotes.length===0?"No quotes yet.\nCreate your first one from Home!":"No quotes match your filters."}</div></div>
        : <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.map(q=>(
              <div key={q.id} style={{background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:"14px",transition:"background 0.1s"}}>
                <div onClick={()=>onSelect(q.id)} style={{cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:38,height:38,borderRadius:10,background:SVC_COLORS[q.service]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{SVC_ICONS[q.service]}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#E6EDF3"}}>{q.quoteNumber}</div>
                        <div style={{fontSize:12,color:"#7D8590"}}>{q.customerName}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Pill status={q.status}/>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingLeft:48}}>
                    <span style={{fontSize:11,color:"#7D8590"}}>{q.jobAddress||""}{q.city?`, ${q.city}`:""}</span>
                    <span style={{fontSize:17,fontWeight:800,color:SVC_COLORS[q.service]}}>${fmt(q.total)}</span>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:8,paddingTop:8,borderTop:"1px solid #21262D44"}}>
                  <button onClick={(e)=>{e.stopPropagation();setConfirmDel(q);}} style={{background:"#DC262622",border:"1px solid #DC262644",borderRadius:8,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:"#F87171",fontSize:12,fontWeight:600}}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
      }

      {/* Delete Confirmation Modal */}
      {confirmDel&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={()=>setConfirmDel(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#161B22",border:"1px solid #21262D",borderRadius:16,padding:24,maxWidth:340,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:700,color:"#E6EDF3",marginBottom:6}}>Delete Quote?</div>
            <div style={{fontSize:13,color:"#7D8590",marginBottom:6}}>Are you sure you want to delete</div>
            <div style={{fontSize:15,fontWeight:700,color:"#F87171",marginBottom:4}}>{confirmDel.quoteNumber}</div>
            <div style={{fontSize:13,color:"#7D8590",marginBottom:20}}>{confirmDel.customerName} — ${fmt(confirmDel.total)}</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,padding:12,borderRadius:10,background:"#21262D",border:"none",color:"#7D8590",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{onDelete(confirmDel.id);setConfirmDel(null);}} style={{flex:1,padding:12,borderRadius:10,background:"#DC2626",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailScreen({quote,onPrint,onStatus,onDup}) {
  const [showMenu,setShowMenu]=useState(false);
  const c=SVC_COLORS[quote.service];

  const shareQuote = () => {
    onPrint();
  };
  return (
    <div style={{padding:16}}>
      <div style={{textAlign:"center",padding:"16px 0 20px",borderBottom:"1px solid #21262D",marginBottom:16}}>
        <div style={{width:64,height:64,borderRadius:18,background:c+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 10px"}}>{SVC_ICONS[quote.service]}</div>
        <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:4}}>{quote.quoteNumber}</div>
        <div style={{fontSize:12,color:"#7D8590",marginBottom:10}}>{SVC_NAMES[quote.service]}</div>
        <Pill status={quote.status}/>
      </div>

      <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:"#7D8590",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Customer & Job</div>
        {[["Customer",quote.customerName],["Phone",quote.customerPhone],["Email",quote.customerEmail],["Address",`${quote.jobAddress||""}${quote.city?`, ${quote.city}`:""}${quote.state?`, ${quote.state}`:""}`],["Job Date",fmtDate(quote.jobDate)],["Valid Until",fmtDate(quote.validUntil)],["Notes",quote.notes]].filter(([,v])=>v).map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #21262D33"}}>
            <span style={{fontSize:12,color:"#7D8590",flexShrink:0,marginRight:8}}>{l}</span>
            <span style={{fontSize:13,color:"#E6EDF3",fontWeight:500,textAlign:"right"}}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:"#7D8590",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Line Items</div>
        {quote.items.map((item,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #21262D33"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,color:"#E6EDF3"}}>{item.label}</div>
              <div style={{fontSize:11,color:"#7D8590"}}>{fmt(item.qty)} {item.unit} × ${fmt(item.up)}</div>
            </div>
            <span style={{fontSize:13,fontWeight:600,color:"#E6EDF3",marginLeft:8}}>${fmt(item.total)}</span>
          </div>
        ))}
        <div style={{height:1,background:"#21262D",margin:"10px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,color:"#7D8590"}}>Subtotal</span><span style={{fontSize:12,color:"#7D8590"}}>${fmt(quote.subtotal)}</span></div>
        {quote.discountAmt>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,color:"#4ADE80"}}>Discount</span><span style={{fontSize:12,color:"#4ADE80"}}>-${fmt(quote.discountAmt)}</span></div>}
        {quote.taxAmt>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,color:"#7D8590"}}>Tax</span><span style={{fontSize:12,color:"#7D8590"}}>${fmt(quote.taxAmt)}</span></div>}
        <div style={{height:1,background:"#21262D",margin:"8px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:16,fontWeight:800,color:"#fff"}}>TOTAL</span>
          <span style={{fontSize:26,fontWeight:800,color:c}}>${fmt(quote.total)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:c+"18",border:`1px solid ${c}33`,borderRadius:10,padding:"10px 14px",marginTop:10}}>
          <span style={{fontSize:12,color:c,fontWeight:600}}>💰 Suggested Deposit</span>
          <span style={{fontSize:15,fontWeight:700,color:c}}>${fmt(quote.deposit)}</span>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <button onClick={onPrint} style={{flex:1,padding:12,borderRadius:12,background:"#21262D",border:"none",color:"#E6EDF3",fontSize:13,fontWeight:600,cursor:"pointer"}}>🖨️ Print</button>
        <button onClick={()=>onDup(quote)} style={{flex:1,padding:12,borderRadius:12,background:"#21262D",border:"none",color:"#E6EDF3",fontSize:13,fontWeight:600,cursor:"pointer"}}>📋 Duplicate</button>
        <button onClick={()=>setShowMenu(!showMenu)} style={{flex:1,padding:12,borderRadius:12,background:c+"22",border:`1px solid ${c}55`,color:c,fontSize:13,fontWeight:600,cursor:"pointer"}}>🔄 Status</button>
      </div>

      <button onClick={shareQuote} style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#F97316,#F97316bb)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px #F9731644",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>📤</span> Share Quote with Customer
      </button>

      {showMenu&&(
        <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:8,marginBottom:12}}>
          {["draft","sent","approved","rejected","completed"].map(s=>(
            <button key={s} onClick={()=>{onStatus(quote.id,s);setShowMenu(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",background:quote.status===s?"#21262D":"none",border:"none",color:"#E6EDF3",fontSize:14,fontWeight:600,cursor:"pointer",borderRadius:10}}>
              <span style={{color:STATUS_C[s]?.text,fontSize:16}}>●</span>
              {s.charAt(0).toUpperCase()+s.slice(1)}
              {quote.status===s&&<span style={{marginLeft:"auto",color:c,fontSize:12}}>current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PrintView({quote,company,onClose}) {
  const c=SVC_COLORS[quote.service];
  const hasCompany = company && company.name.trim();
  const companyAddr = company ? `${company.address||""}${company.city?", "+company.city:""}${company.state?", "+company.state:""}${company.zip?" "+company.zip:""}`.trim() : "";
  return (
    <div style={{background:"#fff",height:"100vh",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:20,color:"#111",fontFamily:"Arial,sans-serif"}}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <button className="no-print" onClick={onClose} style={{background:"#F97316",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,cursor:"pointer",marginBottom:16,fontWeight:700,fontSize:13}}>✕ Close Preview</button>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:`3px solid ${c}`,paddingBottom:12,marginBottom:16}}>
          <div>
            <div style={{fontSize:18,fontWeight:800}}>{hasCompany ? company.name : "✏️ ContractorQuote Pro"}</div>
            {hasCompany ? <>
              {company.phone&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{company.phone}</div>}
              {company.email&&<div style={{fontSize:11,color:"#666"}}>{company.email}</div>}
              {companyAddr&&<div style={{fontSize:11,color:"#666"}}>{companyAddr}</div>}
              {company.license&&<div style={{fontSize:11,color:"#666"}}>Lic# {company.license}</div>}
            </> : <div style={{fontSize:11,color:"#666"}}>Professional Job Quotes</div>}
          </div>
          <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:c}}>#{quote.quoteNumber}</div><div style={{fontSize:11,color:"#666"}}>{SVC_NAMES[quote.service]}</div></div>
        </div>
        <div style={{display:"flex",gap:20,marginBottom:16,fontSize:12}}>
          <span><strong>Date:</strong> {fmtDate(quote.jobDate)}</span>
          <span><strong>Valid Until:</strong> {fmtDate(quote.validUntil)}</span>
        </div>
        <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,padding:14,marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#6B7280",marginBottom:6}}>Bill To</div>
          <div style={{fontSize:15,fontWeight:700}}>{quote.customerName}</div>
          {quote.customerPhone&&<div style={{fontSize:12,color:"#374151",marginTop:2}}>{quote.customerPhone}</div>}
          {quote.customerEmail&&<div style={{fontSize:12,color:"#374151"}}>{quote.customerEmail}</div>}
          {quote.jobAddress&&<div style={{fontSize:12,color:"#374151",marginTop:4}}>{quote.jobAddress}{quote.city?`, ${quote.city}`:""}{quote.state?`, ${quote.state}`:""}</div>}
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:16}}>
          <thead>
            <tr style={{background:c,color:"#fff"}}>
              <th style={{padding:"8px 10px",textAlign:"left"}}>Description</th>
              <th style={{padding:"8px 10px",textAlign:"center"}}>Qty / Unit</th>
              <th style={{padding:"8px 10px",textAlign:"right"}}>Unit Price</th>
              <th style={{padding:"8px 10px",textAlign:"right"}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item,i)=>(
              <tr key={i} style={{background:i%2===0?"#fff":"#F9FAFB",borderBottom:"1px solid #E5E7EB"}}>
                <td style={{padding:"8px 10px"}}>{item.label}</td>
                <td style={{padding:"8px 10px",textAlign:"center"}}>{fmt(item.qty)} {item.unit}</td>
                <td style={{padding:"8px 10px",textAlign:"right"}}>${fmt(item.up)}</td>
                <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600}}>${fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginLeft:"auto",maxWidth:240,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:"#6B7280"}}><span>Subtotal</span><span>${fmt(quote.subtotal)}</span></div>
          {quote.discountAmt>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:"#16A34A"}}><span>Discount</span><span>-${fmt(quote.discountAmt)}</span></div>}
          {quote.taxAmt>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13}}><span>Tax</span><span>${fmt(quote.taxAmt)}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:17,fontWeight:800,borderTop:`2px solid ${c}`,marginTop:6,color:c}}><span>TOTAL</span><span>${fmt(quote.total)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#C2410C",fontWeight:600}}><span>Deposit Required</span><span>${fmt(quote.deposit)}</span></div>
        </div>
        {quote.notes&&<div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,padding:12,marginBottom:16,fontSize:12}}><strong>Notes:</strong> {quote.notes}</div>}
        <div style={{display:"flex",gap:24,borderTop:"1px solid #E5E7EB",paddingTop:20,marginBottom:8}}>
          <div style={{flex:1}}><div style={{borderBottom:"1px solid #111",paddingBottom:36,marginBottom:6,fontSize:11,color:"#6B7280"}}>Customer Signature</div><div style={{fontSize:11,color:"#6B7280"}}>Date: _______________</div></div>
          <div style={{flex:1}}><div style={{borderBottom:"1px solid #111",paddingBottom:36,marginBottom:6,fontSize:11,color:"#6B7280"}}>Contractor Signature</div><div style={{fontSize:11,color:"#6B7280"}}>Date: _______________</div></div>
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"#9CA3AF",marginTop:12}}>{hasCompany ? `Thank you for choosing ${company.name}!` : "Thank you for your business!"} Quote valid until {fmtDate(quote.validUntil)}.</div>
      </div>
      <div className="no-print" style={{maxWidth:600,margin:"20px auto 0",display:"flex",flexDirection:"column",gap:10,paddingBottom:20}}>
        <button onClick={()=>window.print()} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#F97316,#F97316bb)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px #F9731644"}}>📤 Share / Save as PDF</button>
      </div>
    </div>
  );
}

function SettingsScreen({pricing,setPricing,company,setCompany}) {
  const [local,setLocal]=useState(pricing); const [tab,setTab]=useState("sanding"); const [saved,setSaved]=useState(false);
  const [localCo,setLocalCo]=useState(company); const [coSaved,setCoSaved]=useState(false);
  const upd=(svc,key,val)=>setLocal(p=>({...p,[svc]:{...p[svc],[key]:parseFloat(val)||0}}));
  const updCo=(key,val)=>setLocalCo(p=>({...p,[key]:val}));
  const doSave=()=>{setPricing(local);setSaved(true);setTimeout(()=>setSaved(false),2500);};
  const doSaveCo=()=>{setCompany(localCo);setCoSaved(true);setTimeout(()=>setCoSaved(false),2500);};
  const inp={width:"80px",padding:"8px 10px",background:"#0D1117",border:"1px solid #30363D",borderRadius:8,color:"#E6EDF3",fontSize:13,outline:"none",textAlign:"right"};
  const inpFull={width:"100%",padding:"11px 12px",background:"#0D1117",border:"1px solid #30363D",borderRadius:10,color:"#E6EDF3",fontSize:14,outline:"none",boxSizing:"border-box"};
  const FIELDS={
    sanding:[["sanding_rate","Sanding Rate","$/sqft"],["stain_rate","Stain Rate","$/sqft"],["extra_coat_rate","Extra Coat","$/sqft"],["stairs_rate","Stairs","$/stair"],["board_repair_rate","Board Repair","$/board"],["furniture_moving_fee","Furniture Moving","$ flat"],["travel_fee","Travel Fee","$ flat"],["minimum_job_fee","Minimum Job","$"],["deposit_pct","Deposit","%"],["tax_pct","Tax","%"]],
    installing:[["install_rate","Install Rate","$/sqft"],["removal_rate","Removal","$/sqft"],["subfloor_light_rate","Subfloor Light","$/sqft"],["subfloor_heavy_rate","Subfloor Heavy","$/sqft"],["moisture_barrier_rate","Moisture Barrier","$/sqft"],["trim_rate","Trim","$/lin ft"],["transition_strip_rate","Transition Strip","$/each"],["stairs_install_rate","Stair Install","$/stair"],["diagonal_multiplier","Diagonal Mult","×"],["herringbone_multiplier","Herringbone Mult","×"],["travel_fee","Travel Fee","$ flat"],["minimum_job_fee","Minimum Job","$"],["deposit_pct","Deposit","%"],["tax_pct","Tax","%"]],
    combo:[["install_rate","Install Rate","$/sqft"],["sanding_rate","Sanding Rate","$/sqft"],["removal_rate","Removal","$/sqft"],["stain_rate","Stain Rate","$/sqft"],["extra_coat_rate","Extra Coat","$/sqft"],["subfloor_light_rate","Subfloor Light","$/sqft"],["subfloor_heavy_rate","Subfloor Heavy","$/sqft"],["moisture_barrier_rate","Moisture Barrier","$/sqft"],["trim_rate","Trim","$/lin ft"],["transition_strip_rate","Transition Strip","$/each"],["stairs_install_rate","Stair Install","$/stair"],["stairs_sand_rate","Stair Sand","$/stair"],["diagonal_multiplier","Diagonal Mult","×"],["herringbone_multiplier","Herringbone Mult","×"],["board_repair_rate","Board Repair","$/board"],["furniture_moving_fee","Furniture Moving","$ flat"],["travel_fee","Travel Fee","$ flat"],["minimum_job_fee","Minimum Job","$"],["deposit_pct","Deposit","%"],["tax_pct","Tax","%"]],
    painting:[["wall_rate","Wall Rate","$/sqft"],["ceiling_rate","Ceiling","$/sqft"],["trim_rate","Trim","$/lin ft"],["door_rate","Door","$/door"],["window_rate","Window","$/window"],["primer_rate","Primer","$/sqft"],["minor_patch_rate","Minor Patch","$/patch"],["major_patch_rate","Major Patch","$/patch"],["extra_coat_rate","Extra Coat","$/sqft"],["travel_fee","Travel Fee","$ flat"],["minimum_job_fee","Minimum Job","$"],["deposit_pct","Deposit","%"],["tax_pct","Tax","%"]],
  };
  return (
    <div style={{padding:16}}>
      {/* Company Profile Section */}
      <div style={{fontSize:11,fontWeight:700,color:"#F97316",letterSpacing:"1px",marginBottom:10}}>🏢 MY COMPANY</div>
      <p style={{fontSize:12,color:"#7D8590",marginTop:0,marginBottom:10}}>Your company info will appear on printed quotes instead of "ContractorQuote Pro".</p>
      <div style={{background:"#161B22",border:"1px solid #F9731644",borderRadius:14,padding:14,marginBottom:10}}>
        <Field label="Company Name"><input style={inpFull} value={localCo.name} onChange={e=>updCo("name",e.target.value)} placeholder="e.g. Lima's Flooring LLC"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Phone"><input style={inpFull} value={localCo.phone} onChange={e=>updCo("phone",e.target.value)} placeholder="(555) 000-0000"/></Field>
          <Field label="Email"><input style={inpFull} value={localCo.email} onChange={e=>updCo("email",e.target.value)} placeholder="info@company.com"/></Field>
        </div>
        <Field label="Address"><input style={inpFull} value={localCo.address} onChange={e=>updCo("address",e.target.value)} placeholder="123 Business St"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8}}>
          <Field label="City"><input style={inpFull} value={localCo.city} onChange={e=>updCo("city",e.target.value)} placeholder="Charlotte"/></Field>
          <Field label="State"><input style={inpFull} value={localCo.state} onChange={e=>updCo("state",e.target.value)} placeholder="NC"/></Field>
          <Field label="Zip"><input style={inpFull} value={localCo.zip} onChange={e=>updCo("zip",e.target.value)} placeholder="28105"/></Field>
        </div>
        <Field label="License #"><input style={inpFull} value={localCo.license} onChange={e=>updCo("license",e.target.value)} placeholder="Optional"/></Field>
      </div>
      {coSaved&&<div style={{background:"#0a2010",border:"1px solid #16A34A",color:"#4ADE80",padding:"10px 14px",borderRadius:10,textAlign:"center",fontWeight:600,marginBottom:10}}>✓ Company profile saved!</div>}
      <button onClick={doSaveCo} style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#F97316,#F97316bb)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px #F9731644",marginBottom:24}}>
        Save Company Profile
      </button>

      {/* Pricing Section */}
      <div style={{fontSize:11,fontWeight:700,color:"#7D8590",letterSpacing:"1px",marginBottom:10}}>💲 PRICING RATES</div>
      <p style={{fontSize:12,color:"#7D8590",marginTop:0,marginBottom:10}}>Edit your default pricing rates for new quotes.</p>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {["sanding","installing","combo","painting"].map(s=>(
          <button key={s} onClick={()=>setTab(s)} style={{flex:"1 1 auto",padding:10,borderRadius:10,background:tab===s?SVC_COLORS[s]+"22":"#161B22",border:`1px solid ${tab===s?SVC_COLORS[s]:"#21262D"}`,color:tab===s?SVC_COLORS[s]:"#7D8590",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            {SVC_ICONS[s]} {SVC_NAMES[s].split(" ")[0]}
          </button>
        ))}
      </div>
      <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:14,padding:14,marginBottom:14}}>
        {FIELDS[tab].map(([key,label,unit])=>(
          <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid #21262D44"}}>
            <div style={{fontSize:13,color:"#E6EDF3"}}>{label} <span style={{fontSize:11,color:"#7D8590"}}>{unit}</span></div>
            <input style={inp} type="number" inputMode="decimal" value={local[tab][key]} onChange={e=>upd(tab,key,e.target.value)}/>
          </div>
        ))}
      </div>
      {saved&&<div style={{background:"#0a2010",border:"1px solid #16A34A",color:"#4ADE80",padding:"10px 14px",borderRadius:10,textAlign:"center",fontWeight:600,marginBottom:12}}>✓ Pricing saved successfully!</div>}
      <button onClick={doSave} style={{width:"100%",padding:13,borderRadius:12,background:`linear-gradient(135deg,${SVC_COLORS[tab]},${SVC_COLORS[tab]}cc)`,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 14px ${SVC_COLORS[tab]}44`}}>
        Save {SVC_NAMES[tab]} Pricing
      </button>
    </div>
  );
}
