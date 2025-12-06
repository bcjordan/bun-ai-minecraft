import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;
    if (message.toLowerCase() === '!tp') {
        bot.chat(`Teleporting to ${username}...`);
        bot.chat(`/tp ${bot.username} ${username}`);
    }
};

const behavior: Behavior = {
    name: 'TpBehavior',
    onEnable: (bot: Bot) => {
        console.log('TpBehavior enabled');
        bot.on('chat', onChat.bind(null, bot));
    },
    onDisable: (bot: Bot) => {
        console.log('TpBehavior disabled');
        bot.off('chat', onChat.bind(null, bot));
    }
};

export default behavior;