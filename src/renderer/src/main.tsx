import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import i18n, { applyDir } from './i18n'
import App from './App'

applyDir(i18n.language)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
