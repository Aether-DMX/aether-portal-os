import { useCallback, useRef } from 'react';
import useChatStore from '../store/chatStore';
import useAIContext from './useAIContext';

const getApiUrl = () => `http://${window.location.hostname}:3000`;

export default function useChat() {
  const {
    messages,
    inputValue,
    isStreaming,
    streamingMessage,
    addMessage,
    updateMessage,
    setStreaming,
    setInputValue,
    clearMessages,
    getLastAIMessage,
    sessionId,
  } = useChatStore();

  const { currentContext, getGreeting } = useAIContext();
  const abortControllerRef = useRef(null);

  // Send a message and stream the response
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming) return;

    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: text.trim(),
    });

    // Clear input
    setInputValue('');

    // Create placeholder for AI response
    const aiMessageId = Date.now().toString() + '-ai';
    addMessage({
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    setStreaming(true, aiMessageId);

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${getApiUrl()}/api/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let toolCalls = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'text') {
                fullContent += parsed.content;
                updateMessage(aiMessageId, { content: fullContent });
              } else if (parsed.type === 'tools') {
                toolCalls = parsed.content;
                updateMessage(aiMessageId, { toolCalls });
              } else if (parsed.type === 'tool_status') {
                // Update tool execution status
                const existingTools = useChatStore.getState().messages.find(
                  (m) => m.id === aiMessageId
                )?.toolCalls || [];
                const updatedTools = existingTools.map((t) =>
                  t.name === parsed.tool
                    ? { ...t, status: parsed.status, result: parsed.result }
                    : t
                );
                updateMessage(aiMessageId, { toolCalls: updatedTools });
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Mark message as complete
      updateMessage(aiMessageId, { isStreaming: false });
    } catch (error) {
      if (error.name === 'AbortError') {
        updateMessage(aiMessageId, {
          content: fullContent || 'Message cancelled.',
          isStreaming: false,
        });
      } else {
        console.error('Chat error:', error);
        updateMessage(aiMessageId, {
          content: 'Sorry, I encountered an error. Please try again.',
          isStreaming: false,
          error: true,
        });
      }
    } finally {
      setStreaming(false, null);
      abortControllerRef.current = null;
    }
  }, [isStreaming, sessionId, addMessage, setInputValue, setStreaming, updateMessage]);

  // Cancel current streaming response
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Execute a quick action
  const executeQuickAction = useCallback(async (actionId) => {
    const actionPrompts = {
      'blackout': 'Blackout all lights immediately',
      'stop': 'Stop all running scenes and chases',
      'create-scene': 'Help me create a new scene',
      'diagnostics': 'Run a quick system health check and show me the status of all nodes',
    };

    const prompt = actionPrompts[actionId];
    if (prompt) {
      await sendMessage(prompt);
    }
  }, [sendMessage]);

  // Get context summary for display
  const getContextSummary = useCallback(() => {
    return {
      timeOfDay: currentContext.timeOfDay,
      holiday: currentContext.holiday,
      greeting: getGreeting(),
    };
  }, [currentContext, getGreeting]);

  // Clear session (both local and backend)
  const clearSession = useCallback(async () => {
    clearMessages();
    try {
      await fetch(`${getApiUrl()}/api/ai/session/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }, [clearMessages, sessionId]);

  return {
    // State
    messages,
    inputValue,
    isStreaming,
    streamingMessage,

    // Actions
    sendMessage,
    cancelStream,
    setInputValue,
    clearMessages: clearSession,
    executeQuickAction,

    // Helpers
    getContextSummary,
    getLastAIMessage,
  };
}
