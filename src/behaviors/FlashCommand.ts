import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

let isFlashing = false;
let flashInterval: ReturnType<typeof setInterval> | null = null;

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('flash')) {
        if (isFlashing) {
            isFlashing = false;
            if (flashInterval) {
                clearInterval(flashInterval);
                flashInterval = null;
            }
            bot.chat('Stopped flashing!');
        } else {
            isFlashing = true;
            bot.chat('Starting flash mode!');
            
            let toggle = false;
            flashInterval = setInterval(() => {
                // Rapidly crouch/uncrouch for visual flashing
                bot.setControlState('sneak', toggle);
                // Swing arm
                bot.swingArm('right');
                toggle = !toggle;
            }, 100);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'FlashCommand',
    onEnable: (bot: Bot) => {
        console.log('FlashCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('FlashCommand disabled');
        if (flashInterval) {
            clearInterval(flashInterval);
            flashInterval = null;
        }
        isFlashing = false;
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
