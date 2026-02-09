"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Sparkles, Globe, Upload, ChevronRight, ChevronLeft, CheckCircle2, Loader2, BarChart3, Palette, Type } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fireConfetti } from "@/components/ui/Confetti";

type OnboardingStep = "identity" | "source" | "analysis" | "results";

export function OnboardingWizard() {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>("identity");
    const [brandData, setBrandData] = useState({
        name: "",
        sector: "",
        sourceUrl: "",
        files: [] as File[],
    });
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisPhase, setAnalysisPhase] = useState("Initializing...");

    const nextStep = () => {
        if (step === "identity") setStep("source");
        else if (step === "source") {
            setStep("analysis");
            startAnalysis();
        }
        else if (step === "analysis") setStep("results");
    };

    const prevStep = () => {
        if (step === "source") setStep("identity");
        else if (step === "results") setStep("source");
    };

    const startAnalysis = () => {
        // Simulate AI analysis phases
        const phases = [
            { p: 10, m: "Crawling visual assets..." },
            { p: 30, m: "Extracting color palette..." },
            { p: 50, m: "Analyzing typography & styling..." },
            { p: 70, m: "Mapping composition rules..." },
            { p: 90, m: "Finalizing Brand Constitution..." },
            { p: 100, m: "Analysis Complete." },
        ];

        let current = 0;
        const interval = setInterval(() => {
            if (current < phases.length) {
                setAnalysisProgress(phases[current].p);
                setAnalysisPhase(phases[current].m);
                current++;
            } else {
                clearInterval(interval);
                fireConfetti(); // Trigger celebration
                setTimeout(() => setStep("results"), 800);
            }
        }, 1200);
    };

    return (
        <div className="max-w-2xl mx-auto w-full px-4 py-12">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-12">
                {(["identity", "source", "analysis", "results"] as OnboardingStep[]).map((s, i) => (
                    <div
                        key={s}
                        className={cn(
                            "h-1.5 flex-1 rounded-full transition-all duration-500",
                            step === s ||
                                (step === "source" && i < 1) ||
                                (step === "analysis" && i < 2) ||
                                (step === "results" && i < 3)
                                ? "bg-indigo-600"
                                : "bg-slate-200"
                        )}
                    />
                ))}
            </div>

            <Card className="shadow-xl shadow-slate-200/50 border-slate-200/60 overflow-hidden">
                {step === "identity" && (
                    <>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-3xl font-bold tracking-tight">Tell us about your brand</CardTitle>
                            <CardDescription>We'll use this to contextualize your creative voice.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 py-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Brand Name</label>
                                <Input
                                    placeholder="e.g. Acme Tech"
                                    value={brandData.name}
                                    onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Sector / Industry</label>
                                <Input
                                    placeholder="e.g. Minimalist Home Decor"
                                    value={brandData.sector}
                                    onChange={(e) => setBrandData({ ...brandData, sector: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 py-6 border-t border-slate-100 flex justify-end">
                            <Button
                                onClick={nextStep}
                                className="px-8 shadow-indigo-100"
                                disabled={!brandData.name || !brandData.sector}
                            >
                                Continue
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === "source" && (
                    <>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold tracking-tight">How should we learn your style?</CardTitle>
                            <CardDescription>Provide a source for the BrandAnalystAgent to perform deep extraction.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 py-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {/* Mock selection */ }}
                                    className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-indigo-600 bg-indigo-50/30 gap-4 transition-all"
                                >
                                    <Globe className="w-10 h-10 text-indigo-600" />
                                    <span className="font-bold text-slate-800">Social / URL</span>
                                </button>
                                <button
                                    className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-slate-100 bg-slate-50/50 gap-4 hover:border-indigo-200 transition-all opacity-60 cursor-not-allowed"
                                >
                                    <Upload className="w-10 h-10 text-slate-400" />
                                    <span className="font-bold text-slate-400">File Upload</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Website or Social Profile URL</label>
                                    <div className="relative">
                                        <Input
                                            className="pl-10"
                                            placeholder="https://instagram.com/mybrand"
                                            value={brandData.sourceUrl}
                                            onChange={(e) => setBrandData({ ...brandData, sourceUrl: e.target.value })}
                                        />
                                        <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 italic">
                                    * Our agents will crawl visible assets to build your visual constitution.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 py-6 border-t border-slate-100 flex justify-between">
                            <Button variant="outline" onClick={prevStep}>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={nextStep}
                                className="px-8 shadow-indigo-100"
                                disabled={!brandData.sourceUrl && brandData.files.length === 0}
                            >
                                Analyze Brand
                                <Sparkles className="w-4 h-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === "analysis" && (
                    <CardContent className="py-20 flex flex-col items-center justify-center text-center space-y-8">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-600">{analysisProgress}%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Analysis in Progress</h2>
                            <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium h-6">
                                <span className="animate-pulse">{analysisPhase}</span>
                            </div>
                        </div>

                        <div className="max-w-xs w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-indigo-600 h-full transition-all duration-700 ease-out"
                                style={{ width: `${analysisProgress}%` }}
                            />
                        </div>

                        <p className="text-sm text-slate-500 max-w-sm">
                            Our specialized agent team is currently extracting your Brand DNA. This includes photography style, typography, and unique composition rules.
                        </p>
                    </CardContent>
                )}

                {step === "results" && (
                    <>
                        <CardHeader className="text-center pb-2">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-indigo-50 rounded-full">
                                    <CheckCircle2 className="w-10 h-10 text-indigo-600" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl font-bold tracking-tight">Brand Constitution Extracted</CardTitle>
                            <CardDescription>We've successfully mapped your creative DNA.</CardDescription>
                        </CardHeader>
                        <CardContent className="py-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Palette className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Visual Identity</span>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">Warm, minimalist, soft shadows, high-key lighting.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <Type className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Typography</span>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">Modern serif, generous letter spacing.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 col-span-2">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <BarChart3 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Voice & Tone</span>
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium italic">"Empathetic, clear, and aspirational. Focuses on clarity and purposeful design."</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 py-6 border-t border-slate-100 flex flex-col gap-3">
                            <Button
                                onClick={() => router.push("/dashboard")}
                                className="w-full h-12 text-base font-bold premium shadow-lg"
                            >
                                Go to Dashboard
                                <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button variant="ghost" onClick={prevStep} className="w-full font-semibold text-slate-500">
                                Not quite right? Adjust source
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>

            <p className="mt-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Verified Secure Branding Environment
            </p>
        </div>
    );
}
