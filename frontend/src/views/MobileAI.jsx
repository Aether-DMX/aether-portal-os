import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Zap, Sparkles, Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useClaudeChat from '../hooks/useClaudeChat';
import useAIStore from '../store/aiStore';
import io from 'socket.io-client';

export default function MobileAI() {
  const location = useLocation();
  const { conversationHistory, clearHistory } = useAIStore();
  const { sendMessage, loading, error } = useClaudeChat();
  const [input, setInput] = useState('');
  const [screenContext, setScreenContext] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Connect to WebSocket for real-time screen context
  useEffect(() => {
    const socket = io(`http://${window.location.hostname}:3000`);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to AETHER');
      socket.emit('mobile-ai:subscribe');
    });

    socket.on('screen:context', (context) => {
      console.log('📱 Screen context update:', context);
      setScreenContext(context);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from AETHER');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userInput = input;
    setInput('');

    try {
      // Include screen context in message
      const contextualMessage = screenContext 
        ? `[User is on ${screenContext.page}${screenContext.action ? `, doing: ${screenContext.action}` : ''}] ${userInput}`
        : userInput;
      
      await sendMessage(contextualMessage);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const formatMessage = (text) => {
    const cleanText = text.replace(/^\[User is on .*?\] /, '');
    return cleanText.split('\n').map((line, i) => {
      if (line.startsWith('```')) {
        return <div key={i} className="font-mono text-xs bg-black/40 p-2 rounded my-1 overflow-x-auto">{line.replace(/```/g, '')}</div>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{line.substring(2)}</li>;
      }
      return <p key={i} className="mb-1">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-black/40 backdrop-blur-lg border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/40">
            <img
              src="/Aether_LogoN1.png"
              alt="AI"
              className="w-6 h-6"
              style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
            />
          </div>
          <div>
            <h1 className="text-white font-bold">AETHER AI</h1>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              {screenContext ? screenContext.page : 'Connected'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          {showMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menu Drawer */}
      {showMenu && (
        <div className="absolute top-16 right-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 z-50 min-w-[200px]">
          <button
            onClick={() => {
              if (confirm('Clear conversation history?')) {
                clearHistory();
                setShowMenu(false);
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm"
          >
            <Trash2 size={16} />
            Clear History
          </button>
        </div>
      )}

      {/* Screen Context Banner */}
      {screenContext?.action && (
        <div className="bg-purple-500/20 border-b border-purple-500/40 px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Zap size={14} className="text-purple-400" />
            <span className="text-white/80">
              User is <strong className="text-white">{screenContext.action}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversationHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-purple-500/20 border-2 border-purple-500/40">
              <img
                src="/Aether_LogoN1.png"
                alt="AI"
                className="w-12 h-12"
                style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))' }}
              />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to AETHER AI</h2>
            <p className="text-white/60 mb-6">
              I can see what you're doing on the touchscreen and help you create amazing lighting
            </p>
            <div className="space-y-2 w-full max-w-sm">
              <button
                onClick={() => setInput('What can you help me with?')}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white text-left hover:bg-white/10"
              >
                What can you help me with?
              </button>
              <button
                onClick={() => setInput('Create a warm welcome scene')}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white text-left hover:bg-white/10"
              >
                Create a warm welcome scene
              </button>
              <button
                onClick={() => setInput('Show me system status')}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white text-left hover:bg-white/10"
              >
                Show me system status
              </button>
            </div>
          </div>
        )}

        {conversationHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${msg.type === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              style={{
                background: msg.type === 'user' 
                  ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' 
                  : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: msg.type === 'assistant' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                color: 'white'
              }}
            >
              {typeof msg.text === 'string' ? formatMessage(msg.text) : msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-white/60">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-black/40 backdrop-blur-lg border-t border-white/10 p-4">
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about lighting..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 outline-none focus:border-purple-500/40"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold disabled:opacity-50 flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
