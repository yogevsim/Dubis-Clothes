import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupLogger } from './utils/logger'
import './index.css'
import App from './App.tsx'

setupLogger()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
