#!/usr/bin/env node
/**
 * PNG (anche trasparenti) / JPG → WebP ottimizzati per il sito.
 *
 *   npm run images
 *
 * Sorgenti: assets/images/<cartella>/<nome>.(png|jpg|jpeg)
 * Output:   public/photos/<cartella>/<nome>.webp            (larghezza massima 1600 px)
 *           public/photos/<cartella>/<nome>-800.webp        (versione leggera per mobile)
 * La trasparenza (canale alpha) viene conservata. I file già aggiornati vengono saltati.
 */
import { readdir, mkdir, stat } from "node:fs/promises";
import { join, parse, relative } from "node:path";
import sharp from "sharp";

const SRC = "assets/images";
const OUT = "public/photos";
const SIZES = [
  { suffix: "", width: 1600 },
  { suffix: "-800", width: 800 },
];

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(png|jpe?g)$/i.test(e.name)) yield p;
  }
}

const newer = async (a, b) => {
  try {
    return (await stat(a)).mtimeMs > (await stat(b)).mtimeMs;
  } catch {
    return true;
  }
};

let count = 0;
for await (const file of walk(SRC)) {
  const { dir, name } = parse(relative(SRC, file));
  const outDir = join(OUT, dir);
  await mkdir(outDir, { recursive: true });
  const meta = await sharp(file).metadata();
  for (const { suffix, width } of SIZES) {
    const out = join(outDir, `${name}${suffix}.webp`);
    if (!(await newer(file, out))) continue;
    await sharp(file)
      .resize({ width: Math.min(width, meta.width ?? width), withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toFile(out);
    const kb = ((await stat(out)).size / 1024).toFixed(0);
    console.log(`✓ ${out} (${kb} KB${meta.hasAlpha ? ", trasparente" : ""})`);
    count++;
  }
}
console.log(count ? `${count} file WebP generati.` : `Nessuna immagine nuova in ${SRC}/.`);
