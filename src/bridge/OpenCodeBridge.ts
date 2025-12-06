import { Bot } from 'mineflayer';
import { OpenCodeClient } from './OpenCodeClient';

type ToolCall = {
    type: 'tool_use';
    name: string;
    input: any;
};

export class OpenCodeBridge {
    private bot: Bot;
    private client: OpenCodeClient;
    private model: { providerID: string, modelID: string } | undefined;

    constructor(bot: Bot, client: OpenCodeClient, model?: { providerID: string, modelID: string }) {
        this.bot = bot;
        this.client = client;
        this.model = model;
    }

    public async handleChat(username: string, message: string) {
        // Ignore messages from the bot itself
        if (username === this.bot.username) return;

        console.log(`[Bridge] Received chat from ${username}: ${message}`);

        // Format the message for the agent
        const prompt = `[Minecraft User ${username}]: ${message}`;
        
        console.log(`[Bridge] Forwarding to Agent via REST: ${prompt}`);
        
        try {
            // Send to OpenCode
            const response = await this.client.sendPrompt(prompt, this.model);
            
            if (response && response.parts) {
                console.log(`[Bridge] Full Agent Response:`, JSON.stringify(response, null, 2));

                // Handle Text
                const textParts = response.parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('\n');

                if (textParts) {
                    console.log(`[Bridge] Agent replied: ${textParts}`);
                    this.bot.chat(textParts);
                }

                // Handle Tool Calls
                const toolCalls = response.parts.filter((p: any) => p.type === 'tool_use');
                if (toolCalls.length === 0) {
                    console.log('[Bridge] No tool calls in response.');
                } else {
                    console.log(`[Bridge] Found ${toolCalls.length > 0 ? 'no' : toolCalls.length} tool calls.`);
                }
                for (const toolCall of toolCalls) {
                    await this.handleToolCall(toolCall);
                    console.log('[Bridge] Tool call handled.');
                }
            }
        } catch (error) {
            console.error('[Bridge] Error handling chat:', error);
            this.bot.chat(`Error communicating with agent: ${error}`);
        }
    }

    private async handleToolCall(toolCall: ToolCall) {
        console.log(`[Bridge] Executing tool: ${toolCall.name}`, toolCall);
        this.bot.chat(`Executing tool: ${toolCall.name}`);

        try {
            if (toolCall.name === 'write_file' || toolCall.name === 'write_to_file') {
                await this.handleWriteFile(toolCall.input);
            } else {
                console.warn(`[Bridge] Unknown tool: ${toolCall.name}`);
                this.bot.chat(`Unknown tool: ${toolCall.name}`);
            }
        } catch (error) {
            console.error(`[Bridge] Tool execution failed:`, error);
            this.bot.chat(`Tool execution failed: ${error}`);
        }
    }

    private async handleWriteFile(input: any) {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const filename = input.file || input.filename || input.path;
        const content = input.content || input.code || input.text;

        if (!filename || !content) {
            throw new Error('Missing filename or content for write_file');
        }

        // Security check: ensure we only write to allowed directories
        // For now, allow writing anywhere under /app (which is the working dir)
        const targetPath = path.resolve(process.cwd(), filename);
        if (!targetPath.startsWith(process.cwd())) {
            throw new Error('Access denied: Cannot write outside of working directory');
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, content);
        
        console.log(`[Bridge] Wrote file: ${targetPath}`);
        this.bot.chat(`✓ Wrote file: ${filename}`);
    }
}
