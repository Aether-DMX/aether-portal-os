import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import axios from 'axios';

const getApi = () => `http://${window.location.hostname}:8891`;
const PAD_COLORS = ['#ff4444','#ff8844','#ffcc00','#44ff44','#44ffff','#4488ff','#aa44ff','#ff44aa','#888888'];

const EFFECT_COLORS = [
  { id: 'current', name: 'Current', rgb: null },
  { id: 'red', name: 'Red', rgb: [255,0,0], hex: '#ff0000' },
  { id: 'green', name: 'Green', rgb: [0,255,0], hex: '#00ff00' },
  { id: 'blue', name: 'Blue', rgb: [0,0,255], hex: '#0000ff' },
  { id: 'white', name: 'White', rgb: [255,255,255], hex: '#ffffff' },
  { id: 'orange', name: 'Orange', rgb: [255,128,0], hex: '#ff8000' },
  { id: 'purple', name: 'Purple', rgb: [128,0,255], hex: '#8000ff' },
];

const EFFECTS = [
  { id: 'strobe', name: 'Strobe', speed: 80 },
  { id: 'pulse', name: 'Pulse', speed: 800 },
  { id: 'heartbeat', name: 'Heartbeat', speed: 150 },
];

const DEFAULT_PADS = Array(9).fill(null).map((_, i) => ({
  id: i, name: `Pad ${i+1}`, type: null, targetId: null, color: PAD_COLORS[i],
  mode: 'trigger', fadeMs: 300, effect: null, effectColor: 'current',
}));

