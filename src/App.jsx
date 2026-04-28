import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  CUTWISE — Calculadora Profesional de Carpintería
//  Creada por Vinicio Meléndez
// ─────────────────────────────────────────────────────────────

// ── CONVERSIÓN ───────────────────────────────────────────────
const TO_MM = { mm:1, cm:10, m:1000, in:25.4, ft:304.8, yd:914.4 };
const UNITS  = ["mm","cm","m","in","ft","yd"];
const UL = { mm:"Milímetros",cm:"Centímetros",m:"Metros",in:"Pulgadas",ft:"Pies",yd:"Yardas" };
const US = { mm:"mm",cm:"cm",m:"m",in:'"',ft:"ft",yd:"yd" };

function cvt(v,f,t){ const n=parseFloat(v); if(isNaN(n)||f===t) return isNaN(n)?0:n; return(n*TO_MM[f])/TO_MM[t]; }
function fmt(n,d=6){ if(typeof n!=="number"||isNaN(n)) return ""; return String(parseFloat(n.toFixed(d))); }
function gcd(a,b){ return b===0?a:gcd(b,a%b); }
function toFrac(dec,den=16){
  const a=Math.abs(dec),w=Math.floor(a),n=Math.round((a-w)*den);
  if(n===0) return `${w}"`;
  if(n===den) return `${w+1}"`;
  const g=gcd(n,den);
  return w>0?`${w} ${n/g}/${den/g}"` : `${n/g}/${den/g}"`;
}
function bfCalc(L,W,T,qty,u){ return(cvt(L,u,"in")*cvt(W,u,"in")*cvt(T,u,"in")*(qty||1))/144; }
function parseFrac(s){ const p=String(s).trim().split("/"); return p.length===2?(parseFloat(p[0])||0)/(parseFloat(p[1])||1):parseFloat(p[0])||0; }

// ── STORAGE ──────────────────────────────────────────────────
function useLS(key, init){
  const [val, setVal] = useState(() => {
    try { const s=localStorage.getItem(key); return s?JSON.parse(s):init; } catch{ return init; }
  });
  useEffect(() => { try{ localStorage.setItem(key,JSON.stringify(val)); }catch{} }, [key,val]);
  return [val,setVal];
}

// ── DATOS FIJOS ──────────────────────────────────────────────
const NOMINAL = [
  ["1×2","¾ × 1½\"","19×38"],["1×3","¾ × 2½\"","19×64"],["1×4","¾ × 3½\"","19×89"],
  ["1×6","¾ × 5½\"","19×140"],["1×8","¾ × 7¼\"","19×184"],["1×10","¾ × 9¼\"","19×235"],
  ["1×12","¾ × 11¼\"","19×286"],["2×4","1½ × 3½\"","38×89"],["2×6","1½ × 5½\"","38×140"],
  ["2×8","1½ × 7¼\"","38×184"],["2×10","1½ × 9¼\"","38×235"],["2×12","1½ × 11¼\"","38×286"],
  ["4×4","3½ × 3½\"","89×89"],["4×6","3½ × 5½\"","89×140"],["6×6","5½ × 5½\"","140×140"],
];

const WOOD_LIB = [
  {name:"Pino",          cat:"Blanda",  thick:0.75,cu:"pie²",color:"#C8A866",desc:"Abundante y económica. Ideal para pintar y estructuras."},
  {name:"Cedro Rojo",    cat:"Blanda",  thick:1.0, cu:"pie²",color:"#B87840",desc:"Resistente a insectos y humedad. Perfecta para closets."},
  {name:"Pino Amarillo", cat:"Blanda",  thick:1.5, cu:"pie²",color:"#D4A030",desc:"Muy resistente. Pisos, estructuras y decks."},
  {name:"Roble Blanco",  cat:"Dura",    thick:1.0, cu:"pie²",color:"#8B6340",desc:"Bella veta. Pisos de alta gama y muebles."},
  {name:"Roble Rojo",    cat:"Dura",    thick:1.0, cu:"pie²",color:"#A07050",desc:"El hardwood más vendido. Gabinetes y escaleras."},
  {name:"Nogal",         cat:"Dura",    thick:1.0, cu:"pie²",color:"#5C3317",desc:"Madera de lujo. Muebles finos y decoración."},
  {name:"Maple Duro",    cat:"Dura",    thick:1.0, cu:"pie²",color:"#E8C870",desc:"Extremadamente duro. Tablas de cortar y pisos."},
  {name:"Cerezo",        cat:"Dura",    thick:1.0, cu:"pie²",color:"#8B3010",desc:"Oscurece con el tiempo. Gabinetes premium."},
  {name:"Fresno",        cat:"Dura",    thick:1.0, cu:"pie²",color:"#C8B890",desc:"Flexible. Mangos de herramientas y bates."},
  {name:"Caoba",         cat:"Dura",    thick:1.0, cu:"pie²",color:"#9C3A12",desc:"Muy estable. Muebles finos e instrumentos."},
  {name:"Teca",          cat:"Dura",    thick:1.0, cu:"pie²",color:"#B8860B",desc:"La reina del exterior. Yates y decks."},
  {name:"Álamo",         cat:"Dura",    thick:1.0, cu:"pie²",color:"#9BB87A",desc:"Económico. Cajones e interiores pintados."},
  {name:"MDF Estándar",  cat:"Laminado",thick:0.75,cu:"m²",  color:"#C4A882",desc:"Lisa y perfecta para pintar o rutear CNC."},
  {name:"MDF Hidrofugado",cat:"Laminado",thick:0.75,cu:"m²", color:"#A08862",desc:"Resistente a humedad. Baños y cocinas."},
  {name:"Triplay Birch", cat:"Laminado",thick:0.75,cu:"m²",  color:"#D4B896",desc:"Sin vacíos. El mejor para CNC y muebles."},
  {name:"Melanina",      cat:"Laminado",thick:0.75,cu:"m²",  color:"#D8D0C0",desc:"Con acabado laminado. Cocinas y oficina."},
  {name:"OSB",           cat:"Laminado",thick:0.5, cu:"m²",  color:"#C8A870",desc:"Estructural y económico. Paredes y pisos."},
];

const NAILS = [
  ["2d","1\"","25mm"],["3d","1¼\"","32mm"],["4d","1½\"","38mm"],["6d","2\"","51mm"],
  ["8d","2½\"","64mm"],["10d","3\"","76mm"],["16d","3½\"","89mm"],["20d","4\"","102mm"],
];
const SCREWS = [
  ["#6","3.5mm","7/64\"","Uso general, MDF"],
  ["#8","4.2mm","9/64\"","El más común — estructuras"],
  ["#10","4.8mm","5/32\"","Juntas resistentes"],
  ["#12","5.5mm","3/16\"","Madera dura, vigas"],
];

const INIT_CATALOG = [
  {id:1,name:"Pino #2 1×4",    cat:"Blanda",  thick:0.75,cost:2.50, cu:"pie²",stock:40,su:"pie²", proveedor:"Maderas García",   tel:"555-100-2030",email:"ventas@maderasgarcia.com",nota:"10% dto en +100 pie²"},
  {id:2,name:"Cedro Aromático",cat:"Blanda",  thick:1.0, cost:4.80, cu:"pie²",stock:20,su:"pie²", proveedor:"Maderería Hdz",    tel:"555-200-4050",email:"",nota:""},
  {id:3,name:"Roble Blanco 4/4",cat:"Dura",   thick:1.0, cost:9.50, cu:"pie²",stock:15,su:"pie²", proveedor:"Premium Woods MX", tel:"555-300-6070",email:"info@premiumwoods.mx",nota:"Mínimo 20 pie²"},
  {id:4,name:"MDF ¾\"",        cat:"Laminado",thick:0.75,cost:18.50,cu:"m²",  stock:8, su:"hojas",proveedor:"Maderas García",   tel:"555-100-2030",email:"ventas@maderasgarcia.com",nota:""},
  {id:5,name:"Triplay Birch ¾\"",cat:"Laminado",thick:0.75,cost:42.00,cu:"m²",stock:5,su:"hojas",proveedor:"Premium Woods MX", tel:"555-300-6070",email:"info@premiumwoods.mx",nota:"Pedir 2 semanas antes"},
];
const INIT_PROJECTS = [
  {id:1,name:"Mesa de Centro",client:"Uso personal",status:"En progreso",cuts:[
    {id:1,label:"Tablero superior",mat:"Roble Blanco 4/4",L:48,W:24,T:1.0,qty:1,cpt:9.50},
    {id:2,label:"Patas",           mat:"Roble Blanco 4/4",L:18,W:2.5,T:2.5,qty:4,cpt:9.50},
    {id:3,label:"Travesaños",      mat:"Pino #2 1×4",     L:42,W:3.5,T:0.75,qty:2,cpt:2.50},
  ]},
];

