import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const generateRedSkin = () => {
    // Create a 64x64 red skin
    const png = new PNG({ width: 64, height: 64 });
    
    // Fill with red color (RGBA)
    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const idx = (png.width * y + x) << 2;
            png.data[idx] = 255;     // R
            png.data[idx + 1] = 0;   // G
            png.data[idx + 2] = 0;   // B
            png.data[idx + 3] = 255; // A
        }
    }
    
    // Save to var/skins/
    const skinsDir = join(process.cwd(), 'var', 'skins');
    try {
        mkdirSync(skinsDir, { recursive: true });
    } catch (e) {}
    
    const buffer = PNG.sync.write(png);
    const skinPath = join(skinsDir, 'red-skin.png');
    writeFileSync(skinPath, buffer);
    
    // Create data URL
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    return { skinPath, dataUrl };
};

const onChat = async (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;

    if (message.toLowerCase() === 'red skin') {
        bot.chat('Generating red skin...');
        
        try {
            const { skinPath, dataUrl } = generateRedSkin();
            bot.chat(`Skin saved to ${skinPath}`);
            bot.chat(`Data URL length: ${dataUrl.length} chars`);
            bot.chat(`Preview: ${dataUrl.substring(0, 50)}...`);
        } catch (err) {
            bot.chat(`Error: ${err}`);
        }
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'RedSkinCommand',
    onEnable: (bot: Bot) => {
        console.log('RedSkinCommand enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('RedSkinCommand disabled');
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    }
};

export default behavior;
