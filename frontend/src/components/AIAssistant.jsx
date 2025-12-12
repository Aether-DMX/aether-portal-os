import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAIAssistant from '../hooks/useAIAssistant';

export default function AIAssistant() {
  const navigate = useNavigate();
  const { currentSuggestion, dismissSuggestion, acceptSuggestion } = useAIAssistant();
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (currentSuggestion) {
      setIsExiting(false);
      setVisible(true);
    }
  }, [currentSuggestion]);

  const handleAccept = () => {
    const action = acceptSuggestion();
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      if (action?.type === 'navigate' && action.to) {
        navigate(action.to);
      }
    }, 200);
  };

  const handleDismiss = () => {
    dismissSuggestion();
    setIsExiting(true);
    setTimeout(() => setVisible(false), 200);
  };

  if (!visible || !currentSuggestion) return null;

  return (
    <div 
      className={`fixed bottom-20 left-3 right-3 z-40 transition-all duration-200 ${isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
    >
      <div 
        style={{
          background: 'rgba(139,92,246,0.15)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 12,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(8px)'
        }}
      >
        <Sparkles size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <span style={{ flex: 1, color: 'white', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentSuggestion.message}
        </span>
        <button
          onClick={handleAccept}
          style={{
            background: 'rgba(139,92,246,0.3)',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0
          }}
        >
          Go <ChevronRight size={12} />
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: 4,
            flexShrink: 0
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
