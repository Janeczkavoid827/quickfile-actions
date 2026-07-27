import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' as const },
  { code: 'he', label: 'עברית', dir: 'rtl' as const },
]

export interface Dict {
  tagline: string
  drop: string
  choose: string
  filesCount: string
  clear: string
  convert: string
  resize: string
  compress: string
  cleanMeta: string
  copy: string
  rename: string
  name: string
  path: string
  sha: string
  run: string
  apply: string
  reveal: string
  done: string
  failed: string
  working: string
  nonDestructive: string
  custom: string
  width: string
  prefix: string
  suffix: string
  findText: string
  replaceText: string
  sequence: string
  previewTitle: string
  footer: string
}

const en: Dict = {
  tagline: 'Right-click any file. Do what you need. No websites, no uploads.',
  drop: 'Drop files here, or',
  choose: 'Choose files',
  filesCount: '{{n}} files',
  clear: 'Clear',
  convert: 'Convert to',
  resize: 'Resize',
  compress: 'Compress',
  cleanMeta: 'Remove metadata',
  copy: 'Copy',
  rename: 'Rename',
  name: 'Name',
  path: 'Path',
  sha: 'SHA-256',
  run: 'Run',
  apply: 'Apply',
  reveal: 'Show in folder',
  done: 'Done',
  failed: 'Failed',
  working: 'Working…',
  nonDestructive: 'Your originals are never changed — a new file is created next to each one.',
  custom: 'Custom width (px)',
  width: 'px',
  prefix: 'Prefix',
  suffix: 'Suffix',
  findText: 'Find',
  replaceText: 'Replace',
  sequence: 'Number them (001, 002…)',
  previewTitle: 'Preview',
  footer: 'Free & open source · 100% local · nothing is uploaded',
}

const he: Dict = {
  tagline: 'לחצו ימני על כל קובץ. עשו מה שצריך. בלי אתרים, בלי העלאות.',
  drop: 'גררו קבצים לכאן, או',
  choose: 'בחרו קבצים',
  filesCount: '{{n}} קבצים',
  clear: 'ניקוי',
  convert: 'המרה ל־',
  resize: 'שינוי גודל',
  compress: 'דחיסה',
  cleanMeta: 'הסרת מטא‑דאטה',
  copy: 'העתקה',
  rename: 'שינוי שם',
  name: 'שם',
  path: 'נתיב',
  sha: 'SHA‑256',
  run: 'הרצה',
  apply: 'החלה',
  reveal: 'הצג בתיקייה',
  done: 'בוצע',
  failed: 'נכשל',
  working: 'עובד…',
  nonDestructive: 'הקבצים המקוריים לעולם לא משתנים — נוצר קובץ חדש ליד כל אחד.',
  custom: 'רוחב מותאם (px)',
  width: 'px',
  prefix: 'קידומת',
  suffix: 'סיומת',
  findText: 'חיפוש',
  replaceText: 'החלפה',
  sequence: 'מספור (001, 002…)',
  previewTitle: 'תצוגה מקדימה',
  footer: 'חינם וקוד פתוח · 100% מקומי · שום דבר לא עולה לרשת',
}

const resources = {
  en: { translation: en },
  he: { translation: he },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function applyDir(lang: string): void {
  const meta = LANGUAGES.find((l) => l.code === lang)
  document.documentElement.dir = meta?.dir ?? 'ltr'
  document.documentElement.lang = lang
}

export default i18n
