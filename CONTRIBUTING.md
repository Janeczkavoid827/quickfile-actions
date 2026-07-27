# Contributing to QuickFile Actions

A local-first, cross-platform file toolkit (Electron + React + TypeScript; image work via sharp).

```bash
npm install
npm run dev    # run
npm test       # test the file-operation engine (src/main/ops.ts)
npm run build  # verify it bundles
```

## Great places to help

- **Translations** — UI strings live in `src/renderer/src/i18n.ts`. Add a language object + a `LANGUAGES` entry; RTL just sets `dir: 'rtl'`.
- **New actions** — add a function to `src/main/ops.ts` (with a test), wire an IPC handler in `src/main/index.ts`, expose it in the preload, and add a button. Every action must be **non-destructive** (write a new file, never overwrite the source).
- **PDF / archive / audio-video actions** — see the roadmap in the README.

## Guidelines

- **Local only.** No network calls, no telemetry.
- Add a test when you add an operation (`npm test` must pass; CI runs it on Windows/macOS/Linux).
- Keep the UI simple and keyboard-accessible.
