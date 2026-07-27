// Local file operations. Pure Node — usable from the Electron main process and a
// CLI. Every operation is non-destructive: it writes a NEW file next to the
// original (e.g. photo.heic -> photo-jpg.jpg) and never overwrites the source.

import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import type { ImageFormat, RenameRule, RenamePlanItem } from '../shared/types'

function outPath(input: string, suffix: string, ext: string): string {
  return join(dirname(input), `${basename(input, extname(input))}-${suffix}.${ext}`)
}

const normExt = (input: string): string => {
  const e = extname(input).slice(1).toLowerCase()
  return e === 'jpeg' ? 'jpg' : e
}

/** Convert an image to jpg / png / webp. */
export async function convertImage(input: string, to: ImageFormat): Promise<string> {
  const out = outPath(input, to, to)
  const img = sharp(input)
  if (to === 'jpg') await img.jpeg({ quality: 90 }).toFile(out)
  else if (to === 'png') await img.png().toFile(out)
  else await img.webp({ quality: 90 }).toFile(out)
  return out
}

/** Resize by target width (px) or by percent of the original width. */
export async function resizeImage(
  input: string,
  opts: { width?: number; percent?: number },
): Promise<string> {
  let width = opts.width
  if (opts.percent) {
    const meta = await sharp(input).metadata()
    if (meta.width) width = Math.max(1, Math.round((meta.width * opts.percent) / 100))
  }
  const out = outPath(input, 'resized', normExt(input) || 'jpg')
  await sharp(input).resize({ width, withoutEnlargement: true }).toFile(out)
  return out
}

/** Re-encode smaller. Keeps the format. */
export async function compressImage(input: string): Promise<string> {
  const ext = normExt(input) || 'jpg'
  const out = outPath(input, 'compressed', ext)
  const img = sharp(input)
  if (ext === 'png') await img.png({ compressionLevel: 9, palette: true }).toFile(out)
  else if (ext === 'webp') await img.webp({ quality: 75 }).toFile(out)
  else await img.jpeg({ quality: 70, mozjpeg: true }).toFile(out)
  return out
}

/** Strip EXIF/GPS and other metadata by re-encoding without it (sharp's default). */
export async function removeMetadata(input: string): Promise<string> {
  const ext = normExt(input) || 'jpg'
  const out = outPath(input, 'clean', ext)
  const img = sharp(input) // no .withMetadata() -> metadata is dropped
  if (ext === 'png') await img.png().toFile(out)
  else if (ext === 'webp') await img.webp({ quality: 92 }).toFile(out)
  else await img.jpeg({ quality: 92 }).toFile(out)
  return out
}

/** Stream a checksum (sha256 by default) without loading the whole file. */
export function hashFile(input: string, algo = 'sha256'): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash(algo)
    const s = createReadStream(input)
    s.on('data', (d) => h.update(d))
    s.on('end', () => resolve(h.digest('hex')))
    s.on('error', reject)
  })
}

/** Compute the new names WITHOUT touching disk, so the UI can preview them. */
export function planRename(files: string[], rule: RenameRule): RenamePlanItem[] {
  let seq = rule.startAt ?? 1
  return files.map((f) => {
    const dir = dirname(f)
    const ext = extname(f)
    let name = basename(f, ext)
    if (rule.find) name = name.split(rule.find).join(rule.replace ?? '')
    if (rule.prefix) name = rule.prefix + name
    if (rule.suffix) name = name + rule.suffix
    if (rule.sequence) {
      name = `${name}-${String(seq).padStart(3, '0')}`
      seq++
    }
    return { from: f, to: join(dir, name + ext) }
  })
}

export async function applyRename(plan: RenamePlanItem[]): Promise<void> {
  for (const item of plan) {
    if (item.from !== item.to) await rename(item.from, item.to)
  }
}

/** Merge several PDFs (in the given order) into one new "merged.pdf". */
export async function mergePdfs(files: string[]): Promise<string> {
  const merged = await PDFDocument.create()
  for (const f of files) {
    const src = await PDFDocument.load(await readFile(f))
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }
  const out = join(dirname(files[0]), 'merged.pdf')
  await writeFile(out, await merged.save())
  return out
}

/** Split a PDF into one file per page (doc-p001.pdf, doc-p002.pdf, …). */
export async function splitPdf(file: string): Promise<string[]> {
  const src = await PDFDocument.load(await readFile(file))
  const dir = dirname(file)
  const name = basename(file, extname(file))
  const outputs: string[] = []
  const count = src.getPageCount()
  for (let i = 0; i < count; i++) {
    const doc = await PDFDocument.create()
    const [page] = await doc.copyPages(src, [i])
    doc.addPage(page)
    const out = join(dir, `${name}-p${String(i + 1).padStart(3, '0')}.pdf`)
    await writeFile(out, await doc.save())
    outputs.push(out)
  }
  return outputs
}
