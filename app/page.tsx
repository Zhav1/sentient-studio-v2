import Link from "next/link";

export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
                {/* Background - Subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-900/50 mb-8 fade-in">
                        <span className="status-dot status-active" />
                        <span className="text-sm text-slate-400">
                            Powered by Gemini 3
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 slide-up tracking-tight">
                        <span className="text-indigo-400">Sentient</span>{" "}
                        <span className="text-slate-50">Studio</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto slide-up leading-relaxed">
                        Transform your brand vision into reality. Drag, drop, and let AI
                        generate{" "}
                        <span className="text-slate-50 font-medium">on-brand</span>{" "}
                        marketing assets.
                    </p>

                    {/* Features - Clean pills */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12 fade-in">
                        {[
                            "Living Brand Constitution",
                            "AI Compliance Auditor",
                            "Real-time Generation",
                        ].map((feature) => (
                            <div
                                key={feature}
                                className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300"
                            >
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center slide-up">
                        <Link
                            href="/canvas"
                            className="btn-primary px-8 py-4 text-base font-semibold"
                        >
                            Open Canvas
                        </Link>
                        <Link
                            href="/dashboard"
                            className="btn-secondary px-8 py-4 text-base font-semibold"
                        >
                            View Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6 border-t border-slate-800">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4">
                        How It Works
                    </h2>
                    <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
                        Three simple steps to create brand-consistent assets
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Step 1 */}
                        <div className="card card-hover p-8 text-center">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
                                <span className="text-indigo-400 font-bold text-lg">1</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-3">Build Your Moodboard</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Drag images, colors, and notes onto the canvas. The AI watches and learns your aesthetic.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="card card-hover p-8 text-center">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                                <span className="text-emerald-400 font-bold text-lg">2</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-3">AI Creates Constitution</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Gemini extracts your brand DNA: color palettes, visual style, tone of voice, and boundaries.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="card card-hover p-8 text-center">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
                                <span className="text-indigo-400 font-bold text-lg">3</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-3">Generate On-Brand</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Type a simple prompt. Watch AI generate and audit assets in real-time until they pass.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-slate-800 text-center">
                <p className="text-slate-500 text-sm">
                    Built with Next.js and Gemini 3 for the Google AI Hackathon
                </p>
            </footer>
        </main>
    );
}