const CAT_COLOR={Blanda:"#3A8C4A",Dura:"#B85C20",Laminado:"#1A6BB0",Otro:"#7B52AB"};
const STA_COLOR={"Pendiente":"#8E8E93","En progreso":"#D4900A","Completado":"#34C759","En pausa":"#007AFF"};
const COST_U=["pie²","m²","pie·tabla","hoja","ml","kg","unidad"];
const STOCK_U=["pie²","m²","hojas","unidades","kg","pie·tabla"];

// ── COLORES ──────────────────────────────────────────────────
const C={
  amber:"#D4900A", amberBg:"#FFF8ED", amberBd:"#F5D080",
  green:"#28A745", blue:"#007AFF",    red:"#D32F2F",
  white:"#FFFFFF", bg:"#F5F0EB",      card:"#FFFFFF",
  field:"#F2EDE6", ink1:"#1C1C1E",    ink2:"#48484A",
  ink3:"#8A8A8E",  ink4:"#C7C7CC",    border:"#E8E0D5",
};

// ── CSS GLOBAL ───────────────────────────────────────────────
const G=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};-webkit-font-smoothing:antialiased;}
  input,select,textarea,button{font-family:inherit;}
  input[type=number]::-webkit-inner-spin-button{opacity:.4;}
  input:focus,select:focus,textarea:focus{
    outline:none;border-color:${C.amber}!important;
    box-shadow:0 0 0 3px rgba(212,144,10,.15);
  }
  ::-webkit-scrollbar{display:none;}
  @keyframes up{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .up{animation:up .22s ease both;}
  button:active{opacity:.78;transform:scale(.98);transition:all .1s;}
  textarea{resize:vertical;}
`;

// ═══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [tab,      setTab]      = useState("calc");
  const [catalog,  setCatalog]  = useLS("cw_catalog",  INIT_CATALOG);
  const [projects, setProjects] = useLS("cw_projects", INIT_PROJECTS);

  const TABS=[
    {id:"calc",     icon:"⇄",  label:"Calcular"},
    {id:"boardfoot",icon:"📐", label:"Madera"},
    {id:"projects", icon:"📋", label:"Proyectos"},
    {id:"catalog",  icon:"🪵", label:"Mis Maderas"},
    {id:"ref",      icon:"📖", label:"Guía"},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif",color:C.ink1,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{G}</style>

      {/* CABECERA */}
      <div style={{background:C.white,padding:"14px 20px 12px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 10px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.amber},#A06808)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:`0 3px 10px ${C.amber}55`}}>🪵</div>
            <div>
              <div style={{fontSize:21,fontWeight:900,letterSpacing:-.6,lineHeight:1}}>Cut<span style={{color:C.amber}}>Wise</span></div>
              <div style={{fontSize:11,color:C.ink3,marginTop:1}}>Calculadora de carpintería</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.amber}}>{catalog.length} maderas</div>
            <div style={{fontSize:11,color:C.ink3}}>{projects.length} proyectos</div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{flex:1,padding:"20px 16px 104px",overflowY:"auto"}} key={tab} className="up">
        {tab==="calc"      && <CalcTab />}
        {tab==="boardfoot" && <BoardTab catalog={catalog} />}
        {tab==="projects"  && <ProjectsTab projects={projects} setProjects={setProjects} catalog={catalog} />}
        {tab==="catalog"   && <CatalogTab catalog={catalog} setCatalog={setCatalog} />}
        {tab==="ref"       && <RefTab />}
      </div>

      {/* NAV INFERIOR */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:30,paddingBottom:"env(safe-area-inset-bottom,8px)",boxShadow:"0 -3px 20px rgba(0,0,0,0.08)"}}>
        {TABS.map(t=>{
          const on=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 2px 6px",background:"transparent",border:"none",gap:3}}>
              <span style={{fontSize:22,lineHeight:1,opacity:on?1:.45}}>{t.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:on?C.amber:C.ink3,letterSpacing:.1}}>{t.label}</span>
              {on&&<div style={{width:22,height:3,borderRadius:2,background:C.amber,marginTop:1}}/>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CALCULAR — Conversor + Fracciones + Diseño
// ═══════════════════════════════════════════════════════════
function CalcTab(){
  const [mode,setMode]=useState("units");
  return(
    <div>
      <div style={{display:"flex",background:C.white,borderRadius:14,padding:4,marginBottom:20,boxShadow:"0 1px 5px rgba(0,0,0,0.07)"}}>
        {[["units","Unidades"],["frac","Fracciones"],["tools","Diseño"]].map(([k,l])=>(
          <button key={k} onClick={()=>setMode(k)} style={{flex:1,padding:"10px 4px",borderRadius:11,border:"none",fontSize:14,fontWeight:600,background:mode===k?C.amber:"transparent",color:mode===k?C.white:C.ink3,transition:"all .2s"}}>{l}</button>
        ))}
      </div>
      {mode==="units" && <UnitConverter />}
      {mode==="frac"  && <FracConverter />}
      {mode==="tools" && <DesignTools />}
    </div>
  );
}

function UnitConverter(){
  const [val,setVal]=useState("");
  const [from,setFrom]=useState("in");
  const [to,setTo]=useState("mm");
  const num=parseFloat(val);
  const res=!isNaN(num)&&val!==""?cvt(num,from,to):null;
  function swap(){ setFrom(to);setTo(from);if(res!==null)setVal(fmt(res)); }

  return(
    <div>
      <div style={K.card}>
        <FL>Valor a convertir</FL>
        <input type="number" inputMode="decimal" value={val} onChange={e=>setVal(e.target.value)} placeholder="0"
          style={{width:"100%",fontSize:38,fontWeight:900,letterSpacing:-1.5,padding:"14px 16px",borderRadius:14,border:`2px solid ${C.border}`,background:C.field,color:C.ink1,textAlign:"center"}}/>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",marginTop:14}}>
          <div style={{flex:1}}><FL>De</FL><select value={from} onChange={e=>setFrom(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{UL[u]} ({US[u]})</option>)}</select></div>
          <button onClick={swap} style={{width:50,height:50,borderRadius:14,background:C.amber,border:"none",fontSize:22,color:C.white,fontWeight:700,flexShrink:0,boxShadow:`0 4px 14px ${C.amber}55`,cursor:"pointer"}}>⇄</button>
          <div style={{flex:1}}><FL>A</FL><select value={to} onChange={e=>setTo(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{UL[u]} ({US[u]})</option>)}</select></div>
        </div>
      </div>

      {/* RESULTADO */}
      <div style={{background:res!==null?`linear-gradient(135deg,${C.amber},#A06808)`:C.white,borderRadius:22,padding:"26px 24px",textAlign:"center",marginBottom:20,boxShadow:res!==null?`0 8px 28px ${C.amber}44`:"0 1px 6px rgba(0,0,0,0.06)",border:res!==null?"none":`1px solid ${C.border}`,minHeight:130,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {res!==null?(
          <>
            <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.7)",marginBottom:6}}>{val} {US[from]} =</div>
            <div style={{fontSize:54,fontWeight:900,color:C.white,letterSpacing:-2,lineHeight:1}}>{fmt(res,5)}</div>
            <div style={{fontSize:20,fontWeight:600,color:"rgba(255,255,255,.8)",marginTop:5}}>{UL[to]}</div>
            {to==="in"&&<div style={{fontSize:14,color:"rgba(255,255,255,.75)",marginTop:8}}>≈ {toFrac(res,16)} · {toFrac(res,32)}</div>}
            {from==="in"&&to==="mm"&&<div style={{fontSize:13,color:"rgba(255,255,255,.65)",marginTop:4}}>{fmt(res/25.4,6)}" decimal</div>}
          </>
        ):(
          <div style={{fontSize:16,color:C.ink4,fontWeight:500}}>Escribe un número para convertir</div>
        )}
      </div>

      {/* Atajos */}
      <STitle>Conversiones frecuentes</STitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
        {[["1 pie","ft","cm","30.48 cm"],["1 pulg","in","mm","25.4 mm"],["1 metro","m","ft","3.28 ft"],["1 metro","m","in","39.37\""],["1 cm","cm","in","0.394\""],["1 yarda","yd","m","0.914 m"]].map(([l,f,t,h])=>(
          <button key={l+t} onClick={()=>{setVal("1");setFrom(f);setTo(t);}} style={{padding:"12px 14px",background:C.white,borderRadius:12,border:`1px solid ${C.border}`,textAlign:"left",cursor:"pointer"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.amber}}>{l} {US[f]}</div>
            <div style={{fontSize:12,color:C.ink3,marginTop:2,fontFamily:"monospace"}}>{h}</div>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <STitle>Tabla de equivalencias</STitle>
      <div style={K.card}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr><th style={K.th}></th>{["mm","cm","m","in","ft"].map(u=><th key={u} style={K.th}>{u}</th>)}</tr></thead>
            <tbody>{["mm","cm","m","in","ft"].map(f=>(
              <tr key={f}>
                <td style={{...K.td,fontWeight:700,color:C.ink2,background:"#FAFAF8"}}>{f}</td>
                {["mm","cm","m","in","ft"].map(t=>(
                  <td key={t} style={{...K.td,...(f===t?{color:C.amber,fontWeight:700}:{})}} onClick={()=>{setVal("1");setFrom(f);setTo(t);}}>
                    {f===t?"1":fmt(cvt(1,f,t),4)}
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <Hint>Toca cualquier celda para cargarla en el convertidor</Hint>
      </div>
    </div>
  );
}

function FracConverter(){
  const [dec,setDec]=useState("0.625");
  const [den,setDen]=useState(16);
  const [w,setW]=useState(0);
  const [n,setN]=useState(5);
  const [d,setD]=useState(8);
  const [fa,setFa]=useState("3/4");
  const [fb,setFb]=useState("1/8");
  const decV=parseFloat(dec)||0;
  const fracV=w+n/(d||1);
  const sumV=parseFrac(fa)+parseFrac(fb);

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div style={K.card}>
          <CL>Decimal → Fracción</CL>
          <FL>Pulgadas decimales</FL>
          <input type="number" inputMode="decimal" value={dec} onChange={e=>setDec(e.target.value)} step=".001" style={{...K.inp,marginBottom:12}}/>
          <FL>Precisión</FL>
          <select value={den} onChange={e=>setDen(+e.target.value)} style={K.sel}>{[2,4,8,16,32,64].map(d2=><option key={d2} value={d2}>1/{d2}"</option>)}</select>
          <MR top={toFrac(decV,den)} bot={`${(decV*25.4).toFixed(3)} mm`}/>
        </div>
        <div style={K.card}>
          <CL>Fracción → Decimal</CL>
          <FL>Entero</FL>
          <input type="number" inputMode="numeric" value={w} onChange={e=>setW(+e.target.value||0)} min={0} style={{...K.inp,marginBottom:12}}/>
          <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
            <div style={{flex:1}}><FL>Num</FL><input type="number" inputMode="numeric" value={n} onChange={e=>setN(+e.target.value||0)} style={K.inp}/></div>
            <span style={{fontSize:28,color:C.amber,paddingBottom:10,lineHeight:1}}>/</span>
            <div style={{flex:1}}><FL>Den</FL><input type="number" inputMode="numeric" value={d} onChange={e=>setD(+e.target.value||1)} style={K.inp}/></div>
          </div>
          <MR top={`${fracV.toFixed(5)}"`} bot={`${(fracV*25.4).toFixed(3)} mm`}/>
        </div>
      </div>

      <div style={K.card}>
        <CL>Sumar fracciones</CL>
        <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
          <div style={{flex:1}}><FL>Primera (ej: 3/4)</FL><input value={fa} onChange={e=>setFa(e.target.value)} placeholder="3/4" style={K.inp}/></div>
          <span style={{fontSize:24,color:C.amber,paddingBottom:10,fontWeight:700}}>+</span>
          <div style={{flex:1}}><FL>Segunda (ej: 1/8)</FL><input value={fb} onChange={e=>setFb(e.target.value)} placeholder="1/8" style={K.inp}/></div>
        </div>
        <MR top={toFrac(sumV,16)} bot={`${sumV.toFixed(5)}" · ${(sumV*25.4).toFixed(2)} mm`}/>
      </div>

      <STitle>Tabla completa 1/64"</STitle>
      <div style={K.card}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
          {Array.from({length:64},(_,i)=>i+1).map(num=>{
            const v=num/64,g=gcd(num,64),common=num%2===0;
            return(
              <div key={num} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:7,background:num===32?`${C.amber}18`:common?`${C.amber}08`:"transparent",borderLeft:`3px solid ${num===32?C.amber:common?C.amber+"44":"transparent"}`}}>
                <span style={{fontFamily:"monospace",fontSize:12,fontWeight:common?700:400,color:C.amber,minWidth:44}}>{num===64?`1"`:num/g==="1"&&64/g==="1"?`1"`:num/g+"/"+64/g+'"'}</span>
                <span style={{fontFamily:"monospace",fontSize:10,color:C.ink3}}>{v.toFixed(4)}"</span>
                <span style={{fontFamily:"monospace",fontSize:10,color:C.blue}}>{(v*25.4).toFixed(2)}mm</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DesignTools(){
  const [tool,setTool]=useState("spacing");
  const [tl,setTl]=useState(48),[ni,setNi]=useState(4),[iw,setIw]=useState(1.5),[us,setUs]=useState("in");
  const totalIn=cvt(tl,us,"in"),iwIn=cvt(iw,us,"in");
  const gap=ni>0?(totalIn-ni*iwIn)/(ni+1):0;
  const positions=Array.from({length:ni},(_,i)=>gap+i*(gap+iwIn));
  const PHI=1.61803398875;
  const [gv,setGv]=useState(24),[gu,setGu]=useState("in");
  const gIn=cvt(+gv,gu,"in");
  const [a,setA]=useState(3),[b,setB]=useState(4);
  const hyp=Math.sqrt(a*a+b*b),ang=Math.atan(b/a)*180/Math.PI;

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[["spacing","Espaciado"],["golden","Razón áurea"],["tri","Triángulo"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTool(k)} style={{padding:"9px 18px",borderRadius:20,border:`1.5px solid ${tool===k?C.amber:C.border}`,background:tool===k?`${C.amber}18`:"transparent",color:tool===k?C.amber:C.ink3,fontWeight:600,fontSize:14,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {tool==="spacing"&&(
        <div style={K.card}>
          <CL>Espaciado uniforme</CL>
          <p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>Para estantes, balusters, tornillos — distribución equidistante automática.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><FL>Largo total</FL><input type="number" inputMode="decimal" value={tl} onChange={e=>setTl(+e.target.value)} style={K.inp}/></div>
            <div><FL>Unidad</FL><select value={us} onChange={e=>setUs(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{US[u]}</option>)}</select></div>
            <div><FL>Cantidad de elementos</FL><input type="number" inputMode="numeric" value={ni} onChange={e=>setNi(Math.max(1,+e.target.value))} min={1} style={K.inp}/></div>
            <div><FL>Ancho de cada uno</FL><input type="number" inputMode="decimal" value={iw} onChange={e=>setIw(+e.target.value)} step=".125" style={K.inp}/></div>
          </div>
          {gap>0?(
            <>
              <MR top={`${fmt(cvt(gap,"in",us),4)} ${US[us]}`} bot={`${toFrac(gap,16)} — ${ni+1} espacios iguales`}/>
              <FL style={{marginTop:16}}>Centro de cada elemento desde el inicio</FL>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
                {positions.map((p,i)=>(
                  <div key={i} style={{background:C.field,borderRadius:10,padding:"8px 12px",textAlign:"center",minWidth:72}}>
                    <div style={{fontSize:11,color:C.ink3}}>#{i+1}</div>
                    <div style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:"monospace"}}>{toFrac(p,16)}</div>
                    <div style={{fontSize:11,color:C.ink3}}>{fmt(cvt(p,"in",us),3)} {US[us]}</div>
                  </div>
                ))}
              </div>
            </>
          ):<p style={{color:C.red,fontSize:14,marginTop:12}}>⚠️ Los elementos son más anchos que el espacio disponible.</p>}
        </div>
      )}

      {tool==="golden"&&(
        <div style={K.card}>
          <CL>Razón áurea φ = 1.618</CL>
          <p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>La proporción más armoniosa. Úsala para dimensionar muebles, marcos y puertas.</p>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
            <div><FL>Dimensión base</FL><input type="number" inputMode="decimal" value={gv} onChange={e=>setGv(e.target.value)} style={K.inp}/></div>
            <div><FL>Unidad</FL><select value={gu} onChange={e=>setGu(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{US[u]}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Lado corto (÷φ)</div>
              <div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(cvt(gIn/PHI,"in",gu),3)} {US[gu]}</div>
            </div>
            <div style={{flex:1,background:`${C.amber}15`,borderRadius:12,padding:"14px",textAlign:"center",border:`2px solid ${C.amber}`}}>
              <div style={{fontSize:12,color:C.amber,fontWeight:700}}>Base</div>
              <div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(+gv,3)} {US[gu]}</div>
            </div>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Lado largo (×φ)</div>
              <div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>{fmt(cvt(gIn*PHI,"in",gu),3)} {US[gu]}</div>
            </div>
          </div>
          <Hint>Usado en muebles Shaker, arquitectura clásica y diseño moderno.</Hint>
        </div>
      )}

      {tool==="tri"&&(
        <div style={K.card}>
          <CL>Triángulo rectángulo</CL>
          <p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>Regla 3-4-5: si A=3, B=4 → C=5 = ángulo perfecto de 90°. Ideal para cuadrar marcos y esquinas.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><FL>Lado A (pulgadas)</FL><input type="number" inputMode="decimal" value={a} onChange={e=>setA(+e.target.value)} style={K.inp}/></div>
            <div><FL>Lado B (pulgadas)</FL><input type="number" inputMode="decimal" value={b} onChange={e=>setB(+e.target.value)} style={K.inp}/></div>
          </div>
          <div style={{display:"flex",gap:12,marginTop:16}}>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Hipotenusa C</div>
              <div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(hyp,4)}"</div>
              <div style={{fontSize:12,color:C.ink3,marginTop:2}}>{toFrac(hyp,16)}</div>
            </div>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Ángulo A</div>
              <div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>{fmt(ang,2)}°</div>
              <div style={{fontSize:12,color:C.ink3,marginTop:2}}>Ángulo B: {fmt(90-ang,2)}°</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MADERA — PIE DE TABLA
// ═══════════════════════════════════════════════════════════
function BoardTab({catalog}){
  const [rows,setRows]=useState([
    {id:1,mat:"Roble Blanco 4/4",L:72,W:8,T:1.0,qty:2,cpt:9.50},
    {id:2,mat:"Pino #2 1×4",L:96,W:3.5,T:0.75,qty:4,cpt:2.50},
  ]);
  const [unit,setUnit]=useState("in");
  function addRow(){ setRows(r=>[...r,{id:Date.now(),mat:"",L:0,W:0,T:1,qty:1,cpt:0}]); }
  function delRow(id){ setRows(r=>r.filter(x=>x.id!==id)); }
  function upd(id,k,v){ setRows(r=>r.map(x=>x.id===id?{...x,[k]:+v||0}:x)); }
  function pickMat(id,name){ const m=catalog.find(c=>c.name===name); setRows(r=>r.map(x=>x.id===id?{...x,mat:name,T:m?m.thick:x.T,cpt:m?m.cost:x.cpt}:x)); }
  const totBF=rows.reduce((s,r)=>s+bfCalc(r.L,r.W,r.T,r.qty,unit),0);
  const totCost=rows.reduce((s,r)=>s+bfCalc(r.L,r.W,r.T,r.qty,unit)*r.cpt,0);

  return(
    <div>
      <PT>Pie de tabla</PT>
      <FL>Unidad de medida</FL>
      <select value={unit} onChange={e=>setUnit(e.target.value)} style={{...K.sel,marginBottom:16}}>{UNITS.map(u=><option key={u} value={u}>{UL[u]} ({US[u]})</option>)}</select>

      {/* Totales */}
      <div style={{background:`linear-gradient(135deg,${C.amber},#A06808)`,borderRadius:20,padding:"20px",marginBottom:20,boxShadow:`0 6px 22px ${C.amber}44`}}>
        <div style={{display:"flex",justifyContent:"space-around"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)",fontWeight:600,letterSpacing:.5}}>PIES DE TABLA</div>
            <div style={{fontSize:40,fontWeight:900,color:C.white,letterSpacing:-1.5,lineHeight:1.1}}>{totBF.toFixed(2)}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.65)"}}>pie·tabla</div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,.2)",alignSelf:"stretch"}}/>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)",fontWeight:600,letterSpacing:.5}}>COSTO TOTAL</div>
            <div style={{fontSize:40,fontWeight:900,color:C.white,letterSpacing:-1.5,lineHeight:1.1}}>${totCost.toFixed(2)}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.65)"}}>USD</div>
          </div>
        </div>
      </div>

      {/* Filas */}
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
        {rows.map((row,i)=>{
          const bfv=bfCalc(row.L,row.W,row.T,row.qty,unit);
          return(
            <div key={row.id} style={{background:C.card,borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",padding:"10px 14px",background:C.field,gap:10,borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:700,color:C.amber,minWidth:24}}>#{i+1}</span>
                <select value={row.mat} onChange={e=>pickMat(row.id,e.target.value)} style={{flex:1,background:"transparent",border:"none",fontSize:15,fontWeight:600,color:C.ink1,cursor:"pointer"}}>
                  <option value="">— Seleccionar madera —</option>
                  {catalog.map(m=><option key={m.id}>{m.name}</option>)}
                  <option value="Otro">Otro / Personalizado</option>
                </select>
                <button onClick={()=>delRow(row.id)} style={{background:`${C.red}15`,border:"none",color:C.red,borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"12px 14px 14px"}}>
                {[["Largo",row.L,"L"],["Ancho",row.W,"W"],["Grosor",row.T,"T"]].map(([l,v,k])=>(
                  <div key={k}><FL>{l} ({US[unit]})</FL><input type="number" inputMode="decimal" value={v||""} onChange={e=>upd(row.id,k,e.target.value)} style={{...K.inp,textAlign:"center",padding:"10px 8px"}}/></div>
                ))}
                <div><FL>Cantidad</FL><input type="number" inputMode="numeric" value={row.qty||""} min={1} onChange={e=>upd(row.id,"qty",e.target.value)} style={{...K.inp,textAlign:"center",padding:"10px 8px"}}/></div>
                <div><FL>$/pie·tabla</FL><input type="number" inputMode="decimal" value={row.cpt||""} step=".01" onChange={e=>upd(row.id,"cpt",e.target.value)} style={{...K.inp,textAlign:"center",padding:"10px 8px"}}/></div>
                <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                  <div style={{background:`${C.amber}15`,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:C.ink3,fontWeight:600}}>pie·tabla</div>
                    <div style={{fontSize:18,fontWeight:800,color:C.amber}}>{bfv.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <BtnG full onClick={addRow}>+ Agregar madera</BtnG>

      {/* Nominal vs Real */}
      <STitle style={{marginTop:28}}>⚠️ Nominal vs. Real del lumber</STitle>
      <div style={K.card}>
        <p style={{fontSize:14,color:C.ink3,marginBottom:14,lineHeight:1.5}}>Un <strong style={{color:C.ink1}}>2×4 no mide 2"×4"</strong>. El nombre es comercial — la medida real es diferente.</p>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr><th style={K.th}>Nombre</th><th style={K.th}>Medida real</th><th style={K.th}>En mm</th></tr></thead>
            <tbody>{NOMINAL.map(([n,r,mm])=>(
              <tr key={n}>
                <td style={{...K.td,fontWeight:700,color:C.amber}}>{n}</td>
                <td style={{...K.td,color:C.ink2}}>{r}</td>
                <td style={{...K.td,color:C.blue,fontFamily:"monospace"}}>{mm} mm</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PROYECTOS
// ═══════════════════════════════════════════════════════════
function ProjectsTab({projects,setProjects,catalog}){
  const [view,setView]=useState("list");
  const [aid,setAid]=useState(null);
  const [nf,setNf]=useState({name:"",client:"",status:"Pendiente"});
  const active=projects.find(p=>p.id===aid);
  function create(){ if(!nf.name.trim()) return; const p={id:Date.now(),cuts:[],...nf}; setProjects(ps=>[...ps,p]); setAid(p.id); setView("detail"); }
  function addCut(cut){ setProjects(ps=>ps.map(p=>p.id===aid?{...p,cuts:[...p.cuts,{...cut,id:Date.now()}]}:p)); }
  function delCut(cid){ setProjects(ps=>ps.map(p=>p.id===aid?{...p,cuts:p.cuts.filter(c=>c.id!==cid)}:p)); }
  function delProj(id){ setProjects(ps=>ps.filter(p=>p.id!==id)); }
  function total(p){ return p.cuts.reduce((s,c)=>s+bfCalc(c.L,c.W,c.T,c.qty,"in")*c.cpt,0); }

  if(view==="detail"&&active) return <ProjDetail project={active} catalog={catalog} onBack={()=>setView("list")} onAdd={addCut} onDel={delCut} total={total(active)}/>;

  return(
    <div>
      <PT>Proyectos</PT>
      {view==="new"?(
        <div style={{...K.card,marginBottom:20}}>
          <CL>Nuevo proyecto</CL>
          <FL>Nombre del proyecto</FL>
          <input value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})} placeholder="Ej: Mesa de comedor" style={{...K.inp,marginBottom:14}}/>
          <FL>Cliente (opcional)</FL>
          <input value={nf.client} onChange={e=>setNf({...nf,client:e.target.value})} placeholder="Nombre del cliente" style={{...K.inp,marginBottom:14}}/>
          <FL>Estado</FL>
          <select value={nf.status} onChange={e=>setNf({...nf,status:e.target.value})} style={{...K.sel,marginBottom:18}}>{["Pendiente","En progreso","Completado","En pausa"].map(s=><option key={s}>{s}</option>)}</select>
          <div style={{display:"flex",gap:10}}><BtnG onClick={()=>setView("list")}>Cancelar</BtnG><BtnP onClick={create} style={{flex:2}}>Crear proyecto</BtnP></div>
        </div>
      ):<BtnP full onClick={()=>setView("new")} style={{marginBottom:20}}>+ Nuevo proyecto</BtnP>}

      {projects.length===0&&<ES icon="📋" text="Sin proyectos" sub="Crea uno para controlar tus cortes y costos"/>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {projects.map(p=>(
          <div key={p.id} style={{background:C.card,borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 1px 5px rgba(0,0,0,0.05)",display:"flex",cursor:"pointer"}} onClick={()=>{setAid(p.id);setView("detail");}}>
            <div style={{width:5,background:STA_COLOR[p.status]||C.ink3,flexShrink:0}}/>
            <div style={{flex:1,padding:"16px 16px"}}>
              <div style={{fontSize:17,fontWeight:700,color:C.ink1,marginBottom:4}}>{p.name}</div>
              {p.client&&<div style={{fontSize:14,color:C.ink3,marginBottom:6}}>👤 {p.client}</div>}
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:10,background:`${STA_COLOR[p.status]||C.ink3}20`,color:STA_COLOR[p.status]||C.ink3}}>{p.status}</span>
                <span style={{fontSize:14,color:C.ink3}}>{p.cuts.length} piezas</span>
                <span style={{fontSize:15,fontWeight:800,color:C.amber}}>${total(p).toFixed(2)}</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,paddingRight:12}}>
              <span style={{color:C.ink4,fontSize:22}}>›</span>
              <button onClick={e=>{e.stopPropagation();delProj(p.id);}} style={{background:`${C.red}12`,border:"none",borderRadius:8,color:C.red,padding:"6px 10px",fontSize:16,cursor:"pointer"}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjDetail({project,catalog,onBack,onAdd,onDel,total}){
  const E={label:"",mat:"",L:0,W:0,T:1,qty:1,cpt:0};
  const [f,setF]=useState(E);
  function pickMat(name){ const m=catalog.find(c=>c.name===name); setF(x=>({...x,mat:name,T:m?m.thick:x.T,cpt:m?m.cost:x.cpt})); }
  function add(){ if(!f.mat||!f.L||!f.W) return; onAdd({...f}); setF(E); }
  const totBF=project.cuts.reduce((s,c)=>s+bfCalc(c.L,c.W,c.T,c.qty,"in"),0);
  return(
    <div>
      <BackBtn onClick={onBack}>Proyectos</BackBtn>
      <PT>{project.name}</PT>
      {project.client&&<p style={{fontSize:14,color:C.ink3,marginBottom:16}}>👤 {project.client}</p>}
      {project.cuts.length>0&&(
        <div style={{background:`linear-gradient(135deg,${C.amber},#A06808)`,borderRadius:18,padding:"16px 20px",marginBottom:20,boxShadow:`0 6px 20px ${C.amber}44`,display:"flex",justifyContent:"space-around"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:600}}>PIE·TABLA</div><div style={{fontSize:30,fontWeight:900,color:C.white,letterSpacing:-1}}>{totBF.toFixed(2)}</div></div>
          <div style={{width:1,background:"rgba(255,255,255,.2)"}}/>
          <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:600}}>COSTO</div><div style={{fontSize:30,fontWeight:900,color:C.white,letterSpacing:-1}}>${total.toFixed(2)}</div></div>
        </div>
      )}
      <div style={K.card}>
        <CL>Agregar pieza (pulgadas)</CL>
        <FL>Nombre de la pieza</FL>
        <input value={f.label} onChange={e=>setF({...f,label:e.target.value})} placeholder="Ej: Tablero superior" style={{...K.inp,marginBottom:12}}/>
        <FL>Material</FL>
        <select value={f.mat} onChange={e=>pickMat(e.target.value)} style={{...K.sel,marginBottom:12}}>
          <option value="">— Seleccionar —</option>
          {catalog.map(m=><option key={m.id}>{m.name}</option>)}
          <option value="Otro">Otro</option>
        </select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[["Largo\"",f.L,"L"],["Ancho\"",f.W,"W"],["Grosor\"",f.T,"T"],["Cantidad",f.qty,"qty"]].map(([l,v,k])=>(
            <div key={k}><FL>{l}</FL><input type="number" inputMode="decimal" value={v||""} step={k==="T"?.25:1} min={1} onChange={e=>setF({...f,[k]:+e.target.value})} style={K.inp}/></div>
          ))}
        </div>
        <FL>$ por pie de tabla</FL>
        <input type="number" inputMode="decimal" value={f.cpt||""} step=".01" onChange={e=>setF({...f,cpt:+e.target.value})} style={{...K.inp,marginBottom:14}}/>
        <BtnP full onClick={add}>+ Agregar al proyecto</BtnP>
      </div>
      {project.cuts.map(c=>{
        const bfv=bfCalc(c.L,c.W,c.T,c.qty,"in");
        return(
          <div key={c.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:C.ink1}}>{c.label||c.mat}</div>
              <div style={{fontSize:13,color:C.ink3,marginTop:2}}>{c.mat} · {c.L}"×{c.W}"×{c.T}" · {c.qty} pza</div>
              <div style={{display:"flex",gap:14,marginTop:5}}>
                <span style={{fontSize:14,fontWeight:700,color:C.amber}}>{bfv.toFixed(3)} pt</span>
                <span style={{fontSize:14,fontWeight:700,color:C.green}}>${(bfv*c.cpt).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={()=>onDel(c.id)} style={{background:`${C.red}12`,border:"none",color:C.red,borderRadius:8,padding:"6px 10px",fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MIS MADERAS — CATÁLOGO
// ═══════════════════════════════════════════════════════════
const EMAT={name:"",cat:"Blanda",thick:"",desc:"",cost:"",cu:"pie²",stock:"",su:"pie²",proveedor:"",tel:"",email:"",nota:""};

function CatalogTab({catalog,setCatalog}){
  const [view,setView]=useState("list");
  const [f,setF]=useState(EMAT);
  const [eid,setEid]=useState(null);
  const [filt,setFilt]=useState("Todos");
  const [expId,setExpId]=useState(null);
  const [libQ,setLibQ]=useState("");

  function openNew(){ setF(EMAT);setEid(null);setView("form"); }
  function openEdit(m){ setEid(m.id);setF({...m,cost:String(m.cost),thick:String(m.thick),stock:String(m.stock)});setView("form"); }
  function openSup(m){ setEid(m.id);setF({...m});setView("supplier"); }
  function fromLib(sp){ setF({...EMAT,name:sp.name,cat:sp.cat,thick:String(sp.thick),cu:sp.cu,desc:sp.desc});setEid(null);setView("form"); }
  function back(){ setEid(null);setView("list"); }
  function save(){ if(!f.name.trim()) return; const e={...f,cost:+f.cost||0,thick:+f.thick||0,stock:+f.stock||0}; if(eid!==null) setCatalog(c=>c.map(m=>m.id===eid?{...e,id:eid}:m)); else setCatalog(c=>[...c,{...e,id:Date.now()}]); back(); }
  function saveSup(){ setCatalog(c=>c.map(m=>m.id===eid?{...m,proveedor:f.proveedor,tel:f.tel,email:f.email,nota:f.nota}:m)); back(); }
  function del(id){ if(!window.confirm("¿Eliminar esta madera?")) return; setCatalog(c=>c.filter(m=>m.id!==id)); if(expId===id) setExpId(null); }

  const shown=filt==="Todos"?catalog:catalog.filter(m=>m.cat===filt);
  const libF=WOOD_LIB.filter(s=>s.name.toLowerCase().includes(libQ.toLowerCase())||s.cat.toLowerCase().includes(libQ.toLowerCase()));

  // ── Biblioteca ─────────────────────────────────────────
  if(view==="library") return(
    <div>
      <BackBtn onClick={back}>Mi catálogo</BackBtn>
      <PT>Biblioteca de maderas</PT>
      <input value={libQ} onChange={e=>setLibQ(e.target.value)} placeholder="🔍  Buscar especie..." style={{...K.inp,marginBottom:16,fontSize:16}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {libF.map(sp=>{
          const already=catalog.some(m=>m.name===sp.name);
          return(
            <div key={sp.name} style={{background:C.card,borderRadius:14,display:"flex",overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{width:5,background:sp.color,flexShrink:0}}/>
              <div style={{flex:1,padding:"14px"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:16,fontWeight:700,color:C.ink1}}>{sp.name}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:`${CAT_COLOR[sp.cat]}22`,color:CAT_COLOR[sp.cat],fontWeight:700}}>{sp.cat}</span>
                  {already&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:`${C.amber}20`,color:C.amber,fontWeight:700}}>Ya en tu lista</span>}
                </div>
                <p style={{fontSize:13,color:C.ink3,lineHeight:1.5}}>{sp.desc}</p>
                <p style={{fontSize:12,color:C.ink4,marginTop:4}}>Grosor típico: {sp.thick}" · Precio por {sp.cu}</p>
              </div>
              <div style={{padding:"0 14px",display:"flex",alignItems:"center"}}>
                <button onClick={()=>fromLib(sp)} style={{...K.btnP,fontSize:14}}>Usar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Proveedor ──────────────────────────────────────────
  if(view==="supplier"){
    const mat=catalog.find(m=>m.id===eid);
    return(
      <div>
        <BackBtn onClick={back}>Volver</BackBtn>
        <PT>Proveedor</PT>
        <p style={{fontSize:15,color:C.ink2,marginBottom:20,fontWeight:600}}>{mat?.name}</p>
        <div style={K.card}>
          <FL>Nombre del proveedor / maderería</FL>
          <input value={f.proveedor||""} onChange={e=>setF({...f,proveedor:e.target.value})} placeholder="Maderas García, Home Depot..." style={{...K.inp,marginBottom:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><FL>Teléfono / WhatsApp</FL><input value={f.tel||""} onChange={e=>setF({...f,tel:e.target.value})} type="tel" placeholder="555-000-0000" style={K.inp}/></div>
            <div><FL>Correo electrónico</FL><input value={f.email||""} onChange={e=>setF({...f,email:e.target.value})} type="email" placeholder="ventas@..." style={K.inp}/></div>
          </div>
          <FL>Notas (descuentos, pedido mínimo, horario...)</FL>
          <textarea value={f.nota||""} onChange={e=>setF({...f,nota:e.target.value})} placeholder="Ej: 10% dto en +50 pie². Solo efectivo." style={{...K.inp,minHeight:80,lineHeight:1.5}}/>
          <div style={{display:"flex",gap:10,marginTop:16}}><BtnG onClick={back}>Cancelar</BtnG><BtnP onClick={saveSup} style={{flex:2}}>Guardar proveedor</BtnP></div>
        </div>
      </div>
    );
  }

  // ── Formulario madera ──────────────────────────────────
  if(view==="form") return(
    <div>
      <BackBtn onClick={back}>Mi catálogo</BackBtn>
      <PT>{eid!==null?"Editar madera":"Nueva madera"}</PT>
      <div style={K.card}>
        <CL>Especie y tipo</CL>
        <FL>Nombre</FL>
        <input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ej: Roble Blanco 4/4 Select" style={{...K.inp,marginBottom:14}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><FL>Categoría</FL><select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})} style={K.sel}>{["Blanda","Dura","Laminado","Otro"].map(c=><option key={c}>{c}</option>)}</select></div>
          <div><FL>Grosor (pulgadas)</FL><input type="number" inputMode="decimal" value={f.thick} step=".25" placeholder="0.75" onChange={e=>setF({...f,thick:e.target.value})} style={K.inp}/></div>
        </div>
        <FL style={{marginTop:12}}>Descripción</FL>
        <input value={f.desc||""} onChange={e=>setF({...f,desc:e.target.value})} placeholder="Grado, acabado, características..." style={K.inp}/>
      </div>
      <div style={K.card}>
        <CL>Precio</CL>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <div><FL>Costo ($)</FL><input type="number" inputMode="decimal" value={f.cost} step=".01" placeholder="0.00" onChange={e=>setF({...f,cost:e.target.value})} style={K.inp}/></div>
          <div><FL>Por unidad</FL><select value={f.cu} onChange={e=>setF({...f,cu:e.target.value})} style={K.sel}>{COST_U.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
        </div>
        {+f.cost>0&&(
          <div style={{marginTop:10,padding:"10px 14px",background:C.amberBg,borderRadius:10,borderLeft:`3px solid ${C.amber}`,fontSize:13}}>
            <strong style={{color:C.amber}}>${(+f.cost).toFixed(2)}</strong> por {f.cu}
            {f.cu==="pie²"&&<span style={{color:C.ink3}}> · equiv. ${(+f.cost/0.0929).toFixed(2)}/m²</span>}
            {f.cu==="m²"  &&<span style={{color:C.ink3}}> · equiv. ${(+f.cost*0.0929).toFixed(2)}/pie²</span>}
          </div>
        )}
      </div>
      <div style={K.card}>
        <CL>Inventario</CL>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <div><FL>Cantidad en stock</FL><input type="number" inputMode="numeric" value={f.stock} placeholder="0" onChange={e=>setF({...f,stock:e.target.value})} style={K.inp}/></div>
          <div><FL>Unidad</FL><select value={f.su||"pie²"} onChange={e=>setF({...f,su:e.target.value})} style={K.sel}>{STOCK_U.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
        </div>
      </div>
      <div style={K.card}>
        <CL>Proveedor</CL>
        <FL>Nombre del proveedor</FL>
        <input value={f.proveedor||""} onChange={e=>setF({...f,proveedor:e.target.value})} placeholder="Maderas García, Home Depot..." style={{...K.inp,marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><FL>Teléfono</FL><input value={f.tel||""} onChange={e=>setF({...f,tel:e.target.value})} type="tel" placeholder="555-000-0000" style={K.inp}/></div>
          <div><FL>Email</FL><input value={f.email||""} onChange={e=>setF({...f,email:e.target.value})} type="email" placeholder="ventas@..." style={K.inp}/></div>
        </div>
        <FL>Notas</FL>
        <textarea value={f.nota||""} onChange={e=>setF({...f,nota:e.target.value})} placeholder="Descuentos, pedido mínimo, horario..." style={{...K.inp,minHeight:70,lineHeight:1.5}}/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:30}}><BtnG onClick={back}>Cancelar</BtnG><BtnP onClick={save} style={{flex:2}}>{eid!==null?"Guardar cambios":"Agregar al catálogo"}</BtnP></div>
    </div>
  );

  // ── Lista ──────────────────────────────────────────────
  return(
    <div>
      <PT>Mis maderas</PT>
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        <BtnP onClick={openNew} style={{flex:1}}>+ Nueva madera</BtnP>
        <BtnG onClick={()=>setView("library")} style={{flex:1}}>📚 Biblioteca</BtnG>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {["Todos","Blanda","Dura","Laminado","Otro"].map(c=>(
          <button key={c} onClick={()=>setFilt(c)} style={{padding:"8px 16px",borderRadius:20,fontSize:14,fontWeight:600,border:`1.5px solid ${filt===c?C.amber:C.border}`,background:filt===c?`${C.amber}15`:"transparent",color:filt===c?C.amber:C.ink3,cursor:"pointer"}}>
            {c}{c!=="Todos"&&` (${catalog.filter(m=>m.cat===c).length})`}
          </button>
        ))}
      </div>
      {catalog.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
          {[["Total",catalog.length,false],["Proveedores",catalog.filter(m=>m.proveedor).length,false],["En stock",catalog.filter(m=>+m.stock>0).length,true]].map(([l,v,a])=>(
            <div key={l} style={{background:a?`${C.amber}12`:C.card,borderRadius:12,padding:"12px 0",textAlign:"center",border:`1px solid ${a?C.amberBd:C.border}`}}>
              <div style={{fontSize:24,fontWeight:800,color:a?C.amber:C.ink1}}>{v}</div>
              <div style={{fontSize:12,color:C.ink3}}>{l}</div>
            </div>
          ))}
        </div>
      )}
      {shown.length===0&&<ES icon="🪵" text="Sin maderas aquí" sub="Agrega una nueva o elige de la biblioteca"/>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {shown.map(m=>{
          const isOpen=expId===m.id,hasSup=m.proveedor||m.tel||m.email;
          return(
            <div key={m.id} style={{background:C.card,borderRadius:18,overflow:"hidden",border:`1.5px solid ${isOpen?C.amber:C.border}`,boxShadow:isOpen?`0 4px 20px ${C.amber}22`:"0 1px 5px rgba(0,0,0,0.05)",transition:"all .2s"}}>
              <div style={{display:"flex",alignItems:"stretch",cursor:"pointer"}} onClick={()=>setExpId(isOpen?null:m.id)}>
                <div style={{width:5,background:CAT_COLOR[m.cat]||C.ink4,flexShrink:0}}/>
                <div style={{flex:1,padding:"16px"}}>
                  <div style={{fontSize:17,fontWeight:700,color:C.ink1,marginBottom:6}}>{m.name}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:16,fontWeight:800,color:C.amber}}>${(+m.cost).toFixed(2)}<span style={{fontSize:12,fontWeight:500,color:C.ink3}}>/{m.cu}</span></span>
                    {m.thick>0&&<span style={{fontSize:12,padding:"2px 8px",borderRadius:8,background:C.field,color:C.ink3,border:`1px solid ${C.border}`}}>📏 {m.thick}"</span>}
                    {+m.stock>0?<span style={{fontSize:12,padding:"2px 8px",borderRadius:8,background:`${C.green}15`,color:C.green,fontWeight:600}}>📦 {m.stock} {m.su}</span>
                    :m.stock!==""&&<span style={{fontSize:12,padding:"2px 8px",borderRadius:8,background:`${C.red}12`,color:C.red,fontWeight:600}}>Sin stock</span>}
                  </div>
                  {hasSup&&<div style={{fontSize:13,color:C.blue,marginTop:5}}>🏪 {m.proveedor||"Proveedor guardado"}</div>}
                  {m.desc&&<div style={{fontSize:13,color:C.ink3,marginTop:4,lineHeight:1.4}}>{m.desc}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",paddingRight:14,color:C.ink4,fontSize:20,transition:"transform .2s",transform:isOpen?"rotate(90deg)":"none"}}>›</div>
              </div>
              {isOpen&&(
                <div style={{borderTop:`1px solid ${C.border}`,background:"#FAFAF8",padding:"16px"}}>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
                    {m.cu!=="pie²"&&<Pill lbl="Por pie²" val={`$${(m.cu==="m²"?(+m.cost*0.0929):(+m.cost)).toFixed(2)}`}/>}
                    {m.cu!=="m²"&&<Pill lbl="Por m²" val={`$${(m.cu==="pie²"?(+m.cost/0.0929):(+m.cost)).toFixed(2)}`}/>}
                    {m.thick>0&&<Pill lbl="Grosor" val={`${m.thick}" = ${(m.thick*25.4).toFixed(1)}mm`}/>}
                  </div>
                  {hasSup?(
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:C.ink1,marginBottom:10}}>{m.proveedor}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                        {m.tel&&<a href={`tel:${m.tel}`} onClick={e=>e.stopPropagation()} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:12,background:`${C.green}15`,border:`1.5px solid ${C.green}44`,color:C.green,fontSize:15,fontWeight:700,textDecoration:"none"}}>📞 {m.tel}</a>}
                        {m.email&&<a href={`mailto:${m.email}`} onClick={e=>e.stopPropagation()} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:12,background:`${C.blue}15`,border:`1.5px solid ${C.blue}44`,color:C.blue,fontSize:15,fontWeight:700,textDecoration:"none"}}>✉️ Email</a>}
                      </div>
                      {m.nota&&<div style={{padding:"10px 14px",background:C.amberBg,borderRadius:10,fontSize:13,color:C.ink2,borderLeft:`3px solid ${C.amber}`,lineHeight:1.5}}>💡 {m.nota}</div>}
                    </div>
                  ):(
                    <button onClick={e=>{e.stopPropagation();openSup(m);}} style={{width:"100%",padding:"12px",background:"transparent",border:`1.5px dashed ${C.border}`,borderRadius:12,color:C.ink3,fontSize:14,cursor:"pointer"}}>+ Agregar proveedor y contacto</button>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
                    <button onClick={e=>{e.stopPropagation();openEdit(m);}} style={K.btnG}>✏️ Editar</button>
                    <button onClick={e=>{e.stopPropagation();openSup(m);}}  style={K.btnG}>🏪 Proveedor</button>
                    <button onClick={e=>{e.stopPropagation();del(m.id);}}   style={{...K.btnG,color:C.red,borderColor:`${C.red}44`}}>🗑 Borrar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  GUÍA
// ═══════════════════════════════════════════════════════════
function RefTab(){
  const [sec,setSec]=useState("woods");
  return(
    <div>
      <PT>Guía de referencia</PT>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["woods","🌲 Maderas"],["nails","🔨 Clavos"],["screws","🪛 Tornillos"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSec(k)} style={{flex:1,padding:"11px 4px",borderRadius:12,fontSize:14,fontWeight:600,border:`1.5px solid ${sec===k?C.amber:C.border}`,background:sec===k?`${C.amber}15`:"transparent",color:sec===k?C.amber:C.ink3,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {sec==="woods"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {WOOD_LIB.map(w=>(
            <div key={w.name} style={{background:C.card,borderRadius:14,display:"flex",overflow:"hidden",border:`1px solid ${C.border}`}}>
              <div style={{width:5,background:w.color,flexShrink:0}}/>
              <div style={{flex:1,padding:"14px"}}>
                <div style={{fontSize:15,fontWeight:700,color:C.ink1,marginBottom:5}}>{w.name}</div>
                <span style={{fontSize:12,padding:"2px 8px",borderRadius:8,background:`${CAT_COLOR[w.cat]}18`,color:CAT_COLOR[w.cat],fontWeight:700}}>{w.cat}</span>
                <p style={{fontSize:13,color:C.ink3,marginTop:6,lineHeight:1.5}}>{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {sec==="nails"&&(
        <div style={K.card}>
          <CL>Clavos — sistema Pennyweight (d)</CL>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr><th style={K.th}>Calibre</th><th style={K.th}>Largo pulg</th><th style={K.th}>Largo mm</th></tr></thead>
            <tbody>{NAILS.map(([c,l,m])=>(
              <tr key={c}><td style={{...K.td,fontWeight:700,color:C.amber}}>{c}</td><td style={K.td}>{l}</td><td style={{...K.td,color:C.blue}}>{m}</td></tr>
            ))}</tbody>
          </table>
          <Hint>Mayor número = clavo más largo. El 16d es el más usado en estructuras.</Hint>
        </div>
      )}
      {sec==="screws"&&(
        <div style={K.card}>
          <CL>Tornillos y brocas recomendadas</CL>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr>{["Calibre","Diámetro","Broca piloto","Uso típico"].map(h=><th key={h} style={K.th}>{h}</th>)}</tr></thead>
            <tbody>{SCREWS.map(([c,d,p,u])=>(
              <tr key={c}><td style={{...K.td,fontWeight:700,color:C.amber}}>{c}</td><td style={{...K.td,color:C.blue}}>{d}</td><td style={K.td}>{p}</td><td style={{...K.td,color:C.ink2,textAlign:"left",fontSize:13}}>{u}</td></tr>
            ))}</tbody>
          </table>
          <Hint>Broca piloto ≈ 85% del diámetro del núcleo del tornillo en maderas duras.</Hint>
        </div>
      )}

      {/* CRÉDITOS */}
      <div style={{marginTop:36,padding:"24px 20px",background:C.card,borderRadius:20,border:`1px solid ${C.border}`,textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:28,marginBottom:8}}>🪵</div>
        <div style={{fontSize:20,fontWeight:900,letterSpacing:-.5,color:C.ink1,marginBottom:4}}>
          Cut<span style={{color:C.amber}}>Wise</span>
        </div>
        <div style={{fontSize:13,color:C.ink3,marginBottom:16}}>Calculadora profesional de carpintería</div>
        <div style={{height:1,background:C.border,marginBottom:16}}/>
        <div style={{fontSize:12,color:C.ink4,marginBottom:6,textTransform:"uppercase",letterSpacing:.8,fontWeight:600}}>Creada por</div>
        <div style={{fontSize:22,fontWeight:800,color:C.amber,letterSpacing:-.3}}>Vinicio Meléndez</div>
        <div style={{fontSize:13,color:C.ink3,marginTop:4}}>Carpintería · Diseño · Tecnología</div>
        <div style={{marginTop:16,fontSize:12,color:C.ink4}}>© {new Date().getFullYear()} · Todos los derechos reservados</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MICRO COMPONENTES
// ═══════════════════════════════════════════════════════════
function PT({children}){ return <h1 style={{fontSize:28,fontWeight:900,letterSpacing:-.8,color:C.ink1,marginBottom:20,lineHeight:1.1}}>{children}</h1>; }
function STitle({children,style:st}){ return <div style={{fontSize:14,fontWeight:700,color:C.ink2,marginBottom:10,marginTop:4,...(st||{})}}>{children}</div>; }
function CL({children}){ return <div style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:.7,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>{children}</div>; }
function FL({children,style:st}){ return <div style={{fontSize:14,fontWeight:600,color:C.ink2,marginBottom:7,...(st||{})}}>{children}</div>; }
function MR({top,bot}){ return <div style={{marginTop:14,padding:"14px 12px",background:C.amberBg,borderRadius:12,textAlign:"center",border:`1.5px solid ${C.amberBd}`}}><div style={{fontSize:26,fontWeight:900,color:C.amber,letterSpacing:-.5}}>{top}</div><div style={{fontSize:13,color:C.ink3,marginTop:4}}>{bot}</div></div>; }
function Hint({children}){ return <div style={{fontSize:13,color:C.ink3,marginTop:12,padding:"8px 12px",background:C.field,borderRadius:8,borderLeft:`3px solid ${C.amberBd}`,lineHeight:1.5}}>💡 {children}</div>; }
function ES({icon,text,sub}){ return <div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:52,marginBottom:12}}>{icon}</div><div style={{fontSize:18,fontWeight:700,color:C.ink2,marginBottom:6}}>{text}</div><div style={{fontSize:14,color:C.ink3,lineHeight:1.6}}>{sub}</div></div>; }
function Pill({lbl,val}){ return <div style={{background:C.card,borderRadius:10,padding:"7px 12px",border:`1px solid ${C.border}`}}><div style={{fontSize:11,color:C.ink4,fontWeight:600}}>{lbl}</div><div style={{fontSize:14,fontWeight:700,color:C.amber,marginTop:2}}>{val}</div></div>; }
function BackBtn({children,onClick}){ return <button onClick={onClick} style={{background:"transparent",border:"none",color:C.amber,fontSize:16,fontWeight:600,padding:"0 0 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>‹ {children}</button>; }
function BtnP({children,onClick,full,style:st}){ return <button onClick={onClick} style={{padding:"15px 22px",background:C.amber,border:"none",borderRadius:14,fontWeight:700,fontSize:16,color:C.white,boxShadow:`0 4px 14px ${C.amber}55`,letterSpacing:-.1,cursor:"pointer",...(full?{width:"100%"}:{}),...(st||{})}}>{children}</button>; }
function BtnG({children,onClick,full,style:st}){ return <button onClick={onClick} style={{padding:"15px 18px",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:14,fontWeight:600,fontSize:15,color:C.ink2,cursor:"pointer",...(full?{width:"100%"}:{}),...(st||{})}}>{children}</button>; }

// ── ESTILOS COMPARTIDOS ──────────────────────────────────
const K={
  card:{background:C.card,borderRadius:16,padding:"18px 16px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,0.05)",border:`1px solid ${C.border}`},
  inp:{width:"100%",padding:"13px 14px",fontSize:16,background:C.field,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.ink1,transition:"border-color .15s, box-shadow .15s",display:"block"},
  sel:{width:"100%",padding:"13px 14px",fontSize:15,background:C.field,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.ink1,cursor:"pointer"},
  th:{padding:"9px 12px",background:"#F5F5F7",color:C.ink3,fontWeight:700,fontSize:12,textAlign:"center",borderBottom:`1px solid ${C.border}`},
  td:{padding:"10px 12px",textAlign:"center",color:C.ink2,borderBottom:"1px solid #F5F5F7",fontSize:14},
  hint:{fontSize:13,color:C.ink3,marginTop:12,padding:"8px 12px",background:C.field,borderRadius:8,borderLeft:`3px solid ${C.amberBd}`,lineHeight:1.5},
  btnP:{padding:"10px 18px",background:C.amber,border:"none",borderRadius:10,fontWeight:700,fontSize:14,color:C.white,cursor:"pointer"},
  btnG:{padding:"11px 0",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:10,fontWeight:600,fontSize:14,color:C.ink2,cursor:"pointer"},
};
