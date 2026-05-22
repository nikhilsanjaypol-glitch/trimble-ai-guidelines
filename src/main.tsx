import React from 'react'
import ReactDOM from 'react-dom/client'
import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react'
import App from './App.tsx'
import './index.css'

// Force light mode app-wide. Pinning `preferred-mode` in localStorage
// also prevents Modus's system-theme watcher from flipping to dark
// when the user's OS appearance changes.
localStorage.setItem('preferred-mode', 'light')
localStorage.setItem(
  'modus-theme-config',
  JSON.stringify({ mode: 'light', theme: 'modus-modern' }),
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModusWcThemeProvider initialTheme={{ mode: 'light', theme: 'modus-modern' }}>
      <App />
    </ModusWcThemeProvider>
  </React.StrictMode>,
)
