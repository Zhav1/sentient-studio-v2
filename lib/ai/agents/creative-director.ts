/**
 * Creative Director Agent
 * 
 * Responsible for generating brand-consistent assets using Nano Banana Pro.
 * Uses gemini-3-pro-image-preview for native image generation.
 * 
 * Responsibilities:
 * - Reference Brand Constitution for all generation decisions
 * - Craft prompts incorporating brand colors, style, and constraints
 * - Iterate based on compliance feedback
 * - Maintain thought signatures for multi-turn editing
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandConstitution } from "@/lib/types";
import {
    type AgentResult,
    CREATIVE_DIRECTOR_SYSTEM_PROMPT,
    generateTaskId,
} from "./types";

// ============ CREATIVE DIRECTOR AGENT ============

export class CreativeDirectorAgent {
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Generate an on-brand asset using Nano Banana Pro
     */
    async generateAsset(
        prompt: string,
        constitution: BrandConstitution | null,
        options?: {
            aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
            enhancePrompt?: boolean;
        }
    ): Promise<AgentResult> {
        const startTime = Date.now();
        const taskId = generateTaskId();

        try {
            // Build brand-enhanced prompt
            const brandPrompt = this.buildBrandPrompt(prompt, constitution);

            // Use Nano Banana Pro for image generation
            const model = this.client.getGenerativeModel({
                model: "gemini-3-pro-image-preview",
            });

            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: brandPrompt }],
                    },
                ],
                generationConfig: {
                    // @ts-expect-error - Gemini 3 image config
                    responseModalities: ["TEXT", "IMAGE"],
                    imageConfig: {
                        aspectRatio: options?.aspectRatio || "16:9",
                    },
                },
            });

            // Extract image from response
            const parts = result.response.candidates?.[0]?.content?.parts || [];
            let imageBase64: string | null = null;
            let responseText: string | null = null;

            for (const part of parts) {
                if ("inlineData" in part && part.inlineData) {
                    imageBase64 = part.inlineData.data;
                }
                if ("text" in part && part.text) {
                    responseText = part.text;
                }
            }

            if (!imageBase64) {
                throw new Error("No image generated in response");
            }

            return {
                taskId,
                role: "creative_director",
                success: true,
                data: {
                    image: imageBase64,
                    prompt: brandPrompt,
                    description: responseText,
                },
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                taskId,
                role: "creative_director",
                success: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Generate multiple variations for A/B testing
     */
    async generateVariations(
        prompt: string,
        constitution: BrandConstitution | null,
        count: number = 2
    ): Promise<AgentResult[]> {
        const results: AgentResult[] = [];
        for (let i = 0; i < count; i++) {
            const variationPrompt = `${prompt} (Variation ${i + 1}: ${i === 0 ? "Standard" : "Alternative composition"})`;
            results.push(await this.generateAsset(variationPrompt, constitution));
        }
        return results;
    }

    /**
     * Enhance prompt with refine suggestions for retry
     */
    async refinePrompt(
        originalPrompt: string,
        feedback: string,
        constitution: BrandConstitution | null
    ): Promise<string> {
        const model = this.client.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: CREATIVE_DIRECTOR_SYSTEM_PROMPT,
        });

        const refinementPrompt = `
<task>
Refine this image generation prompt based on compliance feedback.
</task>

<original_prompt>
${originalPrompt}
</original_prompt>

<feedback>
${feedback}
</feedback>

<brand_constraints>
Colors: ${constitution?.visual_identity.color_palette_hex.join(", ") || "Not specified"}
Style: ${constitution?.visual_identity.photography_style || "Modern"}
Forbidden: ${constitution?.visual_identity.forbidden_elements.join(", ") || "None"}
</brand_constraints>

Return ONLY the refined prompt, no explanation.
`;

        const result = await model.generateContent(refinementPrompt);
        return result.response.text().trim();
    }

    /**
     * Build a brand-enhanced prompt for image generation
     */
    private buildBrandPrompt(
        userPrompt: string,
        constitution: BrandConstitution | null
    ): string {
        if (!constitution) {
            return userPrompt;
        }

        const { visual_identity, voice, brand_essence } = constitution;

        return `
USER INTENT: ${userPrompt}

BRAND DNA (ADHERE STRICTLY):
- Essence: ${brand_essence}
- Colors: ${visual_identity.color_palette_hex.join(", ")}
- Photography Style: ${visual_identity.photography_style}
- Typography/Fonts: ${visual_identity.fonts.join(", ")}
- Composition Rules: ${visual_identity.composition_rules.join(", ")}
- Visual Density: ${visual_identity.visual_density}
- Signature Elements: ${visual_identity.signature_elements.join(", ")}
- Voice Tone: ${voice.tone}
${visual_identity.forbidden_elements.length > 0 ? `- FORBIDDEN ELEMENTS: ${visual_identity.forbidden_elements.join(", ")}` : ""}

SCENE REQUIREMENTS:
Construct a high-end, professional scene that embodies the "${voice.tone}" brand voice. 
Ensure the composition follows "${visual_identity.composition_rules[0] || "balanced"}" principles.
Output should be premium, "Silicon Valley" quality.
`.trim();
    }
}

// ============ FACTORY FUNCTION ============

export function createCreativeDirectorAgent(): CreativeDirectorAgent {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new CreativeDirectorAgent(apiKey);
}
