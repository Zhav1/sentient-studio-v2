/**
 * Trend Scout Agent
 * 
 * Specialized agent that uses Google Search grounding to find current trends.
 * Uses gemini-3-flash-preview with google_search tool.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { TREND_SCOUT_SYSTEM_PROMPT, getAgentThinkingLevel } from "./types";

export class TrendScoutAgent {
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Research trends via Google Search grounding
     */
    async researchTrends(query: string): Promise<any> {
        const model = this.client.getGenerativeModel({
            model: "gemini-3-flash-preview",
            tools: [{ googleSearch: {} }] as any,
        });

        const prompt = `
<task>
Research current trends and platform-specific insights related to: "${query}"
Use Google Search to find real-time data from YouTube, TikTok, and Instagram.
</task>

${TREND_SCOUT_SYSTEM_PROMPT}
`;

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.7,
                },
            });

            const text = result.response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error("Trend research error:", error);
            // Return fallback trends if grounding fails
            return {
                platform_trends: [],
                competitor_insights: [],
                seasonal_relevance: "Unable to fetch real-time data.",
                recommendation: "Focus on clean, high-contrast visual styles."
            };
        }
    }
}
