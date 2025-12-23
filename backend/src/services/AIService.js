import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';
import ToolBridge from './tools/ToolBridge.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || 'YOUR_CLAUDE_API_KEY_HERE';
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096;

    this.anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    this.toolBridge = new ToolBridge();
    this.sessions = new Map();
    this.systemPrompt = this.loadSystemPrompt();

    this.config = {
      confirmationRules: true,
      safetyWarnings: true,
      autoExecuteTools: false,
    };

    // Session TTL: 24 hours in milliseconds
    this.SESSION_TTL_MS = 24 * 60 * 60 * 1000;

    // Run session cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    logger.info('AIService initialized with 24h session TTL');
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity && (now - session.lastActivity) > this.SESSION_TTL_MS) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired session(s)`);
    }
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
    
    // Default AETHER system prompt
    return `You are AETHER, the on-device AI assistant for the AETHER DMX touchscreen controller (Raspberry Pi 5 kiosk).

Your job is twofold:
1) Control & optimize live lighting - regulate DMX output for smooth, safe, flicker-free results; monitor system health; auto-correct common issues.
2) Design & automate - translate natural language into working lighting programs: scenes, chases, dynamic shows, pixel maps, and schedules.

You run as an embedded assistant. You must be proactive, clear, and safe. Use available tools to carry out user requests.

SAFETY RULES:
- Never trigger high-risk effects (strobe > 10 Hz, snap, UV) without explicit confirmation.
- If a command could interrupt a running show, warn and offer a safe handover/fade.
- Always ask before executing live changes that may flash the room.

TOOL EXECUTION:
When using tools, always:
1. Explain what you're about to do
2. Show the tool call in a code block
3. Wait for results
4. Summarize the outcome

