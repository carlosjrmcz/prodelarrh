import { createCanvas } from "canvas";
import { mkdirSync, writeFileSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a5c3a";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#e87722";
  ctx.fillRect(0, size * 0.85, size, size * 0.15);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.38}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("RH", size / 2, size * 0.42);

  return canvas.toBuffer("image/png");
}

writeFileSync("public/icons/icon-192.png", generateIcon(192));
writeFileSync("public/icons/icon-512.png", generateIcon(512));
writeFileSync("public/icons/icon-180.png", generateIcon(180));
writeFileSync("public/icons/favicon-32.png", generateIcon(32));

console.log("Icones PWA gerados.");
