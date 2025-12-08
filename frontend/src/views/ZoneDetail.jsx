import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import useNodeStore from '../store/nodeStore';
import useDMXStore from '../store/dmxStore';

const moods = [
  { id: 'energetic', icon: '\uD83D\uDD25', name: 'Energetic' },
  { id: 'chill', icon: '\uD83C\uDF78', name: 'Chill' },
  { id: 'moody', icon: '\uD83D\uDC9C', name: 'Moody' },
  { id: 'warm', icon: '\uD83C\uDF05', name: 'Warm' },
  { id: 'cool', icon: '\u2744\uFE0F', name: 'Cool' },
  { id: 'off', icon: '\uD83D\uDCA4', name: 'Off' },
];

export default function ZoneDetail() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes } = useNodeStore();
  const { setChannels } = useDMXStore();

  const node = nodes.find(n => (n.node_id || n.id) === nodeId) || { name: 'Zone' };
  const [brightness, setBrightness] = useState(85);
  const [activeMood, setActiveMood] = useState('energetic');
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const handleSliderDrag = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setBrightness(Math.round(pct));
  };

  const handleSliderStart = (e) => {
    isDragging.current = true;
    handleSliderDrag(e);
  };

  const handleSliderMove = (e) => {
    if (isDragging.current) handleSliderDrag(e);
  };

  const handleSliderEnd = () => {
    isDragging.current = false;
    // Send brightness to DMX (would need node's channel mapping)
    // setChannels(node.universe || 1, { [node.startChannel || 1]: Math.round(brightness * 2.55) });
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
  }, []);

  const handleMoodSelect = (mood) => {
    setActiveMood(mood.id);

    // Apply mood presets (in production, these would trigger specific scenes or DMX values)
    switch (mood.id) {
      case 'off':
        setBrightness(0);
        break;
      case 'chill':
        setBrightness(40);
        break;
      case 'moody':
        setBrightness(30);
        break;
      case 'warm':
        setBrightness(70);
        break;
      case 'cool':
        setBrightness(60);
        break;
      case 'energetic':
      default:
        setBrightness(100);
        break;
    }
  };

  return (
    <div className="screen-overlay open">
      <div className="screen-glow" />

      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="screen-title">{node.name}</div>
        <button className="screen-action" onClick={() => navigate('/settings')}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Brightness Control */}
        <div className="zone-control">
          <div className="brightness-big">{brightness}%</div>
          <div
            ref={sliderRef}
            className="brightness-slider"
            onMouseDown={handleSliderStart}
            onTouchStart={handleSliderStart}
          >
            <div
              className="brightness-slider-fill"
              style={{ width: `${brightness}%` }}
            />
          </div>
        </div>

        {/* Mood Grid */}
        <div className="zone-moods">
          {moods.map((mood) => (
            <button
              key={mood.id}
              className={`mood-card ${activeMood === mood.id ? 'active' : ''}`}
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
