import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
//  CUTWISE -- Calculadora Profesional de Carpintería
//  Creada por Jorge Vinicio Meléndez
//  Grain & Brand Studio, LLC
// ═══════════════════════════════════════════════════════════════

// ── CONVERSIÓN BASE ──────────────────────────────────────────
const TO_MM={mm:1,cm:10,m:1000,in:25.4,ft:304.8,yd:914.4};
const UNITS=["mm","cm","m","in","ft","yd"];
const UL={mm:"Milímetros",cm:"Centímetros",m:"Metros",in:"Pulgadas",ft:"Pies",yd:"Yardas"};
const US={mm:"mm",cm:"cm",m:"m",in:'"',ft:"ft",yd:"yd"};

function cvt(v,f,t){const n=parseFloat(v);if(isNaN(n)||f===t)return isNaN(n)?0:n;return(n*TO_MM[f])/TO_MM[t];}
function fmt(n,d=6){if(typeof n!=="number"||isNaN(n))return"";return String(parseFloat(n.toFixed(d)));}
function gcd(a,b){return b===0?a:gcd(b,a%b);}
function toFrac(dec,den=16){
  const a=Math.abs(dec),w=Math.floor(a),n=Math.round((a-w)*den);
  if(n===0)return`${w}"`;if(n===den)return`${w+1}"`;
  const g=gcd(n,den);return w>0?`${w} ${n/g}/${den/g}"`:` ${n/g}/${den/g}"`;
}
function bfCalc(L,W,T,qty,u){return(cvt(L,u,"in")*cvt(W,u,"in")*cvt(T,u,"in")*(qty||1))/144;}
function parseFrac(s){const p=String(s).trim().split("/");return p.length===2?(parseFloat(p[0])||0)/(parseFloat(p[1])||1):parseFloat(p[0])||0;}

