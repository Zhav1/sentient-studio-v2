# Implementation Plan: Full System Audit

## Goal
Complete audit of User Experience, Agent System, and UX/UI enhancements from a Silicon Valley CTO perspective. Each section uses ✅ = Exists, ❌ = Missing, ⚠️ = Partial.

---

# Part 1: User Journey Gaps

## Journey 1: Discovery (Landing Page)
| Element | Status | Notes |
|---------|--------|-------|
| Hero Section | ✅ | |
| "How It Works" | ✅ | |
| **Login/Signup CTA** | ❌ | **Missing**. Only "Open Canvas" which bypasses auth. |

## Journey 2: Authentication
| Element | Status | Notes |
|---------|--------|-------|
| `/login` page | ❌ | **Does not exist.** |
| `/signup` page | ❌ | **Does not exist.** |
| AuthProvider | ❌ | No global auth context. |
| Route Protection | ❌ | Anyone can access `/dashboard`. |

## Journey 3: Onboarding
| Element | Status | Notes |
|---------|--------|-------|
| Onboarding Wizard | ❌ | **No first-time setup flow.** |
| Social Media URL Input | ❌ | **Critical PRD feature missing.** User should paste YT/Insta URL. |
| Asset Upload Step | ⚠️ | Canvas exists but not in onboarding context. |

## Journey 4: Dashboard
| Element | Status | Notes |
|---------|--------|-------|
| User Profile/Logout | ❌ | No user indicator. |
| Brand Selector | ❌ | No multi-brand support. |
| Empty State | ❌ | No guidance for new users. |

## Journey 5-7: Canvas, Generation, Settings
| Element | Status | Notes |
|---------|--------|-------|
| Canvas Moodboard | ✅ | Works. |
| Generation | ✅ | Works. |
| Asset Persistence | ❌ | Generated assets not saved to DB. |
| Settings Page | ❌ | Does not exist. |

---

# Part 2: Agent Capability Gaps (PRD vs Implementation)

## Orchestrator Agent
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Intent parsing | ✅ | [parseIntent()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/orchestrator.ts#77-169) works. |
| Task decomposition | ✅ | Creates task queue. |
| **Real agent delegation** | ❌ | **CRITICAL**: [delegateToAgent()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/orchestrator.ts#284-342) returns `{ delegated: true }` stub. Does NOT actually call agent classes. |
| Quality gate | ❌ | No final synthesis logic. |

## Brand DNA Analyst
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Multi-image analysis | ✅ | Works via [extractConstitution()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/brand-analyst.ts#31-147). |
| Color palette extraction | ✅ | |
| **Extended schema fields** | ❌ | PRD has `color_meanings`, `typography_style`, `visual_density`, `signature_elements`, `vocabulary_level`, `catchphrases`, `content_patterns`. Implementation only has basic fields. |
| Brand refresh trigger | ❌ | No periodic drift detection. |

## Creative Director Agent
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Asset generation | ✅ | Works. |
| Brand-aware prompting | ✅ | [buildBrandPrompt()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/creative-director.ts#150-176) exists. |
| Multi-turn editing | ❌ | [refinePrompt()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/creative-director.ts#111-149) exists but not connected to chat history. |
| **Variation generation (A/B)** | ❌ | Only generates 1 image. PRD wants 2-3 variants. |

## Compliance Auditor Agent
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Score calculation | ✅ | Works. |
| **Enforcement logic** | ⚠️ | Score returned but no auto-regeneration on score < 60. |
| Cross-asset cohesion | ❌ | No comparison to past assets. |

## Trend Scout Agent
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Google Search grounding | ✅ | Configured. |
| **Integration with generation** | ❌ | **Never called in main flow.** Agent exists but is orphaned. |
| Weekly auto-scan | ❌ | No cron/background job. |
| Competitor analysis | ❌ | Not implemented. |

## Context Memory Agent
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Session cache | ✅ | In-memory works. |
| Conversation history | ✅ | |
| Thought signatures | ✅ | |
| **Firestore persistence** | ❌ | **In-memory only.** [saveBrandMemory()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/context-memory.ts#173-180) uses Map, not Firestore. |
| Learning loop | ⚠️ | [recordCorrection()](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/context-memory.ts#224-257) exists but never called. |

## Export Optimizer Agent
| PRD Capability | Status | Notes |
|----------------|--------|-------|
| Platform presets | ✅ | All presets defined. |
| Batch export | ❌ | Only single export. |

---

# Part 3: Silicon Valley UX/UI Enhancements

## 3.1 Delight & Micro-interactions
| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Skeleton loaders | P1 | Replace spinners with content-aware skeletons. |
| Success confetti | P2 | Celebrate first generation/brand creation. |
| Haptic feedback | P3 | For mobile web interactions. |
| Toast notifications | P1 | Use `sonner` for non-blocking feedback. |

## 3.2 Information Architecture
| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Sidebar navigation | P1 | For Dashboard: Workspace, Assets, Settings. |
| Breadcrumbs | P2 | For Canvas/Editor context. |
| Keyboard shortcuts | P2 | Cmd+G to generate, Cmd+E to export. |

## 3.3 Trust & Transparency
| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Agent Reasoning Panel | P0 | Already exists but needs refinement. Show each agent's contribution clearly. |
| Compliance Score Visualization | P1 | Radial chart for score, not just number. |
| "Why this color?" tooltips | P2 | Explain AI decisions in Constitution. |

## 3.4 Performance & Polish
| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Image lazy loading | P1 | For asset gallery. |
| Optimistic updates | P1 | Update UI before API confirms. |
| Error boundaries | P1 | Graceful error handling per component. |

## 3.5 Accessibility
| Enhancement | Priority | Description |
|-------------|----------|-------------|
| ARIA labels | P1 | For all interactive elements. |
| Focus management | P1 | Proper focus trapping in modals. |
| Color contrast | P1 | WCAG AA compliance. |

---

# Summary: Files To Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `app/(auth)/login/page.tsx` | NEW | P0 |
| `app/(auth)/signup/page.tsx` | NEW | P0 |
| `components/auth/AuthProvider.tsx` | NEW | P0 |
| `middleware.ts` | NEW | P0 |
| `app/onboarding/page.tsx` | NEW | P0 |
| `components/onboarding/OnboardingWizard.tsx` | NEW | P0 |
| `app/api/scrape-social/route.ts` | NEW | P1 |
| [lib/ai/agents/orchestrator.ts](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/orchestrator.ts) | MODIFY | P0 (Fix delegation) |
| [lib/ai/agents/context-memory.ts](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/agents/context-memory.ts) | MODIFY | P1 (Add Firestore) |
| [lib/ai/orchestrated.ts](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/ai/orchestrated.ts) | MODIFY | P1 (Integrate TrendScout) |
| [lib/types/index.ts](file:///d:/College/Gemini%20Hackathon/sentient-studio/lib/types/index.ts) | MODIFY | P2 (Extend BrandConstitution) |
| [app/page.tsx](file:///d:/College/Gemini%20Hackathon/sentient-studio/app/page.tsx) | MODIFY | P0 (Add Auth CTAs) |
| [app/dashboard/page.tsx](file:///d:/College/Gemini%20Hackathon/sentient-studio/app/dashboard/page.tsx) | MODIFY | P1 (Add User, Brand Selector) |
