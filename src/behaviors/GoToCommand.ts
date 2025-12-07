import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { commandDispatcher } from '../system/CommandDispatcher';
import { goals, Movements } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';

const pathfinder = require('mineflayer-pathfinder').pathfinder;

class GoToCommand implements Behavior {
    name = 'GoToCommand';
    private bot: Bot | null = null;
    private targetX: number | null = null;
    private targetZ: number | null = null;
    private lastPosition: Vec3 | null = null;
    private stuckCounter: number = 0;
    private isNavigating: boolean = false;
    private tickCount: number = 0;

    onEnable(bot: Bot) {
        this.bot = bot;
        console.log('GoToCommand behavior enabled!');

        if (!(bot as any).pathfinder) {
            pathfinder(bot);
        }

        const defaultMove = new Movements(bot);
        defaultMove.allowSprinting = true;
        defaultMove.canDig = true;
        (bot as any).pathfinder.setMovements(defaultMove);

        // Register commands with the dispatcher
        commandDispatcher.register({
            name: 'goto',
            description: 'Navigate to X Z coordinates',
            pattern: /(?:go\s*to|come\s*to|goto)\s+(-?\d+)\s+(-?\d+)/,
            handler: (bot, username, args) => {
                this.targetX = parseInt(args[1]);
                this.targetZ = parseInt(args[2]);
                this.startNavigation();
            }
        });

        commandDispatcher.register({
            name: 'stop',
            description: 'Stop navigation',
            pattern: /^stop$/,
            handler: (bot, username, args) => {
                if (this.isNavigating) {
                    this.stopNavigation();
                    bot.chat('Stopped!');
                }
            }
        });
    }

    onDisable(bot: Bot) {
        console.log('GoToCommand behavior disabled!');
        this.stopNavigation();
        commandDispatcher.unregister('goto');
        commandDispatcher.unregister('stop');
        this.bot = null;
    }

    onTick(bot: Bot) {
        if (!this.isNavigating || !this.targetX || !this.targetZ) return;

        this.tickCount++;
        
        // Check every 40 ticks (2 seconds)
        if (this.tickCount % 40 !== 0) return;

        const pos = bot.entity.position;
        const distToTarget = Math.sqrt(
            Math.pow(pos.x - this.targetX, 2) + 
            Math.pow(pos.z - this.targetZ, 2)
        );

        // Arrived?
        if (distToTarget < 3) {
            bot.chat('Made it!');
            this.stopNavigation();
            return;
        }

        // Check if stuck
        if (this.lastPosition) {
            const moved = pos.distanceTo(this.lastPosition);
            if (moved < 0.5) {
                this.stuckCounter++;
                console.log(`Stuck counter: ${this.stuckCounter}`);
                
                if (this.stuckCounter >= 3) {
                    this.tryUnstuck();
                }
            } else {
                this.stuckCounter = 0;
            }
        }

        this.lastPosition = pos.clone();
    }

    private startNavigation() {
        if (!this.bot || !this.targetX || !this.targetZ) return;

        this.isNavigating = true;
        this.stuckCounter = 0;
        this.lastPosition = null;
        this.tickCount = 0;

        this.bot.chat(`Going to ${this.targetX}, ${this.targetZ}!`);

        const goal = new goals.GoalXZ(this.targetX, this.targetZ);
        (this.bot as any).pathfinder.setGoal(goal);
    }

    private tryUnstuck() {
        if (!this.bot) return;

        console.log('Trying to get unstuck...');
        this.stuckCounter = 0;

        // Stop current pathfinding
        (this.bot as any).pathfinder.setGoal(null);

        // Random direction jump
        const randomYaw = Math.random() * Math.PI * 2;
        this.bot.look(randomYaw, 0);
        
        this.bot.setControlState('jump', true);
        this.bot.setControlState('forward', true);
        this.bot.setControlState('sprint', true);

        // After 1 second, stop manual controls and retry pathfinding
        setTimeout(() => {
            if (!this.bot || !this.isNavigating) return;
            
            this.bot.setControlState('jump', false);
            this.bot.setControlState('forward', false);
            this.bot.setControlState('sprint', false);

            // Retry pathfinding
            if (this.targetX && this.targetZ) {
                const goal = new goals.GoalXZ(this.targetX, this.targetZ);
                (this.bot as any).pathfinder.setGoal(goal);
                this.bot.chat('Got unstuck, continuing...');
            }
        }, 1000);
    }

    private stopNavigation() {
        if (!this.bot) return;
        
        this.isNavigating = false;
        this.targetX = null;
        this.targetZ = null;
        this.stuckCounter = 0;
        this.lastPosition = null;
        
        this.bot.setControlState('jump', false);
        this.bot.setControlState('forward', false);
        this.bot.setControlState('sprint', false);
        (this.bot as any).pathfinder.setGoal(null);
    }
}

export default new GoToCommand();
