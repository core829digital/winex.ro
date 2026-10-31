#!/usr/bin/env node
/**
 * Logo ufficiale → asset per il sito.
 *
 *   npm run brand
 *
 * Sorgente: branding/WINEX-ADVANCE-REBUILT.png (fondo grigio chiaro, non trasparente).
 * 1. Rimuove il fondo con "color to alpha" (bordi antialias morbidi, colori puri preservati).
 * 2. Ritaglia lo spazio vuoto.
 * 3. Esporta: public/brand/winex-logo.webp          (rosso + nero, per fondi chiari)
 *             public/brand/winex-logo-inverse.webp  (rosso + bianco, per fondi scuri)
 *             public/brand/winex-logo.png           (per l'immagine di condivisione)
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SRC = "branding/WINEX-ADVANCE-REBUILT.png";
const OUT = "public/brand";
const HEIGHT = 240; // altezza esportata (px): nitido fino a ~7× l'altezza mostrata nell'header

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

// colore di fondo: mediana dei 4 angoli
const corner = (x, y) => data[(y * width + x) * channels];
const bg = [corner(2, 2), corner(width - 3, 2), corner(2, height - 3), corner(width - 3, height - 3)].sort((a, b) => a - b)[1];

const normal = Buffer.alloc(data.length);
const inverse = Buffer.alloc(data.length);
for (let i = 0; i < data.length; i += channels) {
  // alpha = quanto il pixel si discosta dal fondo (il canale più lontano decide)
  let a = 0;
  for (let c = 0; c < 3; c++) {
    const v = data[i + c];
    // il logo non ha parti bianche: ciò che è più chiaro del fondo (es. il riquadro attorno alla «X») è fondo
    const d = v > bg ? 0 : (bg - v) / (bg || 1);
    if (d > a) a = d;
  }
  // sotto soglia è fondo puro (rumore di compressione)
  a = a < 0.06 ? 0 : Math.min(1, (a - 0.06) / 0.94);
  for (let c = 0; c < 3; c++) {
    const v = data[i + c];
    const un = a > 0 ? Math.round(Math.min(255, Math.max(0, (v - bg) / a + bg))) : 0;
    normal[i + c] = un;
  }
  normal[i + 3] = Math.round(a * 255);

  // variante per fondi scuri: il nero diventa bianco, il rosso resta rosso
  const [r, g, b] = [normal[i], normal[i + 1], normal[i + 2]];
  const isRed = r > 120 && r - Math.max(g, b) > 80;
  inverse[i] = isRed ? r : 255;
  inverse[i + 1] = isRed ? g : 255;
  inverse[i + 2] = isRed ? b : 255;
  inverse[i + 3] = normal[i + 3];
}

await mkdir(OUT, { recursive: true });
const raw = { raw: { width, height, channels } };
const trimmed = await sharp(normal, raw).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const { trimOffsetLeft: left, trimOffsetTop: top, width: tw, height: th } = trimmed.info;
const box = { left: -left, top: -top, width: tw, height: th };

for (const [buf, name] of [
  [normal, "winex-logo"],
  [inverse, "winex-logo-inverse"],
]) {
  const img = sharp(buf, raw).extract(box).resize({ height: HEIGHT });
  await img.clone().webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/${name}.webp`);
  if (name === "winex-logo") await img.clone().png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
}
const outW = Math.round((tw * HEIGHT) / th);
console.log(`fondo rilevato: ${bg} · ritaglio ${tw}×${th} → ${outW}×${HEIGHT} (rapporto ${(tw / th).toFixed(3)})`);
