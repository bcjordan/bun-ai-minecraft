import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';

class JumpEvery5Seconds implements Behavior {
    name = 'JumpEvery5Seconds';
    private lastJump = 0;

    onEnable(bot: Bot) {
        console.log('JumpEvery5Seconds behavior enabled!');
        this.lastJump = Date.now();
    }

    onDisable(bot: Bot) {
        console.log('JumpEvery5Seconds behavior disabled!');
        bot.setControlState('jump', false);
    }

    onTick(bot: Bot) {
        const now = Date.now();
        if (now - this.lastJump >= 5000) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 100);
            this.lastJump = now;
        }
    }
}

export default new JumpEvery5Seconds();