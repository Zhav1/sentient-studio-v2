/**
 * Brand DNA Analyst Agent
 * 
 * Specialized multimodal agent that extracts Brand Constitution from canvas elements.
 * Uses gemini-3-flash-preview for high-reasoning multimodal analysis.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandConstitution, CanvasElement } from "@/lib/types";
import { BRAND_ANALYST_SYSTEM_PROMPT, getAgentThinkingLevel } from "./types";

export class BrandAnalystAgent {
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Extract Brand Constitution from canvas elements
     */
    async extractConstitution(elements: CanvasElement[]): Promise<BrandConstitution> {
        const model = this.client.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: BRAND_ANALYST_SYSTEM_PROMPT,
        });

        // Prepare multimodal parts
        const parts: any[] = [
            { text: "Analyze the following moodboard elements and extract a comprehensive Brand Constitution." }
        ];

        // Add images
        for (const el of elements) {
            if (el.type === "image" && el.url?.startsWith("data:image")) {
                const data = el.url.split(",")[1];
                const mimeType = el.url.split(";")[0].split(":")[1];
                parts.push({
                    inlineData: {
                        data,
                        mimeType,
                    },
                });
            } else if (el.type === "note") {
                parts.push({ text: `Brand Note: ${el.text}` });
            } else if (el.type === "color") {
                parts.push({ text: `Brand Color Suggestion: ${el.color}` });
            }
        }

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
                generationConfig: {
                    responseMimeType: "application/json",
                    // @ts-expect-error - Gemini 3 thinking config
                    thinkingConfig: {
                        includeThoughts: true,
                        thinkingLevel: getAgentThinkingLevel("brand_analyst"),
                    },
                    temperature: 1.0,
                },
            });

            const text = result.response.text();
            return this.validateAndSanitizeConstitution(JSON.parse(text));
        } catch (error) {
            console.error("Brand analysis error:", error);
            throw error;
        }
    }

    /**
     * Validate and sanitize AI response to match BrandConstitution interface
     */
    private validateAndSanitizeConstitution(data: any): BrandConstitution {
        // Fallback-rich validation
        return {
            visual_identity: {
                color_palette_hex: data.visual_identity?.color_palette_hex || ["#000000"],
                photography_style: data.visual_identity?.photography_style || "Professional and clean",
                fonts: data.visual_identity?.fonts || ["Inter", "System Sans"],
                composition_rules: data.visual_identity?.composition_rules || ["Balanced", "Rule of thirds"],
                forbidden_elements: data.visual_identity?.forbidden_elements || [],
                signature_elements: data.visual_identity?.signature_elements || [],
                visual_density: data.visual_identity?.visual_density || "BALANCED",
            },
            voice: {
                tone: data.voice?.tone || "Professional",
                catchphrases: data.voice?.catchphrases || [],
                vocabulary_level: data.voice?.vocabulary_level || "DIRECT",
                keywords: data.voice?.keywords || [],
            },
            content_patterns: {
                thumbnail_structure: data.content_patterns?.thumbnail_structure || "",
                text_overlay_rules: data.content_patterns?.text_overlay_rules || "",
                face_prominence: data.content_patterns?.face_prominence || "MEDIUM",
            },
            risk_thresholds: {
                nudity: data.risk_thresholds?.nudity || "STRICT_ZERO_TOLERANCE",
                political: data.risk_thresholds?.political || "STRICT_ZERO_TOLERANCE",
            },
            brand_essence: data.brand_essence || "A modern, professional brand.",
        };
    }
}
