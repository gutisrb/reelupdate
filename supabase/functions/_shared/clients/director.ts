import { GoogleAIClient } from './google.ts';
import { CREATIVE_WILDCARDS, VIRAL_STRATEGIES } from '../constants/wildcards.ts';
import type { VideoBlueprint, PropertyData, DirectorContext } from '../types.ts';

export class DirectorClient {
    private google: GoogleAIClient;

    constructor(googleClient: GoogleAIClient) {
        this.google = googleClient;
    }

    async generateBlueprint(
        propertyData: PropertyData,
        context: DirectorContext
    ): Promise<VideoBlueprint> {
        console.log('[Director] Generating blueprint with context:', JSON.stringify(context));

        const systemInstruction = `You are the Creative Director for a viral real estate social media agency.
Your goal is to design a unique "Viral Blueprint" for a property video.

GROUND TRUTH DATA (IMMUTABLE):
- Location: ${propertyData.location}
- Size: ${propertyData.size}
- Floor: ${propertyData.sprat}
- Features: ${propertyData.extras}

STRICT RULES:
1. GROUND TRUTH: Your hook must ONLY use the provided Location, Size, and Features.
2. NO HALLUCINATIONS: Never invent locations, districts, or amenities not present in the immutable data.
3. SCRIPT HOOK: Write a viral opening line (max 15 words) in SERBIAN (Latin).
4. NUMBERS: Write all numbers as words in Serbian (e.g., "četrdeset osam").

VIRAL HOOK FRAMEWORKS (Use one of these as inspiration):
- Negative Curiosity: "NE kupuj stan na [Location] dok ne vidiš ovo..."
- Transformation/POV: "POV: Upravo si našao najlepši [Size] stan na [Location]."
- Hidden Gem: "Ovu stvar o [Location] ti niko ne govori..."
- Scarcity/Reality check: "Ovaj [Location] stan neće biti na oglasima ni 24 sata."

OUTPUT FORMAT (JSON):
{
  "strategy_name": "Ime strategije",
  "script_hook": "Viralni hook korišćenjem realne lokacije",
  "visual_hook_type": "motion" | "overlay" | "none", 
  "visual_hook_instruction": "instrukcija" 
}`;

        const prompt = `Generate the Viral Blueprint based on recently used strategies: ${JSON.stringify(context.history_strategies)} and the preferred vibe: "${context.preferred_vibe || context.wildcard}".`;

        const response = await this.google.chat({
            systemInstruction: systemInstruction,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            responseMimeType: "application/json"
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Director Agent returned no content");

        try {
            let clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e) {
            throw new Error(`Failed to parse Director Blueprint: ${content}`);
        }
    }
}
