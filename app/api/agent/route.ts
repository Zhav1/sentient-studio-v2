import { NextRequest } from "next/server";
import { runOrchestratedAgent, type OrchestrationUpdate } from "@/lib/ai/orchestrated";
import type { CanvasElement, BrandConstitution } from "@/lib/types";
import { storeImage } from "@/lib/imageStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Orchestrated Agent API Endpoint
 * Uses Server-Sent Events to stream multi-agent orchestration in real-time
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, canvasElements, savedConstitution } = body as {
            prompt: string;
            canvasElements: CanvasElement[];
            savedConstitution?: BrandConstitution | null;
        };

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create a TransformStream for SSE
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Helper to send SSE events
        const sendEvent = async (event: string, data: unknown) => {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            await writer.write(encoder.encode(message));
        };

        // Keep-alive heartbeat (every 5s for Vercel Hobby plan)
        const heartbeat = setInterval(async () => {
            try {
                await writer.write(encoder.encode(": keep-alive\n\n"));
            } catch {
                clearInterval(heartbeat);
            }
        }, 5000);

        // Run orchestrated agent in background
        (async () => {
            try {
                // Send start event
                await sendEvent("start", {
                    message: "Agent orchestration starting...",
                    timestamp: Date.now(),
                });

                // Run the orchestrated agent with update callback
                const result = await runOrchestratedAgent(
                    prompt,
                    canvasElements || [],
                    async (update: OrchestrationUpdate) => {
                        // Stream each update to the client
                        await sendEvent("action", {
                            step: Date.now(),
                            phase: update.phase,
                            tool: update.agentRole || "orchestrator",
                            progress: update.progress,
                            thinking: update.thinking || update.message,
                            input: update.currentTask?.params || {},
                            output: update.result?.data || null,
                        });
                    },
                    savedConstitution
                );

                // Debug log
                console.log(`[Orchestrated Agent] success=${result.success}, hasImage=${!!result.image}, tasks=${result.taskResults.length}`);

                // Store large image in memory and send ID instead
                let imageId: string | null = null;
                if (result.image) {
                    imageId = storeImage(result.image);
                    console.log(`[Orchestrated Agent] Stored image as ${imageId}`);
                }

                // Send final result
                await sendEvent("complete", {
                    success: result.success,
                    message: result.message,
                    hasImage: !!result.image,
                    imageId,
                    constitution: result.constitution,
                    taskCount: result.taskResults.length,
                    duration: result.duration,
                });
            } catch (error) {
                console.error("Orchestrated agent error:", error);
                await sendEvent("error", {
                    message: error instanceof Error ? error.message : "Unknown error",
                });
            } finally {
                clearInterval(heartbeat);
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("API error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