// ── MODO TALLER: parsea "2 ft 3 1/8 in" → pulgadas decimales ─
function parseWorkshopInput(str){
  const s=String(str).trim().toLowerCase();
  let total=0;
  const ftM=s.match(/(\d+(?:\.\d+)?)\s*ft/);
  if(ftM)total+=parseFloat(ftM[1])*12;
  const inM=s.match(/(\d+(?:\.\d+)?)\s*(?:in|")/);
  if(inM)total+=parseFloat(inM[1]);
  const fracM=s.match(/(\d+)\s*\/\s*(\d+)/);
  if(fracM)total+=parseInt(fracM[1])/parseInt(fracM[2]);
  const wholeOnlyM=s.match(/^(\d+(?:\.\d+)?)$/);
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
  ["1×2","¾ × 1½\"","19×38"],["1×3","¾ × 2½\"","19×64"],["1×4","¾ × 3½\"","19×89"],
  ["1×6","¾ × 5½\"","19×140"],["1×8","¾ × 7¼\"","19×184"],["1×10","¾ × 9¼\"","19×235"],
  ["1×12","¾ × 11¼\"","19×286"],["2×4","1½ × 3½\"","38×89"],["2×6","1½ × 5½\"","38×140"],
  ["2×8","1½ × 7¼\"","38×184"],["2×10","1½ × 9¼\"","38×235"],["2×12","1½ × 11¼\"","38×286"],
  ["4×4","3½ × 3½\"","89×89"],["4×6","3½ × 5½\"","89×140"],["6×6","5½ × 5½\"","140×140"],
];
const WOOD_LIB=[
  {name:"Pino",cat:"Blanda",thick:0.75,cu:"pie²",color:"#C8A866",desc:"Abundante y económica. Ideal para pintar y estructuras.",ext:false},
  {name:"Cedro Rojo",cat:"Blanda",thick:1.0,cu:"pie²",color:"#B87840",desc:"Resistente a insectos y humedad. Perfecta para closets.",ext:true},
  {name:"Pino Amarillo",cat:"Blanda",thick:1.5,cu:"pie²",color:"#D4A030",desc:"Muy resistente para ser blanda. Pisos y decks.",ext:true},
  {name:"Roble Blanco",cat:"Dura",thick:1.0,cu:"pie²",color:"#8B6340",desc:"Bella veta. Pisos de alta gama, gabinetes y barriles.",ext:false},
  {name:"Roble Rojo",cat:"Dura",thick:1.0,cu:"pie²",color:"#A07050",desc:"El hardwood más vendido en EE.UU. Gabinetes y escaleras.",ext:false},
  {name:"Nogal (Walnut)",cat:"Dura",thick:1.0,cu:"pie²",color:"#5C3317",desc:"Madera oscura de lujo. Muebles finos, culatas y tazones.",ext:false},
  {name:"Maple Duro",cat:"Dura",thick:1.0,cu:"pie²",color:"#E8C870",desc:"Extremadamente duro. Tablas de cortar y pisos de gimnasio.",ext:false},
  {name:"Cerezo (Cherry)",cat:"Dura",thick:1.0,cu:"pie²",color:"#8B3010",desc:"Oscurece bellamente con el tiempo. Gabinetes premium.",ext:false},
  {name:"Fresno (Ash)",cat:"Dura",thick:1.0,cu:"pie²",color:"#C8B890",desc:"Flexible y resistente. Mangos de herramientas y bates.",ext:false},
  {name:"Caoba (Mahogany)",cat:"Dura",thick:1.0,cu:"pie²",color:"#9C3A12",desc:"Muy estable dimensionalmente. Muebles finos e instrumentos.",ext:false},
  {name:"Teca (Teak)",cat:"Dura",thick:1.0,cu:"pie²",color:"#B8860B",desc:"La reina del exterior. Yates, decks y bancas de jardín.",ext:true},
  {name:"Álamo (Poplar)",cat:"Dura",thick:1.0,cu:"pie²",color:"#9BB87A",desc:"Económico y fácil de pintar. Cajones e interiores.",ext:false},
  {name:"MDF Estándar",cat:"Laminado",thick:0.75,cu:"m²",color:"#C4A882",desc:"Superficie lisa perfecta para pintar o rutear CNC.",ext:false},
  {name:"MDF Hidrofugado",cat:"Laminado",thick:0.75,cu:"m²",color:"#A08862",desc:"Resistente a humedad. Ideal para baños y cocinas.",ext:false},
  {name:"Triplay Birch",cat:"Laminado",thick:0.75,cu:"m²",color:"#D4B896",desc:"Sin vacíos entre capas. El mejor para CNC y muebles.",ext:false},
  {name:"Melanina",cat:"Laminado",thick:0.75,cu:"m²",color:"#D8D0C0",desc:"Con acabado laminado. Cocinas y mobiliario de oficina.",ext:false},
  {name:"OSB",cat:"Laminado",thick:0.5,cu:"m²",color:"#C8A870",desc:"Estructural y económico. Paredes y pisos de construcción.",ext:true},
];
const FINISHES=[
  {name:"Aceite danés",type:"Aceite",uso:"Interior, madera expuesta",pros:"Fácil de aplicar, natural",cons:"Poca protección al agua",tip:"Aplicar con trapo, dejar 15min y limpiar exceso"},
  {name:"Poliuretano",type:"Barniz",uso:"Pisos, mesas, superficies de alto tráfico",pros:"Muy durable, resistente al agua",cons:"Difícil de reparar",tip:"Lijar entre capas con lija 320"},
  {name:"Shellac",type:"Laca natural",uso:"Muebles finos, sellar nudos",pros:"Seca rápido, fácil de retocar",cons:"No resiste agua ni alcohol",tip:"Excelente sellador antes de pintar"},
  {name:"Lacquer",type:"Laca",uso:"Gabinetes, muebles de producción",pros:"Seca muy rápido, acabado fino",cons:"Requiere pistola",tip:"Aplicar en capas delgadas"},
  {name:"Gel Stain",type:"Stain",uso:"Maderas difíciles como pino y maple",pros:"Control total del color",cons:"Seca lento",tip:"Ideal para igualar tonos en maderas disparejas"},
  {name:"Water-based Stain",type:"Stain",uso:"Interior general",pros:"Sin olor, seca rápido",cons:"Puede levantar la veta",tip:"Mojar madera antes para pre-levantar veta"},
  {name:"Oil-based Stain",type:"Stain",uso:"Interior, colores profundos",pros:"Penetra bien, color rico",cons:"Seca lento, con olor",tip:"24h entre capas mínimo"},
  {name:"Chalk Paint",type:"Pintura",uso:"Muebles vintage, decoración",pros:"Sin lija previa, muchos colores",cons:"Necesita cera o sellador",tip:"Terminar siempre con cera o barniz"},
];
const NAILS=[["2d","1\"","25mm"],["3d","1¼\"","32mm"],["4d","1½\"","38mm"],["6d","2\"","51mm"],["8d","2½\"","64mm"],["10d","3\"","76mm"],["16d","3½\"","89mm"],["20d","4\"","102mm"]];
const SCREWS=[["#6","3.5mm","7/64\"","Uso general, MDF"],["#8","4.2mm","9/64\"","El más común -- estructuras"],["#10","4.8mm","5/32\"","Juntas resistentes"],["#12","5.5mm","3/16\"","Madera dura, vigas"]];
const TIPS=[
  {icon:"📐",title:"Regla 3-4-5",body:"Para cuadrar una esquina a 90°: mide 3 unidades en un lado, 4 en el otro, la diagonal debe medir exactamente 5. Usa cualquier unidad."},
  {icon:"🎯",title:"Encontrar el centro",body:"Traza dos diagonales de esquina a esquina. Donde se cruzan es el centro exacto. Funciona en cualquier rectángulo."},
  {icon:"📏",title:"Dividir un espacio en partes iguales",body:"Pon una regla en diagonal hasta que toque un número divisible por las partes que necesitas. Marca esos puntos y proyéctalos con escuadra."},
  {icon:"🪵",title:"Dirección de la veta",body:"Siempre cepilla, lija y barniza a favor de la veta. Contra la veta levanta fibras y deja marcas."},
  {icon:"💧",title:"Prueba de humedad",body:"Antes de barnizar, pon una gota de agua. Si la absorbe rápido, la madera está muy seca. Si la rechaza, tiene sellador o aceite previo."},
  {icon:"🔩",title:"Pre-taladrar siempre",body:"En maderas duras, siempre pre-taladra antes de atornillar. Evita rajaduras especialmente cerca de los extremos."},
];

const INIT_CATALOG=[
  {id:1,name:"Pino #2 1×4",cat:"Blanda",thick:0.75,cost:2.50,cu:"pie²",stock:40,su:"pie²",proveedor:"Maderas García",tel:"555-100-2030",email:"ventas@maderasgarcia.com",nota:"10% dto en +100 pie²"},
  {id:2,name:"Cedro Aromático",cat:"Blanda",thick:1.0,cost:4.80,cu:"pie²",stock:20,su:"pie²",proveedor:"Maderería Hdz",tel:"555-200-4050",email:"",nota:""},
  {id:3,name:"Roble Blanco 4/4",cat:"Dura",thick:1.0,cost:9.50,cu:"pie²",stock:15,su:"pie²",proveedor:"Premium Woods MX",tel:"555-300-6070",email:"info@premiumwoods.mx",nota:"Mínimo 20 pie²"},
  {id:4,name:"MDF ¾\"",cat:"Laminado",thick:0.75,cost:18.50,cu:"m²",stock:8,su:"hojas",proveedor:"Maderas García",tel:"555-100-2030",email:"ventas@maderasgarcia.com",nota:""},
  {id:5,name:"Triplay Birch ¾\"",cat:"Laminado",thick:0.75,cost:42.00,cu:"m²",stock:5,su:"hojas",proveedor:"Premium Woods MX",tel:"555-300-6070",email:"info@premiumwoods.mx",nota:"Pedir 2 semanas antes"},
];
const INIT_PROJECTS=[
  {id:1,name:"Mesa de Centro",client:"Uso personal",clientTel:"",notes:"",status:"En progreso",markup:50,labor:0,laborType:"pct",cuts:[
    {id:1,label:"Tablero superior",mat:"Roble Blanco 4/4",L:48,W:24,T:1.0,qty:1,cpt:9.50},
    {id:2,label:"Patas",mat:"Roble Blanco 4/4",L:18,W:2.5,T:2.5,qty:4,cpt:9.50},
    {id:3,label:"Travesaños",mat:"Pino #2 1×4",L:42,W:3.5,T:0.75,qty:2,cpt:2.50},
  ]},
];

// ── PRO OPTIMIZER DATA ───────────────────────────────────────
const SHEET_PRESETS={
  MX:[{label:"4×8 pies",w:122,h:244},{label:"4×9 pies",w:122,h:274},{label:"5×9 pies",w:152,h:274}],
  US:[{label:"4×8 ft",w:121.9,h:243.8},{label:"4×10 ft",w:121.9,h:304.8},{label:"5×5 ft",w:152.4,h:152.4}],
  EU:[{label:"2440×1220mm",w:122,h:244},{label:"2800×1050mm",w:105,h:280}],
};
const PRO_MATS=["MDF","Melamina","Triplay / Plywood","Aglomerado","OSB","Madera sólida"];
const THICKNESS_MM=[3,6,9,12,15,18,19,25,30];
const CABINET_PRESETS=[
  {id:"base",icon:"🟫",name:"Gabinete Base",hint:"Cocina bajo cubierta",defaults:{w:60,h:85,d:60},
    parts:(w,h,d,T)=>[{name:"Lateral",qty:2,w:d,h:h,grain:"V"},{name:"Fondo",qty:1,w:w-2*T,h:h-T,grain:"H"},{name:"Entrepaño",qty:1,w:w-2*T,h:d,grain:"H"},{name:"Zoclo",qty:1,w:w-2*T,h:10,grain:"H"},{name:"Puerta",qty:1,w:w,h:h-10,grain:"V"}]},
  {id:"aereo",icon:"🟦",name:"Gabinete Aéreo",hint:"Alacena mural",defaults:{w:60,h:70,d:35},
    parts:(w,h,d,T)=>[{name:"Lateral",qty:2,w:d,h:h,grain:"V"},{name:"Tapa sup.",qty:1,w:w-2*T,h:d,grain:"H"},{name:"Base int.",qty:1,w:w-2*T,h:d,grain:"H"},{name:"Fondo",qty:1,w:w-2*T,h:h-2*T,grain:"H"},{name:"Puerta",qty:2,w:w/2,h:h,grain:"V"}]},
  {id:"cajones",icon:"🟧",name:"Cajonera",hint:"3 cajones",defaults:{w:60,h:85,d:60},
    parts:(w,h,d,T)=>{const dh=+((h-4*T)/3).toFixed(1);return[{name:"Lateral",qty:2,w:d,h:h,grain:"V"},{name:"Tapa/Base",qty:2,w:w-2*T,h:d,grain:"H"},{name:"Frente cajón",qty:3,w:w-2*T,h:dh,grain:"H"},{name:"Lateral cajón",qty:6,w:d-T,h:dh-T,grain:"H"},{name:"Fondo cajón",qty:3,w:w-2*T-2,h:d-T-2,grain:"H"}];}},
  {id:"torre",icon:"🟩",name:"Torre / Alacena",hint:"Piso a techo",defaults:{w:60,h:200,d:60},
    parts:(w,h,d,T)=>[{name:"Lateral",qty:2,w:d,h:h,grain:"V"},{name:"Tapa sup.",qty:1,w:w-2*T,h:d,grain:"H"},{name:"Base",qty:1,w:w-2*T,h:d,grain:"H"},{name:"Entrepaño",qty:3,w:w-2*T,h:d,grain:"H"},{name:"Fondo",qty:1,w:w-2*T,h:h-2*T,grain:"H"},{name:"Puerta sup.",qty:1,w:w,h:h*0.4,grain:"V"},{name:"Puerta inf.",qty:1,w:w,h:h*0.6,grain:"V"}]},
  {id:"custom",icon:"✏️",name:"Personalizado",hint:"Piezas libres",parts:null},
];
const PRO_COLORS=["#E8956D","#5B9BD5","#6DBF82","#E06C75","#A67CC5","#E8C44D","#4DBFB3","#E89B4D","#7DB5DE","#7DCF99","#DEC84D","#C399D9"];

function optimizeCuts(pieces,SW,SH,kerf){
  const expanded=[];
  pieces.forEach(p=>{for(let i=0;i<(p.qty||1);i++)expanded.push({...p,_id:`${p.name}-${i}`});});
  const sorted=[...expanded].sort((a,b)=>b.w*b.h-a.w*a.h);
  const sheets=[];const rem=[...sorted];
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
          else if(p.grain==="N"&&ph<=s.w&&pw<=s.h){pw=p.h;ph=p.w;rot=true;placed=true;}
          if(placed){
            sheet.placements.push({...p,x:s.x,y:s.y,pw,ph,rot});
            sheet.usedArea+=pw*ph;
            const ns=[];
            const rw=s.w-pw-kerf,th=s.h-ph-kerf;
            if(rw>0)ns.push({x:s.x+pw+kerf,y:s.y,w:rw,h:ph});
            if(th>0)ns.push({x:s.x,y:s.y+ph+kerf,w:s.w,h:th});
            sheet.spaces.splice(si,1,...ns);
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
  amber:"#D4900A",amberBg:"#FFF8ED",amberBd:"#F5D080",
  green:"#28A745",blue:"#007AFF",red:"#D32F2F",
  white:"#FFFFFF",bg:"#F5F0EB",card:"#FFFFFF",
  field:"#F2EDE6",ink1:"#1C1C1E",ink2:"#48484A",
  ink3:"#8A8A8E",ink4:"#C7C7CC",border:"#E8E0D5",
  proB:"#18182A",proCard:"rgba(255,255,255,0.04)",
  proGold:"#E8C14D",proText:"#EDE8DC",proMuted:"#666",
};
const CAT_COLOR={Blanda:"#3A8C4A",Dura:"#B85C20",Laminado:"#1A6BB0",Otro:"#7B52AB"};
const STA_COLOR={"Pendiente":"#8E8E93","En progreso":"#D4900A","Completado":"#34C759","En pausa":"#007AFF"};
const COST_U=["pie²","m²","pie·tabla","hoja","ml","kg","unidad"];
const STOCK_U=["pie²","m²","hojas","unidades","kg","pie·tabla"];

// ── CSS GLOBAL ───────────────────────────────────────────────
const G=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};-webkit-font-smoothing:antialiased;}
  input,select,textarea,button{font-family:inherit;}
  input[type=number]::-webkit-inner-spin-button{opacity:.4;}
  input:focus,select:focus,textarea:focus{outline:none;border-color:${C.amber}!important;box-shadow:0 0 0 3px rgba(212,144,10,.15);}  input[type=number]:focus{-webkit-user-select:all;user-select:all;}
  ::-webkit-scrollbar{display:none;}
  @keyframes up{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .up{animation:up .22s ease both;}
  button:active{opacity:.78;transform:scale(.98);transition:all .1s;}
  textarea{resize:vertical;}
  .pro-focus:focus{border-color:${C.proGold}!important;box-shadow:0 0 0 3px rgba(232,193,77,.2)!important;}
`;

// ═══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function App(){
  const[tab,setTab]=useState("calc");
  const[catalog,setCatalog]=useLS("cw_catalog",INIT_CATALOG);
  const[projects,setProjects]=useLS("cw_projects",INIT_PROJECTS);
  const[proUnlocked]=useLS("cw_pro",false);

  const TABS=[
    {id:"calc",icon:"⇄",label:"Unidades"},
    {id:"boardfoot",icon:"📐",label:"Madera"},
    {id:"projects",icon:"📋",label:"Proyectos"},
    {id:"catalog",icon:"🪵",label:"Mis Maderas"},
    {id:"ref",icon:"📖",label:"Guía"},
    {id:"pro",icon:"✦",label:"Pro"},
  ];

  return(
    <div style={{minHeight:"100vh",background:tab==="pro"?C.proB:C.bg,fontFamily:"'Inter',-apple-system,sans-serif",color:C.ink1,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",transition:"background .3s"}}>
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
              <div style={{fontSize:12,color:C.ink3,marginTop:2,letterSpacing:.3}}>Herramienta de carpintero</div>
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

      {/* NAV INFERIOR -- más grande y fácil de tocar */}
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
//  CALCULAR -- Convertir + Taller + Diseño
// ═══════════════════════════════════════════════════════════
function CalcTab(){
  const[mode,setMode]=useState("convert");
  return(
    <div>
      <div style={{display:"flex",background:C.white,borderRadius:14,padding:4,marginBottom:16,boxShadow:"0 1px 5px rgba(0,0,0,0.07)"}}>
        {[["convert","Convertidor"],["workshop","Calculadora"],["tools","Geometría"]].map(([k,l])=>(
          <button key={k} onClick={()=>setMode(k)} style={{flex:1,padding:"11px 4px",borderRadius:11,border:"none",fontSize:14,fontWeight:600,background:mode===k?C.amber:"transparent",color:mode===k?C.white:C.ink3,transition:"all .2s",cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      {mode==="convert"  && <CombinedConverter/>}
      {mode==="workshop" && <WorkshopMode/>}
      {mode==="tools"    && <DesignTools/>}
    </div>
  );
}

// ── CONVERSOR UNIFICADO ──────────────────────────────────────
const CONV_UNITS=[
  {id:"mm",    label:"Milímetros",          short:"mm"},
  {id:"cm",    label:"Centímetros",         short:"cm"},
  {id:"m",     label:"Metros",              short:"m"},
  {id:"in",    label:"Pulgadas (decimal)",  short:'in"'},
  {id:"infrac",label:"Pulgadas (fracción)", short:"in 1/2"},
  {id:"ft",    label:"Pies",                short:"ft"},
  {id:"yd",    label:"Yardas",              short:"yd"},
];

function CombinedConverter(){
  const[toU,      setToU]     = useState("mm");
  const[showFrom, setShowFrom]= useState(false);
  const[showTo,   setShowTo]  = useState(false);
  const[fromSel,  setFromSel] = useState("in");
  const[buf,      setBuf]     = useState("");
  const[ftAcc,    setFtAcc]   = useState(0);
  const[inAcc,    setInAcc]   = useState(0);
  const[fracN,    setFracN]   = useState(0);
  const[slashOn,  setSlash]   = useState(false);
  const[fracNum,  setFracNum] = useState("");
  const[fracDen,  setFracDen] = useState("");

  const carpMode = ftAcc>0 || inAcc>0 || fracN>0 || slashOn;
  const fromU    = carpMode ? "infrac" : fromSel;
  const bufNum   = parseFloat(buf) || 0;
  const pending  = slashOn && fracDen
    ? (parseFloat(fracNum)||0) / (parseFloat(fracDen)||1) : 0;

  const totalIn = carpMode
    ? ftAcc*12 + inAcc + fracN/16 + pending
    : fromSel==="ft"  ? bufNum*12
    : fromSel==="yd"  ? bufNum*36
    : fromSel==="mm"  ? bufNum/25.4
    : fromSel==="cm"  ? bufNum/2.54
    : fromSel==="m"   ? bufNum/0.0254
    : bufNum;

  const hasInput = carpMode
    ? (ftAcc>0||inAcc>0||fracN>0||buf!==""||slashOn)
    : (buf!==""&&buf!=="0"&&buf!==".");

  function inputDisplay(){
    if(carpMode||slashOn){
      let s="";
      if(ftAcc>0) s+=ftAcc+" ft ";
      if(slashOn){
        s+=(inAcc>0?inAcc+" ":"")+fracNum+"/"+(fracDen||"_")+'"';
      } else if(buf){
        s+=buf;
      } else if(inAcc>0||fracN>0){
        s+=inAcc>0?String(inAcc):"";
        if(fracN>0){const g=gcd(fracN,16);s+=(inAcc>0?" ":"")+fracN/g+"/"+16/g+'"';}
        else s+='"';
      }
      return s||"0";
    }
    return buf||"0";
  }

  function getResult(){
    if(!hasInput) return "--";
    const inches=totalIn;
    if(toU==="infrac"){
      const f=Math.floor(inches/12), rem=inches%12;
      const iw=Math.floor(rem), fr16=Math.round((rem-iw)*16);
      const finalIw = fr16>=16 ? iw+1 : iw;
      const finalFr  = fr16>=16 ? 0 : fr16;
      const g=finalFr>0?gcd(finalFr,16):1;
      let s="";
      if(f>0) s+=f+"ft ";
      if(finalIw>0||finalFr>0){
        s+=finalIw>0?String(finalIw):"";
        if(finalFr>0) s+=(finalIw>0?" ":"")+finalFr/g+"/"+16/g+'"';
        else s+='"';
      }
      return s||"0";
    }
    const r=cvt(inches,"in",toU==="in"?"in":toU);
    return fmt(r,5)+" "+(CONV_UNITS.find(u=>u.id===toU)||{short:""}).short;
  }

  function digit(d){
    if(slashOn){ setFracDen(function(v){return (v+d).slice(0,4);}); return; }
    setBuf(function(v){
      if(v===""||v==="0") return d==="."?"0.":d;
      return (v+d).slice(0,10);
    });
  }

  function confirmFt(){
    if(fromSel!=="infrac") setFromSel("infrac");
    const n=parseFloat(buf)||0;
    if(n>0) setFtAcc(function(v){return v+n;});
    setBuf(""); setSlash(false); setFracDen(""); setFracNum("");
  }

  function confirmIn(){
    if(fromSel!=="infrac") setFromSel("infrac");
    if(slashOn){
      const n=parseFloat(fracNum)||0, d=parseFloat(fracDen)||16;
      const n16=Math.round((n/d)*16);
      const newTotal=fracN+n16;
      if(newTotal>=16){
        setInAcc(function(v){return v+Math.floor(newTotal/16);});
        setFracN(newTotal%16);
      } else {
        setFracN(newTotal);
      }
      setSlash(false); setFracDen(""); setFracNum(""); setBuf("");
    } else {
      const n=parseFloat(buf)||0;
      if(n>0) setInAcc(function(v){return v+n;});
      setBuf(""); setSlash(false);
    }
  }

  function pressSlash(){
    if(fromSel!=="infrac") setFromSel("infrac");
    setFracNum(buf||"1"); setBuf(""); setFracDen(""); setSlash(true);
  }

  function addFrac(n16){
    if(fromSel!=="infrac") setFromSel("infrac");
    setFracN(function(v){
      const total=v+n16;
      if(total>=16){
        setInAcc(function(i){return i+Math.floor(total/16);});
        return total%16;
      }
      return total;
    });
    setBuf("");
  }

  function pressDecimal(){
    if(carpMode) return;
    setBuf(function(v){return v.includes(".")?v:(v||"0")+".";});
  }

  function backspace(){
    if(slashOn&&fracDen){ setFracDen(function(v){return v.slice(0,-1);}); return; }
    if(slashOn){ setSlash(false); setFracDen(""); setFracNum(""); return; }
    if(buf){ setBuf(function(v){return v.slice(0,-1);}); return; }
    if(fracN>0){ setFracN(0); return; }
    if(inAcc>0){ setInAcc(0); return; }
    if(ftAcc>0){ setFtAcc(0); return; }
  }

  function clearAll(){
    setBuf(""); setFtAcc(0); setInAcc(0); setFracN(0);
    setSlash(false); setFracDen(""); setFracNum("");
  }

  function swapUnits(){
    const tmp=fromSel; setFromSel(toU); setToU(tmp); clearAll();
  }

  function UPick({value, onChange, isFrom}){
    const open = isFrom ? showFrom : showTo;
    function handleOpen(e){
      e.stopPropagation();
      if(isFrom){ setShowTo(false); setShowFrom(function(o){return !o;}); }
      else       { setShowFrom(false); setShowTo(function(o){return !o;}); }
    }
    function handleClose(){ setShowFrom(false); setShowTo(false); }
    return(
      React.createElement("div",{style:{flex:1,position:"relative"}},
        React.createElement(FL,null,isFrom?"De":"A"),
        React.createElement("button",{
          onPointerDown:handleOpen,
          style:{width:"100%",padding:"11px 12px",borderRadius:12,
            border:"1.5px solid "+(open?C.amber:C.border),
            background:C.field,color:C.ink1,fontSize:14,fontWeight:700,
            textAlign:"left",cursor:"pointer",display:"flex",
            justifyContent:"space-between",alignItems:"center"}},
          React.createElement("span",{style:{color:value==="infrac"?C.amber:C.ink1}},
            (CONV_UNITS.find(function(u){return u.id===value;})||{short:value}).short),
          React.createElement("span",{style:{color:C.ink3,fontSize:11}},open?"▲":"▼")
        ),
        open&&React.createElement("div",{
          style:{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,
            background:C.white,borderRadius:12,
            border:"1.5px solid "+C.amber,zIndex:100,
            boxShadow:"0 8px 28px rgba(0,0,0,0.14)",overflow:"hidden"}},
          CONV_UNITS.map(function(u){
            return React.createElement("button",{
              key:u.id,
              onPointerDown:function(e){
                e.preventDefault(); onChange(u.id); handleClose(); clearAll();
              },
              style:{width:"100%",padding:"13px 16px",
                background:value===u.id?C.amber+"18":C.white,
                border:"none",borderBottom:"1px solid "+C.border,
                textAlign:"left",fontSize:14,
                fontWeight:value===u.id?700:500,
                color:value===u.id?C.amber:C.ink2,cursor:"pointer"}},
              u.label,
              u.id==="infrac"&&React.createElement("span",
                {style:{marginLeft:8,fontSize:11,color:C.green,fontWeight:700}},"✦")
            );
          })
        )
      )
    );
  }

  const GAP=5;

  return(
    <div style={{display:"flex",flexDirection:"column",
      height:"calc(100vh - 215px)",gap:8,
      userSelect:"none",WebkitUserSelect:"none"}}>

      <div style={{background:"linear-gradient(160deg,#1A1A1C,#252528)",
        borderRadius:18,padding:"12px 14px",flexShrink:0,height:148}}>
        <div style={{display:"flex",gap:10,height:"100%"}}>
          <div style={{flex:1,minWidth:0,display:"flex",
            flexDirection:"column",justifyContent:"space-between"}}>
            <div style={{fontSize:10,color:"#555",fontWeight:700,
              letterSpacing:.8,textTransform:"uppercase"}}>
              {(CONV_UNITS.find(function(u){return u.id===fromU;})||{label:"Entrada"}).label}
            </div>
            <div style={{fontSize:28,fontWeight:900,color:C.white,
              fontFamily:"monospace",letterSpacing:-.5,lineHeight:1,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {inputDisplay()}
            </div>
            <div style={{fontSize:10,color:"#666",fontFamily:"monospace",minHeight:14}}>
              {hasInput&&fmt(totalIn,4)+'" = '+fmt(cvt(totalIn,"in","mm"),2)+" mm"}
            </div>
          </div>
          <div style={{width:1,background:"rgba(255,255,255,0.08)",flexShrink:0}}/>
          <div style={{width:118,flexShrink:0,display:"flex",
            flexDirection:"column",gap:5}}>
            <div style={{fontSize:10,color:"#555",fontWeight:700,
              letterSpacing:.8,textTransform:"uppercase"}}>
              {(CONV_UNITS.find(function(u){return u.id===toU;})||{label:"Resultado"}).label}
            </div>
            <div style={{flex:1,
              background:hasInput
                ?"linear-gradient(135deg,"+C.amber+",#9A6005)"
                :"rgba(255,255,255,0.05)",
              borderRadius:12,padding:"8px",textAlign:"center",
              display:"flex",flexDirection:"column",justifyContent:"center",
              transition:"background .2s"}}>
              <div style={{fontSize:toU==="infrac"?14:22,fontWeight:900,
                color:hasInput?C.white:"#333",
                letterSpacing:-.5,lineHeight:1.2,
                fontFamily:"monospace",wordBreak:"break-word"}}>
                {hasInput?getResult():"--"}
              </div>
            </div>
            {fracN>0&&(
              <div style={{background:C.amber+"20",borderRadius:8,
                padding:"3px 6px",textAlign:"center",
                border:"1px solid "+C.amberBd}}>
                <span style={{fontSize:10,color:C.amber,
                  fontWeight:700,fontFamily:"monospace"}}>
                  {(function(){const g=gcd(fracN,16);return "+"+fracN/g+"/"+16/g+'"';})()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"flex-start",
        flexShrink:0,position:"relative",zIndex:50}}>
        <UPick value={fromU} onChange={setFromSel} isFrom={true}/>
        <button
          onPointerDown={function(e){e.preventDefault(); swapUnits();}}
          style={{width:42,height:42,borderRadius:12,background:C.amber,
            border:"none",fontSize:18,color:C.white,fontWeight:700,
            flexShrink:0,marginTop:22,
            boxShadow:"0 3px 10px "+C.amber+"55",cursor:"pointer"}}>
          {"\u21c4"}
        </button>
        <UPick value={toU} onChange={setToU} isFrom={false}/>
      </div>

      <div style={{flex:1,background:"#EDEAE5",borderRadius:18,padding:"8px",
        display:"flex",flexDirection:"column",gap:GAP,overflow:"hidden"}}
        onPointerDown={function(){setShowFrom(false); setShowTo(false);}}>

        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
          {["7","8","9"].map(function(d){return(
            <KB2 key={d} label={d} onPress={function(){digit(d);}}
              style={{height:"100%",fontSize:20}}/>
          );})}
          <KB2 label={"\u232b"} onPress={backspace}
            bg="#D4CEC7" color={C.ink2} style={{height:"100%",fontSize:18}}/>
        </div>

        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
          {["4","5","6"].map(function(d){return(
            <KB2 key={d} label={d} onPress={function(){digit(d);}}
              style={{height:"100%",fontSize:20}}/>
          );})}
          <KB2 label="/" onPress={pressSlash}
            bg={slashOn?C.amber:"#D4CEC7"}
            color={slashOn?C.white:C.amber}
            style={{height:"100%",fontSize:22,fontWeight:900}}/>
        </div>

        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
          {["1","2","3"].map(function(d){return(
            <KB2 key={d} label={d} onPress={function(){digit(d);}}
              style={{height:"100%",fontSize:20}}/>
          );})}
          <KB2 label="C" onPress={clearAll}
            bg={C.red+"15"} color={C.red}
            style={{height:"100%",border:"1.5px solid "+C.red+"33"}}/>
        </div>

        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
          <KB2 label="ft" onPress={confirmFt}
            bg={C.amber} color={C.white} style={{height:"100%",fontSize:16}}/>
          <KB2 label='in "' onPress={confirmIn}
            bg={C.amber} color={C.white} style={{height:"100%",fontSize:14}}/>
          <KB2 label="." onPress={pressDecimal}
            bg={carpMode?"#D4CEC7":C.white}
            color={carpMode?C.ink4:C.ink1}
            style={{height:"100%",fontSize:20}}/>
          <KB2 label="0" onPress={function(){digit("0");}}
            style={{height:"100%",fontSize:20}}/>
        </div>

        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:GAP}}>
          {[[1,"\u00b9\u2044\u2081\u2086"],[2,"\u215b"],[4,"\u00bc"],[8,"\u00bd"]].map(function(pair){
            const n16=pair[0], lbl=pair[1];
            return(
              <KB2 key={n16} label={lbl} onPress={function(){addFrac(n16);}}
                bg={C.amber+"18"} color={C.amber}
                style={{height:"100%",fontSize:n16===1?12:18,
                  border:"1px solid "+C.amberBd}}/>
            );
          })}
        </div>

        {slashOn&&(
          <div style={{flexShrink:0,background:C.amber+"15",
            borderRadius:10,padding:"5px 10px",textAlign:"center",
            border:"1px solid "+C.amberBd}}>
            <span style={{fontSize:12,color:C.amber,fontWeight:700,
              fontFamily:"monospace"}}>
              {fracNum+"/"+(fracDen||"_")+'" \u2014 presiona in" para confirmar'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function KB2({label,onPress,bg,color,style:st}){
  return(
    <button onPointerDown={function(e){e.preventDefault();onPress();}}
      style={{borderRadius:11,border:"none",cursor:"pointer",fontWeight:800,
        lineHeight:1,userSelect:"none",WebkitUserSelect:"none",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:17,background:bg||C.white,color:color||C.ink1,
        boxShadow:"0 1px 3px rgba(0,0,0,0.09)",
        transition:"opacity .1s",...(st||{})}}>
      {label}
    </button>
  );
}


// ── MODO TALLER -- Calculadora de construcción completa ───────
// Todo en pantalla fija, sin scroll, sin teclado del sistema
function WorkshopMode(){
  // ── Estado ────────────────────────────────────────────────
  const[buf,    setBuf]   = useState("");   // dígitos activos
  const[ftAcc,  setFtAcc] = useState(0);   // pies del número actual
  const[inAcc,  setInAcc] = useState(0);   // pulgadas del número actual
  const[fracN,  setFracN] = useState(0);   // 16avos del número actual
  const[slashOn,setSlash] = useState(false);
  const[fracNum,setFracNum]= useState("");
  const[fracDen,setFracDen]= useState("");
  const[memory, setMemory] = useState(0);  // acumulador de operaciones
  const[op,     setOp]    = useState(null);// operación pendiente: + - × ÷
  const[tape,   setTape]  = useState([]);  // historial de cinta
  const[to,     setTo]    = useState("mm");
  const[justEq, setJustEq]= useState(false);// acabamos de presionar =

  // ── Valor del número actual en pulgadas ──────────────────
  const currentIn = ftAcc*12 + inAcc + fracN/16;

  // ── Display del número actual ────────────────────────────
  function numDisplay(){
    if(slashOn) return fracNum+(fracDen?`/${fracDen}`:"/_");
    if(buf) return buf;
    const parts=[];
    if(ftAcc>0) parts.push(`${ftAcc}ft`);
    if(inAcc>0||fracN>0){
      let s=inAcc>0?`${inAcc}`:"";
      if(fracN>0){const g=gcd(fracN,16);s+=(s?" ":"")+`${fracN/g}/${16/g}"`;}
      else s+='"';
      parts.push(s);
    }
    return parts.length?parts.join(" "):"0";
  }

  // ── Display de la cinta (historial) ──────────────────────
  function tapeDisplay(){
    if(!tape.length&&!op) return numDisplay();
    let s=tape.map(t=>`${t.label} ${t.op}`).join(" ");
    if(op) s+=" "+numDisplay();
    return s||numDisplay();
  }

  // ── Resultado acumulado ───────────────────────────────────
  function calcResult(){
    if(!op) return currentIn;
    if(op==="+") return memory+currentIn;
    if(op==="-") return memory-currentIn;
    if(op==="×") return memory*currentIn;
    if(op==="÷") return currentIn!==0?memory/currentIn:memory;
    return currentIn;
  }
  const result    = calcResult();
  const hasResult = result>0||tape.length>0||op!==null;
  const resConverted = cvt(result,"in",to);

  // ── Dígito ───────────────────────────────────────────────
  function digit(d){
    if(justEq){ clearAll(); }
    if(slashOn){ setFracDen(v=>(v+d).slice(0,3)); return; }
    setBuf(v=>(v==="0"?"":v+d).slice(0,6));
  }

  // ── Confirmar PIES ───────────────────────────────────────
  function confirmFt(){
    const n=parseFloat(buf)||0;
    if(n>0){ setFtAcc(n); }
    setBuf(""); setSlash(false); setFracDen(""); setFracNum("");
    setJustEq(false);
  }

  // ── Confirmar PULGADAS ───────────────────────────────────
  function confirmIn(){
    if(slashOn){
      const n=parseFloat(fracNum)||0;
      const d=parseFloat(fracDen)||16;
      setFracN(v=>v+Math.round((n/d)*16));
      setSlash(false); setFracDen(""); setFracNum(""); setBuf("");
    } else {
      const n=parseFloat(buf)||0;
      if(n>0) setInAcc(n);
      setBuf(""); setSlash(false);
    }
    setJustEq(false);
  }

  // ── Slash fracción manual ─────────────────────────────────
  function slash(){
    setFracNum(buf||"1"); setBuf(""); setFracDen(""); setSlash(true);
  }

  // ── Fracciones rápidas acumulables ───────────────────────
  function addFrac(n16){ setFracN(v=>v+n16); setJustEq(false); }

  // ── Operación matemática ──────────────────────────────────
  function pressOp(o){
    if(currentIn===0&&memory===0) return;
    const cur=currentIn||0;
    let newMem=memory;
    if(op&&cur>0){
      if(op==="+") newMem=memory+cur;
      else if(op==="-") newMem=memory-cur;
      else if(op==="×") newMem=memory*cur;
      else if(op==="÷") newMem=cur!==0?memory/cur:memory;
    } else {
      newMem=cur>0?cur:memory;
    }
    const lbl=numDisplay();
    if(lbl!=="0") setTape(t=>[...t,{label:lbl,op:o,val:cur}]);
    setMemory(newMem);
    setOp(o);
    setFtAcc(0); setInAcc(0); setFracN(0);
    setBuf(""); setSlash(false); setFracDen(""); setFracNum("");
    setJustEq(false);
  }

  // ── Igual ─────────────────────────────────────────────────
  function pressEqual(){
    const res=calcResult();
    const lbl=numDisplay();
    setTape(t=>[...t,{label:lbl,op:"=",val:currentIn}]);
    // resultado se convierte en nuevo valor
    const ftR=Math.floor(res/12);
    const inR=parseFloat((res%12).toFixed(6));
    setFtAcc(ftR); setInAcc(Math.floor(inR));
    setFracN(Math.round((inR%1)*16));
    setMemory(0); setOp(null);
    setBuf(""); setSlash(false); setFracDen(""); setFracNum("");
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
    setBuf(""); setFtAcc(0); setInAcc(0); setFracN(0);
    setSlash(false); setFracDen(""); setFracNum("");
    setMemory(0); setOp(null); setTape([]); setJustEq(false);
  }

  // ── Botón ─────────────────────────────────────────────────
  function KB({label,onPress,bg,color,style:st}){
    return(
      <button onPointerDown={e=>{e.preventDefault();onPress();}}
        style={{borderRadius:12,border:"none",cursor:"pointer",fontWeight:800,
          lineHeight:1,userSelect:"none",WebkitUserSelect:"none",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:15,height:46,
          background:bg||C.white,color:color||C.ink1,
          boxShadow:"0 1px 3px rgba(0,0,0,0.1)",
          transition:"opacity .1s",...(st||{})}}>
        {label}
      </button>
    );
  }

  // ── Fracción simplificada para display ───────────────────
  function fracLabel(n16){
    if(n16===0) return "0";
    const g=gcd(n16,16);
    return `${n16/g}/${16/g}"`;
  }

  // altura de fila del teclado -- calculada para llenar pantalla sin scroll
  const ROW = "calc((100vh - 340px) / 8)";
  const GAP = 5;

  return(
    <div style={{
      userSelect:"none", WebkitUserSelect:"none",
      display:"flex", flexDirection:"column",
      height:"calc(100vh - 200px)",  // total disponible
      gap:8,
    }}>

      {/* ══ PANTALLA FIJA -- nunca cambia de tamaño ════════════ */}
      <div style={{
        background:"linear-gradient(160deg,#1A1A1C,#252528)",
        borderRadius:18, padding:"14px 16px",
        flexShrink:0,    // NUNCA encoge ni crece
        height:160,      // altura fija siempre
      }}>
        <div style={{display:"flex",gap:12,height:"100%"}}>

          {/* Izquierda -- entrada */}
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
              {/* Número actual -- grande */}
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

          {/* Derecha -- resultado, siempre presente */}
          <div style={{width:118,flexShrink:0,display:"flex",flexDirection:"column",gap:6}}>
            {/* Selector unidad */}
            <select value={to} onChange={e=>setTo(e.target.value)}
              style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",
                borderRadius:8,padding:"5px 6px",color:C.white,fontSize:11,
                fontWeight:700,outline:"none",cursor:"pointer",width:"100%"}}>
              {UNITS.map(u=><option key={u} value={u} style={{background:"#1A1A1C"}}>{UL[u]}</option>)}
            </select>
            {/* Resultado -- caja siempre visible, cambia color cuando hay valor */}
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
                {hasResult?fmt(resConverted,3):"--"}
              </div>
              <div style={{fontSize:10,color:hasResult?"rgba(255,255,255,.65)":"#333",marginTop:3}}>
                {US[to]}
              </div>
            </div>
            {/* Fracción acumulada -- siempre en su espacio */}
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

      {/* ══ TECLADO FIJO -- ocupa todo el espacio restante ═════ */}
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
  const[tool,setTool]=useState("spacing");
  const[tl,setTl]=useState(48),[ni,setNi]=useState(4),[iw,setIw]=useState(1.5),[us,setUs]=useState("in");
  const totalIn=cvt(tl,us,"in"),iwIn=cvt(iw,us,"in");
  const gap=ni>0?(totalIn-ni*iwIn)/(ni+1):0;
  const positions=Array.from({length:ni},(_,i)=>gap+i*(gap+iwIn));
  const PHI=1.61803398875;
  const[gv,setGv]=useState(24),[gu,setGu]=useState("in");
  const gIn=cvt(+gv,gu,"in");
  const[a,setA]=useState(3),[b,setB]=useState(4);
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
          <p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>Para estantes, balusters, tornillos -- distribución equidistante automática.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><FL>Largo total</FL><input type="number" inputMode="decimal" value={tl} onChange={e=>setTl(+e.target.value)} style={K.inp}/></div>
            <div><FL>Unidad</FL><select value={us} onChange={e=>setUs(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{US[u]}</option>)}</select></div>
            <div><FL>Cantidad de elementos</FL><input type="number" inputMode="numeric" value={ni} onChange={e=>setNi(Math.max(1,+e.target.value))} min={1} style={K.inp}/></div>
            <div><FL>Ancho de cada uno</FL><input type="number" inputMode="decimal" value={iw} onChange={e=>setIw(+e.target.value)} step=".125" style={K.inp}/></div>
          </div>
          {gap>0?(
            <>
              <MR top={`${fmt(cvt(gap,"in",us),4)} ${US[us]}`} bot={`${toFrac(gap,16)} -- ${ni+1} espacios iguales`}/>
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
          ):<p style={{color:C.red,fontSize:14,marginTop:12}}>⚠️ Los elementos son más anchos que el espacio.</p>}
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
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Lado corto (÷φ)</div><div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(cvt(gIn/PHI,"in",gu),3)} {US[gu]}</div></div>
            <div style={{flex:1,background:`${C.amber}15`,borderRadius:12,padding:"14px",textAlign:"center",border:`2px solid ${C.amber}`}}><div style={{fontSize:12,color:C.amber,fontWeight:700}}>Base</div><div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(+gv,3)} {US[gu]}</div></div>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Lado largo (×φ)</div><div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>{fmt(cvt(gIn*PHI,"in",gu),3)} {US[gu]}</div></div>
          </div>
          <Hint>Usado en muebles Shaker, arquitectura clásica y diseño moderno.</Hint>
        </div>
      )}
      {tool==="tri"&&(
        <div style={K.card}>
          <CL>Triángulo rectángulo</CL>
          <p style={{fontSize:14,color:C.ink3,marginBottom:16,lineHeight:1.5}}>Regla 3-4-5: si A=3, B=4 → C=5 = ángulo perfecto de 90°.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><FL>Lado A (pulgadas)</FL><input type="number" inputMode="decimal" value={a} onChange={e=>setA(+e.target.value)} style={K.inp}/></div>
            <div><FL>Lado B (pulgadas)</FL><input type="number" inputMode="decimal" value={b} onChange={e=>setB(+e.target.value)} style={K.inp}/></div>
          </div>
          <div style={{display:"flex",gap:12,marginTop:16}}>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Hipotenusa C</div><div style={{fontSize:22,fontWeight:800,color:C.amber,marginTop:4}}>{fmt(hyp,4)}"</div><div style={{fontSize:12,color:C.ink3,marginTop:2}}>{toFrac(hyp,16)}</div></div>
            <div style={{flex:1,background:C.field,borderRadius:12,padding:"14px",textAlign:"center"}}><div style={{fontSize:12,color:C.ink3,fontWeight:600}}>Ángulo A</div><div style={{fontSize:22,fontWeight:800,color:C.green,marginTop:4}}>{fmt(ang,2)}°</div><div style={{fontSize:12,color:C.ink3,marginTop:2}}>Ángulo B: {fmt(90-ang,2)}°</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MADERA -- PIE DE TABLA (rediseñado)
// ═══════════════════════════════════════════════════════════
function BoardTab({catalog}){
  const[rows,setRows]=useState([]);
  const[unit,setUnit]=useState("in");
  const[saved,setSaved]=useState(false);

  function addRow(){setRows(r=>[...r,{id:Date.now(),mat:"",L:"",W:"",T:"",qty:1,cpt:0}]);}
  function delRow(id){setRows(r=>r.filter(x=>x.id!==id));}
  function upd(id,k,v){setRows(r=>r.map(x=>x.id===id?{...x,[k]:v}:x));}
  function pickMat(id,name){
    const m=catalog.find(c=>c.name===name);
    setRows(r=>r.map(x=>x.id===id?{...x,mat:name,T:m?String(m.thick):x.T,cpt:m?m.cost:x.cpt}:x));
  }
  function parseM(v,u){
    const ws=parseWorkshopInput(String(v));
    return ws>0?cvt(ws,"in",u):cvt(parseFloat(v)||0,u,u);
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
      <PT>Calculadora de madera</PT>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <div style={{flex:1}}><FL>Unidad de medida</FL><select value={unit} onChange={e=>setUnit(e.target.value)} style={K.sel}>{UNITS.map(u=><option key={u} value={u}>{UL[u]} ({US[u]})</option>)}</select></div>
      </div>

      {/* Totales siempre arriba */}
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

      {/* Acciones */}
      {rows.length>0&&(
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <button onClick={reset} style={{flex:1,padding:"11px",background:`${C.red}12`,border:`1.5px solid ${C.red}33`,borderRadius:12,color:C.red,fontSize:14,fontWeight:600,cursor:"pointer"}}>🔄 Resetear</button>
          <button onClick={()=>setSaved(true)} style={{flex:1,padding:"11px",background:`${C.green}15`,border:`1.5px solid ${C.green}44`,borderRadius:12,color:C.green,fontSize:14,fontWeight:600,cursor:"pointer"}}>💾 Guardar compra</button>
        </div>
      )}
      {saved&&<div style={{padding:"10px 14px",background:`${C.green}15`,borderRadius:10,border:`1px solid ${C.green}44`,color:C.green,fontSize:13,fontWeight:600,marginBottom:14}}>✓ Compra guardada en esta sesión</div>}

      {/* Filas */}
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
        {rows.map((row,i)=>{
          const bfv=bfRow(row);
          return(
            <div key={row.id} style={{background:C.card,borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",padding:"10px 14px",background:C.field,gap:10,borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:700,color:C.amber,minWidth:24}}>#{i+1}</span>
                <select value={row.mat} onChange={e=>pickMat(row.id,e.target.value)} style={{flex:1,background:"transparent",border:"none",fontSize:15,fontWeight:600,color:C.ink1,cursor:"pointer"}}>
                  <option value="">-- Seleccionar madera --</option>
                  {catalog.map(m=><option key={m.id}>{m.name}</option>)}
                  <option value="Otro">Otro / Personalizado</option>
                </select>
                <button onClick={()=>delRow(row.id)} style={{background:`${C.red}15`,border:"none",color:C.red,borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"12px 14px 14px"}}>
                {[["Largo",row.L,"L"],["Ancho",row.W,"W"],["Grosor",row.T,"T"]].map(([l,v,k])=>(
                  <div key={k}>
                    <FL>{l} ({US[unit]})</FL>
                    <input value={v} onChange={e=>upd(row.id,k,e.target.value)} placeholder='Ej: 2 ft 3 1/8'
                      style={{...K.inp,textAlign:"center",padding:"10px 8px",fontSize:13,fontFamily:"monospace"}}/>
                  </div>
                ))}
                <div><FL>Cantidad</FL><input type="number" inputMode="numeric" value={row.qty||""} min={1} onChange={e=>upd(row.id,"qty",e.target.value)} style={{...K.inp,textAlign:"center",padding:"10px 8px"}}/></div>
                <div><FL>$/pie·tabla</FL><input type="number" inputMode="decimal" value={row.cpt||""} step=".01" onChange={e=>upd(row.id,"cpt",+e.target.value)} style={{...K.inp,textAlign:"center",padding:"10px 8px"}}/></div>
                <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                  <div style={{background:`${C.amber}15`,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:C.ink3,fontWeight:600}}>pie·tabla</div>
                    <div style={{fontSize:18,fontWeight:800,color:C.amber}}>{bfv.toFixed(2)}</div>
                    <div style={{fontSize:11,color:C.green,fontWeight:700}}>${(bfv*(row.cpt||0)).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <BtnG full onClick={addRow}>+ Agregar madera</BtnG>
      <Hint>Puedes escribir medidas tipo taller: <span style={{fontFamily:"monospace"}}>2 ft 3 1/8</span> · <span style={{fontFamily:"monospace"}}>3 5/16</span> · <span style={{fontFamily:"monospace"}}>96</span></Hint>

      {/* Nominal vs Real */}
      <STitle style={{marginTop:28}}>⚠️ Nominal vs. Real del lumber</STitle>
      <div style={K.card}>
        <p style={{fontSize:14,color:C.ink3,marginBottom:14,lineHeight:1.5}}>Un <strong style={{color:C.ink1}}>2×4 no mide 2"×4"</strong>. El nombre es comercial -- la medida real es diferente.</p>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr><th style={K.th}>Nombre</th><th style={K.th}>Medida real</th><th style={K.th}>En mm</th></tr></thead>
            <tbody>{NOMINAL.map(([n,r,mm])=>(
              <tr key={n}><td style={{...K.td,fontWeight:700,color:C.amber}}>{n}</td><td style={{...K.td,color:C.ink2}}>{r}</td><td style={{...K.td,color:C.blue,fontFamily:"monospace"}}>{mm} mm</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PROYECTOS PRO
// ═══════════════════════════════════════════════════════════
function ProjectsTab({projects,setProjects,catalog}){
  const[view,setView]=useState("list");
  const[aid,setAid]=useState(null);
  const[nf,setNf]=useState({name:"",client:"",clientTel:"",notes:"",status:"Pendiente"});
  const active=projects.find(p=>p.id===aid);
  function create(){if(!nf.name.trim())return;const p={id:Date.now(),cuts:[],markup:50,labor:0,laborType:"pct",...nf};setProjects(ps=>[...ps,p]);setAid(p.id);setView("detail");}
  function addCut(cut){setProjects(ps=>ps.map(p=>p.id===aid?{...p,cuts:[...p.cuts,{...cut,id:Date.now()}]}:p));}
  function delCut(cid){setProjects(ps=>ps.map(p=>p.id===aid?{...p,cuts:p.cuts.filter(c=>c.id!==cid)}:p));}
  function delProj(id){setProjects(ps=>ps.filter(p=>p.id!==id));}
  function updProj(id,key,val){setProjects(ps=>ps.map(p=>p.id===id?{...p,[key]:val}:p));}
  function matCost(p){return p.cuts.reduce((s,c)=>s+bfCalc(c.L,c.W,c.T,c.qty,"in")*c.cpt,0);}
  function projCalc(p){
    const mat=matCost(p);
    const markup=mat*(p.markup||0)/100;
    const laborBase=mat+markup;
    const labor=p.laborType==="fixed"?+(p.labor||0):laborBase*(p.labor||0)/100;
    return{mat,markup,labor,total:mat+markup+labor};
  }
  if(view==="detail"&&active)return<ProjDetail project={active} catalog={catalog} onBack={()=>setView("list")} onAdd={addCut} onDel={delCut} onUpd={(k,v)=>updProj(aid,k,v)} calc={projCalc(active)}/>;
  return(
    <div>
      <PT>Proyectos</PT>
      {view==="new"?(
        <div style={{...K.card,marginBottom:20}}>
          <CL>Nuevo proyecto</CL>
          <FL>Nombre del proyecto</FL>
          <input value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})} placeholder="Ej: Cocina integral" style={{...K.inp,marginBottom:12}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><FL>Cliente</FL><input value={nf.client} onChange={e=>setNf({...nf,client:e.target.value})} placeholder="Nombre del cliente" style={K.inp}/></div>
            <div><FL>Teléfono</FL><input value={nf.clientTel} onChange={e=>setNf({...nf,clientTel:e.target.value})} placeholder="555-000-0000" type="tel" style={K.inp}/></div>
          </div>
          <FL>Notas</FL>
          <textarea value={nf.notes} onChange={e=>setNf({...nf,notes:e.target.value})} placeholder="Detalles del proyecto..." style={{...K.inp,minHeight:60,lineHeight:1.5,marginBottom:14}}/>
          <FL>Estado</FL>
          <select value={nf.status} onChange={e=>setNf({...nf,status:e.target.value})} style={{...K.sel,marginBottom:18}}>{["Pendiente","En progreso","Completado","En pausa"].map(s=><option key={s}>{s}</option>)}</select>
          <div style={{display:"flex",gap:10}}><BtnG onClick={()=>setView("list")}>Cancelar</BtnG><BtnP onClick={create} style={{flex:2}}>Crear proyecto</BtnP></div>
        </div>
      ):<BtnP full onClick={()=>setView("new")} style={{marginBottom:20}}>+ Nuevo proyecto</BtnP>}
      {projects.length===0&&<ES icon="📋" text="Sin proyectos" sub="Crea uno para controlar tus cortes y costos"/>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {projects.map(p=>{
          const{total}=projCalc(p);
          return(
            <div key={p.id} style={{background:C.card,borderRadius:16,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 1px 5px rgba(0,0,0,0.05)",display:"flex",cursor:"pointer"}} onClick={()=>{setAid(p.id);setView("detail");}}>
              <div style={{width:5,background:STA_COLOR[p.status]||C.ink3,flexShrink:0}}/>
              <div style={{flex:1,padding:"16px"}}>
                <div style={{fontSize:17,fontWeight:700,color:C.ink1,marginBottom:4}}>{p.name}</div>
                {p.client&&<div style={{fontSize:14,color:C.ink3,marginBottom:6}}>👤 {p.client}{p.clientTel&&` · ${p.clientTel}`}</div>}
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:10,background:`${STA_COLOR[p.status]||C.ink3}20`,color:STA_COLOR[p.status]||C.ink3}}>{p.status}</span>
                  <span style={{fontSize:14,color:C.ink3}}>{p.cuts.length} piezas</span>
                  <span style={{fontSize:15,fontWeight:800,color:C.amber}}>${total.toFixed(2)}</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,paddingRight:12}}>
                <span style={{color:C.ink4,fontSize:22}}>›</span>
                <button onClick={e=>{e.stopPropagation();delProj(p.id);}} style={{background:`${C.red}12`,border:"none",borderRadius:8,color:C.red,padding:"6px 10px",fontSize:16,cursor:"pointer"}}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjDetail({project,catalog,onBack,onAdd,onDel,onUpd,calc}){
  const E={label:"",mat:"",L:"",W:"",T:"",qty:1,cpt:0};
  const[f,setF]=useState(E);
  const[showConfig,setShowConfig]=useState(false);
  function pickMat(name){const m=catalog.find(c=>c.name===name);setF(x=>({...x,mat:name,T:m?String(m.thick):x.T,cpt:m?m.cost:x.cpt}));}
  function add(){if(!f.mat||!f.L||!f.W)return;onAdd({...f,L:parseWorkshopInput(String(f.L))||parseFloat(f.L)||0,W:parseWorkshopInput(String(f.W))||parseFloat(f.W)||0,T:parseWorkshopInput(String(f.T))||parseFloat(f.T)||0});setF(E);}
  const totBF=project.cuts.reduce((s,c)=>s+bfCalc(c.L,c.W,c.T,c.qty,"in"),0);
  const QUICK_MARKUP=[50,100,150,200,300];
  const QUICK_LABOR=[25,50,100,200];
  return(
    <div>
      <BackBtn onClick={onBack}>Proyectos</BackBtn>
      <PT>{project.name}</PT>
      {project.client&&<p style={{fontSize:14,color:C.ink3,marginBottom:4}}>👤 {project.client}{project.clientTel&&<> · <a href={`tel:${project.clientTel}`} style={{color:C.blue,textDecoration:"none"}}>{project.clientTel}</a></>}</p>}
      {project.notes&&<p style={{fontSize:13,color:C.ink3,marginBottom:16,fontStyle:"italic"}}>{project.notes}</p>}

      {/* ── SECCIÓN 1: RESUMEN (solo lectura, no clickeable) ── */}
      <div style={{background:"#F8F4EE",borderRadius:16,padding:"16px 18px",marginBottom:16,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:.8,marginBottom:12}}>Resumen del proyecto</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          {[
            ["Materiales","$"+calc.mat.toFixed(2),C.ink1],
            ["Ganancia ("+project.markup+"%)","$"+calc.markup.toFixed(2),C.green],
            ["Mano de obra","$"+calc.labor.toFixed(2),C.blue],
            ["TOTAL FINAL","$"+calc.total.toFixed(2),C.amber],
          ].map(([lbl,val,col])=>(
            <div key={lbl} style={{background:C.white,borderRadius:10,padding:"10px 12px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,color:C.ink3,fontWeight:600,marginBottom:3}}>{lbl}</div>
              <div style={{fontSize:lbl==="TOTAL FINAL"?20:16,fontWeight:800,color:col,fontFamily:"monospace"}}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,color:C.ink4,textAlign:"right"}}>{project.cuts.length} piezas · {totBF.toFixed(2)} pie·tabla</div>
      </div>

      {/* ── SECCIÓN 2: ÁREA DE TRABAJO (interactiva) ── */}

      {/* PASO 1: Agregar pieza */}
      <div style={K.card}>
        <div style={{fontSize:13,fontWeight:800,color:C.ink1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:22,height:22,borderRadius:6,background:C.amber,color:C.white,fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>1</div>
          Agregar pieza
        </div>
        <FL>Nombre de la pieza</FL>
        <input value={f.label} onChange={e=>setF({...f,label:e.target.value})}
          placeholder="Ej: Lateral izquierdo" style={{...K.inp,marginBottom:12}}/>
        <FL>Material</FL>
        <select value={f.mat} onChange={e=>pickMat(e.target.value)} style={{...K.sel,marginBottom:12}}>
          <option value="">-- Seleccionar material --</option>
          {catalog.map(m=><option key={m.id}>{m.name}</option>)}
          <option value="Otro">Otro</option>
        </select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[["Largo\"",f.L,"L"],["Ancho\"",f.W,"W"],["Grosor\"",f.T,"T"],["Cantidad",f.qty,"qty"]].map(([l,v,k])=>(
            <div key={k}><FL>{l}</FL>
              <input value={v}
                onChange={e=>setF({...f,[k]:e.target.value})}
                placeholder={k==="qty"?"1":'Ej: 2 ft 3 1/8'}
                style={{...K.inp,fontFamily:k!=="qty"?"monospace":"inherit",fontSize:k!=="qty"?13:16}}/>
            </div>
          ))}
        </div>
        <FL>$ por pie de tabla</FL>
        <input type="number" inputMode="decimal" value={f.cpt||""}
          step=".01" onChange={e=>setF({...f,cpt:+e.target.value})}
          style={{...K.inp,marginBottom:14}}/>
        <BtnP full onClick={add}>+ Agregar pieza</BtnP>
      </div>

      {/* PASO 2: Lista de cortes */}
      {project.cuts.length>0&&(
        <div style={K.card}>
          <div style={{fontSize:13,fontWeight:800,color:C.ink1,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:6,background:C.amber,color:C.white,fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>2</div>
            Lista de cortes
          </div>
          {project.cuts.map(c=>{
            const bfv=bfCalc(c.L,c.W,c.T,c.qty,"in");
            return(
              <div key={c.id} style={{background:C.field,borderRadius:12,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:C.ink1}}>{c.label||c.mat}</div>
                  <div style={{fontSize:12,color:C.ink3,marginTop:2}}>{c.mat} · {c.L}"×{c.W}"×{c.T}" · {c.qty} pza</div>
                  <div style={{display:"flex",gap:14,marginTop:5}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.amber}}>{bfv.toFixed(3)} pt</span>
                    <span style={{fontSize:13,fontWeight:700,color:C.green}}>${(bfv*c.cpt).toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={()=>onDel(c.id)} style={{background:`${C.red}12`,border:"none",color:C.red,borderRadius:8,padding:"6px 10px",fontSize:16,cursor:"pointer"}}>✕</button>
              </div>
            );
          })}
          <div style={{display:"flex",gap:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:11,color:C.ink3}}>Total pie·tabla</div><div style={{fontSize:20,fontWeight:800,color:C.amber}}>{totBF.toFixed(2)}</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:11,color:C.ink3}}>Solo materiales</div><div style={{fontSize:20,fontWeight:800,color:C.green}}>${calc.mat.toFixed(2)}</div></div>
          </div>
        </div>
      )}

      {/* PASO 3: Configuración del proyecto */}
      <div style={K.card}>
        <div style={{fontSize:13,fontWeight:800,color:C.ink1,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:22,height:22,borderRadius:6,background:C.amber,color:C.white,fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>3</div>
            Configuración del proyecto
          </div>
          <button onClick={()=>setShowConfig(v=>!v)} style={{background:"transparent",border:"none",color:C.amber,fontSize:13,fontWeight:700,cursor:"pointer"}}>{showConfig?"Cerrar ▲":"Ajustar ▼"}</button>
        </div>
        {showConfig&&(
          <>
            <div style={{height:1,background:C.border,margin:"12px 0"}}/>
            <CL>Ganancia (Markup)</CL>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              {QUICK_MARKUP.map(v=>(
                <button key={v} onClick={()=>onUpd("markup",v)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${project.markup===v?C.amber:C.border}`,background:project.markup===v?`${C.amber}18`:"transparent",color:project.markup===v?C.amber:C.ink3,fontWeight:700,fontSize:14,cursor:"pointer"}}>{v}%</button>
              ))}
            </div>
            <FL>O ingresa % manual</FL>
            <input type="number" value={project.markup||""} onChange={e=>onUpd("markup",+e.target.value)} placeholder="0" style={{...K.inp,marginBottom:16}}/>
            <CL>Mano de obra</CL>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["pct","% del total"],["fixed","Valor fijo $"]].map(([v,l])=>(
                <button key={v} onClick={()=>onUpd("laborType",v)} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${project.laborType===v?C.blue:C.border}`,background:project.laborType===v?`${C.blue}12`:"transparent",color:project.laborType===v?C.blue:C.ink3,fontWeight:600,fontSize:13,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            {project.laborType==="pct"&&(
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {QUICK_LABOR.map(v=>(
                  <button key={v} onClick={()=>onUpd("labor",v)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${project.labor===v?C.blue:C.border}`,background:project.labor===v?`${C.blue}12`:"transparent",color:project.labor===v?C.blue:C.ink3,fontWeight:700,fontSize:14,cursor:"pointer"}}>{v}%</button>
                ))}
              </div>
            )}
            <FL>{project.laborType==="pct"?"% sobre (mat + ganancia)":"Valor fijo ($)"}</FL>
            <input type="number" value={project.labor||""} onChange={e=>onUpd("labor",+e.target.value)} placeholder="0" style={K.inp}/>
          </>
        )}
      </div>
    </div>
  );
}

function TotalLine({lbl,val,color,big}){
  return(
    <div style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px"}}>
      <div style={{fontSize:11,color:"#888",fontWeight:600}}>{lbl}</div>
      <div style={{fontSize:big?24:18,fontWeight:800,color:color||C.proText,fontFamily:"'DM Mono',monospace",marginTop:2}}>{val}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MIS MADERAS
// ═══════════════════════════════════════════════════════════
const EMAT={name:"",cat:"Blanda",thick:"",desc:"",cost:"",cu:"pie²",stock:"",su:"pie²",proveedor:"",tel:"",email:"",nota:""};
function CatalogTab({catalog,setCatalog}){
  const[view,setView]=useState("list");
  const[f,setF]=useState(EMAT);
  const[eid,setEid]=useState(null);
  const[filt,setFilt]=useState("Todos");
  const[expId,setExpId]=useState(null);
  const[libQ,setLibQ]=useState("");
  function openNew(){setF(EMAT);setEid(null);setView("form");}
  function openEdit(m){setEid(m.id);setF({...m,cost:String(m.cost),thick:String(m.thick),stock:String(m.stock)});setView("form");}
  function openSup(m){setEid(m.id);setF({...m});setView("supplier");}
  function fromLib(sp){setF({...EMAT,name:sp.name,cat:sp.cat,thick:String(sp.thick),cu:sp.cu,desc:sp.desc});setEid(null);setView("form");}
  function back(){setEid(null);setView("list");}
  function save(){if(!f.name.trim())return;const e={...f,cost:+f.cost||0,thick:+f.thick||0,stock:+f.stock||0};if(eid!==null)setCatalog(c=>c.map(m=>m.id===eid?{...e,id:eid}:m));else setCatalog(c=>[...c,{...e,id:Date.now()}]);back();}
  function saveSup(){setCatalog(c=>c.map(m=>m.id===eid?{...m,proveedor:f.proveedor,tel:f.tel,email:f.email,nota:f.nota}:m));back();}
  function del(id){if(!window.confirm("¿Eliminar esta madera?"))return;setCatalog(c=>c.filter(m=>m.id!==id));if(expId===id)setExpId(null);}
  const shown=filt==="Todos"?catalog:catalog.filter(m=>m.cat===filt);
  const libF=WOOD_LIB.filter(s=>s.name.toLowerCase().includes(libQ.toLowerCase())||s.cat.toLowerCase().includes(libQ.toLowerCase()));

  if(view==="library")return(
    <div>
      <BackBtn onClick={back}>Mi catálogo</BackBtn><PT>Biblioteca de maderas</PT>
      <input value={libQ} onChange={e=>setLibQ(e.target.value)} placeholder="🔍  Buscar especie..." style={{...K.inp,marginBottom:16,fontSize:16}}/>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {libF.map(sp=>{
          const already=catalog.some(m=>m.name===sp.name);
          return(
            <div key={sp.name} style={{background:C.card,borderRadius:14,display:"flex",overflow:"hidden",border:`1px solid ${C.border}`}}>
              <div style={{width:5,background:sp.color,flexShrink:0}}/>
              <div style={{flex:1,padding:"14px"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:16,fontWeight:700,color:C.ink1}}>{sp.name}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:`${CAT_COLOR[sp.cat]}22`,color:CAT_COLOR[sp.cat],fontWeight:700}}>{sp.cat}</span>
                  {sp.ext&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:`${C.green}18`,color:C.green,fontWeight:700}}>Exterior</span>}
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

  if(view==="supplier"){
    const mat=catalog.find(m=>m.id===eid);
    return(
      <div>
        <BackBtn onClick={back}>Volver</BackBtn><PT>Proveedor</PT>
        <p style={{fontSize:15,color:C.ink2,marginBottom:20,fontWeight:600}}>{mat?.name}</p>
        <div style={K.card}>
          <FL>Nombre del proveedor</FL><input value={f.proveedor||""} onChange={e=>setF({...f,proveedor:e.target.value})} placeholder="Maderas García, Home Depot..." style={{...K.inp,marginBottom:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><FL>Teléfono</FL><input value={f.tel||""} onChange={e=>setF({...f,tel:e.target.value})} type="tel" placeholder="555-000-0000" style={K.inp}/></div>
            <div><FL>Email</FL><input value={f.email||""} onChange={e=>setF({...f,email:e.target.value})} type="email" placeholder="ventas@..." style={K.inp}/></div>
          </div>
          <FL>Notas</FL><textarea value={f.nota||""} onChange={e=>setF({...f,nota:e.target.value})} placeholder="Descuentos, pedido mínimo, horario..." style={{...K.inp,minHeight:80,lineHeight:1.5}}/>
          <div style={{display:"flex",gap:10,marginTop:16}}><BtnG onClick={back}>Cancelar</BtnG><BtnP onClick={saveSup} style={{flex:2}}>Guardar proveedor</BtnP></div>
        </div>
      </div>
    );
  }

  if(view==="form")return(
    <div>
      <BackBtn onClick={back}>Mi catálogo</BackBtn><PT>{eid!==null?"Editar madera":"Nueva madera"}</PT>
      <div style={K.card}>
        <CL>Especie y tipo</CL>
        <FL>Nombre</FL><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Ej: Roble Blanco 4/4 Select" style={{...K.inp,marginBottom:14}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><FL>Categoría</FL><select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})} style={K.sel}>{["Blanda","Dura","Laminado","Otro"].map(c=><option key={c}>{c}</option>)}</select></div>
          <div><FL>Grosor (pulgadas)</FL><input type="number" inputMode="decimal" value={f.thick} step=".25" placeholder="0.75" onChange={e=>setF({...f,thick:e.target.value})} style={K.inp}/></div>
        </div>
        <FL style={{marginTop:12}}>Descripción</FL><input value={f.desc||""} onChange={e=>setF({...f,desc:e.target.value})} placeholder="Grado, acabado, características..." style={K.inp}/>
      </div>
      <div style={K.card}>
        <CL>Precio</CL>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <div><FL>Costo ($)</FL><input type="number" inputMode="decimal" value={f.cost} step=".01" placeholder="0.00" onChange={e=>setF({...f,cost:e.target.value})} style={K.inp}/></div>
          <div><FL>Por unidad</FL><select value={f.cu} onChange={e=>setF({...f,cu:e.target.value})} style={K.sel}>{COST_U.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
        </div>
        {+f.cost>0&&<div style={{marginTop:10,padding:"10px 14px",background:C.amberBg,borderRadius:10,borderLeft:`3px solid ${C.amber}`,fontSize:13}}><strong style={{color:C.amber}}>${(+f.cost).toFixed(2)}</strong> por {f.cu}{f.cu==="pie²"&&<span style={{color:C.ink3}}> · equiv. ${(+f.cost/0.0929).toFixed(2)}/m²</span>}{f.cu==="m²"&&<span style={{color:C.ink3}}> · equiv. ${(+f.cost*0.0929).toFixed(2)}/pie²</span>}</div>}
      </div>
      <div style={K.card}>
        <CL>Inventario</CL>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <div><FL>Stock</FL><input type="number" inputMode="numeric" value={f.stock} placeholder="0" onChange={e=>setF({...f,stock:e.target.value})} style={K.inp}/></div>
          <div><FL>Unidad</FL><select value={f.su||"pie²"} onChange={e=>setF({...f,su:e.target.value})} style={K.sel}>{STOCK_U.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
        </div>
      </div>
      <div style={K.card}>
        <CL>Proveedor</CL>
        <FL>Nombre del proveedor</FL><input value={f.proveedor||""} onChange={e=>setF({...f,proveedor:e.target.value})} placeholder="Maderas García, Home Depot..." style={{...K.inp,marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><FL>Teléfono</FL><input value={f.tel||""} onChange={e=>setF({...f,tel:e.target.value})} type="tel" placeholder="555-000-0000" style={K.inp}/></div>
          <div><FL>Email</FL><input value={f.email||""} onChange={e=>setF({...f,email:e.target.value})} type="email" placeholder="ventas@..." style={K.inp}/></div>
        </div>
        <FL>Notas</FL><textarea value={f.nota||""} onChange={e=>setF({...f,nota:e.target.value})} placeholder="Descuentos, pedido mínimo, horario..." style={{...K.inp,minHeight:70,lineHeight:1.5}}/>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:30}}><BtnG onClick={back}>Cancelar</BtnG><BtnP onClick={save} style={{flex:2}}>{eid!==null?"Guardar cambios":"Agregar al catálogo"}</BtnP></div>
    </div>
  );

  return(
    <div>
      <PT>Mis maderas</PT>
      <div style={{display:"flex",gap:10,marginBottom:18}}><BtnP onClick={openNew} style={{flex:1}}>+ Nueva madera</BtnP><BtnG onClick={()=>setView("library")} style={{flex:1}}>📚 Biblioteca</BtnG></div>
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
                    {+m.stock>0?<span style={{fontSize:12,padding:"2px 8px",borderRadius:8,background:`${C.green}15`,color:C.green,fontWeight:600}}>📦 {m.stock} {m.su}</span>:m.stock!==""&&<span style={{fontSize:12,padding:"2px 8px",borderRadius:8,background:`${C.red}12`,color:C.red,fontWeight:600}}>Sin stock</span>}
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
                    <button onClick={e=>{e.stopPropagation();openSup(m);}} style={K.btnG}>🏪 Proveedor</button>
                    <button onClick={e=>{e.stopPropagation();del(m.id);}} style={{...K.btnG,color:C.red,borderColor:`${C.red}44`}}>🗑 Borrar</button>
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
//  GUÍA PRO
// ═══════════════════════════════════════════════════════════
function RefTab(){
  const[sec,setSec]=useState("woods");
  return(
    <div>
      <PT>Guía de referencia</PT>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
        {[["woods","🌲 Maderas"],["nails","🔨 Clavos"],["screws","🪛 Tornillos"],["finishes","🪣 Acabados"],["tips","💡 Tips"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSec(k)} style={{padding:"9px 14px",borderRadius:20,fontSize:13,fontWeight:600,border:`1.5px solid ${sec===k?C.amber:C.border}`,background:sec===k?`${C.amber}15`:"transparent",color:sec===k?C.amber:C.ink3,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {sec==="woods"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {WOOD_LIB.map(w=>(
            <div key={w.name} style={{background:C.card,borderRadius:14,display:"flex",overflow:"hidden",border:`1px solid ${C.border}`}}>
              <div style={{width:5,background:w.color,flexShrink:0}}/>
              <div style={{flex:1,padding:"14px"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:5}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.ink1}}>{w.name}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:8,background:`${CAT_COLOR[w.cat]}18`,color:CAT_COLOR[w.cat],fontWeight:700}}>{w.cat}</span>
                  {w.ext&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:8,background:`${C.green}15`,color:C.green,fontWeight:700}}>Exterior ✓</span>}
                </div>
                <p style={{fontSize:13,color:C.ink3,lineHeight:1.5}}>{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {sec==="nails"&&(
        <div style={K.card}>
          <CL>Clavos -- sistema Pennyweight (d)</CL>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr><th style={K.th}>Calibre</th><th style={K.th}>Largo pulg</th><th style={K.th}>Largo mm</th></tr></thead>
            <tbody>{NAILS.map(([c,l,m])=>(
              <tr key={c}><td style={{...K.td,fontWeight:700,color:C.amber}}>{c}</td><td style={K.td}>{l}</td><td style={{...K.td,color:C.blue}}>{m}</td></tr>
            ))}</tbody>
          </table>
          <Hint>Mayor número = clavo más largo. El 16d es el más usado en estructuras de madera.</Hint>
          <div style={{marginTop:14,padding:"12px 14px",background:`${C.amber}08`,borderRadius:10,borderLeft:`3px solid ${C.amber}`,fontSize:13,color:C.ink2,lineHeight:1.6}}>
            <strong style={{color:C.amber}}>¿Cuándo usar clavos?</strong><br/>
            Framing y estructuras de madera, instalación de molduras, pisos de madera, trabajos donde se puede ver la cabeza. Evita clavos en madera dura cerca de los bordes -- pre-taladra o usa tornillos.
          </div>
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
          <div style={{marginTop:14,padding:"12px 14px",background:`${C.blue}08`,borderRadius:10,borderLeft:`3px solid ${C.blue}`,fontSize:13,color:C.ink2,lineHeight:1.6}}>
            <strong style={{color:C.blue}}>¿Cuándo usar tornillos?</strong><br/>
            Gabinetes, muebles, cualquier trabajo que pueda necesitar desmontarse. Los tornillos tienen 3x la fuerza de agarre de un clavo. Siempre pre-taladra en maderas duras y cerca de los bordes.
          </div>
        </div>
      )}

      {sec==="finishes"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {FINISHES.map(f=>(
            <div key={f.name} style={{background:C.card,borderRadius:14,padding:"16px",border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                <span style={{fontSize:15,fontWeight:700,color:C.ink1}}>{f.name}</span>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:8,background:`${C.amber}18`,color:C.amber,fontWeight:700}}>{f.type}</span>
              </div>
              <div style={{fontSize:13,color:C.ink3,marginBottom:6}}>📐 <strong style={{color:C.ink2}}>Uso:</strong> {f.uso}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div style={{background:`${C.green}10`,borderRadius:8,padding:"8px 10px",fontSize:12,color:C.green}}>✓ {f.pros}</div>
                <div style={{background:`${C.red}10`,borderRadius:8,padding:"8px 10px",fontSize:12,color:C.red}}>✗ {f.cons}</div>
              </div>
              <div style={{fontSize:12,color:C.ink3,background:C.field,borderRadius:8,padding:"8px 10px"}}>💡 {f.tip}</div>
            </div>
          ))}
        </div>
      )}

      {sec==="tips"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {TIPS.map(t=>(
            <div key={t.title} style={{background:C.card,borderRadius:14,padding:"16px",border:`1px solid ${C.border}`,display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:44,height:44,borderRadius:12,background:`${C.amber}18`,border:`1.5px solid ${C.amberBd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:C.ink1,marginBottom:5}}>{t.title}</div>
                <div style={{fontSize:13,color:C.ink3,lineHeight:1.6}}>{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRÉDITOS */}
      <div style={{marginTop:36,padding:"28px 22px",background:C.card,borderRadius:22,border:`1px solid ${C.border}`,textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
        <div style={{fontSize:32,marginBottom:10}}>🪵</div>
        <div style={{fontSize:22,fontWeight:900,letterSpacing:-.5,color:C.ink1,marginBottom:4}}>Cut<span style={{color:C.amber}}>Wise</span></div>
        <div style={{fontSize:13,color:C.ink3,marginBottom:18}}>Calculadora profesional de carpintería</div>
        <div style={{height:1,background:C.border,marginBottom:18}}/>
        <div style={{fontSize:11,color:C.ink4,marginBottom:6,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Creada por</div>
        <div style={{fontSize:22,fontWeight:900,color:C.amber,letterSpacing:-.3}}>Jorge Vinicio Meléndez</div>
        <div style={{fontSize:14,color:C.ink2,marginTop:6,fontWeight:600}}>Grain & Brand Studio, LLC</div>
        <div style={{fontSize:13,color:C.ink3,marginTop:4}}>Carpintería · Diseño · Tecnología</div>
        <div style={{marginTop:18,fontSize:12,color:C.ink4}}>© {new Date().getFullYear()} · Todos los derechos reservados</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ✦ CUT OPTIMIZER PRO TAB
// ═══════════════════════════════════════════════════════════
function ProTab({catalog,projects}){
  const[unlocked,setUnlocked]=useLS("cw_pro_unlocked",false);
  const[step,setStep]=useState(0);
  const[proUnit,setProUnit]=useState("cm");
  const[pieces,setPieces]=useState([]);
  const[sheets,setSheets]=useState([]);
  const[activeSheet,setActiveSheet]=useState(0);
  const[showPreset,setShowPreset]=useState(false);
  const[selPreset,setSelPreset]=useState(null);
  const[pDims,setPDims]=useState({w:60,h:85,d:60});
  const[newP,setNewP]=useState({name:"",qty:1,w:"",h:"",grain:"H"});
  const[sheetCfg,setSheetCfg]=useState({country:"MX",presetIdx:0,customW:122,customH:244,isCustom:false,material:"MDF",thicknessMM:18,kerfCM:0.3});
  const canvasRef=useRef(null);

  const PRO_UNITS={cm:{label:"cm",toBase:v=>v,fromBase:v=>v,step:0.5},mm:{label:"mm",toBase:v=>v/10,fromBase:v=>v*10,step:1},in:{label:"in",toBase:v=>v*2.54,fromBase:v=>v/2.54,step:0.25}};
  const pu=PRO_UNITS[proUnit];
  function toBasePro(v){return pu.toBase(parseFloat(v)||0);}
  function fmtPro(v){return parseFloat(pu.fromBase(v).toFixed(proUnit==="mm"?0:proUnit==="in"?3:1));}

  const SW=sheetCfg.isCustom?sheetCfg.customW:SHEET_PRESETS[sheetCfg.country][sheetCfg.presetIdx].w;
  const SH=sheetCfg.isCustom?sheetCfg.customH:SHEET_PRESETS[sheetCfg.country][sheetCfg.presetIdx].h;
  const T=sheetCfg.thicknessMM/10;
  const colorMap={};pieces.forEach((p,i)=>colorMap[p.name]=PRO_COLORS[i%PRO_COLORS.length]);
  const totalPcs=pieces.reduce((s,p)=>s+(p.qty||1),0);
  const totalArea=pieces.reduce((s,p)=>s+p.w*p.h*(p.qty||1),0);
  const effPct=sheets.length?((totalArea/(sheets.length*SW*SH))*100).toFixed(1):0;

  function addPiece(){
    if(!newP.name||newP.w===""||newP.h==="")return;
    setPieces([...pieces,{...newP,w:+newP.w,h:+newP.h,qty:parseInt(newP.qty)||1}]);
    setNewP({name:"",qty:1,w:"",h:"",grain:"H"});
  }
  function applyPreset(){
    const pr=CABINET_PRESETS.find(p=>p.id===selPreset);
    if(!pr||!pr.parts)return;
    const parts=pr.parts(pDims.w,pDims.h,pDims.d,T);
    setPieces([...pieces,...parts.map(p=>({...p,w:+p.w.toFixed(2),h:+p.h.toFixed(2)}))]);
    setShowPreset(false);setSelPreset(null);
  }
  function runOptimizer(){
    const res=optimizeCuts(pieces,SW,SH,sheetCfg.kerfCM);
    setSheets(res);setActiveSheet(0);setStep(2);
  }

  // Canvas
  useEffect(()=>{
    if(step!==2||!canvasRef.current||!sheets.length)return;
    const canvas=canvasRef.current;
    const ctx=canvas.getContext("2d");
    const sheet=sheets[activeSheet];if(!sheet)return;
    const PAD=20,CW=canvas.width,CH=canvas.height;
    const scale=Math.min((CW-PAD*2)/SW,(CH-PAD*2-28)/SH);
    const OX=PAD+(CW-PAD*2-SW*scale)/2,OY=PAD;
    ctx.clearRect(0,0,CW,CH);
    ctx.fillStyle="#2A2018";ctx.fillRect(OX,OY,SW*scale,SH*scale);
    ctx.strokeStyle="#8B6914";ctx.lineWidth=2;ctx.strokeRect(OX,OY,SW*scale,SH*scale);
    sheet.placements.forEach(p=>{
      const col=colorMap[p.name]||"#AAA";
      const px=OX+p.x*scale,py=OY+p.y*scale,pw=p.pw*scale,ph=p.ph*scale;
      ctx.fillStyle=col;ctx.globalAlpha=0.82;ctx.fillRect(px,py,pw,ph);
      ctx.globalAlpha=1;ctx.strokeStyle="rgba(0,0,0,0.35)";ctx.lineWidth=1.5;ctx.strokeRect(px,py,pw,ph);
      if(pw>24&&ph>16){
        const nm=p.name.length>9?p.name.slice(0,8)+"...":p.name;
        const fs=Math.max(7,Math.min(11,pw/9));
        ctx.fillStyle="rgba(0,0,0,0.7)";ctx.font=`bold ${fs}px Inter,sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(nm,px+pw/2,py+ph/2-fs*0.6);
        ctx.font=`${Math.max(6,fs-1)}px monospace`;
        ctx.fillText(`${fmtPro(p.w)}×${fmtPro(p.h)}${pu.label}`,px+pw/2,py+ph/2+fs*0.8);
      }
    });
    ctx.fillStyle="#555";ctx.font="11px monospace";ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillText(`${fmtPro(SW)}×${fmtPro(SH)} ${pu.label}`,OX+SW*scale/2,OY+SH*scale+5);
  },[step,sheets,activeSheet,colorMap,proUnit,SW,SH]);

  // ── PANTALLA DE PRESENTACIÓN ──────────────────────────────
  if(!unlocked){
    return(
      <div style={{color:C.proText}}>
        {/* Hero */}
        <div style={{background:"linear-gradient(135deg,#1a1008,#2d1a08)",borderRadius:20,padding:"28px 22px",marginBottom:20,border:`1px solid ${C.amber}44`,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>🪚</div>
          <div style={{fontSize:24,fontWeight:900,color:C.proGold,letterSpacing:-.5,marginBottom:6}}>Cut Optimizer PRO</div>
          <div style={{fontSize:14,color:"#aaa",lineHeight:1.6,marginBottom:20}}>Optimizador de corte para cabinets, muebles y cualquier proyecto en tableros</div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(232,193,77,0.15)",border:`1px solid ${C.proGold}44`,borderRadius:20,padding:"6px 16px"}}>
            <span style={{fontSize:12,fontWeight:800,color:C.proGold,letterSpacing:1}}>FUNCIÓN PREMIUM</span>
          </div>
        </div>

        {/* Features */}
        <div style={{marginBottom:20}}>
          {[
            ["🔲","Optimizador de tableros","Distribuye tus piezas en hojas de MDF, triplay o melanina minimizando el desperdicio"],
            ["🗄️","Gabinetes preinstalados","Genera el despiece completo de gabinetes base, aéreos, cajoneras y torres en segundos"],
            ["📊","Reporte de corte","Lista de cortes con posiciones exactas, eficiencia por tablero e instrucciones paso a paso"],
            ["🌍","Tableros internacionales","Tamaños estándar de México, EE.UU., Europa y Canadá -- o ingresa medidas personalizadas"],
            ["📐","Tres sistemas de unidades","Trabaja en cm, mm o pulgadas según lo que necesites"],
          ].map(([icon,title,desc])=>(
            <div key={title} style={{display:"flex",gap:14,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"16px",border:"1px solid rgba(255,255,255,0.07)",marginBottom:10}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(232,193,77,0.15)",border:`1px solid ${C.proGold}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:C.proText,marginBottom:3}}>{title}</div>
                <div style={{fontSize:13,color:"#666",lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{background:"linear-gradient(135deg,rgba(232,193,77,0.15),rgba(232,193,77,0.05))",border:`1px solid ${C.proGold}44`,borderRadius:16,padding:"20px",textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:13,color:"#888",marginBottom:6}}>Desbloquear Cut Optimizer PRO</div>
          <div style={{fontSize:36,fontWeight:900,color:C.proGold,marginBottom:4}}>$4.99</div>
          <div style={{fontSize:12,color:"#555",marginBottom:18}}>Pago único · Sin suscripción</div>
          <button onClick={()=>setUnlocked(true)} style={{width:"100%",padding:"17px",background:`linear-gradient(135deg,${C.proGold},#B87A08)`,border:"none",borderRadius:14,fontSize:17,fontWeight:800,color:"#1A1A28",cursor:"pointer",boxShadow:`0 6px 24px ${C.proGold}44`,letterSpacing:-.1}}>
            ✦ Desbloquear ahora
          </button>
          <div style={{fontSize:11,color:"#444",marginTop:10}}>Demo: toca para activar y probar</div>
        </div>
      </div>
    );
  }

  // ── OPTIMIZER DESBLOQUEADO ────────────────────────────────
  // Step nav
  const STEPS=[{id:0,icon:"📋",label:"Piezas"},{id:1,icon:"⚙️",label:"Tablero"},{id:2,icon:"🔲",label:"Layout"},{id:3,icon:"📊",label:"Reporte"}];

  return(
    <div style={{color:C.proText}}>
      {/* Step nav */}
      <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:12,marginBottom:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>{if(s.id<=1||sheets.length>0)setStep(s.id);}}
            style={{flex:1,padding:"13px 4px 11px",background:step===s.id?"rgba(232,193,77,0.12)":"transparent",borderRight:i<3?"1px solid rgba(255,255,255,0.06)":"none",border:"none",borderBottom:step===s.id?`2px solid ${C.proGold}`:"2px solid transparent",cursor:(s.id<=1||sheets.length>0)?"pointer":"default",opacity:(s.id>1&&!sheets.length)?0.35:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:18}}>{s.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:step===s.id?C.proGold:"#555",letterSpacing:.5}}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── STEP 0: PIEZAS ── */}
      {step===0&&(
        <div>
          {/* Unit toggle */}
          <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:12,padding:4,gap:3,marginBottom:20}}>
            {Object.entries(PRO_UNITS).map(([key,u])=>(
              <button key={key} onClick={()=>setProUnit(key)} style={{flex:1,padding:"10px 8px",borderRadius:9,border:"none",cursor:"pointer",background:proUnit===key?C.proGold:"transparent",color:proUnit===key?"#1A1A28":"#888",fontSize:15,fontWeight:700,transition:"all .18s"}}>{u.label}</button>
            ))}
          </div>

          {/* Stats */}
          {pieces.length>0&&(
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              {[["Tipos",pieces.length],["Total pzs",totalPcs]].map(([l,v])=>(
                <div key={l} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:800,color:C.proGold,fontFamily:"'DM Mono',monospace"}}>{v}</div>
                  <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Preset */}
          <button onClick={()=>setShowPreset(true)} style={{width:"100%",padding:"17px",background:"rgba(255,255,255,0.05)",border:"1.5px dashed rgba(255,255,255,0.15)",borderRadius:14,color:"#AAA",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
            <span style={{fontSize:22}}>🗄️</span> Usar gabinete preinstalado
          </button>

          {/* Add piece */}
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:14}}>Agregar pieza manual</div>
            <FL style={{color:"#888"}}>Nombre de la pieza</FL>
            <input style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px 16px",color:C.proText,fontFamily:"'DM Mono',monospace",fontSize:16,outline:"none",marginBottom:12}} placeholder="Ej: Lateral izquierdo" value={newP.name} onChange={e=>setNewP({...newP,name:e.target.value})}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {[["Ancho","w"],["Alto","h"]].map(([l,k])=>(
                <div key={k}>
                  <FL style={{color:"#888"}}>{l} ({pu.label})</FL>
                  <input type="number" inputMode="decimal" step={pu.step} value={newP[k]===""?"":fmtPro(+newP[k]||0)} onChange={e=>setNewP({...newP,[k]:e.target.value===""?"":toBasePro(e.target.value)})}
                    style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px 14px",color:C.proText,fontFamily:"'DM Mono',monospace",fontSize:18,outline:"none"}}/>
                </div>
              ))}
            </div>
            {/* Grain */}
            <FL style={{color:"#888"}}>Dirección de veta</FL>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["H","→ Horizontal"],["V","↑ Vertical"],["N","Sin veta"]].map(([v,l])=>(
                <button key={v} onClick={()=>setNewP({...newP,grain:v})} style={{flex:1,padding:"12px 6px",borderRadius:12,border:`1.5px solid ${newP.grain===v?C.proGold:"rgba(255,255,255,0.1)"}`,background:newP.grain===v?"rgba(232,193,77,0.15)":"rgba(255,255,255,0.04)",color:newP.grain===v?C.proGold:"#777",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
              <div style={{fontSize:13,color:"#888",paddingTop:6}}>Cantidad</div>
              <input type="number" min={1} value={newP.qty} onChange={e=>setNewP({...newP,qty:e.target.value})}
                style={{background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"12px 14px",color:C.proText,fontFamily:"'DM Mono',monospace",fontSize:16,outline:"none"}}/>
            </div>
            <button onClick={addPiece} disabled={!newP.name||newP.w===""||newP.h===""} style={{width:"100%",padding:"15px",background:(!newP.name||newP.w===""||newP.h==="")?"rgba(255,255,255,0.06)":C.proGold,color:(!newP.name||newP.w===""||newP.h==="")?"#444":"#1A1A28",border:"none",borderRadius:14,fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:(!newP.name||newP.w===""||newP.h==="")?"none":`0 4px 20px rgba(232,193,77,0.25)`}}>
              ＋ Agregar pieza
            </button>
          </div>

          {/* Piece list */}
          {pieces.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:12}}>Lista ({totalPcs} piezas)</div>
              {pieces.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"13px 16px",marginBottom:10}}>
                  <div style={{width:14,height:14,borderRadius:4,background:PRO_COLORS[i%PRO_COLORS.length],flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700,color:C.proText}}>{p.name} <span style={{color:C.proGold,fontSize:13}}>×{p.qty}</span></div>
                    <div style={{fontSize:12,color:"#666",fontFamily:"'DM Mono',monospace",marginTop:3}}>{fmtPro(p.w)}{pu.label} × {fmtPro(p.h)}{pu.label} · {p.grain==="H"?"→ H":p.grain==="V"?"↑ V":"--"}</div>
                  </div>
                  <button onClick={()=>setPieces(pieces.filter((_,j)=>j!==i))} style={{width:36,height:36,borderRadius:10,background:"rgba(220,80,80,0.12)",border:"1px solid rgba(220,80,80,0.25)",color:"#F08080",fontSize:16,cursor:"pointer"}}>✕</button>
                </div>
              ))}
            </div>
          )}
          {pieces.length>0&&(
            <button onClick={()=>setStep(1)} style={{width:"100%",padding:"17px",background:C.proGold,border:"none",borderRadius:14,fontSize:17,fontWeight:700,color:"#1A1A28",cursor:"pointer",boxShadow:`0 4px 20px rgba(232,193,77,0.25)`,marginTop:8}}>
              Siguiente: Configurar tablero →
            </button>
          )}
        </div>
      )}

      {/* ── STEP 1: TABLERO ── */}
      {step===1&&(
        <div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:10}}>País / Región</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[...Object.keys(SHEET_PRESETS),"custom"].map(c=>{
                const isOn=sheetCfg.isCustom?(c==="custom"):(sheetCfg.country===c&&c!=="custom");
                return<button key={c} onClick={()=>c==="custom"?setSheetCfg({...sheetCfg,isCustom:true}):setSheetCfg({...sheetCfg,country:c,presetIdx:0,isCustom:false})}
                  style={{padding:"10px 16px",borderRadius:20,border:`1.5px solid ${isOn?C.proGold:"rgba(255,255,255,0.1)"}`,background:isOn?"rgba(232,193,77,0.2)":"rgba(255,255,255,0.06)",color:isOn?C.proGold:"#888",fontWeight:700,fontSize:14,cursor:"pointer"}}>{c==="custom"?"✎ Custom":c}</button>;
              })}
            </div>
          </div>

          {!sheetCfg.isCustom?(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:10}}>Tamaño de tablero</div>
              <select style={{width:"100%",background:"rgba(30,28,50,0.98)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px 16px",color:C.proText,fontSize:16,outline:"none"}} value={sheetCfg.presetIdx} onChange={e=>setSheetCfg({...sheetCfg,presetIdx:+e.target.value})}>
                {SHEET_PRESETS[sheetCfg.country].map((p,i)=><option key={i} value={i}>{p.label} -- {fmtPro(p.w)}{pu.label} × {fmtPro(p.h)}{pu.label}</option>)}
              </select>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[["Ancho tablero","customW"],["Alto tablero","customH"]].map(([l,k])=>(
                <div key={k}>
                  <FL style={{color:"#888"}}>{l} ({pu.label})</FL>
                  <input type="number" inputMode="decimal" value={fmtPro(sheetCfg[k])} onChange={e=>setSheetCfg({...sheetCfg,[k]:toBasePro(e.target.value)})}
                    style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px",color:C.proText,fontFamily:"'DM Mono',monospace",fontSize:18,outline:"none"}}/>
                </div>
              ))}
            </div>
          )}

          {/* Material */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:10}}>Material</div>
            <select style={{width:"100%",background:"rgba(30,28,50,0.98)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px 16px",color:C.proText,fontSize:16,outline:"none"}} value={sheetCfg.material} onChange={e=>setSheetCfg({...sheetCfg,material:e.target.value})}>
              {PRO_MATS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Grosor */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:10}}>Grosor del tablero</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {THICKNESS_MM.map(t=>{
                const isOn=sheetCfg.thicknessMM===t;
                const label=proUnit==="mm"?`${t}mm`:proUnit==="in"?`${(t/25.4).toFixed(2)}"`:`${(t/10).toFixed(1)}cm`;
                return<button key={t} onClick={()=>setSheetCfg({...sheetCfg,thicknessMM:t})} style={{padding:"10px 14px",borderRadius:20,border:`1.5px solid ${isOn?C.proGold:"rgba(255,255,255,0.1)"}`,background:isOn?"rgba(232,193,77,0.2)":"rgba(255,255,255,0.06)",color:isOn?C.proGold:"#888",fontWeight:700,fontSize:13,cursor:"pointer"}}>{label}</button>;
              })}
            </div>
          </div>

          {/* Kerf */}
          <div style={{marginBottom:20}}>
            <FL style={{color:"#888"}}>Sangría de sierra - kerf ({pu.label})</FL>
            <input type="number" inputMode="decimal" value={fmtPro(sheetCfg.kerfCM)} onChange={e=>setSheetCfg({...sheetCfg,kerfCM:+toBasePro(e.target.value)})}
              style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"14px",color:C.proText,fontFamily:"'DM Mono',monospace",fontSize:18,outline:"none",marginBottom:8}}/>
            <div style={{fontSize:12,color:"#444"}}>Típico: sierra circular 3mm · sierra de mesa 3.2mm · CNC 6mm</div>
          </div>

          <button onClick={runOptimizer} disabled={pieces.length===0} style={{width:"100%",padding:"17px",background:pieces.length===0?"rgba(255,255,255,0.06)":C.proGold,color:pieces.length===0?"#444":"#1A1A28",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:pieces.length===0?"none":`0 4px 20px rgba(232,193,77,0.25)`}}>
            🔲 Optimizar corte ({totalPcs} piezas)
          </button>
        </div>
      )}

      {/* ── STEP 2: LAYOUT ── */}
      {step===2&&sheets.length>0&&(
        <div>
          {/* Stats */}
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            {[["Tableros",sheets.length],["Eficiencia",`${effPct}%`],["Desperdicio",`${(100-effPct).toFixed(1)}%`]].map(([l,v])=>(
              <div key={l} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:C.proGold,fontFamily:"'DM Mono',monospace"}}>{v}</div>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:.5,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Sheet tabs */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {sheets.map((_,i)=>(
              <button key={i} onClick={()=>setActiveSheet(i)} style={{padding:"9px 16px",borderRadius:20,border:`1.5px solid ${activeSheet===i?C.proGold:"rgba(255,255,255,0.1)"}`,background:activeSheet===i?"rgba(232,193,77,0.2)":"rgba(255,255,255,0.06)",color:activeSheet===i?C.proGold:"#888",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                Tablero {i+1} <span style={{opacity:.5,fontSize:12}}>({sheets[i].placements.length}pz)</span>
              </button>
            ))}
          </div>
          {/* Canvas */}
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",marginBottom:16}}>
            <canvas ref={canvasRef} width={520} height={420} style={{width:"100%",height:"auto",display:"block"}}/>
          </div>
          {/* Legend */}
          {sheets[activeSheet]?.placements.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{width:12,height:12,borderRadius:3,background:colorMap[p.name]||"#ccc",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:C.proText}}>{p.name} {p.rot&&<span style={{fontSize:11,padding:"1px 7px",borderRadius:6,background:"rgba(232,193,77,0.2)",color:C.proGold}}>rotada 90°</span>}</div>
                <div style={{fontSize:12,color:"#666",fontFamily:"'DM Mono',monospace",marginTop:2}}>{fmtPro(p.pw)}{pu.label} × {fmtPro(p.ph)}{pu.label} @ ({fmtPro(p.x)}, {fmtPro(p.y)})</div>
              </div>
            </div>
          ))}
          <button onClick={()=>setStep(3)} style={{width:"100%",padding:"17px",background:C.proGold,border:"none",borderRadius:14,fontSize:17,fontWeight:700,color:"#1A1A28",cursor:"pointer",marginTop:8,boxShadow:`0 4px 20px rgba(232,193,77,0.25)`}}>Ver reporte completo →</button>
        </div>
      )}

      {/* ── STEP 3: REPORTE ── */}
      {step===3&&(
        <div>
          <div style={{background:"linear-gradient(135deg,rgba(139,105,20,0.25),rgba(232,193,77,0.05))",border:"1px solid rgba(139,105,20,0.35)",borderRadius:16,padding:"18px 20px",marginBottom:20}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:4,color:C.proText}}>📋 Reporte de Corte</div>
            <div style={{fontSize:13,color:"#666"}}>{sheetCfg.material} · {sheetCfg.thicknessMM}mm · {fmtPro(SW)}×{fmtPro(SH)}{pu.label} · kerf {fmtPro(sheetCfg.kerfCM)}{pu.label}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {[["Total piezas",totalPcs],["Tableros",sheets.length],["Eficiencia",`${effPct}%`],["Desperdicio",`${(100-effPct).toFixed(1)}%`]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px"}}>
                <div style={{fontSize:11,color:"#555",textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                <div style={{fontSize:22,fontWeight:800,color:C.proGold,fontFamily:"'DM Mono',monospace",marginTop:4}}>{v}</div>
              </div>
            ))}
          </div>
          {/* Despiece table */}
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:14,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",marginBottom:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"rgba(255,255,255,0.04)"}}>
                {["","Pieza","Cant",`A(${pu.label})`,`H(${pu.label})`,"Veta"].map(h=><th key={h} style={{padding:"11px 12px",textAlign:"left",color:"#555",fontWeight:700,fontSize:11,letterSpacing:.5,textTransform:"uppercase"}}>{h}</th>)}
              </tr></thead>
              <tbody>{pieces.map((p,i)=>(
                <tr key={i} style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  <td style={{padding:"11px 12px"}}><div style={{width:11,height:11,borderRadius:3,background:PRO_COLORS[i%PRO_COLORS.length]}}/></td>
                  <td style={{padding:"11px 12px",fontWeight:700,color:C.proText}}>{p.name}</td>
                  <td style={{padding:"11px 12px",color:C.proGold,fontFamily:"'DM Mono',monospace"}}>{p.qty}</td>
                  <td style={{padding:"11px 12px",fontFamily:"'DM Mono',monospace",color:C.proText}}>{fmtPro(p.w)}</td>
                  <td style={{padding:"11px 12px",fontFamily:"'DM Mono',monospace",color:C.proText}}>{fmtPro(p.h)}</td>
                  <td style={{padding:"11px 12px",color:"#666"}}>{p.grain==="H"?"→ H":p.grain==="V"?"↑ V":"--"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Per sheet */}
          {sheets.map((sh,si)=>{
            const eff=((sh.usedArea/(SW*SH))*100).toFixed(1);
            return(
              <div key={si} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:C.proText}}>Tablero {si+1}</span>
                  <span style={{fontSize:13,color:C.proGold,fontWeight:700}}>Uso: {eff}%</span>
                </div>
                <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.08)",overflow:"hidden",marginBottom:12}}>
                  <div style={{height:"100%",borderRadius:3,width:`${eff}%`,background:`linear-gradient(90deg,#8B6914,${C.proGold})`}}/>
                </div>
                {sh.placements.map((p,pi)=>(
                  <div key={pi} style={{display:"flex",gap:10,padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)",alignItems:"flex-start"}}>
                    <span style={{color:C.proGold,fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,minWidth:22,marginTop:1}}>{pi+1}.</span>
                    <div style={{width:10,height:10,borderRadius:2,background:colorMap[p.name]||"#ccc",flexShrink:0,marginTop:3}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:C.proText}}>{p.name}{p.rot&&<span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:5,background:"rgba(232,193,77,0.2)",color:C.proGold}}>rotada</span>}</div>
                      <div style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",marginTop:2}}>{fmtPro(p.pw)}×{fmtPro(p.ph)}{pu.label} → pos({fmtPro(p.x)},{fmtPro(p.y)})</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <button onClick={()=>{setSheets([]);setStep(0);setPieces([]);}} style={{width:"100%",padding:"15px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,fontSize:15,fontWeight:700,color:"#888",cursor:"pointer"}}>
            🔄 Nuevo proyecto
          </button>
        </div>
      )}

      {/* ── PRESET MODAL ── */}
      {showPreset&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowPreset(false)}>
          <div style={{background:"#1E1C32",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"82vh",overflow:"auto",padding:"24px 24px calc(env(safe-area-inset-bottom,0px) + 80px)",border:"1px solid rgba(255,255,255,0.1)"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)",margin:"0 auto 20px"}}/>
            <div style={{fontSize:18,fontWeight:800,color:C.proText,marginBottom:4}}>Gabinete Preinstalado</div>
            <div style={{fontSize:13,color:"#555",marginBottom:20}}>Genera el despiece automáticamente</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {CABINET_PRESETS.map(pr=>(
                <button key={pr.id} onClick={()=>setSelPreset(pr.id)} style={{background:selPreset===pr.id?"rgba(232,193,77,0.15)":"rgba(255,255,255,0.04)",border:`2px solid ${selPreset===pr.id?C.proGold:"rgba(255,255,255,0.08)"}`,borderRadius:14,padding:"16px 14px",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                  <div style={{fontSize:24,marginBottom:8}}>{pr.icon}</div>
                  <div style={{fontSize:14,fontWeight:800,color:C.proText}}>{pr.name}</div>
                  <div style={{fontSize:11,color:"#555",marginTop:3}}>{pr.hint}</div>
                </button>
              ))}
            </div>
            {selPreset&&selPreset!=="custom"&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:.8,color:"#555",textTransform:"uppercase",marginBottom:10}}>Medidas del gabinete ({pu.label})</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[["w","Ancho"],["h","Alto"],["d","Prof."]].map(([k,l])=>(
                    <div key={k}>
                      <FL style={{color:"#888"}}>{l}</FL>
                      <input type="number" inputMode="decimal" step={pu.step} value={fmtPro(toBasePro(pDims[k]))} onChange={e=>setPDims({...pDims,[k]:parseFloat(pu.fromBase(toBasePro(e.target.value)).toFixed(1))||0})}
                        style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"12px 10px",color:C.proText,fontFamily:"'DM Mono',monospace",fontSize:16,outline:"none"}}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowPreset(false)} style={{flex:1,padding:"15px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,color:"#888",fontSize:15,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
              <button onClick={applyPreset} disabled={!selPreset||selPreset==="custom"} style={{flex:2,padding:"15px",background:!selPreset||selPreset==="custom"?"rgba(255,255,255,0.06)":C.proGold,border:"none",borderRadius:14,color:!selPreset||selPreset==="custom"?"#444":"#1A1A28",fontSize:16,fontWeight:800,cursor:"pointer"}}>
                ＋ Agregar piezas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MICRO COMPONENTES
// ═══════════════════════════════════════════════════════════
function PT({children}){return<h1 style={{fontSize:28,fontWeight:900,letterSpacing:-.8,color:C.ink1,marginBottom:20,lineHeight:1.1}}>{children}</h1>;}
function STitle({children,style:st}){return<div style={{fontSize:14,fontWeight:700,color:C.ink2,marginBottom:10,marginTop:4,...(st||{})}}>{children}</div>;}
function CL({children}){return<div style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:.7,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>{children}</div>;}
function FL({children,style:st}){return<div style={{fontSize:14,fontWeight:600,color:C.ink2,marginBottom:7,...(st||{})}}>{children}</div>;}
function MR({top,bot}){return<div style={{marginTop:14,padding:"14px 12px",background:C.amberBg,borderRadius:12,textAlign:"center",border:`1.5px solid ${C.amberBd}`}}><div style={{fontSize:26,fontWeight:900,color:C.amber,letterSpacing:-.5}}>{top}</div><div style={{fontSize:13,color:C.ink3,marginTop:4}}>{bot}</div></div>;}
function Hint({children}){return<div style={{fontSize:13,color:C.ink3,marginTop:12,padding:"8px 12px",background:C.field,borderRadius:8,borderLeft:`3px solid ${C.amberBd}`,lineHeight:1.5}}>💡 {children}</div>;}
function ES({icon,text,sub}){return<div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:52,marginBottom:12}}>{icon}</div><div style={{fontSize:18,fontWeight:700,color:C.ink2,marginBottom:6}}>{text}</div><div style={{fontSize:14,color:C.ink3,lineHeight:1.6}}>{sub}</div></div>;}
function Pill({lbl,val}){return<div style={{background:C.card,borderRadius:10,padding:"7px 12px",border:`1px solid ${C.border}`}}><div style={{fontSize:11,color:C.ink4,fontWeight:600}}>{lbl}</div><div style={{fontSize:14,fontWeight:700,color:C.amber,marginTop:2}}>{val}</div></div>;}
function BackBtn({children,onClick}){return<button onClick={onClick} style={{background:"transparent",border:"none",color:C.amber,fontSize:16,fontWeight:600,padding:"0 0 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>‹ {children}</button>;}
function BtnP({children,onClick,full,style:st}){return<button onClick={onClick} style={{padding:"15px 22px",background:C.amber,border:"none",borderRadius:14,fontWeight:700,fontSize:16,color:C.white,boxShadow:`0 4px 14px ${C.amber}55`,letterSpacing:-.1,cursor:"pointer",...(full?{width:"100%"}:{}),...(st||{})}}>{children}</button>;}
function BtnG({children,onClick,full,style:st}){return<button onClick={onClick} style={{padding:"15px 18px",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:14,fontWeight:600,fontSize:15,color:C.ink2,cursor:"pointer",...(full?{width:"100%"}:{}),...(st||{})}}>{children}</button>;}

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
