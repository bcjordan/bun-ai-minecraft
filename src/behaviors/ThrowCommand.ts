import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { Vec3 } from 'vec3';

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('throw')) {
        const player = bot.players[username];
        if (!player || !player.entity) {
            bot.chat('Cannot see you!');
            return;
        }

        const heldItem = bot.inventory.slots[bot.quickBarSlot + 36];
        if (!heldItem) {
            bot.chat('Nothing in hand to throw!');
            return;
        }

        const targetPos = player.entity.position;

        bot.lookAt(targetPos.offset(0, player.entity.height, 0));
        
        setTimeout(() => {
            bot.toss(heldItem.type, null, 1);
        }, 100);
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'ThrowCommand',
    onEnable: (bot: Bot) => {
        console.log('ThrowCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('ThrowCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
