import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

if (import.meta.env.DEV) {
  console.log('Starting PromptQuiz (dev)')
}

try {
  const root = createRoot(document.getElementById('root'))
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
} catch (error) {
  console.error('App render failed:', error)
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: ' + error.message + '</div>'
}
