/**
 * Orchestrator Agent
 * 
 * Central coordinator that interprets user requests and routes to specialized agents.
 * Uses gemini-3-flash-preview with thinkingConfig: high for complex reasoning.
 * 
 * Responsibilities:
 * - Natural language intent parsing
 * - Multi-agent task decomposition
 * - Context aggregation across agents
 * - Quality gate before final output
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandConstitution, CanvasElement } from "@/lib/types";
import {
    type AgentRole,
    type AgentTask,
    type AgentResult,
    type OrchestrationState,
    type AgentEvent,
    ORCHESTRATOR_SYSTEM_PROMPT,
    getAgentThinkingLevel,
    generateTaskId,
    createOrchestrationState,
} from "./types";

// ============ ORCHESTRATOR AGENT ============

export class OrchestratorAgent {
    private client: GoogleGenerativeAI;
    private state: OrchestrationState;
    private eventCallback?: (event: AgentEvent) => void;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.state = createOrchestrationState();
    }

    /**
     * Set callback for streaming agent events
     */
    onEvent(callback: (event: AgentEvent) => void): void {
        this.eventCallback = callback;
    }

    /**
     * Emit an agent event
     */
    private emit(
        type: AgentEvent["type"],
        message: string,
        data?: unknown
    ): void {
        if (this.eventCallback) {
            this.eventCallback({
                type,
                agent: "orchestrator",
                message,
                data,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Initialize state with canvas elements and existing constitution
     */
    initialize(
        canvasElements?: CanvasElement[],
        constitution?: BrandConstitution | null
    ): void {
        this.state.canvasElements = canvasElements;
        this.state.constitution = constitution || null;
    }

    /**
     * Parse user intent and decompose into agent tasks
     */
    async parseIntent(userMessage: string): Promise<AgentTask[]> {
        this.emit("thinking", "Analyzing user request and planning agent tasks");

        const model = this.client.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: ORCHESTRATOR_SYSTEM_PROMPT,
        });

        const prompt = `
<user_request>
${userMessage}
</user_request>

<current_state>
- Has Brand Constitution: ${this.state.constitution ? "Yes" : "No"}
- Has Canvas Elements: ${this.state.canvasElements?.length ? `Yes (${this.state.canvasElements.length} elements)` : "No"}
- Current Image: ${this.state.currentImage ? "Generated" : "None"}
</current_state>

<task>
Decompose this request into agent tasks. Return a JSON array of tasks.
Each task should have: role, action, params, priority, dependsOn (optional array of task indices).

Example format:
[
  { "role": "brand_analyst", "action": "extract_constitution", "params": {}, "priority": "high" },
  { "role": "creative_director", "action": "generate_asset", "params": { "prompt": "..." }, "priority": "normal", "dependsOn": [0] }
]
</task>
`;

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    // @ts-expect-error - Gemini 3 thinking config
                    thinkingConfig: {
                        includeThoughts: true,
                        thinkingLevel: getAgentThinkingLevel("orchestrator"),
                    },
                    temperature: 1.0,
                },
            });

            const text = result.response.text();

            // Parse JSON - dependsOn from AI might be numeric indices
            interface ParsedTask {
                role: AgentRole;
                action: string;
                params: Record<string, unknown>;
                priority: "high" | "normal" | "low";
                dependsOn?: number[];
            }
            const tasks: ParsedTask[] = JSON.parse(text);

            // Add IDs and resolve dependencies
            const tasksWithIds: AgentTask[] = tasks.map((task) => ({
                ...task,
                id: generateTaskId(),
                dependsOn: task.dependsOn?.map((depIndex) => {
                    // Will be resolved after all IDs are assigned
                    return `pending_${depIndex}`;
                }),
            }));

            // Resolve dependency IDs
            tasksWithIds.forEach((task) => {
                if (task.dependsOn) {
                    task.dependsOn = task.dependsOn.map((dep) => {
                        if (dep.startsWith("pending_")) {
                            const index = parseInt(dep.replace("pending_", ""));
                            return tasksWithIds[index]?.id || dep;
                        }
                        return dep;
                    });
                }
            });

            this.emit("action", `Planned ${tasksWithIds.length} agent tasks`, tasksWithIds);
            return tasksWithIds;
        } catch (error) {
            console.error("Intent parsing error:", error);

            // Fallback: simple task generation based on keywords
            return this.fallbackIntentParsing(userMessage);
        }
    }

    /**
     * Fallback intent parsing when AI parsing fails
     */
    private fallbackIntentParsing(message: string): AgentTask[] {
        const tasks: AgentTask[] = [];
        const lowerMessage = message.toLowerCase();

        // Check if we need brand analysis first
        if (!this.state.constitution && this.state.canvasElements?.length) {
            tasks.push({
                id: generateTaskId(),
                role: "brand_analyst",
                action: "extract_constitution",
                params: {},
                priority: "high",
            });
        }

        // Image generation keywords
        if (
            lowerMessage.includes("thumbnail") ||
            lowerMessage.includes("image") ||
            lowerMessage.includes("create") ||
            lowerMessage.includes("generate") ||
            lowerMessage.includes("make")
        ) {
            tasks.push({
                id: generateTaskId(),
                role: "creative_director",
                action: "generate_asset",
                params: { prompt: message },
                priority: "normal",
                dependsOn: tasks.length > 0 ? [tasks[0].id] : undefined,
            });

            // Always audit after generation
            const genTaskId = tasks[tasks.length - 1].id;
            tasks.push({
                id: generateTaskId(),
                role: "compliance_auditor",
                action: "audit_asset",
                params: {},
                priority: "high",
                dependsOn: [genTaskId],
            });
        }

        // Trend research keywords
        if (
            lowerMessage.includes("trend") ||
            lowerMessage.includes("popular") ||
            lowerMessage.includes("current")
        ) {
            tasks.push({
                id: generateTaskId(),
                role: "trend_scout",
                action: "research_trends",
                params: { query: message },
                priority: "low",
            });
        }

        return tasks;
    }

    /**
     * Execute a task queue with dependency resolution
     */
    async executeTaskQueue(tasks: AgentTask[]): Promise<AgentResult[]> {
        this.state.taskQueue = [...tasks];
        const results: AgentResult[] = [];
        const completedIds = new Set<string>();

        while (this.state.taskQueue.length > 0) {
            // Find tasks with satisfied dependencies
            const readyTasks = this.state.taskQueue.filter(
                (task) =>
                    !task.dependsOn ||
                    task.dependsOn.every((depId) => completedIds.has(depId))
            );

            if (readyTasks.length === 0) {
                // Deadlock - break with error
                this.emit("error", "Task dependency deadlock detected");
                break;
            }

            // Execute ready tasks (could parallelize independent tasks)
            for (const task of readyTasks) {
                this.state.currentAgent = task.role;
                this.emit("action", `Delegating to ${task.role}: ${task.action}`);

                const startTime = Date.now();
                const result = await this.delegateToAgent(task);
                result.duration = Date.now() - startTime;

                results.push(result);
                completedIds.add(task.id);
                this.state.completedTasks.push(result);

                // Remove from queue
                this.state.taskQueue = this.state.taskQueue.filter(
                    (t) => t.id !== task.id
                );

                // Update state based on result
                this.updateStateFromResult(result);
            }
        }

        this.state.currentAgent = null;
        return results;
    }

    /**
     * Delegate a task to a specialized agent
     * This is a dispatcher - actual agent logic is in respective files
     */
    async delegateToAgent(task: AgentTask): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            // Dynamic import based on agent role
            let result: unknown;

            switch (task.role) {
                case "brand_analyst":
                    // Will use the existing analyzeCanvasForConstitution function
                    result = { delegated: true, action: task.action };
                    break;
                case "creative_director":
                    // Will use the existing generateImageWithNanoBanana function
                    result = { delegated: true, action: task.action };
                    break;
                case "compliance_auditor":
                    // Will use the existing auditImageCompliance function
                    result = { delegated: true, action: task.action };
                    break;
                case "trend_scout":
                    // Will use the existing searchWebForContext function
                    result = { delegated: true, action: task.action };
                    break;
                case "context_memory":
                    // State management
                    result = { delegated: true, action: task.action };
                    break;
                case "export_optimizer":
                    // Platform formatting
                    result = { delegated: true, action: task.action };
                    break;
                default:
                    throw new Error(`Unknown agent role: ${task.role}`);
            }

            return {
                taskId: task.id,
                role: task.role,
                success: true,
                data: result,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                taskId: task.id,
                role: task.role,
                success: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Update orchestration state based on agent result
     */
    private updateStateFromResult(result: AgentResult): void {
        if (!result.success) return;

        const data = result.data as Record<string, unknown>;

        switch (result.role) {
            case "brand_analyst":
                if (data.constitution) {
                    this.state.constitution = data.constitution as BrandConstitution;
                }
                break;
            case "creative_director":
                if (data.image) {
                    this.state.currentImage = data.image as string;
                }
                break;
            // Other agents update state as needed
        }
    }

    /**
     * Get current orchestration state
     */
    getState(): OrchestrationState {
        return { ...this.state };
    }

    /**
     * Synthesize results into final output for user
     */
    synthesizeResults(results: AgentResult[]): {
        success: boolean;
        message: string;
        constitution?: BrandConstitution;
        image?: string;
        trends?: unknown;
    } {
        const hasErrors = results.some((r) => !r.success);
        const constitution = this.state.constitution;
        const image = this.state.currentImage;

        if (hasErrors) {
            const errors = results
                .filter((r) => !r.success)
                .map((r) => `${r.role}: ${r.error}`)
                .join(", ");
            return {
                success: false,
                message: `Some agent tasks failed: ${errors}`,
                constitution: constitution || undefined,
            };
        }

        return {
            success: true,
            message: "All agent tasks completed successfully",
            constitution: constitution || undefined,
            image: image || undefined,
        };
    }
}

// ============ FACTORY FUNCTION ============

/**
 * Create an orchestrator agent instance
 */
export function createOrchestratorAgent(): OrchestratorAgent {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new OrchestratorAgent(apiKey);
}
