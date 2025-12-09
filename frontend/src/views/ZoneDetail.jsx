import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import useNodeStore from '../store/nodeStore';
import useDMXStore from '../store/dmxStore';

const moods = [
  { id: 'energetic', icon: '\uD83D\uDD25', name: 'Energetic', brightness: 100 },
  { id: 'chill', icon: '\uD83C\uDF78', name: 'Chill', brightness: 40 },
  { id: 'moody', icon: '\uD83D\uDC9C', name: 'Moody', brightness: 25 },
  { id: 'warm', icon: '\uD83C\uDF05', name: 'Warm', brightness: 70 },
  { id: 'cool', icon: '\u2744\uFE0F', name: 'Cool', brightness: 55 },
  { id: 'off', icon: '\uD83D\uDCA4', name: 'Off', brightness: 0 },
];

export default function ZoneDetail() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes } = useNodeStore();
  const { universes, setChannels, initSocket } = useDMXStore();

  const node = nodes.find(n => (n.node_id || n.id) === nodeId) || { name: 'Zone', universe: 1 };
  const [activeMood, setActiveMood] = useState(null);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  // Node channel configuration
  const universe = node.universe || 1;
  const startCh = node.channel_start || node.channelStart || 1;
  const endCh = node.channel_end || node.channelEnd || 512;
  const channelCount = endCh - startCh + 1;

  // Initialize DMX polling
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // Calculate current brightness from actual DMX state
  const currentBrightness = useMemo(() => {
    const universeState = universes[universe] || [];
    let sum = 0;
    let count = 0;

    for (let i = startCh - 1; i < Math.min(endCh, universeState.length); i++) {
      sum += universeState[i] || 0;
      count++;
    }

    if (count === 0) return 0;
    return Math.round((sum / count / 255) * 100);
  }, [universes, universe, startCh, endCh]);

  // Local state for slider while dragging
  const [localBrightness, setLocalBrightness] = useState(currentBrightness);

  // Sync local brightness with actual when not dragging
  useEffect(() => {
    if (!isDragging.current) {
      setLocalBrightness(currentBrightness);
    }
  }, [currentBrightness]);

  // Apply brightness to all channels in this node's range
  const applyBrightness = (percent) => {
    const dmxValue = Math.round((percent / 100) * 255);
    const channelValues = {};

    for (let ch = startCh; ch <= endCh; ch++) {
      channelValues[ch] = dmxValue;
    }

    setChannels(universe, channelValues, 300); // 300ms fade for smooth response
  };

  const handleSliderDrag = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setLocalBrightness(Math.round(pct));
  };

  const handleSliderStart = (e) => {
    isDragging.current = true;
    setActiveMood(null); // Clear mood selection when manually adjusting
    handleSliderDrag(e);
  };

  const handleSliderMove = (e) => {
    if (isDragging.current) handleSliderDrag(e);
  };

  const handleSliderEnd = () => {
    if (isDragging.current) {
      isDragging.current = false;
      // Apply brightness when drag ends
      applyBrightness(localBrightness);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleSliderMove);
    document.addEventListener('mouseup', handleSliderEnd);
    document.addEventListener('touchmove', handleSliderMove, { passive: true });
    document.addEventListener('touchend', handleSliderEnd);

    return () => {
      document.removeEventListener('mousemove', handleSliderMove);
      document.removeEventListener('mouseup', handleSliderEnd);
      document.removeEventListener('touchmove', handleSliderMove);
      document.removeEventListener('touchend', handleSliderEnd);
    };
  }, [localBrightness]);

  const handleMoodSelect = (mood) => {
    setActiveMood(mood.id);
    setLocalBrightness(mood.brightness);
    applyBrightness(mood.brightness);
  };

  // Determine active mood based on current brightness
  const displayMood = useMemo(() => {
    if (activeMood) return activeMood;
    // Auto-detect mood from brightness
    const closest = moods.reduce((prev, curr) =>
      Math.abs(curr.brightness - currentBrightness) < Math.abs(prev.brightness - currentBrightness) ? curr : prev
    );
    return closest.id;
  }, [activeMood, currentBrightness]);

  return (
    <div className="screen-overlay open">
      <div className="screen-glow" />

      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="screen-title">{node.name}</div>
        <button className="screen-action" onClick={() => navigate('/faders')}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Brightness Control */}
        <div className="zone-control">
          <div className="brightness-big">{localBrightness}%</div>
          <div
            ref={sliderRef}
            className="brightness-slider"
            onMouseDown={handleSliderStart}
            onTouchStart={handleSliderStart}
          >
            <div
              className="brightness-slider-fill"
              style={{ width: `${localBrightness}%` }}
            />
          </div>
          <div className="text-xs text-white/40 mt-2">
            Universe {universe} • Channels {startCh}-{endCh} ({channelCount} ch)
          </div>
        </div>

        {/* Mood Grid */}
        <div className="zone-moods">
          {moods.map((mood) => (
            <button
              key={mood.id}
              className={`mood-card ${displayMood === mood.id ? 'active' : ''}`}
              onClick={() => handleMoodSelect(mood)}
            >
              <span className="mood-icon">{mood.icon}</span>
              <span className="mood-name">{mood.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
