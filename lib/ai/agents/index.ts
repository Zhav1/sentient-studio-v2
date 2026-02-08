/**
 * Multi-Agent Orchestration System
 * 
 * Central export file for all agent modules.
 * Import from this file to access any agent functionality.
 */

// ============ TYPES ============
export * from "./types";

// ============ AGENTS ============

// Orchestrator - Central coordinator
export { OrchestratorAgent, createOrchestratorAgent } from "./orchestrator";

// Brand DNA Analyst - Constitution extraction
export { BrandAnalystAgent, createBrandAnalystAgent } from "./brand-analyst";

// Creative Director - Asset generation
export { CreativeDirectorAgent, createCreativeDirectorAgent } from "./creative-director";

// Compliance Auditor - Brand consistency scoring
export { ComplianceAuditorAgent, createComplianceAuditorAgent, type AuditResult, type ComplianceViolation } from "./compliance-auditor";

// Trend Scout - Platform trend research
export { TrendScoutAgent, createTrendScoutAgent, type TrendResearch, type PlatformTrend } from "./trend-scout";

// Context Memory - Session & brand memory
export { ContextMemoryAgent, getContextMemory } from "./context-memory";
export type {
    SessionContext,
    ConversationTurn,
    UndoAction,
    BrandMemory,
    ApprovedAsset,
    StyleSnapshot,
    CorrectionPattern,
} from "./context-memory";

// Export Optimizer - Platform templates
export {
    PLATFORM_TEMPLATES,
    getTemplate,
    getTemplatesForPlatform,
    getAspectRatioFromTemplate,
    getPlatformPromptAdditions,
    prepareBatchExport,
} from "./export-optimizer";
export type {
    PlatformTemplate,
    ExportOptions,
    OptimizedExport,
    BatchExportRequest,
    BatchExportResult,
} from "./export-optimizer";
