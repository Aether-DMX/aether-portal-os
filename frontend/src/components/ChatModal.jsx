import React, { useState } from 'react';
import { ArrowLeft, Mic, Send } from 'lucide-react';

const suggestionChips = [
  '"Dim the bar 20%"',
  '"Stage to purple"',
  '"Last call mode"',
  '"Match the energy"',
  '"Romantic dining"',
];

export default function ChatModal({ onClose }) {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleChipClick = (chip) => {
    // Remove quotes and set as input
    setInputValue(chip.replace(/"/g, ''));
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // In production, send to AI backend
    console.log('Sending to AETHER AI:', inputValue);
    setInputValue('');

    // For now, just close after "sending"
    setTimeout(onClose, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="screen-overlay open" style={{ zIndex: 60 }}>
      <div className="screen-glow" />

      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={onClose}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="screen-title">Ask AETHER</div>
        <button
          className={`screen-action ${isListening ? 'bg-red-500/30 border-red-500/50' : ''}`}
          onClick={() => setIsListening(!isListening)}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'text-red-400' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="ai-main">
        {/* Pulsing Orb */}
        <div className="ai-orb">
          {'\u2728'}
        </div>

        {/* Prompt */}
        <div className="ai-prompt">What vibe tonight?</div>

        {/* Suggestion Chips */}
        <div className="ai-chips">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              className="ai-chip"
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="ai-input-wrap">
        <div className="ai-input-row">
          <input
            type="text"
            className="ai-input"
            placeholder="Tell me what you need..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="ai-send" onClick={handleSend}>
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
