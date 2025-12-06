import { join } from 'path';
import { Bot } from 'mineflayer';

export class CodeQueue {
    private bot: Bot;
    private queuePath: string;
    private executedPath: string;
    private executing: Set<string> = new Set();

    constructor(bot: Bot, queuePath: string) {
        this.bot = bot;
        this.queuePath = queuePath;
        this.executedPath = join(queuePath, 'executed');
    }

    public async startWatching() {
        console.log(`Watching for code in ${this.queuePath}`);
        
        // Ensure directories exist
        const fs = await import('fs/promises');
        try {
            await fs.mkdir(this.queuePath, { recursive: true });
            await fs.mkdir(this.executedPath, { recursive: true });
        } catch (e) {
            // Directories might already exist
        }
        
        // Execute any existing files on startup
        await this.checkExistingFiles();
        
        // Poll for new files every second instead of watching
        // (fs.watch is unreliable for file creation events)
        setInterval(async () => {
            await this.checkExistingFiles();
        }, 1000);
    }

    private async checkExistingFiles() {
        try {
            const fs = await import('fs/promises');
            const files = await fs.readdir(this.queuePath);
            
            for (const file of files) {
                if (file.endsWith('.ts')) {
                    console.log(`Found existing code file: ${file}`);
                    await this.executeCode(file);
                }
            }
        } catch (e) {
            console.error('Error checking existing files:', e);
        }
    }

    private async executeCode(filename: string) {
        if (this.executing.has(filename)) {
            return; // Already executing
        }

        this.executing.add(filename);
        const fullPath = join(this.queuePath, filename);
        
        // Longer delay to ensure file is fully written
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // Check if file still exists
            const fs = await import('fs/promises');
            try {
                await fs.access(fullPath);
            } catch {
                console.log(`File ${filename} already processed or doesn't exist`);
                return;
            }
            
            // Import with cache busting
            const importPath = `${fullPath}?t=${Date.now()}`;
            const module = await import(importPath);
            
            // Expect a default export function that takes bot as param
            if (module.default && typeof module.default === 'function') {
                console.log(`Executing code: ${filename}`);
                await module.default(this.bot);
                console.log(`Code completed: ${filename}`);
            } else {
                console.warn(`File ${filename} did not export a default function`);
            }

            // Delete the file after execution
            try {
                await fs.unlink(fullPath);
                console.log(`Cleaned up: ${filename}`);
            } catch (cleanupErr) {
                console.log(`Could not delete ${filename}, probably already removed`);
            }

        } catch (e) {
            console.error(`Failed to execute code ${filename}:`, e);
            this.bot.chat(`Code error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            this.executing.delete(filename);
        }
    }
}
