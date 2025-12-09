import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useNodeStore from '../store/nodeStore';
import useSceneStore from '../store/sceneStore';
import useDMXStore from '../store/dmxStore';

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
const sceneEmojis = ['\uD83C\uDF05', '\uD83C\uDF78', '\uD83D\uDD25', '\uD83C\uDF19'];

// Sortable Zone Component
function SortableZone({ node, brightness, getZoneIcon, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.node_id || node.id });

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
      className="zone-icon"
      onClick={onClick}
    >
      <div className={`zone-img ${node.status === 'online' ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24">
          <path d={getZoneIcon(node.name)} />
        </svg>
        <div className="zone-bar">
          <div
            className="zone-bar-fill"
            style={{ width: `${brightness}%` }}
          />
        </div>
      </div>
      <span className="zone-name">{node.name}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { nodes } = useNodeStore();
  const { scenes, currentScene, playScene, getGlobalScenes } = useSceneStore();
  const { universes, setChannels, initSocket, configuredUniverses } = useDMXStore();

  const [masterValue, setMasterValue] = useState(100);
  const [lastMasterValue, setLastMasterValue] = useState(100);
  const [zoneOrder, setZoneOrder] = useState([]);
  const masterTrackRef = useRef(null);
  const isDragging = useRef(false);

  // Sensors for drag and drop (with delay to allow clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Initialize DMX polling on mount
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // Filter to only show configured/paired nodes (nodes with names that aren't default)
  const configuredNodes = useMemo(() => {
    return nodes.filter(n => n.name && n.name !== 'Unknown' && n.name !== 'New Node');
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

  // Get global scenes for quick access (fall back to first 4 if none marked)
  const globalScenes = getGlobalScenes?.() || [];
  const quickScenes = globalScenes.length > 0 ? globalScenes.slice(0, 4) : scenes.slice(0, 4);

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

  const getZoneIcon = (nodeName) => {
    const name = nodeName?.toLowerCase() || '';
    if (name.includes('bar')) return zoneIcons.bar;
    if (name.includes('stage')) return zoneIcons.stage;
    if (name.includes('din')) return zoneIcons.dining;
    if (name.includes('dj')) return zoneIcons.dj;
    if (name.includes('patio') || name.includes('out')) return zoneIcons.patio;
    if (name.includes('entry') || name.includes('door')) return zoneIcons.entry;
    if (name.includes('vip')) return zoneIcons.vip;
    if (name.includes('rest') || name.includes('bath')) return zoneIcons.restroom;
    return zoneIcons.default;
  };

  // Apply master fader to all configured universes
  const applyMasterValue = (newValue) => {
    const scaleFactor = newValue / 100;
    configuredUniverses.forEach(universe => {
      const currentState = universes[universe] || [];
      const scaledChannels = {};
      currentState.forEach((val, idx) => {
        if (val > 0) {
          const newVal = Math.min(255, Math.round(val * scaleFactor));
          scaledChannels[idx + 1] = newVal;
        }
      });
      if (Object.keys(scaledChannels).length > 0) {
        setChannels(universe, scaledChannels, 100);
      }
    });
  };

  const handleMasterDrag = (e) => {
    if (!masterTrackRef.current) return;
    const rect = masterTrackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round(pct);
    setMasterValue(newValue);
  };

  const handleMasterStart = (e) => {
    isDragging.current = true;
    setLastMasterValue(masterValue);
    handleMasterDrag(e);
  };

  const handleMasterMove = (e) => {
    if (isDragging.current) handleMasterDrag(e);
  };

  const handleMasterEnd = () => {
    if (isDragging.current) {
      isDragging.current = false;
      applyMasterValue(masterValue);
      setLastMasterValue(masterValue);
    }
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
  }, [masterValue]);

  const handleSceneClick = (scene) => {
    playScene(scene.scene_id || scene.id, 1000);
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

  return (
    <div className="launcher-main">
      {/* Quick Scenes Widget */}
      <div className="quick-scenes">
        <div className="widget-header">
          <span className="widget-title">Quick Scenes</span>
          <span className="widget-scope">{'\u25CF'} All Zones</span>
        </div>
        <div className="scenes-row">
          {quickScenes.map((scene, idx) => (
            <button
              key={scene.scene_id || scene.id || idx}
              className={`scene-btn ${currentScene?.scene_id === (scene.scene_id || scene.id) ? 'active' : ''}`}
              onClick={() => handleSceneClick(scene)}
            >
              <span className="scene-icon">{sceneEmojis[idx % sceneEmojis.length]}</span>
              <span className="scene-name">{scene.name}</span>
            </button>
          ))}
          {quickScenes.length === 0 && (
            <>
              <button className="scene-btn" onClick={() => navigate('/scenes')}>
                <span className="scene-icon">{'\uD83C\uDF05'}</span>
                <span className="scene-name">Opening</span>
              </button>
              <button className="scene-btn" onClick={() => navigate('/scenes')}>
                <span className="scene-icon">{'\uD83C\uDF78'}</span>
                <span className="scene-name">Happy Hr</span>
              </button>
              <button className="scene-btn" onClick={() => navigate('/scenes')}>
                <span className="scene-icon">{'\uD83D\uDD25'}</span>
                <span className="scene-name">Peak</span>
              </button>
              <button className="scene-btn" onClick={() => navigate('/scenes')}>
                <span className="scene-icon">{'\uD83C\uDF19'}</span>
                <span className="scene-name">Last Call</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Master Slider */}
      <div className="master-row">
        <span className="master-label">MASTER</span>
        <div
          ref={masterTrackRef}
          className="master-track"
          onMouseDown={handleMasterStart}
          onTouchStart={handleMasterStart}
        >
          <div className="master-fill" style={{ width: `${masterValue}%` }}>
            <span className="master-value">{masterValue}%</span>
          </div>
        </div>
      </div>

      {/* Zone Grid with Drag and Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedNodes.map(n => n.node_id || n.id)} strategy={rectSortingStrategy}>
          <div className="zones-grid">
            {sortedNodes.map((node) => (
              <SortableZone
                key={node.node_id || node.id}
                node={node}
                brightness={zoneBrightnesses[node.node_id || node.id] || 0}
                getZoneIcon={getZoneIcon}
                onClick={() => handleZoneClick(node)}
              />
            ))}
            {sortedNodes.length === 0 && (
              <div 
                className="zone-icon"
                onClick={() => navigate('/nodes')}
                style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}
              >
                <span className="zone-name">No zones configured. Tap to add nodes.</span>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
