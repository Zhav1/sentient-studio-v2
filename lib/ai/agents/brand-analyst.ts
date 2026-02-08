/**
 * Brand DNA Analyst Agent
 * 
 * Specialized agent for extracting brand constitution from visual content.
 * Uses gemini-3-flash-preview for multimodal analysis.
 * 
 * Responsibilities:
 * - Analyze uploaded images for visual patterns
 * - Extract color palettes and photography style
 * - Identify forbidden elements
 * - Synthesize findings into a Brand Constitution
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandConstitution, CanvasElement } from "@/lib/types";
import {
    type AgentResult,
    BRAND_ANALYST_SYSTEM_PROMPT,
    generateTaskId,
} from "./types";

// ============ BRAND ANALYST AGENT ============

export class BrandAnalystAgent {
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Analyze canvas elements to extract brand constitution
     * Uses multimodal analysis with base64 images
     */
    async extractConstitution(elements: CanvasElement[]): Promise<AgentResult> {
        const startTime = Date.now();
        const taskId = generateTaskId();

        try {
            // Filter image elements with valid data
            const imageElements = elements.filter(
                (el) => el.type === "image" && el.url?.startsWith("data:")
            );

            if (imageElements.length === 0) {
                return {
                    taskId,
                    role: "brand_analyst",
                    success: false,
                    data: null,
                    error: "No valid image elements found for analysis",
                    duration: Date.now() - startTime,
                };
            }

            const model = this.client.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: BRAND_ANALYST_SYSTEM_PROMPT,
            });

            // Build multimodal content with images
            const imageParts = imageElements.slice(0, 5).map((el) => {
                const base64Data = el.url!.split(",")[1];
                const mimeType = el.url!.split(";")[0].split(":")[1] || "image/png";
                return {
                    inlineData: {
                        mimeType,
                        data: base64Data,
                    },
                };
            });

            // Note elements for context
            const noteElements = elements.filter((el) => el.type === "note");
            const noteContext = noteElements.length > 0
                ? `\nNotes on canvas: ${noteElements.map((n) => n.text).join(", ")}`
                : "";

            // Color elements for context
            const colorElements = elements.filter((el) => el.type === "color");
            const colorContext = colorElements.length > 0
                ? `\nColor swatches: ${colorElements.map((c) => c.color).join(", ")}`
                : "";

            const prompt = `
<task>
Analyze these ${imageElements.length} brand images and extract a comprehensive Brand Constitution.
${noteContext}${colorContext}
</task>

<output_requirements>
Return a JSON object with this exact structure:
{
  "visual_identity": {
    "color_palette_hex": ["#XXXXXX", "#YYYYYY", "#ZZZZZZ"],
    "photography_style": "description of the photography/visual style",
    "forbidden_elements": ["element1", "element2"]
  },
  "voice": {
    "tone": "description of brand tone",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  },
  "risk_thresholds": {
    "nudity": "STRICT_ZERO_TOLERANCE" or "ALLOW_ARTISTIC",
    "political": "STRICT_ZERO_TOLERANCE" or "ALLOW_SATIRE"
  }
}
</output_requirements>

Return ONLY the JSON object, no markdown or explanation.
`;

            // Note: Do NOT use responseSchema with multimodal content (known limitation)
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [...imageParts, { text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 1.0,
                },
            });

            const text = result.response.text();
            const constitution = this.parseConstitution(text);

            return {
                taskId,
                role: "brand_analyst",
                success: true,
                data: { constitution },
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                taskId,
                role: "brand_analyst",
                success: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Parse and validate constitution from AI response
     * Handles various response formats due to Gemini limitations
     */
    private parseConstitution(text: string): BrandConstitution {
        try {
            // Clean potential markdown wrapping
            let cleanText = text.trim();
            if (cleanText.startsWith("```json")) {
                cleanText = cleanText.slice(7);
            }
            if (cleanText.startsWith("```")) {
                cleanText = cleanText.slice(3);
            }
            if (cleanText.endsWith("```")) {
                cleanText = cleanText.slice(0, -3);
            }

            const parsed = JSON.parse(cleanText.trim());

            // Validate and normalize structure
            return this.normalizeConstitution(parsed);
        } catch {
            // Return default constitution if parsing fails
            return this.getDefaultConstitution();
        }
    }

    /**
     * Normalize various response formats to consistent structure
     */
    private normalizeConstitution(data: Record<string, unknown>): BrandConstitution {
        const vi = data.visual_identity as Record<string, unknown> | undefined;
        const voice = data.voice as Record<string, unknown> | undefined;
        const risk = data.risk_thresholds as Record<string, unknown> | undefined;

        return {
            visual_identity: {
                color_palette_hex: Array.isArray(vi?.color_palette_hex)
                    ? vi.color_palette_hex
                    : ["#1e293b", "#818cf8", "#34d399"],
                photography_style: String(vi?.photography_style || "modern, professional"),
                forbidden_elements: Array.isArray(vi?.forbidden_elements)
                    ? vi.forbidden_elements
                    : [],
            },
            voice: {
                tone: String(voice?.tone || "professional"),
                keywords: Array.isArray(voice?.keywords) ? voice.keywords : [],
            },
            risk_thresholds: {
                nudity: this.parseNudityRisk(risk?.nudity),
                political: this.parsePoliticalRisk(risk?.political),
            },
        };
    }

    /**
     * Parse nudity risk level from AI response
     */
    private parseNudityRisk(
        value: unknown
    ): "STRICT_ZERO_TOLERANCE" | "ALLOW_ARTISTIC" {
        const str = String(value).toUpperCase();
        if (str.includes("ARTISTIC")) return "ALLOW_ARTISTIC";
        return "STRICT_ZERO_TOLERANCE";
    }

    /**
     * Parse political risk level from AI response
     */
    private parsePoliticalRisk(
        value: unknown
    ): "STRICT_ZERO_TOLERANCE" | "ALLOW_SATIRE" {
        const str = String(value).toUpperCase();
        if (str.includes("SATIRE")) return "ALLOW_SATIRE";
        return "STRICT_ZERO_TOLERANCE";
    }

    /**
     * Default constitution when extraction fails
     */
    private getDefaultConstitution(): BrandConstitution {
        return {
            visual_identity: {
                color_palette_hex: ["#1e293b", "#818cf8", "#34d399"],
                photography_style: "modern, professional with clean compositions",
                forbidden_elements: [],
            },
            voice: {
                tone: "professional yet approachable",
                keywords: [],
            },
            risk_thresholds: {
                nudity: "STRICT_ZERO_TOLERANCE",
                political: "STRICT_ZERO_TOLERANCE",
            },
        };
    }
}

// ============ FACTORY FUNCTION ============

export function createBrandAnalystAgent(): BrandAnalystAgent {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new BrandAnalystAgent(apiKey);
}
