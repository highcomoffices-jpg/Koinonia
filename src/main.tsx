// /home/project/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'  // ← AJOUTER CETTE IMPORTATION
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>  {/* ← AJOUTER CETTE BALISE */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>  {/* ← FERMER LA BALISE */}
  </React.StrictMode>,
)