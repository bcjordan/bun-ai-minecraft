# Agent Guidelines for OpenCode Minecraft Bot

## Commands
- **Run**: `bun run start` | **Dev**: `bun run dev` (hot reload) | **Lint**: `bun run lint`
- **Test**: `bun test` | Single file: `bun test path/file.test.ts`
- **Install**: `bun install` only (NEVER npm/yarn/pnpm)

## Code Style
- ES modules with external imports first, then internal; 4-space indent, single quotes, semicolons required
- Strict TypeScript, explicit types, avoid `any` (except pathfinder: `(bot as any).pathfinder`)
- PascalCase for classes/behaviors/files, camelCase for functions/variables; `const` default, never `var`

## Behaviors (`src/behaviors/*.ts`)
- Default export class or object: `{ name: string, onEnable(bot: Bot), onDisable(bot: Bot), onTick?(bot: Bot) }`
- **Event Cleanup**: Use arrow functions as class properties for handlers, remove with `bot.off()` in `onDisable`
- **Pathfinder**: Always call `(bot as any).pathfinder.setGoal(null)` in cleanup to prevent crashes
- **Self-filter**: Always check `if (username === bot.username) return;` in chat handlers
- **Errors**: try/catch async ops, `bot.chat()` for user errors, silent catch OK for expected failures

## Bun APIs (prefer over Node.js equivalents)
- `Bun.serve()` over express | `Bun.file()` over fs | `bun:sqlite` over better-sqlite3
- Bun auto-loads `.env` files (no dotenv needed)

## Architecture
- `src/behaviors/`: Hot-reloadable modules | `src/system/`: Core (Behavior.ts, HotLoader.ts, BotRegistry.ts)
- `src/bot/`: BotManager.ts | `src/bridge/`: OpenCode integration | `src/api/`: REST API (Bun.serve)

**Warning**: Self-modifying codebase. Editing behaviors triggers hot-reload immediately.
