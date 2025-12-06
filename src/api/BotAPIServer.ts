import { Bot } from 'mineflayer';
import { HotLoader } from '../system/HotLoader';

export class BotAPIServer {
    private bot: Bot;
    private hotLoader: HotLoader;
    private server: any;

    constructor(bot: Bot, hotLoader: HotLoader, port: number = 3000) {
        this.bot = bot;
        this.hotLoader = hotLoader;

        this.server = Bun.serve({
            port,
            fetch: async (req) => {
                const url = new URL(req.url);
                
                try {
                    if (url.pathname === '/api/chat' && req.method === 'POST') {
                        const body = await req.json();
                        this.bot.chat(body.message);
                        return Response.json({ success: true });
                    }

                    if (url.pathname === '/api/execute' && req.method === 'POST') {
                        const body = await req.json();
                        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                        const fn = new AsyncFunction('bot', body.code);
                        const result = await fn(this.bot);
                        return Response.json({ success: true, result });
                    }

                    if (url.pathname === '/api/info' && req.method === 'GET') {
                        const position = this.bot.entity.position;
                        const health = this.bot.health;
                        const food = this.bot.food;
                        const gameMode = this.bot.game.gameMode;

                        const players = Object.values(this.bot.players)
                            .filter(p => p.entity && p.username !== this.bot.username)
                            .map(p => ({
                                username: p.username,
                                distance: p.entity ? this.bot.entity.position.distanceTo(p.entity.position).toFixed(2) : 'unknown'
                            }));

                        const nearbyEntities = Object.values(this.bot.entities)
                            .filter(e => e.type !== 'player' && e.position)
                            .map(e => ({
                                type: e.name || e.type,
                                distance: this.bot.entity.position.distanceTo(e.position).toFixed(2)
                            }))
                            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
                            .slice(0, 5);

                        const info = {
                            username: this.bot.username,
                            position: {
                                x: position.x.toFixed(2),
                                y: position.y.toFixed(2),
                                z: position.z.toFixed(2),
                            },
                            health,
                            food,
                            gameMode,
                            nearbyPlayers: players,
                            nearbyEntities,
                        };

                        return Response.json(info);
                    }

                    if (url.pathname === '/api/reload' && req.method === 'POST') {
                        const body = await req.json();
                        await this.hotLoader.reloadBehavior(body.filename);
                        return Response.json({ success: true });
                    }

                    if (url.pathname === '/api/reload-all' && req.method === 'POST') {
                        await this.hotLoader.reloadAll();
                        return Response.json({ success: true });
                    }

                    return Response.json({ error: 'Not found' }, { status: 404 });
                } catch (err: any) {
                    return Response.json({ error: err.message || String(err) }, { status: 500 });
                }
            },
        });

        console.log(`[BotAPIServer] Started on port ${port}`);
    }

    public stop() {
        if (this.server) {
            this.server.stop();
            console.log('[BotAPIServer] Stopped');
        }
    }
}
