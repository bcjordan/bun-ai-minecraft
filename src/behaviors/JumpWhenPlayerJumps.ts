import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

class JumpWhenPlayerJumps implements Behavior {
    name = 'JumpWhenPlayerJumps';
    private targetPlayer = 'brianjo';
    private lastY = 0;
    private isJumping = false;

    onEnable(bot: Bot) {
        console.log('JumpWhenPlayerJumps behavior enabled!');
        const player = bot.players[this.targetPlayer];
        if (player && player.entity) {
            this.lastY = player.entity.position.y;
        }
    }

    onDisable(bot: Bot) {
        console.log('JumpWhenPlayerJumps behavior disabled!');
        bot.setControlState('jump', false);
    }

    onTick(bot: Bot) {
        const player = bot.players[this.targetPlayer];
        if (player && player.entity) {
            const currentY = player.entity.position.y;
            if (currentY > this.lastY + 0.4 && !this.isJumping) {
                this.isJumping = true;
                bot.setControlState('jump', true);
                setTimeout(() => {
                    bot.setControlState('jump', false);
                    this.isJumping = false;
                }, 500);
            }
            this.lastY = currentY;
        }
    }
}

export default new JumpWhenPlayerJumps();