import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import './lib/firebase' // Initialize Firebase before auth pages use getAuth()
import App from './App'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)
