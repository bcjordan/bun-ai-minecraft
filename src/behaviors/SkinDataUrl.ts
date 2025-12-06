import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { readFileSync } from 'fs';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase() === 'skin url' || message.toLowerCase() === 'png url') {
        try {
            const skinPath = '/app/var/skins/red.png';
            const skinData = readFileSync(skinPath);
            const base64 = skinData.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            
            bot.chat(`Red skin data URL (${dataUrl.length} chars):`);
            // Split into chunks since MC chat has length limits
            const chunkSize = 100;
            for (let i = 0; i < Math.min(dataUrl.length, 300); i += chunkSize) {
                bot.chat(dataUrl.substring(i, i + chunkSize));
            }
            if (dataUrl.length > 300) {
                bot.chat('... (truncated, too long for chat)');
            }
        } catch (err) {
            bot.chat(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'SkinDataUrl',
    onEnable: (bot: Bot) => {
        console.log('SkinDataUrl enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('SkinDataUrl disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
