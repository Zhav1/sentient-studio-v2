"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { getConstitution, saveConstitution, addCanvasElement } from "@/lib/firebase/firestore";
import type { AgentAction } from "@/lib/ai/tools";
import { EditableCanvas } from "@/components/editor";
import { createCanvasElement } from "@/lib/types";

interface AgentEvent {
    type: "start" | "action" | "complete" | "error";
    data: {
        step?: number;
        tool?: string;
        thinking?: string;
        message?: string;
        success?: boolean;
        hasImage?: boolean;
        image?: string;
        input?: Record<string, unknown>;
        output?: unknown;
    };
}

export default function DashboardPage() {
    const { constitution, setConstitution, elements, addElement, currentBrand } = useCanvasStore();

    const [prompt, setPrompt] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [history, setHistory] = useState<AgentAction[]>([]);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    // Load saved constitution from Firestore on mount
    useEffect(() => {
        async function loadSavedConstitution() {
            if (currentBrand?.id && !constitution) {
                try {
                    const saved = await getConstitution(currentBrand.id);
                    if (saved) {
                        setConstitution(saved);
                    }
                } catch (err) {
                    console.error("Failed to load saved constitution:", err);
                }
            }
        }
        loadSavedConstitution();
    }, [currentBrand?.id, constitution, setConstitution]);

    const runAgent = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        if (!constitution && elements.length === 0) {
            setError("No brand data. Go to Canvas and add some elements first.");
            return;
        }

        setIsRunning(true);
        setError(null);
        setEvents([]);
        setHistory([]);
        setFinalImage(null);

        abortRef.current = new AbortController();

        try {
            const response = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    canvasElements: elements,
                    savedConstitution: constitution,
                    brandId: currentBrand?.id,
                }),
                signal: abortRef.current.signal,
            });

            if (!response.ok) throw new Error("Failed to start agent");
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                let currentEvent = "";
                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        currentEvent = line.slice(7);
                    } else if (line.startsWith("data: ") && currentEvent) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const event: AgentEvent = { type: currentEvent as AgentEvent["type"], data };
                            setEvents((prev) => [...prev, event]);

                            // Track history
                            if (currentEvent === "action" && data.tool) {
                                setHistory((prev) => [...prev, {
                                    timestamp: Date.now(),
                                    tool: data.tool,
                                    input: data.input || {},
                                    output: data.output,
                                    thinking: data.thinking,
                                }]);
                            }

                            if (currentEvent === "complete") {
                                console.log("[SSE] Complete event received:", {
                                    hasImage: data.hasImage,
                                    imageId: data.imageId,
                                });

                                // Fetch the image from the server if we have an imageId
                                if (data.imageId) {
                                    console.log("[SSE] Fetching image from /api/image/" + data.imageId);
                                    try {
                                        const imgResponse = await fetch(`/api/image/${data.imageId}`);
                                        const imgData = await imgResponse.json();
                                        if (imgData.image) {
                                            console.log("[SSE] Image fetched successfully, length:", imgData.image.length);
                                            setFinalImage(imgData.image);

                                            // Create a new canvas element for the moodboard
                                            const newElement = createCanvasElement("image", {
                                                url: `data:image/png;base64,${imgData.image}`,
                                                name: `Agent Generation: ${prompt.slice(0, 20)}...`,
                                                x: Math.random() * 300,
                                                y: Math.random() * 300,
                                            });

                                            // Update local store
                                            addElement(newElement);

                                            // Persist to Firestore if brand is active
                                            if (currentBrand?.id) {
                                                addCanvasElement(currentBrand.id, newElement).catch(console.error);
                                            }
                                        } else {
                                            console.error("[SSE] Image fetch failed:", imgData.error);
                                        }
                                    } catch (fetchError) {
                                        console.error("[SSE] Failed to fetch image:", fetchError);
                                    }
                                } else if (!data.hasImage) {
                                    console.log("[SSE] No image generated in this session");
                                }

                                // Update constitution in store and Firestore
                                if (data.constitution) {
                                    setConstitution(data.constitution);
                                    if (currentBrand?.id) {
                                        saveConstitution(currentBrand.id, data.constitution).catch(console.error);
                                    }
                                }
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                        currentEvent = "";
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== "AbortError") {
                setError(err.message);
            }
        } finally {
            setIsRunning(false);
            abortRef.current = null;
        }
    }, [prompt, constitution, elements, currentBrand?.id]);

    const stopAgent = () => {
        abortRef.current?.abort();
        setIsRunning(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agent Workspace</h1>
                <p className="text-slate-500 mt-1">Direct the agent to generate and audit brand-consistent assets.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Input & Controls */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Constitution Status with Memory Indicator */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        {constitution ? (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <div>
                                    <h3 className="font-semibold text-emerald-400">Brand Memory Active</h3>
                                    <p className="text-sm text-slate-400">
                                        {constitution.visual_identity.color_palette_hex.length} colors,{" "}
                                        {constitution.voice.keywords.length} keywords
                                    </p>
                                </div>
                            </div>
                        ) : elements.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <div>
                                    <h3 className="font-semibold text-amber-400">Canvas Ready</h3>
                                    <p className="text-sm text-slate-400">
                                        {elements.length} elements - Agent will analyze first
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <div>
                                    <h3 className="font-semibold text-amber-400">No Brand Data</h3>
                                    <Link href="/canvas" className="text-sm text-indigo-400 hover:underline">
                                        Go to Canvas to create your moodboard
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prompt Input */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Agent Task</h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Create a summer sale poster with tropical vibes"
                            className="w-full p-4 rounded-lg bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-100"
                            rows={3}
                            disabled={isRunning}
                        />

                        {error && (
                            <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="mt-4 flex gap-3">
                            {!isRunning ? (
                                <button
                                    onClick={runAgent}
                                    disabled={!prompt.trim()}
                                    className="flex-1 btn-accent py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Run Agent
                                </button>
                            ) : (
                                <button
                                    onClick={stopAgent}
                                    className="flex-1 px-6 py-3 rounded-lg bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
                                >
                                    Stop Agent
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Agent Activity Feed */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span>Agent Thinking</span>
                            {isRunning && (
                                <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                        </h3>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                            {events.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-6">
                                    Agent reasoning will appear here...
                                </p>
                            ) : (
                                events.map((event, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg text-sm ${event.type === "error"
                                            ? "bg-red-500/10 border border-red-500/20"
                                            : event.type === "complete"
                                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                                : "bg-slate-800/50"
                                            }`}
                                    >
                                        {event.data.thinking && (
                                            <p className="text-slate-400 italic mb-2">
                                                "{event.data.thinking}"
                                            </p>
                                        )}
                                        {event.data.tool && (
                                            <p className="text-indigo-400 font-mono text-xs">
                                                {event.data.tool}()
                                            </p>
                                        )}
                                        {event.data.message && (
                                            <p className={event.type === "complete" ? "text-emerald-400" : "text-slate-300"}>
                                                {event.data.message}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Center: Generated Image */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4">Generated Asset</h3>

                    <div className="flex-1 rounded-lg bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                        {isRunning && !finalImage ? (
                            <div className="text-center">
                                <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-slate-400">Agent is working...</p>
                            </div>
                        ) : finalImage && finalImage !== "PLACEHOLDER_IMAGE_BASE64" ? (
                            <Image
                                src={`data:image/png;base64,${finalImage}`}
                                alt="Generated asset"
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="text-center text-slate-500">
                                <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p>Generated image will appear here</p>
                            </div>
                        )}
                    </div>

                    {finalImage && finalImage !== "PLACEHOLDER_IMAGE_BASE64" && (
                        <div className="mt-4 flex gap-3">
                            <button
                                className="flex-1 btn-primary"
                                onClick={() => setShowEditor(true)}
                            >
                                Edit in Canvas
                            </button>
                            <button
                                className="btn-secondary px-4"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `data:image/png;base64,${finalImage}`;
                                    link.download = "sentient-asset.png";
                                    link.click();
                                }}
                            >
                                Save
                            </button>
                            <button
                                className="btn-secondary px-4"
                                onClick={() => setFinalImage(null)}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* Canvas Editor Modal */}
                {showEditor && finalImage && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="w-full max-w-5xl max-h-[90vh] overflow-auto card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Canvas Editor</h2>
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="btn-secondary px-4 py-2"
                                >
                                    Close
                                </button>
                            </div>
                            <EditableCanvas
                                imageBase64={finalImage}
                                onSave={(dataUrl) => {
                                    const base64 = dataUrl.split(",")[1];
                                    if (base64) setFinalImage(base64);
                                    setShowEditor(false);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Right: History Panel */}
                <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1 ${showHistory ? "" : "hidden lg:block"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>Agent History</span>
                        <span className="ml-auto text-xs text-slate-500">
                            {history.length} steps
                        </span>
                    </h3>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-6">
                                Agent steps will be logged here for review and debugging.
                            </p>
                        ) : (
                            history.map((action, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-slate-500">#{i + 1}</span>
                                        <span className="font-mono text-sm text-indigo-400">{action.tool}</span>
                                    </div>
                                    {action.thinking && (
                                        <p className="text-xs text-slate-500 italic mb-1">
                                            {action.thinking.slice(0, 100)}...
                                        </p>
                                    )}
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
                                            View details
                                        </summary>
                                        <pre className="mt-2 p-2 bg-slate-950 rounded text-[10px] overflow-auto max-h-[100px] text-slate-400">
                                            {JSON.stringify(action.input, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
