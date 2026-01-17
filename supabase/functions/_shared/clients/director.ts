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
- Price Mention Strategy: ${propertyData.price_mention || 'video'} (If 'description', do not mention price in hook. If 'contact_for_price', use contact-based hooks.)
- Location: ${propertyData.location}
- Features: ${propertyData.extras}
- Bed/Bath: ${propertyData.beds} beds, ${propertyData.baths} baths

ANTI-REPETITION RULES:
- You CANNOT use these recently used strategies: ${JSON.stringify(context.history_strategies)}
- You CANNOT use these recently used strategies: ${JSON.stringify(context.history_strategies)}
- ${context.preferred_vibe ? `You MUST apply this User-Selected Vibe: "${context.preferred_vibe}" (Ignore conflicting wildcards)` : `You MUST apply this Creative Constraint: "${context.wildcard}"`}
- BRANDING: The user's brand logo is located at: ${context.brand_logo_url || 'None'}. 
  ${context.brand_colors ? `Preferred colors: ${context.brand_colors.primary || 'default'} and ${context.brand_colors.secondary || 'default'}.` : ''}
  When designing visual hooks (especially overlays), try to match the brand colors and aesthetic.


AVAILABLE STRATEGIES (Reference Only):
${JSON.stringify(VIRAL_STRATEGIES)}

VISUAL HOOK PRESETS (Use these EXACT names in "visual_hook_instruction" to trigger custom multi-pass logic):
- "Agent Fail": Adds a standing agent (Frame 1) then a falling agent (Frame 2). Viral/Catchy.
- "Start with Blur": Frame 1 is blurred, Frame 2 is clear. Mysterious.
- "Empty to Furnished": Frame 1 is the empty room, Frame 2 is staged with furniture.
- "Furnished to Empty": Frame 1 is the original, Frame 2 is the empty shell.
- "Labubu": Adds a giant mascot toy to Frame 2.
- "Sketch": Frame 1 is a pencil drawing, Frame 2 is the photo.
- "Low Battery": Adds an iPhone low battery overlay (20%) to the scene.

TASK:
1. Select a unique Strategy Name (Must be in SERBIAN, e.g. "Istorijska Prilika").
2. Write a SCRIPT HOOK (Opening Line) - max 15 words. MUST be in SERBIAN (Latin).
3. Design a VISUAL HOOK:
   - "motion": You instruct an AI IMAGE EDITOR (Kie.ai) to change the image content. 
     * GUIDELINE: Describe a change in OBJECTS, LIGHTING, or ACTORS.
     * PRESETS: If appropriate, use one of the PRESET names above as the "visual_hook_instruction".
     * WARNING: DO NOT use camera words like "walk", "pan", "zoom", "opening", "view" or "angle" for "motion". Those are for the video engine. If you want a camera movement, use "none" or specify it separately.
   - "overlay": You instruct text overlay (e.g. "Cena: 245k").
   - "none": Standard video.

OUTPUT JSON:
{
  "strategy_name": "string",
  "script_hook": "string",
  "visual_hook_type": "motion" | "overlay" | "none", 
  "visual_hook_instruction": "string" 
} (If visual_hook_type is motion, use a PRESET name or a content-edit instruction. If overlay, describe the text context.)`;

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
