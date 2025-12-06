import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { goals } from 'mineflayer-pathfinder';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("clean up")) {
        const player = bot.players[username];
        if (!player || !player.entity) {
            bot.chat('Cannot see you to throw items!');
            return;
        }

        if ((bot as any).pathfinder) {
            (bot as any).pathfinder.setGoal(null);
        }

        bot.chat("Cleaning up items...");

        const nearbyItems = Object.values(bot.entities).filter((entity: any) => 
            entity.objectType === 'Item' && 
            entity.position.distanceTo(bot.entity.position) < 16
        );

        if (nearbyItems.length === 0) {
            bot.chat("No items to clean up!");
            return;
        }

        bot.chat(`Found ${nearbyItems.length} items to collect!`);

        for (const item of nearbyItems) {
            try {
                const goal = new goals.GoalBlock(item.position.x, item.position.y, item.position.z);
                (bot as any).pathfinder.setGoal(goal);

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
                    }, 5000);
                });

                await bot.waitForTicks(10);
            } catch (err) {
                bot.chat(`Error collecting item: ${err}`);
            }
        }

        (bot as any).pathfinder.setGoal(null);

        const targetPos = player.entity.position;
        await bot.lookAt(targetPos.offset(0, player.entity.height, 0));
        await bot.waitForTicks(5);

        const itemsToThrow = bot.inventory.items();
        for (const item of itemsToThrow) {
            try {
                await bot.toss(item.type, null, item.count);
                await bot.waitForTicks(2);
            } catch (err) {
                bot.chat(`Error throwing ${item.name}: ${err}`);
            }
        }

        bot.chat("Clean up complete!");
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'CleanUpCommand',
    onEnable: (bot: Bot) => {
        console.log('CleanUpCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('CleanUpCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
