# Minecraft Bot OpenCode Tools

This directory contains custom OpenCode tools that provide programmatic access to the Minecraft bot.

## Available Tools

All tools are exported from `minecraft.ts` and prefixed with `minecraft_`:

### `minecraft_chat`

Send a chat message through the bot in Minecraft.

**Arguments:**
- `message` (string): The chat message to send

**Example usage in OpenCode:**
```
Use minecraft_chat to say "Hello, world!"
```

### `minecraft_execute`

Execute arbitrary TypeScript code with access to the bot instance.

**Arguments:**
- `code` (string): The TypeScript code to execute (function body that uses the `bot` variable)

**Example usage in OpenCode:**
```
Use minecraft_execute to make the bot jump
Code: bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 100);
```

### `minecraft_reloadBehavior`

Reload a specific behavior file by its filename.

**Arguments:**
- `filename` (string): The behavior filename to reload (must end with .ts)

**Example usage in OpenCode:**
```
Use minecraft_reloadBehavior to reload FollowPlayer.ts
```

### `minecraft_info`

Get information about the bot's current status, position, health, food, and nearby entities.

**No arguments required**

**Example usage in OpenCode:**
```
Use minecraft_info to see the bot's current status
```

## Architecture

The tools work by accessing a singleton `BotRegistry` that holds references to:
- The active mineflayer `Bot` instance
- The `HotLoader` instance for managing behaviors

This architecture allows OpenCode to be the "brain" that controls the bot, rather than the bot creating OpenCode sessions.

## Workflow

1. Start the Minecraft bot (`bun run start`)
2. The bot connects and registers itself with `BotRegistry`
3. OpenCode can now call these tools to control the bot
4. The LLM can use natural language to interact with the bot:
   - "Say hello in chat"
   - "Make the bot jump"
   - "Get the bot's current position"
   - "Reload the FollowPlayer behavior"

## Benefits

- **Cleaner separation**: OpenCode is the AI interface, bot is the execution layer
- **More flexible**: LLM can orchestrate complex sequences using multiple tools
- **Better context**: OpenCode maintains conversation context across tool calls
- **Modular**: Easy to add new tools without modifying core bot code
