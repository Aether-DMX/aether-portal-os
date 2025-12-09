import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Send, Loader } from 'lucide-react';
import useClaudeChat from '../hooks/useClaudeChat';
import useAIStore from '../store/aiStore';

const suggestionChips = [
  '"Dim the bar 20%"',
  '"Stage to purple"',
  '"Last call mode"',
  '"Match the energy"',
  '"Romantic dining"',
];

export default function ChatModal({ onClose }) {
  const { conversationHistory, clearHistory } = useAIStore();
  const { sendMessage, loading, error } = useClaudeChat();
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Switch to message view when we have conversation
  useEffect(() => {
    if (conversationHistory.length > 0) {
      setShowMessages(true);
    }
  }, [conversationHistory.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const handleChipClick = (chip) => {
    const cleanText = chip.replace(/"/g, '');
    setInputValue(cleanText);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const message = inputValue;
    setInputValue('');
    setShowMessages(true);

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('AI error:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('```')) {
        return <div key={i} className="font-mono text-xs bg-black/40 p-2 rounded my-1">{line.replace(/```/g, '')}</div>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 text-sm">{line.substring(2)}</li>;
      }
      return <p key={i} className="text-sm mb-1">{line}</p>;
    });
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

      {/* Main Content - Either Orb or Messages */}
      {!showMessages ? (
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
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Back to orb button */}
          {conversationHistory.length === 0 && (
            <button
              onClick={() => setShowMessages(false)}
              className="text-xs text-white/40 mb-2"
            >
              {'\u2190'} Back to suggestions
            </button>
          )}

          {/* Messages */}
          {conversationHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl ${msg.type === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{
                  background: msg.type === 'user'
                    ? 'var(--accent)'
                    : 'var(--glass)',
                  border: msg.type === 'user' ? 'none' : '1px solid var(--glass-border)',
                  color: msg.type === 'user' ? '#000' : 'var(--text)',
                }}
              >
                {typeof msg.text === 'string' ? formatMessage(msg.text) : msg.text}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                  <span className="text-xs text-white/60">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

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
            disabled={loading}
          />
          <button
            className="ai-send"
            onClick={handleSend}
            disabled={loading || !inputValue.trim()}
            style={{ opacity: loading || !inputValue.trim() ? 0.5 : 1 }}
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
