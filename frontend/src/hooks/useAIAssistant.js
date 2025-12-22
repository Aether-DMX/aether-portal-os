import { useState, useEffect, useCallback } from 'react';
import useAIContext from './useAIContext';
import useSceneStore from '../store/sceneStore';
import useNodeStore from '../store/nodeStore';

const PERSONALITY = {
  greetings: ["Hey! Ready to light things up?", "AETHER online. Let's make some magic!", "Your friendly lighting tech, reporting for duty!"],
  encouragements: ["Nice choice!", "Looking good!", "That's gonna look great!", "Perfect!", "Love it!"],
  tips: [
    "Pro tip: Type 'warmer' or 'cooler' in scene edit for quick color tweaks!",
    "Try 'sunset' or 'party mode' - I understand vibes, not just numbers!",
    "Tap tempo is your friend for matching music BPM!",
    "The capture button grabs your current lights as a scene!",
  ],
};

export default function useAIAssistant() {
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [tipIndex, setTipIndex] = useState(0);
  const context = useAIContext();
  const { scenes } = useSceneStore();
  const { nodes } = useNodeStore();

  const generateSuggestion = useCallback(() => {
    const state = useAIContext.getState();
    const { currentContext, isSuggestionDismissed } = state;
    console.log("🤖 AI context:", currentContext);
    const suggestions = [];

    // Holiday suggestions
    if (currentContext.holiday && !isSuggestionDismissed('holiday-' + currentContext.holiday.name)) {
      const h = currentContext.holiday;
      suggestions.push({
        id: 'holiday-' + h.name,
        type: 'holiday',
        priority: h.daysAway === 0 ? 10 : 5,
        message: h.daysAway === 0 
          ? `Happy ${h.name}! Want some festive lighting?` 
          : `${h.name} is in ${h.daysAway} days - time for holiday vibes?`,
        action: { type: 'navigate', to: '/scenes' },
      });
    }

    // Time-based suggestions - only show once per time period
    const timeId = 'time-' + currentContext.timeOfDay;
    if (currentContext.timeSuggestion && !isSuggestionDismissed(timeId)) {
      suggestions.push({
        id: timeId,
        type: 'time',
        priority: 2,
        message: currentContext.timeSuggestion,
        action: { type: 'navigate', to: '/scenes' }
      });
    }

    // Offline nodes
    const nodeList = nodes || [];
    if (nodeList.length > 0) {
      const offlineNodes = nodeList.filter(n => n.status === 'offline');
      offlineNodes.forEach(node => {
        const offlineId = `offline-${node.node_id || node.id}`;
        if (!isSuggestionDismissed(offlineId)) {
          suggestions.push({
            id: offlineId,
            type: 'warning',
            priority: 9,
            message: `Heads up - ${node.name || node.id} seems offline. Check the connection?`,
            action: { type: 'navigate', to: '/nodes' }
          });
        }
      });
    }

    suggestions.sort((a, b) => b.priority - a.priority);
    return suggestions[0] || null;
  }, [context, scenes, nodes]);

  useEffect(() => {
    // Initial delay to let app load
    const initialDelay = setTimeout(() => {
      context.updateContext();
      const suggestion = generateSuggestion();
      if (suggestion) setCurrentSuggestion(suggestion);
    }, 5000); // Longer delay - 8 seconds

    // Check less frequently - every 5 minutes
    const interval = setInterval(() => {
      context.updateContext();
      // Only show new suggestion if none is currently showing
      if (!currentSuggestion) {
        const s = generateSuggestion();
        if (s) setCurrentSuggestion(s);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const getResponse = (type) => { 
    const r = PERSONALITY[type]; 
    return Array.isArray(r) ? r[Math.floor(Math.random() * r.length)] : r; 
  };
  
  const getTip = () => { 
    const tip = PERSONALITY.tips[tipIndex]; 
    setTipIndex((tipIndex + 1) % PERSONALITY.tips.length); 
    return tip; 
  };
  
  const dismissSuggestion = () => { 
    if (currentSuggestion) { 
      context.dismissSuggestion(currentSuggestion.id); 
      setCurrentSuggestion(null); 
    } 
  };
  
  const acceptSuggestion = () => { 
    if (currentSuggestion) {
      context.dismissSuggestion(currentSuggestion.id); // Also dismiss on accept
      const action = currentSuggestion.action;
      setCurrentSuggestion(null);
      return action;
    }
    return null;
  };

  return { 
    currentSuggestion, 
    dismissSuggestion, 
    acceptSuggestion, 
    getResponse, 
    getTip, 
    getGreeting: context.getGreeting, 
    recordAction: context.recordAction, 
    context: context.currentContext, 
    userProfile: context.userProfile 
  };
}
