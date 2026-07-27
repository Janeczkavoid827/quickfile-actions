import { app, BrowserWindow, ipcMain, shell, clipboard, dialog, Menu } from 'electron'
import { join } from 'node:path'
import { existsSync, statSync } from 'node:fs'
import {
  convertImage,
  resizeImage,
  compressImage,
  removeMetadata,
  hashFile,
  planRename,
  applyRename,
} from './ops'
import type { ImageFormat, OpResult, RenameRule, RenamePlanItem } from '../shared/types'

let win: BrowserWindow | null = null
let pendingFiles: string[] = []

/** Pull real file paths out of a process argv (used by "Open with"). */
function filesFromArgv(argv: string[]): string[] {
  return argv.slice(1).filter((a) => {
    if (a.startsWith('-') || a === '.') return false
    try {
      return existsSync(a) && statSync(a).isFile()
    } catch {
      return false
    }
  })
}

function sendOpenFiles(files: string[]): void {
  if (!files.length) return
  if (win) win.webContents.send('open-files', files)
  else pendingFiles.push(...files)
}

async function runBatch(
  files: string[],
  fn: (f: string) => Promise<string>,
): Promise<OpResult[]> {
  return Promise.all(
    files.map(async (input): Promise<OpResult> => {
      try {
        return { ok: true, input, output: await fn(input) }
      } catch (e) {
        return { ok: false, input, error: e instanceof Error ? e.message : String(e) }
      }
    }),
  )
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 980,
    height: 700,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#0f1115',
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false },
  })

  win.on('closed', () => {
    win = null
  })
  win.webContents.on('did-finish-load', () => {
    if (pendingFiles.length) {
      win?.webContents.send('open-files', pendingFiles)
      pendingFiles = []
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))
}

function registerIpc(): void {
  ipcMain.handle('convert', (_e, files: string[], to: ImageFormat) =>
    runBatch(files, (f) => convertImage(f, to)),
  )
  ipcMain.handle('resize', (_e, files: string[], opts: { width?: number; percent?: number }) =>
    runBatch(files, (f) => resizeImage(f, opts)),
  )
  ipcMain.handle('compress', (_e, files: string[]) => runBatch(files, compressImage))
  ipcMain.handle('removeMetadata', (_e, files: string[]) => runBatch(files, removeMetadata))
  ipcMain.handle('hash', (_e, file: string) => hashFile(file))

  ipcMain.handle('copyText', (_e, text: string) => {
    clipboard.writeText(text)
  })
  ipcMain.handle('reveal', (_e, p: string) => {
    shell.showItemInFolder(p)
  })
  ipcMain.handle('pickFiles', async (): Promise<string[]> => {
    const r = await dialog.showOpenDialog(win ?? undefined!, { properties: ['openFile', 'multiSelections'] })
    return r.canceled ? [] : r.filePaths
  })

  ipcMain.handle('planRename', (_e, files: string[], rule: RenameRule) => planRename(files, rule))
  ipcMain.handle('applyRename', (_e, plan: RenamePlanItem[]) =>
    applyRename(plan)
      .then((): OpResult[] => plan.map((p) => ({ ok: true, input: p.from, output: p.to })))
      .catch((e): OpResult[] => [
        { ok: false, input: '', error: e instanceof Error ? e.message : String(e) },
      ]),
  )
}

// macOS "Open with" delivers files through this event.
app.on('open-file', (e, path) => {
  e.preventDefault()
  sendOpenFiles([path])
})

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_e, argv) => {
    sendOpenFiles(filesFromArgv(argv))
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    if (process.platform !== 'darwin') Menu.setApplicationMenu(null)
    pendingFiles = filesFromArgv(process.argv)
    registerIpc()
    createWindow()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
