"use client";

import React, { useState } from "react";
import { BrandConstitution } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";

interface ConstitutionEditorProps {
    constitution: BrandConstitution;
    onSave: (updated: BrandConstitution) => Promise<void>;
}

export function ConstitutionEditor({ constitution, onSave }: ConstitutionEditorProps) {
    const [edited, setEdited] = useState<BrandConstitution>(JSON.parse(JSON.stringify(constitution)));
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(edited);
            toast.success("Brand Constitution updated successfully");
        } catch (error) {
            toast.error("Failed to update constitution");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const addListItem = (path: string[], newItem: string) => {
        if (!newItem.trim()) return;
        const updated = { ...edited };
        let current: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        const lastKey = path[path.length - 1];
        current[lastKey] = [...(current[lastKey] || []), newItem];
        setEdited(updated);
    };

    const removeListItem = (path: string[], index: number) => {
        const updated = { ...edited };
        let current: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        const lastKey = path[path.length - 1];
        current[lastKey] = current[lastKey].filter((_: any, i: number) => i !== index);
        setEdited(updated);
    };

    const updateField = (path: string[], value: string) => {
        const updated = { ...edited };
        let current: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        setEdited(updated);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Brand Constitution</h2>
                    <p className="text-slate-500 mt-1">Refine the AI-extracted DNA for perfect alignment.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="premium"
                    className="gap-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid gap-8">
                {/* Brand Essence */}
                <Card className="border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="text-lg">Brand Essence</CardTitle>
                        <CardDescription>The core "Vibe" and purpose of your brand.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <textarea
                            value={edited.brand_essence}
                            onChange={(e) => updateField(["brand_essence"], e.target.value)}
                            className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            placeholder="Describe your brand's core essence..."
                        />
                    </CardContent>
                </Card>

                {/* Visual Identity */}
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg">Visual Identity</CardTitle>
                            <CardDescription>Colors, fonts, and composition rules.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Colors */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Color Palette</label>
                                <div className="flex flex-wrap gap-2">
                                    {edited.visual_identity.color_palette_hex.map((color, i) => (
                                        <div key={i} className="group relative flex items-center gap-2 bg-slate-50 pl-2 pr-1 py-1 rounded-full border border-slate-100">
                                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
                                            <span className="text-xs font-mono text-slate-600">{color}</span>
                                            <button
                                                onClick={() => removeListItem(["visual_identity", "color_palette_hex"], i)}
                                                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 w-full mt-2">
                                        <Input
                                            placeholder="#HEX"
                                            className="h-8 text-xs border-dashed"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    addListItem(["visual_identity", "color_palette_hex"], e.currentTarget.value);
                                                    e.currentTarget.value = "";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Photography Style */}
                            <div className="space-y-3 pt-4">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Photography Style</label>
                                <Input
                                    value={edited.visual_identity.photography_style}
                                    onChange={(e) => updateField(["visual_identity", "photography_style"], e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg">Voice & Tone</CardTitle>
                            <CardDescription>How your brand communicates.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Tone */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Communication Tone</label>
                                <Input
                                    value={edited.voice.tone}
                                    onChange={(e) => updateField(["voice", "tone"], e.target.value)}
                                />
                            </div>

                            {/* Keywords */}
                            <div className="space-y-3 pt-4">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Key Vocabulary</label>
                                <div className="flex flex-wrap gap-2">
                                    {edited.voice.keywords.map((word, i) => (
                                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                                            {word}
                                            <button onClick={() => removeListItem(["voice", "keywords"], i)}>
                                                <X className="w-3 h-3 hover:text-indigo-900" />
                                            </button>
                                        </span>
                                    ))}
                                    <Input
                                        placeholder="Add keyword..."
                                        className="h-8 text-xs border-dashed"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                addListItem(["voice", "keywords"], e.currentTarget.value);
                                                e.currentTarget.value = "";
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rules & Constraints */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="text-lg">Rules & Constraints</CardTitle>
                        <CardDescription>Composition rules and forbidden elements.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">Composition Rules</label>
                            <ul className="space-y-2">
                                {edited.visual_identity.composition_rules.map((rule, i) => (
                                    <li key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg text-sm group">
                                        <span className="text-slate-600">{rule}</span>
                                        <button
                                            onClick={() => removeListItem(["visual_identity", "composition_rules"], i)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <Input
                                placeholder="Add composition rule..."
                                className="text-sm border-dashed"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        addListItem(["visual_identity", "composition_rules"], e.currentTarget.value);
                                        e.currentTarget.value = "";
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider block">Forbidden Elements</label>
                            <ul className="space-y-2">
                                {edited.visual_identity.forbidden_elements.map((item, i) => (
                                    <li key={i} className="flex items-center justify-between p-3 bg-red-50/30 border border-red-100 rounded-lg text-sm text-red-700 group">
                                        <span>{item}</span>
                                        <button
                                            onClick={() => removeListItem(["visual_identity", "forbidden_elements"], i)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <Input
                                placeholder="Add forbidden element..."
                                className="text-sm border-dashed"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        addListItem(["visual_identity", "forbidden_elements"], e.currentTarget.value);
                                        e.currentTarget.value = "";
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
