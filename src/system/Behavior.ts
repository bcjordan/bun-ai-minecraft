import { Bot } from 'mineflayer';

export interface Behavior {
    name: string;
    onEnable(bot: Bot): void;
    onDisable(bot: Bot): void;
    onTick?(bot: Bot): void;
}
