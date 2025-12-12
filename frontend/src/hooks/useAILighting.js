import { useState } from 'react';

const API_URL = '/api/ai/lighting';

// Fallback local parsing when AI is unavailable
const parseLocalCommand = (prompt, currentChannels = {}) => {
  const p = prompt.toLowerCase().trim();
  const channels = { ...currentChannels };
  const channelKeys = Object.keys(channels);
  
  let intensity = null;
  let colorShift = null;
  let action = null;

  // Intensity commands
  if (p.includes('off') || p.includes('black') || p.includes('0%')) {
    intensity = 0;
  } else if (p.includes('full') || p.includes('100%') || p.includes('max')) {
    intensity = 100;
  } else if (p.includes('half') || p.includes('50%')) {
    intensity = 50;
  } else if (p.includes('quarter') || p.includes('25%')) {
    intensity = 25;
  } else if (p.includes('dim') || p.includes('lower') || p.includes('down')) {
    intensity = -20; // Relative
  } else if (p.includes('bright') || p.includes('up') || p.includes('raise')) {
    intensity = 20; // Relative
  }
  
  // Percentage extraction
  const percentMatch = p.match(/(\d+)\s*%/);
  if (percentMatch) {
    intensity = parseInt(percentMatch[1]);
  }

  // Color commands
  if (p.includes('warm') || p.includes('orange') || p.includes('sunset') || p.includes('cozy')) {
    colorShift = { r: 40, g: 0, b: -40 };
  } else if (p.includes('cool') || p.includes('blue') || p.includes('cold') || p.includes('ice')) {
    colorShift = { r: -40, g: 0, b: 40 };
  } else if (p.includes('red') || p.includes('fire') || p.includes('hot')) {
    colorShift = { r: 60, g: -30, b: -30 };
  } else if (p.includes('green') || p.includes('forest') || p.includes('nature')) {
    colorShift = { r: -30, g: 60, b: -30 };
  } else if (p.includes('purple') || p.includes('violet') || p.includes('party')) {
    colorShift = { r: 30, g: -30, b: 40 };
  } else if (p.includes('pink') || p.includes('romantic')) {
    colorShift = { r: 50, g: -20, b: 30 };
  } else if (p.includes('white') || p.includes('neutral') || p.includes('clean')) {
    colorShift = { r: 0, g: 0, b: 0, reset: true };
  }

  // Apply changes
  if (intensity !== null) {
    channelKeys.forEach(key => {
      if (intensity < 0 || intensity > 100) {
        // Relative change
        const current = channels[key];
        const delta = (intensity / 100) * 255;
        channels[key] = Math.max(0, Math.min(255, current + delta));
      } else {
        // Absolute
        const scale = intensity / 100;
        channels[key] = Math.round(channels[key] > 0 ? 255 * scale : 0);
      }
    });
  }

  if (colorShift) {
    channelKeys.forEach((key, idx) => {
      const component = idx % 3; // Assume RGB ordering
      if (colorShift.reset) {
        // Reset to neutral white
        channels[key] = channels[key] > 0 ? 200 : 0;
      } else {
        const shift = component === 0 ? colorShift.r : component === 1 ? colorShift.g : colorShift.b;
        channels[key] = Math.max(0, Math.min(255, channels[key] + shift));
      }
    });
  }

  return {
    channels,
    understood: intensity !== null || colorShift !== null,
    message: intensity !== null || colorShift !== null 
      ? 'Applied changes' 
      : 'Try: "warmer", "50%", "dim", "party mode", "sunset"'
  };
};

export default function useAILighting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processCommand = async (prompt, currentChannels = {}, useAI = true) => {
    setLoading(true);
    setError(null);

    try {
      if (useAI) {
        // Try the AI endpoint first
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, currentChannels })
        });

        if (response.ok) {
          const data = await response.json();
          setLoading(false);
          return data;
        }
      }
      
      // Fallback to local parsing
      const result = parseLocalCommand(prompt, currentChannels);
      setLoading(false);
      return result;
      
    } catch (err) {
      console.log('AI unavailable, using local parsing');
      const result = parseLocalCommand(prompt, currentChannels);
      setLoading(false);
      return result;
    }
  };

  const suggestSceneName = (channels) => {
    const values = Object.values(channels);
    if (values.length === 0) return 'New Scene';
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const hasRed = values.some((v, i) => i % 3 === 0 && v > 150);
    const hasBlue = values.some((v, i) => i % 3 === 2 && v > 150);
    
    if (avg < 30) return 'Dim Mood';
    if (avg > 220) return 'Full Bright';
    if (hasRed && !hasBlue) return 'Warm Glow';
    if (hasBlue && !hasRed) return 'Cool Blue';
    return 'Custom Scene';
  };

  return { processCommand, suggestSceneName, loading, error };
}
