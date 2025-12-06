import mineflayer, { Bot } from 'mineflayer';
import { EventEmitter } from 'events';

export class BotManager extends EventEmitter {
    private bot: Bot | null = null;
    private options: mineflayer.BotOptions;

    constructor(options: mineflayer.BotOptions) {
        super();
        this.options = options;
    }

    public start(): void {
        this.bot = mineflayer.createBot(this.options);
        this.bot.setMaxListeners(50); // Increase to handle all behaviors

        // Handle death BEFORE other plugins to prevent crashes
        this.bot.once('login', () => {
            this.bot!._client.on('update_health', (packet: any) => {
                if (packet.health <= 0) {
                    console.log('Bot died! Auto-respawning...');
                    setTimeout(() => {
                        try {
                            this.bot?.respawn();
                        } catch (e) {
                            console.error('Failed to respawn:', e);
                        }
                    }, 1000);
                }
            });
        });

        this.bot.on('spawn', () => {
            console.log('Bot spawned!');
            this.emit('spawn', this.bot);
        });

        this.bot.on('chat', (username, message) => {
            if (username === this.bot?.username) return;
            this.emit('chat', username, message);
        });

        this.bot.on('error', (err) => {
            console.error('Bot error:', err);
            // Don't crash, just log
        });

        this.bot.on('end', () => {
            console.log('Bot disconnected. Reconnecting in 5s...');
            setTimeout(() => this.start(), 5000);
        });
    }

    public getBot(): Bot | null {
        return this.bot;
    }

    public reconnectWithOptions(newOptions: Partial<mineflayer.BotOptions>): void {
        console.log('Reconnecting with new options:', newOptions);
        this.options = { ...this.options, ...newOptions };
        
        if (this.bot) {
            this.bot.quit('Reconnecting with new settings...');
        } else {
            this.start();
        }
    }
}
