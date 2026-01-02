import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, Maximize2, Sparkles, Loader } from 'lucide-react';
import useChat from '../hooks/useChat';
import useChatStore from '../store/chatStore';
import TouchKeyboard from './TouchKeyboard';

export default function ChatDock() {
  const navigate = useNavigate();
  const {
    messages,
    inputValue,
    isStreaming,
    sendMessage,
    cancelStream,
    setInputValue,
    getLastAIMessage,
  } = useChat();
  const { isDocked, setDocked } = useChatStore();

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const inputRef = useRef(null);

  const lastMessage = getLastAIMessage();

  // Don't render if not docked
  if (!isDocked) return null;

  const handleExpand = () => {
    setDocked(false);
    navigate('/chat');
  };

  const handleClose = () => {
    setDocked(false);
    setIsMinimized(true);
    setShowKeyboard(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      // Opening - maybe focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setShowKeyboard(false);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isStreaming) {
      sendMessage(inputValue);
      setShowKeyboard(false);
    }
  };

  const handleKeyboardChange = (input) => {
    setInputValue(input);
  };

  const handleKeyboardClose = () => {
    setShowKeyboard(false);
    handleSend();
  };

  // Minimized pill view
  if (isMinimized) {
    return (
      <button
        onClick={handleToggleMinimize}
        style={{
          position: 'fixed',
          bottom: 90, // Above the dock
          right: 16,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 24,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isStreaming ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Loader size={12} className="animate-spin" />
              Thinking...
            </span>
          ) : lastMessage ? (
            lastMessage.content.slice(0, 40) + (lastMessage.content.length > 40 ? '...' : '')
          ) : (
            'AETHER AI'
          )}
        </span>
      </button>
    );
  }

  // Expanded panel view
  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 90, // Above the dock
          right: 16,
          zIndex: 60,
          width: 320,
          maxHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AETHER AI</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleExpand}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Expand to full page"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={handleClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages preview */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            maxHeight: 200,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: 16 }}>
              Ask me anything about your lighting!
            </div>
          ) : (
            messages.slice(-4).map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 8,
                  padding: '8px 10px',
                  borderRadius: msg.role === 'user' ? '10px 10px 4px 10px' : '10px 10px 10px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  color: msg.role === 'user' ? '#000' : '#fff',
                  fontSize: 12,
                  marginLeft: msg.role === 'user' ? 40 : 0,
                  marginRight: msg.role === 'user' ? 0 : 40,
                }}
              >
                {msg.content.slice(0, 100)}
                {msg.content.length > 100 && '...'}
                {msg.isStreaming && (
                  <span style={{ display: 'inline-block', width: 4, height: 10, background: 'currentColor', marginLeft: 2, animation: 'blink 1s infinite' }} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div
          style={{
            padding: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 20,
              padding: '4px 4px 4px 12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask something..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 13,
              }}
            />
            {isStreaming ? (
              <button
                onClick={cancelStream}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: inputValue.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: inputValue.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Touch keyboard */}
      {showKeyboard && (
        <TouchKeyboard
          onClose={handleKeyboardClose}
          onInputChange={handleKeyboardChange}
          inputName="chat-dock"
        />
      )}

      {/* Blink animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
