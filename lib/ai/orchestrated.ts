/**
 * Orchestrated Multi-Agent Runner
 * 
 * Coordinates specialized agents through the OrchestratorAgent.
 * Replaces the monolithic runAgentLoop with modular agent delegation.
 */

import type { BrandConstitution, CanvasElement } from "@/lib/types";
import {
    type AgentTask,
    type AgentResult,
    type AgentRole,
} from "./agents/types";
import { OrchestratorAgent } from "./agents/orchestrator";
import { getTemplate } from "./agents/export-optimizer";

// ============ TYPES ============

export interface OrchestrationUpdate {
    phase: "parsing" | "planning" | "executing" | "complete" | "error";
    taskQueue?: AgentTask[];
    currentTask?: AgentTask;
    agentRole?: AgentRole;
    progress: number; // 0-100
    message: string;
    thinking?: string;
    result?: AgentResult;
}

export interface OrchestrationResult {
    success: boolean;
    image?: string;
    message: string;
    constitution?: BrandConstitution;
    taskResults: AgentResult[];
    duration: number;
}

// ============ ORCHESTRATED RUNNER ============

export async function runOrchestratedAgent(
    userPrompt: string,
    canvasElements: CanvasElement[],
    onUpdate: (update: OrchestrationUpdate) => Promise<void>,
    savedConstitution?: BrandConstitution | null
): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const taskResults: AgentResult[] = [];
    let currentConstitution = savedConstitution || null;
    let generatedImage: string | undefined;

    try {
        // Phase 1: Parse intent and create task queue
        await onUpdate({
            phase: "parsing",
            progress: 5,
            message: "Understanding your request...",
            thinking: "Analyzing user intent and determining required agents",
        });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is not set");
        }

        const orchestrator = new OrchestratorAgent(apiKey);

        // Initialize orchestrator with context
        orchestrator.initialize(canvasElements, currentConstitution);

        // Parse intent - returns AgentTask[] directly
        const taskQueue = await orchestrator.parseIntent(userPrompt);

        if (!taskQueue || taskQueue.length === 0) {
            throw new Error("Failed to parse intent - no tasks generated");
        }

        // Phase 2: Planning complete
        await onUpdate({
            phase: "planning",
            taskQueue,
            progress: 15,
            message: `Planned ${taskQueue.length} task(s)`,
            thinking: `Task queue: ${taskQueue.map(t => t.role).join(" → ")}`,
        });

        // Phase 3: Execute tasks
        for (let i = 0; i < taskQueue.length; i++) {
            const task = taskQueue[i];
            const progress = 15 + Math.floor((i / taskQueue.length) * 75);

            await onUpdate({
                phase: "executing",
                taskQueue,
                currentTask: task,
                agentRole: task.role,
                progress,
                message: getTaskMessage(task.role),
                thinking: `Delegating ${task.action} to ${task.role}`,
            });

            // Delegate to orchestrator which handles agent instantiation and execution
            const result = await orchestrator.delegateToAgent(task);

            taskResults.push(result);

            // Update local state for final result
            if (result.success) {
                if (result.role === "brand_analyst") {
                    currentConstitution = result.data as unknown as BrandConstitution;
                }
                if (result.role === "creative_director" && (result.data as any).image) {
                    generatedImage = (result.data as any).image;
                }
            }

            await onUpdate({
                phase: "executing",
                currentTask: task,
                agentRole: task.role,
                progress: progress + 5,
                message: result.success ? `Completed: ${task.role}` : `Failed: ${task.role}`,
                result,
            });

            // If critical task failed, stop execution
            if (!result.success && isCriticalRole(task.role)) {
                throw new Error(`Critical task failed in ${task.role}: ${result.error}`);
            }
        }

        // Phase 4: Complete
        await onUpdate({
            phase: "complete",
            progress: 100,
            message: "All tasks completed successfully",
        });

        return {
            success: true,
            image: generatedImage,
            message: "Generation complete",
            constitution: currentConstitution || undefined,
            taskResults,
            duration: Date.now() - startTime,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await onUpdate({
            phase: "error",
            progress: 0,
            message: errorMessage,
        });

        return {
            success: false,
            message: errorMessage,
            taskResults,
            duration: Date.now() - startTime,
        };
    }
}

// Helper to determine task message
function getTaskMessage(role: AgentRole): string {
    switch (role) {
        case "brand_analyst":
            return "Analyzing brand DNA...";
        case "creative_director":
            return "Generating brand asset...";
        case "compliance_auditor":
            return "Auditing brand compliance...";
        case "trend_scout":
            return "Researching current trends...";
        case "context_memory":
            return "Updating brand memory...";
        case "export_optimizer":
            return "Preparing export settings...";
        case "orchestrator":
            return "Coordinating agents...";
        default:
            return `Executing ${role}...`;
    }
}

function isCriticalRole(role: AgentRole): boolean {
    return role === "brand_analyst" || role === "creative_director";
}
