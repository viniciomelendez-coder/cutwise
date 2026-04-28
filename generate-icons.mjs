// generate-icons.mjs
// Ejecuta: node generate-icons.mjs
// Genera los íconos PNG necesarios para la PWA en la carpeta public/

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Fondo ámbar redondeado
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#D4900A");
  grad.addColorStop(1, "#A06808");
  ctx.fillStyle = grad;
  ctx.fill();

  // Emoji madera centrado
  const em = size * 0.55;
  ctx.font = `${em}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🪵", size / 2, size / 2 + size * 0.03);

  return canvas.toBuffer("image/png");
}

try {
  writeFileSync("public/icon-192.png", drawIcon(192));
  writeFileSync("public/icon-512.png", drawIcon(512));
  console.log("✓ Íconos generados: public/icon-192.png y public/icon-512.png");
} catch (e) {
  console.log("Instala canvas primero: npm install canvas");
  console.log("O simplemente usa cualquier imagen PNG de 192x192 y 512x512 px");
  console.log("y renómbralas icon-192.png e icon-512.png dentro de /public/");
}
