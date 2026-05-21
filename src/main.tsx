import React from 'react'
import ReactDOM from 'react-dom/client'
import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModusWcThemeProvider>
      <App />
    </ModusWcThemeProvider>
  </React.StrictMode>,
)
