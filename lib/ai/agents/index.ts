/**
 * Multi-Agent System Exports
 * 
 * Central export point for the Sentient Studio multi-agent architecture.
 */

// Agent types and shared interfaces
export * from "./types";

// Orchestrator Agent (central coordinator)
export {
    OrchestratorAgent,
    createOrchestratorAgent
} from "./orchestrator";

// Context Memory Agent (session and brand memory)
export {
    ContextMemoryAgent,
    getContextMemory,
    type SessionContext,
    type BrandMemory,
    type CorrectionPattern,
} from "./context-memory";

// Export Optimizer (platform templates)
export {
    PLATFORM_TEMPLATES,
    getTemplate,
    getTemplatesForPlatform,
    getAspectRatioFromTemplate,
    getPlatformPromptAdditions,
    prepareBatchExport,
    type PlatformTemplate,
    type ExportOptions,
    type BatchExportRequest,
    type BatchExportResult,
} from "./export-optimizer";
