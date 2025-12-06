import { Bot } from 'mineflayer';
import { Behavior } from '../system/Behavior';
import { goals, Movements } from 'mineflayer-pathfinder';

let isFollowing = false;
let followTarget: string | null = null;

const onTick = (bot: Bot) => {
    if (!isFollowing || !followTarget) return;
    
    const player = bot.players[followTarget];
    if (!player || !player.entity) return;
    
    const pathfinder = (bot as any).pathfinder;
    if (!pathfinder) return;
    
    const distance = bot.entity.position.distanceTo(player.entity.position);
    
    // Follow if more than 3 blocks away
    if (distance > 3) {
        const mcData = require('minecraft-data')(bot.version);
        const movements = new Movements(bot, mcData);
        pathfinder.setMovements(movements);
        pathfinder.setGoal(new goals.GoalFollow(player.entity, 2), true);
    } else if (distance < 2) {
        // Stop if too close
        pathfinder.setGoal(null);
    }
};

const onChat = (bot: Bot, username: string, message: string) => {
    if (username === bot.username) return;
    
    if (message.toLowerCase() === 'follow me') {
        isFollowing = true;
        followTarget = username;
        bot.chat(`Following ${username}!`);
    }
    
    if (message.toLowerCase() === 'stop following') {
        isFollowing = false;
        followTarget = null;
        const pathfinder = (bot as any).pathfinder;
        if (pathfinder) {
            pathfinder.setGoal(null);
        }
        bot.chat('Stopped following!');
    }
};

let boundOnChat: ((username: string, message: string) => void) | null = null;

const behavior: Behavior = {
    name: 'FollowMeBehavior',
    onEnable: (bot: Bot) => {
        console.log('FollowMeBehavior enabled');
        boundOnChat = (username, message) => onChat(bot, username, message);
        bot.on('chat', boundOnChat);
    },
    onDisable: (bot: Bot) => {
        console.log('FollowMeBehavior disabled');
        isFollowing = false;
        followTarget = null;
        if (boundOnChat) {
            bot.off('chat', boundOnChat);
            boundOnChat = null;
        }
    },
    onTick
};

export default behavior;
