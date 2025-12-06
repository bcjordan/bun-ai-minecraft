import { Bot } from 'mineflayer';
import { HotLoader } from './HotLoader';

/**
 * Global registry to allow OpenCode tools to access the bot instance
 * This is a singleton pattern to share the bot across tool invocations
 */
class BotRegistry {
    private static instance: BotRegistry;
    private bot: Bot | null = null;
    private hotLoader: HotLoader | null = null;

    private constructor() {}

    public static getInstance(): BotRegistry {
        if (!BotRegistry.instance) {
            BotRegistry.instance = new BotRegistry();
        }
        return BotRegistry.instance;
    }

    public registerBot(bot: Bot, hotLoader: HotLoader): void {
        console.log('[BotRegistry] Registering bot:', bot.username);
        this.bot = bot;
        this.hotLoader = hotLoader;
        console.log('[BotRegistry] Bot registered! isReady:', this.isReady());
    }

    public getBot(): Bot | null {
        return this.bot;
    }

    public getHotLoader(): HotLoader | null {
        return this.hotLoader;
    }

    public isReady(): boolean {
        return this.bot !== null;
    }
}

export const botRegistry = BotRegistry.getInstance();
