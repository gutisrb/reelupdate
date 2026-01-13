import { API_KEYS, API_ENDPOINTS } from '../config.ts';

export class KieClient {
    private apiKey = API_KEYS.KIE_AI;

    /**
     * Edit an image using Nano Banana via Kie.ai
     */
    async editImage(imageUrl: string, instruction: string): Promise<string> {
        console.log(`[KieClient] Editing image with instruction: "${instruction}"`);

        // We use the same prompt enhancement logic as in process-furnishing if needed,
        // but the Director Agent should provide a good prompt already.
        // For now, we trust the Director's instruction.

        const response = await fetch(API_ENDPOINTS.kie.createTask, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'nano-banana-pro',
                input: {
                    prompt: instruction,
                    image_input: [imageUrl],
                    output_format: "png",
                    image_size: "9:16" // Default to vertical for Reel
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Kie.ai submission failed: ${err}`);
        }

        const data = await response.json();
        const taskId = data.data?.taskId || data.data?.id;

        if (!taskId) {
            throw new Error(`Kie.ai did not return a Task ID. Response: ${JSON.stringify(data)}`);
        }

        console.log(`[KieClient] Task started: ${taskId}. Waiting for completion...`);

        // Poll for completion
        return await this.waitForCompletion(taskId);
    }

    private async waitForCompletion(taskId: string): Promise<string> {
        const MAX_RETRIES = 60; // 60 seconds max
        const POLLING_INTERVAL = 1000;

        for (let i = 0; i < MAX_RETRIES; i++) {
            const response = await fetch(API_ENDPOINTS.kie.getTask(taskId), {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            if (!response.ok) continue;

            const data = await response.json();
            const status = data.data?.state;

            if (status === 'success') {
                // Kie.ai returns 'resultJson' as a JSON string or resultUrls directly
                let resultUrl = null;

                if (data.data?.resultUrls && Array.isArray(data.data.resultUrls)) {
                    resultUrl = data.data.resultUrls[0];
                } else if (data.data?.resultJson) {
                    try {
                        const parsed = JSON.parse(data.data.resultJson);
                        if (parsed.resultUrls?.length) resultUrl = parsed.resultUrls[0];
                    } catch (e) {
                        console.warn('Failed to parse resultJson', e);
                    }
                }

                if (resultUrl) return resultUrl;
            } else if (status === 'failed') {
                throw new Error(`Kie.ai task failed: ${data.data?.error || 'Unknown error'}`);
            }

            await new Promise(r => setTimeout(r, POLLING_INTERVAL));
        }

        throw new Error('Kie.ai task timed out');
    }
}
