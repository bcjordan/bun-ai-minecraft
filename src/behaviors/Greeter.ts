import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const behavior: Behavior = {
    name: 'Greeter',
    onEnable: (bot: Bot) => {
        console.log('Greeter behavior enabled!');
        bot.chat('Hello! I am OpenCodeBot. I have been hot-loaded!');
    },
    onDisable: (bot: Bot) => {
        console.log('Greeter behavior disabled!');
        bot.chat('Goodbye for now!');
    }
};

export default behavior;
