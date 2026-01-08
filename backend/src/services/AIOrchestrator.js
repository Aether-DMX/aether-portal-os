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
    this.pendingConfirmations = new Map(); // sessionId -> pending action

    // Mode: 'online' | 'offline' | 'hybrid'
    this.mode = 'hybrid';
    this.isOnline = null; // null = unknown, true/false = tested

    // Safety confirmation tiers
    this.confirmationTiers = {
      // Tier 0: No confirmation needed (read-only, safe)
      safe: [
        'get_dmx_state', 'list_scenes', 'list_chases', 'list_fixtures',
        'list_nodes', 'get_scene', 'get_chase', 'playback_status',
        'system_health', 'system_stats'
      ],
      // Tier 1: Low risk - execute with notice
      low: [
        'set_channels', 'play_scene', 'stop_playback', 'blackout'
      ],
      // Tier 2: Medium risk - warn if interrupting
      medium: [
        'play_chase', 'create_scene', 'create_chase'
      ],
      // Tier 3: High risk - require explicit confirmation
      high: [
        'delete_scene', 'delete_chase', 'strobe_effect'
      ]
    };

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
        // Conversation memory for follow-up edits
        memory: {
          lastCreatedScene: null,    // { id, name, channels }
          lastCreatedChase: null,    // { id, name, steps, bpm }
          lastPlayedScene: null,     // { id, name }
          lastPlayedChase: null,     // { id, name }
          recentActions: [],         // Last 10 actions for context
        },
      });
    }
    const session = this.sessions.get(sessionId);
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Update session memory after an action
   */
  updateSessionMemory(sessionId, actionType, data) {
    const session = this.getSession(sessionId);
    const memory = session.memory;

    switch (actionType) {
      case 'create_scene':
        memory.lastCreatedScene = {
          id: data.scene_id || data.id,
          name: data.name,
          channels: data.channels,
          timestamp: Date.now(),
        };
        break;
      case 'create_chase':
        memory.lastCreatedChase = {
          id: data.chase_id || data.id,
          name: data.name,
          steps: data.steps,
          bpm: data.bpm,
          timestamp: Date.now(),
        };
        break;
      case 'play_scene':
        memory.lastPlayedScene = {
          id: data.scene_id || data.id,
          name: data.name,
          timestamp: Date.now(),
        };
        break;
      case 'play_chase':
        memory.lastPlayedChase = {
          id: data.chase_id || data.id,
          name: data.name,
          timestamp: Date.now(),
        };
        break;
    }

    // Track recent actions (keep last 10)
    memory.recentActions.push({
      action: actionType,
      data: { id: data.id || data.scene_id || data.chase_id, name: data.name },
      timestamp: Date.now(),
    });
    if (memory.recentActions.length > 10) {
      memory.recentActions = memory.recentActions.slice(-10);
    }
  }

  /**
   * Get session memory for context injection
   */
  getSessionMemory(sessionId) {
    const session = this.getSession(sessionId);
    const memory = session.memory;
    const summary = [];

    if (memory.lastCreatedScene) {
      const ago = Math.round((Date.now() - memory.lastCreatedScene.timestamp) / 1000 / 60);
      summary.push(`Last created scene: "${memory.lastCreatedScene.name}" (${ago}min ago)`);
    }
    if (memory.lastCreatedChase) {
      const ago = Math.round((Date.now() - memory.lastCreatedChase.timestamp) / 1000 / 60);
      summary.push(`Last created chase: "${memory.lastCreatedChase.name}" (${ago}min ago)`);
    }
    if (memory.lastPlayedScene) {
      summary.push(`Last played scene: "${memory.lastPlayedScene.name}"`);
    }
    if (memory.lastPlayedChase) {
      summary.push(`Last played chase: "${memory.lastPlayedChase.name}"`);
    }

    return {
      ...memory,
      summary: summary.join('. '),
    };
  }

  /**
   * Update memory based on tool execution results
   */
  updateMemoryFromToolResult(sessionId, toolName, input, result) {
    // Map tool calls to memory update actions
    if (toolName === 'scene') {
      if (input.action === 'create' && result.scene_id) {
        this.updateSessionMemory(sessionId, 'create_scene', {
          scene_id: result.scene_id,
          name: input.name,
          channels: input.channels,
        });
      } else if (input.action === 'play' && input.scene_id) {
        this.updateSessionMemory(sessionId, 'play_scene', {
          scene_id: input.scene_id,
          name: result.message || input.scene_id,
        });
      }
    } else if (toolName === 'chase') {
      if (input.action === 'create' && result.chase_id) {
        this.updateSessionMemory(sessionId, 'create_chase', {
          chase_id: result.chase_id,
          name: input.name,
          steps: input.steps,
          bpm: input.bpm,
        });
      } else if (input.action === 'play' && input.chase_id) {
        this.updateSessionMemory(sessionId, 'play_chase', {
          chase_id: input.chase_id,
          name: result.message || input.chase_id,
        });
      }
    }
  }

  clearSession(sessionId) {
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get current system context for injection into prompts
   * Includes fixtures, scenes, chases, nodes, and playback state
   */
  async getContext() {
    try {
      const [playback, nodes, health, fixtures, scenes, chases] = await Promise.all([
        this.fetchJSON('/api/playback/status').catch(() => ({})),
        this.fetchJSON('/api/nodes').catch(() => []),
        this.fetchJSON('/api/health').catch(() => ({})),
        this.fetchJSON('/api/fixtures').catch(() => []),
        this.fetchJSON('/api/scenes').catch(() => []),
        this.fetchJSON('/api/chases').catch(() => []),
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

      // Parse fixture data for channel mapping
      const fixtureMap = Array.isArray(fixtures) ? fixtures.map(f => ({
        name: f.name,
        type: f.type || f.fixture_type,
        universe: f.universe || 1,
        startChannel: f.startAddress || f.start_address || f.channel_start,
        endChannel: f.endAddress || f.end_address || f.channel_end,
        channelLayout: f.channelLayout || f.channel_layout || this.inferChannelLayout(f),
      })) : [];

      // Summarize scenes (with channel info for recent/relevant ones)
      const sceneSummary = Array.isArray(scenes) ? scenes.slice(0, 20).map(s => {
        const channels = typeof s.channels === 'string' ? JSON.parse(s.channels || '{}') : (s.channels || {});
        return {
          id: s.scene_id || s.id,
          name: s.name,
          channelCount: Object.keys(channels).length,
          color: s.color,
          // Include channel preview for quick reference
          preview: this.getChannelPreview(channels),
        };
      }) : [];

      // Summarize chases
      const chaseSummary = Array.isArray(chases) ? chases.slice(0, 20).map(c => {
        const steps = typeof c.steps === 'string' ? JSON.parse(c.steps || '[]') : (c.steps || []);
        return {
          id: c.chase_id || c.id,
          name: c.name,
          bpm: c.bpm || 120,
          stepCount: steps.length,
          loop: c.loop !== false,
        };
      }) : [];

      // Build node detail with channel ranges
      const nodeDetails = pairedNodes.map(n => ({
        id: n.node_id,
        name: n.name,
        status: n.status,
        universe: n.universe,
        channels: n.channel_start && n.channel_end ? `${n.channel_start}-${n.channel_end}` : 'all',
        type: n.type || 'wifi',
      }));

      return {
        playback: {
          state: Object.keys(playback).length > 0 ? 'playing' : 'idle',
          active: playback,
        },
        nodes: {
          online: onlineNodes.length,
          offline: offlineNodes.length,
          total: pairedNodes.length,
          details: nodeDetails,
          warnings: offlineNodes.map(n => `${n.name || n.node_id} offline`),
        },
        fixtures: {
          count: fixtureMap.length,
          items: fixtureMap,
        },
        scenes: {
          count: scenes.length,
          items: sceneSummary,
        },
        chases: {
          count: chases.length,
          items: chaseSummary,
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
        nodes: { online: 0, offline: 0, total: 0, details: [], warnings: [] },
        fixtures: { count: 0, items: [] },
        scenes: { count: 0, items: [] },
        chases: { count: 0, items: [] },
        time: { timeOfDay: 'unknown', hour: new Date().getHours() },
        system: { healthy: false },
        aiMode: this.isOnline ? 'online' : 'offline',
      };
    }
  }

  /**
   * Infer channel layout from fixture type
   */
  inferChannelLayout(fixture) {
    const type = (fixture.type || fixture.fixture_type || '').toLowerCase();
    const channelCount = (fixture.endAddress || fixture.end_address || fixture.channel_end || 0) -
                        (fixture.startAddress || fixture.start_address || fixture.channel_start || 0) + 1;

    // Common fixture profiles
    if (type.includes('rgb') || type.includes('par')) {
      if (channelCount >= 7) return ['dimmer', 'red', 'green', 'blue', 'white', 'strobe', 'mode'];
      if (channelCount >= 4) return ['red', 'green', 'blue', 'dimmer'];
      if (channelCount >= 3) return ['red', 'green', 'blue'];
    }
    if (type.includes('moving') || type.includes('wash')) {
      return ['pan', 'pan_fine', 'tilt', 'tilt_fine', 'dimmer', 'red', 'green', 'blue', 'white', 'strobe'];
    }
    if (type.includes('dimmer')) {
      return Array(channelCount).fill('dimmer');
    }
    // Default: assume RGBW
    if (channelCount >= 4) return ['red', 'green', 'blue', 'white'];
    if (channelCount >= 3) return ['red', 'green', 'blue'];
    return ['dimmer'];
  }

  /**
   * Get a brief preview of channel values (for context)
   */
  getChannelPreview(channels) {
    if (!channels || Object.keys(channels).length === 0) return null;

    // Extract RGB if present
    const entries = Object.entries(channels);
    const r = channels['1:1'] ?? channels['1'] ?? channels[1];
    const g = channels['1:2'] ?? channels['2'] ?? channels[2];
    const b = channels['1:3'] ?? channels['3'] ?? channels[3];

    if (r !== undefined && g !== undefined && b !== undefined) {
      return { type: 'rgb', r, g, b };
    }

    // Return first few channels
    return {
      type: 'channels',
      sample: entries.slice(0, 4).map(([k, v]) => `${k}:${v}`).join(', ')
    };
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
   * Get the confirmation tier for an action
   */
  getActionTier(actionName) {
    if (this.confirmationTiers.safe.includes(actionName)) return 'safe';
    if (this.confirmationTiers.low.includes(actionName)) return 'low';
    if (this.confirmationTiers.medium.includes(actionName)) return 'medium';
    if (this.confirmationTiers.high.includes(actionName)) return 'high';
    return 'medium'; // Default to medium for unknown actions
  }

  /**
   * Check if an action requires confirmation based on context
   */
  async requiresConfirmation(actionName, params, context) {
    const tier = this.getActionTier(actionName);

    // Safe actions never need confirmation
    if (tier === 'safe') {
      return { required: false };
    }

    // High-risk actions always need confirmation
    if (tier === 'high') {
      return {
        required: true,
        reason: this.getConfirmationReason(actionName, params),
        severity: 'high'
      };
    }

    // Check for strobe effects with high frequency
    if (actionName === 'play_chase' && params) {
      const speed = params.speed || params.stepDuration || 500;
      if (speed < 100) { // Less than 100ms = >10Hz strobe
        return {
          required: true,
          reason: 'This chase has a very fast speed (>10Hz). This could cause strobing effects.',
          severity: 'high'
        };
      }
    }

    // Medium-risk actions need confirmation if interrupting playback
    if (tier === 'medium' && context.playback?.state === 'playing') {
      return {
        required: true,
        reason: 'This will interrupt the currently playing scene/chase.',
        severity: 'medium'
      };
    }

    return { required: false };
  }

  getConfirmationReason(actionName, params) {
    switch (actionName) {
      case 'delete_scene':
        return `Delete scene "${params?.id || params?.name || 'unknown'}"? This cannot be undone.`;
      case 'delete_chase':
        return `Delete chase "${params?.id || params?.name || 'unknown'}"? This cannot be undone.`;
      case 'strobe_effect':
        return 'Enable strobe effect? This may cause discomfort for some viewers.';
      default:
        return 'This action may have significant effects. Continue?';
    }
  }

  /**
   * Store a pending confirmation for a session
   */
  setPendingConfirmation(sessionId, action, params, reason) {
    this.pendingConfirmations.set(sessionId, {
      action,
      params,
      reason,
      timestamp: Date.now()
    });
    // Auto-expire after 60 seconds
    setTimeout(() => {
      const pending = this.pendingConfirmations.get(sessionId);
      if (pending && pending.timestamp === Date.now()) {
        this.pendingConfirmations.delete(sessionId);
      }
    }, 60000);
  }

  /**
   * Get and clear pending confirmation for a session
   */
  getPendingConfirmation(sessionId) {
    const pending = this.pendingConfirmations.get(sessionId);
    if (pending) {
      this.pendingConfirmations.delete(sessionId);
    }
    return pending;
  }

  /**
   * Check if user message is a confirmation response
   */
  isConfirmationResponse(message) {
    const normalized = message.toLowerCase().trim();
    const confirmWords = ['yes', 'yeah', 'yep', 'ok', 'okay', 'sure', 'do it', 'confirm', 'proceed', 'go ahead', 'y'];
    const denyWords = ['no', 'nope', 'cancel', 'stop', 'don\'t', 'dont', 'n', 'nevermind', 'never mind'];

    if (confirmWords.some(w => normalized === w || normalized.startsWith(w + ' '))) {
      return 'confirm';
    }
    if (denyWords.some(w => normalized === w || normalized.startsWith(w + ' '))) {
      return 'deny';
    }
    return null;
  }

  /**
   * Main chat method - routes to Claude or local fallback
   */
  async chat(userMessage, sessionId = 'default') {
    const session = this.getSession(sessionId);
    const context = await this.getContext();

    // Check for pending confirmation first
    const pending = this.pendingConfirmations.get(sessionId);
    if (pending) {
      const response = this.isConfirmationResponse(userMessage);
      if (response === 'confirm') {
        this.pendingConfirmations.delete(sessionId);
        // Execute the pending action
        const result = await this.toolBridge.execute(pending.action, pending.params);
        this.logAction(pending.action, pending.params, result, sessionId);
        session.messages.push({ role: 'user', content: userMessage });
        const confirmMsg = result.success !== false
          ? `Done. ${result.message || 'Action completed successfully.'}`
          : `Failed: ${result.error || 'Unknown error'}`;
        session.messages.push({ role: 'assistant', content: confirmMsg });
        this.sessions.set(sessionId, session);
        return { message: confirmMsg, mode: 'confirmed', sessionId };
      } else if (response === 'deny') {
        this.pendingConfirmations.delete(sessionId);
        session.messages.push({ role: 'user', content: userMessage });
        const cancelMsg = 'Cancelled. What else can I help with?';
        session.messages.push({ role: 'assistant', content: cancelMsg });
        this.sessions.set(sessionId, session);
        return { message: cancelMsg, mode: 'cancelled', sessionId };
      }
      // Not a confirmation response, clear pending and process normally
      this.pendingConfirmations.delete(sessionId);
    }

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

    // Check for pending confirmation first
    const pending = this.pendingConfirmations.get(sessionId);
    if (pending) {
      const response = this.isConfirmationResponse(userMessage);
      if (response === 'confirm') {
        this.pendingConfirmations.delete(sessionId);
        onChunk({ type: 'tool_status', tool: pending.action, status: 'executing' });
        const result = await this.toolBridge.execute(pending.action, pending.params);
        this.logAction(pending.action, pending.params, result, sessionId);
        onChunk({ type: 'tool_status', tool: pending.action, status: 'complete', result });
        session.messages.push({ role: 'user', content: userMessage });
        const confirmMsg = result.success !== false
          ? `Done. ${result.message || 'Action completed successfully.'}`
          : `Failed: ${result.error || 'Unknown error'}`;
        // Stream the response
        for (const word of confirmMsg.split(' ')) {
          onChunk({ type: 'text', content: word + ' ' });
        }
        session.messages.push({ role: 'assistant', content: confirmMsg });
        this.sessions.set(sessionId, session);
        return;
      } else if (response === 'deny') {
        this.pendingConfirmations.delete(sessionId);
        session.messages.push({ role: 'user', content: userMessage });
        const cancelMsg = 'Cancelled. What else can I help with?';
        for (const word of cancelMsg.split(' ')) {
          onChunk({ type: 'text', content: word + ' ' });
        }
        session.messages.push({ role: 'assistant', content: cancelMsg });
        this.sessions.set(sessionId, session);
        return;
      }
      this.pendingConfirmations.delete(sessionId);
    }

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
    const contextPrompt = this.buildContextPrompt(context, sessionId);

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
          // Check if this action requires confirmation
          const confirmCheck = await this.requiresConfirmation(content.name, content.input, context);

          if (confirmCheck.required) {
            // Store pending confirmation
            this.setPendingConfirmation(sessionId, content.name, content.input, confirmCheck.reason);
            session.messages.push({ role: 'assistant', content: response.content });
            this.sessions.set(sessionId, session);
            return {
              message: confirmCheck.reason,
              needsConfirmation: true,
              pendingAction: content.name,
              severity: confirmCheck.severity,
              mode: 'online',
              sessionId,
            };
          }

          const result = await this.toolBridge.execute(content.name, content.input);
          this.logAction(content.name, content.input, result, sessionId);

          // Update session memory for relevant actions
          if (result.success !== false) {
            this.updateMemoryFromToolResult(sessionId, content.name, content.input, result);
          }

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
    const contextPrompt = this.buildContextPrompt(context, sessionId);

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

      // Get current context for confirmation checks
      const context = await this.getContext();

      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        // Check if this action requires confirmation
        const confirmCheck = await this.requiresConfirmation(toolUse.name, toolUse.input, context);

        if (confirmCheck.required) {
          // Store pending confirmation and ask user
          this.setPendingConfirmation(sessionId, toolUse.name, toolUse.input, confirmCheck.reason);
          onChunk({ type: 'confirmation_required', tool: toolUse.name, reason: confirmCheck.reason, severity: confirmCheck.severity });

          // Return a "needs confirmation" result to Claude
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({
              status: 'confirmation_required',
              message: confirmCheck.reason,
              instruction: 'Ask the user to confirm before proceeding.'
            }),
          });
          continue;
        }

        onChunk({ type: 'tool_status', tool: toolUse.name, status: 'executing' });

        try {
          const result = await this.toolBridge.execute(toolUse.name, toolUse.input);
          this.logAction(toolUse.name, toolUse.input, result, sessionId);

          // Update session memory for relevant actions
          if (result.success !== false) {
            this.updateMemoryFromToolResult(sessionId, toolUse.name, toolUse.input, result);
          }

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

  buildContextPrompt(context, sessionId = null) {
    const lines = ['## CURRENT SYSTEM STATE'];

    // Playback status
    if (context.playback.state === 'playing') {
      const active = Object.values(context.playback.active)[0];
      if (active) {
        lines.push(`**Now playing:** ${active.id || 'unknown'}`);
      }
    } else {
      lines.push('**Playback:** idle (nothing playing)');
    }

    // Time and system
    lines.push(`**Time:** ${context.time.timeOfDay} (${context.time.dayOfWeek}, ${context.time.hour}:00)`);
    lines.push(`**System:** ${context.system.healthy ? 'healthy' : 'issues detected'}`);

    // Nodes with details
    lines.push(`\n## NODES (${context.nodes.online}/${context.nodes.total} online)`);
    if (context.nodes.details && context.nodes.details.length > 0) {
      context.nodes.details.forEach(n => {
        const status = n.status === 'online' ? '✓' : '✗';
        lines.push(`- ${status} ${n.name}: Universe ${n.universe}, channels ${n.channels}`);
      });
    }
    if (context.nodes.warnings.length > 0) {
      lines.push(`**Warnings:** ${context.nodes.warnings.join(', ')}`);
    }

    // Fixtures
    if (context.fixtures && context.fixtures.count > 0) {
      lines.push(`\n## FIXTURES (${context.fixtures.count} patched)`);
      context.fixtures.items.forEach(f => {
        const layout = Array.isArray(f.channelLayout) ? f.channelLayout.join(', ') : 'unknown';
        lines.push(`- **${f.name}** (${f.type}): Universe ${f.universe}, channels ${f.startChannel}-${f.endChannel} [${layout}]`);
      });
    } else {
      lines.push('\n## FIXTURES: None patched yet (guide user to add fixtures for smarter control)');
    }

    // Scenes summary
    if (context.scenes && context.scenes.count > 0) {
      lines.push(`\n## SCENES (${context.scenes.count} saved)`);
      context.scenes.items.slice(0, 10).forEach(s => {
        let preview = '';
        if (s.preview) {
          if (s.preview.type === 'rgb') {
            preview = ` [RGB: ${s.preview.r}, ${s.preview.g}, ${s.preview.b}]`;
          } else if (s.preview.sample) {
            preview = ` [${s.preview.sample}]`;
          }
        }
        lines.push(`- "${s.name}" (${s.channelCount} ch)${preview}`);
      });
      if (context.scenes.count > 10) {
        lines.push(`  ...and ${context.scenes.count - 10} more`);
      }
    } else {
      lines.push('\n## SCENES: None created yet');
    }

    // Chases summary
    if (context.chases && context.chases.count > 0) {
      lines.push(`\n## CHASES (${context.chases.count} saved)`);
      context.chases.items.slice(0, 10).forEach(c => {
        lines.push(`- "${c.name}" (${c.stepCount} steps, ${c.bpm} BPM, ${c.loop ? 'loop' : 'once'})`);
      });
      if (context.chases.count > 10) {
        lines.push(`  ...and ${context.chases.count - 10} more`);
      }
    } else {
      lines.push('\n## CHASES: None created yet');
    }

    // Session memory (if available)
    if (sessionId) {
      const memory = this.getSessionMemory(sessionId);
      if (memory.summary) {
        lines.push(`\n## CONVERSATION MEMORY`);
        lines.push(memory.summary);
      }
      if (memory.recentActions && memory.recentActions.length > 0) {
        lines.push(`Recent actions: ${memory.recentActions.slice(-5).map(a => a.action).join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Check if there's a pending confirmation for a session
   */
  hasPendingConfirmation(sessionId) {
    return this.pendingConfirmations.has(sessionId);
  }

  /**
   * Get pending confirmation details (without clearing)
   */
  getPendingConfirmationDetails(sessionId) {
    return this.pendingConfirmations.get(sessionId) || null;
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
      hasApiKey: !!this.apiKey,
    };
  }

  updateConfig(newConfig) {
    if (newConfig.mode) this.mode = newConfig.mode;
    if (newConfig.model) this.model = newConfig.model;

    // Handle API key update
    if (newConfig.apiKey !== undefined) {
      this.apiKey = newConfig.apiKey;
      // Reinitialize Anthropic client with new key
      if (this.apiKey) {
        this.anthropic = new Anthropic({ apiKey: this.apiKey });
        logger.info('API key updated, reinitializing Claude client');
        // Immediately check if new key works
        this.checkOnlineStatus();
      } else {
        this.anthropic = null;
        this.isOnline = false;
        logger.info('API key cleared, Claude offline');
      }
    }
  }
}

export default new AIOrchestrator();
