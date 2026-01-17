import { API_KEYS, API_ENDPOINTS } from '../config.ts';

export class KieClient {
    private apiKey = API_KEYS.KIE_AI;

    /**
     * Edit an image using Nano Banana via Kie.ai
     */
    async editImage(imageUrl: string, instruction: string, userPrompt?: string, referenceImageUrl?: string): Promise<string> {
        // Use userPrompt if provided, otherwise fallback to instruction
        const finalPrompt = userPrompt && userPrompt.trim().length > 0 ? userPrompt : instruction;
        console.log(`[KieClient] Editing image with prompt: "${finalPrompt}" (User Override: ${!!userPrompt}${referenceImageUrl ? ', With Reference' : ''})`);

        // Build image_input array
        const imageInputs = [imageUrl];
        if (referenceImageUrl) imageInputs.push(referenceImageUrl);

        const response = await fetch(API_ENDPOINTS.kie.createTask, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'nano-banana-pro',
                input: {
                    prompt: finalPrompt,
                    image_input: imageInputs,
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

    /**
     * Generate video using Kling 2.1 Pro via Kie.ai
     */
    async generateVideo(
        prompt: string,
        startImageUrl: string,
        endImageUrl?: string | null
    ): Promise<string> {
        console.log(`[KieClient] Generating Kling video with prompt: "${prompt}"`);

        const imageInputs = [startImageUrl];
        if (endImageUrl) imageInputs.push(endImageUrl);

        const response = await fetch(API_ENDPOINTS.kie.createTask, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'kling/v2-1-pro-image-to-video', // Specific model for Pro
                input: {
                    prompt: prompt,
                    image_input: imageInputs,
                    duration: "5", // Standard duration
                    aspect_ratio: "16:9", // Default, but usually input images dictate this for i2v
                    output_format: "mp4",
                    camera_control: {
                        type: "simple", // Or advanced if needed, but simple is safer to start
                        horizontal: 0,
                        vertical: 0,
                        zoom: 0,
                        roll: 0
                    }
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Kling submission failed: ${err}`);
        }

        const data = await response.json();
        const taskId = data.data?.taskId || data.data?.id;

        if (!taskId) {
            throw new Error(`Kie.ai (Kling) did not return a Task ID. Response: ${JSON.stringify(data)}`);
        }

        console.log(`[KieClient] Kling Task started: ${taskId}. Waiting for completion...`);

        // Poll for completion (reusing the robust logic)
        return await this.waitForCompletion(taskId);
    }

    private async waitForCompletion(taskId: string): Promise<string> {
        const MAX_RETRIES = 300; // Increased to 5 minutes for Video (Kling can be slow)
        const POLLING_INTERVAL = 3000; // Poll every 3 seconds to be nicer to API

        for (let i = 0; i < MAX_RETRIES; i++) {
            const response = await fetch(API_ENDPOINTS.kie.getTask(taskId), {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            if (!response.ok) continue;

            const data = await response.json();
            const status = data.data?.state;

            if (status === 'success') {
                // Kling usually returns resultUrls
                let resultUrl = null;

                if (data.data?.resultUrls && Array.isArray(data.data.resultUrls)) {
                    resultUrl = data.data.resultUrls[0];
                } else if (data.data?.resultJson) {
                    try {
                        const parsed = JSON.parse(data.data.resultJson);
                        if (parsed.resultUrls?.length) resultUrl = parsed.resultUrls[0];
                        // Some endpoints might use different keys, fallback check
                        if (!resultUrl && parsed.video_url) resultUrl = parsed.video_url;
                    } catch (e) {
                        console.warn('Failed to parse resultJson', e);
                    }
                }

                if (resultUrl) return resultUrl;
            } else if (status === 'failed') {
                throw new Error(`Kling task failed: ${data.data?.error || 'Unknown error'}`);
            }

            await new Promise(r => setTimeout(r, POLLING_INTERVAL));
        }

        throw new Error('Kling task timed out');
    }
}
