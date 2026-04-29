import { useState, useEffect, useRef } from “react”;

// ═══════════════════════════════════════════════════════════════
//  CUTWISE — Calculadora Profesional de Carpintería
//  Creada por Jorge Vinicio Meléndez
//  Grain & Brand Studio, LLC
// ═══════════════════════════════════════════════════════════════

// ── CONVERSIÓN BASE ──────────────────────────────────────────
const TO_MM={mm:1,cm:10,m:1000,in:25.4,ft:304.8,yd:914.4};
const UNITS=[“mm”,“cm”,“m”,“in”,“ft”,“yd”];
const UL={mm:“Milímetros”,cm:“Centímetros”,m:“Metros”,in:“Pulgadas”,ft:“Pies”,yd:“Yardas”};
const US={mm:“mm”,cm:“cm”,m:“m”,in:’”’,ft:“ft”,yd:“yd”};

function cvt(v,f,t){const n=parseFloat(v);if(isNaN(n)||f===t)return isNaN(n)?0:n;return(n*TO_MM[f])/TO_MM[t];}
function fmt(n,d=6){if(typeof n!==“number”||isNaN(n))return””;return String(parseFloat(n.toFixed(d)));}
function gcd(a,b){return b===0?a:gcd(b,a%b);}
function toFrac(dec,den=16){
const a=Math.abs(dec),w=Math.floor(a),n=Math.round((a-w)*den);
if(n===0)return`${w}";if(n===den)return${w+1}"`;
const g=gcd(n,den);return w>0?${w} ${n/g}/${den/g}":` ${n/g}/${den/g}"`;
}
function bfCalc(L,W,T,qty,u){return(cvt(L,u,“in”)cvt(W,u,“in”)*cvt(T,u,“in”)(qty||1))/144;}
function parseFrac(s){const p=String(s).trim().split(”/”);return p.length===2?(parseFloat(p[0])||0)/(parseFloat(p[1])||1):parseFloat(p[0])||0;}

// ── MODO TALLER: parsea “2 ft 3 1/8 in” → pulgadas decimales ─
function parseWorkshopInput(str){
const s=String(str).trim().toLowerCase();
let total=0;
const ftM=s.match(/(\d+(?:.\d+)?)\s*ft/);
if(ftM)total+=parseFloat(ftM[1])*12;
const inM=s.match(/(\d+(?:.\d+)?)\s*(?:in|”)/);
if(inM)total+=parseFloat(inM[1]);
const fracM=s.match(/(\d+)\s*/\s*(\d+)/);
if(fracM)total+=parseInt(fracM[1])/parseInt(fracM[2]);
const wholeOnlyM=s.match(/^(\d+(?:.\d+)?)$/);
if(wholeOnlyM&&!ftM&&!inM&&!fracM)total=parseFloat(wholeOnlyM[1]);
return total;
}

// ── STORAGE ─────────────────────────────────────────────────
function useLS(key,init){
const[val,setVal]=useState(()=>{
try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}
});
useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(val));}catch{}},[key,val]);
return[val,setVal];
}

// ── DATOS ────────────────────────────────────────────────────
const NOMINAL=[
[“1×2”,“¾ × 1½"”,“19×38”],[“1×3”,“¾ × 2½"”,“19×64”],[“1×4”,“¾ × 3½"”,“19×89”],
[“1×6”,“¾ × 5½"”,“19×140”],[“1×8”,“¾ × 7¼"”,“19×184”],[“1×10”,“¾ × 9¼"”,“19×235”],
[“1×12”,“¾ × 11¼"”,“19×286”],[“2×4”,“1½ × 3½"”,“38×89”],[“2×6”,“1½ × 5½"”,“38×140”],
[“2×8”,“1½ × 7¼"”,“38×184”],[“2×10”,“1½ × 9¼"”,“38×235”],[“2×12”,“1½ × 11¼"”,“38×286”],
[“4×4”,“3½ × 3½"”,“89×89”],[“4×6”,“3½ × 5½"”,“89×140”],[“6×6”,“5½ × 5½"”,“140×140”],
];
const WOOD_LIB=[
{name:“Pino”,cat:“Blanda”,thick:0.75,cu:“pie²”,color:”#C8A866”,desc:“Abundante y económica. Ideal para pintar y estructuras.”,ext:false},
{name:“Cedro Rojo”,cat:“Blanda”,thick:1.0,cu:“pie²”,color:”#B87840”,desc:“Resistente a insectos y humedad. Perfecta para closets.”,ext:true},
{name:“Pino Amarillo”,cat:“Blanda”,thick:1.5,cu:“pie²”,color:”#D4A030”,desc:“Muy resistente para ser blanda. Pisos y decks.”,ext:true},
{name:“Roble Blanco”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#8B6340”,desc:“Bella veta. Pisos de alta gama, gabinetes y barriles.”,ext:false},
{name:“Roble Rojo”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#A07050”,desc:“El hardwood más vendido en EE.UU. Gabinetes y escaleras.”,ext:false},
{name:“Nogal (Walnut)”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#5C3317”,desc:“Madera oscura de lujo. Muebles finos, culatas y tazones.”,ext:false},
{name:“Maple Duro”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#E8C870”,desc:“Extremadamente duro. Tablas de cortar y pisos de gimnasio.”,ext:false},
{name:“Cerezo (Cherry)”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#8B3010”,desc:“Oscurece bellamente con el tiempo. Gabinetes premium.”,ext:false},
{name:“Fresno (Ash)”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#C8B890”,desc:“Flexible y resistente. Mangos de herramientas y bates.”,ext:false},
{name:“Caoba (Mahogany)”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#9C3A12”,desc:“Muy estable dimensionalmente. Muebles finos e instrumentos.”,ext:false},
{name:“Teca (Teak)”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#B8860B”,desc:“La reina del exterior. Yates, decks y bancas de jardín.”,ext:true},
{name:“Álamo (Poplar)”,cat:“Dura”,thick:1.0,cu:“pie²”,color:”#9BB87A”,desc:“Económico y fácil de pintar. Cajones e interiores.”,ext:false},
{name:“MDF Estándar”,cat:“Laminado”,thick:0.75,cu:“m²”,color:”#C4A882”,desc:“Superficie lisa perfecta para pintar o rutear CNC.”,ext:false},
{name:“MDF Hidrofugado”,cat:“Laminado”,thick:0.75,cu:“m²”,color:”#A08862”,desc:“Resistente a humedad. Ideal para baños y cocinas.”,ext:false},
{name:“Triplay Birch”,cat:“Laminado”,thick:0.75,cu:“m²”,color:”#D4B896”,desc:“Sin vacíos entre capas. El mejor para CNC y muebles.”,ext:false},
{name:“Melanina”,cat:“Laminado”,thick:0.75,cu:“m²”,color:”#D8D0C0”,desc:“Con acabado laminado. Cocinas y mobiliario de oficina.”,ext:false},
{name:“OSB”,cat:“Laminado”,thick:0.5,cu:“m²”,color:”#C8A870”,desc:“Estructural y económico. Paredes y pisos de construcción.”,ext:true},
];
const FINISHES=[
{name:“Aceite danés”,type:“Aceite”,uso:“Interior, madera expuesta”,pros:“Fácil de aplicar, natural”,cons:“Poca protección al agua”,tip:“Aplicar con trapo, dejar 15min y limpiar exceso”},
{name:“Poliuretano”,type:“Barniz”,uso:“Pisos, mesas, superficies de alto tráfico”,pros:“Muy durable, resistente al agua”,cons:“Difícil de reparar”,tip:“Lijar entre capas con lija 320”},
{name:“Shellac”,type:“Laca natural”,uso:“Muebles finos, sellar nudos”,pros:“Seca rápido, fácil de retocar”,cons:“No resiste agua ni alcohol”,tip:“Excelente sellador antes de pintar”},
{name:“Lacquer”,type:“Laca”,uso:“Gabinetes, muebles de producción”,pros:“Seca muy rápido, acabado fino”,cons:“Requiere pistola”,tip:“Aplicar en capas delgadas”},
{name:“Gel Stain”,type:“Stain”,uso:“Maderas difíciles como pino y maple”,pros:“Control total del color”,cons:“Seca lento”,tip:“Ideal para igualar tonos en maderas disparejas”},
{name:“Water-based Stain”,type:“Stain”,uso:“Interior general”,pros:“Sin olor, seca rápido”,cons:“Puede levantar la veta”,tip:“Mojar madera antes para pre-levantar veta”},
{name:“Oil-based Stain”,type:“Stain”,uso:“Interior, colores profundos”,pros:“Penetra bien, color rico”,cons:“Seca lento, con olor”,tip:“24h entre capas mínimo”},
{name:“Chalk Paint”,type:“Pintura”,uso:“Muebles vintage, decoración”,pros:“Sin lija previa, muchos colores”,cons:“Necesita cera o sellador”,tip:“Terminar siempre con cera o barniz”},
];
const NAILS=[[“2d”,“1"”,“25mm”],[“3d”,“1¼"”,“32mm”],[“4d”,“1½"”,“38mm”],[“6d”,“2"”,“51mm”],[“8d”,“2½"”,“64mm”],[“10d”,“3"”,“76mm”],[“16d”,“3½"”,“89mm”],[“20d”,“4"”,“102mm”]];
const SCREWS=[[”#6”,“3.5mm”,“7/64"”,“Uso general, MDF”],[”#8”,“4.2mm”,“9/64"”,“El más común — estructuras”],[”#10”,“4.8mm”,“5/32"”,“Juntas resistentes”],[”#12”,“5.5mm”,“3/16"”,“Madera dura, vigas”]];
const TIPS=[
{icon:“📐”,title:“Regla 3-4-5”,body:“Para cuadrar una esquina a 90°: mide 3 unidades en un lado, 4 en el otro, la diagonal debe medir exactamente 5. Usa cualquier unidad.”},
{icon:“🎯”,title:“Encontrar el centro”,body:“Traza dos diagonales de esquina a esquina. Donde se cruzan es el centro exacto. Funciona en cualquier rectángulo.”},
{icon:“📏”,title:“Dividir un espacio en partes iguales”,body:“Pon una regla en diagonal hasta que toque un número divisible por las partes que necesitas. Marca esos puntos y proyéctalos con escuadra.”},
{icon:“🪵”,title:“Dirección de la veta”,body:“Siempre cepilla, lija y barniza a favor de la veta. Contra la veta levanta fibras y deja marcas.”},
{icon:“💧”,title:“Prueba de humedad”,body:“Antes de barnizar, pon una gota de agua. Si la absorbe rápido, la madera está muy seca. Si la rechaza, tiene sellador o aceite previo.”},
{icon:“🔩”,title:“Pre-taladrar siempre”,body:“En maderas duras, siempre pre-taladra antes de atornillar. Evita rajaduras especialmente cerca de los extremos.”},
];

const INIT_CATALOG=[
{id:1,name:“Pino #2 1×4”,cat:“Blanda”,thick:0.75,cost:2.50,cu:“pie²”,stock:40,su:“pie²”,proveedor:“Maderas García”,tel:“555-100-2030”,email:“ventas@maderasgarcia.com”,nota:“10% dto en +100 pie²”},
{id:2,name:“Cedro Aromático”,cat:“Blanda”,thick:1.0,cost:4.80,cu:“pie²”,stock:20,su:“pie²”,proveedor:“Maderería Hdz”,tel:“555-200-4050”,email:””,nota:””},
{id:3,name:“Roble Blanco 4/4”,cat:“Dura”,thick:1.0,cost:9.50,cu:“pie²”,stock:15,su:“pie²”,proveedor:“Premium Woods MX”,tel:“555-300-6070”,email:“info@premiumwoods.mx”,nota:“Mínimo 20 pie²”},
{id:4,name:“MDF ¾"”,cat:“Laminado”,thick:0.75,cost:18.50,cu:“m²”,stock:8,su:“hojas”,proveedor:“Maderas García”,tel:“555-100-2030”,email:“ventas@maderasgarcia.com”,nota:””},
{id:5,name:“Triplay Birch ¾"”,cat:“Laminado”,thick:0.75,cost:42.00,cu:“m²”,stock:5,su:“hojas”,proveedor:“Premium Woods MX”,tel:“555-300-6070”,email:“info@premiumwoods.mx”,nota:“Pedir 2 semanas antes”},
];
const INIT_PROJECTS=[
{id:1,name:“Mesa de Centro”,client:“Uso personal”,clientTel:””,notes:””,status:“En progreso”,markup:50,labor:0,laborType:“pct”,cuts:[
{id:1,label:“Tablero superior”,mat:“Roble Blanco 4/4”,L:48,W:24,T:1.0,qty:1,cpt:9.50},
{id:2,label:“Patas”,mat:“Roble Blanco 4/4”,L:18,W:2.5,T:2.5,qty:4,cpt:9.50},
{id:3,label:“Travesaños”,mat:“Pino #2 1×4”,L:42,W:3.5,T:0.75,qty:2,cpt:2.50},
]},
];

// ── PRO OPTIMIZER DATA ───────────────────────────────────────
const SHEET_PRESETS={
MX:[{label:“4×8 pies”,w:122,h:244},{label:“4×9 pies”,w:122,h:274},{label:“5×9 pies”,w:152,h:274}],
US:[{label:“4×8 ft”,w:121.9,h:243.8},{label:“4×10 ft”,w:121.9,h:304.8},{label:“5×5 ft”,w:152.4,h:152.4}],
EU:[{label:“2440×1220mm”,w:122,h:244},{label:“2800×1050mm”,w:105,h:280}],
};
const PRO_MATS=[“MDF”,“Melamina”,“Triplay / Plywood”,“Aglomerado”,“OSB”,“Madera sólida”];
const THICKNESS_MM=[3,6,9,12,15,18,19,25,30];
const CABINET_PRESETS=[
{id:“base”,icon:“🟫”,name:“Gabinete Base”,hint:“Cocina bajo cubierta”,defaults:{w:60,h:85,d:60},
parts:(w,h,d,T)=>[{name:“Lateral”,qty:2,w:d,h:h,grain:“V”},{name:“Fondo”,qty:1,w:w-2*T,h:h-T,grain:“H”},{name:“Entrepaño”,qty:1,w:w-2*T,h:d,grain:“H”},{name:“Zoclo”,qty:1,w:w-2*T,h:10,grain:“H”},{name:“Puerta”,qty:1,w:w,h:h-10,grain:“V”}]},
{id:“aereo”,icon:“🟦”,name:“Gabinete Aéreo”,hint:“Alacena mural”,defaults:{w:60,h:70,d:35},
parts:(w,h,d,T)=>[{name:“Lateral”,qty:2,w:d,h:h,grain:“V”},{name:“Tapa sup.”,qty:1,w:w-2*T,h:d,grain:“H”},{name:“Base int.”,qty:1,w:w-2*T,h:d,grain:“H”},{name:“Fondo”,qty:1,w:w-2*T,h:h-2*T,grain:“H”},{name:“Puerta”,qty:2,w:w/2,h:h,grain:“V”}]},
{id:“cajones”,icon:“🟧”,name:“Cajonera”,hint:“3 cajones”,defaults:{w:60,h:85,d:60},
parts:(w,h,d,T)=>{const dh=+((h-4*T)/3).toFixed(1);return[{name:“Lateral”,qty:2,w:d,h:h,grain:“V”},{name:“Tapa/Base”,qty:2,w:w-2*T,h:d,grain:“H”},{name:“Frente cajón”,qty:3,w:w-2*T,h:dh,grain:“H”},{name:“Lateral cajón”,qty:6,w:d-T,h:dh-T,grain:“H”},{name:“Fondo cajón”,qty:3,w:w-2*T-2,h:d-T-2,grain:“H”}];}},
{id:“torre”,icon:“🟩”,name:“Torre / Alacena”,hint:“Piso a techo”,defaults:{w:60,h:200,d:60},
parts:(w,h,d,T)=>[{name:“Lateral”,qty:2,w:d,h:h,grain:“V”},{name:“Tapa sup.”,qty:1,w:w-2*T,h:d,grain:“H”},{name:“Base”,qty:1,w:w-2*T,h:d,grain:“H”},{name:“Entrepaño”,qty:3,w:w-2*T,h:d,grain:“H”},{name:“Fondo”,qty:1,w:w-2*T,h:h-2*T,grain:“H”},{name:“Puerta sup.”,qty:1,w:w,h:h*0.4,grain:“V”},{name:“Puerta inf.”,qty:1,w:w,h:h*0.6,grain:“V”}]},
{id:“custom”,icon:“✏️”,name:“Personalizado”,hint:“Piezas libres”,parts:null},
];
const PRO_COLORS=[”#E8956D”,”#5B9BD5”,”#6DBF82”,”#E06C75”,”#A67CC5”,”#E8C44D”,”#4DBFB3”,”#E89B4D”,”#7DB5DE”,”#7DCF99”,”#DEC84D”,”#C399D9”];

function optimizeCuts(pieces,SW,SH,kerf){
const expanded=[];
pieces.forEach(p=>{for(let i=0;i<(p.qty||1);i++)expanded.push({…p,_id:${p.name}-${i}});});
const sorted=[…expanded].sort((a,b)=>b.w*b.h-a.w*a.h);
const sheets=[];const rem=[…sorted];
while(rem.length){
const sheet={placements:[],spaces:[{x:0,y:0,w:SW,h:SH}],usedArea:0};
let changed=true;
while(changed&&rem.length){
changed=false;
for(let i=0;i<rem.length;i++){
const p=rem[i];let placed=false;
for(let si=0;si<sheet.spaces.length;si++){
const s=sheet.spaces[si];let pw=p.w,ph=p.h,rot=false;
if(pw<=s.w&&ph<=s.h){placed=true;}
else if(p.grain===“N”&&ph<=s.w&&pw<=s.h){pw=p.h;ph=p.w;rot=true;placed=true;}
if(placed){
sheet.placements.push({…p,x:s.x,y:s.y,pw,ph,rot});
sheet.usedArea+=pw*ph;
const ns=[];
const rw=s.w-pw-kerf,th=s.h-ph-kerf;
if(rw>0)ns.push({x:s.x+pw+kerf,y:s.y,w:rw,h:ph});
if(th>0)ns.push({x:s.x,y:s.y+ph+kerf,w:s.w,h:th});
sheet.spaces.splice(si,1,…ns);
rem.splice(i,1);changed=true;break;
}
}
if(changed)break;
}
}
sheets.push(sheet);
}
return sheets;
}

// ── COLORES SISTEMA ──────────────────────────────────────────
const C={
amber:”#D4900A”,amberBg:”#FFF8ED”,amberBd:”#F5D080”,
green:”#28A745”,blue:”#007AFF”,red:”#D32F2F”,
white:”#FFFFFF”,bg:”#F5F0EB”,card:”#FFFFFF”,
field:”#F2EDE6”,ink1:”#1C1C1E”,ink2:”#48484A”,
ink3:”#8A8A8E”,ink4:”#C7C7CC”,border:”#E8E0D5”,
proB:”#18182A”,proCard:“rgba(255,255,255,0.04)”,
proGold:”#E8C14D”,proText:”#EDE8DC”,proMuted:”#666”,
};
const CAT_COLOR={Blanda:”#3A8C4A”,Dura:”#B85C20”,Laminado:”#1A6BB0”,Otro:”#7B52AB”};
const STA_COLOR={“Pendiente”:”#8E8E93”,“En progreso”:”#D4900A”,“Completado”:”#34C759”,“En pausa”:”#007AFF”};
const COST_U=[“pie²”,“m²”,“pie·tabla”,“hoja”,“ml”,“kg”,“unidad”];
const STOCK_U=[“pie²”,“m²”,“hojas”,“unidades”,“kg”,“pie·tabla”];

// ── CSS GLOBAL ───────────────────────────────────────────────
const G=@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;700&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} body{background:${C.bg};-webkit-font-smoothing:antialiased;} input,select,textarea,button{font-family:inherit;} input[type=number]::-webkit-inner-spin-button{opacity:.4;} input:focus,select:focus,textarea:focus{outline:none;border-color:${C.amber}!important;box-shadow:0 0 0 3px rgba(212,144,10,.15);} ::-webkit-scrollbar{display:none;} @keyframes up{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}} .up{animation:up .22s ease both;} button:active{opacity:.78;transform:scale(.98);transition:all .1s;} textarea{resize:vertical;} .pro-focus:focus{border-color:${C.proGold}!important;box-shadow:0 0 0 3px rgba(232,193,77,.2)!important;};

// ═══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function App(){
const[tab,setTab]=useState(“calc”);
const[catalog,setCatalog]=useLS(“cw_catalog”,INIT_CATALOG);
const[projects,setProjects]=useLS(“cw_projects”,INIT_PROJECTS);
const[proUnlocked]=useLS(“cw_pro”,false);

const TABS=[
{id:“calc”,icon:“⇄”,label:“Calcular”},
{id:“boardfoot”,icon:“📐”,label:“Madera”},
{id:“projects”,icon:“📋”,label:“Proyectos”},
{id:“catalog”,icon:“🪵”,label:“Mis Maderas”},
{id:“ref”,icon:“📖”,label:“Guía”},
{id:“pro”,icon:“✦”,label:“Pro”},
];

return(
<div style={{minHeight:“100vh”,background:tab===“pro”?C.proB:C.bg,fontFamily:”‘Inter’,-apple-system,sans-serif”,color:C.ink1,maxWidth:480,margin:“0 auto”,display:“flex”,flexDirection:“column”,transition:“background .3s”}}>
<style>{G}</style>


  {/* CABECERA */}
  {tab==="calc"?(
    /* Header completo solo en pantalla principal */
    <div style={{background:C.white,padding:"16px 20px 14px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
        {/* Logo con sierra */}
        <div style={{width:44,height:44,borderRadius:13,background:`linear-gradient(135deg,${C.amber},#8B5E0A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:`0 4px 14px ${C.amber}55`,flexShrink:0}}>🪚</div>
        <div>
          <div style={{fontSize:26,fontWeight:900,letterSpacing:-1,lineHeight:1,color:C.ink1}}>
            Cut<span style={{color:C.amber}}>Wise</span>
          </div>
          <div style={{fontSize:12,color:C.ink3,marginTop:2,letterSpacing:.3}}>Calculadora de carpintería</div>
        </div>
      </div>
    </div>
  ):(
    /* Header mínimo en otras secciones */
    <div style={{background:tab==="pro"?"#111120":C.white,padding:"10px 16px 9px",borderBottom:`1px solid ${tab==="pro"?"rgba(255,255,255,0.06)":C.border}`,position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 6px rgba(0,0,0,0.05)",transition:"background .3s",display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.amber},#8B5E0A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🪚</div>
      <span style={{fontSize:17,fontWeight:800,letterSpacing:-.4,color:tab==="pro"?C.proText:C.ink1}}>
        Cut<span style={{color:C.amber}}>Wise</span>
        {tab==="pro"&&<span style={{marginLeft:8,fontSize:11,background:"rgba(232,193,77,0.2)",border:"1px solid rgba(232,193,77,0.4)",borderRadius:6,padding:"2px 7px",color:C.proGold,fontWeight:800,verticalAlign:"middle"}}>PRO</span>}
      </span>
    </div>
  )}

  {/* CONTENIDO */}
  <div style={{flex:1,padding:"20px 16px 104px",overflowY:"auto"}} key={tab} className="up">
    {tab==="calc"      &&<CalcTab/>}
    {tab==="boardfoot" &&<BoardTab catalog={catalog}/>}
    {tab==="projects"  &&<ProjectsTab projects={projects} setProjects={setProjects} catalog={catalog}/>}
    {tab==="catalog"   &&<CatalogTab catalog={catalog} setCatalog={setCatalog}/>}
    {tab==="ref"       &&<RefTab/>}
    {tab==="pro"       &&<ProTab catalog={catalog} projects={projects}/>}
  </div>

  {/* NAV INFERIOR — más grande y fácil de tocar */}
  <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:tab==="pro"?"#111120":C.white,borderTop:`1px solid ${tab==="pro"?"rgba(255,255,255,0.08)":C.border}`,display:"flex",zIndex:30,paddingBottom:"env(safe-area-inset-bottom,10px)",boxShadow:"0 -4px 24px rgba(0,0,0,0.10)",transition:"background .3s"}}>
    {TABS.map(t=>{
      const on=tab===t.id;
      const isPro=t.id==="pro";
      return(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 4px 8px",background:"transparent",border:"none",gap:4,minHeight:62}}>
          <span style={{fontSize:isPro?24:26,lineHeight:1,opacity:on?1:.4,color:isPro&&on?C.proGold:"inherit"}}>{t.icon}</span>
          <span style={{fontSize:11,fontWeight:700,color:on?(isPro?C.proGold:C.amber):tab==="pro"?"#444":C.ink3,letterSpacing:.1}}>{t.label}</span>
          {on&&<div style={{width:24,height:3,borderRadius:2,background:isPro?C.proGold:C.amber}}/>}
        </button>
      );
    })}
  </nav>
