#!/usr/bin/env node

// src/main/ops.ts
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve, sep } from "node:path";
function uniquePath(dir, stem, ext) {
  let p = join(dir, `${stem}.${ext}`);
  let i = 1;
  while (existsSync(p)) {
    p = join(dir, `${stem}-${i}.${ext}`);
    i++;
  }
  return p;
}
function outPath(input, suffix, ext) {
  return uniquePath(dirname(input), `${basename(input, extname(input))}-${suffix}`, ext);
}
var normExt = (input) => {
  const e = extname(input).slice(1).toLowerCase();
  return e === "jpeg" ? "jpg" : e;
};
async function convertImage(input, to) {
  const out = outPath(input, to, to);
  const img = sharp(input);
  if (to === "jpg") await img.jpeg({ quality: 90 }).toFile(out);
  else if (to === "png") await img.png().toFile(out);
  else await img.webp({ quality: 90 }).toFile(out);
  return out;
}
async function resizeImage(input, opts) {
  let width = opts.width;
  if (opts.percent) {
    const meta = await sharp(input).metadata();
    if (meta.width) width = Math.max(1, Math.round(meta.width * opts.percent / 100));
  }
  const out = outPath(input, "resized", normExt(input) || "jpg");
  await sharp(input).resize({ width, withoutEnlargement: true }).toFile(out);
  return out;
}
async function compressImage(input) {
  const ext = normExt(input) || "jpg";
  const out = outPath(input, "compressed", ext);
  const img = sharp(input);
  if (ext === "png") await img.png({ compressionLevel: 9, palette: true }).toFile(out);
  else if (ext === "webp") await img.webp({ quality: 75 }).toFile(out);
  else await img.jpeg({ quality: 70, mozjpeg: true }).toFile(out);
  return out;
}
async function removeMetadata(input) {
  const ext = normExt(input) || "jpg";
  const out = outPath(input, "clean", ext);
  const img = sharp(input);
  if (ext === "png") await img.png().toFile(out);
  else if (ext === "webp") await img.webp({ quality: 92 }).toFile(out);
  else await img.jpeg({ quality: 92 }).toFile(out);
  return out;
}
function hashFile(input, algo = "sha256") {
  return new Promise((resolve2, reject) => {
    const h = createHash(algo);
    const s = createReadStream(input);
    s.on("data", (d) => h.update(d));
    s.on("end", () => resolve2(h.digest("hex")));
    s.on("error", reject);
  });
}
async function mergePdfs(files) {
  if (files.length === 0) throw new Error("No PDF files given");
  const merged = await PDFDocument.create();
  for (const f of files) {
    const src = await PDFDocument.load(await readFile(f));
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const out = uniquePath(dirname(files[0]), "merged", "pdf");
  await writeFile(out, await merged.save());
  return out;
}
async function splitPdf(file) {
  const src = await PDFDocument.load(await readFile(file));
  const dir = dirname(file);
  const name = basename(file, extname(file));
  const outputs = [];
  const count = src.getPageCount();
  for (let i = 0; i < count; i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const out = uniquePath(dir, `${name}-p${String(i + 1).padStart(3, "0")}`, "pdf");
    await writeFile(out, await doc.save());
    outputs.push(out);
  }
  return outputs;
}
async function zipFiles(files) {
  if (files.length === 0) throw new Error("No files given");
  const zip = new AdmZip();
  const used = /* @__PURE__ */ new Set();
  for (const f of files) {
    const ext = extname(f);
    let entry = basename(f);
    let i = 1;
    while (used.has(entry)) {
      entry = `${basename(f, ext)}-${i}${ext}`;
      i++;
    }
    used.add(entry);
    zip.addLocalFile(f, "", entry);
  }
  const out = uniquePath(dirname(files[0]), "archive", "zip");
  zip.writeZip(out);
  return out;
}
async function unzip(file) {
  const zip = new AdmZip(file);
  let out = join(dirname(file), `${basename(file, extname(file))}-extracted`);
  let i = 1;
  while (existsSync(out)) {
    out = join(dirname(file), `${basename(file, extname(file))}-extracted-${i}`);
    i++;
  }
  const outResolved = resolve(out);
  for (const entry of zip.getEntries()) {
    const target = resolve(out, entry.entryName);
    if (target !== outResolved && !target.startsWith(outResolved + sep)) {
      throw new Error(`Unsafe path in archive: ${entry.entryName}`);
    }
  }
  await mkdir(out, { recursive: true });
  zip.extractAllTo(out, false);
  return out;
}

// src/cli/index.ts
var HELP = `QuickFile \u2014 local file actions

Usage:
  quickfile convert <jpg|png|webp> <files...>
  quickfile resize  <files...> (--width <px> | --percent <n>)
  quickfile compress <files...>
  quickfile clean    <files...>          strip EXIF/GPS metadata
  quickfile hash     <file>              print SHA-256
  quickfile merge    <pdfs...>           -> merged.pdf
  quickfile split    <pdf>               -> one file per page
  quickfile zip      <files...>          -> archive.zip
  quickfile unzip    <archive.zip>

Every action writes NEW files next to the originals. Nothing is uploaded.`;
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const opts = {};
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      opts[args[i].slice(2)] = args[i + 1];
      i++;
    } else {
      rest.push(args[i]);
    }
  }
  const out = (p) => console.log(p);
  switch (cmd) {
    case "convert": {
      const fmt = rest[0];
      if (!["jpg", "png", "webp"].includes(fmt)) throw new Error("format must be jpg, png or webp");
      for (const f of rest.slice(1)) out(await convertImage(f, fmt));
      break;
    }
    case "resize": {
      const width = opts.width ? Number(opts.width) : void 0;
      const percent = opts.percent ? Number(opts.percent) : void 0;
      if (!width && !percent) throw new Error("resize needs --width <px> or --percent <n>");
      for (const f of rest) out(await resizeImage(f, { width, percent }));
      break;
    }
    case "compress":
      for (const f of rest) out(await compressImage(f));
      break;
    case "clean":
      for (const f of rest) out(await removeMetadata(f));
      break;
    case "hash":
      out(await hashFile(rest[0]));
      break;
    case "merge":
      out(await mergePdfs(rest));
      break;
    case "split":
      for (const p of await splitPdf(rest[0])) out(p);
      break;
    case "zip":
      out(await zipFiles(rest));
      break;
    case "unzip":
      out(await unzip(rest[0]));
      break;
    default:
      console.log(HELP);
      if (cmd && cmd !== "help" && cmd !== "--help") process.exitCode = 1;
  }
}
main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
