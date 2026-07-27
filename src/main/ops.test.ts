import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { mkdtemp, rm, stat, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  convertImage,
  resizeImage,
  compressImage,
  removeMetadata,
  hashFile,
  planRename,
  mergePdfs,
  splitPdf,
} from './ops'

// Disable sharp's operation cache so it doesn't keep temp files locked on Windows.
sharp.cache(false)

let dir: string
let png: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'qf-'))
  png = join(dir, 'sample.png')
  await sharp({
    create: { width: 200, height: 120, channels: 3, background: { r: 100, g: 150, b: 200 } },
  })
    .png()
    .toFile(png)
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 })
})

describe('image ops (non-destructive)', () => {
  it('converts png -> jpg into a new file', async () => {
    const out = await convertImage(png, 'jpg')
    expect(out.endsWith('sample-jpg.jpg')).toBe(true)
    expect((await stat(out)).size).toBeGreaterThan(0)
  })

  it('converts to webp', async () => {
    const out = await convertImage(png, 'webp')
    expect((await sharp(out).metadata()).format).toBe('webp')
  })

  it('resizes by percent and by width', async () => {
    expect((await sharp(await resizeImage(png, { percent: 50 })).metadata()).width).toBe(100)
    expect((await sharp(await resizeImage(png, { width: 80 })).metadata()).width).toBe(80)
  })

  it('compresses and strips metadata to valid images', async () => {
    expect((await stat(await compressImage(png))).size).toBeGreaterThan(0)
    const cleaned = await removeMetadata(png)
    expect((await sharp(cleaned).metadata()).exif).toBeUndefined()
  })
})

describe('hash + rename', () => {
  it('hashes deterministically (sha256, 64 hex chars)', async () => {
    const a = await hashFile(png)
    expect(a).toBe(await hashFile(png))
    expect(a).toHaveLength(64)
  })

  it('plans renames without touching disk', () => {
    const plan = planRename(['/x/a.jpg', '/x/b.jpg'], { prefix: 'trip-', sequence: true })
    expect(plan[0].to).toBe(join('/x', 'trip-a-001.jpg'))
    expect(plan[1].to).toBe(join('/x', 'trip-b-002.jpg'))
  })
})

describe('pdf ops', () => {
  it('merges and splits PDFs', async () => {
    const doc = await PDFDocument.create()
    doc.addPage([200, 200])
    doc.addPage([200, 200])
    const pdf = join(dir, 'a.pdf')
    await writeFile(pdf, await doc.save())

    const merged = await mergePdfs([pdf, pdf])
    expect((await PDFDocument.load(await readFile(merged))).getPageCount()).toBe(4)

    const parts = await splitPdf(pdf)
    expect(parts.length).toBe(2)
    expect((await PDFDocument.load(await readFile(parts[0]))).getPageCount()).toBe(1)
  })
})
