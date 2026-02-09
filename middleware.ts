import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // For simplicity in this demo, we'll check for a session cookie or just skip for now 
    // since we can't easily check Firebase Auth from Edge Middleware without complex setup.
    // Instead, we'll rely on client-side protection for now or implement a more robust check if needed.

    // However, we can at least establish the pattern.
    const { pathname } = request.nextUrl;

    // Protected routes
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        // We'd ideally check for auth token here
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