Be concise, confident, and constructive.`;
  }

  getSession(sessionId) {
    if (!sessionId) {
      sessionId = 'default';
    }

    if (!this.sessions.has(sessionId)) {
      // Create new session with timestamp
      const newSession = {
        messages: [],
        context: {},
        lastActivity: Date.now(),
        createdAt: Date.now()
      };
      this.sessions.set(sessionId, newSession);
      return newSession;
    }

    // Update lastActivity on access
    const session = this.sessions.get(sessionId);
    session.lastActivity = Date.now();
    return session;
  }

  clearSession(sessionId) {
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
  }

  async chat(userMessage, sessionId = 'default') {
    const session = this.getSession(sessionId);
    
    session.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.toolBridge.getToolDefinitions();

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: this.systemPrompt,
        messages: session.messages,
        tools: tools,
      });

      // Handle tool calls
      if (response.stop_reason === 'tool_use') {
        const toolResults = [];

        for (const content of response.content) {
          if (content.type === 'tool_use') {
            // Pass the full input object to ToolBridge
            const result = await this.executeTool(content.name, content.input);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: content.id,
              content: JSON.stringify(result),
            });
          }
        }

        // Add assistant message with tool use
        session.messages.push({
          role: 'assistant',
          content: response.content,
        });

        // Add tool results
        session.messages.push({
          role: 'user',
          content: toolResults,
        });

        // Get final response after tool execution
        const finalResponse = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          system: this.systemPrompt,
          messages: session.messages,
          tools: tools,
        });

        const assistantMessage = finalResponse.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');

        session.messages.push({
          role: 'assistant',
          content: assistantMessage,
        });

        this.sessions.set(sessionId, session);

        return {
          message: assistantMessage,
          toolsUsed: response.content.filter(c => c.type === 'tool_use'),
          sessionId,
        };
      }

      // Regular text response
      const assistantMessage = response.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      session.messages.push({
        role: 'assistant',
        content: assistantMessage,
      });

      this.sessions.set(sessionId, session);

      return {
        message: assistantMessage,
        sessionId,
      };
    } catch (error) {
      logger.error('Claude API error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  async chatStream(userMessage, sessionId, onChunk) {
    const session = this.getSession(sessionId);

    session.messages.push({
      role: 'user',
      content: userMessage,
    });

    const tools = this.toolBridge.getToolDefinitions();

    try {
      await this._processStreamWithTools(session, tools, onChunk);
      this.sessions.set(sessionId, session);
    } catch (error) {
      logger.error('Claude streaming error:', error);
      throw error;
    }
  }

  async _processStreamWithTools(session, tools, onChunk, depth = 0) {
    // Prevent infinite tool loops
    const MAX_TOOL_DEPTH = 5;
    if (depth >= MAX_TOOL_DEPTH) {
      logger.warn('Max tool depth reached, stopping tool execution');
      return;
    }

    const stream = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: this.systemPrompt,
      messages: session.messages,
      tools: tools,
      stream: true,
    });

    let fullTextResponse = '';
    let contentBlocks = [];
    let currentToolUse = null;
    let currentToolInput = '';
    let stopReason = null;

    for await (const event of stream) {
      // Track stop reason
      if (event.type === 'message_delta' && event.delta.stop_reason) {
        stopReason = event.delta.stop_reason;
      }

      // Handle text deltas - stream to client
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullTextResponse += event.delta.text;
        onChunk({ type: 'text', content: event.delta.text });
      }

      // Handle tool use start
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        currentToolUse = {
          type: 'tool_use',
          id: event.content_block.id,
          name: event.content_block.name,
          input: {}
        };
        currentToolInput = '';
      }

      // Handle tool input deltas (JSON comes in chunks)
      if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
        currentToolInput += event.delta.partial_json;
      }

      // Handle content block stop - finalize tool or text
      if (event.type === 'content_block_stop') {
        if (currentToolUse) {
          // Parse accumulated JSON input
          try {
            currentToolUse.input = currentToolInput ? JSON.parse(currentToolInput) : {};
          } catch (e) {
            logger.error('Failed to parse tool input JSON:', currentToolInput);
            currentToolUse.input = {};
          }
          contentBlocks.push(currentToolUse);
          currentToolUse = null;
          currentToolInput = '';
        } else if (fullTextResponse) {
          // Only add text block if we haven't already
          const hasTextBlock = contentBlocks.some(b => b.type === 'text');
          if (!hasTextBlock) {
            contentBlocks.push({ type: 'text', text: fullTextResponse });
          }
        }
      }
    }

    // Ensure text is captured if no explicit text block was added
    if (fullTextResponse && !contentBlocks.some(b => b.type === 'text')) {
      contentBlocks.unshift({ type: 'text', text: fullTextResponse });
    }

    // Save assistant message with full content (text + tool_use blocks)
    if (contentBlocks.length > 0) {
      session.messages.push({
        role: 'assistant',
        content: contentBlocks,
      });
    }

    // If Claude wants to use tools, execute them and continue
    if (stopReason === 'tool_use') {
      const toolUseBlocks = contentBlocks.filter(b => b.type === 'tool_use');

      // Notify client about tool execution
      onChunk({ type: 'tools', content: toolUseBlocks });

      // Execute each tool and collect results
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        onChunk({ type: 'tool_status', tool: toolUse.name, status: 'executing' });

        try {
          const result = await this.executeTool(toolUse.name, toolUse.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
          onChunk({ type: 'tool_status', tool: toolUse.name, status: 'complete', result });
        } catch (error) {
          logger.error(`Tool execution error for ${toolUse.name}:`, error);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: error.message }),
            is_error: true,
          });
          onChunk({ type: 'tool_status', tool: toolUse.name, status: 'error', error: error.message });
        }
      }

      // Add tool results to conversation
      session.messages.push({
        role: 'user',
        content: toolResults,
      });

      // Recursively process Claude's response to tool results
      await this._processStreamWithTools(session, tools, onChunk, depth + 1);
    }
  }

  async executeTool(toolName, input) {
    return this.toolBridge.execute(toolName, input);
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

export default new AIService();
