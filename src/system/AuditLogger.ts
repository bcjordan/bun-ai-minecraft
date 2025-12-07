// @ts-ignore - redis types will be available after npm install
import { createClient, RedisClientType } from 'redis';

export type AuditEventType = 'chat' | 'bot_chat' | 'command' | 'execute' | 'behavior_reload' | 'bot_event';

export interface AuditEvent {
    id: string;
    timestamp: number;
    type: AuditEventType;
    data: Record<string, any>;
}

class AuditLogger {
    private client: RedisClientType | null = null;
    private connected: boolean = false;
    private readonly AUDIT_KEY = 'minecraft:audit:events';
    private readonly MAX_EVENTS = 10000; // Keep last 10k events

    async connect(): Promise<void> {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        try {
            this.client = createClient({ url: redisUrl });
            
            this.client.on('error', (err: Error) => {
                console.error('[AuditLogger] Redis error:', err.message);
                this.connected = false;
            });

            this.client.on('connect', () => {
                console.log('[AuditLogger] Connected to Redis');
                this.connected = true;
            });

            await this.client.connect();
        } catch (err: any) {
            console.error('[AuditLogger] Failed to connect to Redis:', err.message);
            this.connected = false;
        }
    }

    async log(type: AuditEventType, data: Record<string, any>): Promise<void> {
        if (!this.client || !this.connected) {
            return; // Silently skip if not connected
        }

        const event: AuditEvent = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timestamp: Date.now(),
            type,
            data
        };

        try {
            // Add to list and trim to max size
            await this.client.lPush(this.AUDIT_KEY, JSON.stringify(event));
            await this.client.lTrim(this.AUDIT_KEY, 0, this.MAX_EVENTS - 1);
        } catch (err: any) {
            console.error('[AuditLogger] Failed to log event:', err.message);
        }
    }

    async logChat(username: string, message: string): Promise<void> {
        await this.log('chat', { username, message });
    }

    async logBotChat(botUsername: string, message: string): Promise<void> {
        await this.log('bot_chat', { username: botUsername, message });
    }

    async logCommand(username: string, command: string, matched: boolean): Promise<void> {
        await this.log('command', { username, command, matched });
    }

    async logExecute(code: string, success: boolean, error?: string): Promise<void> {
        await this.log('execute', { code, success, error });
    }

    async logBehaviorReload(filename: string): Promise<void> {
        await this.log('behavior_reload', { filename });
    }

    async logBotEvent(event: string, data?: Record<string, any>): Promise<void> {
        await this.log('bot_event', { event, ...data });
    }

    async getEvents(count: number = 100, type?: AuditEventType): Promise<AuditEvent[]> {
        if (!this.client || !this.connected) {
            return [];
        }

        try {
            const rawEvents = await this.client.lRange(this.AUDIT_KEY, 0, count - 1);
            let events = rawEvents.map((e: string) => JSON.parse(e) as AuditEvent);
            
            if (type) {
                events = events.filter((e: AuditEvent) => e.type === type);
            }
            
            return events;
        } catch (err: any) {
            console.error('[AuditLogger] Failed to get events:', err.message);
            return [];
        }
    }

    async getEventsByTimeRange(startTime: number, endTime: number): Promise<AuditEvent[]> {
        const allEvents = await this.getEvents(this.MAX_EVENTS);
        return allEvents.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
    }

    async getStats(): Promise<Record<string, number>> {
        const events = await this.getEvents(this.MAX_EVENTS);
        const stats: Record<string, number> = {
            total: events.length,
            chat: 0,
            bot_chat: 0,
            command: 0,
            execute: 0,
            behavior_reload: 0,
            bot_event: 0
        };

        for (const event of events) {
            stats[event.type] = (stats[event.type] || 0) + 1;
        }

        return stats;
    }

    isConnected(): boolean {
        return this.connected;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.connected = false;
        }
    }
}

// Singleton instance
export const auditLogger = new AuditLogger();
