import { OpenAIClient } from './openai.ts';
import { CREATIVE_WILDCARDS, VIRAL_STRATEGIES } from '../constants/wildcards.ts';
import type { VideoBlueprint, PropertyData, DirectorContext } from '../types.ts';

export class DirectorClient {
    private openai: OpenAIClient;

    constructor(openaiClient: OpenAIClient) {
        this.openai = openaiClient;
    }

    async generateBlueprint(
        propertyData: PropertyData,
        context: DirectorContext
    ): Promise<VideoBlueprint> {
        console.log('[Director] Generating blueprint with context:', JSON.stringify(context));

        const prompt = `You are the Creative Director for a viral real estate social media agency.
Your goal is to design a unique "Viral Blueprint" for a property video.

INPUT DATA:
- Title: ${propertyData.title}
- Price: ${propertyData.price}
- Location: ${propertyData.location}
- Features: ${propertyData.extras}
- Bed/Bath: ${propertyData.beds} beds, ${propertyData.baths} baths

ANTI-REPETITION RULES:
- You CANNOT use these recently used strategies: ${JSON.stringify(context.history_strategies)}
- You CANNOT use these recently used strategies: ${JSON.stringify(context.history_strategies)}
- ${context.preferred_vibe ? `You MUST apply this User-Selected Vibe: "${context.preferred_vibe}" (Ignore conflicting wildcards)` : `You MUST apply this Creative Constraint: "${context.wildcard}"`}


AVAILABLE STRATEGIES (Reference Only):
${JSON.stringify(VIRAL_STRATEGIES)}

TASK:
1. Select a unique Strategy Name (invent one if needed to fit the constraint).
2. Write a SCRIPT HOOK (Opening Line) - max 15 words. MUST be catchy/viral.
3. Design a VISUAL HOOK (Opening Scene Logic).
   - "motion": You instruct an AI editor to physically change the image (e.g. "Add a person tripping").
   - "overlay": You instruct the system to overlay text (e.g. "Price Reveal"). Use this for specific data like Price.
   - "none": Standard video.

Strictly adhere to the Creative Constraint.

OUTPUT JSON:
{
  "strategy_name": "string",
  "script_hook": "string",
  "visual_hook_type": "motion" | "overlay" | "none", 
  "visual_hook_instruction": "string" (Specific instruction for Kie.ai or Cloudinary. For overlay, specify the EXACT text to display. For motion, describe the visual edit.)
}`;

        const response = await this.openai.chat({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            temperature: 0.9 // High creativity
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
