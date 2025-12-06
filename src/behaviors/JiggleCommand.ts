import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('jiggle')) {
        const jiggleDuration = 2000;
        const jiggleInterval = 100;
        const startTime = Date.now();

        const jiggleTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= jiggleDuration) {
                clearInterval(jiggleTimer);
                bot.setControlState('left', false);
                bot.setControlState('right', false);
                bot.setControlState('forward', false);
                bot.setControlState('back', false);
                return;
            }

            const yaw = bot.entity.yaw + (Math.random() - 0.5) * 0.5;
            bot.look(yaw, bot.entity.pitch);
            
            const actions = ['left', 'right', 'forward', 'back'];
            actions.forEach(action => bot.setControlState(action as any, false));
            
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            bot.setControlState(randomAction as any, true);
            
            if (Math.random() > 0.7) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 50);
            }
        }, jiggleInterval);
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'JiggleCommand',
    onEnable: (bot: Bot) => {
        console.log('JiggleCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('JiggleCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
