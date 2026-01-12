import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, X, Loader, Trash2, Minimize2, Sparkles, Wifi, WifiOff } from 'lucide-react';
import useChat from '../hooks/useChat';
import useNodeStore from '../store/nodeStore';
import usePlaybackStore from '../store/playbackStore';
import useChatStore from '../store/chatStore';
import TouchKeyboard from '../components/TouchKeyboard';
import useVoiceInput from '../hooks/useVoiceInput';
import VoiceMicButton from '../components/VoiceMicButton';

// Detect if we're in desktop mode (DesktopShell provides its own header)
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
};

// Message bubble component
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 animate-fadeIn`}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser
            ? 'var(--accent)'
            : 'rgba(255, 255, 255, 0.08)',
          color: isUser ? '#000' : '#fff',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {message.content}
        {isStreaming && (
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 14,
              background: 'currentColor',
              marginLeft: 4,
              animation: 'blink 1s infinite',
              verticalAlign: 'middle',
            }}
          />
        )}

        {/* Tool calls display */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {message.toolCalls.map((tool, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                {tool.status === 'executing' && <Loader size={10} className="animate-spin" />}
                {tool.status === 'complete' && <span style={{ color: 'var(--accent)' }}>✓</span>}
                {tool.status === 'error' && <span style={{ color: '#ef4444' }}>✗</span>}
                <span>{tool.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Context ribbon showing playback and node status
function ContextRibbon() {
  const { nodes } = useNodeStore();
  const { playback } = usePlaybackStore();

  const onlineNodes = nodes.filter((n) => n.status === 'online').length;
  const totalNodes = nodes.filter((n) => n.is_paired || n.is_builtin).length;
  const hasPlayback = Object.keys(playback).length > 0;
  const currentPlayback = hasPlayback ? Object.values(playback)[0] : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* Playback status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {hasPlayback ? (
          <>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'playing-pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {currentPlayback?.id?.replace(/^(scene_|chase_)/, '').replace(/_/g, ' ')}
            </span>
          </>
        ) : (
          <span>Nothing playing</span>
        )}
      </div>

      <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

      {/* Node status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {onlineNodes === totalNodes ? (
          <Wifi size={12} style={{ color: '#22c55e' }} />
        ) : (
          <WifiOff size={12} style={{ color: '#eab308' }} />
        )}
        <span>
          {onlineNodes}/{totalNodes} nodes
        </span>
      </div>
    </div>
  );
}

// Quick action chips
function QuickActions({ onAction, disabled }) {
  const { quickActions } = useChatStore();

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const {
    messages,
    inputValue,
    isStreaming,
    sendMessage,
    cancelStream,
    setInputValue,
    clearMessages,
    executeQuickAction,
    getContextSummary,
  } = useChat();
  const { setDocked } = useChatStore();

  const [showKeyboard, setShowKeyboard] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { greeting } = getContextSummary();

  // Voice input handling
  const handleVoiceTranscript = useCallback((text) => {
    setInputValue((prev) => (prev + ' ' + text).trim());
  }, [setInputValue]);

  const {
    isListening,
    isSupported: voiceSupported,
    error: voiceError,
    interimTranscript,
    toggleListening,
  } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
  });

  // Auto-send when voice recording stops and we have content
  useEffect(() => {
    if (!isListening && inputValue.trim() && !isStreaming) {
      // Small delay to let the final transcript settle
      const timer = setTimeout(() => {
        sendMessage(inputValue);
        setShowKeyboard(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleInputFocus = () => {
    setShowKeyboard(true);
  };

  const handleDock = () => {
    setDocked(true);
    navigate(-1);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'transparent',
      }}
    >
      {/* Header - only show in kiosk mode, desktop has its own shell header */}
      {!isDesktop && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                AETHER AI
              </h1>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Your lighting assistant
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={clearMessages}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleDock}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Minimize to dock"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop header - compact version with title and actions */}
      {isDesktop && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>
              AETHER AI Assistant
            </h1>
          </div>
          <button
            onClick={clearMessages}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 12,
            }}
            title="Clear chat"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      )}

      {/* Context ribbon */}
      <ContextRibbon />

      {/* Quick actions */}
      <QuickActions onAction={executeQuickAction} disabled={isStreaming} />

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 32,
            }}
          >
            <Sparkles size={48} style={{ color: 'var(--accent)', marginBottom: 16, opacity: 0.8 }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
              {greeting}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.5 }}>
              I can help you create scenes, control lighting, and manage your AETHER system.
              Try the quick actions above or just ask me anything!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '12px 16px',
          paddingBottom: showKeyboard ? 0 : 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 24,
            padding: '4px 4px 4px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={isListening ? (inputValue + ' ' + interimTranscript).trim() : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? 'Listening...' : 'Ask AETHER AI...'}
            readOnly={isListening}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: isListening ? 'var(--accent)' : '#fff',
              fontSize: 14,
            }}
          />
          {/* Voice input button */}
          <VoiceMicButton
            isListening={isListening}
            isSupported={voiceSupported}
            disabled={isStreaming}
            error={voiceError}
            onClick={toggleListening}
            size={40}
          />
          {isStreaming ? (
            <button
              onClick={cancelStream}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: '#ef4444',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: inputValue.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: inputValue.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Touch keyboard */}
      {showKeyboard && (
        <TouchKeyboard
          onClose={handleKeyboardClose}
          onInputChange={handleKeyboardChange}
          inputName="chat"
        />
      )}

      {/* Blink cursor animation */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
