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
    if (!sessionId || !this.sessions.has(sessionId)) {
      return { messages: [], context: {} };
    }
    return this.sessions.get(sessionId);
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
            const result = await this.executeTool(
              content.name,
              content.input.action,
              content.input.args
            );
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
      const stream = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: this.systemPrompt,
        messages: session.messages,
        tools: tools,
        stream: true,
      });

      let fullResponse = '';
      let toolCalls = [];

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullResponse += event.delta.text;
          onChunk({ type: 'text', content: event.delta.text });
        }
        
        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          toolCalls.push(event.content_block);
        }
      }

      // Handle tool calls if any
      if (toolCalls.length > 0) {
        onChunk({ type: 'tools', content: toolCalls });
      }

      session.messages.push({
        role: 'assistant',
        content: fullResponse,
      });

      this.sessions.set(sessionId, session);

    } catch (error) {
      logger.error('Claude streaming error:', error);
      throw error;
    }
  }

  async executeTool(tool, action, args) {
    return this.toolBridge.execute(tool, action, args);
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

export default new AIService();
