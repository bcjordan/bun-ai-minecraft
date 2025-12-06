import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase().includes("let's cook")) {
        const smokers = bot.inventory.items().filter(item => 
            item.name === 'smoker' || item.name === 'furnace' || item.name === 'blast_furnace'
        );
        
        const coal = bot.inventory.items().filter(item => 
            item.name === 'coal' || item.name === 'charcoal'
        );

        if (smokers.length === 0) {
            bot.chat("No smokers/furnaces to place!");
            return;
        }

        if (coal.length === 0) {
            bot.chat("No coal to use!");
            return;
        }

        const totalCoal = coal.reduce((sum, item) => sum + item.count, 0);
        const coalPerSmoker = Math.floor(totalCoal / smokers.length);

        bot.chat(`Placing ${smokers.length} cooking devices with ${coalPerSmoker} coal each!`);

        const referenceBlock = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        if (!referenceBlock) {
            bot.chat("Can't find ground!");
            return;
        }

        for (let i = 0; i < smokers.length; i++) {
            const smoker = smokers[i];
            const placePos = bot.entity.position.offset(i + 1, 0, 0);
            const placeBlock = bot.blockAt(placePos.offset(0, -1, 0));

            if (placeBlock) {
                try {
                    await bot.equip(smoker, 'hand');
                    await bot.placeBlock(placeBlock, new (require('vec3').Vec3)(0, 1, 0));
                    
                    await bot.waitForTicks(10);
                    
                    const placedBlock = bot.blockAt(placePos);
                    if (placedBlock) {
                        const furnace = await bot.openFurnace(placedBlock);
                        
                        for (let j = 0; j < coalPerSmoker && coal.length > 0; j++) {
                            const coalItem = coal[0];
                            await furnace.putFuel(coalItem.type, null, 1);
                            coalItem.count--;
                            if (coalItem.count === 0) {
                                coal.shift();
                            }
                        }
                        
                        furnace.close();
                    }
                } catch (err) {
                    bot.chat(`Error placing device ${i + 1}: ${err}`);
                }
            }
        }

        bot.chat("Cooking setup complete!");
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'CookCommand',
    onEnable: (bot: Bot) => {
        console.log('CookCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('CookCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
