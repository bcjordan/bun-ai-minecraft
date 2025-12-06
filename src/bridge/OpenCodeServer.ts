import { spawn, ChildProcess } from 'child_process';

export class OpenCodeServer {
    private process: ChildProcess | null = null;
    private binaryPath: string;
    private port: number;
    private cwd: string;

    constructor(binaryPath: string = 'opencode', port: number = 4096, cwd: string = process.cwd()) {
        this.binaryPath = binaryPath;
        this.port = port;
        this.cwd = cwd;
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Starting OpenCode server on port ${this.port}...`);
            this.process = spawn(this.binaryPath, ['serve', '--port', this.port.toString()], {
                stdio: 'inherit',
                env: process.env,
                cwd: this.cwd
            });

            this.process.on('error', (err) => {
                console.error('Failed to start OpenCode server:', err);
                reject(err);
            });

            // Give it a moment to start up
            // Poll for server readiness
            const startTime = Date.now();
            const checkInterval = 500;
            const timeout = 10000;

            const checkServer = async () => {
                try {
                    console.log(`Checking OpenCode server at http://127.0.0.1:${this.port}/session ...`);
                    const response = await fetch(`http://127.0.0.1:${this.port}/session`);
                    if (response.ok) {
                        console.log('OpenCode server is ready.');
                        resolve();
                        return;
                    } else {
                        console.log(`OpenCode server responded with status: ${response.status}`);
                    }
                } catch (e) {
                    console.log(`OpenCode server check failed: ${e}`);
                    // Ignore connection errors and retry
                }

                if (Date.now() - startTime > timeout) {
                    const msg = `OpenCode server failed to start within ${timeout}ms`;
                    console.error(msg);
                    this.stop();
                    reject(new Error(msg));
                } else {
                    setTimeout(checkServer, checkInterval);
                }
            };

            checkServer();
        });
    }

    public stop() {
        if (this.process) {
            console.log('Stopping OpenCode server...');
            this.process.kill();
            this.process = null;
        }
    }
}