</div>


);
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  CALCULAR — Convertir + Taller + Diseño
// ═══════════════════════════════════════════════════════════
function CalcTab(){
const[mode,setMode]=useState(“convert”);
return(
<div>
<div style={{display:“flex”,background:C.white,borderRadius:14,padding:4,marginBottom:16,boxShadow:“0 1px 5px rgba(0,0,0,0.07)”}}>
{[[“convert”,“Convertidor”],[“workshop”,“Calc. Taller”],[“tools”,“Diseño”]].map(([k,l])=>(
<button key={k} onClick={()=>setMode(k)} style={{flex:1,padding:“11px 4px”,borderRadius:11,border:“none”,fontSize:14,fontWeight:600,background:mode===k?C.amber:“transparent”,color:mode===k?C.white:C.ink3,transition:“all .2s”,cursor:“pointer”}}>{l}</button>
))}
</div>
{mode===“convert”  && <CombinedConverter/>}
{mode===“workshop” && <WorkshopMode/>}
{mode===“tools”    && <DesignTools/>}
</div>
);
}

// ── CONVERSOR UNIFICADO — teclado único inteligente ──────────
// Un solo teclado para todo. / activa fracción automáticamente.
// Dígitos aparecen inmediatamente en pantalla.
const CONV_UNITS=[
{id:“mm”,    label:“Milímetros”,         short:“mm”},
{id:“cm”,    label:“Centímetros”,        short:“cm”},
{id:“m”,     label:“Metros”,             short:“m”},
{id:“in”,    label:“Pulgadas (decimal)”, short:‘in”’},
{id:“infrac”,label:“Pulgadas (fracción)”,short:“in ½”},
{id:“ft”,    label:“Pies”,               short:“ft”},
{id:“yd”,    label:“Yardas”,             short:“yd”},
];

