import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase() === 'restart' || message.toLowerCase() === '!restart') {
        bot.chat('Restarting bot process...');
        
        // Give the chat message time to send
        setTimeout(() => {
            process.exit(0);
        }, 500);
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'RestartCommand',
    onEnable: (bot: Bot) => {
        console.log('RestartCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('RestartCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
