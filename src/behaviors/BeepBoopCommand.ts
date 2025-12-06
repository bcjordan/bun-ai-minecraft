import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase() === 'beep boop' || message.toLowerCase() === 'bee boop') {
        // Jump twice
        bot.setControlState('jump', true);
        await new Promise(resolve => setTimeout(resolve, 300));
        bot.setControlState('jump', false);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        bot.setControlState('jump', true);
        await new Promise(resolve => setTimeout(resolve, 300));
        bot.setControlState('jump', false);
        
        // Turn around (180 degrees)
        await new Promise(resolve => setTimeout(resolve, 300));
        await bot.look(bot.entity.yaw + Math.PI, bot.entity.pitch);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        bot.chat('beep boop!');
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'BeepBoopCommand',
    onEnable: (bot: Bot) => {
        console.log('BeepBoopCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('BeepBoopCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
