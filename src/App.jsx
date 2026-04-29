import { useState, useCallback, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   CUTWISE v2 — La app de carpintería que los demás no hicieron
   
   GAP ANALYSIS vs competencia (WoodMaster, Chippy, KerfMaker, Construction Master):
   ✓ Conversor completo métrico ↔ imperial (todos los combos)
   ✓ Fracciones ↔ decimal ↔ mm con tabla de referencia visual
   ✓ Medidas NOMINALES vs REALES del lumber (nadie lo hace bien)
   ✓ Calculadora de pie de tabla con tally múltiple
   ✓ Razón áurea / proporción áurea para diseño
   ✓ Espaciado de estantes / balusters
   ✓ Proyectos con lista de cortes y costo total
   ✓ Catálogo de materiales personalizable
   ✓ Guía de especies de madera
   ✓ Tabla de clavos y tornillos
   ✓ Sin suscripciones, sin anuncios, 100% funcional offline
   
   Design: Warm industrial — textura madera + acento ámbar + tipografía técnica
═══════════════════════════════════════════════════════════════ */

// ─── CONVERSIÓN ────────────────────────────────────────────────
const TO_MM = { mm:1, cm:10, m:1000, in:25.4, ft:304.8, yd:914.4 };
const UNITS = ["mm","cm","m","in","ft","yd"];
const UL = { mm:"Milímetros", cm:"Centímetros", m:"Metros", in:'Pulgadas "', ft:"Pies ft", yd:"Yardas" };
const US = { mm:"mm", cm:"cm", m:"m", in:'"', ft:"ft", yd:"yd" };

function cvt(v, f, t) {
  if (!v || f === t) return parseFloat(v) || 0;
  return (parseFloat(v) * TO_MM[f]) / TO_MM[t];
}

// ─── FRACCIONES ────────────────────────────────────────────────
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function simplify(n, d) { const g = gcd(Math.abs(n), Math.abs(d)); return [n/g, d/g]; }
function decToFrac(dec, denom = 16) {
  const neg = dec < 0;
  const abs = Math.abs(dec);
  const whole = Math.floor(abs);
  const frac = abs - whole;
  const rawNum = Math.round(frac * denom);
  if (rawNum === 0) return `${neg?"-":""}${whole}"`;
  if (rawNum === denom) return `${neg?"-":""}${whole + 1}"`;
  const [n, d] = simplify(rawNum, denom);
  const prefix = neg ? "-" : "";
  return whole > 0 ? `${prefix}${whole} ${n}/${d}"` : `${prefix}${n}/${d}"`;
}

// ─── BOARD FEET ────────────────────────────────────────────────
function bf(L, W, T, qty, unit) {
  const l = cvt(L, unit, "in"), w = cvt(W, unit, "in"), t = cvt(T, unit, "in");
  return (l * w * t * (qty||1)) / 144;
}

// ─── DATOS: NOMINAL vs REAL ────────────────────────────────────
const NOMINAL_REAL = [
  ["1×2",  "¾\" × 1½\"",   "19×38 mm"],
  ["1×3",  "¾\" × 2½\"",   "19×64 mm"],
  ["1×4",  "¾\" × 3½\"",   "19×89 mm"],
  ["1×6",  "¾\" × 5½\"",   "19×140 mm"],
  ["1×8",  "¾\" × 7¼\"",   "19×184 mm"],
  ["1×10", "¾\" × 9¼\"",   "19×235 mm"],
  ["1×12", "¾\" × 11¼\"",  "19×286 mm"],
  ["2×2",  "1½\" × 1½\"",  "38×38 mm"],
  ["2×3",  "1½\" × 2½\"",  "38×64 mm"],
  ["2×4",  "1½\" × 3½\"",  "38×89 mm"],
  ["2×6",  "1½\" × 5½\"",  "38×140 mm"],
  ["2×8",  "1½\" × 7¼\"",  "38×184 mm"],
  ["2×10", "1½\" × 9¼\"",  "38×235 mm"],
  ["2×12", "1½\" × 11¼\"", "38×286 mm"],
  ["4×4",  "3½\" × 3½\"",  "89×89 mm"],
  ["4×6",  "3½\" × 5½\"",  "89×140 mm"],
  ["6×6",  "5½\" × 5½\"",  "140×140 mm"],
];

// ─── DATOS: MADERAS ────────────────────────────────────────────
const WOOD_SPECIES = [
  { name:"Pino (Pine)",         hardness:"Blanda · 1,075 lbf", density:"0.51", color:"#E8D5A3", uses:"Estructuras, muebles pintados, molduras, machimbre" },
  { name:"Cedro (Cedar)",       hardness:"Blanda · 900 lbf",   density:"0.37", color:"#C8956B", uses:"Closets, exterior, botes, saunas, aromatic" },
  { name:"Roble Blanco",        hardness:"Dura · 1,360 lbf",   density:"0.77", color:"#A07040", uses:"Pisos, gabinetes, barriles de vino, vigas" },
  { name:"Nogal (Walnut)",      hardness:"Dura · 1,010 lbf",   density:"0.64", color:"#4A2C17", uses:"Muebles finos, culatas de armas, tazones" },
  { name:"Maple (Arce)",        hardness:"Muy dura · 1,450 lbf",density:"0.71", color:"#F5E0B0", uses:"Tablas de cortar, pisos de gimnasio, instrumentos" },
  { name:"Caoba (Mahogany)",    hardness:"Media · 800 lbf",    density:"0.53", color:"#9C3A12", uses:"Muebles finos, instrumentos, botes clásicos" },
  { name:"Teca (Teak)",         hardness:"Dura · 1,000 lbf",   density:"0.63", color:"#B8860B", uses:"Exterior, yates, decks, pisos, bancas jardín" },
  { name:"Cerezo (Cherry)",     hardness:"Media · 950 lbf",    density:"0.63", color:"#7A2510", uses:"Gabinetes, muebles, pisos premium" },
  { name:"Fresno (Ash)",        hardness:"Dura · 1,320 lbf",   density:"0.67", color:"#D4C5A9", uses:"Mangos, bates de béisbol, muebles curvos" },
  { name:"Álamo (Poplar)",      hardness:"Media · 540 lbf",    density:"0.42", color:"#B5C9A1", uses:"Cajones secundarios, interiores pintados" },
  { name:"Bambú",               hardness:"Muy dura · 1,380 lbf",density:"0.63", color:"#C8C060", uses:"Pisos, tablas de cortar, estructuras ligeras" },
  { name:"MDF",                 hardness:"N/A",                density:"0.75", color:"#C4A882", uses:"Gabinetes pintados, CNC routing, paneles" },
  { name:"Triplay Birch",       hardness:"Variable",           density:"0.60", color:"#D4B896", uses:"Muebles, CNC, cajas, fondos de gabinetes" },
];

// ─── DATOS: CLAVOS Y TORNILLOS ─────────────────────────────────
const NAILS = [
  ["2d","1\"","25mm","0.072\""],["3d","1¼\"","32mm","0.083\""],["4d","1½\"","38mm","0.083\""],
  ["6d","2\"","51mm","0.099\""],["8d","2½\"","64mm","0.113\""],["10d","3\"","76mm","0.128\""],
  ["12d","3¼\"","83mm","0.128\""],["16d","3½\"","89mm","0.135\""],["20d","4\"","102mm","0.148\""],
  ["30d","4½\"","114mm","0.148\""],["40d","5\"","127mm","0.162\""],["60d","6\"","152mm","0.192\""],
];
const SCREWS = [
  ["#4","2.8mm","1/16\"","3/32\"","⅝\"–1\"",    "Madera blanda delgada"],
  ["#6","3.5mm","3/32\"","7/64\"","¾\"–1½\"",    "Usos generales, MDF"],
  ["#8","4.2mm","⅛\"",  "9/64\"","1\"–2½\"",    "Más común, decks, estructuras"],
  ["#10","4.8mm","⅛\"", "5/32\"","1¼\"–3\"",     "Juntas resistentes, hardware"],
  ["#12","5.5mm","5/32\"","3/16\"","1½\"–3½\"",   "Madera dura, vigas"],
  ["#14","6.3mm","3/16\"","7/32\"","2\"–4\"",     "Aplicaciones pesadas"],
];

// ─── BIBLIOTECA DE ESPECIES PREDEFINIDAS ─────────────────────────
// Sirven como plantillas rápidas en el catálogo
const SPECIES_LIBRARY = [
  { name:"Pino (Pine)",          cat:"Blanda",   thick:0.75, costUnit:"pie²", color:"#E8D5A3", desc:"Madera blanda de coníferas, abundante y económica. Ideal para pintar." },
  { name:"Cedro Rojo (Cedar)",   cat:"Blanda",   thick:1.0,  costUnit:"pie²", color:"#C8956B", desc:"Resistente a insectos y humedad. Perfecta para closets y exterior." },
  { name:"Ciprés (Cypress)",     cat:"Blanda",   thick:1.0,  costUnit:"pie²", color:"#D4B483", desc:"Muy durable en exterior. Popular en el sur de EE.UU." },
  { name:"Roble Blanco (White Oak)", cat:"Dura", thick:1.0,  costUnit:"pie²", color:"#A07040", desc:"Resistente, bella veta. Barriles de vino, pisos de alta gama." },
  { name:"Roble Rojo (Red Oak)", cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#B07050", desc:"El hardwood más vendido en EE.UU. Gabinetes, escaleras, pisos." },
  { name:"Nogal (Walnut)",       cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#4A2C17", desc:"Madera oscura de lujo. Muebles finos, culatas, tazones torneados." },
  { name:"Maple Duro (Hard Maple)", cat:"Dura",  thick:1.0,  costUnit:"pie²", color:"#F5E0B0", desc:"Extremadamente duro. Tablas de cortar, pisos de gimnasio, bolos." },
  { name:"Maple Suave (Soft Maple)", cat:"Dura", thick:1.0,  costUnit:"pie²", color:"#EEDCAA", desc:"Más fácil de trabajar que el duro. Gabinetes, muebles pintados." },
  { name:"Cerezo (Cherry)",      cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#7A2510", desc:"Oscurece bellamente con el tiempo. Gabinetes y muebles premium." },
  { name:"Fresno (Ash)",         cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#D4C5A9", desc:"Flexible y resistente. Mangos de herramientas, bates de béisbol." },
  { name:"Caoba (Mahogany)",     cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#9C3A12", desc:"Estabilidad dimensional excelente. Muebles finos, instrumentos." },
  { name:"Teca (Teak)",          cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#B8860B", desc:"Aceite natural protector. La madera reina para yates y exterior." },
  { name:"Álamo (Poplar)",       cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#B5C9A1", desc:"Económico y fácil de pintar. Cajones, interiores de gabinetes." },
  { name:"Pino Amarillo (Yellow Pine)", cat:"Blanda", thick:1.5, costUnit:"pie²", color:"#D4A843", desc:"Muy resistente para una blanda. Pisos, estructuras, decks." },
  { name:"Bambú (Bamboo)",       cat:"Dura",     thick:0.75, costUnit:"m²",   color:"#C8C060", desc:"Renovable y muy duro. Pisos, tablas de cortar, paneles." },
  { name:"MDF Estándar",         cat:"Laminado", thick:0.75, costUnit:"m²",   color:"#C4A882", desc:"Superficie lisa ideal para pintar. CNC routing y gabinetes." },
  { name:"MDF Hidrofugado",      cat:"Laminado", thick:0.75, costUnit:"m²",   color:"#A08862", desc:"Para baños y cocinas. Mayor resistencia a la humedad." },
  { name:"Triplay Birch Baltic", cat:"Laminado", thick:0.75, costUnit:"m²",   color:"#D4B896", desc:"Capas múltiples sin vacíos. El mejor triplay para muebles y CNC." },
  { name:"Triplay Marine",       cat:"Laminado", thick:0.75, costUnit:"m²",   color:"#C4A876", desc:"Resistente al agua. Embarcaciones, exteriores húmedos." },
  { name:"Melanina / Aglomerado",cat:"Laminado", thick:0.75, costUnit:"m²",   color:"#D8D0C0", desc:"Económico con acabado laminado. Mobiliario de cocina y oficina." },
  { name:"OSB (Oriented Strand)", cat:"Laminado",thick:0.5,  costUnit:"m²",   color:"#C8A870", desc:"Estructural y económico. Paredes, pisos de construcción." },
  { name:"Acacia",               cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#8B5A2B", desc:"Extremadamente dura y durable. Tablas de cortar, decks exóticos." },
  { name:"Ipe (Lapacho)",        cat:"Dura",     thick:1.0,  costUnit:"pie²", color:"#5C3010", desc:"La madera de deck más dura. Resistencia a hongos e insectos." },
  { name:"Cedro Blanco (White Cedar)", cat:"Blanda", thick:1.0, costUnit:"pie²", color:"#E0D0B0", desc:"Muy liviano. Canoas, exterior, shingles de techo." },
  { name:"Personalizado",        cat:"Otro",     thick:1.0,  costUnit:"pie²", color:"#888888", desc:"Especie o material personalizado." },
];

// ─── DATOS INICIALES DEL CATÁLOGO ────────────────────────────────
const INIT_CATALOG = [
  {
    id:1, name:"Pino #2 1×4", cat:"Blanda", thick:0.75,
    cost:2.50, costUnit:"pie²",
    stock:40, stockUnit:"pie²",
    desc:"Pino estándar de construcción, nudoso. Para proyectos pintados.",
    proveedor:"Maderas García", provTel:"555-100-2030", provEmail:"ventas@maderasgarcia.com", provNota:"Descuento 10% en pedidos +100 pies²"
  },
  {
    id:2, name:"Cedro Aromático 4/4", cat:"Blanda", thick:1.0,
    cost:4.80, costUnit:"pie²",
    stock:20, stockUnit:"pie²",
    desc:"Excelente para interiores de closets. Repele polillas naturalmente.",
    proveedor:"Maderería Hernández", provTel:"555-200-4050", provEmail:"", provNota:"Traer muestra para color"
  },
  {
    id:3, name:"Roble Blanco Select 4/4", cat:"Dura", thick:1.0,
    cost:9.50, costUnit:"pie²",
    stock:15, stockUnit:"pie²",
    desc:"Grado Select, pocas imperfecciones. Para muebles de acabado fino.",
    proveedor:"Premium Woods MX", provTel:"555-300-6070", provEmail:"info@premiumwoods.mx", provNota:"Solo venta mínima 20 pt"
  },
  {
    id:4, name:"MDF ¾\" Estándar", cat:"Laminado", thick:0.75,
    cost:18.50, costUnit:"m²",
    stock:8, stockUnit:"hojas",
    desc:"Hojas 1.22×2.44m. Liso, ideal para pintar o rutear CNC.",
    proveedor:"Maderas García", provTel:"555-100-2030", provEmail:"ventas@maderasgarcia.com", provNota:""
  },
  {
    id:5, name:"Triplay Birch Baltic ¾\"", cat:"Laminado", thick:0.75,
    cost:42.00, costUnit:"m²",
    stock:5, stockUnit:"hojas",
    desc:"Sin vacíos entre capas. El mejor para CNC y muebles de calidad.",
    proveedor:"Premium Woods MX", provTel:"555-300-6070", provEmail:"info@premiumwoods.mx", provNota:"Importado, orden con 2 sem anticipación"
  },
];
const INIT_PROJECTS = [
  {
    id:1, name:"Mesa de Centro", client:"Proyecto Propio", status:"En progreso",
    cuts:[
      { id:1, label:"Tablero superior", mat:"Roble Blanco 4/4", L:48, W:24, T:1.0, qty:1, cpt:9.50 },
      { id:2, label:"Patas (x4)", mat:"Roble Blanco 4/4", L:18, W:2.5, T:2.5, qty:4, cpt:9.50 },
      { id:3, label:"Travesaños", mat:"Pino #2 1×4", L:42, W:3.5, T:0.75, qty:2, cpt:2.50 },
    ]
  }
];

// ══════════════════════════════════════════════════════════════
//  ROOT APP
// ══════════════════════════════════════════════════════════════
export default function CutWise() {
  const [tab, setTab] = useState("convert");
  const [catalog, setCatalog] = useState(INIT_CATALOG);
  const [projects, setProjects] = useState(INIT_PROJECTS);

  const TABS = [
    { id:"convert",   icon:"⇄",  short:"Convertir"  },
    { id:"fractions", icon:"½",  short:"Fracciones" },
    { id:"boardfoot", icon:"📐", short:"Pie·Tabla"  },
    { id:"tools",     icon:"🔧", short:"Utilidades" },
    { id:"projects",  icon:"📋", short:"Proyectos"  },
    { id:"catalog",   icon:"🗄", short:"Materiales" },
    { id:"ref",       icon:"📖", short:"Guía"       },
  ];

  return (
    <div style={S.root}>
      <style>{GLOBAL_CSS}</style>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <Logo />
          <div>
            <div style={S.brand}>CUT<span style={{color:A.orange}}>WISE</span></div>
            <div style={S.brandSub}>Calculadora profesional de carpintería</div>
          </div>
        </div>
        <div style={S.headerRight}>
          <HeaderBadge label="Materiales" val={catalog.length} />
          <HeaderBadge label="Proyectos" val={projects.length} accent />
        </div>
      </header>

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          {TABS.map(t => (
            <button key={t.id} style={{...S.navBtn,...(tab===t.id?S.navBtnOn:{})}}
              onClick={() => setTab(t.id)}>
              <span style={S.navIcon}>{t.icon}</span>
              <span style={S.navLabel}>{t.short}</span>
              {tab===t.id && <div style={S.navUnderline} />}
            </button>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <main style={S.main} key={tab} className="fadeIn">
        {tab==="convert"   && <ConvertTab />}
        {tab==="fractions" && <FractionsTab />}
        {tab==="boardfoot" && <BoardFootTab catalog={catalog} />}
        {tab==="tools"     && <ToolsTab />}
        {tab==="projects"  && <ProjectsTab projects={projects} setProjects={setProjects} catalog={catalog} />}
        {tab==="catalog"   && <CatalogTab catalog={catalog} setCatalog={setCatalog} />}
        {tab==="ref"       && <RefTab />}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: CONVERTIR
// ══════════════════════════════════════════════════════════════
function ConvertTab() {
  const [val, setVal]   = useState("");
  const [from, setFrom] = useState("in");
  const [to, setTo]     = useState("mm");
  const num = parseFloat(val);
  const res = !isNaN(num) && val !== "" ? cvt(num, from, to) : null;

  function swap() {
    setFrom(to); setTo(from);
    if (res !== null) setVal(fmtN(res));
  }

  const MATRIX = ["mm","cm","m","in","ft"];

  return (
    <div>
      <PageTitle icon="⇄" title="Conversión de Medidas"
        sub="Métrico ↔ Imperial · todas las combinaciones posibles" />

      <Card>
        <div style={S.row}>
          <Fld label="Valor" flex={2}>
            <input type="number" value={val} onChange={e=>setVal(e.target.value)}
              placeholder="Ingresa un valor" style={S.inp} />
          </Fld>
          <Fld label="De" flex={2}>
            <select value={from} onChange={e=>setFrom(e.target.value)} style={S.sel}>
              {UNITS.map(u=><option key={u} value={u}>{UL[u]}</option>)}
            </select>
          </Fld>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",paddingBottom:2}}>
            <button style={S.swapBtn} onClick={swap} title="Intercambiar unidades">⇄</button>
          </div>
          <Fld label="A" flex={2}>
            <select value={to} onChange={e=>setTo(e.target.value)} style={S.sel}>
              {UNITS.map(u=><option key={u} value={u}>{UL[u]}</option>)}
            </select>
          </Fld>
        </div>

        {res !== null ? (
          <ResultBox>
            <div style={S.resSub}>{fmtN(num)} {US[from]} =</div>
            <div style={S.resBig}>{fmtN(res)} <span style={S.resUnit}>{US[to]}</span></div>
            {to==="in" && <div style={S.resFrac}>≈ {decToFrac(res,16)} &nbsp;·&nbsp; {decToFrac(res,32)} (1/32")</div>}
            {from==="in" && to==="mm" && <div style={S.resFrac}>{(res/25.4).toFixed(6)}" decimal</div>}
          </ResultBox>
        ) : (
          <div style={{...S.resultPlaceholder}}>
            Ingresa un valor para ver el resultado
          </div>
        )}
      </Card>

      {/* Quick references */}
      <PageTitle icon="⚡" title="Referencias rápidas"
        sub="Toca para cargar la conversión" />
      <div style={S.quickGrid}>
        {[
          ["1 pie", "ft","cm","30.48 cm"],["1 pulg", "in","mm","25.4 mm"],
          ["1 metro", "m","ft","3.281 ft"],["1 metro", "m","in","39.37\""],
          ["1 yarda", "yd","m","0.9144 m"],["1 cm", "cm","in","0.3937\""],
        ].map(([lbl,f,t,hint])=>(
          <button key={lbl+f+t} style={S.quickCard}
            onClick={()=>{setVal("1");setFrom(f);setTo(t);}}>
            <div style={S.quickTop}>{lbl} {US[f]}</div>
            <div style={S.quickBot}>{hint}</div>
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <PageTitle icon="📊" title="Tabla de equivalencias" />
      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={S.tbl}>
            <thead>
              <tr><th style={S.th}></th>{MATRIX.map(u=><th key={u} style={S.th}>{u}</th>)}</tr>
            </thead>
            <tbody>
              {MATRIX.map(fr=>(
                <tr key={fr}>
                  <td style={{...S.td,...S.tdh}}>{fr}</td>
                  {MATRIX.map(to2=>(
                    <td key={to2} style={{...S.td,...(fr===to2?{color:A.orange,fontWeight:700}:{})}}
                      onClick={()=>{setVal("1");setFrom(fr);setTo(to2);}}>
                      <span style={{cursor:"pointer",fontFamily:A.mono,fontSize:12}}>
                        {fr===to2?"1":fmtN(cvt(1,fr,to2))}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Hint>Toca cualquier celda para cargarlo en el convertidor</Hint>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: FRACCIONES (the most-requested missing feature)
// ══════════════════════════════════════════════════════════════
function FractionsTab() {
  const [dec, setDec]     = useState("0.625");
  const [denom, setDenom] = useState(16);
  const [w, setW]         = useState(0);
  const [n, setN]         = useState(5);
  const [d, setD]         = useState(8);

  const decVal = parseFloat(dec) || 0;
  const fracVal = w + n / (d||1);

  // Fraction adder
  const [addA, setAddA] = useState("1/2");
  const [addB, setAddB] = useState("3/8");
  function parseFrac(s) {
    const parts = s.trim().split("/");
    if (parts.length===2) return parseFloat(parts[0])/(parseFloat(parts[1])||1);
    return parseFloat(parts[0])||0;
  }
  const addRes = parseFrac(addA) + parseFrac(addB);

  return (
    <div>
      <PageTitle icon="½" title="Fracciones de Pulgada"
        sub="La herramienta más pedida · decimal ↔ fracción ↔ mm" />

      {/* TWO CONVERTERS */}
      <div style={S.twoCol}>
        <Card>
          <CardTitle>Decimal → Fracción</CardTitle>
          <Fld label='Decimal (pulgadas)'>
            <input type="number" value={dec} onChange={e=>setDec(e.target.value)}
              step="0.001" style={S.inp} />
          </Fld>
          <Fld label="Precisión">
            <select value={denom} onChange={e=>setDenom(+e.target.value)} style={S.sel}>
              {[2,4,8,16,32,64].map(d2=><option key={d2} value={d2}>1/{d2} pulgada</option>)}
            </select>
          </Fld>
          <ResultBox mini>
            <div style={S.resBig}>{decToFrac(decVal, denom)}</div>
            <div style={S.resFrac}>{(decVal*25.4).toFixed(3)} mm</div>
          </ResultBox>
        </Card>

        <Card>
          <CardTitle>Fracción → Decimal</CardTitle>
          <Fld label="Entero">
            <input type="number" value={w} onChange={e=>setW(+e.target.value||0)}
              min={0} style={S.inp} />
          </Fld>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <Fld label="Num" flex={1}>
              <input type="number" value={n} onChange={e=>setN(+e.target.value||0)} min={0} style={S.inp}/>
            </Fld>
            <span style={{color:A.orange,fontSize:26,paddingBottom:10,lineHeight:1,flexShrink:0}}>/</span>
            <Fld label="Den" flex={1}>
              <input type="number" value={d} onChange={e=>setD(+e.target.value||1)} min={1} style={S.inp}/>
            </Fld>
          </div>
          <ResultBox mini>
            <div style={S.resBig}>{fracVal.toFixed(6)}"</div>
            <div style={S.resFrac}>{(fracVal*25.4).toFixed(4)} mm</div>
          </ResultBox>
        </Card>
      </div>

      {/* FRACTION ADDER */}
      <Card>
        <CardTitle>Suma / Resta de Fracciones</CardTitle>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <Fld label='Primera fracción (ej: 3/4 o 1 1/2)' flex={1}>
            <input value={addA} onChange={e=>setAddA(e.target.value)} style={S.inp} placeholder="3/4"/>
          </Fld>
          <span style={{color:A.orange,fontSize:22,paddingTop:14,flexShrink:0}}>+</span>
          <Fld label="Segunda fracción" flex={1}>
            <input value={addB} onChange={e=>setAddB(e.target.value)} style={S.inp} placeholder="3/8"/>
          </Fld>
          <div style={{paddingTop:14,flexShrink:0}}>
            <ResultBox mini>
              <div style={{...S.resBig,fontSize:22}}>{decToFrac(addRes,16)}</div>
              <div style={S.resFrac}>{addRes.toFixed(5)}" · {(addRes*25.4).toFixed(2)}mm</div>
            </ResultBox>
          </div>
        </div>
        <Hint>Escribe fracciones como: 3/4 ó 1 3/8 ó 0.5</Hint>
      </Card>

      {/* FULL TABLE */}
      <PageTitle icon="📋" title="Tabla completa 1/64"
        sub="Pulgada → Decimal → mm · destacadas las más comunes" />
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:2}}>
          {Array.from({length:64},(_,i)=>i+1).map(num => {
            const val = num/64;
            const g = gcd(num,64);
            const [sn,sd] = [num/g, 64/g];
            const common = [2,4,8,16,32,64].some(base=>num%(64/base)===0 && 64/base!==64);
            const isHalf = num === 32;
            return (
              <div key={num} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"4px 8px", borderRadius:4,
                background: isHalf ? `${A.orange}22` : common ? `${A.orange}0d` : "transparent",
                borderLeft: isHalf ? `3px solid ${A.orange}` : common ? `3px solid ${A.orange}55` : "3px solid transparent",
              }}>
                <span style={{color:A.orange,fontFamily:A.mono,fontSize:12,minWidth:44,fontWeight:isHalf||common?700:400}}>
                  {num===64 ? '1"' : `${sn}/${sd}"`}
                </span>
                <span style={{color:"#888",fontFamily:A.mono,fontSize:10,minWidth:50}}>{val.toFixed(4)}"</span>
                <span style={{color:A.blue,fontFamily:A.mono,fontSize:10}}>{(val*25.4).toFixed(2)}mm</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: BOARD FOOT
// ══════════════════════════════════════════════════════════════
function BoardFootTab({ catalog }) {
  const [rows, setRows] = useState([
    { id:1, desc:"Roble Blanco 4/4", L:72, W:8, T:1.0, qty:2, cpt:9.50 },
    { id:2, desc:"Pino #2 1×4",      L:96, W:3.5, T:0.75, qty:4, cpt:2.50 },
  ]);
  const [unit, setUnit] = useState("in");

  function add() { setRows(r=>[...r,{id:Date.now(),desc:"",L:0,W:0,T:1,qty:1,cpt:0}]); }
  function del(id) { setRows(r=>r.filter(x=>x.id!==id)); }
  function upd(id,k,v) { setRows(r=>r.map(x=>x.id===id?{...x,[k]:isNaN(+v)?v:+v}:x)); }
  function pickMat(id, name) {
    const m = catalog.find(c=>c.name===name);
    setRows(r=>r.map(x=>x.id===id?{...x,desc:name,T:m?m.thick:x.T,cpt:m?m.cost:x.cpt}:x));
  }

  const totBF   = rows.reduce((s,r)=>s+bf(r.L,r.W,r.T,r.qty,unit),0);
  const totCost = rows.reduce((s,r)=>s+bf(r.L,r.W,r.T,r.qty,unit)*r.cpt,0);

  return (
    <div>
      <PageTitle icon="📐" title="Calculadora de Pie de Tabla"
        sub="(Largo × Ancho × Grosor) ÷ 144 — convertido automáticamente" />

      <Card>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
          <span style={S.lbl}>Unidad de entrada:</span>
          <select value={unit} onChange={e=>setUnit(e.target.value)} style={{...S.sel,maxWidth:180,marginBottom:0}}>
            {UNITS.map(u=><option key={u} value={u}>{UL[u]}</option>)}
          </select>
        </div>

        <div style={{overflowX:"auto"}}>
          <table style={{...S.tbl,minWidth:640}}>
            <thead>
              <tr>
                {["Material","Largo","Ancho","Grosor","Cant.","$/pt","Pie·Tabla","Subtotal",""].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const bfVal = bf(row.L,row.W,row.T,row.qty,unit);
                return (
                  <tr key={row.id}>
                    <td style={{...S.td,minWidth:140}}>
                      <select value={row.desc} onChange={e=>pickMat(row.id,e.target.value)}
                        style={{...S.sel,fontSize:12,padding:"5px 7px"}}>
                        <option value="">— material —</option>
                        {catalog.map(m=><option key={m.id}>{m.name}</option>)}
                        <option value="Personalizado">Personalizado</option>
                      </select>
                    </td>
                    {["L","W","T","qty","cpt"].map(k=>(
                      <td key={k} style={S.td}>
                        <input type="number" value={row[k]||""} min={0} step={k==="T"?0.25:k==="cpt"?0.01:1}
                          onChange={e=>upd(row.id,k,e.target.value)}
                          style={{...S.inp,width:64,padding:"5px 6px",fontSize:13,textAlign:"center"}}/>
                      </td>
                    ))}
                    <td style={{...S.td,color:A.orange,fontFamily:A.mono,fontWeight:700}}>
                      {bfVal.toFixed(3)}
                    </td>
                    <td style={{...S.td,color:A.green,fontFamily:A.mono,fontWeight:700}}>
                      ${(bfVal*row.cpt).toFixed(2)}
                    </td>
                    <td style={S.td}>
                      <button onClick={()=>del(row.id)} style={S.delBtn}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={add} style={S.addRowBtn}>+ Agregar fila</button>
        <div style={S.totals}>
          <TotBlock label="Total Pies de Tabla" val={totBF.toFixed(3)+" pt"} />
          <TotBlock label="Costo Total Materiales" val={"$"+totCost.toFixed(2)} accent />
        </div>
      </Card>

      <Card style={{borderLeft:`3px solid ${A.orange}`}}>
        <CardTitle>¿Qué es un pie de tabla?</CardTitle>
        <p style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:8}}>
          Unidad de volumen estándar para madera en EE.UU. Equivale a una pieza de
          <b style={{color:"#ccc"}}> 1 pie × 1 pie × 1 pulgada</b> de grosor (= 144 in³).
        </p>
        <code style={{display:"block",background:"#0d0d0d",padding:"8px 12px",borderRadius:6,
          color:A.orange,fontSize:13,fontFamily:A.mono}}>
          Pies·tabla = (Largo" × Ancho" × Grosor") ÷ 144
        </code>
      </Card>

      {/* NOMINAL vs REAL */}
      <PageTitle icon="⚠️" title="Nominal vs Real del Lumber"
        sub="Un 2×4 NO mide 2×4 — esta tabla te salva de errores costosos" />
      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={S.tbl}>
            <thead>
              <tr>
                <th style={S.th}>Nominal</th>
                <th style={S.th}>Real (pulg)</th>
                <th style={S.th}>Real (mm)</th>
              </tr>
            </thead>
            <tbody>
              {NOMINAL_REAL.map(([nom,real,mm])=>(
                <tr key={nom}>
                  <td style={{...S.td,color:A.orange,fontWeight:700,fontFamily:A.mono}}>{nom}</td>
                  <td style={{...S.td,color:"#ccc",fontFamily:A.mono}}>{real}</td>
                  <td style={{...S.td,color:A.blue,fontFamily:A.mono}}>{mm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: UTILIDADES (spacing, golden ratio — missing everywhere)
// ══════════════════════════════════════════════════════════════
function ToolsTab() {
  const [tool, setTool] = useState("spacing");

  // Shelf/baluster spacing
  const [totalLen, setTotalLen] = useState(48);
  const [numItems, setNumItems] = useState(4);
  const [itemW, setItemW] = useState(1.5);
  const [unitS, setUnitS] = useState("in");
  const totalGap = cvt(totalLen, unitS, "in") - numItems * cvt(itemW, unitS, "in");
  const spaces = numItems + 1;
  const gap = totalGap / spaces;
  const positions = Array.from({length: numItems}, (_, i) => gap + i * (gap + cvt(itemW, unitS, "in")));

  // Golden ratio
  const [grVal, setGrVal] = useState(24);
  const [grUnit, setGrUnit] = useState("in");
  const PHI = 1.61803398875;
  const grValIn = cvt(+grVal, grUnit, "in");
  const grLong  = grValIn * PHI;
  const grShort = grValIn / PHI;

  // Proportional scaler
  const [origW, setOrigW] = useState(36);
  const [origH, setOrigH] = useState(24);
  const [newW, setNewW]   = useState(48);
  const ratio = origW > 0 ? origH / origW : 1;
  const newH  = newW * ratio;

  // Right triangle
  const [rtA, setRtA] = useState(3);
  const [rtB, setRtB] = useState(4);
  const rtC = Math.sqrt(rtA*rtA + rtB*rtB);
  const rtAng = Math.atan(rtB/rtA) * 180 / Math.PI;

  const TOOLS = [
    { id:"spacing", label:"Espaciado" },
    { id:"golden",  label:"Razón Áurea" },
    { id:"prop",    label:"Proporciones" },
    { id:"tri",     label:"Triángulo" },
  ];

  return (
    <div>
      <PageTitle icon="🔧" title="Utilidades de Diseño"
        sub="Herramientas que los demás no incluyen" />
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {TOOLS.map(t=>(
          <button key={t.id} onClick={()=>setTool(t.id)}
            style={{...S.chip,...(tool===t.id?S.chipOn:{})}}>{t.label}</button>
        ))}
      </div>

      {tool==="spacing" && (
        <div>
          <Card>
            <CardTitle>Calculadora de Espaciado Uniforme</CardTitle>
            <p style={{fontSize:13,color:"#888",marginBottom:14}}>
              Para estantes, balusters, tornillos, tablillas — cualquier distribución uniforme.
            </p>
            <div style={S.twoCol}>
              <Fld label="Largo total del espacio">
                <input type="number" value={totalLen} onChange={e=>setTotalLen(+e.target.value)} style={S.inp}/>
              </Fld>
              <Fld label="Unidad">
                <select value={unitS} onChange={e=>setUnitS(e.target.value)} style={S.sel}>
                  {UNITS.map(u=><option key={u} value={u}>{UL[u]}</option>)}
                </select>
              </Fld>
              <Fld label="Número de elementos">
                <input type="number" value={numItems} onChange={e=>setNumItems(Math.max(1,+e.target.value))} min={1} style={S.inp}/>
              </Fld>
              <Fld label="Ancho de cada elemento">
                <input type="number" value={itemW} onChange={e=>setItemW(+e.target.value)} step="0.125" style={S.inp}/>
              </Fld>
            </div>

            {gap > 0 ? (
              <>
                <div style={S.totals}>
                  <TotBlock label="Separación entre elementos" val={fmtN(cvt(gap,"in",unitS))+" "+US[unitS]} />
                  <TotBlock label="Espacio total disponible" val={fmtN(totalGap)+"\" = "+fmtN(cvt(totalGap,"in",unitS))+" "+US[unitS]} />
                  <TotBlock label={`${numItems+1} espacios de`} val={decToFrac(gap,16)} accent />
                </div>
                <div style={{marginTop:16}}>
                  <div style={S.lbl} >Posición de cada elemento desde el inicio:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
                    {positions.map((p,i)=>(
                      <div key={i} style={{background:"#1a1a1a",border:`1px solid ${A.orange}44`,
                        borderRadius:6,padding:"6px 12px",textAlign:"center"}}>
                        <div style={{fontSize:10,color:"#666",textTransform:"uppercase"}}>#{i+1}</div>
                        <div style={{color:A.orange,fontFamily:A.mono,fontSize:13,fontWeight:700}}>
                          {decToFrac(p,16)}
                        </div>
                        <div style={{color:"#666",fontSize:10,fontFamily:A.mono}}>
                          {fmtN(cvt(p,"in",unitS))} {US[unitS]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{color:"#c0392b",fontSize:13,padding:"10px 0"}}>
                ⚠️ Los elementos son más anchos que el espacio disponible.
              </div>
            )}
          </Card>
        </div>
      )}

      {tool==="golden" && (
        <Card>
          <CardTitle>Razón Áurea (Golden Ratio)</CardTitle>
          <p style={{fontSize:13,color:"#888",lineHeight:1.7,marginBottom:14}}>
            φ = 1.618... La proporción más visualmente agradable. Usa el lado conocido para encontrar las proporciones perfectas de tu mueble.
          </p>
          <div style={S.twoCol}>
            <Fld label="Dimensión conocida">
              <input type="number" value={grVal} onChange={e=>setGrVal(e.target.value)} style={S.inp}/>
            </Fld>
            <Fld label="Unidad">
              <select value={grUnit} onChange={e=>setGrUnit(e.target.value)} style={S.sel}>
                {UNITS.map(u=><option key={u} value={u}>{UL[u]}</option>)}
              </select>
            </Fld>
          </div>
          <div style={S.totals}>
            <TotBlock label="Lado largo (×φ)" val={fmtN(cvt(grLong,"in",grUnit))+" "+US[grUnit]} />
            <TotBlock label="Dimensión dada" val={fmtN(+grVal)+" "+US[grUnit]} />
            <TotBlock label="Lado corto (÷φ)" val={fmtN(cvt(grShort,"in",grUnit))+" "+US[grUnit]} accent />
          </div>
          <div style={{marginTop:16,padding:"12px 14px",background:"#0d0d0d",borderRadius:8}}>
            <div style={{fontSize:12,color:"#666",marginBottom:6}}>Proporción visual:</div>
            <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
              <div style={{width:`${100/PHI/(1+1/PHI)*100}%`,height:"100%",
                background:`${A.orange}33`,border:`1px solid ${A.orange}`,
                borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:10,color:A.orange}}>÷φ</span>
              </div>
              <div style={{flex:1,height:"100%",
                background:`${A.orange}22`,border:`1px dashed ${A.orange}88`,
                borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:10,color:"#888"}}>base</span>
              </div>
              <div style={{width:`${PHI/(1+PHI)*100}%`,height:"100%",
                background:`${A.orange}44`,border:`1px solid ${A.orange}`,
                borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:10,color:A.orange}}>×φ</span>
              </div>
            </div>
          </div>
          <Hint>φ = 1.61803... · Usado en los muebles de Shaker, la arquitectura griega y el diseño moderno</Hint>
        </Card>
      )}

      {tool==="prop" && (
        <Card>
          <CardTitle>Escalador Proporcional</CardTitle>
          <p style={{fontSize:13,color:"#888",marginBottom:14}}>
            Escala tu diseño manteniendo proporciones exactas. Perfecto para ampliar o reducir planos.
          </p>
          <div style={S.twoCol}>
            <Fld label='Ancho original "'>
              <input type="number" value={origW} onChange={e=>setOrigW(+e.target.value)} style={S.inp}/>
            </Fld>
            <Fld label='Alto original "'>
              <input type="number" value={origH} onChange={e=>setOrigH(+e.target.value)} style={S.inp}/>
            </Fld>
          </div>
          <Fld label='Nuevo ancho "'>
            <input type="number" value={newW} onChange={e=>setNewW(+e.target.value)} style={S.inp}/>
          </Fld>
          <ResultBox>
            <div style={S.resSub}>Con ancho = {newW}", la altura proporcional es:</div>
            <div style={S.resBig}>{fmtN(newH)}<span style={S.resUnit}>"</span></div>
            <div style={S.resFrac}>{decToFrac(newH,16)} · {fmtN(cvt(newH,"in","cm"))} cm</div>
          </ResultBox>
          <Hint>Ratio original: {origW}" × {origH}" = {fmtN(ratio, 4)}:1</Hint>
        </Card>
      )}

      {tool==="tri" && (
        <Card>
          <CardTitle>Calculadora de Triángulo Rectángulo</CardTitle>
          <p style={{fontSize:13,color:"#888",marginBottom:14}}>
            Regla 3-4-5 y teorema de Pitágoras. Esencial para cuadrar marcos y encontrar ángulos.
          </p>
          <div style={S.twoCol}>
            <Fld label='Lado A "'>
              <input type="number" value={rtA} onChange={e=>setRtA(+e.target.value)} style={S.inp}/>
            </Fld>
            <Fld label='Lado B "'>
              <input type="number" value={rtB} onChange={e=>setRtB(+e.target.value)} style={S.inp}/>
            </Fld>
          </div>
          <div style={S.totals}>
            <TotBlock label="Hipotenusa C" val={fmtN(rtC)+'"'} />
            <TotBlock label="Ángulo A-C" val={fmtN(rtAng)+"°"} accent />
            <TotBlock label="Ángulo B-C" val={fmtN(90-rtAng)+"°"} />
          </div>
          <div style={{marginTop:14,padding:"10px 14px",background:"#0d0d0d",borderRadius:8}}>
            <div style={{fontSize:11,color:"#555",marginBottom:4}}>Fórmula:</div>
            <code style={{color:A.orange,fontFamily:A.mono,fontSize:13}}>
              C = √(A² + B²) = √({rtA}² + {rtB}²) = {fmtN(rtC)}"
            </code>
          </div>
          <Hint>Regla 3-4-5: si A=3, B=4, C=5 → el ángulo es exactamente 90°. ¡Úsalo para cuadrar marcos!</Hint>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: PROYECTOS
// ══════════════════════════════════════════════════════════════
function ProjectsTab({ projects, setProjects, catalog }) {
  const [view, setView]     = useState("list");
  const [activeId, setAId]  = useState(null);
  const [nf, setNf]         = useState({ name:"", client:"", status:"Pendiente" });
  const active = projects.find(p=>p.id===activeId);

  function create() {
    if (!nf.name.trim()) return;
    const p = { id:Date.now(), cuts:[], ...nf };
    setProjects(ps=>[...ps,p]);
    setAId(p.id); setView("detail");
  }
  function delProj(id) {
    setProjects(ps=>ps.filter(p=>p.id!==id));
    if (activeId===id) { setAId(null); setView("list"); }
  }
  function addCut(cut) { setProjects(ps=>ps.map(p=>p.id===activeId?{...p,cuts:[...p.cuts,{...cut,id:Date.now()}]}:p)); }
  function delCut(cid) { setProjects(ps=>ps.map(p=>p.id===activeId?{...p,cuts:p.cuts.filter(c=>c.id!==cid)}:p)); }

  function projTotal(p) {
    return p.cuts.reduce((s,c)=>s+bf(c.L,c.W,c.T,c.qty,"in")*c.cpt,0);
  }
  function projBF(p) {
    return p.cuts.reduce((s,c)=>s+bf(c.L,c.W,c.T,c.qty,"in"),0);
  }

  if (view==="detail" && active) {
    return <ProjectDetail
      project={active} catalog={catalog}
      onBack={()=>setView("list")}
      onAddCut={addCut} onDelCut={delCut}
      projTotal={projTotal(active)} projBF={projBF(active)}
    />;
  }

  return (
    <div>
      <PageTitle icon="📋" title="Proyectos"
        sub="Lista de cortes + costo por proyecto — la función que falta en todas las apps" />

      {view==="new" ? (
        <Card>
          <CardTitle>Nuevo Proyecto</CardTitle>
          <Fld label="Nombre *"><input value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})} placeholder="Ej: Mesa de comedor" style={S.inp}/></Fld>
          <Fld label="Cliente"><input value={nf.client} onChange={e=>setNf({...nf,client:e.target.value})} placeholder="Nombre del cliente (opcional)" style={S.inp}/></Fld>
          <Fld label="Estado">
            <select value={nf.status} onChange={e=>setNf({...nf,status:e.target.value})} style={S.sel}>
              {["Pendiente","En progreso","Completado","En pausa"].map(s=><option key={s}>{s}</option>)}
            </select>
          </Fld>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button onClick={()=>setView("list")} style={S.btnGhost}>Cancelar</button>
            <button onClick={create} style={S.btnPrimary}>Crear</button>
          </div>
        </Card>
      ) : (
        <button onClick={()=>setView("new")} style={{...S.btnPrimary,width:"100%",marginBottom:16}}>
          + Nuevo Proyecto
        </button>
      )}

      {projects.length===0 && <Empty text="No hay proyectos. Crea el primero." />}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {projects.map(p => (
          <div key={p.id} style={S.projCard}>
            <div style={{...S.projStripe,background:STATUS_COLOR[p.status]||A.orange}} />
            <div style={{flex:1,padding:"12px 14px",minWidth:0}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                <span style={S.projName}>{p.name}</span>
                <StatusTag s={p.status}/>
              </div>
              {p.client && <div style={{fontSize:12,color:"#555",marginBottom:4}}>👤 {p.client}</div>}
              <div style={{display:"flex",gap:16}}>
                <span style={{fontSize:12,color:"#666"}}>{p.cuts.length} piezas</span>
                <span style={{fontSize:12,color:A.orange,fontFamily:A.mono,fontWeight:700}}>
                  ${projTotal(p).toFixed(2)}
                </span>
                <span style={{fontSize:12,color:"#555",fontFamily:A.mono}}>{projBF(p).toFixed(2)} pt</span>
              </div>
            </div>
            <div style={{display:"flex",gap:4,padding:"8px",alignItems:"center",flexShrink:0}}>
              <button onClick={()=>{setAId(p.id);setView("detail");}} style={S.btnIconSm}>📂</button>
              <button onClick={()=>delProj(p.id)} style={{...S.btnIconSm,opacity:.4}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDetail({ project, catalog, onBack, onAddCut, onDelCut, projTotal, projBF }) {
  const E = { label:"", mat:"", L:0, W:0, T:1, qty:1, cpt:0 };
  const [f, setF] = useState(E);

  function pickMat(name) {
    const m = catalog.find(c=>c.name===name);
    setF(x=>({...x,mat:name,T:m?m.thick:x.T,cpt:m?m.cost:x.cpt}));
  }
  function add() {
    if (!f.mat||!f.L||!f.W) return;
    onAddCut({...f}); setF(E);
  }

  return (
    <div>
      <button onClick={onBack} style={S.backBtn}>← Todos los proyectos</button>
      <PageTitle icon="📋" title={project.name}
        sub={project.client?`Cliente: ${project.client}`:project.status} />

      <Card>
        <CardTitle>Agregar pieza a la lista de cortes (medidas en pulgadas)</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fld label="Descripción / Nombre pieza">
            <input value={f.label} onChange={e=>setF({...f,label:e.target.value})} placeholder="Ej: Tablero superior" style={S.inp}/>
          </Fld>
          <Fld label="Material">
            <select value={f.mat} onChange={e=>pickMat(e.target.value)} style={S.sel}>
              <option value="">— seleccionar —</option>
              {catalog.map(m=><option key={m.id}>{m.name}</option>)}
              <option value="Otro">Otro</option>
            </select>
          </Fld>
          <Fld label='Largo "'>
            <input type="number" value={f.L||""} onChange={e=>setF({...f,L:+e.target.value})} style={S.inp}/>
          </Fld>
          <Fld label='Ancho "'>
            <input type="number" value={f.W||""} onChange={e=>setF({...f,W:+e.target.value})} style={S.inp}/>
          </Fld>
          <Fld label='Grosor "'>
            <input type="number" value={f.T||""} onChange={e=>setF({...f,T:+e.target.value})} step="0.25" style={S.inp}/>
          </Fld>
          <Fld label="Cantidad">
            <input type="number" value={f.qty||""} onChange={e=>setF({...f,qty:+e.target.value})} min={1} style={S.inp}/>
          </Fld>
          <Fld label="$/pie de tabla" style={{gridColumn:"span 2"}}>
            <input type="number" value={f.cpt||""} onChange={e=>setF({...f,cpt:+e.target.value})} step="0.01" style={S.inp}/>
          </Fld>
        </div>
        <button onClick={add} style={{...S.btnPrimary,marginTop:8}}>+ Agregar al corte</button>
      </Card>

      {project.cuts.length > 0 && (
        <Card>
          <CardTitle>Lista de Cortes — {project.name}</CardTitle>
          <div style={{overflowX:"auto"}}>
            <table style={S.tbl}>
              <thead>
                <tr>{["Pieza","Material","L×A×G","Cant","Pies·tabla","Subtotal",""].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {project.cuts.map(c => {
                  const bfv = bf(c.L,c.W,c.T,c.qty,"in");
                  return (
                    <tr key={c.id}>
                      <td style={{...S.td,color:"#ccc"}}>{c.label||"—"}</td>
                      <td style={S.td}>{c.mat}</td>
                      <td style={{...S.td,fontFamily:A.mono,fontSize:11}}>
                        {c.L}"×{c.W}"×{c.T}"
                      </td>
                      <td style={S.td}>{c.qty}</td>
                      <td style={{...S.td,color:A.orange,fontFamily:A.mono,fontWeight:700}}>
                        {bfv.toFixed(3)}
                      </td>
                      <td style={{...S.td,color:A.green,fontFamily:A.mono,fontWeight:700}}>
                        ${(bfv*c.cpt).toFixed(2)}
                      </td>
                      <td style={S.td}>
                        <button onClick={()=>onDelCut(c.id)} style={S.delBtn}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={S.totals}>
            <TotBlock label="Total Pies de Tabla" val={projBF.toFixed(3)+" pt"} />
            <TotBlock label="Costo del Proyecto" val={"$"+projTotal.toFixed(2)} accent />
          </div>
        </Card>
      )}
      {project.cuts.length===0 && <Empty text="Agrega piezas a tu lista de cortes" />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: CATÁLOGO — v2 con biblioteca, costo flexible y proveedor
// ══════════════════════════════════════════════════════════════
const EMPTY_MAT = {
  name:"", cat:"Blanda", thick:"", desc:"",
  cost:"", costUnit:"pie²",
  stock:"", stockUnit:"pie²",
  proveedor:"", provTel:"", provEmail:"", provNota:"",
};
const CAT_COLOR = { Blanda:"#4a9e50", Dura:"#c0651a", Laminado:"#1565c0", Otro:"#7b1fa2" };
const COST_UNITS = ["pie²","m²","pie·tabla","hoja","ml","kg","unidad"];
const STOCK_UNITS = ["pie²","m²","pie·tabla","hojas","unidades","kg"];
const CATS = ["Todos","Blanda","Dura","Laminado","Otro"];

function CatalogTab({ catalog, setCatalog }) {
  const [view, setView]   = useState("list");   // list | form | supplier | library
  const [f, setF]         = useState(EMPTY_MAT);
  const [eid, setEid]     = useState(null);
  const [filt, setFilt]   = useState("Todos");
  const [expanded, setEx] = useState(null);
  const [libSearch, setLS]= useState("");

  // ── helpers ──────────────────────────────────────────────
  function openNew() { setF(EMPTY_MAT); setEid(null); setView("form"); }
  function openEdit(m) { setEid(m.id); setF({...m,cost:String(m.cost),thick:String(m.thick),stock:String(m.stock)}); setView("form"); }
  function openFromLib(sp) {
    setF({ ...EMPTY_MAT, name:sp.name, cat:sp.cat, thick:String(sp.thick), costUnit:sp.costUnit, desc:sp.desc });
    setEid(null); setView("form");
  }
  function openSupplier(m) { setEid(m.id); setF({...m}); setView("supplier"); }

  function save() {
    if (!f.name.trim()) return;
    const entry = { ...f, cost:+f.cost||0, thick:+f.thick||0, stock:+f.stock||0 };
    if (eid!==null) setCatalog(c=>c.map(m=>m.id===eid ? {...entry,id:eid} : m));
    else            setCatalog(c=>[...c, {...entry, id:Date.now()}]);
    setEid(null); setView("list");
  }
  function saveSupplier() {
    setCatalog(c=>c.map(m=>m.id===eid ? {
      ...m, proveedor:f.proveedor, provTel:f.provTel, provEmail:f.provEmail, provNota:f.provNota
    } : m));
    setView("list");
  }
  function del(id) {
    if (!window.confirm("¿Eliminar este material?")) return;
    setCatalog(c=>c.filter(m=>m.id!==id));
    if (expanded===id) setEx(null);
  }
  function cancel() { setEid(null); setView("list"); }

  const shown = filt==="Todos" ? catalog : catalog.filter(m=>m.cat===filt);
  const libFiltered = SPECIES_LIBRARY.filter(s=>
    s.name.toLowerCase().includes(libSearch.toLowerCase()) ||
    s.cat.toLowerCase().includes(libSearch.toLowerCase())
  );

  // ── LIBRARY VIEW ──────────────────────────────────────────
  if (view==="library") return (
    <div>
      <button onClick={cancel} style={S.backBtn}>← Volver al catálogo</button>
      <PageTitle icon="📚" title="Biblioteca de Especies"
        sub="Elige una como plantilla — podrás editar todos sus datos" />
      <div style={{marginBottom:14}}>
        <input value={libSearch} onChange={e=>setLS(e.target.value)}
          placeholder="Buscar especie o categoría..." style={{...S.inp, fontSize:14}} />
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {libFiltered.map(sp => {
          const already = catalog.some(m=>m.name===sp.name);
          return (
            <div key={sp.name} style={{...S.matCard, opacity: already?0.55:1}}>
              <div style={{...S.matStripe, background: CAT_COLOR[sp.cat]||"#555"}} />
              <div style={{flex:1,padding:"10px 14px",minWidth:0}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#e8e8e8"}}>{sp.name}</span>
                  <Tag>{sp.cat}</Tag>
                  <Tag>{sp.costUnit}</Tag>
                  {already && <Tag style={{color:A.orange}}>Ya en tu catálogo</Tag>}
                </div>
                <p style={{fontSize:12,color:"#666",lineHeight:1.5}}>{sp.desc}</p>
              </div>
              <div style={{padding:"0 10px",display:"flex",alignItems:"center",flexShrink:0}}>
                <button onClick={()=>openFromLib(sp)} style={{
                  ...S.btnPrimary, padding:"7px 14px", fontSize:12,
                  opacity: already ? 0.5 : 1,
                }}>
                  {already ? "Usar igual" : "+ Agregar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── SUPPLIER FORM ─────────────────────────────────────────
  if (view==="supplier") {
    const mat = catalog.find(m=>m.id===eid);
    return (
      <div>
        <button onClick={cancel} style={S.backBtn}>← Volver</button>
        <PageTitle icon="🏪" title="Datos del Proveedor"
          sub={mat?.name||""} />
        <Card>
          <CardTitle>Información de contacto</CardTitle>
          <Fld label="Nombre del proveedor / maderería">
            <input value={f.proveedor||""} onChange={e=>setF({...f,proveedor:e.target.value})}
              placeholder="Ej: Maderas García, Home Depot, Tlapalería El Pino..." style={S.inp}/>
          </Fld>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Fld label="Teléfono / WhatsApp">
              <input value={f.provTel||""} onChange={e=>setF({...f,provTel:e.target.value})}
                placeholder="555-123-4567" style={S.inp} type="tel"/>
            </Fld>
            <Fld label="Email">
              <input value={f.provEmail||""} onChange={e=>setF({...f,provEmail:e.target.value})}
                placeholder="ventas@maderera.com" style={S.inp} type="email"/>
            </Fld>
          </div>
          <Fld label="Notas del proveedor (pedido mínimo, descuentos, horarios...)">
            <textarea value={f.provNota||""} onChange={e=>setF({...f,provNota:e.target.value})}
              placeholder="Ej: Descuento 10% en pedidos mayores a 50 pt. Solo venta en efectivo."
              style={{...S.inp, minHeight:80, resize:"vertical", fontFamily:A.sans}}/>
          </Fld>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button onClick={cancel} style={S.btnGhost}>Cancelar</button>
            <button onClick={saveSupplier} style={S.btnPrimary}>Guardar proveedor</button>
          </div>
        </Card>
      </div>
    );
  }

  // ── MATERIAL FORM ─────────────────────────────────────────
  if (view==="form") return (
    <div>
      <button onClick={cancel} style={S.backBtn}>← Volver al catálogo</button>
      <PageTitle icon={eid!==null?"✏️":"➕"}
        title={eid!==null?"Editar material":"Nuevo material"}
        sub="Completa los datos — los campos marcados con * son obligatorios" />

      <Card>
        <CardTitle>Información básica</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fld label="Nombre / especie *" style={{gridColumn:"span 2"}}>
            <input value={f.name} onChange={e=>setF({...f,name:e.target.value})}
              placeholder="Ej: Roble Blanco Select 4/4" style={S.inp}/>
          </Fld>
          <Fld label="Categoría">
            <select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})} style={S.sel}>
              {CATS.slice(1).map(c=><option key={c}>{c}</option>)}
            </select>
          </Fld>
          <Fld label='Grosor (pulgadas)'>
            <input type="number" value={f.thick} onChange={e=>setF({...f,thick:e.target.value})}
              step="0.25" placeholder='Ej: 0.75, 1, 1.5' style={S.inp}/>
          </Fld>
          <Fld label="Descripción / notas" style={{gridColumn:"span 2"}}>
            <input value={f.desc||""} onChange={e=>setF({...f,desc:e.target.value})}
              placeholder="Características, acabado, grado..." style={S.inp}/>
          </Fld>
        </div>
      </Card>

      <Card>
        <CardTitle>Precio</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fld label="Costo ($)">
            <input type="number" value={f.cost} onChange={e=>setF({...f,cost:e.target.value})}
              step="0.01" placeholder="0.00" style={S.inp}/>
          </Fld>
          <Fld label="Unidad de precio">
            <select value={f.costUnit} onChange={e=>setF({...f,costUnit:e.target.value})} style={S.sel}>
              {COST_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </Fld>
        </div>
        {/* Preview equivalencia */}
        {+f.cost > 0 && (
          <div style={{padding:"8px 12px",background:A.bgDark,borderRadius:6,
            fontSize:12,color:"#777",marginTop:4,borderLeft:`2px solid ${A.orange}55`}}>
            <span style={{color:A.orange,fontWeight:700}}>${(+f.cost).toFixed(2)}</span>
            {" "}por {f.costUnit}
            {f.costUnit==="pie²" && <span style={{color:"#555"}}>{" "}= ${(+f.cost/0.0929).toFixed(2)}/m² equiv.</span>}
            {f.costUnit==="m²"   && <span style={{color:"#555"}}>{" "}= ${(+f.cost*0.0929).toFixed(2)}/pie² equiv.</span>}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Inventario</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fld label="Cantidad en stock">
            <input type="number" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}
              placeholder="0" style={S.inp}/>
          </Fld>
          <Fld label="Unidad de stock">
            <select value={f.stockUnit||"pie²"} onChange={e=>setF({...f,stockUnit:e.target.value})} style={S.sel}>
              {STOCK_UNITS.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </Fld>
        </div>
      </Card>

      <Card>
        <CardTitle>Proveedor (opcional — se puede completar después)</CardTitle>
        <Fld label="Nombre del proveedor">
          <input value={f.proveedor||""} onChange={e=>setF({...f,proveedor:e.target.value})}
            placeholder="Ej: Maderas García, Home Depot..." style={S.inp}/>
        </Fld>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Fld label="Teléfono / WhatsApp">
            <input value={f.provTel||""} onChange={e=>setF({...f,provTel:e.target.value})}
              placeholder="555-123-4567" style={S.inp}/>
          </Fld>
          <Fld label="Email">
            <input value={f.provEmail||""} onChange={e=>setF({...f,provEmail:e.target.value})}
              placeholder="ventas@..." style={S.inp}/>
          </Fld>
        </div>
        <Fld label="Notas (pedido mínimo, descuentos, etc.)">
          <textarea value={f.provNota||""} onChange={e=>setF({...f,provNota:e.target.value})}
            placeholder="Descuento 10% en pedidos +50 pt. Solo efectivo."
            style={{...S.inp,minHeight:60,resize:"vertical",fontFamily:A.sans}}/>
        </Fld>
      </Card>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:30}}>
        <button onClick={cancel} style={S.btnGhost}>Cancelar</button>
        <button onClick={save} style={S.btnPrimary}>
          {eid!==null?"Guardar cambios":"Agregar al catálogo"}
        </button>
      </div>
    </div>
  );

  // ── LIST VIEW ─────────────────────────────────────────────
  return (
    <div>
      <PageTitle icon="🗄" title="Mis Maderas"
        sub="Catálogo personalizado con precios, stock y proveedores" />

      {/* Actions */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={openNew} style={{...S.btnPrimary,flex:1}}>+ Nueva madera</button>
        <button onClick={()=>setView("library")} style={{...S.btnGhost,flex:1,borderColor:`${A.orange}55`,color:A.orange}}>
          📚 Biblioteca de especies
        </button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setFilt(c)} style={{...S.chip,...(filt===c?S.chipOn:{})}}>
            {c}{c!=="Todos"&&<span style={{opacity:.5}}> ({catalog.filter(m=>m.cat===c).length})</span>}
          </button>
        ))}
      </div>

      {/* Summary */}
      {catalog.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
          <StatMini label="Materiales" val={catalog.length} />
          <StatMini label="Con proveedor" val={catalog.filter(m=>m.proveedor).length} />
          <StatMini label="Con stock" val={catalog.filter(m=>+m.stock>0).length} accent />
        </div>
      )}

      {/* Cards */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {shown.map(m => {
          const isOpen = expanded===m.id;
          const hasSupplier = m.proveedor || m.provTel || m.provEmail;
          return (
            <div key={m.id} style={{
              background:A.bgCard, border:`1px solid ${isOpen?A.orange+"55":A.border}`,
              borderRadius:10, overflow:"hidden",
              transition:"border-color .2s",
            }}>
              {/* Main row */}
              <div style={{display:"flex",alignItems:"stretch"}}>
                <div style={{width:4,background:CAT_COLOR[m.cat]||"#555",flexShrink:0}}/>
                <div style={{flex:1,padding:"12px 14px",minWidth:0,cursor:"pointer"}}
                  onClick={()=>setEx(isOpen?null:m.id)}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:5}}>
                    <span style={{fontSize:15,fontWeight:700,color:"#e8e8e8"}}>{m.name}</span>
                    <Tag>{m.cat}</Tag>
                    {hasSupplier && <Tag style={{color:"#5B9BD5"}}>🏪 {m.proveedor||"Proveedor"}</Tag>}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{
                      fontSize:13,fontWeight:700,color:A.orange,
                      background:`${A.orange}15`,borderRadius:6,padding:"2px 9px",
                      border:`1px solid ${A.orange}44`,
                    }}>
                      ${(+m.cost).toFixed(2)}/{m.costUnit}
                    </span>
                    {m.thick>0 && <Tag>📏 {m.thick}"</Tag>}
                    {+m.stock>0 && (
                      <Tag style={{color:A.green}}>
                        📦 {m.stock} {m.stockUnit}
                      </Tag>
                    )}
                    {+m.stock===0 && m.stock!=="" && (
                      <Tag style={{color:"#c0392b"}}>⚠ Sin stock</Tag>
                    )}
                  </div>
                  {m.desc && <p style={{fontSize:11,color:"#555",marginTop:5,lineHeight:1.5}}>{m.desc}</p>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,padding:"8px 8px",flexShrink:0,justifyContent:"center"}}>
                  <button onClick={()=>openEdit(m)} style={S.btnIconSm} title="Editar">✏️</button>
                  <button onClick={()=>openSupplier(m)} style={S.btnIconSm} title="Proveedor">🏪</button>
                  <button onClick={()=>del(m.id)} style={{...S.btnIconSm,opacity:.4}} title="Eliminar">🗑</button>
                </div>
              </div>

              {/* Expanded: proveedor detalle */}
              {isOpen && (
                <div style={{
                  padding:"12px 18px",borderTop:`1px solid ${A.border}`,
                  background:A.bgDark, animation:"fadeIn .15s ease",
                }}>
                  {/* Equivalencias de precio */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:A.muted,textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>
                      Equivalencias de precio
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {m.costUnit!=="pie²" && <InfoPill label="por pie²" val={`$${(m.costUnit==="m²"?(+m.cost*0.0929):(+m.cost)).toFixed(2)}`}/>}
                      {m.costUnit!=="m²"   && <InfoPill label="por m²" val={`$${(m.costUnit==="pie²"?(+m.cost/0.0929):(+m.cost)).toFixed(2)}`}/>}
                      {m.thick>0 && <InfoPill label="grosor real" val={`${m.thick}" = ${(m.thick*25.4).toFixed(1)}mm`}/>}
                    </div>
                  </div>

                  {/* Proveedor */}
                  {hasSupplier ? (
                    <div>
                      <div style={{fontSize:10,color:A.muted,textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>
                        Proveedor
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"#ccc",marginBottom:6}}>{m.proveedor}</div>
                      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                        {m.provTel && (
                          <a href={`tel:${m.provTel}`} style={{...S.contactBtn, background:`${A.green}18`, borderColor:`${A.green}55`, color:A.green}}>
                            📞 {m.provTel}
                          </a>
                        )}
                        {m.provEmail && (
                          <a href={`mailto:${m.provEmail}`} style={{...S.contactBtn, background:`${A.blue}18`, borderColor:`${A.blue}55`, color:A.blue}}>
                            ✉ {m.provEmail}
                          </a>
                        )}
                      </div>
                      {m.provNota && (
                        <div style={{marginTop:8,padding:"7px 10px",background:"#111",borderRadius:6,
                          fontSize:12,color:"#666",borderLeft:`2px solid ${A.orange}55`,lineHeight:1.5}}>
                          💡 {m.provNota}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={()=>openSupplier(m)} style={{
                      width:"100%",padding:"9px",background:"transparent",
                      border:`1px dashed ${A.border2}`,borderRadius:6,
                      color:A.muted,fontSize:12,cursor:"pointer",fontFamily:A.sans,
                    }}>
                      + Agregar proveedor y contacto
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {shown.length===0 && (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:14,color:"#333",marginBottom:12}}>
              {filt==="Todos" ? "Tu catálogo está vacío." : `Sin materiales en "${filt}".`}
            </div>
            <button onClick={openNew} style={S.btnPrimary}>+ Agregar madera</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pequeños helpers visuales del catálogo ─────────────────────
function StatMini({ label, val, accent }) {
  return (
    <div style={{background:A.bgCard,border:`1px solid ${accent?A.orange+"44":A.border}`,
      borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
      <div style={{fontSize:22,fontWeight:900,fontFamily:A.display,color:accent?A.orange:"#888"}}>{val}</div>
      <div style={{fontSize:10,color:A.muted,textTransform:"uppercase",letterSpacing:.6}}>{label}</div>
    </div>
  );
}
function InfoPill({ label, val }) {
  return (
    <div style={{background:"#1e1e1e",border:`1px solid ${A.border2}`,borderRadius:6,padding:"4px 10px"}}>
      <div style={{fontSize:9,color:A.muted,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
      <div style={{fontSize:12,fontFamily:A.mono,color:A.orange,fontWeight:700}}>{val}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TAB: GUÍA DE REFERENCIA
// ══════════════════════════════════════════════════════════════
function RefTab() {
  const [sec, setSec] = useState("woods");
  const SECS = [["woods","🌲 Maderas"],["nails","🔨 Clavos"],["screws","🪛 Tornillos"]];

  return (
    <div>
      <PageTitle icon="📖" title="Guía de Referencia"
        sub="Especies, clavos, tornillos y más" />
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {SECS.map(([k,l])=>(
          <button key={k} onClick={()=>setSec(k)} style={{...S.chip,...(sec===k?S.chipOn:{})}}>{l}</button>
        ))}
      </div>

      {sec==="woods" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {WOOD_SPECIES.map(w=>(
            <div key={w.name} style={S.matCard}>
              <div style={{...S.matStripe,background:w.color}}/>
              <div style={{flex:1,padding:"10px 14px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#e8e8e8",marginBottom:5}}>{w.name}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>
                  <Tag>💪 {w.hardness}</Tag>
                  <Tag>⚖ {w.density} g/cm³</Tag>
                </div>
                <div style={{fontSize:12,color:"#555"}}>📐 {w.uses}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sec==="nails" && (
        <Card>
          <CardTitle>Tabla de Clavos — Sistema Pennyweight (d)</CardTitle>
          <div style={{overflowX:"auto"}}>
            <table style={S.tbl}>
              <thead>
                <tr>{["Calibre","Largo pulg","Largo mm","Diámetro"].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {NAILS.map(([c,l,m,d])=>(
                  <tr key={c}>
                    <td style={{...S.td,color:A.orange,fontWeight:700,fontFamily:A.mono}}>{c}</td>
                    <td style={{...S.td,fontFamily:A.mono}}>{l}</td>
                    <td style={{...S.td,fontFamily:A.mono,color:A.blue}}>{m}</td>
                    <td style={{...S.td,fontFamily:A.mono,color:"#888"}}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Hint>El calibre "d" viene del penique inglés. Mayor número = clavo más largo.</Hint>
        </Card>
      )}

      {sec==="screws" && (
        <Card>
          <CardTitle>Tornillos y Brocas Recomendadas</CardTitle>
          <div style={{overflowX:"auto"}}>
            <table style={S.tbl}>
              <thead>
                <tr>{["#","Diámetro","Cuerpo","Piloto","Largo usual","Uso típico"].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {SCREWS.map(([c,d,b,p,l,u])=>(
                  <tr key={c}>
                    <td style={{...S.td,color:A.orange,fontWeight:700,fontFamily:A.mono}}>{c}</td>
                    <td style={{...S.td,fontFamily:A.mono,color:A.blue}}>{d}</td>
                    <td style={{...S.td,fontFamily:A.mono}}>{b}</td>
                    <td style={{...S.td,fontFamily:A.mono}}>{p}</td>
                    <td style={{...S.td,fontFamily:A.mono,color:"#888"}}>{l}</td>
                    <td style={{...S.td,color:"#666",fontSize:11}}>{u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Hint>Broca piloto ≈ 85% del diámetro del núcleo del tornillo en maderas duras.</Hint>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DESIGN SYSTEM
// ══════════════════════════════════════════════════════════════
const A = {
  orange: "#E8912A",
  orangeL:"#F5A94C",
  blue:   "#5B9BD5",
  green:  "#5BAD6F",
  bg:     "#0f0f0f",
  bgCard: "#181818",
  bgDark: "#0a0a0a",
  border: "#232323",
  border2:"#2d2d2d",
  text:   "#D8D0C4",
  muted:  "#666",
  mono:   "'JetBrains Mono', 'Courier New', monospace",
  sans:   "'Barlow', system-ui, sans-serif",
  display:"'Barlow Condensed', 'Barlow', system-ui, sans-serif",
};

const STATUS_COLOR = {
  "Pendiente":   "#666",
  "En progreso": A.orange,
  "Completado":  A.green,
  "En pausa":    A.blue,
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;900&family=Barlow:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${A.bg}; }
  button { cursor:pointer; }
  input:focus, select:focus {
    outline: none;
    border-color: ${A.orange} !important;
    box-shadow: 0 0 0 2px ${A.orange}28;
  }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${A.bgDark}; }
  ::-webkit-scrollbar-thumb { background:${A.orange}; border-radius:2px; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .fadeIn { animation: fadeIn 0.2s ease both; }
  tr:hover td { background: rgba(232,145,42,0.03); }
  button:active { transform: scale(0.97); }
`;

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="1" y="15" width="32" height="6" rx="1.5" fill={A.orange}/>
      <rect x="6" y="9" width="4" height="16" rx="1.5" fill="#555"/>
      <rect x="24" y="9" width="4" height="16" rx="1.5" fill="#555"/>
      <path d="M4 9L17 4L30 9" stroke={A.orange} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <circle cx="17" cy="18" r="2" fill={A.bgDark}/>
    </svg>
  );
}

function HeaderBadge({ label, val, accent }) {
  return (
    <div style={{
      textAlign:"center",padding:"6px 12px",borderRadius:8,
      background: accent ? `${A.orange}18` : "#181818",
      border:`1px solid ${accent ? A.orange+"44" : A.border}`,
    }}>
      <div style={{fontSize:18,fontWeight:900,color:accent?A.orange:"#888",fontFamily:A.display}}>{val}</div>
      <div style={{fontSize:10,color:"#555",letterSpacing:.6,textTransform:"uppercase"}}>{label}</div>
    </div>
  );
}

function PageTitle({ icon, title, sub }) {
  return (
    <div style={{marginBottom:12,marginTop:4}}>
      <h2 style={{display:"flex",alignItems:"center",gap:8,
        fontFamily:A.display,fontSize:19,fontWeight:700,color:A.text,letterSpacing:.3}}>
        <span>{icon}</span>{title}
      </h2>
      {sub && <p style={{fontSize:12,color:A.muted,marginTop:3}}>{sub}</p>}
    </div>
  );
}
function Card({ children, style:st }) {
  return <div style={{...S.card,...(st||{})}}>{children}</div>;
}
function CardTitle({ children }) {
  return <div style={S.cardTitle}>{children}</div>;
}
function Fld({ label, children, flex, style:st }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10,flex:flex||1,...(st||{})}}>
      <label style={S.lbl}>{label}</label>
      {children}
    </div>
  );
}
function ResultBox({ children, mini }) {
  return (
    <div style={{
      background:A.bgDark,border:`1px solid ${A.border2}`,
      borderLeft:`3px solid ${A.orange}`,borderRadius:8,
      padding: mini ? "12px 14px" : "16px 20px",
      margin:"8px 0 4px",textAlign:"center",
    }}>
      {children}
    </div>
  );
}
function TotBlock({ label, val, accent }) {
  return (
    <div style={{textAlign:"center",flex:1}}>
      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:A.display,color:accent?A.green:A.orange}}>{val}</div>
    </div>
  );
}
function Tag({ children, accent, style:st }) {
  return (
    <span style={{
      fontSize:11,padding:"2px 9px",borderRadius:12,
      background:accent?`${A.orange}18`:"#1e1e1e",
      color:accent?A.orange:A.muted,
      border:`1px solid ${accent?A.orange+"55":A.border}`,
      ...(st||{}),
    }}>{children}</span>
  );
}
function StatusTag({ s }) {
  const c = STATUS_COLOR[s]||A.muted;
  return (
    <span style={{fontSize:10,padding:"2px 9px",borderRadius:12,
      background:c+"22",color:c,border:`1px solid ${c}55`,fontWeight:700,letterSpacing:.3}}>
      {s}
    </span>
  );
}
function Hint({ children }) {
  return (
    <div style={{fontSize:11,color:A.muted,marginTop:10,padding:"6px 10px",
      background:A.bgDark,borderRadius:6,borderLeft:`2px solid ${A.border2}`}}>
      💡 {children}
    </div>
  );
}
function Empty({ text }) {
  return (
    <div style={{textAlign:"center",padding:"40px 0",color:"#333",fontSize:14,fontStyle:"italic"}}>
      {text}
    </div>
  );
}

function fmtN(n, digits=4) {
  if (typeof n !== "number" || isNaN(n)) return "—";
  const s = parseFloat(n.toFixed(digits));
  return String(s);
}

// ─── STYLES OBJECT ─────────────────────────────────────────────
const S = {
  root: { minHeight:"100vh", background:A.bg, fontFamily:A.sans, color:A.text, fontSize:14 },

  // Header
  header: {
    background:`linear-gradient(180deg, #141414 0%, ${A.bgDark} 100%)`,
    borderBottom:`1px solid ${A.border}`,
    padding:"14px 18px",
    display:"flex", justifyContent:"space-between", alignItems:"center",
    position:"sticky", top:0, zIndex:20,
    boxShadow:"0 2px 20px rgba(0,0,0,.5)",
  },
  headerLeft: { display:"flex", alignItems:"center", gap:12 },
  headerRight: { display:"flex", gap:10 },
  brand: { fontFamily:A.display, fontWeight:900, fontSize:22, color:A.text, letterSpacing:2, lineHeight:1 },
  brandSub: { fontSize:10, color:A.muted, letterSpacing:.5, marginTop:2 },

  // Nav
  nav: { background:A.bgDark, borderBottom:`1px solid ${A.border}`, position:"sticky", top:58, zIndex:19 },
  navInner: { display:"flex", overflowX:"auto" },
  navBtn: {
    flex:"0 0 auto", display:"flex", flexDirection:"column", alignItems:"center",
    padding:"10px 14px", background:"transparent", border:"none",
    color:A.muted, gap:3, minWidth:70, position:"relative", transition:"color .15s",
    fontFamily:A.sans,
  },
  navBtnOn: { color:A.orange },
  navIcon:  { fontSize:16 },
  navLabel: { fontSize:10, letterSpacing:.5, textTransform:"uppercase" },
  navUnderline: {
    position:"absolute", bottom:0, left:"15%", right:"15%",
    height:2, background:A.orange, borderRadius:1,
  },

  main: { maxWidth:720, margin:"0 auto", padding:"18px 14px 70px" },

  // Card
  card: {
    background:A.bgCard, border:`1px solid ${A.border}`,
    borderRadius:10, padding:"16px 14px", marginBottom:14,
  },
  cardTitle: {
    fontSize:12, fontWeight:700, color:A.orange, textTransform:"uppercase",
    letterSpacing:.8, marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${A.border}`,
  },

  // Form
  lbl: { fontSize:10, fontWeight:700, color:A.muted, textTransform:"uppercase", letterSpacing:.6 },
  inp: {
    padding:"9px 11px", background:A.bgDark, border:`1px solid ${A.border2}`,
    borderRadius:6, color:A.text, fontSize:14, width:"100%", transition:"border-color .15s",
    fontFamily:A.sans,
  },
  sel: {
    padding:"9px 11px", background:A.bgDark, border:`1px solid ${A.border2}`,
    borderRadius:6, color:A.text, fontSize:13, width:"100%", cursor:"pointer",
    fontFamily:A.sans,
  },

  // Result
  resSub:  { fontSize:12, color:A.muted, marginBottom:2 },
  resBig:  { fontFamily:A.mono, fontSize:34, fontWeight:700, color:A.orange, lineHeight:1.1 },
  resUnit: { fontSize:20, color:A.muted },
  resFrac: { fontSize:12, color:A.blue, marginTop:6, fontFamily:A.mono },

  resultPlaceholder: {
    padding:"20px", textAlign:"center", color:"#333",
    fontSize:13, fontStyle:"italic", borderTop:`1px solid ${A.border}`, marginTop:14,
  },

  // Quick cards
  quickGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 },
  quickCard: {
    background:A.bgCard, border:`1px solid ${A.border}`, borderRadius:8,
    padding:"10px 12px", textAlign:"left", cursor:"pointer",
    transition:"border-color .15s, background .15s", fontFamily:A.sans,
  },
  quickTop: { fontSize:11, color:A.orange, fontWeight:700, marginBottom:3 },
  quickBot: { fontSize:12, color:"#888", fontFamily:A.mono },

  // Table
  tbl:  { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th:   { padding:"7px 10px", background:A.bgDark, color:A.muted, fontWeight:700,
          textTransform:"uppercase", fontSize:10, letterSpacing:.5, textAlign:"center",
          borderBottom:`1px solid ${A.border}` },
  td:   { padding:"7px 10px", textAlign:"center", color:"#bbb", borderBottom:`1px solid #181818` },
  tdh:  { background:"#161616", color:A.muted, fontWeight:700 },

  // Buttons
  btnPrimary: {
    padding:"10px 22px", background:A.orange, border:"none", borderRadius:6,
    fontWeight:700, fontSize:14, color:A.bgDark, fontFamily:A.sans, cursor:"pointer",
  },
  btnGhost: {
    padding:"10px 18px", background:"transparent", border:`1px solid ${A.border2}`,
    borderRadius:6, fontWeight:600, fontSize:14, color:A.muted, fontFamily:A.sans, cursor:"pointer",
  },
  btnIconSm: {
    background:"transparent", border:"none", fontSize:18, padding:"4px 6px", cursor:"pointer", borderRadius:4,
  },
  backBtn: {
    background:"transparent", border:"none", color:A.orange, fontSize:13,
    cursor:"pointer", padding:"0 0 12px", fontWeight:600, letterSpacing:.3, fontFamily:A.sans,
  },
  addRowBtn: {
    marginTop:8, padding:"8px 0", background:"transparent", width:"100%",
    border:`1px dashed ${A.border2}`, borderRadius:6, color:A.muted,
    fontSize:13, cursor:"pointer", fontFamily:A.sans,
  },
  delBtn: {
    padding:"3px 7px", background:"rgba(180,40,40,.12)", border:"none",
    borderRadius:4, color:"#c0392b", fontSize:12, cursor:"pointer",
  },
  swapBtn: {
    padding:"9px 12px", background:A.orange, border:"none", borderRadius:6,
    fontSize:15, color:A.bgDark, fontWeight:700, cursor:"pointer", marginBottom:10,
  },

  // Chips
  chip: {
    padding:"5px 14px", background:"transparent", border:`1px solid ${A.border}`,
    borderRadius:20, fontSize:12, color:A.muted, cursor:"pointer", fontWeight:600, fontFamily:A.sans,
  },
  chipOn: { background:`${A.orange}18`, borderColor:`${A.orange}66`, color:A.orange },

  // Contact link button
  contactBtn: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"6px 12px", borderRadius:8, border:"1px solid",
    fontSize:12, textDecoration:"none", fontFamily:A.sans, cursor:"pointer",
    fontWeight:600,
  },

  // Lists
  row:   { display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" },
  twoCol:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 },
  totals:{ display:"flex", gap:8, marginTop:14, paddingTop:12, borderTop:`1px solid ${A.border}` },

  // Project + mat cards
  projCard: {
    display:"flex", alignItems:"stretch", background:A.bgCard,
    border:`1px solid ${A.border}`, borderRadius:8, overflow:"hidden",
  },
  projStripe: { width:4, flexShrink:0 },
  projName: { fontSize:15, fontWeight:700, color:"#e8e8e8", fontFamily:A.display },
  matCard: {
    display:"flex", alignItems:"stretch", background:A.bgCard,
    border:`1px solid ${A.border}`, borderRadius:8, overflow:"hidden",
  },
  matStripe: { width:4, flexShrink:0 },
};
