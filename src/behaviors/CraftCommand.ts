import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("let's craft")) {
        const craftingTables = bot.inventory.items().filter(item => 
            item.name === 'crafting_table'
        );

        if (craftingTables.length === 0) {
            bot.chat("No crafting tables to place!");
            return;
        }

        bot.chat(`Placing ${craftingTables.length} crafting table(s)!`);

        const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        if (!referenceBlock) {
            bot.chat("Can't find ground!");
            return;
        }

        for (let i = 0; i < craftingTables.length; i++) {
            const table = craftingTables[i];
            const placePos = bot.entity.position.offset(i + 1, 0, 0);
            const placeBlock = bot.blockAt(placePos.offset(0, -1, 0));

            if (placeBlock) {
                try {
                    await bot.equip(table, 'hand');
                    await bot.placeBlock(placeBlock, new (require('vec3').Vec3)(0, 1, 0));
                    await bot.waitForTicks(5);
                } catch (err) {
                    bot.chat(`Error placing table ${i + 1}: ${err}`);
                }
            }
        }

        bot.chat("Crafting tables ready!");
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'CraftCommand',
    onEnable: (bot: Bot) => {
        console.log('CraftCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('CraftCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
