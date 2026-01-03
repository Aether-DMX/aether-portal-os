import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('[BOOT] main.jsx executing');
console.log('[BOOT] document.body.style.background:', document.body.style.background);
console.log('[BOOT] root element:', document.getElementById('root'));

// Force black immediately before React renders anything
document.documentElement.style.background = '#000';
document.body.style.background = '#000';
document.getElementById('root').style.background = '#000';

console.log('[BOOT] Forced black backgrounds');
console.log('[BOOT] Creating React root...');

const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('[BOOT] Rendering App...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[BOOT] render() called');
