"use client";

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Sparkles } from "lucide-react";

export default function OnboardingPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/40 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Header */}
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Sentient Studio</h1>
            </div>

            <OnboardingWizard />

            {/* Footer */}
            <footer className="mt-8 text-slate-400 text-xs">
                Powered by Gemini 3 Native Multimodal Intelligence
            </footer>
        </main>
    );
}
