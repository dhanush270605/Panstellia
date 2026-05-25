import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initializeEmailJS } from './services/emailjs'

// Initialize EmailJS on app startup (must be called before using EmailJS)
initializeEmailJS()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
