import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChatStore = create(
  persist(
    (set, get) => ({
      // Chat messages array
      messages: [],

      // Current input value (for persistence across dock/page)
      inputValue: '',

      // Streaming state
      isStreaming: false,
      streamingMessage: null,

      // UI state
      isDocked: false,

      // Session ID for backend continuity
      sessionId: 'default',

      // Quick action chips
      quickActions: [
        { id: 'blackout', label: 'Blackout', icon: '⏻' },
        { id: 'stop', label: 'Stop All', icon: '⏹' },
        { id: 'create-scene', label: 'Create Scene', icon: '✨' },
        { id: 'diagnostics', label: 'Diagnostics', icon: '🔧' },
      ],

      // Add a message to the chat
      addMessage: (message) => {
        const newMessage = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          ...message,
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        return newMessage;
      },

      // Update a message (for streaming updates)
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      // Set streaming state
      setStreaming: (isStreaming, streamingMessage = null) => {
        set({ isStreaming, streamingMessage });
      },

      // Set input value
      setInputValue: (inputValue) => {
        set({ inputValue });
      },

      // Set docked state
      setDocked: (isDocked) => {
        set({ isDocked });
      },

      // Clear all messages
      clearMessages: () => {
        set({ messages: [], streamingMessage: null });
      },

      // Get last N messages for context display
      getRecentMessages: (count = 10) => {
        const { messages } = get();
        return messages.slice(-count);
      },

      // Get last AI message (for dock preview)
      getLastAIMessage: () => {
        const { messages } = get();
        return [...messages].reverse().find((msg) => msg.role === 'assistant');
      },
    }),
    {
      name: 'aether-chat-store',
      partialize: (state) => ({
        messages: state.messages.slice(-100), // Keep last 100 messages
        isDocked: state.isDocked,
        sessionId: state.sessionId,
      }),
    }
  )
);

export default useChatStore;
