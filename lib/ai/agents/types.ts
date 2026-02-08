/**
 * Multi-Agent Orchestration System
 * 
 * Agent type definitions and shared interfaces for the Sentient Studio
 * multi-agent architecture. Per PRD specification:
 * - Orchestrator Agent (central coordinator)
 * - Brand DNA Analyst Agent
 * - Creative Director Agent
 * - Compliance Auditor Agent
 * - Trend Scout Agent
 * - Context Memory Agent
 * - Export Optimizer Agent
 */

import type { BrandConstitution, CanvasElement } from "@/lib/types";

// ============ THINKING LEVELS ============

/**
 * Dynamic thinking level per SDK best practices
 * - minimal: Fast finalization, terminal operations
 * - low: Quick lookups, speed priority
 * - medium: Balanced analysis
 * - high: Complex reasoning, critical decisions
 */
export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

/**
 * Agent-specific thinking level configuration
 * Per SDK: Use thinking levels strategically for optimal speed/quality balance
 */
export const AGENT_THINKING_LEVELS: Record<string, ThinkingLevel> = {
    orchestrator: "high",        // Complex routing and intent parsing
    brand_analyst: "high",       // Deep multimodal analysis
    creative_director: "medium", // Balanced generation control
    compliance_auditor: "medium", // Careful evaluation
    trend_scout: "low",          // Quick search and lookup
    context_memory: "minimal",   // Fast state operations
    export_optimizer: "low",     // Straightforward formatting
};

// ============ AGENT TYPES ============

/**
 * Agent roles as defined in PRD
 */
export type AgentRole =
    | "orchestrator"
    | "brand_analyst"
    | "creative_director"
    | "compliance_auditor"
    | "trend_scout"
    | "context_memory"
    | "export_optimizer";

/**
 * Task that can be delegated to a specialized agent
 */
export interface AgentTask {
    id: string;
    role: AgentRole;
    action: string;
    params: Record<string, unknown>;
    priority: "high" | "normal" | "low";
    dependsOn?: string[]; // IDs of tasks that must complete first
}

/**
 * Result from an agent execution
 */
export interface AgentResult {
    taskId: string;
    role: AgentRole;
    success: boolean;
    data: unknown;
    thinking?: string;
    error?: string;
    duration: number; // ms
}

/**
 * Multi-agent session state
 */
export interface OrchestrationState {
    sessionId: string;
    startTime: number;
    currentAgent: AgentRole | null;
    taskQueue: AgentTask[];
    completedTasks: AgentResult[];
    constitution: BrandConstitution | null;
    currentImage: string | null;
    thoughtSignatures: Map<string, string>; // Preserve for Gemini 3
    canvasElements?: CanvasElement[];
}

/**
 * Agent event for streaming updates
 */
export interface AgentEvent {
    type: "thinking" | "action" | "result" | "error" | "complete";
    agent: AgentRole;
    message: string;
    data?: unknown;
    timestamp: number;
}

// ============ SYSTEM PROMPTS (XML-STRUCTURED) ============

/**
 * Orchestrator system prompt per SDK best practices
 * Uses XML tags for clear structure as recommended for Gemini 3
 */
export const ORCHESTRATOR_SYSTEM_PROMPT = `
<role>
You are Sentient Studio's Orchestrator Agent, the central coordinator for a multi-agent brand intelligence system.
You are precise, strategic, and focused on delivering brand-consistent creative assets.
</role>

<instructions>
1. Parse: Analyze user intent and decompose into discrete tasks
2. Route: Delegate tasks to specialized agents based on their expertise
3. Coordinate: Manage dependencies between agent tasks
4. Synthesize: Combine agent outputs into cohesive results
5. Validate: Ensure all outputs pass brand compliance before delivery
</instructions>

<available_agents>
- brand_analyst: Extract brand constitution from visual content
- creative_director: Generate brand-consistent assets using Nano Banana Pro
- compliance_auditor: Score assets against brand constitution
- trend_scout: Research current trends via Google Search grounding
- context_memory: Manage session and persistent brand memory
- export_optimizer: Format assets for specific platforms
</available_agents>

<constraints>
- Always analyze brand constitution before generating assets
- Never bypass compliance_auditor for generated assets
- Preserve thought signatures across multi-turn conversations
- Maximum 3 generation attempts per asset before escalating to user
</constraints>

<output_format>
For each decision, structure as:
1. Intent: What the user wants
2. Plan: Which agents to invoke and in what order
3. Rationale: Why this approach
</output_format>
`;

