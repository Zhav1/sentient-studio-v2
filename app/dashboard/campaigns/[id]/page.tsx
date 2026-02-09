"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCampaign, subscribeToCampaign } from "@/lib/firebase/firestore";
import { Campaign, Asset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Loader2, Calendar, Target, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const campaignId = params.id as string;

    useEffect(() => {
        const fetchCampaign = async () => {
            if (!campaignId) return;
            try {
                const data = await getCampaign(campaignId);
                if (!data) {
                    router.push("/dashboard/campaigns");
                    return;
                }
                setCampaign(data);
            } catch (error) {
                console.error("Error fetching campaign:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaign();

        // Subscribe to real-time updates for asset progress
        const unsubscribe = subscribeToCampaign(campaignId, (updated) => {
            if (updated) setCampaign(updated);
        });

        return () => unsubscribe();
    }, [campaignId, router]);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="flex items-center gap-6">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                </div>
                <Skeleton className="h-48 w-full rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-video w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!campaign) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-6">
                <Link href="/dashboard/campaigns" className="p-3 rounded-2xl hover:bg-slate-100 transition-all text-slate-500 border border-transparent hover:border-slate-200">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase border border-indigo-100">
                            {campaign.status}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{campaign.title}</h1>
                </div>
            </div>

            {/* Strategy Meta */}
            <Card className="border-slate-100 shadow-sm overflow-hidden bg-slate-50/50">
                <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                            <Target className="w-5 h-5 text-indigo-600" />
                            Strategy Prompt
                        </div>
                        <p className="text-slate-600 leading-relaxed italic">
                            "{campaign.user_prompt || "Defining the visual strategy for this campaign..."}"
                        </p>
                    </div>
                    <div className="w-full md:w-64 grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Approved</p>
                            <p className="text-2xl font-black text-emerald-600">
                                {campaign.assets.filter(a => a.status === "APPROVED").length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                            <p className="text-2xl font-black text-slate-900">{campaign.assets.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Asset Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Generated Assets</h2>
                    <Button variant="outline" size="sm" className="text-xs">
                        Audit All
                    </Button>
                </div>

                {campaign.assets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {campaign.assets.map((asset) => (
                            <Card key={asset.id} className="group overflow-hidden border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                                <div className="aspect-video bg-slate-900 relative">
                                    {asset.image_url ? (
                                        <Image
                                            src={asset.image_url}
                                            alt="Generated Asset"
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
                                            <p className="text-slate-600 text-xs font-medium tracking-widest uppercase">Agent Processing...</p>
                                        </div>
                                    )}

                                    {/* Status Overlay */}
                                    <div className="absolute top-4 right-4">
                                        <AssetStatusBadge status={asset.status} />
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs font-mono text-slate-400">#{asset.id.slice(-6)}</div>
                                        <div className="flex gap-1">
                                            {asset.audit_result?.pass ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : asset.audit_result ? (
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-600 transition-all duration-1000"
                                                style={{ width: `${asset.audit_result?.compliance_score || 0}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>Compliance Score</span>
                                            <span className="text-indigo-600 font-black">{asset.audit_result?.compliance_score || 0}%</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-2">
                                        <Button size="sm" variant="outline" className="flex-1 text-xs">Edit</Button>
                                        <Button size="sm" variant="secondary" className="flex-1 text-xs">Audit Details</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl">
                        <p className="text-slate-400">No assets have been generated for this campaign yet.</p>
                        <Link href="/dashboard" className="inline-block mt-4">
                            <Button variant="premium" size="sm">Launch Agent Workspace</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function AssetStatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        GENERATING: "bg-amber-500/90 text-white",
        AUDITING: "bg-indigo-500/90 text-white",
        APPROVED: "bg-emerald-500/90 text-white",
        REJECTED: "bg-red-500/90 text-white",
        FAILED: "bg-slate-700/90 text-white"
    };

    return (
        <span className={`${colors[status] || "bg-slate-500"} px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg shadow-black/10 backdrop-blur-md`}>
            {status}
        </span>
    );
}