function CombinedConverter(){
const[fromU,setFromU]=useState(“in”);
const[toU,  setToU]  =useState(“mm”);
const[showFrom,setShowFrom]=useState(false);
const[showTo,  setShowTo]  =useState(false);

// ── Buffer universal ─────────────────────────────────────
// Para cualquier unidad: buf = dígitos activos
// Para infrac además: ftAcc, inAcc, fracN, slashOn, fracNum, fracDen
const[buf,    setBuf]   =useState(””);
const[ftAcc,  setFtAcc] =useState(0);
const[inAcc,  setInAcc] =useState(0);
const[fracN,  setFracN] =useState(0);
const[slashOn,setSlash] =useState(false);
const[fracNum,setFracNum]=useState(””);
const[fracDen,setFracDen]=useState(””);

const isFrac=fromU===“infrac”;

// ── Valor en pulgadas decimales ──────────────────────────
const inputInches = isFrac
? ftAcc*12 + inAcc + fracN/16 + (slashOn&&fracDen?(parseFloat(fracNum)||0)/(parseFloat(fracDen)||1):0)
: cvt(parseFloat(buf)||0, fromU===“in”||fromU===“ft”||fromU===“yd”||fromU===“mm”||fromU===“cm”||fromU===“m”?fromU:“in”,“in”);

const hasInput = isFrac
? (ftAcc>0||inAcc>0||fracN>0||buf!==””)
: (buf!==””&&buf!==“0”&&buf!==”.”);

// ── Display del valor ingresado ──────────────────────────
function inputDisplay(){
if(isFrac){
// Muestra el buffer activo primero, luego la medida construida
let s=””;
if(ftAcc>0) s+=`${ftAcc} ft `;
if(slashOn){
// fracción manual en progreso
s+=(inAcc>0?${inAcc} `:””)+${fracNum||""}/${fracDen||"_"}"`;
} else if(buf){
// dígitos activos sin confirmar — MOSTRAR INMEDIATAMENTE
s+=buf;
} else {
// medida ya confirmada
if(inAcc>0||fracN>0){
s+=inAcc>0?${inAcc}:””;
if(fracN>0){const g=gcd(fracN,16);s+=(inAcc>0?” “:””)+${fracN/g}/${16/g}";}
else if(inAcc>0) s+=’”’;
}
}
return s||“0”;
}
// Modo normal: mostrar lo que hay en buf
return buf||“0”;
}

// ── Resultado convertido ──────────────────────────────────
function getResult(){
const inches=inputInches;
if(!hasInput) return “—”;
if(toU===“infrac”){
const ft2=Math.floor(inches/12),rem=inches%12;
const inW=Math.floor(rem),fr=Math.round((rem-inW)*16);
const g=fr>0?gcd(fr,16):1;
let s=””;
if(ft2>0)s+=`${ft2}ft `;
if(inW>0||fr>0){s+=inW>0?${inW}:””;if(fr>0)s+=(inW>0?” “:””)+${fr/g}/${16/g}";else s+=’”’;}
return s||“0”;
}
const toId=toU===“in”?“in”:toU;
const r=cvt(inches,“in”,toId);
return ${fmt(r,5)} ${CONV_UNITS.find(u=>u.id===toU)?.short};
}

// ── Acciones del teclado ──────────────────────────────────
function digit(d){
if(isFrac){
if(slashOn) setFracDen(v=>(v+d).slice(0,3));
else        setBuf(v=>(v+d).slice(0,6));   // muestra inmediatamente
} else {
setBuf(v=>{
if(v===“0”||v===””) return d===”.”?“0.”:d;
return (v+d).slice(0,10);
});
}
}

function confirmFt(){
// Confirma pies desde buf
const n=parseFloat(buf)||0;
if(n>0) setFtAcc(n);
setBuf(””); setSlash(false); setFracDen(””); setFracNum(””);
}

function confirmIn(){
if(slashOn){
// Confirma fracción manual num/den
const n=parseFloat(fracNum)||0,d=parseFloat(fracDen)||16;
const n16=Math.round((n/d)*16);
setFracN(v=>v+n16);
setSlash(false); setFracDen(””); setFracNum(””); setBuf(””);
} else {
// Confirma pulgadas enteras desde buf
const n=parseFloat(buf)||0;
if(n>0) setInAcc(n);
setBuf(””); setSlash(false);
}
}

function pressSlash(){
// Activa fracción automáticamente — guarda lo que hay en buf como numerador
setFracNum(buf||“1”);
setBuf(””);
setFracDen(””);
setSlash(true);
}

function addFrac(n16){ setFracN(v=>v+n16); setBuf(””); }

function pressDecimal(){
if(isFrac) return; // no aplica en fracción
setBuf(v=>v.includes(”.”)?v:(v||“0”)+”.”);
}

function backspace(){
if(isFrac){
if(slashOn&&fracDen){ setFracDen(v=>v.slice(0,-1)); return; }
if(slashOn)         { setSlash(false); setFracDen(””); setFracNum(””); return; }
if(buf)             { setBuf(v=>v.slice(0,-1)); return; }
if(fracN>0)         { setFracN(0); return; }
if(inAcc>0)         { setInAcc(0); return; }
if(ftAcc>0)         { setFtAcc(0); return; }
} else {
setBuf(v=>v.slice(0,-1));
}
}

function clearAll(){
setBuf(””); setFtAcc(0); setInAcc(0); setFracN(0);
setSlash(false); setFracDen(””); setFracNum(””);
}

function swapUnits(){
setFromU(toU); setToU(fromU); clearAll();
}

// ── Selector de unidad ───────────────────────────────────
function UPick({value,onChange,open,setOpen,lbl}){
return(
<div style={{flex:1,position:“relative”}}>
<FL>{lbl}</FL>
<button onClick={()=>{setOpen(o=>!o); setShowFrom(false); setShowTo(false); setTimeout(()=>setOpen(o=>!o),0);}}
onPointerDown={e=>{e.stopPropagation();}}
style={{width:“100%”,padding:“11px 12px”,borderRadius:12,
border:1.5px solid ${open?C.amber:C.border},
background:C.field,color:C.ink1,fontSize:14,fontWeight:700,
textAlign:“left”,cursor:“pointer”,display:“flex”,
justifyContent:“space-between”,alignItems:“center”}}>
<span style={{color:value===“infrac”?C.amber:C.ink1}}>
{CONV_UNITS.find(u=>u.id===value)?.short}
</span>
<span style={{color:C.ink3,fontSize:12}}>{open?“▲”:“▼”}</span>
</button>
{open&&(
<div style={{position:“absolute”,top:“calc(100% + 4px)”,left:0,right:0,
background:C.white,borderRadius:12,border:1.5px solid ${C.amber},
zIndex:100,boxShadow:“0 8px 28px rgba(0,0,0,0.14)”,overflow:“hidden”}}>
{CONV_UNITS.map(u=>(
<button key={u.id}
onPointerDown={e=>{e.preventDefault();onChange(u.id);setOpen(false);clearAll();}}
style={{width:“100%”,padding:“13px 16px”,
background:value===u.id?`${C.amber}18`:C.white,
border:“none”,borderBottom:1px solid ${C.border},
textAlign:“left”,fontSize:14,
fontWeight:value===u.id?700:500,
color:value===u.id?C.amber:C.ink2,cursor:“pointer”}}>
{u.label}
{u.id===“infrac”&&<span style={{marginLeft:8,fontSize:11,
color:C.green,fontWeight:700}}>✦ Nuevo</span>}
</button>
))}
</div>
)}
</div>
);
}

const GAP=5;

return(
<div style={{display:“flex”,flexDirection:“column”,
height:“calc(100vh - 215px)”,gap:8,userSelect:“none”,WebkitUserSelect:“none”}}>


  {/* ── PANTALLA FIJA 148px — NUNCA CRECE ── */}
  <div style={{background:"linear-gradient(160deg,#1A1A1C,#252528)",
    borderRadius:18,padding:"12px 14px",flexShrink:0,height:148}}>
    <div style={{display:"flex",gap:10,height:"100%"}}>

      {/* Izq — lo que escribes */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{fontSize:10,color:"#555",fontWeight:700,
          letterSpacing:.8,textTransform:"uppercase"}}>
          {CONV_UNITS.find(u=>u.id===fromU)?.label}
        </div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,fontFamily:"monospace",
          letterSpacing:-.5,lineHeight:1,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {inputDisplay()}
        </div>
        <div style={{fontSize:10,color:"#555",fontFamily:"monospace",minHeight:14}}>
          {hasInput&&isFrac&&`${fmt(inputInches,4)}" = ${fmt(cvt(inputInches,"in","mm"),2)}mm`}
          {hasInput&&fromU==="in"&&buf&&toFrac(parseFloat(buf)||0,16)}
        </div>
      </div>

      <div style={{width:1,background:"rgba(255,255,255,0.08)",flexShrink:0}}/>

      {/* Der — resultado */}
      <div style={{width:118,flexShrink:0,display:"flex",flexDirection:"column",gap:5}}>
        <div style={{fontSize:10,color:"#555",fontWeight:700,
          letterSpacing:.8,textTransform:"uppercase"}}>
          {CONV_UNITS.find(u=>u.id===toU)?.label}
        </div>
        <div style={{flex:1,
          background:hasInput?`linear-gradient(135deg,${C.amber},#9A6005)`:"rgba(255,255,255,0.05)",
          borderRadius:12,padding:"8px",textAlign:"center",
          display:"flex",flexDirection:"column",justifyContent:"center",
          transition:"background .2s"}}>
          <div style={{fontSize:toU==="infrac"?15:22,fontWeight:900,
            color:hasInput?C.white:"#333",
            letterSpacing:-.5,lineHeight:1.2,fontFamily:"monospace",
            wordBreak:"break-word"}}>
            {hasInput?getResult():"—"}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* ── SELECTORES DE UNIDAD ── */}
  <div style={{display:"flex",gap:8,alignItems:"flex-start",
    flexShrink:0,position:"relative",zIndex:50}}>
    <UPick value={fromU} onChange={v=>{setFromU(v);clearAll();}}
      open={showFrom}
      setOpen={v=>{ setShowTo(false); setShowFrom(v); }}
      lbl="De"/>
    <button onPointerDown={e=>{e.preventDefault();swapUnits();}}
      style={{width:42,height:42,borderRadius:12,background:C.amber,
        border:"none",fontSize:18,color:C.white,fontWeight:700,
        flexShrink:0,marginTop:22,boxShadow:`0 3px 10px ${C.amber}55`,cursor:"pointer"}}>⇄</button>
    <UPick value={toU} onChange={v=>{setToU(v);}}
      open={showTo}
      setOpen={v=>{ setShowFrom(false); setShowTo(v); }}
      lbl="A"/>
  </div>

  {/* ── TECLADO ÚNICO — siempre igual, flex:1 ── */}
  <div style={{flex:1,background:"#EDEAE5",borderRadius:18,padding:"8px",
    display:"flex",flexDirection:"column",gap:GAP,overflow:"hidden"}}
    onPointerDown={()=>{ setShowFrom(false); setShowTo(false); }}>

    {/* Fila 1: 7 8 9 ⌫ */}
    <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
      {["7","8","9"].map(d=>(
        <KB2 key={d} label={d} onPress={()=>digit(d)} style={{height:"100%",fontSize:20}}/>
      ))}
      <KB2 label="⌫" onPress={backspace} bg="#D4CEC7" color={C.ink2} style={{height:"100%",fontSize:18}}/>
    </div>

    {/* Fila 2: 4 5 6 / */}
    <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
      {["4","5","6"].map(d=>(
        <KB2 key={d} label={d} onPress={()=>digit(d)} style={{height:"100%",fontSize:20}}/>
      ))}
      <KB2 label="/" onPress={pressSlash}
        bg={slashOn?C.amber:"#D4CEC7"}
        color={slashOn?C.white:C.amber}
        style={{height:"100%",fontSize:22,fontWeight:900,
          boxShadow:slashOn?`0 3px 10px ${C.amber}44`:"none"}}/>
    </div>

    {/* Fila 3: 1 2 3 C */}
    <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
      {["1","2","3"].map(d=>(
        <KB2 key={d} label={d} onPress={()=>digit(d)} style={{height:"100%",fontSize:20}}/>
      ))}
      <KB2 label="C" onPress={clearAll}
        bg={`${C.red}15`} color={C.red}
        style={{height:"100%",border:`1.5px solid ${C.red}33`}}/>
    </div>

    {/* Fila 4: ft  in"  .  0 */}
    <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
      <KB2 label="ft" onPress={confirmFt}
        bg={C.amber} color={C.white}
        style={{height:"100%",fontSize:16,letterSpacing:.5}}/>
      <KB2 label='in "' onPress={confirmIn}
        bg={C.amber} color={C.white}
        style={{height:"100%",fontSize:15}}/>
      <KB2 label="." onPress={pressDecimal}
        bg={isFrac?"#D4CEC7":C.white}
        color={isFrac?C.ink4:C.ink1}
        style={{height:"100%",fontSize:20}}/>
      <KB2 label="0" onPress={()=>digit("0")} style={{height:"100%",fontSize:20}}/>
    </div>

    {/* Fila 5: fracciones rápidas ¼ ½ ¾ + fracción activa */}
    <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
      {[[4,"¼"],[8,"½"],[12,"¾"],[2,"⅛"]].map(([n16,lbl])=>(
        <KB2 key={lbl} label={lbl} onPress={()=>addFrac(n16)}
          bg={`${C.amber}18`} color={C.amber}
          style={{height:"100%",fontSize:18,
            border:`1px solid ${C.amberBd}`,
            boxShadow:fracN===n16?`0 2px 8px ${C.amber}33`:"none"}}/>
      ))}
    </div>

    {/* Indicador fracción acumulada */}
    {(fracN>0||slashOn)&&(
      <div style={{flexShrink:0,background:`${C.amber}15`,borderRadius:10,
        padding:"5px 10px",textAlign:"center",
        border:`1px solid ${C.amberBd}`}}>
        <span style={{fontSize:12,color:C.amber,fontWeight:700,fontFamily:"monospace"}}>
          {slashOn
            ?`Fracción: ${fracNum||"?"}/${fracDen||"_"}" — presiona in" para confirmar`
            :`+${(()=>{const g=gcd(fracN,16);return `${fracN/g}/${16/g}"`;})()}`
          }
        </span>
      </div>
    )}
  </div>
</div>


);
}

function KB2({label,onPress,bg,color,style:st}){
return(
<button onPointerDown={e=>{e.preventDefault();onPress();}}
style={{borderRadius:11,border:“none”,cursor:“pointer”,fontWeight:800,
lineHeight:1,userSelect:“none”,WebkitUserSelect:“none”,
display:“flex”,alignItems:“center”,justifyContent:“center”,
fontSize:17,background:bg||C.white,color:color||C.ink1,
boxShadow:“0 1px 3px rgba(0,0,0,0.09)”,
transition:“opacity .1s”,…(st||{})}}>
{label}
</button>
);
}

function CombinedConverter(){
const[fromU, setFromU] = useState(“in”);
const[toU,   setToU]   = useState(“mm”);
const[showFrom,setShowFrom] = useState(false);
const[showTo,  setShowTo]   = useState(false);

// Buffer numérico
const[buf,    setBuf]   = useState(””);
const[ftAcc,  setFtAcc] = useState(0);
const[inAcc,  setInAcc] = useState(0);
const[fracN,  setFracN] = useState(0);
const[slashOn,setSlash] = useState(false);
const[fracNum,setFracNum]= useState(””);
const[fracDen,setFracDen]= useState(””);

// ── Valor en pulgadas decimales ──────────────────────────
function getInputInches(){
if(fromU===“infrac”) return ftAcc*12 + inAcc + fracN/16;
const n = parseFloat(buf)||0;
return cvt(n, fromU===“in”?fromU:fromU, “in”);
}
const inputInches = getInputInches();
const hasInput = fromU===“infrac” ? inputInches>0 : (buf!==””&&parseFloat(buf)!==0);

// ── Resultado ────────────────────────────────────────────
function getResult(){
const inches = inputInches;
if(toU===“infrac”){
const total = inches;
const ft = Math.floor(total/12);
const rem = total%12;
const inW = Math.floor(rem);
const frac = Math.round((rem-inW)*16);
const g = frac>0?gcd(frac,16):1;
let s = “”;
if(ft>0) s+=`${ft} ft `;
if(inW>0||frac>0){
s+=inW>0?${inW}:””;
if(frac>0) s+=(inW>0?” “:””)+${frac/g}/${16/g}";
else s+=’”’;
}
return s||“0”;
}
if(toU===“in”) return fmt(cvt(inches,“in”,“in”),5)+’”’;
return fmt(cvt(inches,“in”,toU),5)+” “+CONV_UNITS.find(u=>u.id===toU)?.short;
}

// ── Display del valor ingresado ──────────────────────────
function inputDisplay(){
if(fromU===“infrac”){
const parts=[];
if(ftAcc>0) parts.push(${ftAcc} ft);
if(inAcc>0||fracN>0){
let s=inAcc>0?${inAcc}:””;
if(fracN>0){const g=gcd(fracN,16);s+=(s?” “:””)+${fracN/g}/${16/g}";}
else s+=’”’;
parts.push(s);
}
if(slashOn) return (fracNum||”?”)+”/”+( fracDen||”_”)+’”’;
return parts.length?parts.join(” “):“0”;
}
return buf||“0”;
}

// ── Teclado — dígito ─────────────────────────────────────
function digit(d){
if(fromU===“infrac”){
if(slashOn) setFracDen(v=>(v+d).slice(0,3));
else setBuf(v=>(v===“0”?””:v+d).slice(0,6));
} else {
setBuf(v=>(v+d).replace(/^0+(?=\d)/,””).slice(0,8));
}
}

// ── Confirmar ft / in ────────────────────────────────────
function confirmFt(){
const n=parseFloat(buf)||0;
if(n>0)setFtAcc(n);
setBuf(””); setSlash(false); setFracDen(””); setFracNum(””);
}
function confirmIn(){
if(slashOn){
const n=parseFloat(fracNum)||0,d=parseFloat(fracDen)||16;
setFracN(v=>v+Math.round((n/d)*16));
setSlash(false);setFracDen(””);setFracNum(””);setBuf(””);
} else {
const n=parseFloat(buf)||0;
if(n>0)setInAcc(n);
setBuf(””);setSlash(false);
}
}
function slash(){ setFracNum(buf||“1”); setBuf(””); setFracDen(””); setSlash(true); }

function addFrac(n16){ setFracN(v=>v+n16); }
function backspace(){
if(fromU===“infrac”){
if(slashOn){setFracDen(v=>v.slice(0,-1));return;}
if(buf){setBuf(v=>v.slice(0,-1));return;}
if(fracN>0){setFracN(0);return;}
if(inAcc>0){setInAcc(0);return;}
if(ftAcc>0){setFtAcc(0);return;}
} else {
setBuf(v=>v.slice(0,-1));
}
}
function clearAll(){
setBuf(””); setFtAcc(0); setInAcc(0); setFracN(0);
setSlash(false); setFracDen(””); setFracNum(””);
}
function swapUnits(){
setFromU(toU); setToU(fromU); clearAll();
}

// ── Selector de unidad ───────────────────────────────────
function UnitPicker({value, onChange, open, setOpen, label}){
return(
<div style={{flex:1,position:“relative”}}>
<FL>{label}</FL>
<button onClick={()=>setOpen(o=>!o)} style={{
width:“100%”,padding:“11px 12px”,borderRadius:12,
border:1.5px solid ${open?C.amber:C.border},
background:C.field,color:C.ink1,fontSize:14,fontWeight:700,
textAlign:“left”,cursor:“pointer”,display:“flex”,
justifyContent:“space-between”,alignItems:“center”,
}}>
<span>{CONV_UNITS.find(u=>u.id===value)?.short}</span>
<span style={{color:C.ink3,fontSize:12}}>{open?“▲”:“▼”}</span>
</button>
{open&&(
<div style={{position:“absolute”,top:“100%”,left:0,right:0,background:C.white,
borderRadius:12,border:1.5px solid ${C.amber},zIndex:50,
boxShadow:“0 8px 24px rgba(0,0,0,0.12)”,overflow:“hidden”,marginTop:4}}>
{CONV_UNITS.map(u=>(
<button key={u.id} onClick={()=>{onChange(u.id);setOpen(false);clearAll();}}
style={{width:“100%”,padding:“12px 14px”,background:value===u.id?`${C.amber}15`:C.white,
border:“none”,borderBottom:1px solid ${C.border},textAlign:“left”,
fontSize:14,fontWeight:value===u.id?700:500,
color:value===u.id?C.amber:C.ink2,cursor:“pointer”}}>
{u.label}
{u.id===“infrac”&&<span style={{marginLeft:8,fontSize:11,color:C.green,fontWeight:700}}>Nuevo ✦</span>}
</button>
))}
</div>
)}
</div>
);
}

const isFracInput = fromU===“infrac”;
const GAP = 5;

return(
<div style={{display:“flex”,flexDirection:“column”,height:“calc(100vh - 215px)”,gap:8}}>


  {/* ── PANTALLA FIJA ── */}
  <div style={{background:"linear-gradient(160deg,#1A1A1C,#252528)",borderRadius:18,
    padding:"12px 14px",flexShrink:0,height:148}}>
    <div style={{display:"flex",gap:10,height:"100%"}}>

      {/* Izq — input */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>
          {CONV_UNITS.find(u=>u.id===fromU)?.label}
        </div>
        <div style={{fontSize:28,fontWeight:900,color:C.white,fontFamily:"monospace",
          letterSpacing:-.5,lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {inputDisplay()}
        </div>
        {hasInput&&isFracInput&&(
          <div style={{display:"flex",gap:8}}>
            <span style={{fontSize:10,color:"#888",fontFamily:"monospace"}}>{fmt(inputInches,4)}"</span>
            <span style={{fontSize:10,color:"#5B9BD5",fontFamily:"monospace"}}>{fmt(cvt(inputInches,"in","mm"),1)}mm</span>
          </div>
        )}
        {hasInput&&!isFracInput&&(
          <div style={{fontSize:10,color:"#666",fontFamily:"monospace"}}>
            {fromU==="in"?toFrac(parseFloat(buf)||0,16):""}
          </div>
        )}
      </div>

      <div style={{width:1,background:"rgba(255,255,255,0.08)",flexShrink:0}}/>

      {/* Der — resultado */}
      <div style={{width:120,flexShrink:0,display:"flex",flexDirection:"column",gap:5}}>
        <div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:.8,textTransform:"uppercase"}}>
          {CONV_UNITS.find(u=>u.id===toU)?.label}
        </div>
        <div style={{flex:1,background:hasInput?`linear-gradient(135deg,${C.amber},#9A6005)`:"rgba(255,255,255,0.05)",
          borderRadius:12,padding:"8px",textAlign:"center",
          display:"flex",flexDirection:"column",justifyContent:"center",
          transition:"background .2s"}}>
          {hasInput?(
            <>
              <div style={{fontSize:toU==="infrac"?16:22,fontWeight:900,color:C.white,
                letterSpacing:-.5,lineHeight:1.1,fontFamily:"monospace",wordBreak:"break-all"}}>
                {getResult()}
              </div>
            </>
          ):(
            <div style={{fontSize:11,color:"#333"}}>—</div>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* ── SELECTORES DE UNIDAD ── */}
  <div style={{display:"flex",gap:8,alignItems:"flex-start",flexShrink:0,position:"relative",zIndex:40}}>
    <UnitPicker value={fromU} onChange={setFromU} open={showFrom} setOpen={setShowFrom} label="De"/>
    <button onClick={swapUnits} style={{width:42,height:42,borderRadius:12,background:C.amber,
      border:"none",fontSize:18,color:C.white,fontWeight:700,flexShrink:0,marginTop:22,
      boxShadow:`0 3px 10px ${C.amber}55`,cursor:"pointer"}}>⇄</button>
    <UnitPicker value={toU} onChange={setToU} open={showTo} setOpen={setShowTo} label="A"/>
  </div>

  {/* ── TECLADO PROPIO — ocupa todo el resto ── */}
  <div style={{flex:1,background:"#EDEAE5",borderRadius:18,padding:"8px",
    display:"flex",flexDirection:"column",gap:GAP,overflow:"hidden"}}>

    {/* Fila fracción — solo si fromU es infrac */}
    {isFracInput&&(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:GAP,flex:"0 0 auto"}}>
        <KB2 label="ft"    onPress={confirmFt}    bg={C.amber}       color={C.white} style={{fontSize:14}}/>
        <KB2 label='in "'  onPress={confirmIn}    bg={C.amber}       color={C.white} style={{fontSize:13}}/>
        <KB2 label="/"     onPress={slash}        bg="#D4CEC7"       color={C.amber} style={{fontSize:18}}/>
        <KB2 label="¼"    onPress={()=>addFrac(4)} bg={`${C.amber}18`} color={C.amber} style={{fontSize:15,border:`1px solid ${C.amberBd}`}}/>
        <KB2 label="½"    onPress={()=>addFrac(8)} bg={`${C.amber}18`} color={C.amber} style={{fontSize:15,border:`1px solid ${C.amberBd}`}}/>
        <KB2 label="¹⁄₁₆" onPress={()=>addFrac(1)} bg={`${C.amber}18`} color={C.amber} style={{fontSize:12,border:`1px solid ${C.amberBd}`}}/>
      </div>
    )}

    {/* Filas numéricas */}
    {[["7","8","9"],["4","5","6"],["1","2","3"]].map(row=>(
      <div key={row[0]} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP,flex:1}}>
        {row.map(d=><KB2 key={d} label={d} onPress={()=>digit(d)} style={{height:"100%"}}/>)}
        {row[0]==="7"&&<KB2 label="⌫" onPress={backspace} bg="#D4CEC7" color={C.ink2} style={{height:"100%"}}/>}
        {row[0]==="4"&&<KB2 label={isFracInput?"¼":"."} onPress={isFracInput?()=>addFrac(4):()=>{if(!buf.includes("."))digit(".");}} bg={isFracInput?`${C.amber}18`:C.white} color={isFracInput?C.amber:C.ink1} style={{height:"100%",fontSize:isFracInput?16:18,border:isFracInput?`1px solid ${C.amberBd}`:"none"}}/>}
        {row[0]==="1"&&<KB2 label={isFracInput?"½":"C"} onPress={isFracInput?()=>addFrac(8):clearAll} bg={isFracInput?`${C.amber}18`:`${C.red}15`} color={isFracInput?C.amber:C.red} style={{height:"100%",fontSize:isFracInput?16:15,border:isFracInput?`1px solid ${C.amberBd}`:`1.5px solid ${C.red}33`}}/>}
      </div>
    ))}

    {/* Última fila: . 0 C */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP,flex:1}}>
      <KB2 label="." onPress={()=>{if(!isFracInput&&!buf.includes("."))digit(".");}} bg={isFracInput?"#D8D0C8":C.white} color={isFracInput?C.ink4:C.ink1} style={{height:"100%"}}/>
      <KB2 label="0" onPress={()=>digit("0")} style={{height:"100%"}}/>
      <KB2 label={isFracInput?"¾":""} onPress={isFracInput?()=>addFrac(12):()=>{}} bg={isFracInput?`${C.amber}18`:"transparent"} color={isFracInput?C.amber:C.white} style={{height:"100%",fontSize:16,border:isFracInput?`1px solid ${C.amberBd}`:"none"}}/>
      <KB2 label="C" onPress={clearAll} bg={`${C.red}15`} color={C.red} style={{height:"100%",border:`1.5px solid ${C.red}33`}}/>
    </div>
  </div>
</div>


);
}

