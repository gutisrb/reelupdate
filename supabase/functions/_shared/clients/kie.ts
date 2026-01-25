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
     * Create a Kling video task and return the taskId
     */
    async createVideoTask(
        prompt: string,
        startImageUrl: string,
        endImageUrl?: string | null,
        negativePrompt?: string
    ): Promise<string> {
        console.log(`[KieClient] Starting Kling video task with prompt: "${prompt}" (Negative: "${negativePrompt || 'Default'}")`);

        const imageInputs = [startImageUrl];
        if (endImageUrl) imageInputs.push(endImageUrl);

        const response = await fetch(API_ENDPOINTS.kie.createTask, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'kling/v2-5-turbo-image-to-video-pro', // Upgraded to 2.5 Turbo Pro
                input: {
                    prompt: prompt,
                    image_url: startImageUrl,
                    tail_image_url: endImageUrl || undefined,
                    duration: "5",
                    cfg_scale: 0.5,
                    negative_prompt: negativePrompt || "blur, distort, low quality, static, frozen"
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

        return taskId;
    }

    /**
     * Generate video using Kling 2.1 Pro via Kie.ai (Sync wrapper)
     */
    async generateVideo(
        prompt: string,
        startImageUrl: string,
        endImageUrl?: string | null,
        negativePrompt?: string
    ): Promise<string> {
        const taskId = await this.createVideoTask(prompt, startImageUrl, endImageUrl, negativePrompt);
        console.log(`[KieClient] Kling Task started: ${taskId}. Waiting for completion...`);
        return await this.waitForCompletion(taskId);
    }

    /**
     * Poll for task completion
     */
    async waitForCompletion(taskId: string): Promise<string> {
        const MAX_RETRIES = 300; // Increased to 5 minutes for Video (Kling can be slow)
        const POLLING_INTERVAL = 3000; // Poll every 3 seconds to be nicer to API

        for (let i = 0; i < MAX_RETRIES; i++) {
            const response = await fetch(API_ENDPOINTS.kie.getTask(taskId), {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            if (!response.ok) {
                console.log(`[KieClient] Polling ${taskId} HTTP Error: ${response.status}. Retrying...`);
                await new Promise(r => setTimeout(r, POLLING_INTERVAL));
                continue;
            }

            const data = await response.json();

            // Handle Kie's internal error codes in 200 response
            if (data.code === 422 && (data.msg?.includes('recordInfo is null') || data.msg?.includes('null'))) {
                console.log(`[KieClient] Polling ${taskId}: Result not ready yet (422 recordInfo is null). Retrying...`);
                await new Promise(r => setTimeout(r, POLLING_INTERVAL));
                continue;
            }

            const status = data.data?.state;
            console.log(`[KieClient] Polling ${taskId}: status=${status} (attempt ${i + 1}/${MAX_RETRIES})`);

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

                if (resultUrl) {
                    console.log(`[KieClient] Task ${taskId} succeeded! URL: ${resultUrl}`);
                    return resultUrl;
                } else {
                    console.error(`[KieClient] Task ${taskId} succeeded but NO URL found! Full data:`, JSON.stringify(data));
                }
            } else if (status === 'failed') {
                console.error(`[KieClient] Task ${taskId} failed! Full data:`, JSON.stringify(data));
                throw new Error(`Kling task failed: ${data.data?.error || 'Unknown error'}`);
            } else if (status === 'pending' || status === 'running' || status === 'queued' || status === 'waiting' || status === 'generating' || status === 'processing') {
                // Continue polling
                console.log(`[KieClient] Task ${taskId} is still ${status}. Retrying...`);
            } else {
                console.warn(`[KieClient] Polling ${taskId}: Unknown status '${status}'. Full data:`, JSON.stringify(data));
            }

            await new Promise(r => setTimeout(r, POLLING_INTERVAL));
        }

        throw new Error('Kling task timed out');
    }

    /**
     * Single check for completion (used for recursive polling)
     */
    async waitForCompletionPollingOnce(taskId: string): Promise<string | null> {
        const response = await fetch(API_ENDPOINTS.kie.getTask(taskId), {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        if (!response.ok) return null;

        const data = await response.json();

        // Handle internal 422 (not ready)
        if (data.code === 422) return null;

        const status = data.data?.state;

        if (status === 'success') {
            let resultUrl = null;
            if (data.data?.resultUrls && Array.isArray(data.data.resultUrls)) {
                resultUrl = data.data.resultUrls[0];
            } else if (data.data?.resultJson) {
                try {
                    const parsed = JSON.parse(data.data.resultJson);
                    if (parsed.resultUrls?.length) resultUrl = parsed.resultUrls[0];
                    if (!resultUrl && parsed.video_url) resultUrl = parsed.video_url;
                    // Suno outputs might be in audio_url or similar
                    if (!resultUrl && parsed.audio_url) resultUrl = parsed.audio_url;
                    if (!resultUrl && parsed.audio_urls?.length) resultUrl = parsed.audio_urls[0];
                } catch (e) {
                    console.warn('Failed to parse resultJson', e);
                }
            }
            return resultUrl;
        } else if (status === 'failed') {
            throw new Error(`Kie task failed: ${data.data?.error || 'Unknown error'}`);
        }

        return null;
    }

    /**
     * Generate music using Suno via Kie.ai
     */
    /**
     * Generate music using Suno via Kie.ai
     */
    async generateMusic(prompt: string, instrumental: boolean = true, callbackUrl?: string): Promise<string> {
        console.log(`[KieClient] Starting Suno music task (V3) with prompt: "${prompt}" (Callback: ${callbackUrl || 'None'})`);

        const response = await fetch(API_ENDPOINTS.kie.generate, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'V3', // V3 is faster and closer to the desired duration than V4
                prompt: prompt,
                customMode: true,
                instrumental: true,
                title: "Real Estate Reel Background",
                style: prompt,
                callBackUrl: callbackUrl || "https://placeholder.com/callback"
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Suno submission failed: ${err}`);
        }

        const data = await response.json();
        const taskId = data.data?.taskId || data.data?.id;

        if (!taskId) {
            throw new Error(`Kie.ai (Suno) did not return a Task ID. Response: ${JSON.stringify(data)}`);
        }

        console.log(`[KieClient] Suno Task started: ${taskId}.`);

        // If we have a callback, we return the taskId so the caller can handle it async
        if (callbackUrl) return taskId;

        // Otherwise fallback to polling
        return await this.waitForCompletion(taskId);
    }
}
