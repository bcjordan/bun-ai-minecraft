import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase() === '!tp' || message.toLowerCase() === 'come here' || message.toLowerCase() === 'tp to me') {
        const player = bot.players[username];
        
        if (!player) {
            bot.chat(`Can't find player data for ${username}`);
            return;
        }

        if (!player.entity) {
            bot.chat(`Can't see ${username} - might be too far or in unloaded chunks`);
            return;
        }

        const target = player.entity.position;
        bot.chat(`Heading to ${username}...`);
        
        if ((bot as any).pathfinder) {
            const pathfinder = require('mineflayer-pathfinder');
            const goal = new pathfinder.goals.GoalNear(target.x, target.y, target.z, 2);
            (bot as any).pathfinder.setGoal(goal);
        } else {
            bot.chat('Pathfinder not available :(');
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'TeleportCommand',
    onEnable: (bot: Bot) => {
        console.log('TeleportCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('TeleportCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
