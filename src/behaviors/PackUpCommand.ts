import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("pack up")) {
        const player = bot.players[username];
        if (!player || !player.entity) {
            bot.chat('Cannot see you to throw items!');
            return;
        }

        if ((bot as any).pathfinder) {
            (bot as any).pathfinder.setGoal(null);
        }

        bot.chat("Packing up crafting and cooking stations...");

        const blocks = bot.findBlocks({
            matching: (block) => {
                return block.name === 'crafting_table' || 
                       block.name === 'furnace' || 
                       block.name === 'smoker' || 
                       block.name === 'blast_furnace';
            },
            maxDistance: 32,
            count: 100
        });

        if (blocks.length === 0) {
            bot.chat("No crafting tables or cooking stations nearby!");
            return;
        }

        bot.chat(`Found ${blocks.length} stations to pack up!`);

        for (const blockPos of blocks) {
            const block = bot.blockAt(blockPos);
            if (!block) continue;

            try {
                const pickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'));
                const axe = bot.inventory.items().find(item => item.name.includes('axe'));
                
                if (block.name === 'crafting_table' && axe) {
                    await bot.equip(axe, 'hand');
                } else if (pickaxe) {
                    await bot.equip(pickaxe, 'hand');
                }
                
                if (block.name === 'furnace' || block.name === 'smoker' || block.name === 'blast_furnace') {
                    const furnace = await bot.openFurnace(block);
                    
                    const items = furnace.containerItems();
                    furnace.close();
                    
                    await bot.dig(block);
                    await bot.waitForTicks(5);
                    
                    const targetPos = player.entity.position;
                    await bot.lookAt(targetPos.offset(0, player.entity.height, 0));
                    await bot.waitForTicks(3);
                    
                    for (const item of items) {
                        if (item) {
                            const invItem = bot.inventory.items().find(i => i.type === item.type);
                            if (invItem) {
                                await bot.toss(invItem.type, null, invItem.count);
                                await bot.waitForTicks(2);
                            }
                        }
                    }
                } else {
                    await bot.dig(block);
                    await bot.waitForTicks(5);
                }

                const targetPos = player.entity.position;
                await bot.lookAt(targetPos.offset(0, player.entity.height, 0));
                await bot.waitForTicks(3);
                
                const droppedBlock = bot.inventory.items().find(i => i.name === block.name);
                if (droppedBlock) {
                    await bot.toss(droppedBlock.type, null, droppedBlock.count);
                    await bot.waitForTicks(2);
                }
                
            } catch (err) {
                bot.chat(`Error packing ${block.name}: ${err}`);
            }
        }

        bot.chat("Pack up complete!");
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'PackUpCommand',
    onEnable: (bot: Bot) => {
        console.log('PackUpCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('PackUpCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
