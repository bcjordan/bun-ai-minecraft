import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("status update") || message.toLowerCase().includes("status")) {
        const health = bot.health;
        const food = bot.food;
        const position = bot.entity.position;
        const itemCount = bot.inventory.items().length;
        
        bot.chat(`Health: ${health}/20 | Food: ${food}/20`);
        bot.chat(`Position: ${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}`);
        bot.chat(`Inventory: ${itemCount} item types`);
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'StatusCommand',
    onEnable: (bot: Bot) => {
        console.log('StatusCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('StatusCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