// Botón del teclado del conversor
function KB2({label,onPress,bg,color,style:st}){
return(
<button onPointerDown={e=>{e.preventDefault();onPress();}}
style={{borderRadius:11,border:“none”,cursor:“pointer”,fontWeight:800,
lineHeight:1,userSelect:“none”,WebkitUserSelect:“none”,
display:“flex”,alignItems:“center”,justifyContent:“center”,
fontSize:17,background:bg||C.white,color:color||C.ink1,
boxShadow:“0 1px 3px rgba(0,0,0,0.09)”,
transition:“opacity .1s”,…(st||{})}}>
{label}
</button>
);
}

// ── MODO TALLER — Calculadora de construcción completa ───────
// Flujo: dígitos → ft|in|/ → operación +−×÷ → más medidas → =
// Todo en pantalla fija, sin scroll, sin teclado del sistema
function WorkshopMode(){
// ── Estado ────────────────────────────────────────────────
const[buf,    setBuf]   = useState(””);   // dígitos activos
const[ftAcc,  setFtAcc] = useState(0);   // pies del número actual
const[inAcc,  setInAcc] = useState(0);   // pulgadas del número actual
const[fracN,  setFracN] = useState(0);   // 16avos del número actual
const[slashOn,setSlash] = useState(false);
const[fracNum,setFracNum]= useState(””);
const[fracDen,setFracDen]= useState(””);
const[memory, setMemory] = useState(0);  // acumulador de operaciones
const[op,     setOp]    = useState(null);// operación pendiente: + - × ÷
const[tape,   setTape]  = useState([]);  // historial de cinta
const[to,     setTo]    = useState(“mm”);
const[justEq, setJustEq]= useState(false);// acabamos de presionar =

// ── Valor del número actual en pulgadas ──────────────────
const currentIn = ftAcc*12 + inAcc + fracN/16;

// ── Display del número actual ────────────────────────────
function numDisplay(){
if(slashOn) return fracNum+(fracDen?/${fracDen}:”/_”);
if(buf) return buf;
const parts=[];
if(ftAcc>0) parts.push(${ftAcc}ft);
if(inAcc>0||fracN>0){
let s=inAcc>0?${inAcc}:””;
if(fracN>0){const g=gcd(fracN,16);s+=(s?” “:””)+${fracN/g}/${16/g}";}
else s+=’”’;
parts.push(s);
}
return parts.length?parts.join(” “):“0”;
}

// ── Display de la cinta (historial) ──────────────────────
function tapeDisplay(){
if(!tape.length&&!op) return numDisplay();
let s=tape.map(t=>${t.label} ${t.op}).join(” “);
if(op) s+=” “+numDisplay();
return s||numDisplay();
}

// ── Resultado acumulado ───────────────────────────────────
function calcResult(){
if(!op) return currentIn;
if(op===”+”) return memory+currentIn;
if(op===”-”) return memory-currentIn;
if(op===“×”) return memory*currentIn;
if(op===“÷”) return currentIn!==0?memory/currentIn:memory;
return currentIn;
}
const result    = calcResult();
const hasResult = result>0||tape.length>0||op!==null;
const resConverted = cvt(result,“in”,to);

// ── Dígito ───────────────────────────────────────────────
function digit(d){
if(justEq){ clearAll(); }
if(slashOn){ setFracDen(v=>(v+d).slice(0,3)); return; }
setBuf(v=>(v===“0”?””:v+d).slice(0,6));
}

// ── Confirmar PIES ───────────────────────────────────────
function confirmFt(){
const n=parseFloat(buf)||0;
if(n>0){ setFtAcc(n); }
setBuf(””); setSlash(false); setFracDen(””); setFracNum(””);
setJustEq(false);
}

// ── Confirmar PULGADAS ───────────────────────────────────
function confirmIn(){
if(slashOn){
const n=parseFloat(fracNum)||0;
const d=parseFloat(fracDen)||16;
setFracN(v=>v+Math.round((n/d)*16));
setSlash(false); setFracDen(””); setFracNum(””); setBuf(””);
} else {
const n=parseFloat(buf)||0;
if(n>0) setInAcc(n);
setBuf(””); setSlash(false);
}
setJustEq(false);
}

// ── Slash fracción manual ─────────────────────────────────
function slash(){
setFracNum(buf||“1”); setBuf(””); setFracDen(””); setSlash(true);
}

// ── Fracciones rápidas acumulables ───────────────────────
function addFrac(n16){ setFracN(v=>v+n16); setJustEq(false); }

// ── Operación matemática ──────────────────────────────────
function pressOp(o){
if(currentIn===0&&memory===0) return;
const cur=currentIn||0;
let newMem=memory;
if(op&&cur>0){
if(op===”+”) newMem=memory+cur;
else if(op===”-”) newMem=memory-cur;
else if(op===“×”) newMem=memory*cur;
else if(op===“÷”) newMem=cur!==0?memory/cur:memory;
} else {
newMem=cur>0?cur:memory;
}
const lbl=numDisplay();
if(lbl!==“0”) setTape(t=>[…t,{label:lbl,op:o,val:cur}]);
setMemory(newMem);
setOp(o);
setFtAcc(0); setInAcc(0); setFracN(0);
setBuf(””); setSlash(false); setFracDen(””); setFracNum(””);
setJustEq(false);
}

// ── Igual ─────────────────────────────────────────────────
function pressEqual(){
const res=calcResult();
const lbl=numDisplay();
setTape(t=>[…t,{label:lbl,op:”=”,val:currentIn}]);
// resultado se convierte en nuevo valor
const ftR=Math.floor(res/12);
const inR=parseFloat((res%12).toFixed(6));
setFtAcc(ftR); setInAcc(Math.floor(inR));
setFracN(Math.round((inR%1)*16));
setMemory(0); setOp(null);
setBuf(””); setSlash(false); setFracDen(””); setFracNum(””);
setJustEq(true);
}

// ── Borrar ────────────────────────────────────────────────
function backspace(){
if(slashOn){ setFracDen(v=>v.slice(0,-1)); return; }
if(buf){ setBuf(v=>v.slice(0,-1)); return; }
if(fracN>0){ setFracN(0); return; }
if(inAcc>0){ setInAcc(0); return; }
if(ftAcc>0){ setFtAcc(0); return; }
}

// ── Limpiar todo ──────────────────────────────────────────
function clearAll(){
setBuf(””); setFtAcc(0); setInAcc(0); setFracN(0);
setSlash(false); setFracDen(””); setFracNum(””);
setMemory(0); setOp(null); setTape([]); setJustEq(false);
}

// ── Botón ─────────────────────────────────────────────────
function KB({label,onPress,bg,color,style:st}){
return(
<button onPointerDown={e=>{e.preventDefault();onPress();}}
style={{borderRadius:12,border:“none”,cursor:“pointer”,fontWeight:800,
lineHeight:1,userSelect:“none”,WebkitUserSelect:“none”,
display:“flex”,alignItems:“center”,justifyContent:“center”,
fontSize:15,height:46,
background:bg||C.white,color:color||C.ink1,
boxShadow:“0 1px 3px rgba(0,0,0,0.1)”,
transition:“opacity .1s”,…(st||{})}}>
{label}
</button>
);
}

// ── Fracción simplificada para display ───────────────────
function fracLabel(n16){
if(n16===0) return “0”;
const g=gcd(n16,16);
return ${n16/g}/${16/g}";
}

// altura de fila del teclado — calculada para llenar pantalla sin scroll
const ROW = “calc((100vh - 340px) / 8)”;
const GAP = 5;

return(
<div style={{
userSelect:“none”, WebkitUserSelect:“none”,
display:“flex”, flexDirection:“column”,
height:“calc(100vh - 200px)”,  // total disponible
gap:8,
}}>


  {/* ══ PANTALLA FIJA — nunca cambia de tamaño ════════════ */}
  <div style={{
    background:"linear-gradient(160deg,#1A1A1C,#252528)",
    borderRadius:18, padding:"14px 16px",
    flexShrink:0,    // NUNCA encoge ni crece
    height:160,      // altura fija siempre
  }}>
    <div style={{display:"flex",gap:12,height:"100%"}}>

      {/* Izquierda — entrada */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div>
          {/* Cinta */}
          <div style={{fontSize:10,color:"#555",fontFamily:"monospace",lineHeight:1.5,minHeight:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {tape.slice(-2).map((t,i)=>(
              <span key={i}>{t.label} <span style={{color:C.amber}}>{t.op}</span>{" "}</span>
            ))}
          </div>
          {/* Op pendiente */}
          <div style={{fontSize:11,color:C.amber,fontWeight:700,minHeight:16}}>
            {op||""}
          </div>
          {/* Número actual — grande */}
          <div style={{fontSize:30,fontWeight:900,color:C.white,fontFamily:"monospace",letterSpacing:-.5,lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {numDisplay()}
          </div>
        </div>
        {/* Equivalencias siempre visibles */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{currentIn>0?fmt(currentIn,3)+'"':''}</span>
          <span style={{fontSize:10,color:"#5B9BD5",fontFamily:"monospace"}}>{currentIn>0?fmt(cvt(currentIn,"in","mm"),1)+"mm":''}</span>
          <span style={{fontSize:10,color:"#6DBF82",fontFamily:"monospace"}}>{currentIn>0?fmt(cvt(currentIn,"in","cm"),2)+"cm":''}</span>
        </div>
      </div>

      {/* Divisor */}
      <div style={{width:1,background:"rgba(255,255,255,0.08)",flexShrink:0}}/>

      {/* Derecha — resultado, siempre presente */}
      <div style={{width:118,flexShrink:0,display:"flex",flexDirection:"column",gap:6}}>
        {/* Selector unidad */}
        <select value={to} onChange={e=>setTo(e.target.value)}
          style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",
            borderRadius:8,padding:"5px 6px",color:C.white,fontSize:11,
            fontWeight:700,outline:"none",cursor:"pointer",width:"100%"}}>
          {UNITS.map(u=><option key={u} value={u} style={{background:"#1A1A1C"}}>{UL[u]}</option>)}
        </select>
        {/* Resultado — caja siempre visible, cambia color cuando hay valor */}
        <div style={{
          flex:1,
          background:hasResult
            ?`linear-gradient(135deg,${C.amber},#9A6005)`
            :"rgba(255,255,255,0.05)",
          borderRadius:12,padding:"10px 8px",
          textAlign:"center",
          display:"flex",flexDirection:"column",justifyContent:"center",
          transition:"background .2s",
        }}>
          <div style={{fontSize:24,fontWeight:900,color:hasResult?C.white:"#333",
            letterSpacing:-.5,lineHeight:1,fontFamily:"monospace"}}>
            {hasResult?fmt(resConverted,3):"—"}
          </div>
          <div style={{fontSize:10,color:hasResult?"rgba(255,255,255,.65)":"#333",marginTop:3}}>
            {US[to]}
          </div>
        </div>
        {/* Fracción acumulada — siempre en su espacio */}
        <div style={{
          height:22,
          background:fracN>0?`${C.amber}22`:"transparent",
          borderRadius:8,
          display:"flex",alignItems:"center",justifyContent:"center",
          border:fracN>0?`1px solid ${C.amber}44`:"1px solid transparent",
          transition:"all .15s",
        }}>
          {fracN>0&&<span style={{fontSize:11,color:C.amber,fontWeight:800,fontFamily:"monospace"}}>+{fracLabel(fracN)}</span>}
        </div>
      </div>
    </div>
  </div>

  {/* ══ TECLADO FIJO — ocupa todo el espacio restante ═════ */}
  <div style={{
    flex:1,           // toma todo el espacio que sobre
    background:"#EDEAE5",
    borderRadius:18,
    padding:"8px",
    display:"flex",
    flexDirection:"column",
    gap:GAP,
    boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
    overflow:"hidden",
  }}>
    {/* Cada fila usa flex:1 para distribuirse uniformemente */}
    {[
      // [label, onPress, bg, color, extraStyle]
      [
        ["ft",   confirmFt,          C.amber,          C.white,  {fontSize:16}],
        ['in "', confirmIn,          C.amber,          C.white,  {fontSize:14}],
        ["/",    slash,              "#D4CEC7",        C.amber,  {fontSize:20}],
        ["⌫",   backspace,          "#D4CEC7",        C.ink2,   {}],
        ["C",    clearAll,           `${C.red}18`,     C.red,    {border:`1.5px solid ${C.red}33`}],
      ],
      [
        ["¹⁄₁₆", ()=>addFrac(1),   `${C.amber}18`,   C.amber,  {border:`1px solid ${C.amberBd}`,fontSize:13}],
        ["⅛",    ()=>addFrac(2),   `${C.amber}18`,   C.amber,  {border:`1px solid ${C.amberBd}`,fontSize:15}],
        ["¼",    ()=>addFrac(4),   `${C.amber}18`,   C.amber,  {border:`1px solid ${C.amberBd}`,fontSize:15}],
        ["½",    ()=>addFrac(8),   `${C.amber}18`,   C.amber,  {border:`1px solid ${C.amberBd}`,fontSize:15}],
        ["¾",    ()=>addFrac(12),  `${C.amber}18`,   C.amber,  {border:`1px solid ${C.amberBd}`,fontSize:15}],
      ],
    ].map((row,ri)=>(
      <div key={ri} style={{flex:1,display:"grid",gridTemplateColumns:`repeat(${row.length},1fr)`,gap:GAP}}>
        {row.map(([lbl,fn,bg,col,st])=>(
          <KB key={lbl} label={lbl} onPress={fn} bg={bg} color={col} style={{height:"100%",...(st||{})}}/>
        ))}
      </div>
    ))}

    {/* Filas numéricas con operaciones */}
    {[
      [["7","8","9"],["÷","÷"]],
      [["4","5","6"],["×","×"]],
      [["1","2","3"],["−","-"]],
    ].map(([digits,[opLbl,opKey]],ri)=>(
      <div key={opLbl} style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
        {digits.map(d=><KB key={d} label={d} onPress={()=>digit(d)} style={{height:"100%"}}/>)}
        <KB label={opLbl} onPress={()=>pressOp(opKey)}
          bg={op===opKey?"#7A5528":C.white}
          color={op===opKey?C.white:"#8B6340"}
          style={{fontSize:20,height:"100%"}}/>
      </div>
    ))}

    {/* Última fila: . 0 = + */}
    <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
      <KB label="." onPress={()=>{if(!buf.includes("."))digit(".");}} style={{height:"100%"}}/>
      <KB label="0" onPress={()=>digit("0")} style={{height:"100%"}}/>
      <KB label="=" onPress={pressEqual}
        bg={C.amber} color={C.white}
        style={{fontSize:22,height:"100%",boxShadow:`0 3px 14px ${C.amber}55`}}/>
      <KB label="+" onPress={()=>pressOp("+")}
        bg={op==="+"?"#7A5528":C.white}
        color={op==="+"?C.white:"#8B6340"}
        style={{fontSize:22,height:"100%"}}/>
    </div>
  </div>

</div>


);
}

// ── FRACCIONES ───────────────────────────────────────────────
// ── DISEÑO ───────────────────────────────────────────────────
function DesignTools(){
const[tool,setTool]=useState(“spacing”);
const[tl,setTl]=useState(48),[ni,setNi]=useState(4),[iw,setIw]=useState(1.5),[us,setUs]=useState(“in”);
const totalIn=cvt(tl,us,“in”),iwIn=cvt(iw,us,“in”);
const gap=ni>0?(totalIn-ni*iwIn)/(ni+1):0;
const positions=Array.from({length:ni},(_,i)=>gap+i*(gap+iwIn));
const PHI=1.61803398875;
const[gv,setGv]=useState(24),[gu,setGu]=useState(“in”);
const gIn=cvt(+gv,gu,“in”);
const[a,setA]=useState(3),[b,setB]=useState(4);
const hyp=Math.sqrt(a*a+b*b),ang=Math.atan(b/a)*180/Math.PI;
return(
<div>
<div style={{display:“flex”,gap:8,marginBottom:20,flexWrap:“wrap”}}>
{[[“spacing”,“Espaciado”],[“golden”,“Razón áurea”],[“tri”,“Triángulo”]].map(([k,l])=>(
<button key={k} onClick={()=>setTool(k)} style={{padding:“9px 18px”,borderRadius:20,border:1.5px solid ${tool===k?C.amber:C.border},background:tool===k?${C.amber}18:“transparent”,color:tool===k?C.amber:C.ink3,fontWeight:600,fontSize:14,cursor:“pointer”}}>{l}</button>
))}
</div>
{tool===“spacing”&&(
<div style={K.card}>
<CL>Espaciado uniforme</CL>
<p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>Para estantes, balusters, tornillos — distribución equidistante automática.</p>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:12}}>
<div><FL>Largo total</FL><input type=“number” inputMode=“decimal” value={tl} onChange={e=>setTl(+e.target.value)} style={K.inp}/></div>
<div><FL>Unidad</FL><select value={us} onChange={e=>setUs(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{US[u]}</option>)}</select></div>
<div><FL>Cantidad de elementos</FL><input type=“number” inputMode=“numeric” value={ni} onChange={e=>setNi(Math.max(1,+e.target.value))} min={1} style={K.inp}/></div>
<div><FL>Ancho de cada uno</FL><input type=“number” inputMode=“decimal” value={iw} onChange={e=>setIw(+e.target.value)} step=”.125” style={K.inp}/></div>
</div>
{gap>0?(
<>
<MR top={${fmt(cvt(gap,"in",us),4)} ${US[us]}} bot={${toFrac(gap,16)} — ${ni+1} espacios iguales}/>
<FL style={{marginTop:16}}>Centro de cada elemento desde el inicio</FL>
<div style={{display:“flex”,flexWrap:“wrap”,gap:8,marginTop:8}}>
{positions.map((p,i)=>(
<div key={i} style={{background:C.field,borderRadius:10,padding:“8px 12px”,textAlign:“center”,minWidth:72}}>
<div style={{fontSize:11,color:C.ink3}}>#{i+1}</div>
<div style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:“monospace”}}>{toFrac(p,16)}</div>
<div style={{fontSize:11,color:C.ink3}}>{fmt(cvt(p,“in”,us),3)} {US[us]}</div>
</div>
))}
</div>
</>
):<p style={{color:C.red,fontSize:14,marginTop:12}}>⚠️ Los elementos son más anchos que el espacio.</p>}
</div>
)}
{tool===“golden”&&(
<div style={K.card}>
<CL>Razón áurea φ = 1.618</CL>
<p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>La proporción más armoniosa. Úsala para dimensionar muebles, marcos y puertas.</p>
<div style={{display:“grid”,gridTemplateColumns:“2fr 1fr”,gap:12}}>
<div><FL>Dimensión base</FL><input type=“number” inputMode=“decimal” value={gv} onChange={e=>setGv(e.target.value)} style={K.inp}/></div>
<div><FL>Unidad</FL><select value={gu} onChange={e=>setGu(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{US[u]}</option>)}</select></div>
</div>
<div style={{display:“flex”,gap:10,marginTop:16}}>
<div style={{flex:1,background:C.field,borderRadius:12,padding:“14px”,textAlign:“center”}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Lado corto (÷φ)</div><div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(cvt(gIn/PHI,“in”,gu),3)} {US[gu]}</div></div>
<div style={{flex:1,background:${C.amber}15,borderRadius:12,padding:“14px”,textAlign:“center”,border:2px solid ${C.amber}}}><div style={{fontSize:12,color:C.amber,fontWeight:700}}>Base</div><div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(+gv,3)} {US[gu]}</div></div>
<div style={{flex:1,background:C.field,borderRadius:12,padding:“14px”,textAlign:“center”}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Lado largo (×φ)</div><div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>{fmt(cvt(gIn*PHI,“in”,gu),3)} {US[gu]}</div></div>
</div>
<Hint>Usado en muebles Shaker, arquitectura clásica y diseño moderno.</Hint>
</div>
)}
{tool===“tri”&&(
<div style={K.card}>
<CL>Triángulo rectángulo</CL>
<p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>Regla 3-4-5: si A=3, B=4 → C=5 = ángulo perfecto de 90°.</p>
<div style={{display:“grid”,gridTemplateColumns:“1fr 1fr”,gap:12}}>
<div><FL>Lado A (pulgadas)</FL><input type=“number” inputMode=“decimal” value={a} onChange={e=>setA(+e.target.value)} style={K.inp}/></div>
<div><FL>Lado B (pulgadas)</FL><input type=“number” inputMode=“decimal” value={b} onChange={e=>setB(+e.target.value)} style={K.inp}/></div>
</div>
<div style={{display:“flex”,gap:12,marginTop:16}}>
<div style={{flex:1,background:C.field,borderRadius:12,padding:“14px”,textAlign:“center”}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Hipotenusa C</div><div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(hyp,4)}”</div><div style={{fontSize:12,color:C.ink3,marginTop:2}}>{toFrac(hyp,16)}</div></div>
<div style={{flex:1,background:C.field,borderRadius:12,padding:“14px”,textAlign:“center”}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Ángulo A</div><div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>{fmt(ang,2)}°</div><div style={{fontSize:12,color:C.ink3,marginTop:2}}>Ángulo B: {fmt(90-ang,2)}°</div></div>
</div>
</div>
)}
</div>
);
}

// ═══════════════════════════════════════════════════════════
//  MADERA — PIE DE TABLA (rediseñado)
// ═══════════════════════════════════════════════════════════
function BoardTab({catalog}){
const[rows,setRows]=useState([]);
const[unit,setUnit]=useState(“in”);
const[saved,setSaved]=useState(false);

function addRow(){setRows(r=>[…r,{id:Date.now(),mat:””,L:””,W:””,T:””,qty:1,cpt:0}]);}
function delRow(id){setRows(r=>r.filter(x=>x.id!==id));}
function upd(id,k,v){setRows(r=>r.map(x=>x.id===id?{…x,[k]:v}:x));}
function pickMat(id,name){
const m=catalog.find(c=>c.name===name);
setRows(r=>r.map(x=>x.id===id?{…x,mat:name,T:m?String(m.thick):x.T,cpt:m?m.cost:x.cpt}:x));
}
function parseM(v,u){
const ws=parseWorkshopInput(String(v));
return ws>0?cvt(ws,“in”,u):cvt(parseFloat(v)||0,u,u);
}
function bfRow(row){
const L=parseWorkshopInput(String(row.L))||parseFloat(row.L)||0;
const W=parseWorkshopInput(String(row.W))||parseFloat(row.W)||0;
const T=parseWorkshopInput(String(row.T))||parseFloat(row.T)||0;
return bfCalc(L,W,T,row.qty||1,unit);
}
function reset(){setRows([]);setSaved(false);}

const totBF=rows.reduce((s,r)=>s+bfRow(r),0);
const totCost=rows.reduce((s,r)=>s+bfRow(r)*(r.cpt||0),0);

return(
<div>
<PT>Pie de tabla</PT>
<div style={{display:“flex”,gap:8,marginBottom:16}}>
<div style={{flex:1}}><FL>Unidad de medida</FL><select value={unit} onChange={e=>setUnit(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{UL[u]} ({US[u]})</option>)}</select></div>
</div>

```
  {/* Totales siempre arriba */}
  <div style={{background:linear-gradient(135deg,${C.amber},#A06808),borderRadius:20,padding:"20px",marginBottom:20,boxShadow:0 6px 22px ${C.amber}44}}>
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

  {/* Acciones */}
  {rows.length>0&&(
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <button onClick={reset} style={{flex:1,padding:"11px",background:${C.red}12,border:1.5px solid ${C.red}33,borderRadius:12,color:C.red,fontSize:14,fontWeight:600,cursor:"pointer"}}>🔄 Resetear</button>
      <button onClick={()=>setSaved(true)} style={{flex:1,padding:"11px",background:${C.green}15,border:1.5px solid ${C.green}44,borderRadius:12,color:C.gree
