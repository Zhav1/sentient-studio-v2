"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBrand, saveConstitution } from "@/lib/firebase/firestore";
import { Brand, BrandConstitution } from "@/lib/types";
import { ConstitutionEditor } from "@/components/dashboard/ConstitutionEditor";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [brand, setBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const brandId = params.id as string;

    useEffect(() => {
        const fetchBrand = async () => {
            if (!brandId) return;
            try {
                const data = await getBrand(brandId);
                if (!data) {
                    router.push("/dashboard");
                    return;
                }
                setBrand(data);
            } catch (error) {
                console.error("Error fetching brand:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBrand();
    }, [brandId, router]);

    const handleSaveConstitution = async (updated: BrandConstitution) => {
        if (!brandId) return;
        await saveConstitution(brandId, updated);
        // Update local state
        setBrand(prev => prev ? { ...prev, constitution_cache: updated } : null);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading Brand Engine...</p>
                </div>
            </div>
        );
    }

    if (!brand) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{brand.name}</h1>
                    <p className="text-slate-500 mt-1">Manage brand identity and configuration.</p>
                </div>
            </div>

            {brand.constitution_cache ? (
                <ConstitutionEditor
                    constitution={brand.constitution_cache}
                    onSave={handleSaveConstitution}
                />
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="max-w-sm mx-auto">
                        <h3 className="text-xl font-bold text-slate-900">No Constitution Found</h3>
                        <p className="text-slate-500 mt-2">
                            This brand hasn't been analyzed by the agent yet. Head over to the Dashboard to start an extraction.
                        </p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="mt-4">
                            Go to Agent Workspace
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
