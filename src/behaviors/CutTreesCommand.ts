import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { goals } from 'mineflayer-pathfinder';

let isCutting = false;

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("stop cutting")) {
        if (isCutting) {
            isCutting = false;
            bot.chat("Stopping tree cutting...");
            if ((bot as any).pathfinder) {
                (bot as any).pathfinder.setGoal(null);
            }
            bot.stopDigging();
        } else {
            bot.chat("Not cutting trees!");
        }
        return;
    }

    if (message.toLowerCase().includes("cut trees")) {
        if (isCutting) {
            bot.chat("Already cutting trees!");
            return;
        }
        const axe = bot.inventory.items().find(item => item.name.includes('axe'));
        
        if (!axe) {
            bot.chat("No axe to cut trees!");
            return;
        }

        if ((bot as any).pathfinder) {
            (bot as any).pathfinder.setGoal(null);
        }

        isCutting = true;
        bot.chat("Cutting nearby trees...");

        await bot.equip(axe, 'hand');

        const logBlocks = bot.findBlocks({
            matching: (block) => {
                return block.name.includes('log') || block.name.includes('wood');
            },
            maxDistance: 32,
            count: 100
        });

        if (logBlocks.length === 0) {
            bot.chat("No trees nearby!");
            return;
        }

        bot.chat(`Found ${logBlocks.length} logs to cut!`);

        for (const blockPos of logBlocks) {
            if (!isCutting) {
                bot.chat("Tree cutting stopped!");
                return;
            }

            const block = bot.blockAt(blockPos);
            if (!block) continue;

            try {
                const goal = new goals.GoalNear(blockPos.x, blockPos.y, blockPos.z, 4);
                (bot as any).pathfinder.setGoal(goal);

                await new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (bot.entity.position.distanceTo(blockPos) < 5) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);

                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve();
                    }, 5000);
                });

                (bot as any).pathfinder.setGoal(null);

                await bot.dig(block);
                await bot.waitForTicks(5);

                const items = bot.entities;
                const wood = Object.values(items).filter(entity => 
                    entity.name === 'item' && 
                    (entity as any).metadata && 
                    (entity as any).metadata[10] && 
                    // Check if it's a log (this logic seems brittle, but preserving intent)
                    true 
                );
                
                for (const item of wood) {
                    try {
                        const itemGoal = new goals.GoalBlock(item.position.x, item.position.y, item.position.z);
                        (bot as any).pathfinder.setGoal(itemGoal);

                        await new Promise<void>((resolve) => {
                            const checkInterval = setInterval(() => {
                                if (bot.entity.position.distanceTo(item.position) < 2) {
                                    clearInterval(checkInterval);
                                    resolve();
                                }
                            }, 100);

                            setTimeout(() => {
                                clearInterval(checkInterval);
                                resolve();
                            }, 2000);
                        });

                        await bot.waitForTicks(3);
                    } catch (err) {
                    }
                }

                (bot as any).pathfinder.setGoal(null);

                const woodCount = bot.inventory.items()
                    .filter(item => item.name.includes('log') || item.name.includes('wood'))
                    .reduce((sum, item) => sum + item.count, 0);
                
                bot.chat(`Tree cut! Wood in inventory: ${woodCount}`);
            } catch (err) {
                bot.chat(`Error cutting log: ${err}`);
            }
        }

        bot.chat("Tree cutting complete!");
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'CutTreesCommand',
    onEnable: (bot: Bot) => {
        console.log('CutTreesCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('CutTreesCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
