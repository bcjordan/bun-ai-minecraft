import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { goals } from 'mineflayer-pathfinder';

let isMining = false;

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes('stop mining') || message.toLowerCase().includes('stop digging')) {
        if (isMining) {
            isMining = false;
            bot.chat('Stopping diamond mining...');
            if ((bot as any).pathfinder) {
                (bot as any).pathfinder.setGoal(null);
            }
            bot.stopDigging();
        } else {
            bot.chat('Not mining!');
        }
        return;
    }

    if (message.toLowerCase().includes('find diamonds') || message.toLowerCase() === 'diamonds') {
        if (isMining) {
            bot.chat('Already mining!');
            return;
        }

        const pickaxe = bot.inventory.items().find(item => item.name.includes('pickaxe'));
        
        if (!pickaxe) {
            bot.chat('I need a pickaxe to mine!');
            return;
        }

        if ((bot as any).pathfinder) {
            (bot as any).pathfinder.setGoal(null);
        }

        isMining = true;
        bot.chat('Looking for diamonds! Heading to diamond level...');

        await bot.equip(pickaxe, 'hand');

        // First, go to diamond level (Y = -59 to -64 in 1.18+, or Y = 11 in older versions)
        const currentY = Math.floor(bot.entity.position.y);
        const targetY = currentY < 0 ? -59 : 11; // Assume newer version if already below 0

        if (Math.abs(currentY - targetY) > 5) {
            bot.chat(`Going to Y=${targetY} for best diamond odds...`);
            const goal = new goals.GoalY(targetY);
            (bot as any).pathfinder.setGoal(goal);

            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                    if (Math.abs(Math.floor(bot.entity.position.y) - targetY) < 3 || !isMining) {
                        clearInterval(checkInterval);
                        (bot as any).pathfinder.setGoal(null);
                        resolve();
                    }
                }, 500);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    (bot as any).pathfinder.setGoal(null);
                    resolve();
                }, 30000);
            });
        }

        if (!isMining) {
            bot.chat('Mining stopped!');
            return;
        }

        bot.chat('Now searching for diamond ore...');

        // Look for diamond ore
        while (isMining) {
            const diamondOre = bot.findBlocks({
                matching: (block) => {
                    return block.name.includes('diamond_ore');
                },
                maxDistance: 64,
                count: 10
            });

            if (diamondOre.length > 0) {
                bot.chat(`Found ${diamondOre.length} diamond ore(s) nearby!`);

                for (const blockPos of diamondOre) {
                    if (!isMining) break;

                    const block = bot.blockAt(blockPos);
                    if (!block || !block.name.includes('diamond_ore')) continue;

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
                            }, 10000);
                        });

                        (bot as any).pathfinder.setGoal(null);

                        bot.chat('Mining diamond ore!');
                        await bot.dig(block);
                        await bot.waitForTicks(10);

                    } catch (err: any) {
                        bot.chat(`Error mining: ${err.message}`);
                    }
                }
            } else {
                bot.chat('No diamonds visible nearby. Exploring...');
                
                // Move in a direction to explore
                const randomAngle = Math.random() * Math.PI * 2;
                const distance = 16;
                const targetX = bot.entity.position.x + Math.cos(randomAngle) * distance;
                const targetZ = bot.entity.position.z + Math.sin(randomAngle) * distance;
                
                const goal = new goals.GoalNear(targetX, targetY, targetZ, 2);
                (bot as any).pathfinder.setGoal(goal);

                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        (bot as any).pathfinder.setGoal(null);
                        resolve();
                    }, 8000);
                });
            }

            if (!isMining) break;
            await bot.waitForTicks(20);
        }

        isMining = false;
        bot.chat('Finished diamond mining!');
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'FindDiamondsCommand',
    onEnable: (bot: Bot) => {
        console.log('FindDiamondsCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('FindDiamondsCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
        isMining = false;
        if ((bot as any).pathfinder) {
            (bot as any).pathfinder.setGoal(null);
        }
    }
};

export default behavior;
