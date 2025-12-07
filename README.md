# OpenCode Minecraft Bot

A Minecraft bot powered by [Bun](https://bun.sh) and [OpenCode](https://opencode.ai) that can write its own behaviors on the fly.

## Features

- **Self-Coding**: The bot can write new TypeScript behaviors for itself while running.
- **Hot Reloading**: New behaviors are automatically loaded without restarting the bot.
- **Natural Language Control**: Chat with the bot to tell it what to do or what code to write.

## Prerequisites

- [Bun](https://bun.sh/) (runtime)
- [OpenCode](https://opencode.ai) (CLI tool)
- A Minecraft Server (supports versions compatible with Mineflayer, typically 1.8 - 1.20.x)

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/opencode-minecraft-bot.git
    cd opencode-minecraft-bot
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Configure the environment:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your settings:
    - `MC_HOST`: Your Minecraft server address.
    - `MC_PORT`: Your Minecraft server port.
    - `OPENCODE_API_KEY`: Your API key for the LLM provider (e.g., Anthropic, OpenAI).
    - `OPENCODE_BIN`: Path to your `opencode` binary if it's not in your PATH.

## Usage

1.  Start the bot:
    ```bash
    bun run start
    ```

2.  In Minecraft, chat with the bot:
    - "Come here"
    - "Write a behavior to jump when I say jump"
    - "Follow me"

## Project Structure

- `src/index.ts`: Entry point. Sets up the bot, OpenCode server, and bridge.
- `src/behaviors/`: Directory where the bot writes its new behaviors.
- `src/bridge/`: Handles communication between Mineflayer and OpenCode.
- `src/system/`: Core system components like the HotLoader.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

## Docker Setup

You can run the entire stack (OpenCode server + Minecraft Bot) using Docker Compose. This is the recommended way to run the bot as it handles networking and dependencies for you.

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed.
- Local OpenCode configuration (you should be logged in locally via `opencode auth login`).

### Configuration

1.  **Environment Variables**:
    Copy `.env.example` to `.env` and configure your Minecraft server details:
    ```bash
    cp .env.example .env
    ```
    - `MC_HOST`: Hostname of your Minecraft server (use `host.docker.internal` if running locally on the same machine).
    - `MC_PORT`: Port of your Minecraft server (default `25565`).
    - `OPENCODE_MODEL`: The model ID to use (e.g., `claude-sonnet-4-5`).

2.  **Authentication**:
    The Docker setup mounts your local OpenCode configuration to authenticate the bot.
    - By default, it expects your config at `~/.local/share/opencode`.
    - If your config is elsewhere (e.g., `~/.opencode`), update the `volumes` section in `docker-compose.yml`.

### Running the Bot

Start the bot and the OpenCode server:

```bash
docker-compose up --build
```

This will:
1.  Start the OpenCode server container (listening on port 4096).
2.  Start a local Minecraft Server (version 1.20.4) and a backup service.
3.  Start a Redis server for audit logging.
4.  Start the Bot container and connect it to the local server.

The server data will be persisted in `minecraft-data/`, backups in `minecraft-backups/`, and Redis data in `redis-data/`.

### Troubleshooting

- **Server Crashes (Exit Code 137)**: This usually means the OpenCode server ran out of memory.
    - We have configured a `.opencodeignore` file to skip heavy directories like `node_modules`.
    - The `docker-compose.yml` sets a memory limit (`--max-old-space-size=4096`).
    - If it persists, try increasing the memory allocated to Docker Desktop.

- **Connection Refused**:
    - Ensure you are logged in locally (`opencode auth status`).
    - Check that the `opencode` service in Docker is running and healthy.
    - Verify `MC_HOST` is reachable from within the container.

### Known Issues

- **LAN Discovery on macOS**:
    - You might expect the server to automatically appear in your "Multiplayer" > "LAN Worlds" list.
    - **This does not work on Docker Desktop for Mac.**
    - Docker on Mac runs inside a hidden Linux VM. The "multicast" packets used for LAN discovery cannot escape this VM to reach your Mac's game client.
    - **Solution**: Click "Add Server" and enter `localhost` as the address. The server is running, it just can't "shout" loud enough to be heard automatically.
    - *Note: Using `network_mode: host` (the "dangerous" option) does not fix this on Mac for the same reason (it binds to the VM, not your Mac).*
