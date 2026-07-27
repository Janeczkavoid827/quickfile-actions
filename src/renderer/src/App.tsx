import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { LANGUAGES, applyDir } from './i18n'
import type { ImageFormat, OpResult, RenamePlanItem } from '../../shared/types'

const qf = window.quickfile

const base = (p: string): string => p.split(/[\\/]/).pop() || p
const extOf = (p: string): string => {
  const b = base(p)
  const i = b.lastIndexOf('.')
  return i >= 0 ? b.slice(i + 1).toLowerCase() : ''
}
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'tiff', 'bmp', 'avif'])

export default function App() {
  const { t } = useTranslation()
  const [files, setFiles] = useState<string[]>([])
  const [results, setResults] = useState<OpResult[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [customWidth, setCustomWidth] = useState('')

  useEffect(() => qf.onOpenFiles((f) => addFiles(f)), [])

  const addFiles = useCallback((incoming: string[]) => {
    setFiles((prev) => Array.from(new Set([...prev, ...incoming])))
    setResults([])
  }, [])

  const hasImages = useMemo(() => files.some((f) => IMAGE_EXTS.has(extOf(f))), [files])
  const pdfFiles = useMemo(() => files.filter((f) => extOf(f) === 'pdf'), [files])
  const zipFile = useMemo(() => files.find((f) => extOf(f) === 'zip'), [files])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const paths = Array.from(e.dataTransfer.files)
      .map((f) => qf.getFilePath(f))
      .filter(Boolean)
    if (paths.length) addFiles(paths)
  }

  const run = async (label: string, fn: () => Promise<OpResult[]>) => {
    setBusy(true)
    setStatus(t('working'))
    try {
      const res = await fn()
      setResults(res)
      const ok = res.filter((r) => r.ok).length
      setStatus(`${label}: ${ok}/${res.length} ${t('done')}`)
    } finally {
      setBusy(false)
    }
  }

  const changeLang = (code: string) => {
    void i18n.changeLanguage(code)
    applyDir(code)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col px-5 pb-6">
      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <div>
          <span className="text-xl font-bold tracking-tight">
            Quick<span className="text-[var(--color-accent)]">File</span>
          </span>
          <p className="mt-0.5 text-sm text-[var(--color-ink-dim)]">{t('tagline')}</p>
        </div>
        <select
          aria-label="Language"
          value={i18n.language}
          onChange={(e) => changeLang(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </header>

      {files.length === 0 ? (
        <main
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-line)]'
          }`}
        >
          <div className="text-5xl" aria-hidden>
            📂
          </div>
          <p className="mt-4 text-lg">{t('drop')}</p>
          <button
            onClick={() => qf.pickFiles().then((f) => f.length && addFiles(f))}
            className="mt-3 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            {t('choose')}
          </button>
        </main>
      ) : (
        <main
          className="flex-1"
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {/* file list */}
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-sm text-[var(--color-ink-dim)]">
              {t('filesCount', { n: files.length })}
            </span>
            <button
              onClick={() => {
                setFiles([])
                setResults([])
                setStatus('')
              }}
              className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
            >
              {t('clear')}
            </button>
          </div>
          <ul className="mb-5 max-h-40 overflow-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            {files.map((f) => (
              <li
                key={f}
                className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-3 py-1.5 text-sm last:border-0"
              >
                <span className="truncate">{base(f)}</span>
                <button
                  aria-label="remove"
                  onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                  className="text-[var(--color-ink-faint)] hover:text-[var(--color-bad)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {/* actions */}
          <div className="space-y-3">
            {hasImages && (
              <ActionRow label={t('convert')}>
                {(['jpg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
                  <Btn key={fmt} disabled={busy} onClick={() => run('Convert', () => qf.convert(files, fmt))}>
                    {fmt.toUpperCase()}
                  </Btn>
                ))}
              </ActionRow>
            )}
            {hasImages && (
              <ActionRow label={t('resize')}>
                <Btn disabled={busy} onClick={() => run('Resize', () => qf.resize(files, { percent: 50 }))}>
                  50%
                </Btn>
                <Btn disabled={busy} onClick={() => run('Resize', () => qf.resize(files, { width: 1920 }))}>
                  1920px
                </Btn>
                <input
                  aria-label={t('custom')}
                  placeholder={t('custom')}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value.replace(/\D/g, ''))}
                  className="w-32 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                />
                <Btn
                  disabled={busy || !customWidth}
                  onClick={() => run('Resize', () => qf.resize(files, { width: Number(customWidth) }))}
                >
                  {t('resize')}
                </Btn>
              </ActionRow>
            )}
            {hasImages && (
              <ActionRow label="">
                <Btn disabled={busy} onClick={() => run('Compress', () => qf.compress(files))}>
                  {t('compress')}
                </Btn>
                <Btn disabled={busy} onClick={() => run('Clean', () => qf.removeMetadata(files))}>
                  🔒 {t('cleanMeta')}
                </Btn>
              </ActionRow>
            )}
            {pdfFiles.length > 0 && (
              <ActionRow label={t('pdf')}>
                <Btn
                  disabled={busy || pdfFiles.length < 2}
                  onClick={() => run('Merge', () => qf.mergePdf(pdfFiles))}
                >
                  {t('merge')}
                </Btn>
                <Btn
                  disabled={busy || pdfFiles.length !== 1}
                  onClick={() => run('Split', () => qf.splitPdf(pdfFiles[0]))}
                >
                  {t('split')}
                </Btn>
              </ActionRow>
            )}
            <ActionRow label={t('archive')}>
              <Btn disabled={busy} onClick={() => run('Zip', () => qf.zip(files))}>
                📦 {t('makeZip')}
              </Btn>
              {zipFile && (
                <Btn disabled={busy} onClick={() => run('Extract', () => qf.unzip(zipFile))}>
                  {t('extract')}
                </Btn>
              )}
            </ActionRow>
            <ActionRow label={t('copy')}>
              <Btn disabled={busy} onClick={() => qf.copyText(files.map(base).join('\n'))}>
                {t('name')}
              </Btn>
              <Btn disabled={busy} onClick={() => qf.copyText(files.join('\n'))}>
                {t('path')}
              </Btn>
              <Btn
                disabled={busy || files.length !== 1}
                onClick={async () => qf.copyText(await qf.hash(files[0]))}
              >
                {t('sha')}
              </Btn>
              <Btn disabled={busy} onClick={() => setShowRename((s) => !s)}>
                ✏️ {t('rename')}
              </Btn>
            </ActionRow>
          </div>

          {showRename && <RenamePanel files={files} onDone={() => setFiles([])} />}

          {/* status + results */}
          <p aria-live="polite" className="mt-5 text-sm text-[var(--color-ink-dim)]">
            {status}
          </p>
          {results.length > 0 && (
            <ul className="mt-2 space-y-1" aria-live="polite">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {r.ok ? (
                      <>
                        <span className="text-[var(--color-good)]">✓</span> {base(r.output || '')}
                      </>
                    ) : (
                      <>
                        <span className="text-[var(--color-bad)]">✕</span> {base(r.input)} — {r.error}
                      </>
                    )}
                  </span>
                  {r.ok && r.output && (
                    <button
                      onClick={() => qf.reveal(r.output as string)}
                      className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                    >
                      {t('reveal')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

      <footer className="mt-6 border-t border-[var(--color-line)] pt-3 text-center text-xs text-[var(--color-ink-faint)]">
        {t('nonDestructive')} · {t('footer')}
      </footer>
    </div>
  )
}

function ActionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/40 p-2.5">
      {label && <span className="min-w-24 text-sm font-medium text-[var(--color-ink-dim)]">{label}</span>}
      {children}
    </div>
  )
}

function Btn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-accent)]/50 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function RenamePanel({ files, onDone }: { files: string[]; onDone: () => void }) {
  const { t } = useTranslation()
  const [rule, setRule] = useState({ prefix: '', suffix: '', find: '', replace: '', sequence: false })
  const [plan, setPlan] = useState<RenamePlanItem[]>([])

  useEffect(() => {
    void qf.planRename(files, rule).then(setPlan)
  }, [files, rule])

  const field = (key: keyof typeof rule, label: string) => (
    <label className="flex flex-col text-xs text-[var(--color-ink-dim)]">
      {label}
      <input
        value={rule[key] as string}
        onChange={(e) => setRule((r) => ({ ...r, [key]: e.target.value }))}
        className="mt-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-ink)]"
      />
    </label>
  )

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {field('prefix', t('prefix'))}
        {field('suffix', t('suffix'))}
        {field('find', t('findText'))}
        {field('replace', t('replaceText'))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={rule.sequence}
          onChange={(e) => setRule((r) => ({ ...r, sequence: e.target.checked }))}
        />
        {t('sequence')}
      </label>
      <div className="mt-3 max-h-32 overflow-auto rounded-lg bg-[var(--color-bg)] p-2 font-mono text-xs">
        <div className="mb-1 text-[var(--color-ink-faint)]">{t('previewTitle')}</div>
        {plan.map((p) => (
          <div key={p.from} className="truncate">
            {base(p.from)} → <span className="text-[var(--color-accent)]">{base(p.to)}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => qf.applyRename(plan).then(onDone)}
        className="mt-3 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black"
      >
        {t('apply')}
      </button>
    </div>
  )
}
