import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('bee boop')) {
        // Jump twice
        bot.setControlState('jump', true);
        await new Promise(resolve => setTimeout(resolve, 100));
        bot.setControlState('jump', false);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        bot.setControlState('jump', true);
        await new Promise(resolve => setTimeout(resolve, 100));
        bot.setControlState('jump', false);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Turn around (rotate 180 degrees)
        const currentYaw = bot.entity.yaw;
        await bot.look(currentYaw + Math.PI, bot.entity.pitch);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Say bee boop back
        bot.chat('bee boop!');
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'BeeBoopDance',
    onEnable: (bot: Bot) => {
        console.log('BeeBoopDance enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('BeeBoopDance disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
