import { useState, useCallback } from 'react';
import aiService from '../services/aiService';
import useAIStore from '../store/aiStore';

export default function useClaudeChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { sessionId, addMessage } = useAIStore();

  const sendMessage = useCallback(async (message) => {
    setLoading(true);
    setError(null);

    addMessage({ id: Date.now(), type: 'user', text: message, timestamp: Date.now() });

    try {
      const response = await aiService.sendMessage(message, sessionId);
      
      addMessage({
        id: Date.now() + 1,
        type: 'assistant',
        text: response.message,
        toolsUsed: response.toolsUsed,
        timestamp: Date.now(),
      });

      return response;
    } catch (err) {
      setError(err.message);
      addMessage({
        id: Date.now() + 1,
        type: 'error',
        text: `Error: ${err.message}`,
        timestamp: Date.now(),
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, addMessage]);

  const streamMessage = useCallback(async (message, onChunk) => {
    setLoading(true);
    setError(null);

    addMessage({ id: Date.now(), type: 'user', text: message, timestamp: Date.now() });

    let fullResponse = '';
    const messageId = Date.now() + 1;

    try {
      await aiService.streamMessage(message, sessionId, (chunk) => {
        if (chunk.type === 'text') {
          fullResponse += chunk.content;
          onChunk(chunk);
        }
      });

      addMessage({
        id: messageId,
        type: 'assistant',
        text: fullResponse,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(err.message);
      addMessage({
        id: messageId,
        type: 'error',
        text: `Error: ${err.message}`,
        timestamp: Date.now(),
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, addMessage]);

  const clearSession = useCallback(async () => {
    try {
      await aiService.clearSession(sessionId);
      useAIStore.getState().clearHistory();
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId]);

  return {
    sendMessage,
    streamMessage,
    clearSession,
    loading,
    error,
  };
}
