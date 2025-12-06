import { watch } from 'fs';
import { join } from 'path';
import { Bot } from 'mineflayer';
import { Behavior } from './Behavior';

export class HotLoader {
    private bot: Bot;
    private behaviorsPath: string;
    private activeBehaviors: Map<string, Behavior> = new Map();

    constructor(bot: Bot, behaviorsPath: string) {
        this.bot = bot;
        this.behaviorsPath = behaviorsPath;
    }

    private watcher: import('fs').FSWatcher | null = null;
    private tickListener: (() => void) | null = null;

    public startWatching() {
        console.log(`Watching for behaviors in ${this.behaviorsPath}`);
        
        // Initial load
        this.loadAll();

        // Start the tick loop
        this.tickListener = () => {
            for (const behavior of this.activeBehaviors.values()) {
                if (behavior.onTick) {
                    try {
                        behavior.onTick(this.bot);
                    } catch (e) {
                        console.error(`Error in behavior ${behavior.name} onTick:`, e);
                    }
                }
            }
        };
        this.bot.on('physicsTick', this.tickListener);

        // Watch for changes
        this.watcher = watch(this.behaviorsPath, async (eventType, filename) => {
            if (filename && filename.endsWith('.ts')) {
                console.log(`File changed: ${filename}`);
                await this.reloadBehavior(filename);
            }
        });
    }

    public stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.tickListener) {
            this.bot.removeListener('physicsTick', this.tickListener);
            this.tickListener = null;
        }
        // Unload all behaviors
        for (const filename of this.activeBehaviors.keys()) {
            const behavior = this.activeBehaviors.get(filename);
            try {
                behavior?.onDisable(this.bot);
            } catch (e) {
                console.error(`Error disabling behavior ${filename} during stop:`, e);
            }
        }
        this.activeBehaviors.clear();
    }

    private async loadAll() {
        const fs = await import('fs');
        const files = fs.readdirSync(this.behaviorsPath).filter(f => f.endsWith('.ts'));
        for (const file of files) {
            await this.reloadBehavior(file);
        }
    }

    public async reloadAll() {
        console.log('Reloading all behaviors...');
        const fs = await import('fs');
        const files = fs.readdirSync(this.behaviorsPath).filter(f => f.endsWith('.ts'));
        for (const file of files) {
            await this.reloadBehavior(file);
        }
        console.log('All behaviors reloaded');
    }

    public async reloadBehavior(filename: string) {
        const fullPath = join(this.behaviorsPath, filename);
        
        // Unload if exists
        if (this.activeBehaviors.has(filename)) {
            const oldBehavior = this.activeBehaviors.get(filename);
            try {
                // Stop pathfinder if it exists to prevent crashes
                if ((this.bot as any).pathfinder) {
                    (this.bot as any).pathfinder.setGoal(null);
                }
                
                oldBehavior?.onDisable(this.bot);
                console.log(`Disabled behavior: ${oldBehavior?.name}`);
            } catch (e) {
                console.error(`Error disabling behavior ${filename}:`, e);
            }
            this.activeBehaviors.delete(filename);
        }

        // Load new
        try {
            // Cache busting for Bun/ESM is tricky. 
            // Bun doesn't have a built-in registry clear for ESM yet in the same way Node's require.cache works.
            // A common workaround is appending a query string to the import path.
            const importPath = `${fullPath}?t=${Date.now()}`;
            
            const module = await import(importPath);
            // Assume default export is the Behavior class or instance
            // Let's assume it exports a 'default' which is a class implementing Behavior, or an instance.
            // We'll support exporting an instance for simplicity.
            
            const behavior: Behavior = module.default;
            
            if (behavior && typeof behavior.onEnable === 'function') {
                behavior.onEnable(this.bot);
                this.activeBehaviors.set(filename, behavior);
                console.log(`Loaded behavior: ${behavior.name}`);
            } else {
                console.warn(`File ${filename} did not export a valid Behavior.`);
            }

        } catch (e) {
            console.error(`Failed to load behavior ${filename}:`, e);
        }
    }
}
