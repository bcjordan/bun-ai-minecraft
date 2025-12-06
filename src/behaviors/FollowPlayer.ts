import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { goals, Movements } from 'mineflayer-pathfinder';

// Ensure pathfinder is loaded
const pathfinder = require('mineflayer-pathfinder').pathfinder;

class FollowPlayer implements Behavior {
    name = 'FollowPlayer';
    private bot: Bot | null = null;
    private targetPlayerName: string | null = null;

    onEnable(bot: Bot) {
        this.bot = bot;
        console.log('FollowPlayer behavior enabled!');

        // Load pathfinder
        if (!(bot as any).pathfinder) {
            pathfinder(bot);
        }

        // Setup movements
        const mcData = require('minecraft-data')(bot.version);
        const defaultMove = new Movements(bot);
        (bot as any).pathfinder.setMovements(defaultMove);

        // Bind chat listener
        bot.on('chat', this.onChat);
    }

    onDisable(bot: Bot) {
        console.log('FollowPlayer behavior disabled!');
        this.stopFollowing();
        bot.off('chat', this.onChat);
        this.bot = null;
    }

    onTick(bot: Bot) {
        // GoalFollow handles the loop internally, but we can check if target is lost
        if (this.targetPlayerName) {
            const player = bot.players[this.targetPlayerName];
            if (!player || !player.entity) {
                // Player lost or out of range
                // We could print something or just wait
            }
        }
    }

    private onChat = (username: string, message: string) => {
        if (!this.bot) return;
        if (username === this.bot.username) return;

        const msg = message.toLowerCase();

        if (msg.includes('follow me')) {
            this.targetPlayerName = username;
            this.startFollowing();
            this.bot.chat(`Okay, following ${username}!`);
        } else if (msg.includes('stop following')) {
            this.stopFollowing();
            this.bot.chat('Stopped following.');
        }
    }

    private startFollowing() {
        if (!this.bot || !this.targetPlayerName) return;

        const player = this.bot.players[this.targetPlayerName];
        if (player && player.entity) {
            const goal = new goals.GoalFollow(player.entity, 2);
            (this.bot as any).pathfinder.setGoal(goal, true); // true = dynamic goal
        } else {
            this.bot.chat("I can't see you to follow!");
        }
    }

    private stopFollowing() {
        if (!this.bot) return;
        this.targetPlayerName = null;
        (this.bot as any).pathfinder.setGoal(null);
    }
}

export default new FollowPlayer();