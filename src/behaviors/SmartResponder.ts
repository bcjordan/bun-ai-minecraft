import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.includes('jump')) {
        bot.chat('Jumping!');
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
    } else if (message.toLowerCase().includes('set time to')) {
        const timeMatch = message.match(/set time to (\d+)/i);
        if (timeMatch) {
            const time = timeMatch[1];
            bot.chat(`Setting time to ${time}.`);
            bot.chat(`/time set ${time}`);
        }
    } else if (message.includes('time')) {
        bot.chat(`The time is ${new Date().toLocaleTimeString()}`);
    }
};

// We need to store the bound function to remove it later
let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'SmartResponder',
    onEnable: (bot: Bot) => {
        console.log('SmartResponder enabled');
        bot.chat('I am now listening for commands like "jump" or "time".');
        
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('SmartResponder disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
        bot.chat('SmartResponder disabled.');
    }
};

export default behavior;
