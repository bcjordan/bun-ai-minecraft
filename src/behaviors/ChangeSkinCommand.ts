import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const skinNames = [
    'Steve',
    'Alex', 
    'Notch',
    'Herobrine',
    'Technoblade',
    'Dream',
    'GeorgeNotFound',
    'Sapnap'
];

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('change skin') || message.toLowerCase().includes('new skin')) {
        const randomSkin = skinNames[Math.floor(Math.random() * skinNames.length)];
        bot.chat(`Reconnecting as ${randomSkin} to get new skin...`);
        
        // This will trigger a reconnect via the BotManager
        bot.quit(`Changing skin to ${randomSkin}`);
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'ChangeSkinCommand',
    onEnable: (bot: Bot) => {
        console.log('ChangeSkinCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('ChangeSkinCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
