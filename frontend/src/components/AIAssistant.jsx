import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, Loader } from 'lucide-react';
import useAIAssistant from '../hooks/useAIAssistant';
import useSceneStore from '../store/sceneStore';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

// AI Scene templates based on context
const AI_TEMPLATES = {
  'holiday-Christmas': {
    name: 'Christmas Vibes',
    steps: [
      { color: '#ff0000', channels: { 1: 255, 2: 0, 3: 0 } },
      { color: '#00ff00', channels: { 1: 0, 2: 255, 3: 0 } },
      { color: '#ffd700', channels: { 1: 255, 2: 200, 3: 0 } },
    ],
    type: 'chase',
    bpm: 30,
  },
  "holiday-New Year's Day": {
    name: 'New Year Celebration',
    color: '#ffd700',
    channels: { 1: 255, 2: 215, 3: 0 },
    type: 'scene',
  },
  "holiday-New Year's Eve": {
    name: 'NYE Party',
    steps: [
      { color: '#ffd700', channels: { 1: 255, 2: 215, 3: 0 } },
      { color: '#c0c0c0', channels: { 1: 192, 2: 192, 3: 192 } },
      { color: '#ffffff', channels: { 1: 255, 2: 255, 3: 255 } },
    ],
    type: 'chase',
    bpm: 60,
  },
  "holiday-Valentine's Day": {
    name: 'Romantic Glow',
    color: '#ff1493',
    channels: { 1: 255, 2: 20, 3: 147 },
    type: 'scene',
  },
  'holiday-Halloween': {
    name: 'Spooky Vibes',
    steps: [
      { color: '#ff6600', channels: { 1: 255, 2: 102, 3: 0 } },
      { color: '#800080', channels: { 1: 128, 2: 0, 3: 128 } },
    ],
    type: 'chase',
    bpm: 20,
  },
  'time-earlyMorning': {
    name: 'Sunrise Warm-up',
    color: '#ffb347',
    channels: { 1: 255, 2: 180, 3: 70 },
    type: 'scene',
  },
  'time-morning': {
    name: 'Bright Morning',
    color: '#ffffff',
    channels: { 1: 255, 2: 250, 3: 240 },
    type: 'scene',
  },
  'time-evening': {
    name: 'Evening Relax',
    color: '#ff8c00',
    channels: { 1: 255, 2: 140, 3: 0 },
    type: 'scene',
  },
  'time-night': {
    name: 'Night Mode',
    color: '#4a3080',
    channels: { 1: 60, 2: 40, 3: 120 },
    type: 'scene',
  },
  'time-lateNight': {
    name: 'Night Owl',
    color: '#1a1a40',
    channels: { 1: 30, 2: 25, 3: 60 },
    type: 'scene',
  },
};

export default function AIAssistant() {
  const { currentSuggestion, dismissSuggestion } = useAIAssistant();
  const { playScene, fetchScenes } = useSceneStore();
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentSuggestion) {
      setIsExiting(false);
      setVisible(true);
    }
  }, [currentSuggestion]);

  const createAndPlayScene = async (template) => {
    const sceneData = {
      scene_id: `scene_ai_${Date.now()}`,
      name: template.name,
      color: template.color,
      channels: template.channels,
      fade_ms: 2000,
      curve: 'linear',
    };
    const res = await axios.post(getAetherCore() + '/api/scenes', sceneData);
    await fetchScenes();
    await playScene(sceneData.scene_id, 2000);
    return sceneData;
  };

  const createAndPlayChase = async (template) => {
    const chaseData = {
      chase_id: `chase_ai_${Date.now()}`,
      name: template.name,
      color: template.steps[0].color,
      steps: template.steps.map(s => ({
        channels: s.channels,
        fade_ms: Math.round(60000 / template.bpm * 0.3),
        hold_ms: Math.round(60000 / template.bpm * 0.7),
      })),
      bpm: template.bpm,
      loop: true,
    };
    await axios.post(getAetherCore() + '/api/chases', chaseData);
    await axios.post(getAetherCore() + '/api/chases/' + chaseData.chase_id + '/play', {});
    return chaseData;
  };

  const handleAccept = async () => {
    if (!currentSuggestion) return;
    
    const suggestionId = currentSuggestion.id;
    const template = AI_TEMPLATES[suggestionId];
    
    console.log('🤖 AI Accept:', suggestionId, template);
    
    if (template) {
      setIsCreating(true);
      try {
        if (template.type === 'chase') {
          await createAndPlayChase(template);
          console.log('✨ AI created chase:', template.name);
        } else {
          await createAndPlayScene(template);
          console.log('✨ AI created scene:', template.name);
        }
      } catch (e) {
        console.error('AI creation failed:', e);
      }
      setIsCreating(false);
    }
    
    dismissSuggestion();
    setIsExiting(true);
    setTimeout(() => setVisible(false), 200);
  };

  const handleDismiss = () => {
    dismissSuggestion();
    setIsExiting(true);
    setTimeout(() => setVisible(false), 200);
  };

  if (!visible || !currentSuggestion) return null;

  return (
    <div className={`fixed bottom-20 left-3 right-3 z-40 transition-all duration-200 ${isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
      <div style={{
        background: 'rgba(139,92,246,0.15)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 12,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        backdropFilter: 'blur(8px)'
      }}>
        <Sparkles size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <span style={{ flex: 1, color: 'white', fontSize: 13 }}>{currentSuggestion.message}</span>
        <button onClick={handleAccept} disabled={isCreating} style={{
          background: isCreating ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.3)',
          border: 'none',
          borderRadius: 6,
          padding: '4px 10px',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          cursor: isCreating ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0
        }}>
          {isCreating ? <><Loader size={12} className="animate-spin" /> Creating...</> : <>Go <ChevronRight size={12} /></>}
        </button>
        <button onClick={handleDismiss} style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          padding: 4,
          flexShrink: 0
        }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
