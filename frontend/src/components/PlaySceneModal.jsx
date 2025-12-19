import React, { useState } from "react";
import { X, Play, Zap, Layers } from "lucide-react";
import useNodeStore from "../store/nodeStore";

const PlaySceneModal = ({ scene, onClose, onPlay }) => {
  const { nodes } = useNodeStore();
  const [targetMode, setTargetMode] = useState("all");
  const [selectedUniverses, setSelectedUniverses] = useState([]);
  const [fadeMs, setFadeMs] = useState(1500);
  const universes = [...new Set(nodes.map(n => n.universe))].sort((a,b) => a-b);
  const toggleUniverse = (u) => setSelectedUniverses(p => p.includes(u) ? p.filter(x=>x!==u) : [...p,u]);
  const getNode = (u) => nodes.find(n => n.universe === u);
  const handlePlay = () => {
    const t = targetMode === "all" ? universes : selectedUniverses;
    if (!t.length) { alert("Select a universe"); return; }
    onPlay(scene, { fadeMs, universes: t });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-white/10" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Play Scene</h2>
              <p className="text-white/50 text-sm">{scene?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-2 block">Apply To</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>setTargetMode("all")} className={`p-3 rounded-xl border flex items-center gap-2 justify-center ${targetMode==="all"?"bg-purple-500/20 border-purple-500 text-purple-300":"bg-white/5 border-white/10 text-white/70"}`}>
                <Layers className="w-4 h-4" /> All
              </button>
              <button onClick={()=>setTargetMode("selected")} className={`p-3 rounded-xl border flex items-center gap-2 justify-center ${targetMode==="selected"?"bg-purple-500/20 border-purple-500 text-purple-300":"bg-white/5 border-white/10 text-white/70"}`}>
                <Zap className="w-4 h-4" /> Select
              </button>
            </div>
          </div>
          {targetMode==="selected" && <div className="space-y-2">{universes.map(u=>{const n=getNode(u),s=selectedUniverses.includes(u);return(
            <button key={u} onClick={()=>toggleUniverse(u)} className={`w-full p-3 rounded-xl border flex items-center justify-between ${s?"bg-blue-500/20 border-blue-500":"bg-white/5 border-white/10"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${s?"bg-blue-500 text-white":"bg-white/10 text-white/50"}`}>{u}</div>
                <span className="text-white text-sm">{n?.name||`U${u}`}</span>
              </div>
            </button>
          );})}</div>}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Fade</label>
            <div className="flex gap-2">
              {[0,500,1000,1500,2000,3000].map(ms=>(
                <button key={ms} onClick={()=>setFadeMs(ms)} className={`flex-1 py-2 rounded-lg text-sm ${fadeMs===ms?"bg-white/20 text-white":"bg-white/5 text-white/50"}`}>
                  {ms===0?"Snap":`${ms/1000}s`}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium">Cancel</button>
          <button onClick={handlePlay} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium flex items-center justify-center gap-2">
            <Play className="w-5 h-5" /> Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaySceneModal;
