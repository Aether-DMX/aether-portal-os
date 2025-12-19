import React from 'react';
import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';
import { SCREEN_SIZES, setScreenSize } from '../config/screenSizes';

const icons = { '5inch': Smartphone, '7inch': Tablet, '10inch': Tablet, 'pc': Laptop };

export default function ScreenSizeSelector() {
  return (
    <div style={{ position:'fixed', inset:0, background:'#0a0a0f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <h1 style={{ color:'#fff', fontSize:24, marginBottom:8 }}>Welcome to AETHER</h1>
      <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:32 }}>Select your display size</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, maxWidth:400 }}>
        {Object.entries(SCREEN_SIZES).map(([key, cfg]) => {
          const Icon = icons[key] || Monitor;
          return (
            <button key={key} onClick={() => setScreenSize(key)}
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:20, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <Icon size={32} color="#a855f7" />
              <span style={{ color:'#fff', fontWeight:600 }}>{cfg.name}</span>
              {cfg.width && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{cfg.width}x{cfg.height}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
