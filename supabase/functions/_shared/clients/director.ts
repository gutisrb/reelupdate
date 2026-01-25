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
1. SCRIPT HOOK: Write a viral opening line (max 15 words) in SERBIAN (Latin).
2. NIKADA ne izmišljaj podatke. Ako ne piše "Vračar", ne pominji "Vračar".
3. Ako piše "40+8", tvoj hook treba da pominje "četrdeset osam kvadrata".
4. Ako SPRAT nije naveden, hook ne sme da pominje sprat.

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
