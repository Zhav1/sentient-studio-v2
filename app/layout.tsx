import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});

export const metadata: Metadata = {
    title: "Sentient Studio | AI-Powered Brand Asset Generator",
    description:
        "Transform your brand vision into reality. Drag, drop, and let AI generate on-brand marketing assets with intelligent compliance checking.",
    keywords: [
        "AI",
        "brand assets",
        "marketing",
        "generative AI",
        "moodboard",
        "Gemini",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-white text-slate-900`}
            >
                <AuthProvider>
                    {children}
                    <Toaster position="top-right" richColors />
                </AuthProvider>
            </body>
        </html>
    );
}

