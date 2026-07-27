export type ImageFormat = 'jpg' | 'png' | 'webp'

export interface RenameRule {
  find?: string
  replace?: string
  prefix?: string
  suffix?: string
  sequence?: boolean
  startAt?: number
}

export interface RenamePlanItem {
  from: string
  to: string
}

export interface OpResult {
  ok: boolean
  input: string
  output?: string
  error?: string
}

export interface QuickFileApi {
  convert(files: string[], to: ImageFormat): Promise<OpResult[]>
  resize(files: string[], opts: { width?: number; percent?: number }): Promise<OpResult[]>
  compress(files: string[]): Promise<OpResult[]>
  removeMetadata(files: string[]): Promise<OpResult[]>
  mergePdf(files: string[]): Promise<OpResult[]>
  splitPdf(file: string): Promise<OpResult[]>
  hash(file: string): Promise<string>

  copyText(text: string): Promise<void>
  reveal(path: string): Promise<void>
  pickFiles(): Promise<string[]>
  /** Resolve a dropped File to its absolute path (Electron webUtils). */
  getFilePath(file: File): string

  planRename(files: string[], rule: RenameRule): Promise<RenamePlanItem[]>
  applyRename(plan: RenamePlanItem[]): Promise<OpResult[]>

  /** Files passed to the app via "Open with" / drag-onto-icon. */
  onOpenFiles(cb: (files: string[]) => void): () => void
}

declare global {
  interface Window {
    quickfile: QuickFileApi
  }
}
