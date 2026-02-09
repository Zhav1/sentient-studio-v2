"use client";

import React from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <div className="flex-1 ml-72 transition-all duration-300 h-screen overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
