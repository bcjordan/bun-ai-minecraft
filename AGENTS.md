# Agent Guidelines for OpenCode Minecraft Bot

## Commands
- **Run**: `bun run start` | **Dev**: `bun run dev` (hot reload) | **Lint**: `bun run lint` (tsc --noEmit)
- **Install**: `bun install` (NEVER use npm/yarn/pnpm - this is a Bun-only project)
- **Test**: No test suite configured currently

## Code Style
- **Modules**: ES modules only (`import`/`export`), external imports first, then relative imports
- **TypeScript**: Strict mode enabled, explicit types required, avoid `any`, use interfaces for contracts
- **Formatting**: 4-space indentation, single quotes for strings, semicolons required
- **Naming**: PascalCase (classes, interfaces, behaviors), camelCase (functions, variables, files)
- **Variables**: Use `const` by default, `let` when reassignment needed, never `var`
- **Bun APIs**: Prefer Bun native APIs: `Bun.file()` over `node:fs`, `Bun.serve()` over Express

## Minecraft Behaviors
- **Structure**: Default export implementing `Behavior` interface: `{ name: string, onEnable(bot), onDisable(bot), onTick?(bot) }`
- **Event Cleanup**: CRITICAL - Store listeners in module-level variables (e.g., `let boundOnChat: ... | null = null`), bind in `onEnable`, remove with `bot.off()` in `onDisable`, set to `null`
- **Pathfinder**: Always call `(bot as any).pathfinder.setGoal(null)` in cleanup to prevent crashes
- **Error Handling**: Wrap async operations in try/catch, use `bot.chat()` for user-facing errors, silent catch OK for expected failures
- **User Feedback**: Use `bot.chat()` liberally for status updates, `console.log()` for internal debugging
- **CRITICAL**: After creating/editing behaviors, ALWAYS respond with "Behavior done!" or "[BehaviorName] updated!" - this is required for the system to detect completion

## Architecture
- `src/behaviors/*.ts`: Hot-reloadable behavior modules (see AdHocCommand.ts, CutTreesCommand.ts for patterns)
- `src/system/`: Core (Behavior.ts interface, HotLoader.ts, BotRegistry.ts)
- `src/bot/`: BotManager.ts (connection, auto-reconnect, event routing)
- `src/bridge/`: OpenCode integration (OpenCodeClient.ts, OpenCodeBridge.ts, OpenCodeServer.ts)
- `src/api/`: BotAPIServer.ts (REST API using Bun.serve for OpenCode tools)

## Self-Modifying Warning
This is a self-modifying codebase. Editing behaviors may affect your own execution environment. Exercise caution when modifying core system files.
