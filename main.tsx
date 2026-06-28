import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Force full dark background — removes white frame on mobile
const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    background: #070e1a !important;
    min-height: 100vh;
    min-height: 100dvh;
    width: 100%;
    overflow-x: hidden;
    -webkit-text-size-adjust: 100%;
  }
  body {
    overscroll-behavior: none;
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
