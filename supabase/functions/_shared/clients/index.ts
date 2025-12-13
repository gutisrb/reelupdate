// Export all API clients

export { CloudinaryClient } from './cloudinary.ts';
export { LumaClient } from './luma.ts';
export { OpenAIClient } from './openai.ts';
export { GoogleAIClient } from './google.ts';
export { ElevenLabsClient } from './elevenlabs.ts';
export { ZapCapClient } from './zapcap.ts';

import { CloudinaryClient } from './cloudinary.ts';
import { LumaClient } from './luma.ts';
import { OpenAIClient } from './openai.ts';
import { GoogleAIClient } from './google.ts';
import { ElevenLabsClient } from './elevenlabs.ts';
import { ZapCapClient } from './zapcap.ts';
import { API_KEYS } from '../config.ts';

export function initClients() {
    return {
        cloudinary: new CloudinaryClient(),
        luma: new LumaClient(),
        openai: new OpenAIClient(),
        google: new GoogleAIClient(),
        elevenlabs: new ElevenLabsClient(),
        zapcap: new ZapCapClient(),
    };
}
