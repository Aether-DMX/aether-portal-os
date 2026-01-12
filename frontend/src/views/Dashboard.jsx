import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, X, Check, Plus, ArrowLeft, Play, Pause, SkipBack, SkipForward, Square } from 'lucide-react';
import useNodeStore from '../store/nodeStore';
import useSceneStore from '../store/sceneStore';
import useDMXStore from '../store/dmxStore';
import usePlaybackStore from '../store/playbackStore';
import FadeProgressBar from '../components/common/FadeProgressBar';

// Custom node icons
import NodeIcon from '../assets/icons/Node_Icon.png';
import WiredNodeIcon from '../assets/icons/Wired_Node.png';
import scenesIcon from '../assets/icons/Scenes_Icon.png';

// Zone icons as SVG paths
const zoneIcons = {
  bar: 'M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM5.66 5h12.68l-1.78 2H7.43L5.66 5z',
  stage: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  dining: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
  dj: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
  patio: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
  entry: 'M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-8-6H9v-2h2v2z',
  vip: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  restroom: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  default: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
};

// Scene emoji icons
const sceneEmojis = ['🌅', '🍸', '🔥', '🌙', '✨', '🎉', '💜', '🌊'];

// Sortable Zone Component - Unified PULSE card design
function SortableZone({ node, brightness, getNodeIcon, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.node_id || node.id });

  const isOnline = node.status === 'online';
  const statusColor = isOnline ? '#22c55e' : '#eab308'; // green or yellow

  // Get display name - extract MAC suffix (last 4 chars) from node_id or mac
  // node_id format: "pulse-422C" or "universe-1-builtin"
  const getDisplayName = () => {
    // For built-in wired node
    if (node.is_builtin || node.type === 'hardwired') {
      return 'WIRED';
    }
    // Extract from node_id (e.g., "pulse-422C" -> "422C")
    if (node.node_id && node.node_id.includes('-')) {
      const suffix = node.node_id.split('-').pop();
      if (suffix && suffix.length <= 5) return suffix.toUpperCase();
    }
    // Fallback to MAC suffix
    if (node.mac && node.mac !== 'UART') {
      return node.mac.slice(-5).replace(':', '').toUpperCase();
    }
    return 'NODE';
  };

  const displayName = getDisplayName();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="pulse-card"
    >
      {/* Outer status border - hugs the card */}
      <div style={{
        padding: 2,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${statusColor}, ${statusColor}88)`,
      }}>
        {/* Inner card */}
        <div style={{
          background: 'rgba(20, 20, 30, 0.95)',
          borderRadius: 10,
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          minWidth: 60,
        }}>
          {/* PULSE label at top */}
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            PULSE
          </span>

          {/* Node icon in center */}
          <img
            src={getNodeIcon(node.type)}
            alt=""
            style={{
              width: 28,
              height: 28,
              filter: 'brightness(0) invert(1)',
              opacity: 0.9,
            }}
          />

          {/* Name/MAC at bottom */}
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            textAlign: 'center',
          }}>
            {displayName}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickSceneEditor({ scenes, selectedIds, onSave, onClose }) {
  const [selected, setSelected] = useState(selectedIds || []);
  const toggleScene = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
    }
  };
  return ReactDOM.createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0a0a0f", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onClose} style={{ padding: 8, background: "rgba(255,255,255,0.1)", borderRadius: 8, border: "none", cursor: "pointer" }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        <span style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Quick Scenes</span>
        <span style={{ color: "var(--accent)", fontSize: 12, fontWeight: "bold" }}>{selected.length}/4</span>
      </div>
      <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.03)" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>Tap to select up to 4 scenes for your dashboard</p>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {scenes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>No scenes created yet</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {scenes.map((scene, idx) => {
              const id = scene.scene_id || scene.id;
              const isSelected = selected.includes(id);
              const selectIndex = selected.indexOf(id);
              const canSelect = selected.length < 4 || isSelected;
              return (
                <button key={id} onClick={() => toggleScene(id)} style={{
                  padding: 10, borderRadius: 12,
                  border: isSelected ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.1)",
                  background: isSelected ? "rgba(0,255,170,0.15)" : "rgba(255,255,255,0.05)",
                  cursor: canSelect ? "pointer" : "not-allowed", opacity: canSelect ? 1 : 0.4,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative",
                }}>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", color: "#000", fontSize: 10, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectIndex + 1}
                    </div>
                  )}
                  <img src={scenesIcon} alt="" style={{ width: 20, height: 20, filter: "brightness(0) invert(1)", display: "block", margin: "0 auto" }} />
                  <span style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                    {scene.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => { onSave(selected); onClose(); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "var(--accent)", color: "#000", fontSize: 14, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Check size={16} /> Save
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { nodes } = useNodeStore();
  const { scenes, currentScene, playScene } = useSceneStore();
  const { universes, setChannels, initSocket, configuredUniverses } = useDMXStore();
  const { playback, syncStatus, stopAll } = usePlaybackStore();

  const [masterValue, setMasterValue] = useState(100);
  const [zoneOrder, setZoneOrder] = useState([]);
  const [showSceneEditor, setShowSceneEditor] = useState(false);
  const [quickSceneIds, setQuickSceneIds] = useState([]);
  const masterTrackRef = useRef(null);
  const isDragging = useRef(false);

  // Responsive: track window width
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  // Sensors for drag and drop (with delay to allow clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Initialize DMX polling on mount
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // Sync playback status
  useEffect(() => {
    syncStatus();
    const interval = setInterval(syncStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load quick scene IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickSceneIds');
    if (saved) {
      try {
        setQuickSceneIds(JSON.parse(saved));
      } catch (e) {
        setQuickSceneIds([]);
      }
    }
  }, []);

  // Get quick scenes based on saved IDs or fall back to first 4
  const quickScenes = useMemo(() => {
    if (quickSceneIds.length > 0) {
      return quickSceneIds
        .map(id => scenes.find(s => (s.scene_id || s.id) === id))
        .filter(Boolean);
    }
    return scenes.slice(0, 4);
  }, [scenes, quickSceneIds]);

  const saveQuickScenes = (ids) => {
    setQuickSceneIds(ids);
    localStorage.setItem('quickSceneIds', JSON.stringify(ids));
  };

  // Filter to only show paired nodes (is_paired = 1 or is_builtin = 1)
  const configuredNodes = useMemo(() => {
    return nodes.filter(n => n.is_paired || n.is_builtin);
  }, [nodes]);

  // Load zone order from localStorage or use default order
  useEffect(() => {
    const savedOrder = localStorage.getItem('zoneOrder');
    if (savedOrder) {
      try {
        setZoneOrder(JSON.parse(savedOrder));
      } catch (e) {
        setZoneOrder(configuredNodes.map(n => n.node_id || n.id));
      }
    } else {
      setZoneOrder(configuredNodes.map(n => n.node_id || n.id));
    }
  }, [configuredNodes]);

  // Sort nodes by saved order
  const sortedNodes = useMemo(() => {
    if (zoneOrder.length === 0) return configuredNodes;
    return [...configuredNodes].sort((a, b) => {
      const aId = a.node_id || a.id;
      const bId = b.node_id || b.id;
      const aIndex = zoneOrder.indexOf(aId);
      const bIndex = zoneOrder.indexOf(bId);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [configuredNodes, zoneOrder]);

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sortedNodes.findIndex(n => (n.node_id || n.id) === active.id);
      const newIndex = sortedNodes.findIndex(n => (n.node_id || n.id) === over.id);
      const newOrder = arrayMove(sortedNodes.map(n => n.node_id || n.id), oldIndex, newIndex);
      setZoneOrder(newOrder);
      localStorage.setItem('zoneOrder', JSON.stringify(newOrder));
    }
  };

  // Calculate zone brightness from actual DMX state
  const getZoneBrightness = (node) => {
    const universe = node.universe || 1;
    const universeState = universes[universe] || [];
    const startCh = node.channel_start || node.channelStart || 1;
    const endCh = node.channel_end || node.channelEnd || 512;

    let sum = 0;
    let count = 0;
    for (let i = startCh - 1; i < Math.min(endCh, universeState.length); i++) {
      sum += universeState[i] || 0;
      count++;
    }

    if (count === 0) return 0;
    return Math.round((sum / count / 255) * 100);
  };

  const getNodeIcon = (nodeType) => {
    return nodeType === 'hardwired' ? WiredNodeIcon : NodeIcon;
  };

  // Master fader API call
  const applyMaster = async (level, capture = false) => {
    try { await axios.post(getAetherCore() + "/api/dmx/master", { level, capture }); } catch(e) {}
  };

  const handleMasterDrag = (e) => {
    if (!masterTrackRef.current) return;
    const rect = masterTrackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round(pct);
    setMasterValue(newValue);
    applyMaster(newValue);
  };

  const handleMasterStart = (e) => {
    isDragging.current = true;
    applyMaster(masterValue, true);
    handleMasterDrag(e);
  };

  const handleMasterMove = (e) => {
    if (isDragging.current) handleMasterDrag(e);
  };

  const handleMasterEnd = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMasterMove);
    document.addEventListener('mouseup', handleMasterEnd);
    document.addEventListener('touchmove', handleMasterMove, { passive: true });
    document.addEventListener('touchend', handleMasterEnd);

    return () => {
      document.removeEventListener('mousemove', handleMasterMove);
      document.removeEventListener('mouseup', handleMasterEnd);
      document.removeEventListener('touchmove', handleMasterMove);
      document.removeEventListener('touchend', handleMasterEnd);
    };
  }, []);

  const handleSceneClick = (scene) => {
    playScene(scene.scene_id || scene.id, 1000);
    // Reset master to 100 when playing a scene
    // Clear master base state so next drag captures fresh
    axios.post(getAetherCore() + "/api/dmx/master/reset").catch(() => {});
    setMasterValue(100);
  };

  const handleZoneClick = (node) => {
    navigate(`/zone/${node.node_id || node.id}`);
  };

  // Memoize zone brightnesses
  const zoneBrightnesses = useMemo(() => {
    const brightnesses = {};
    configuredNodes.forEach(node => {
      brightnesses[node.node_id || node.id] = getZoneBrightness(node);
    });
    return brightnesses;
  }, [configuredNodes, universes]);

  // For kiosk mode, use the original CSS-based layout
  // For desktop, use a proper side-by-side layout
  if (!isDesktop) {
    // KIOSK MODE - Original layout that works on touchscreen
    return (
      <div className="launcher-main">
        {/* Zones Grid - uses CSS class for proper kiosk layout */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedNodes.map(n => n.node_id || n.id)} strategy={rectSortingStrategy}>
            <div className="zones-grid">
              {sortedNodes.map((node) => (
                <SortableZone
                  key={node.node_id || node.id}
                  node={node}
                  brightness={zoneBrightnesses[node.node_id || node.id] || 0}
                  getNodeIcon={getNodeIcon}
                  onClick={() => handleZoneClick(node)}
                />
              ))}
              {sortedNodes.length === 0 && (
                <div className="zone-icon" onClick={() => navigate('/nodes')}
                  style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                  <span className="zone-name">No zones configured. Tap to add nodes.</span>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Right Controls Panel - uses CSS class */}
        <div className="dashboard-right">
          {/* Master Slider */}
          <div className="master-row">
            <span className="master-label">MASTER</span>
            <div ref={masterTrackRef} className="master-track" style={{ width: "80%" }}
              onMouseDown={handleMasterStart} onTouchStart={handleMasterStart}>
              <div className="master-fill" style={{ width: `${masterValue}%` }}>
                <span className="master-value">{masterValue}%</span>
              </div>
            </div>
          </div>

          {/* Quick Scenes */}
          <div className="quick-scenes">
            <div className="widget-header">
              <span className="widget-title">Quick Scenes</span>
              <button onClick={() => setShowSceneEditor(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <Settings size={14} className="text-white/60" />
              </button>
            </div>
            <div className="scenes-row">
              {quickScenes.length > 0 ? (
                quickScenes.map((scene, idx) => (
                  <button key={scene.scene_id || scene.id || idx}
                    className={`scene-btn ${currentScene?.scene_id === (scene.scene_id || scene.id) ? 'active' : ''}`}
                    onClick={() => handleSceneClick(scene)}>
                    <span className="scene-name">{scene.name}</span>
                  </button>
                ))
              ) : (
                <button className="scene-btn" onClick={() => setShowSceneEditor(true)}>
                  <span className="scene-icon"><Plus size={20} /></span>
                  <span className="scene-name">Add Scenes</span>
                </button>
              )}
              {quickScenes.length > 0 && quickScenes.length < 4 && (
                <button className="scene-btn opacity-50" onClick={() => setShowSceneEditor(true)}>
                  <span className="scene-icon"><Plus size={20} /></span>
                  <span className="scene-name">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Now Playing */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, position: 'absolute', left: 0 }}>Now Playing</span>
              {Object.keys(playback).length > 0 ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'playing-pulse 1.5s ease-in-out infinite' }} />
                  {(() => {
                    const item = Object.values(playback)[0];
                    if (!item) return 'Unknown';
                    if (item.name) return item.name;
                    if (item.id) return item.id.replace("scene_", "").replace("chase_", "").replace(/_/g, " ");
                    return 'Unknown';
                  })()}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Nothing playing</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button onClick={() => navigate('/scenes')} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SkipBack size={16} />
              </button>
              <button onClick={() => { if (Object.keys(playback).length > 0) { stopAll(); } else { navigate('/scenes'); } }} style={{ width: 36, height: 36, borderRadius: 8, background: Object.keys(playback).length > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)', border: 'none', color: Object.keys(playback).length > 0 ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Object.keys(playback).length > 0 ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={() => stopAll()} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Square size={16} />
              </button>
              <button onClick={() => navigate('/chases')} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Scene Editor Modal */}
        {showSceneEditor && (
          <QuickSceneEditor
            scenes={scenes}
            selectedIds={quickSceneIds}
            onSave={saveQuickScenes}
            onClose={() => setShowSceneEditor(false)}
          />
        )}
      </div>
    );
  }

  // DESKTOP MODE - Side-by-side layout optimized for larger screens
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 24,
        padding: 24,
        height: '100%',
        background: '#0a0a0f',
      }}
    >
      {/* Left - Zones Grid */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedNodes.map(n => n.node_id || n.id)} strategy={rectSortingStrategy}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: windowWidth >= 1440 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
                gap: 16,
              }}
            >
              {sortedNodes.map((node) => (
                <SortableZone
                  key={node.node_id || node.id}
                  node={node}
                  brightness={zoneBrightnesses[node.node_id || node.id] || 0}
                  getNodeIcon={getNodeIcon}
                  onClick={() => handleZoneClick(node)}
                />
              ))}
              {sortedNodes.length === 0 && (
                <div onClick={() => navigate('/nodes')}
                  style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  No zones configured. Click to add nodes.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Right - Controls Panel */}
      <div
        style={{
          width: windowWidth >= 1440 ? 420 : 360,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Master Slider */}
        <div className="master-row">
          <span className="master-label">MASTER</span>
          <div ref={masterTrackRef} className="master-track" style={{ width: "80%" }} 
            onMouseDown={handleMasterStart} onTouchStart={handleMasterStart}>
            <div className="master-fill" style={{ width: `${masterValue}%` }}>
              <span className="master-value">{masterValue}%</span>
            </div>
          </div>
        </div>

        {/* Quick Scenes */}
        <div className="quick-scenes">
          <div className="widget-header">
            <span className="widget-title">Quick Scenes</span>
            <button onClick={() => setShowSceneEditor(true)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Settings size={14} className="text-white/60" />
            </button>
          </div>
          <div className="scenes-row">
            {quickScenes.length > 0 ? (
              quickScenes.map((scene, idx) => (
                <button key={scene.scene_id || scene.id || idx}
                  className={`scene-btn ${currentScene?.scene_id === (scene.scene_id || scene.id) ? 'active' : ''}`}
                  onClick={() => handleSceneClick(scene)}>
                  <span className="scene-name">{scene.name}</span>
                </button>
              ))
            ) : (
              <button className="scene-btn" onClick={() => setShowSceneEditor(true)}>
                <span className="scene-icon"><Plus size={20} /></span>
                <span className="scene-name">Add Scenes</span>
              </button>
            )}
            {quickScenes.length > 0 && quickScenes.length < 4 && (
              <button className="scene-btn opacity-50" onClick={() => setShowSceneEditor(true)}>
                <span className="scene-icon"><Plus size={20} /></span>
                <span className="scene-name">Add</span>
              </button>
            )}
          </div>
        </div>
        {/* Fade Progress Bar - shows during transitions */}
        <FadeProgressBar isDesktop={true} />

        {/* Now Playing */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, position: 'absolute', left: 0 }}>Now Playing</span>
            {Object.keys(playback).length > 0 ? (
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: 'playing-pulse 1.5s ease-in-out infinite' }} />
                {(() => {
                  const item = Object.values(playback)[0];
                  if (!item) return 'Unknown';
                  if (item.name) return item.name;
                  if (item.id) return item.id.replace("scene_", "").replace("chase_", "").replace(/_/g, " ");
                  return 'Unknown';
                })()}
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Nothing playing</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={() => navigate('/scenes')} className="hover:bg-white/20 transition-colors" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SkipBack size={18} />
            </button>
            <button onClick={() => { if (Object.keys(playback).length > 0) { stopAll(); } else { navigate('/scenes'); } }} className="hover:brightness-110 transition-all" style={{ width: 44, height: 44, borderRadius: 10, background: Object.keys(playback).length > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)', border: 'none', color: Object.keys(playback).length > 0 ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Object.keys(playback).length > 0 ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => stopAll()} className="hover:bg-red-500/30 transition-colors" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Square size={18} />
            </button>
            <button onClick={() => navigate('/chases')} className="hover:bg-white/20 transition-colors" style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Scene Editor Modal */}
      {showSceneEditor && (
        <QuickSceneEditor
          scenes={scenes}
          selectedIds={quickSceneIds}
          onSave={saveQuickScenes}
          onClose={() => setShowSceneEditor(false)}
        />
      )}
    </div>
  );
}
