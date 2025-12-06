import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { OpenCodeClient } from '../bridge/OpenCodeClient';

let openCodeClient: OpenCodeClient | null = null;
const model = { providerID: 'anthropic', modelID: 'claude-sonnet-4-20250514' };

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().startsWith("do ")) {
        const request = message.substring(3).trim();

        bot.chat(`Generating code for: ${request}`);

        try {
            if (!openCodeClient) {
                openCodeClient = new OpenCodeClient();
                await openCodeClient.createSession('AdHoc Commands');
                await openCodeClient.initializeSession(model);
            }

            const prompt = `Write a TypeScript async function body that takes parameters (bot: Bot, username: string) where bot is a mineflayer Bot instance. The function should: ${request}. Only output the function body code, no function declaration or explanations.`;

            const generatedCode = await openCodeClient.sendPrompt(prompt, model);

            if (!generatedCode) {
                bot.chat('Failed to generate code');
                return;
            }

            bot.chat('Executing generated code...');

            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction('bot', 'username', generatedCode);
            await fn(bot, username);

            bot.chat('Done!');
        } catch (err: any) {
            bot.chat(`Error: ${err.message || err}`);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'AdHocCommand',
    onEnable: (bot: Bot) => {
        console.log('AdHocCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('AdHocCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
        openCodeClient = null;
    }
};

export default behavior;
