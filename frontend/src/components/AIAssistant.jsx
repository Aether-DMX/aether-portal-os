import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, MessageCircle, Lightbulb, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAIAssistant from '../hooks/useAIAssistant';

const ICONS = { 
  holiday: Calendar, 
  time: Clock, 
  pattern: Lightbulb, 
  help: MessageCircle, 
  warning: AlertTriangle, 
  default: Sparkles 
};

const COLORS = { 
  holiday: 'from-purple-500 to-pink-500', 
  time: 'from-blue-500 to-cyan-500', 
  pattern: 'from-amber-500 to-orange-500', 
  help: 'from-green-500 to-emerald-500', 
  warning: 'from-red-500 to-orange-500', 
  default: 'from-[var(--theme-primary)] to-blue-500' 
};

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

  const Icon = ICONS[currentSuggestion.type] || ICONS.default;
  const gradient = COLORS[currentSuggestion.type] || COLORS.default;

  return (
    <div className={`fixed bottom-20 left-3 right-3 z-40 transition-all duration-200 ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-0.5 shadow-lg shadow-black/50`}>
        <div className="bg-[#0a0a0f]/95 backdrop-blur rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wide">AETHER</span>
                <button onClick={handleDismiss} className="p-1 text-white/40 hover:text-white/60">
                  <X size={14} />
                </button>
              </div>
              <p className="text-white text-sm leading-relaxed">{currentSuggestion.message}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button 
              onClick={handleDismiss} 
              className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Maybe Later
            </button>
            <button 
              onClick={handleAccept} 
              className={`flex-1 py-2 rounded-xl bg-gradient-to-r ${gradient} text-white text-sm font-bold flex items-center justify-center gap-1 hover:brightness-110 transition-all`}
            >
              Let's Do It <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
