import { BotManager } from './bot/BotManager';
import { HotLoader } from './system/HotLoader';
import { OpenCodeBridge } from './bridge/OpenCodeBridge';
import { OpenCodeClient } from './bridge/OpenCodeClient';
import { OpenCodeServer } from './bridge/OpenCodeServer';
import { botRegistry } from './system/BotRegistry';
import { BotAPIServer } from './api/BotAPIServer';
import { commandDispatcher } from './system/CommandDispatcher';
import { auditLogger } from './system/AuditLogger';
import { join } from 'path';

const BOT_USERNAME = process.env.MC_USERNAME || 'OpenCodeBot';
const HOST = process.env.MC_HOST || 'localhost';
const PORT = parseInt(process.env.MC_PORT || '25565');
const OPENCODE_BIN = process.env.OPENCODE_BIN || 'opencode';
const OPENCODE_PORT = parseInt(process.env.OPENCODE_PORT || '4096');
const OPENCODE_URL = process.env.OPENCODE_URL || `http://127.0.0.1:${OPENCODE_PORT}`;
// Default to a free model if not specified
const OPENCODE_PROVIDER = process.env.OPENCODE_PROVIDER || 'anthropic';
const OPENCODE_MODEL = process.env.OPENCODE_MODEL || 'claude-sonnet-4-5';

const botManager = new BotManager({
    host: HOST,
    port: PORT,
    username: BOT_USERNAME,
});

// Start OpenCode Server if not skipped (e.g. running in Docker)
if (!process.env.SKIP_OPENCODE_SERVER) {
    const server = new OpenCodeServer(OPENCODE_BIN, OPENCODE_PORT, process.cwd());
    server.start().catch(err => console.error('Server start failed', err));
} else {
    console.log('Skipping local OpenCode server start (SKIP_OPENCODE_SERVER is set)');
}

let currentHotLoader: HotLoader | null = null;
let chatListener: ((username: string, message: string) => void) | null = null;
let currentAPIServer: BotAPIServer | null = null;

botManager.on('spawn', async (bot) => {
    console.log('Bot connected to server!');

    try {
    // Cleanup previous instances
    if (currentHotLoader) {
        console.log('Stopping previous HotLoader...');
        currentHotLoader.stop();
        currentHotLoader = null;
    }

    if (currentAPIServer) {
        console.log('Stopping previous API Server...');
        currentAPIServer.stop();
        currentAPIServer = null;
    }

    if (chatListener) {
        botManager.removeListener('chat', chatListener);
        chatListener = null;
    }
    
    // Initialize OpenCode Client
    const client = new OpenCodeClient(OPENCODE_URL, process.env.OPENCODE_API_KEY);
    
    // Model Configuration
    const modelConfig = {
        providerID: OPENCODE_PROVIDER,
        modelID: OPENCODE_MODEL
    };

    // Try to start a session (non-blocking - init happens on first message)
    client.createSession('Minecraft Bridge Session').catch(err =>
        console.error('Failed to create session:', err)
    );

    // Initialize Bridge with Model Config
    const bridge = new OpenCodeBridge(bot, client, modelConfig);
    
    // Initialize Hot Loader
    const behaviorsPath = join(process.cwd(), 'src', 'behaviors');
    console.log('Creating HotLoader with path:', behaviorsPath);
    const hotLoader = new HotLoader(bot, behaviorsPath);
    console.log('Starting HotLoader...');
    hotLoader.startWatching();
    console.log('HotLoader started!');
    currentHotLoader = hotLoader;

    // Register bot with BotRegistry for OpenCode tools
    console.log('Registering bot with BotRegistry...');
    botRegistry.registerBot(bot, hotLoader);
    console.log('Bot registered!');

    // Initialize CommandDispatcher for programmatic command execution
    console.log('Initializing CommandDispatcher...');
    commandDispatcher.setBot(bot);
    console.log('CommandDispatcher initialized!');

    // Start API Server for OpenCode tools
    console.log('Starting BotAPIServer...');
    const apiServer = new BotAPIServer(bot, hotLoader, 3000);
    currentAPIServer = apiServer;
    console.log('BotAPIServer started!');

    // Code Queue disabled - using CodeQueueCommand behavior instead
    // const queuePath = join(process.cwd(), 'var', 'code-queue');
    // const codeQueue = new CodeQueue(bot, queuePath);
    // codeQueue.startWatching();

    // Bridge disabled - using OpenCode custom tools instead
    chatListener = (username, message) => {
        // Log bot's own messages separately
        if (username === bot.username) {
            auditLogger.logBotChat(username, message);
            return; // Don't forward bot's own messages to the bridge
        }
        // Log all chat to audit log
        auditLogger.logChat(username, message);
        bridge.handleChat(username, message);
    };
    botManager.on('chat', chatListener);
    
    // Log bot spawn event
    auditLogger.logBotEvent('spawn', { username: bot.username });

    } catch (error) {
        console.error('Error in spawn handler:', error);
    }
});

// Initialize audit logger
auditLogger.connect().then(() => {
    console.log('Audit logger initialized');
}).catch((err: Error) => {
    console.error('Failed to initialize audit logger:', err.message);
});

console.log(`Starting bot... connecting to ${HOST}:${PORT}`);
botManager.start();
