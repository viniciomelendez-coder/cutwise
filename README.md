# CutWise — Guía de instalación en iPhone

**Calculadora profesional de carpintería**
Creada por Vinicio Meléndez

---

## Paso 1 — Instala Node.js en tu computadora

Descarga desde: https://nodejs.org  
Elige la versión **LTS** (la más estable). Instala normalmente.

---

## Paso 2 — Sube el proyecto a GitHub

1. Ve a https://github.com y crea una cuenta gratuita (si no tienes)
2. Haz clic en **"New repository"**
3. Nómbralo `cutwise`
4. Deja todo por defecto y haz clic en **"Create repository"**
5. GitHub te mostrará instrucciones. En tu computadora, abre la terminal (Mac) o Command Prompt (Windows) y escribe:

```bash
cd ruta/a/la/carpeta/cutwise
npm install
git init
git add .
git commit -m "CutWise inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/cutwise.git
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

---

## Paso 3 — Despliega en Vercel (gratis)

1. Ve a https://vercel.com
2. Haz clic en **"Sign Up"** → elige **"Continue with GitHub"**
3. Autoriza Vercel para acceder a tu GitHub
4. Haz clic en **"Add New Project"**
5. Selecciona el repositorio `cutwise`
6. Vercel detecta automáticamente que es Vite — no cambies nada
7. Haz clic en **"Deploy"**
8. En ~2 minutos tendrás una URL como: `cutwise.vercel.app`

---

## Paso 4 — Instala en tu iPhone como app

1. Abre **Safari** en tu iPhone (debe ser Safari, no Chrome)
2. Ve a tu URL de Vercel (ej: `cutwise.vercel.app`)
3. Toca el botón de **compartir** ↑ (el cuadrado con la flechita)
4. Desplázate y toca **"Añadir a pantalla de inicio"**
5. Escribe `CutWise` como nombre y toca **"Añadir"**
6. ¡Listo! Aparece como app con ícono en tu pantalla de inicio

---

## Íconos de la app (opcional pero recomendado)

Para que la app tenga su propio ícono en la pantalla de inicio,
coloca dos imágenes PNG en la carpeta `public/`:
- `icon-192.png` — 192×192 píxeles
- `icon-512.png` — 512×512 píxeles

Puedes crear un ícono simple en https://www.canva.com o usar
cualquier imagen cuadrada con el logotipo que prefieras.

Alternativamente, ejecuta el generador automático:
```bash
npm install canvas
node generate-icons.mjs
```

---

## Actualizar la app

Cuando hagas cambios al código:
```bash
git add .
git commit -m "descripción del cambio"
git push
```
Vercel detecta el push y actualiza la URL automáticamente en ~1 minuto.
La próxima vez que abras la app en tu iPhone ya tendrá los cambios.

---

## Estructura del proyecto

```
cutwise/
├── public/
│   ├── manifest.json      ← configuración PWA para iPhone
│   ├── icon-192.png       ← ícono de la app (tú lo pones)
│   └── icon-512.png       ← ícono de la app (tú lo pones)
├── src/
│   ├── main.jsx           ← punto de entrada React
│   └── App.jsx            ← toda la aplicación CutWise
├── index.html             ← HTML principal
├── package.json           ← dependencias
├── vite.config.js         ← configuración del bundler
└── generate-icons.mjs     ← script opcional para íconos
```

---

© 2025 Vinicio Meléndez — Todos los derechos reservados
