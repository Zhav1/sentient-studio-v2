/**
 * Context Memory Agent
 * 
 * Manages session state and persistent brand memory per PRD specification:
 * - Session cache: Conversation history, current task, undo stack, thought signatures
 * - Brand memory: Constitution, approved assets log, style evolution, correction patterns
 * - Learning loop: User corrections improve future outputs
 */

import type { BrandConstitution, CanvasElement } from "@/lib/types";
import type { AgentResult, OrchestrationState } from "./types";

// ============ SESSION CACHE ============

export interface SessionContext {
    sessionId: string;
    startTime: number;
    conversationHistory: ConversationTurn[];
    currentTask: string | null;
    undoStack: UndoAction[];
    thoughtSignatures: Map<string, string>;
}

export interface ConversationTurn {
    role: "user" | "agent";
    content: string;
    timestamp: number;
    agentRole?: string;
    toolsCalled?: string[];
}

export interface UndoAction {
    id: string;
    action: string;
    previousState: Record<string, unknown>;
    timestamp: number;
}

// ============ BRAND MEMORY ============

export interface BrandMemory {
    userId: string;
    brandId: string;
    constitution: BrandConstitution;
    createdAt: number;
    updatedAt: number;
    approvedAssets: ApprovedAsset[];
    styleEvolution: StyleSnapshot[];
    correctionPatterns: CorrectionPattern[];
}

export interface ApprovedAsset {
    id: string;
    type: string;
    platform: string;
    imageUrl?: string;
    complianceScore: number;
    createdAt: number;
}

export interface StyleSnapshot {
    timestamp: number;
    constitution: BrandConstitution;
    trigger: "initial" | "refresh" | "correction" | "upload";
}

export interface CorrectionPattern {
    id: string;
    category: "color" | "typography" | "style" | "composition";
    originalValue: string;
    correctedValue: string;
    frequency: number;
    lastApplied: number;
}

// ============ CONTEXT MEMORY AGENT ============

export class ContextMemoryAgent {
    private sessionCache: Map<string, SessionContext> = new Map();
    private brandMemoryCache: Map<string, BrandMemory> = new Map();

    /**
     * Initialize or get a session
     */
    getSession(sessionId: string): SessionContext {
        if (!this.sessionCache.has(sessionId)) {
            this.sessionCache.set(sessionId, {
                sessionId,
                startTime: Date.now(),
                conversationHistory: [],
                currentTask: null,
                undoStack: [],
                thoughtSignatures: new Map(),
            });
        }
        return this.sessionCache.get(sessionId)!;
    }

    /**
     * Add a conversation turn
     */
    addConversationTurn(
        sessionId: string,
        turn: Omit<ConversationTurn, "timestamp">
    ): void {
        const session = this.getSession(sessionId);
        session.conversationHistory.push({
            ...turn,
            timestamp: Date.now(),
        });

        // Limit history to prevent memory bloat (keep last 50 turns)
        if (session.conversationHistory.length > 50) {
            session.conversationHistory = session.conversationHistory.slice(-50);
        }
    }

    /**
     * Store thought signature for Gemini 3 continuity
     */
    storeThoughtSignature(
        sessionId: string,
        partId: string,
        signature: string
    ): void {
        const session = this.getSession(sessionId);
        session.thoughtSignatures.set(partId, signature);
    }

    /**
     * Retrieve thought signatures for a session
     */
    getThoughtSignatures(sessionId: string): Map<string, string> {
        const session = this.getSession(sessionId);
        return new Map(session.thoughtSignatures);
    }

    /**
     * Push an undo action
     */
    pushUndoAction(sessionId: string, action: Omit<UndoAction, "id" | "timestamp">): void {
        const session = this.getSession(sessionId);
        session.undoStack.push({
            ...action,
            id: `undo_${Date.now()}`,
            timestamp: Date.now(),
        });

        // Limit undo stack
        if (session.undoStack.length > 20) {
            session.undoStack = session.undoStack.slice(-20);
        }
    }

    /**
     * Pop and return the last undo action
     */
    popUndoAction(sessionId: string): UndoAction | undefined {
        const session = this.getSession(sessionId);
        return session.undoStack.pop();
    }

    // ============ BRAND MEMORY OPERATIONS ============

    /**
     * Get or initialize brand memory
     */
    getBrandMemory(userId: string, brandId: string): BrandMemory | null {
        const key = `${userId}:${brandId}`;
        return this.brandMemoryCache.get(key) || null;
    }

