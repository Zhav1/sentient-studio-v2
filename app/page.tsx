"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogIn, Rocket, LayoutDashboard, Sparkles, Wand2, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
    const { user, loading } = useAuth();

    return (
        <main className="min-h-screen flex flex-col bg-slate-50">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-600" />
                            <span className="text-xl font-bold text-slate-900 tracking-tight">Sentient Studio</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {!loading && (
                                user ? (
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                                    >
                                        <LayoutDashboard className="w-4 h-4 mr-2" />
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                                            Sign in
                                        </Link>
                                        <Link
                                            href="/signup"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 relative overflow-hidden bg-white">
                {/* Background - Subtle pattern */}
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50/50 mb-8 animate-fade-in shadow-sm">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                            Now Powered by Gemini 3
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight animate-slide-up">
                        AI that learns <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">your brand.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
                        Stop using generic templates. Sentient Studio extracts your unique brand DNA from existing content and generates consistent visuals in seconds.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-200">
                        <Link
                            href={user ? "/canvas" : "/signup"}
                            className="bg-slate-900 text-white px-8 py-4 rounded-xl text-base font-semibold shadow-lg shadow-slate-200/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <Rocket className="w-5 h-5" />
                            {user ? "Open Canvas" : "Start for Free"}
                        </Link>
                        <Link
                            href="/dashboard"
                            className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            View Dashboard
                        </Link>
                    </div>

                    {/* Trust/Proof */}
                    <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-50">
                        <span className="text-sm font-bold text-slate-400">Trusted by 10,000+ Creators</span>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-6 bg-slate-50 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                            The Brand Intelligence Loop
                        </h2>
                        <p className="text-slate-600 max-w-xl mx-auto text-lg">
                            We don't just generate images; we build a persistent memory of your creative voice.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">
                                <Wand2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Deep Analysis</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Upload your portfolio. Gemini analyzes thousands of style parameters to extract your unique Visual Constitution.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">2. Compliance Loop</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Every generation is audited against your constitution. Off-brand outputs are auto-corrected before you see them.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Style Evolution</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Your edits improve the model. The more you use it, the closer it gets to your perfect creative intuition.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-white border-t border-slate-200 text-center">
                <div className="mb-6 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-900">Sentient Studio</span>
                </div>
                <p className="text-slate-500 text-sm">
                    © 2026 Sentient Studio. Built for the Google AI Hackathon.
                </p>
            </footer>
        </main>
    );
}

