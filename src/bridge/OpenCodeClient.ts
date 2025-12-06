export class OpenCodeClient {
    private baseUrl: string;
    private apiKey: string | undefined;
    private sessionId: string | null = null;

    constructor(baseUrl: string = 'http://127.0.0.1:4096', apiKey?: string) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.apiKey = apiKey;
    }

    private async request(endpoint: string, method: string = 'GET', body?: any, timeoutMs: number = 30000) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`OpenCode API Error: ${response.status} ${response.statusText} - ${text}`);
            }

            return await response.json();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error(`Request to ${endpoint} timed out after ${timeoutMs}ms`);
            }
            console.error(`Failed to request ${endpoint}:`, error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    public async createSession(title: string = 'Minecraft Bridge') {
        const maxRetries = 10;
        const retryDelay = 2000;

        // Skip manual auth configuration since we are mounting local config
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Updated to match v1.0 spec: POST /session { title: string }
                const res = await this.request('/session', 'POST', { title });
                this.sessionId = res.id;
                console.log(`Created OpenCode session: ${this.sessionId}`);
                return this.sessionId;
            } catch (e) {
                console.warn(`Attempt ${i + 1}/${maxRetries}: Could not create session. Is OpenCode running? Retrying in ${retryDelay}ms...`);
                if (i === maxRetries - 1) {
                    console.error('Failed to create session after multiple attempts.', e);
                    return null;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        return null;
    }

    public async initializeSession(model: { providerID: string, modelID: string }) {
        if (!this.sessionId) return false;
        
        try {
            console.log('Initializing session (Analyzing app)...');
            // POST /session/:id/init { messageID, providerID, modelID }
            await this.request(`/session/${this.sessionId}/init`, 'POST', {
                messageID: `msg_${crypto.randomUUID()}`,
                providerID: model.providerID,
                modelID: model.modelID
            }, 120000); // 2 minute timeout for initialization
            console.log('Session initialized successfully.');
            return true;
        } catch (e) {
            console.error('Failed to initialize session:', e);
            return false;
        }
    }

    public async sendPrompt(message: string, model?: { providerID: string, modelID: string }) {
        // If no session, try to create one
        if (!this.sessionId) {
            console.log('No active session. Attempting to create one...');
            const sid = await this.createSession();
            if (sid && model) {
                await this.initializeSession(model);
            }
        }

        if (!this.sessionId) {
            console.warn('Failed to create session. Cannot send prompt.');
            return null;
        }

        console.log(`Sending prompt to OpenCode: "${message}"`);
        
        const makeRequest = async () => {
             const body: any = {
                parts: [{
                    type: 'text',
                    text: message
                }]
            };

            if (model) {
                body.model = model;
            }

            const response = await this.request(`/session/${this.sessionId}/message`, 'POST', body, 120000); // 2 minute timeout for generation
            
            return response;
        };

        try {
            return await makeRequest();
        } catch (e: any) {
            console.warn('Failed to send prompt. Attempting session recovery...', e.message);
            
            // If request failed, try to recover session
            this.sessionId = null; // Clear invalid session
            const sid = await this.createSession();
            if (sid && model) {
                await this.initializeSession(model);
                
                // Retry request once
                try {
                    console.log('Retrying prompt with new session...');
                    return await makeRequest();
                } catch (retryError) {
                    console.error('Failed to send prompt after session recovery:', retryError);
                    return null;
                }
            }
            return null;
        }
    }
}
