import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const gatherWood = async (bot: Bot, amount: number = 1): Promise<boolean> => {
    try {
        bot.chat('Looking for wood...');
        
        const logBlock = bot.findBlock({
            matching: (block) => block.name.includes('log'),
            maxDistance: 64
        });

        if (!logBlock) {
            bot.chat('No trees nearby!');
            return false;
        }

        bot.chat('Found a tree! Chopping...');
        
        const pathfinder = require('mineflayer-pathfinder');
        if (bot.pathfinder) {
            await bot.pathfinder.goto(new pathfinder.goals.GoalNear(
                logBlock.position.x,
                logBlock.position.y,
                logBlock.position.z,
                1
            ));
        }

        for (let i = 0; i < amount; i++) {
            const log = bot.findBlock({
                matching: (block) => block.name.includes('log'),
                maxDistance: 4
            });
            
            if (!log) break;
            
            await bot.dig(log);
        }

        bot.chat('Gathered wood!');
        return true;
    } catch (err) {
        console.error('Error gathering wood:', err);
        return false;
    }
};

const gatherCobblestone = async (bot: Bot, amount: number = 3): Promise<boolean> => {
    try {
        bot.chat('Looking for stone...');
        
        const stoneBlock = bot.findBlock({
            matching: (block) => block.name === 'stone',
            maxDistance: 64
        });

        if (!stoneBlock) {
            bot.chat('No stone nearby!');
            return false;
        }

        bot.chat('Found stone! Mining...');
        
        const pathfinder = require('mineflayer-pathfinder');
        if (bot.pathfinder) {
            await bot.pathfinder.goto(new pathfinder.goals.GoalNear(
                stoneBlock.position.x,
                stoneBlock.position.y,
                stoneBlock.position.z,
                1
            ));
        }

        for (let i = 0; i < amount; i++) {
            const stone = bot.findBlock({
                matching: (block) => block.name === 'stone',
                maxDistance: 4
            });
            
            if (!stone) break;
            
            await bot.dig(stone);
        }

        bot.chat('Gathered cobblestone!');
        return true;
    } catch (err) {
        console.error('Error gathering cobblestone:', err);
        return false;
    }
};

const craftPlanks = async (bot: Bot): Promise<boolean> => {
    try {
        const logs = bot.inventory.items().filter(item => item.name.includes('log'));
        if (logs.length === 0) return false;

        const mcData = require('minecraft-data')(bot.version);
        const planksRecipe = bot.recipesFor(mcData.itemsByName['oak_planks']?.id || mcData.itemsByName['planks']?.id)?.[0];
        
        if (!planksRecipe) return false;

        await bot.craft(planksRecipe, 1, null);
        bot.chat('Crafted planks!');
        return true;
    } catch (err) {
        console.error('Error crafting planks:', err);
        return false;
    }
};

const craftSticks = async (bot: Bot): Promise<boolean> => {
    try {
        const planks = bot.inventory.items().filter(item => item.name.includes('planks'));
        if (planks.length === 0) return false;

        const mcData = require('minecraft-data')(bot.version);
        const sticksRecipe = bot.recipesFor(mcData.itemsByName['stick']?.id)?.[0];
        
        if (!sticksRecipe) return false;

        await bot.craft(sticksRecipe, 1, null);
        bot.chat('Crafted sticks!');
        return true;
    } catch (err) {
        console.error('Error crafting sticks:', err);
        return false;
    }
};

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('make') && lowerMessage.includes('pickaxe')) {
        try {
            bot.chat('Let me craft a pickaxe for you!');

            // Find a crafting table nearby or in inventory
            const craftingTableBlock = bot.findBlock({
                matching: (block) => block.name === 'crafting_table',
                maxDistance: 32
            });

            // Determine pickaxe type based on available materials
            const pickaxeTypes = [
                { name: 'diamond_pickaxe', material: 'diamond', count: 3, canGather: false },
                { name: 'iron_pickaxe', material: 'iron_ingot', count: 3, canGather: false },
                { name: 'stone_pickaxe', material: 'cobblestone', count: 3, canGather: true },
                { name: 'wooden_pickaxe', material: 'planks', count: 3, canGather: true }
            ];

            let craftedPickaxe = false;

            for (const pickaxeType of pickaxeTypes) {
                // Check if we have the required materials
                let hasMaterial = bot.inventory.items().some(item => 
                    item.name.includes(pickaxeType.material) || 
                    (pickaxeType.material === 'planks' && item.name.includes('_planks'))
                );

                let hasSticks = bot.inventory.items().some(item => item.name === 'stick');

                // Try to gather materials if we don't have them
                if (!hasMaterial && pickaxeType.canGather) {
                    if (pickaxeType.material === 'cobblestone') {
                        bot.chat('Need cobblestone, gathering...');
                        await gatherCobblestone(bot, pickaxeType.count);
                        hasMaterial = bot.inventory.items().some(item => item.name === 'cobblestone');
                    } else if (pickaxeType.material === 'planks') {
                        bot.chat('Need planks, gathering wood...');
                        await gatherWood(bot, 2);
                        await craftPlanks(bot);
                        hasMaterial = bot.inventory.items().some(item => item.name.includes('_planks'));
                    }
                }

                if (!hasSticks && pickaxeType.canGather) {
                    bot.chat('Need sticks, crafting...');
                    // Make sure we have planks for sticks
                    if (!bot.inventory.items().some(item => item.name.includes('_planks'))) {
                        await gatherWood(bot, 1);
                        await craftPlanks(bot);
                    }
                    await craftSticks(bot);
                    hasSticks = bot.inventory.items().some(item => item.name === 'stick');
                }

                if (!hasMaterial || !hasSticks) {
                    continue;
                }

                // Get the recipe
                const mcData = require('minecraft-data')(bot.version);
                const recipe = bot.recipesFor(mcData.itemsByName[pickaxeType.name]?.id, null, 1, craftingTableBlock)?.[0];

                if (!recipe) {
                    continue;
                }

                bot.chat(`Found materials for ${pickaxeType.name.replace('_', ' ')}!`);

                // Move to crafting table if needed
                if (craftingTableBlock && recipe.requiresTable) {
                    const pathfinder = require('mineflayer-pathfinder');
                    if (bot.pathfinder) {
                        await bot.pathfinder.goto(new pathfinder.goals.GoalNear(
                            craftingTableBlock.position.x,
                            craftingTableBlock.position.y,
                            craftingTableBlock.position.z,
                            1
                        ));
                    }
                }

                // Craft the pickaxe
                await bot.craft(recipe, 1, craftingTableBlock ?? undefined);
                bot.chat(`Crafted a ${pickaxeType.name.replace('_', ' ')}!`);
                craftedPickaxe = true;
                break;
            }

            if (!craftedPickaxe) {
                bot.chat("I couldn't gather enough materials to craft a pickaxe.");
            }
        } catch (err) {
            console.error('Error crafting pickaxe:', err);
            bot.chat(`Error crafting pickaxe: ${err}`);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'MakePickaxeCommand',
    onEnable: (bot: Bot) => {
        console.log('MakePickaxeCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('MakePickaxeCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;

