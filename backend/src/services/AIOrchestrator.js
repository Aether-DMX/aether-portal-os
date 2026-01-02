/**
 * AIOrchestrator - Routes AI requests between Claude API and local fallback
 *
 * Hybrid Mode (Option C):
 * - Try Claude API first
 * - Fall back to LocalIntentService when offline
 * - Inject context (playback, nodes, time) into prompts
 * - Log all actions for audit trail
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';
import ToolBridge from './tools/ToolBridge.js';
import LocalIntentService from './LocalIntentService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AETHER_CORE_URL = process.env.AETHER_CORE_URL || 'http://localhost:8891';

class AIOrchestrator {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096;

    // Initialize Anthropic client (may fail if no API key)
    this.anthropic = this.apiKey ? new Anthropic({ apiKey: this.apiKey }) : null;

    this.toolBridge = new ToolBridge();
    this.localIntent = new LocalIntentService(this.toolBridge);
    this.sessions = new Map();
    this.actionLog = [];

    // Mode: 'online' | 'offline' | 'hybrid'
    this.mode = 'hybrid';
    this.isOnline = null; // null = unknown, true/false = tested

    // Load system prompt
    this.systemPrompt = this.loadSystemPrompt();

    // Session TTL: 24 hours
    this.SESSION_TTL_MS = 24 * 60 * 60 * 1000;

    // Cleanup expired sessions every hour
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);

    // Check online status periodically
    this.checkOnlineStatus();
    setInterval(() => this.checkOnlineStatus(), 60000); // Every minute

    logger.info(`AIOrchestrator initialized in ${this.mode} mode`);
  }

  loadSystemPrompt() {
    try {
      const promptPath = path.join(__dirname, '../../prompts/aether-system.txt');
      if (fs.existsSync(promptPath)) {
        return fs.readFileSync(promptPath, 'utf-8');
      }
    } catch (error) {
      logger.warn('Could not load system prompt file, using default');
    }

    return this.getDefaultSystemPrompt();
  }

  getDefaultSystemPrompt() {
    return `You are AETHER AI, the intelligent lighting assistant running directly on the AETHER DMX touchscreen controller.

CONTEXT:
You run on a Raspberry Pi 5 powering a professional DMX lighting system. You have direct access to control lights, create scenes, run chases, and monitor system health through your tools.

CAPABILITIES:
- Control DMX channels (0-255 values, 512 channels per universe)
- Create and play scenes (saved lighting snapshots)
- Create and run chases (animated sequences)
- Query node status (WiFi Pulse nodes for DMX output)
- Monitor system health

PERSONALITY:
- Be helpful, concise, and action-oriented
- Speak like a professional lighting tech who knows their craft
- When asked to do something, DO IT - don't just explain how
- Confirm actions with brief summaries

SAFETY RULES:
- Never trigger high-risk effects (strobe >10Hz) without confirmation
- Warn before interrupting running shows
- Fade changes smoothly when possible (500-1000ms default)

When using tools:
1. Execute the action
2. Report the result briefly
3. Offer follow-up suggestions when relevant`;
  }

  async checkOnlineStatus() {
    if (!this.anthropic) {
      this.isOnline = false;
      return;
    }

    try {
      // Quick test - try to create a minimal message
      const response = await Promise.race([
        this.anthropic.messages.create({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
      logger.debug('Claude API offline or unreachable');
    }
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActivity && (now - session.lastActivity) > this.SESSION_TTL_MS) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired session(s)`);
    }
  }

  getSession(sessionId = 'default') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        messages: [],
        context: {},
        lastActivity: Date.now(),
        createdAt: Date.now(),
      });
    }
    const session = this.sessions.get(sessionId);
    session.lastActivity = Date.now();
    return session;
  }

  clearSession(sessionId) {
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get current system context for injection into prompts
   */
  async getContext() {
    try {
      const [playback, nodes, health] = await Promise.all([
        this.fetchJSON('/api/playback/status').catch(() => ({})),
        this.fetchJSON('/api/nodes').catch(() => []),
        this.fetchJSON('/api/health').catch(() => ({})),
      ]);

      const now = new Date();
      const hour = now.getHours();
      let timeOfDay = 'day';
      if (hour >= 5 && hour < 7) timeOfDay = 'early_morning';
      else if (hour >= 7 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 20) timeOfDay = 'evening';
      else if (hour >= 20 && hour < 23) timeOfDay = 'night';
      else timeOfDay = 'late_night';

      const pairedNodes = Array.isArray(nodes) ? nodes.filter(n => n.is_paired || n.is_builtin) : [];
      const onlineNodes = pairedNodes.filter(n => n.status === 'online');
      const offlineNodes = pairedNodes.filter(n => n.status !== 'online');

      return {
        playback: {
          state: Object.keys(playback).length > 0 ? 'playing' : 'idle',
          active: playback,
        },
        nodes: {
          online: onlineNodes.length,
          offline: offlineNodes.length,
          total: pairedNodes.length,
          warnings: offlineNodes.map(n => `${n.name || n.node_id} offline`),
        },
        time: {
          timeOfDay,
          hour,
          dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        },
        system: {
          healthy: health.status === 'healthy',
        },
        aiMode: this.isOnline ? 'online' : 'offline',
      };
    } catch (error) {
      logger.error('Failed to get context:', error);
      return {
        playback: { state: 'unknown' },
        nodes: { online: 0, offline: 0, total: 0, warnings: [] },
        time: { timeOfDay: 'unknown', hour: new Date().getHours() },
        system: { healthy: false },
        aiMode: this.isOnline ? 'online' : 'offline',
      };
    }
  }

  async fetchJSON(path) {
    const res = await fetch(`${AETHER_CORE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /**
   * Log an action for audit trail
   */
  logAction(action, params, result, sessionId) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId,
      action,
      params,
      result: result.success !== false,
      message: result.message || result.error,
    };
    this.actionLog.push(entry);
    // Keep last 1000 entries
    if (this.actionLog.length > 1000) {
      this.actionLog = this.actionLog.slice(-1000);
    }
    logger.info(`AI Action: ${action}`, { params, result: result.success !== false });
  }

  getActionLog(limit = 50) {
    return this.actionLog.slice(-limit);
  }

  /**
   * Main chat method - routes to Claude or local fallback
   */
  async chat(userMessage, sessionId = 'default') {
    const session = this.getSession(sessionId);
    const context = await this.getContext();

    session.messages.push({ role: 'user', content: userMessage });

    // Try Claude first if online
    if (this.mode === 'hybrid' || this.mode === 'online') {
      if (this.isOnline && this.anthropic) {
        try {
          return await this.chatWithClaude(session, context, sessionId);
        } catch (error) {
          logger.warn('Claude API failed, falling back to local:', error.message);
          this.isOnline = false;
        }
      }
    }

    // Fallback to local intent processing
    return await this.chatWithLocal(userMessage, session, context, sessionId);
  }

  /**
   * Streaming chat - routes to Claude or local
   */
  async chatStream(userMessage, sessionId, onChunk) {
    const session = this.getSession(sessionId);
    const context = await this.getContext();

    session.messages.push({ role: 'user', content: userMessage });

    // Try Claude first if online
    if ((this.mode === 'hybrid' || this.mode === 'online') && this.isOnline && this.anthropic) {
      try {
        await this.streamWithClaude(session, context, onChunk, sessionId);
        this.sessions.set(sessionId, session);
        return;
      } catch (error) {
        logger.warn('Claude streaming failed, falling back to local:', error.message);
        this.isOnline = false;
      }
    }

    // Fallback to local - simulate streaming
    const result = await this.chatWithLocal(userMessage, session, context, sessionId);

    // Stream the response word by word for UX
    const words = result.message.split(' ');
    for (const word of words) {
      onChunk({ type: 'text', content: word + ' ' });
      await new Promise(r => setTimeout(r, 20)); // Small delay for streaming feel
    }

    this.sessions.set(sessionId, session);
  }

  async chatWithClaude(session, context, sessionId) {
    const tools = this.toolBridge.getToolDefinitions();
    const contextPrompt = this.buildContextPrompt(context);

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: this.systemPrompt + '\n\n' + contextPrompt,
      messages: session.messages,
      tools,
    });

    // Handle tool calls
    if (response.stop_reason === 'tool_use') {
      const toolResults = [];
      for (const content of response.content) {
        if (content.type === 'tool_use') {
          const result = await this.toolBridge.execute(content.name, content.input);
          this.logAction(content.name, content.input, result, sessionId);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id,
            content: JSON.stringify(result),
          });
        }
      }

      session.messages.push({ role: 'assistant', content: response.content });
      session.messages.push({ role: 'user', content: toolResults });

      // Get final response
      const finalResponse = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: this.systemPrompt + '\n\n' + contextPrompt,
        messages: session.messages,
        tools,
      });

      const assistantMessage = finalResponse.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      session.messages.push({ role: 'assistant', content: assistantMessage });
      this.sessions.set(sessionId, session);

      return {
        message: assistantMessage,
        toolsUsed: response.content.filter(c => c.type === 'tool_use'),
        mode: 'online',
        sessionId,
      };
    }

    // Regular text response
    const assistantMessage = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    session.messages.push({ role: 'assistant', content: assistantMessage });
    this.sessions.set(sessionId, session);

    return { message: assistantMessage, mode: 'online', sessionId };
  }

  async streamWithClaude(session, context, onChunk, sessionId) {
    const tools = this.toolBridge.getToolDefinitions();
    const contextPrompt = this.buildContextPrompt(context);

    await this._processStreamWithTools(
      session,
      tools,
      this.systemPrompt + '\n\n' + contextPrompt,
      onChunk,
      sessionId,
      0
    );
  }

  async _processStreamWithTools(session, tools, systemPrompt, onChunk, sessionId, depth = 0) {
    const MAX_DEPTH = 5;
    if (depth >= MAX_DEPTH) {
      logger.warn('Max tool depth reached');
      return;
    }

    const stream = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: session.messages,
      tools,
      stream: true,
    });

    let fullTextResponse = '';
    let contentBlocks = [];
    let currentToolUse = null;
    let currentToolInput = '';
    let stopReason = null;

    for await (const event of stream) {
      if (event.type === 'message_delta' && event.delta.stop_reason) {
        stopReason = event.delta.stop_reason;
      }

      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullTextResponse += event.delta.text;
        onChunk({ type: 'text', content: event.delta.text });
      }

      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        currentToolUse = {
          type: 'tool_use',
          id: event.content_block.id,
          name: event.content_block.name,
          input: {},
        };
        currentToolInput = '';
      }

      if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
        currentToolInput += event.delta.partial_json;
      }

      if (event.type === 'content_block_stop') {
        if (currentToolUse) {
          try {
            currentToolUse.input = currentToolInput ? JSON.parse(currentToolInput) : {};
          } catch (e) {
            currentToolUse.input = {};
          }
          contentBlocks.push(currentToolUse);
          currentToolUse = null;
          currentToolInput = '';
        }
      }
    }

    if (fullTextResponse && !contentBlocks.some(b => b.type === 'text')) {
      contentBlocks.unshift({ type: 'text', text: fullTextResponse });
    }

    if (contentBlocks.length > 0) {
      session.messages.push({ role: 'assistant', content: contentBlocks });
    }

    if (stopReason === 'tool_use') {
      const toolUseBlocks = contentBlocks.filter(b => b.type === 'tool_use');
      onChunk({ type: 'tools', content: toolUseBlocks });

      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        onChunk({ type: 'tool_status', tool: toolUse.name, status: 'executing' });

        try {
          const result = await this.toolBridge.execute(toolUse.name, toolUse.input);
          this.logAction(toolUse.name, toolUse.input, result, sessionId);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
          onChunk({ type: 'tool_status', tool: toolUse.name, status: 'complete', result });
        } catch (error) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: error.message }),
            is_error: true,
          });
          onChunk({ type: 'tool_status', tool: toolUse.name, status: 'error', error: error.message });
        }
      }

      session.messages.push({ role: 'user', content: toolResults });
      await this._processStreamWithTools(session, tools, systemPrompt, onChunk, sessionId, depth + 1);
    }
  }

  async chatWithLocal(userMessage, session, context, sessionId) {
    // Use local intent service
    const result = await this.localIntent.process(userMessage, context);

    if (result.action && result.executed) {
      this.logAction(result.action, result.params, result, sessionId);
    }

    session.messages.push({ role: 'assistant', content: result.message });
    this.sessions.set(sessionId, session);

    return {
      message: result.message,
      mode: 'offline',
      action: result.action,
      sessionId,
    };
  }

  buildContextPrompt(context) {
    const lines = ['CURRENT SYSTEM STATE:'];

    if (context.playback.state === 'playing') {
      const active = Object.values(context.playback.active)[0];
      if (active) {
        lines.push(`- Now playing: ${active.id || 'unknown'}`);
      }
    } else {
      lines.push('- Nothing currently playing');
    }

    lines.push(`- Nodes: ${context.nodes.online}/${context.nodes.total} online`);
    if (context.nodes.warnings.length > 0) {
      lines.push(`- Warnings: ${context.nodes.warnings.join(', ')}`);
    }

    lines.push(`- Time: ${context.time.timeOfDay} (${context.time.dayOfWeek}, ${context.time.hour}:00)`);
    lines.push(`- System: ${context.system.healthy ? 'healthy' : 'issues detected'}`);

    return lines.join('\n');
  }

  // Legacy compatibility methods
  async executeTool(toolName, input) {
    return this.toolBridge.execute(toolName, input);
  }

  getConfig() {
    return {
      mode: this.mode,
      isOnline: this.isOnline,
      model: this.model,
    };
  }

  updateConfig(newConfig) {
    if (newConfig.mode) this.mode = newConfig.mode;
  }
}

export default new AIOrchestrator();
