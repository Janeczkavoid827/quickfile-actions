import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { QuickFileApi } from '../shared/types'

const api: QuickFileApi = {
  convert: (files, to) => ipcRenderer.invoke('convert', files, to),
  resize: (files, opts) => ipcRenderer.invoke('resize', files, opts),
  compress: (files) => ipcRenderer.invoke('compress', files),
  removeMetadata: (files) => ipcRenderer.invoke('removeMetadata', files),
  hash: (file) => ipcRenderer.invoke('hash', file),

  copyText: (text) => ipcRenderer.invoke('copyText', text),
  reveal: (path) => ipcRenderer.invoke('reveal', path),
  pickFiles: () => ipcRenderer.invoke('pickFiles'),
  getFilePath: (file: File) => webUtils.getPathForFile(file),

  planRename: (files, rule) => ipcRenderer.invoke('planRename', files, rule),
  applyRename: (plan) => ipcRenderer.invoke('applyRename', plan),

  onOpenFiles: (cb: (files: string[]) => void) => {
    const listener = (_e: unknown, files: string[]) => cb(files)
    ipcRenderer.on('open-files', listener)
    return () => ipcRenderer.removeListener('open-files', listener)
  },
}

contextBridge.exposeInMainWorld('quickfile', api)
