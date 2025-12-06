import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { join } from 'path';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().startsWith('run code ')) {
        const filename = message.substring(9).trim();
        
        if (!filename.endsWith('.ts')) {
            bot.chat('Filename must end with .ts');
            return;
        }

        const queuePath = join(process.cwd(), 'var', 'code-queue');
        const fullPath = join(queuePath, filename);
        
        try {
            bot.chat(`Executing ${filename}...`);
            
            const importPath = `${fullPath}?t=${Date.now()}`;
            const module = await import(importPath);
            
            if (module.default && typeof module.default === 'function') {
                await module.default(bot);
                bot.chat(`✓ ${filename} completed!`);
            } else {
                bot.chat('File must export default function');
            }
        } catch (err) {
            bot.chat(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'CodeQueueCommand',
    onEnable: (bot: Bot) => {
        console.log('CodeQueueCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('CodeQueueCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
