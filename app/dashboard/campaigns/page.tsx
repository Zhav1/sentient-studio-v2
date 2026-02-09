"use client";

import React, { useEffect, useState } from "react";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { getCampaignsByBrand, createCampaign } from "@/lib/firebase/firestore";
import { Campaign } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Zap, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fireConfetti } from "@/components/ui/Confetti";

export default function CampaignsPage() {
    const { currentBrand } = useCanvasStore();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCampaignTitle, setNewCampaignTitle] = useState("");

    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!currentBrand) return;
            setIsLoading(true);
            try {
                const data = await getCampaignsByBrand(currentBrand.id);
                setCampaigns(data);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaigns();
    }, [currentBrand]);

    const handleCreateCampaign = async () => {
        if (!currentBrand || !newCampaignTitle.trim()) return;
        setIsCreating(true);
        try {
            const campaignId = await createCampaign({
                brand_id: currentBrand.id,
                title: newCampaignTitle,
                user_prompt: "", // Empty for now, can be enriched later
                status: "PENDING",
                assets: [],
                created_at: Date.now(),
                updated_at: Date.now(),
            } as any);

            toast.success("Campaign created successfully!");
            fireConfetti();
            setNewCampaignTitle("");
            // Refresh list (simplified)
            const updated = await getCampaignsByBrand(currentBrand.id);
            setCampaigns(updated);
        } catch (error) {
            toast.error("Failed to create campaign");
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!currentBrand) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-slate-500">Please select a brand from the sidebar first.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Campaign Strategy</h1>
                    <p className="text-slate-500 text-lg">Orchestrate multiple assets into cohesive brand stories.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Campaign Title (e.g. Summer Launch)"
                            value={newCampaignTitle}
                            onChange={(e) => setNewCampaignTitle(e.target.value)}
                            className="w-64"
                            onKeyDown={(e) => e.key === "Enter" && handleCreateCampaign()}
                        />
                        <Button
                            onClick={handleCreateCampaign}
                            disabled={isCreating || !newCampaignTitle.trim()}
                            variant="premium"
                            className="gap-2"
                        >
                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border-slate-100 shadow-sm animate-pulse">
                            <div className="h-32 bg-slate-50 border-b border-slate-100" />
                            <CardContent className="p-6 space-y-4">
                                <div className="h-4 bg-slate-100 rounded w-2/3" />
                                <div className="h-3 bg-slate-50 rounded w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : campaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="group border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                            <div className="h-24 bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-start justify-between">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase",
                                    campaign.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                                )}>
                                    {campaign.status}
                                </span>
                                <Zap className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <CardHeader className="pt-6">
                                <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                                    {campaign.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 mt-2">
                                    {campaign.user_prompt || "No strategy prompt defined yet."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                                    <span>{campaign.assets?.length || 0} Assets</span>
                                    <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                                </div>
                                <Link href={`/dashboard/campaigns/${campaign.id}`} className="mt-6 block">
                                    <Button variant="outline" className="w-full gap-2 group/btn">
                                        View Strategy
                                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Campaigns Yet</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Start grouping your AI assets into cohesive marketing strategies.
                    </p>
                    <Button
                        variant="premium"
                        className="mt-6"
                        onClick={() => document.querySelector("input")?.focus()}
                    >
                        Create Your First Campaign
                    </Button>
                </div>
            )}
        </div>
    );
}

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(" ");
}