export default function MidiPad() {
  const navigate = useNavigate();
  const { scenes, fetchScenes } = useSceneStore();
  const { chases, fetchChases } = useChaseStore();
  const [pads, setPads] = useState(() => {
    const saved = localStorage.getItem('aether-midi-pads-v5');
    return saved ? JSON.parse(saved) : DEFAULT_PADS;
  });
  const [configuring, setConfiguring] = useState(null);
  const [configStep, setConfigStep] = useState(1);
  const [flashingPad, setFlashingPad] = useState(null);
  const [runningEffects, setRunningEffects] = useState({});
  const savedDMX = useRef(null);
  const effectTimers = useRef({});

  useEffect(() => { fetchScenes(); fetchChases(); }, []);
  useEffect(() => { localStorage.setItem('aether-midi-pads-v5', JSON.stringify(pads)); }, [pads]);

  // Stop an effect
  const stopEffect = (padId) => {
    if (effectTimers.current[padId]) {
      clearInterval(effectTimers.current[padId]);
      delete effectTimers.current[padId];
      setRunningEffects(r => { const n = {...r}; delete n[padId]; return n; });
    }
  };

  // Stop all effects
  const stopAllEffects = () => {
    Object.keys(effectTimers.current).forEach(id => {
      clearInterval(effectTimers.current[id]);
    });
    effectTimers.current = {};
    setRunningEffects({});
  };

  // Run an effect (strobe/pulse/heartbeat)
  const runEffect = async (pad) => {
    // Save current state first
    const res = await axios.get(getApi() + '/api/dmx/universe/1');
    savedDMX.current = res.data.channels;
    
    const colorDef = EFFECT_COLORS.find(c => c.id === pad.effectColor);
    const rgb = colorDef?.rgb;
    let on = true;
    let step = 0;
    
    setRunningEffects(r => ({ ...r, [pad.id]: pad.effect }));

    const setOn = async () => {
      if (rgb) {
        await axios.post(getApi() + '/api/dmx/set', { universe: 1, channels: {1:rgb[0],2:rgb[1],3:rgb[2]}, fade_ms: 0 });
      } else if (savedDMX.current) {
        const ch = {};
        savedDMX.current.forEach((v, i) => { if (v > 0) ch[i + 1] = v; });
        await axios.post(getApi() + '/api/dmx/set', { universe: 1, channels: ch, fade_ms: 0 });
      }
    };
    
    const setOff = async () => {
      await axios.post(getApi() + '/api/dmx/blackout', { fade_ms: 0 });
    };

    if (pad.effect === 'strobe') {
      effectTimers.current[pad.id] = setInterval(async () => {
        if (on) await setOn(); else await setOff();
        on = !on;
      }, 80);
    } else if (pad.effect === 'pulse') {
      effectTimers.current[pad.id] = setInterval(async () => {
        if (on) await setOn(); else await setOff();
        on = !on;
      }, 600);
    } else if (pad.effect === 'heartbeat') {
      const pattern = [1,0,1,0,0,0];
      effectTimers.current[pad.id] = setInterval(async () => {
        if (pattern[step % 6]) await setOn(); else await setOff();
        step++;
      }, 150);
    }
  };

  // Handle pad press - SEPARATED logic for effects vs scenes/chases
  const handlePadDown = async (pad) => {
    if (!pad.type) { setConfiguring(pad.id); setConfigStep(1); return; }
    setFlashingPad(pad.id);

    // EFFECTS have their own logic
    if (pad.type === 'effect') {
      if (pad.mode === 'toggle' && runningEffects[pad.id]) {
        stopEffect(pad.id);
        // Restore saved state
        if (savedDMX.current) {
          const ch = {};
          savedDMX.current.forEach((v, i) => { if (v > 0) ch[i + 1] = v; });
          await axios.post(getApi() + '/api/dmx/set', { universe: 1, channels: ch, fade_ms: 300 });
        }
      } else {
        await runEffect(pad);
      }
      return;
    }

    // SCENES, CHASES, BLACKOUT - just play them
    const fade = pad.fadeMs || 300;
    if (pad.type === 'scene' && pad.targetId) {
      await axios.post(getApi() + '/api/scenes/' + pad.targetId + '/play', { fade_ms: fade });
    } else if (pad.type === 'chase' && pad.targetId) {
      await axios.post(getApi() + '/api/chases/' + pad.targetId + '/play', {});
    } else if (pad.type === 'blackout') {
      await axios.post(getApi() + '/api/dmx/blackout', { fade_ms: fade });
    }
  };

  const handlePadUp = async (pad) => {
    setFlashingPad(null);
    if (pad.type === 'effect' && pad.mode === 'flash' && runningEffects[pad.id]) {
      stopEffect(pad.id);
      if (savedDMX.current) {
        const ch = {};
        savedDMX.current.forEach((v, i) => { if (v > 0) ch[i + 1] = v; });
        await axios.post(getApi() + '/api/dmx/set', { universe: 1, channels: ch, fade_ms: 300 });
      }
    }
  };

  const updatePad = (id, u) => setPads(pads.map(p => p.id === id ? { ...p, ...u } : p));
  const clearPad = (id) => { stopEffect(id); updatePad(id, { type: null, targetId: null, name: 'Pad ' + (id + 1), effect: null, effectColor: 'current' }); setConfigStep(1); };
  const closeConfig = () => { setConfiguring(null); setConfigStep(1); };

  const currentPad = configuring !== null ? pads[configuring] : null;
  const isConfigOpen = configuring !== null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ height: '100vh' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 text-yellow-400 text-xs">
          <AlertTriangle size={14} /><span>WIP</span>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(runningEffects).length > 0 && (
            <button onClick={stopAllEffects} className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-red-400 text-xs">
              <Zap size={12} /> Stop
            </button>
          )}
          <span className="text-white font-bold">MIDI PADS</span>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/10"><X size={18} className="text-white" /></button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Pad Grid */}
        <div className={`flex items-center justify-center p-3 ${isConfigOpen?'w-1/2':'w-full'}`}>
          <div className="grid grid-cols-3 gap-3" style={{width:'300px',height:'300px'}}>
            {pads.map((pad) => {
              const isRunning = runningEffects[pad.id];
              const isSel = configuring===pad.id;
              return (
                <button key={pad.id} onMouseDown={()=>handlePadDown(pad)} onMouseUp={()=>handlePadUp(pad)}
                  onTouchStart={()=>handlePadDown(pad)} onTouchEnd={()=>handlePadUp(pad)}
                  style={{background:pad.type?pad.color:'#1a1a1a'}}
                  className={`rounded-2xl flex flex-col items-center justify-center
                    ${flashingPad===pad.id?'brightness-150':''} ${isSel?'ring-2 ring-white':''}
                    ${isRunning?'ring-2 ring-yellow-400':''}`}>
                  <span className="text-white font-bold">{pad.type?pad.name:'+'}</span>
                  {pad.type&&<span className="text-[9px] text-white/50">{pad.mode}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Config Panel */}
        {isConfigOpen && (
          <div className="w-1/2 bg-[#111] border-l border-white/10 p-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-bold text-lg">Pad {configuring + 1}</span>
              <div className="flex gap-2">
                {configStep > 1 && <button onClick={()=>setConfigStep(s=>s-1)} className="px-2 py-1 bg-white/10 rounded text-white text-sm">Back</button>}
                <button onClick={closeConfig} className="px-3 py-1 bg-white/20 rounded text-white text-sm">Done</button>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              {[1,2,3].map(s=>(<div key={s} className={`flex-1 h-1 rounded ${configStep>=s?'bg-white':'bg-white/20'}`}/>))}
            </div>

            {/* Step 1 */}
            {configStep === 1 && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>{updatePad(configuring,{type:'scene'});setConfigStep(2);}} className="p-3 rounded-xl bg-white/10 text-white font-bold">Scene</button>
                <button onClick={()=>{updatePad(configuring,{type:'chase'});setConfigStep(2);}} className="p-3 rounded-xl bg-white/10 text-white font-bold">Chase</button>
                <button onClick={()=>{updatePad(configuring,{type:'effect'});setConfigStep(2);}} className="p-3 rounded-xl bg-white/10 text-white font-bold">Effect</button>
                <button onClick={()=>{updatePad(configuring,{type:'blackout',name:'OFF'});setConfigStep(3);}} className="p-3 rounded-xl bg-white/10 text-white font-bold">Blackout</button>
              </div>
            )}

            {/* Step 2: Scene */}
            {configStep === 2 && currentPad?.type === 'scene' && (
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {scenes.map(s=>(
                    <button key={s.scene_id} onClick={()=>{updatePad(configuring,{targetId:s.scene_id,name:s.name});setConfigStep(3);}}
                      className={`p-2 rounded text-left text-sm truncate ${currentPad?.targetId===s.scene_id?'bg-white/30':'bg-white/10'} text-white`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Chase */}
            {configStep === 2 && currentPad?.type === 'chase' && (
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {chases.map(c=>(
                    <button key={c.chase_id} onClick={()=>{updatePad(configuring,{targetId:c.chase_id,name:c.name});setConfigStep(3);}}
                      className={`p-2 rounded text-left text-sm truncate ${currentPad?.targetId===c.chase_id?'bg-white/30':'bg-white/10'} text-white`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Effect */}
            {configStep === 2 && currentPad?.type === 'effect' && (
              <div className="flex-1 flex flex-col">
                <div className="text-white/50 text-xs mb-2">EFFECT TYPE</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {EFFECTS.map(e=>(
                    <button key={e.id} onClick={()=>updatePad(configuring,{effect:e.id,name:e.name})}
                      className={`p-3 rounded-xl ${currentPad?.effect===e.id?'bg-purple-500':'bg-white/10'} text-white font-bold`}>{e.name}</button>
                  ))}
                </div>
                <div className="text-white/50 text-xs mb-2">COLOR</div>
                <div className="grid grid-cols-4 gap-2">
                  {EFFECT_COLORS.map(c=>(
                    <button key={c.id} onClick={()=>updatePad(configuring,{effectColor:c.id})}
                      className={`p-2 rounded-lg ${currentPad?.effectColor===c.id?'ring-2 ring-white':''}`}
                      style={{background: c.hex || '#333'}}>
                      <span className={`text-xs ${c.id==='white'?'text-black':'text-white'}`}>{c.name}</span>
                    </button>
                  ))}
                </div>
                {currentPad?.effect && <button onClick={()=>setConfigStep(3)} className="mt-4 py-2 bg-white/20 rounded-lg text-white">Next</button>}
              </div>
            )}

            {/* Step 3: Mode */}
            {configStep === 3 && (
              <div className="flex-1 flex flex-col">
                <div className="text-white/50 text-xs mb-2">MODE</div>
                <div className="flex gap-2 mb-4">
                  {[{m:'trigger',l:'Tap'},{m:'flash',l:'Hold'},{m:'toggle',l:'Toggle'}].map(({m,l})=>(
                    <button key={m} onClick={()=>updatePad(configuring,{mode:m})}
                      className={`flex-1 py-3 rounded-xl font-bold ${currentPad?.mode===m?'bg-purple-500':'bg-white/10'} text-white`}>{l}</button>
                  ))}
                </div>
                <div className="text-white/50 text-xs mb-2">FADE</div>
                <div className="flex gap-2 mb-4">
                  {[{f:0,l:'Snap'},{f:300,l:'0.3s'},{f:1000,l:'1s'}].map(({f,l})=>(
                    <button key={f} onClick={()=>updatePad(configuring,{fadeMs:f})}
                      className={`flex-1 py-2 rounded-lg ${currentPad?.fadeMs===f?'bg-green-500':'bg-white/10'} text-white`}>{l}</button>
                  ))}
                </div>
                <button onClick={()=>clearPad(configuring)} className="mt-auto py-3 rounded-xl bg-red-500/20 text-red-400 font-bold">Clear</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
