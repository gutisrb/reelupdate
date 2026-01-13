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

import { KieClient } from './kie.ts';
import { DirectorClient } from './director.ts';

export const initClients = () => {
    const openai = new OpenAIClient();
    const elevenlabs = new ElevenLabsClient();
    const google = new GoogleAIClient();
    const cloudinary = new CloudinaryClient();
    const luma = new LumaClient();
    const zapcap = new ZapCapClient();
    const kie = new KieClient();
    const director = new DirectorClient(openai);

    return {
        openai,
        elevenlabs,
        google,
        cloudinary,
        luma,
        zapcap,
        kie,
        director
    };
};
