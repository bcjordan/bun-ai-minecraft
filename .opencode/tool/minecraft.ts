import { tool } from "@opencode-ai/plugin";

const BOT_API_URL = process.env.BOT_API_URL || 'http://bot:3000';

/**
 * Send a chat message through the Minecraft bot
 */
export const chat = tool({
  description: "Send a chat message in Minecraft through the bot",
  args: {
    message: tool.schema.string().describe("The chat message to send"),
  },
  async execute(args) {
    try {
      const response = await fetch(`${BOT_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: args.message }),
      });

      if (!response.ok) {
        const error = await response.json();
        return `Error: ${error.error || 'Failed to send message'}`;
      }

      return `Successfully sent message: "${args.message}"`;
    } catch (err: any) {
      return `Error: Bot is not connected to the Minecraft server (${err.message})`;
    }
  },
});

/**
 * Execute arbitrary TypeScript code with access to the bot instance
 */
export const execute = tool({
  description: "Execute arbitrary TypeScript code with access to the bot instance. The code has access to 'bot' (mineflayer Bot) variable.",
  args: {
    code: tool.schema.string().describe("The TypeScript code to execute. Should be a function body that uses the 'bot' variable."),
  },
  async execute(args) {
    try {
      const response = await fetch(`${BOT_API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: args.code }),
      });

      if (!response.ok) {
        const error = await response.json();
        return `Error: ${error.error || 'Failed to execute code'}`;
      }

      const data = await response.json();
      return data.result !== undefined
        ? `Code executed successfully. Result: ${JSON.stringify(data.result, null, 2)}`
        : "Code executed successfully";
    } catch (err: any) {
      return `Error: Bot is not connected to the Minecraft server (${err.message})`;
    }
  },
});

/**
 * Reload a specific behavior by filename
 */
export const reloadBehavior = tool({
  description: "Reload a specific behavior file by its filename (e.g., 'FollowPlayer.ts')",
  args: {
    filename: tool.schema.string().describe("The behavior filename to reload (must end with .ts)"),
  },
  async execute(args) {
    if (!args.filename.endsWith('.ts')) {
      return "Error: Filename must end with .ts";
    }

    try {
      const response = await fetch(`${BOT_API_URL}/api/reload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: args.filename }),
      });

      if (!response.ok) {
        const error = await response.json();
        return `Error: ${error.error || 'Failed to reload behavior'}`;
      }

      return `Successfully reloaded behavior: ${args.filename}`;
    } catch (err: any) {
      return `Error: Bot is not connected to the Minecraft server (${err.message})`;
    }
  },
});

/**
 * Get information about the bot and the world
 */
export const info = tool({
  description: "Get information about the bot's current status, position, health, food, and nearby entities",
  args: {},
  async execute() {
    try {
      const response = await fetch(`${BOT_API_URL}/api/info`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        return `Error: ${error.error || 'Failed to get bot info'}`;
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (err: any) {
      return `Error: Bot is not connected to the Minecraft server (${err.message})`;
    }
  },
});
