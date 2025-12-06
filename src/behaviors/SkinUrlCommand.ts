import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase() === 'skin url') {
        // For now, the skin is stored locally at /app/var/skins/red.png
        // We'd need to serve it via HTTP to get a URL
        // Or use a data URL
        bot.chat('Skin stored at: /app/var/skins/red.png');
        bot.chat('Need to serve it via HTTP to get a URL');
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'SkinUrlCommand',
    onEnable: (bot: Bot) => {
        console.log('SkinUrlCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('SkinUrlCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
