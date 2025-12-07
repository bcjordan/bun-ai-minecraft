import { Bot } from 'mineflayer';

export interface Command {
    name: string;
    description?: string;
    pattern: RegExp;
    handler: (bot: Bot, username: string, args: RegExpMatchArray) => void | Promise<void>;
}

/**
 * Centralized command dispatcher that behaviors can register commands with.
 * Allows both chat-based and programmatic command triggering.
 */
class CommandDispatcher {
    private static instance: CommandDispatcher;
    private commands: Map<string, Command> = new Map();
    private bot: Bot | null = null;

    private constructor() {}

    public static getInstance(): CommandDispatcher {
        if (!CommandDispatcher.instance) {
            CommandDispatcher.instance = new CommandDispatcher();
        }
        return CommandDispatcher.instance;
    }

    public setBot(bot: Bot): void {
        this.bot = bot;
        // Listen to chat and dispatch commands
        bot.on('chat', (username, message) => {
            // Don't respond to own messages in chat
            if (username === bot.username) return;
            this.dispatch(username, message);
        });
        console.log('[CommandDispatcher] Bot set and chat listener attached');
    }

    /**
     * Register a command with the dispatcher
     */
    public register(command: Command): void {
        this.commands.set(command.name, command);
        console.log(`[CommandDispatcher] Registered command: ${command.name}`);
    }

    /**
     * Unregister a command
     */
    public unregister(name: string): void {
        this.commands.delete(name);
        console.log(`[CommandDispatcher] Unregistered command: ${name}`);
    }

    /**
     * Dispatch a message to find and execute matching commands.
     * Can be called programmatically with any username (including 'self' or bot's name).
     */
    public dispatch(username: string, message: string): boolean {
        if (!this.bot) {
            console.warn('[CommandDispatcher] No bot set, cannot dispatch');
            return false;
        }

        const msg = message.toLowerCase();
        
        for (const [name, command] of this.commands) {
            const match = msg.match(command.pattern);
            if (match) {
                console.log(`[CommandDispatcher] Matched command: ${name}`);
                try {
                    command.handler(this.bot, username, match);
                } catch (err) {
                    console.error(`[CommandDispatcher] Error in command ${name}:`, err);
                }
                return true;
            }
        }
        
        return false;
    }

    /**
     * Execute a command programmatically, bypassing chat.
     * Useful for the bot to trigger its own commands.
     */
    public execute(commandString: string, username: string = 'system'): boolean {
        return this.dispatch(username, commandString);
    }

    /**
     * Self-execute a command (as if the bot sent it to itself)
     */
    public selfExecute(commandString: string): boolean {
        return this.dispatch('self', commandString);
    }

    /**
     * List all registered commands
     */
    public listCommands(): Command[] {
        return Array.from(this.commands.values());
    }

    /**
     * Get a specific command by name
     */
    public getCommand(name: string): Command | undefined {
        return this.commands.get(name);
    }
}

export const commandDispatcher = CommandDispatcher.getInstance();
