/**
 * Compliance Auditor Agent
 * 
 * Quality gate for brand consistency. Scores generated assets against
 * the Brand Constitution and provides actionable feedback.
 * Uses gemini-3-flash-preview with thinkingConfig: medium for careful evaluation.
 * 
 * Responsibilities:
 * - Compare generated assets against Brand Constitution
 * - Score adherence across: color, typography, style, composition
 * - Identify specific violations with fix suggestions
 * - Gate export based on compliance score
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandConstitution } from "@/lib/types";
import {
    type AgentResult,
    COMPLIANCE_AUDITOR_SYSTEM_PROMPT,
    generateTaskId,
} from "./types";

// ============ TYPES ============

export interface ComplianceViolation {
    category: "color" | "typography" | "composition" | "style" | "forbidden";
    severity: "critical" | "warning" | "minor";
    description: string;
    suggestion: string;
}

export interface AuditResult {
    compliance_score: number;
    pass: boolean;
    violations: ComplianceViolation[];
    strengths: string[];
}

// ============ COMPLIANCE AUDITOR AGENT ============

export class ComplianceAuditorAgent {
    private client: GoogleGenerativeAI;
    private passThreshold: number = 70;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Audit an image against the Brand Constitution
     */
    async auditAsset(
        imageBase64: string,
        constitution: BrandConstitution
    ): Promise<AgentResult> {
        const startTime = Date.now();
        const taskId = generateTaskId();

        try {
            const model = this.client.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: COMPLIANCE_AUDITOR_SYSTEM_PROMPT,
            });

            const prompt = `
<task>
Audit this image against the Brand Constitution and provide a compliance score.
</task>

<brand_constitution>
Colors: ${constitution.visual_identity.color_palette_hex.join(", ")}
Photography Style: ${constitution.visual_identity.photography_style}
Forbidden Elements: ${constitution.visual_identity.forbidden_elements.join(", ") || "None"}
Voice Tone: ${constitution.voice.tone}
Brand Keywords: ${constitution.voice.keywords.join(", ") || "None"}
</brand_constitution>


<output_format>
Return a JSON object with:
{
  "compliance_score": number (0-100),
  "pass": boolean (true if score >= ${this.passThreshold}),
  "violations": [
    {
      "category": "color" | "typography" | "composition" | "style" | "forbidden",
      "severity": "critical" | "warning" | "minor",
      "description": "specific issue",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["what the image does well"]
}
</output_format>

Return ONLY the JSON object.
`;

            // Note: Do NOT use responseSchema with multimodal (known limitation)
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                inlineData: {
                                    mimeType: "image/png",
                                    data: imageBase64,
                                },
                            },
                            { text: prompt },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                },
            });

            const text = result.response.text();
            const auditResult = this.parseAuditResult(text);

            return {
                taskId,
                role: "compliance_auditor",
                success: true,
                data: auditResult,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                taskId,
                role: "compliance_auditor",
                success: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Parse and validate audit result from AI response
     */
    private parseAuditResult(text: string): AuditResult {
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

            return {
                compliance_score: Math.max(0, Math.min(100, Number(parsed.compliance_score) || 50)),
                pass: parsed.compliance_score >= this.passThreshold,
                violations: Array.isArray(parsed.violations) ? parsed.violations : [],
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            };
        } catch {
            // Return conservative default if parsing fails
            return {
                compliance_score: 50,
                pass: false,
                violations: [
                    {
                        category: "style",
                        severity: "warning",
                        description: "Unable to fully analyze image compliance",
                        suggestion: "Manual review recommended",
                    },
                ],
                strengths: [],
            };
        }
    }

    /**
     * Get refinement suggestions for failed audits
     */
    getRefinementSuggestions(auditResult: AuditResult): string[] {
        return auditResult.violations
            .filter((v) => v.severity !== "minor")
            .map((v) => v.suggestion);
    }

    /**
     * Set custom pass threshold
     */
    setPassThreshold(threshold: number): void {
        this.passThreshold = Math.max(0, Math.min(100, threshold));
    }
}

// ============ FACTORY FUNCTION ============

export function createComplianceAuditorAgent(): ComplianceAuditorAgent {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new ComplianceAuditorAgent(apiKey);
}
