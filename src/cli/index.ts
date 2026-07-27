#!/usr/bin/env node
// QuickFile CLI — the same local file actions, scriptable. Non-destructive.
import {
  convertImage,
  resizeImage,
  compressImage,
  removeMetadata,
  hashFile,
  mergePdfs,
  splitPdf,
  zipFiles,
  unzip,
} from '../main/ops'
import type { ImageFormat } from '../shared/types'

const HELP = `QuickFile — local file actions

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

Every action writes NEW files next to the originals. Nothing is uploaded.`

async function main(): Promise<void> {
  const [cmd, ...args] = process.argv.slice(2)

  const opts: Record<string, string> = {}
  const rest: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      opts[args[i].slice(2)] = args[i + 1]
      i++
    } else {
      rest.push(args[i])
    }
  }

  const out = (p: string): void => console.log(p)

  switch (cmd) {
    case 'convert': {
      const fmt = rest[0] as ImageFormat
      if (!['jpg', 'png', 'webp'].includes(fmt)) throw new Error('format must be jpg, png or webp')
      for (const f of rest.slice(1)) out(await convertImage(f, fmt))
      break
    }
    case 'resize': {
      const width = opts.width ? Number(opts.width) : undefined
      const percent = opts.percent ? Number(opts.percent) : undefined
      if (!width && !percent) throw new Error('resize needs --width <px> or --percent <n>')
      for (const f of rest) out(await resizeImage(f, { width, percent }))
      break
    }
    case 'compress':
      for (const f of rest) out(await compressImage(f))
      break
    case 'clean':
      for (const f of rest) out(await removeMetadata(f))
      break
    case 'hash':
      out(await hashFile(rest[0]))
      break
    case 'merge':
      out(await mergePdfs(rest))
      break
    case 'split':
      for (const p of await splitPdf(rest[0])) out(p)
      break
    case 'zip':
      out(await zipFiles(rest))
      break
    case 'unzip':
      out(await unzip(rest[0]))
      break
    default:
      console.log(HELP)
      if (cmd && cmd !== 'help' && cmd !== '--help') process.exitCode = 1
  }
}

main().catch((e) => {
  console.error('Error:', e instanceof Error ? e.message : String(e))
  process.exitCode = 1
})
