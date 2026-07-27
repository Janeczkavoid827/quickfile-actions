<div align="center">

# QuickFile Actions

### Useful file actions, on your own machine.

**Convert, resize, compress, rename and clean files — locally, on Windows, macOS and Linux. No websites, no uploads.**

Stop dragging private files onto sketchy converter sites. Do it on your computer instead.

![License: MIT](https://img.shields.io/badge/license-MIT-fb7043)
![Platforms](https://img.shields.io/badge/Windows%20%C2%B7%20macOS%20%C2%B7%20Linux-supported-fb7043)
![Local only](https://img.shields.io/badge/local--only-no%20uploads-34d399)

</div>

---

## What it does

Drop files in (or open them with QuickFile) and run a quick action. Everything happens on your device, and your **originals are never changed** — each action writes a new file next to the original.

- **Convert images** — HEIC / PNG / WebP / JPG, both directions.
- **Resize** — 50%, 1920px, or a custom width.
- **Compress** — smaller images, same format.
- **Remove metadata** — strip EXIF/GPS from photos before sharing.
- **Batch rename** — prefix/suffix/find-replace/numbering, with a live preview.
- **PDF** — merge several PDFs into one, or split one into single-page files.
- **ZIP** — zip the selected files, or extract an archive.
- **Copy** — a file's name, full path, or **SHA-256** checksum.

More formats (PDF compression, video/audio conversion, OCR) are on the roadmap.

## Status

Early release (v0.1). The image actions, rename, hash and copy work today and are covered by tests. The polished per-OS right-click submenu is planned — for now you drag files into the window (or use *Open with → QuickFile Actions*).

- **Not signed yet:** installers are unsigned, so Windows SmartScreen / macOS Gatekeeper will warn. QuickFile is open source; verify the download or build it yourself.
  - Windows: *More info → Run anyway.* macOS: right-click → *Open.*

## Install

Download for your OS from [Releases](https://github.com/MalyStern/quickfile-actions/releases): `.exe` (Windows), `.dmg` (macOS — separate Intel and Apple Silicon builds), `.AppImage`/`.deb` (Linux). Each release includes `SHA256SUMS`.

## Build from source

```bash
git clone https://github.com/MalyStern/quickfile-actions
cd quickfile-actions
npm install
npm run dev      # run
npm test         # test the file-operation engine
npm run dist     # build installers into release/
```

Electron + React + TypeScript, image work by [sharp](https://sharp.pixelplumbing.com/) (libvips). The operation engine is `src/main/ops.ts`.

## Command line

The same actions, scriptable:

```bash
quickfile convert jpg *.heic        # HEIC -> JPG
quickfile resize photo.png --width 1920
quickfile clean *.jpg               # strip EXIF/GPS
quickfile merge a.pdf b.pdf         # -> merged.pdf
quickfile zip report.docx data.csv  # -> archive.zip
quickfile hash installer.exe        # print SHA-256
```

Run `quickfile` with no arguments for the full help. (Built from source with `npm run build:cli` → `bin/quickfile.mjs`.)

## FAQ / how-to

**How do I convert HEIC to JPG without uploading it?**
Open QuickFile, drop the `.heic` in, click **Convert → JPG**. A `photo-jpg.jpg` appears next to the original. Nothing is uploaded.

**How do I remove location (GPS/EXIF) data from a photo?**
Drop the photo in and click **Remove metadata**. You get a cleaned copy; the original is untouched.

**How do I batch-resize or rename many images on Windows or macOS?**
Select them all, drop them in, and use **Resize** or **Rename** (rename shows a preview before it touches anything).

**How do I check a file's SHA-256?**
Drop one file in and click **Copy → SHA-256**.

**Is it really local?**
Yes. There's no network code in the file actions — it's all sharp + Node on your machine. Free and open source (MIT).

## License

[MIT](LICENSE) © 2026 MalyStern and QuickFile contributors.

<sub>Keywords: convert HEIC to JPG offline, WebP to PNG local, resize images, compress images, remove EXIF/GPS metadata, batch rename files, file SHA-256, cross-platform file toolkit, open-source PowerToys alternative for files.</sub>
