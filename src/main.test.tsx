import React from 'react'
import ReactDOM from 'react-dom/client'
import TestConnection from './App.test'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestConnection />
  </React.StrictMode>,
)