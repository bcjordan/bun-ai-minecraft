import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    const lowerMessage = message.toLowerCase();
    
    // Match patterns like "make a pickaxe", "make an axe", "craft a sword", etc.
    const makeMatch = lowerMessage.match(/(?:make|craft)\s+(?:a|an|me\s+a|me\s+an)?\s*(pickaxe|axe|sword|shovel|hoe)/);
    
    if (!makeMatch) return;
    
    const toolType = makeMatch[1];
    
    try {
        bot.chat(`Let me craft ${toolType === 'axe' ? 'an' : 'a'} ${toolType} for you!`);

        // Find a crafting table nearby
        const craftingTableBlock = bot.findBlock({
            matching: (block) => block.name === 'crafting_table',
            maxDistance: 32
        });

        // Material priority: diamond > iron > stone > wood (gold excluded, it's terrible)
        const materialPriority = [
            { name: 'diamond', materialName: 'diamond' },
            { name: 'iron', materialName: 'iron_ingot' },
            { name: 'stone', materialName: 'cobblestone' },
            { name: 'wooden', materialName: 'planks' }
        ];

        let craftedTool = false;

        for (const material of materialPriority) {
            const toolName = `${material.name}_${toolType}`;
            
            // Check if we have the required materials
            const hasMaterial = bot.inventory.items().some(item => 
                item.name === material.materialName || 
                (material.materialName === 'planks' && item.name.includes('_planks'))
            );

            const hasSticks = bot.inventory.items().some(item => item.name === 'stick');

            if (!hasMaterial || !hasSticks) {
                continue;
            }

            // Get the recipe
            const mcData = require('minecraft-data')(bot.version);
            const itemData = mcData.itemsByName[toolName];
            
            if (!itemData) {
                continue;
            }

            const recipe = bot.recipesFor(itemData.id, null, 1, craftingTableBlock)?.[0];

            if (!recipe) {
                continue;
            }

            bot.chat(`Found materials for ${material.name} ${toolType}!`);

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

            // Craft the tool
            await bot.craft(recipe, 1, craftingTableBlock ?? undefined);
            bot.chat(`Crafted a ${material.name} ${toolType}!`);
            craftedTool = true;
            break;
        }

        if (!craftedTool) {
            bot.chat(`I don't have the materials to craft a ${toolType}. I need sticks and either diamonds, iron, cobblestone, or planks.`);
        }
    } catch (err) {
        console.error(`Error crafting ${toolType}:`, err);
        bot.chat(`Error crafting ${toolType}: ${err}`);
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'MakeToolCommand',
    onEnable: (bot: Bot) => {
        console.log('MakeToolCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('MakeToolCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