    /**
     * Save brand memory (in-memory, would persist to Firestore in production)
     */
    saveBrandMemory(memory: BrandMemory): void {
        const key = `${memory.userId}:${memory.brandId}`;
        this.brandMemoryCache.set(key, memory);
    }

    /**
     * Update constitution with style snapshot
     */
    updateConstitution(
        userId: string,
        brandId: string,
        constitution: BrandConstitution,
        trigger: StyleSnapshot["trigger"]
    ): void {
        const key = `${userId}:${brandId}`;
        const existing = this.brandMemoryCache.get(key);

        if (existing) {
            // Add to style evolution
            existing.styleEvolution.push({
                timestamp: Date.now(),
                constitution: { ...existing.constitution },
                trigger,
            });

            // Keep last 10 snapshots
            if (existing.styleEvolution.length > 10) {
                existing.styleEvolution = existing.styleEvolution.slice(-10);
            }

            // Update constitution
            existing.constitution = constitution;
            existing.updatedAt = Date.now();
        } else {
            // Create new
            this.saveBrandMemory({
                userId,
                brandId,
                constitution,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                approvedAssets: [],
                styleEvolution: [],
                correctionPatterns: [],
            });
        }
    }

    /**
     * Record a correction pattern for learning
     */
    recordCorrection(
        userId: string,
        brandId: string,
        correction: Omit<CorrectionPattern, "id" | "frequency" | "lastApplied">
    ): void {
        const memory = this.getBrandMemory(userId, brandId);
        if (!memory) return;

        // Find existing pattern
        const existing = memory.correctionPatterns.find(
            (p) =>
                p.category === correction.category &&
                p.originalValue === correction.originalValue
        );

        if (existing) {
            existing.correctedValue = correction.correctedValue;
            existing.frequency++;
            existing.lastApplied = Date.now();
        } else {
            memory.correctionPatterns.push({
                ...correction,
                id: `corr_${Date.now()}`,
                frequency: 1,
                lastApplied: Date.now(),
            });
        }

        this.saveBrandMemory(memory);
    }

    /**
     * Get applicable corrections for a generation
     */
    getApplicableCorrections(
        userId: string,
        brandId: string
    ): CorrectionPattern[] {
        const memory = this.getBrandMemory(userId, brandId);
        if (!memory) return [];

        // Return patterns with frequency >= 2 (learned preferences)
        return memory.correctionPatterns.filter((p) => p.frequency >= 2);
    }

    /**
     * Log an approved asset
     */
    logApprovedAsset(
        userId: string,
        brandId: string,
        asset: Omit<ApprovedAsset, "id" | "createdAt">
    ): void {
        const memory = this.getBrandMemory(userId, brandId);
        if (!memory) return;

        memory.approvedAssets.push({
            ...asset,
            id: `asset_${Date.now()}`,
            createdAt: Date.now(),
        });

        // Keep last 100 approved assets
        if (memory.approvedAssets.length > 100) {
            memory.approvedAssets = memory.approvedAssets.slice(-100);
        }

        this.saveBrandMemory(memory);
    }

    /**
     * Get summary of brand memory for context
     */
    getBrandContext(userId: string, brandId: string): string {
        const memory = this.getBrandMemory(userId, brandId);
        if (!memory) return "No brand memory available.";

        const corrections = memory.correctionPatterns
            .filter((p) => p.frequency >= 2)
            .map((p) => `- ${p.category}: prefer "${p.correctedValue}" over "${p.originalValue}"`)
            .join("\n");

        const recentAssets = memory.approvedAssets.slice(-5);
        const assetSummary = recentAssets
            .map((a) => `- ${a.type} for ${a.platform} (score: ${a.complianceScore})`)
            .join("\n");

        return `
Brand Memory Summary:
- Constitution last updated: ${new Date(memory.updatedAt).toISOString()}
- Total approved assets: ${memory.approvedAssets.length}
- Style snapshots: ${memory.styleEvolution.length}

Learned Preferences:
${corrections || "None yet"}

Recent Assets:
${assetSummary || "None yet"}
`.trim();
    }

    /**
     * Clear session (e.g., on logout)
     */
    clearSession(sessionId: string): void {
        this.sessionCache.delete(sessionId);
    }
}

// ============ SINGLETON INSTANCE ============

let contextMemoryInstance: ContextMemoryAgent | null = null;

export function getContextMemory(): ContextMemoryAgent {
    if (!contextMemoryInstance) {
        contextMemoryInstance = new ContextMemoryAgent();
    }
    return contextMemoryInstance;
}
