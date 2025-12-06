import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().startsWith('skin ')) {
        const cmd = message.substring(5).toLowerCase();
        
        // Toggle individual parts
        if (cmd === 'jacket on') {
            bot.setSettings({ showCape: 0x01 });
            bot.chat('Jacket enabled');
        } else if (cmd === 'jacket off') {
            bot.setSettings({ showCape: 0x00 });
            bot.chat('Jacket disabled');
        } else if (cmd === 'all on') {
            bot.setSettings({ showCape: 0x7F }); // All bits set
            bot.chat('All skin parts enabled');
        } else if (cmd === 'all off') {
            bot.setSettings({ showCape: 0x00 });
            bot.chat('All skin parts disabled');
        } else {
            bot.chat('Usage: skin [jacket on/off | all on/off]');
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'SkinPartsCommand',
    onEnable: (bot: Bot) => {
        console.log('SkinPartsCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('SkinPartsCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
