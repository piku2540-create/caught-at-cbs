import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CaughtAtCBSApp from './CaughtAtCBSApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CaughtAtCBSApp />
  </StrictMode>,
)
