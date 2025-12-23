import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, ChevronRight, Loader } from 'lucide-react';
import useAIAssistant from '../hooks/useAIAssistant';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

// AI Scene/Chase templates based on context
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

export default function AIBubble() {
  const location = useLocation();
  const { currentSuggestion, dismissSuggestion } = useAIAssistant();
  const { fetchScenes, playScene } = useSceneStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Don't show on Dashboard (it has the flip card)
  const isDashboard = location.pathname === '/';

  // Show bubble when suggestion arrives (unless on dashboard)
  useEffect(() => {
    if (currentSuggestion && !isDashboard) {
      setIsExiting(false);
      setIsVisible(true);
      setIsExpanded(false);
    } else if (!currentSuggestion) {
      setIsVisible(false);
      setIsExpanded(false);
    }
  }, [currentSuggestion, isDashboard]);

  // Hide on dashboard
  useEffect(() => {
    if (isDashboard && isVisible) {
      setIsVisible(false);
    }
  }, [isDashboard]);

  const handleDismiss = (e) => {
    e?.stopPropagation();
    dismissSuggestion();
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExpanded(false);
    }, 200);
  };

  const handleBubbleClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const createAndPlayScene = async (template) => {
    const sceneData = {
      scene_id: `scene_ai_${Date.now()}`,
      name: template.name,
      color: template.color,
      channels: template.channels,
      fade_ms: 2000,
      curve: 'linear',
    };
    await axios.post(getAetherCore() + '/api/scenes', sceneData);
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

  const handleApply = async () => {
    if (!currentSuggestion) return;

    const suggestionId = currentSuggestion.id;
    const template = AI_TEMPLATES[suggestionId];

    if (template) {
      setIsApplying(true);
      try {
        if (template.type === 'chase') {
          await createAndPlayChase(template);
        } else {
          await createAndPlayScene(template);
        }
      } catch (e) {
        console.error('AI creation failed:', e);
      }
      setIsApplying(false);
    }

    handleDismiss();
  };

  if (!isVisible || !currentSuggestion || isDashboard) return null;

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 transition-all duration-200 ${isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
    >
      {/* Collapsed: Just a bubble */}
      {!isExpanded ? (
        <button
          onClick={handleBubbleClick}
          className="relative group"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.15))',
            border: '1px solid rgba(139,92,246,0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <Sparkles size={20} style={{ color: '#a78bfa' }} />

          {/* Dismiss X on hover */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={10} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>

          {/* Notification dot */}
          <span
            className="absolute -top-0.5 -right-0.5"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: '2px solid #0a0a0f',
            }}
          />
        </button>
      ) : (
        /* Expanded: Full suggestion card */
        <div
          style={{
            width: 280,
            background: 'rgba(15, 15, 20, 0.95)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 16,
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} style={{ color: '#a78bfa' }} />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600 }}>
                AI Suggestion
              </span>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 12 }}>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              margin: '0 0 12px 0',
              lineHeight: 1.4,
            }}>
              {currentSuggestion.message}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#000',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isApplying ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {isApplying ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <>Apply <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
        }
      `}</style>
    </div>
  );
}