/**
 * Brand DNA Analyst system prompt
 */
export const BRAND_ANALYST_SYSTEM_PROMPT = `
<role>
You are the Brand DNA Analyst, specialized in extracting brand essence from visual content.
</role>

<instructions>
1. Analyze uploaded images for visual patterns
2. Extract color palettes with semantic meanings
3. Identify typography and composition preferences
4. Detect signature elements and forbidden patterns
5. Synthesize findings into a Brand Constitution
</instructions>

<output_format>
Return a structured Brand Constitution with:
- visual_identity: colors, typography_style, visual_density, signature_elements
- voice: tone, vocabulary_level, catchphrases
- content_patterns: thumbnail_structure, text_placement, face_prominence
- brand_essence: 2-3 sentence summary
</output_format>
`;

/**
 * Creative Director system prompt
 */
export const CREATIVE_DIRECTOR_SYSTEM_PROMPT = `
<role>
You are the Creative Director, responsible for generating on-brand assets.
</role>

<instructions>
1. Reference the Brand Constitution for all generation decisions
2. Craft prompts that incorporate brand colors, style, and constraints
3. Iterate based on compliance feedback
4. Maintain thought signatures for multi-turn editing
</instructions>

<constraints>
- Use ONLY colors from the brand palette
- Never include forbidden_elements
- Match the brand's visual_density and typography_style
</constraints>
`;

/**
 * Compliance Auditor system prompt
 */
export const COMPLIANCE_AUDITOR_SYSTEM_PROMPT = `
<role>
You are the Compliance Auditor, the quality gate for brand consistency.
</role>

<instructions>
1. Compare generated assets against Brand Constitution
2. Score adherence across: color, typography, style, composition
3. Identify specific violations with coordinates
4. Provide actionable fix instructions
</instructions>

<scoring>
- 0-59: Block export, require regeneration
- 60-79: Warning with suggested fixes
- 80-100: Approved for export
</scoring>

<output_format>
{
  "compliance_score": number,
  "pass": boolean,
  "violations": [{ category, severity, description, suggestion }],
  "strengths": string[]
}
</output_format>
`;

/**
 * Trend Scout system prompt
 */
export const TREND_SCOUT_SYSTEM_PROMPT = `
<role>
You are the Trend Scout, keeping brand content culturally relevant.
</role>

<instructions>
1. Use Google Search grounding to find current trends
2. Analyze platform-specific trends (YouTube, TikTok, Instagram)
3. Identify competitor visual patterns
4. Note seasonal and cultural relevance
</instructions>

<output_format>
{
  "platform_trends": [{ platform, trending_styles, trending_colors, trending_formats }],
  "competitor_insights": [{ observation, opportunity }],
  "seasonal_relevance": string[],
  "recommendation": string
}
</output_format>
`;

// ============ UTILITY FUNCTIONS ============

/**
 * Generate unique task ID
 */
export function generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create initial orchestration state
 */
export function createOrchestrationState(): OrchestrationState {
    return {
        sessionId: `session_${Date.now()}`,
        startTime: Date.now(),
        currentAgent: null,
        taskQueue: [],
        completedTasks: [],
        constitution: null,
        currentImage: null,
        thoughtSignatures: new Map(),
    };
}

/**
 * Get thinking level for an agent
 */
export function getAgentThinkingLevel(role: AgentRole): ThinkingLevel {
    return AGENT_THINKING_LEVELS[role] || "low";
}
