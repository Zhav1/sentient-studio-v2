/**
 * Trend Scout Agent
 * 
 * Keeps brand content culturally relevant by researching current trends.
 * Uses gemini-3-flash-preview with Google Search grounding.
 * 
 * Responsibilities:
 * - Use Google Search grounding to find current trends
 * - Analyze platform-specific trends (YouTube, TikTok, Instagram)
 * - Identify competitor visual patterns
 * - Note seasonal and cultural relevance
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    type AgentResult,
    TREND_SCOUT_SYSTEM_PROMPT,
    generateTaskId,
} from "./types";

// ============ TYPES ============

export interface PlatformTrend {
    platform: string;
    trending_styles: string[];
    trending_colors: string[];
    trending_formats: string[];
}

export interface TrendResearch {
    platform_trends: PlatformTrend[];
    competitor_insights: Array<{
        observation: string;
        opportunity: string;
    }>;
    seasonal_relevance: string[];
    recommendation: string;
}

// ============ TREND SCOUT AGENT ============

export class TrendScoutAgent {
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Research current trends for a specific topic or niche
     */
    async researchTrends(
        query: string,
        options?: {
            platforms?: string[];
            niche?: string;
        }
    ): Promise<AgentResult> {
        const startTime = Date.now();
        const taskId = generateTaskId();

        try {
            const model = this.client.getGenerativeModel({
                model: "gemini-3-flash-preview",
                systemInstruction: TREND_SCOUT_SYSTEM_PROMPT,
                // @ts-expect-error - Gemini 3 Google Search grounding
                tools: [{ googleSearch: {} }],
            });

            const platforms = options?.platforms || ["YouTube", "TikTok", "Instagram"];
            const niche = options?.niche || "content creation";

            const prompt = `
<task>
Research current visual and content trends for: "${query}"
</task>

<context>
Platforms to analyze: ${platforms.join(", ")}
Niche/Industry: ${niche}
</context>

<instructions>
1. Use Google Search to find current trending styles and formats
2. Identify platform-specific trends
3. Note any seasonal or cultural relevance
4. Provide actionable recommendations for brand content
</instructions>

<output_format>
Return a JSON object:
{
  "platform_trends": [
    {
      "platform": "YouTube",
      "trending_styles": ["style1", "style2"],
      "trending_colors": ["#XXXXXX"],
      "trending_formats": ["format1"]
    }
  ],
  "competitor_insights": [
    {
      "observation": "what competitors are doing",
      "opportunity": "how to differentiate"
    }
  ],
  "seasonal_relevance": ["relevant seasonal themes"],
  "recommendation": "summary recommendation for the brand"
}
</output_format>

Return ONLY the JSON object.
`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const trends = this.parseTrendResearch(text);

            return {
                taskId,
                role: "trend_scout",
                success: true,
                data: trends,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                taskId,
                role: "trend_scout",
                success: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Get quick trend summary for a specific platform
     */
    async getPlatformTrends(platform: string): Promise<PlatformTrend | null> {
        const result = await this.researchTrends(`${platform} content trends 2024`, {
            platforms: [platform],
        });

        if (result.success && result.data) {
            const data = result.data as TrendResearch;
            return data.platform_trends.find((t) => t.platform === platform) || null;
        }
        return null;
    }

    /**
     * Parse trend research from AI response
     */
    private parseTrendResearch(text: string): TrendResearch {
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
                platform_trends: Array.isArray(parsed.platform_trends)
                    ? parsed.platform_trends
                    : [],
                competitor_insights: Array.isArray(parsed.competitor_insights)
                    ? parsed.competitor_insights
                    : [],
                seasonal_relevance: Array.isArray(parsed.seasonal_relevance)
                    ? parsed.seasonal_relevance
                    : [],
                recommendation: String(parsed.recommendation || "No specific recommendation"),
            };
        } catch {
            // Return empty result if parsing fails
            return {
                platform_trends: [],
                competitor_insights: [],
                seasonal_relevance: [],
                recommendation: "Unable to parse trend research results",
            };
        }
    }
}

// ============ FACTORY FUNCTION ============

export function createTrendScoutAgent(): TrendScoutAgent {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new TrendScoutAgent(apiKey);
}
