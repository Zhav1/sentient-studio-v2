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
import { createBrandAnalystAgent } from "./agents/brand-analyst";
import { createCreativeDirectorAgent } from "./agents/creative-director";
import { createComplianceAuditorAgent } from "./agents/compliance-auditor";
import { createTrendScoutAgent } from "./agents/trend-scout";
import { getContextMemory } from "./agents/context-memory";
import { getTemplate, getPlatformPromptAdditions } from "./agents/export-optimizer";

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
        const completedResults: Map<string, AgentResult> = new Map();

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
                thinking: `Executing ${task.action}`,
            });

            // Execute the task with appropriate agent
            const result = await executeTask(
                task,
                canvasElements,
                currentConstitution,
                completedResults,
                userPrompt
            );

            taskResults.push(result);
            completedResults.set(task.id, result);

            // Update state based on result
            if (result.success && result.data) {
                const data = result.data as Record<string, unknown>;

                // Extract constitution if brand_analyst
                if (task.role === "brand_analyst" && data.constitution) {
                    currentConstitution = data.constitution as BrandConstitution;
                }

                // Extract image if creative_director
                if (task.role === "creative_director" && data.image) {
                    generatedImage = data.image as string;
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
                throw new Error(`Critical task failed: ${result.error}`);
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

// ============ TASK EXECUTION ============

async function executeTask(
    task: AgentTask,
    canvasElements: CanvasElement[],
    constitution: BrandConstitution | null,
    completedResults: Map<string, AgentResult>,
    userPrompt: string
): Promise<AgentResult> {
    const startTime = Date.now();

    try {
        switch (task.role) {
            case "brand_analyst": {
                const analyst = createBrandAnalystAgent();
                return await analyst.extractConstitution(canvasElements);
            }

            case "creative_director": {
                const director = createCreativeDirectorAgent();

                // Check for platform template in task params
                let aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | undefined;
                if (task.params?.platform) {
                    const template = getTemplate(String(task.params.platform));
                    if (template) {
                        const ar = template.aspectRatio;
                        if (ar === "1:1" || ar === "16:9" || ar === "9:16" || ar === "4:3") {
                            aspectRatio = ar;
                        }
                    }
                }

                // Use prompt from params or fallback to user prompt
                const prompt = task.params?.prompt ? String(task.params.prompt) : userPrompt;

                return await director.generateAsset(prompt, constitution, { aspectRatio });
            }

            case "compliance_auditor": {
                const auditor = createComplianceAuditorAgent();

                // Get image from previous creative_director result
                let imageToAudit: string | null = null;
                for (const [, result] of completedResults) {
                    if (result.role === "creative_director" && result.data) {
                        const data = result.data as Record<string, unknown>;
                        if (data.image) {
                            imageToAudit = data.image as string;
                            break;
                        }
                    }
                }

                if (!imageToAudit) {
                    return {
                        taskId: task.id,
                        role: "compliance_auditor",
                        success: false,
                        data: null,
                        error: "No image available to audit",
                        duration: Date.now() - startTime,
                    };
                }

                if (!constitution) {
                    return {
                        taskId: task.id,
                        role: "compliance_auditor",
                        success: false,
                        data: null,
                        error: "No brand constitution available for audit",
                        duration: Date.now() - startTime,
                    };
                }

                return await auditor.auditAsset(imageToAudit, constitution);
            }

            case "trend_scout": {
                const scout = createTrendScoutAgent();
                const platforms = task.params?.platforms as string[] | undefined;
                return await scout.researchTrends(userPrompt, { platforms });
            }

            case "context_memory": {
                const memory = getContextMemory();
                const sessionId = task.params?.sessionId as string || "default";

                memory.addConversationTurn(sessionId, {
                    role: "user",
                    content: userPrompt,
                });

                return {
                    taskId: task.id,
                    role: "context_memory",
                    success: true,
                    data: { stored: true },
                    duration: Date.now() - startTime,
                };
            }

            case "export_optimizer": {
                const templateId = task.params?.template as string;
                const template = templateId ? getTemplate(templateId) : null;

                return {
                    taskId: task.id,
                    role: "export_optimizer",
                    success: true,
                    data: {
                        template,
                        promptAdditions: template ? getPlatformPromptAdditions(template) : null,
                    },
                    duration: Date.now() - startTime,
                };
            }

            case "orchestrator": {
                return {
                    taskId: task.id,
                    role: "orchestrator",
                    success: true,
                    data: { message: "Orchestration handled externally" },
                    duration: Date.now() - startTime,
                };
            }

            default: {
                return {
                    taskId: task.id,
                    role: task.role,
                    success: false,
                    data: null,
                    error: `Unknown agent role: ${task.role}`,
                    duration: Date.now() - startTime,
                };
            }
        }
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

// ============ HELPERS ============

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
