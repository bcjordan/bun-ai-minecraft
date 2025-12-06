import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('bee boop')) {
        // Jump twice
        bot.setControlState('jump', true);
        await new Promise(resolve => setTimeout(resolve, 500));
        bot.setControlState('jump', false);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        bot.setControlState('jump', true);
        await new Promise(resolve => setTimeout(resolve, 500));
        bot.setControlState('jump', false);
        
        // Turn around (180 degrees)
        await new Promise(resolve => setTimeout(resolve, 200));
        bot.look(bot.entity.yaw + Math.PI, bot.entity.pitch);
        
        // Say bee boop
        await new Promise(resolve => setTimeout(resolve, 300));
        bot.chat('bee boop!');
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'BeeBoopCommand',
    onEnable: (bot: Bot) => {
        console.log('BeeBoopCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('BeeBoopCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
