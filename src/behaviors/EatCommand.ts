import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("eat food")) {
        const food = bot.inventory.items().find(item => (item as any).foodRecovery && (item as any).foodRecovery > 0);
        
        if (!food) {
            bot.chat("No food in inventory!");
            return;
        }

        try {
            await bot.equip(food, 'hand');
            bot.activateItem();
            
            setTimeout(() => {
                bot.deactivateItem();
                bot.chat(`Ate ${food.name}!`);
            }, 1500);
        } catch (err) {
            bot.chat(`Error eating: ${err}`);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'EatCommand',
    onEnable: (bot: Bot) => {
        console.log('EatCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('EatCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
