"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Palette,
    Settings,
    ChevronDown,
    Plus,
    Sparkles,
    Zap,
    History,
    LogOut,
    User,
    PanelLeftClose,
    PanelLeftOpen,
    Box
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { getAllBrands } from "@/lib/firebase/firestore";
import type { Brand } from "@/lib/types";

export function Sidebar() {
    const pathname = usePathname();
    const { currentBrand, setCurrentBrand } = useCanvasStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [showBrandSwitcher, setShowBrandSwitcher] = useState(false);

    useEffect(() => {
        async function loadBrands() {
            try {
                const fetched = await getAllBrands();
                setBrands(fetched);
                if (!currentBrand && fetched.length > 0) {
                    setCurrentBrand(fetched[0]);
                }
            } catch (err) {
                console.error("Failed to load brands:", err);
            }
        }
        loadBrands();
    }, [currentBrand, setCurrentBrand]);

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Creative Canvas", href: "/canvas", icon: Palette },
        { name: "Asset History", href: "/dashboard/history", icon: History },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Zap },
        {
            name: "Brand Settings",
            href: currentBrand ? `/dashboard/brands/${currentBrand.id}` : "/dashboard",
            icon: Settings
        },
    ];

    return (
        <aside
            className={cn(
                "h-screen fixed left-0 top-0 bg-white border-r border-slate-200 z-50 transition-all duration-300 flex flex-col",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Sidebar Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 transition-all z-10"
            >
                {isCollapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
            </button>

            {/* Header / Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                    <span className="text-xl font-bold tracking-tight text-slate-900">Sentient</span>
                )}
            </div>

            {/* Brand Switcher */}
            <div className="px-4 mb-8">
                <div className={cn(
                    "relative rounded-2xl border transition-all",
                    isCollapsed ? "p-1 border-transparent" : "p-3 border-slate-100 bg-slate-50/50"
                )}>
                    <button
                        onClick={() => !isCollapsed && setShowBrandSwitcher(!showBrandSwitcher)}
                        className={cn(
                            "flex items-center w-full gap-3 transition-all",
                            isCollapsed ? "justify-center" : "justify-between"
                        )}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Box className="w-4 h-4 text-indigo-600" />
                            </div>
                            {!isCollapsed && (
                                <div className="text-left overflow-hidden">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {currentBrand?.name || "Select Brand"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-bold">
                                        ACTIVE KIT
                                    </p>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showBrandSwitcher && "rotate-180")} />
                        )}
                    </button>

                    {/* Brand Dropdown (Simplified) */}
                    {showBrandSwitcher && !isCollapsed && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 max-h-48 overflow-y-auto">
                                {brands.map((b) => (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            setCurrentBrand(b);
                                            setShowBrandSwitcher(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3",
                                            currentBrand?.id === b.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                                        )}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        {b.name}
                                    </button>
                                ))}
                            </div>
                            <Link
                                href="/onboarding"
                                className="flex items-center gap-2 p-3 bg-slate-50 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:bg-indigo-100/50 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                CREATE NEW BRAND KIT
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium group relative",
                                isActive
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200/50"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-400" : "group-hover:scale-110 transition-transform")} />
                            {!isCollapsed && <span>{item.name}</span>}
                            {isActive && !isCollapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Logout */}
            <div className="p-4 mt-auto border-t border-slate-100">
                <div className={cn(
                    "flex items-center w-full gap-3 transition-all",
                    isCollapsed ? "justify-center" : "p-2 rounded-xl bg-slate-50 border border-slate-100"
                )}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                        <User className="w-4 h-4" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">Creator Pro</p>
                            <p className="text-[10px] text-slate-500 truncate">Free Plan</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
