"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
    Loader2,
    Save,
    Settings2,
    SlidersHorizontal,
    ShieldCheck,
    BookOpen,
    Zap,
    Building2,
    Lock,
    Cpu,
    Target,
    Globe,
    History
} from "lucide-react";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Default configuration blueprint
    const [config, setConfig] = useState({
        priWeights: {
            academic: 40,
            core: 25,
            role: 15,
            aptitude: 10,
            enrichment: 10
        },
        riskThresholds: {
            critical: 40,
            moderate: 60,
            ready: 75
        },
        autoApproveFaculty: false,
        enableFacultyRegistration: true,
        enableAutoLogging: true,
        institutionName: "ALSA",
        academicYear: "2024-2025"
    });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const configDoc = await getDoc(doc(db, "systemConfig", "main"));
                if (configDoc.exists()) {
                    setConfig(configDoc.data() as any);
                }
            } catch (error) {
                console.error("Failed to fetch system config:", error);
                toast.error("Failed to load configuration.");
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, []);

    const handleChange = (category: string, field: string, value: any) => {
        if (category === "root") {
            setConfig(prev => ({ ...prev, [field]: value }));
        } else {
            setConfig(prev => ({
                ...prev,
                [category]: {
                    ...prev[category as keyof typeof prev] as object,
                    [field]: value
                }
            }));
        }
    };

    const handleSave = async () => {
        // Validate PRI Weights sum to 100
        const totalWeight = Object.values(config.priWeights).reduce((a, b) => Number(a) + Number(b), 0);
        if (totalWeight !== 100) {
            toast.error(`PRI weights must exactly equal 100%. Currently: ${totalWeight}%`);
            return;
        }

        // Validate descending thresholds
        if (Number(config.riskThresholds.ready) <= Number(config.riskThresholds.moderate) ||
            Number(config.riskThresholds.moderate) <= Number(config.riskThresholds.critical)) {
            toast.error("Logical sequence violation: Ready > Moderate > Critical.");
            return;
        }

        setSaving(true);
        try {
            await setDoc(doc(db, "systemConfig", "main"), config);
            toast.success("Institutional configuration committed.");
        } catch (error: any) {
            toast.error("Configuration commit failed.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initializing System Context...</p>
            </div>
        );
    }

    const currentTotalWeight = Object.values(config.priWeights).reduce((a, b) => Number(a) + Number(b), 0);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Premium Global Parameter Hero */}
            <div className="relative rounded-[48px] overflow-hidden bg-slate-950 border border-white/5 shadow-3xl group">
                {/* Visual Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

                <div className="relative z-10 p-12 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="max-w-3xl space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 backdrop-blur-md">
                            <Settings2 className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Global Configuration Protocol</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85]">
                                System <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">Settings</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                                Calibrating <span className="text-white font-bold">algorithmic weights</span> and operational boundaries to maintain institutional equilibrium and processing integrity.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-8 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Config Status</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-white">Live</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Commit</span>
                                <div className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-indigo-400" />
                                    <span className="text-sm font-bold text-slate-200">Synchronized</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-20 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] shadow-2xl shadow-indigo-600/30 font-black uppercase tracking-[0.2em] text-[12px] group relative overflow-hidden transition-all duration-500 hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                    Committing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                                    Commit Parameters
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* PRI Architecture */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
                            <Cpu className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">PRI Architecture</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Professional Readiness Index Weights</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {[
                            { label: "Academic Magnitude", key: "academic", color: "bg-blue-500" },
                            { label: "Core Competency Vector", key: "core", color: "bg-indigo-500" },
                            { label: "Professional Role Alignment", key: "role", color: "bg-purple-500" },
                            { label: "Aptitude Coverage", key: "aptitude", color: "bg-emerald-500" },
                            { label: "Enrichment Enrichment Activities", key: "enrichment", color: "bg-amber-500" }
                        ].map((weight, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${weight.color}`} />
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{weight.label}</Label>
                                    </div>
                                    <span className="text-[10px] font-black tabular-nums">{config.priWeights[weight.key as keyof typeof config.priWeights]}%</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={config.priWeights[weight.key as keyof typeof config.priWeights]}
                                        onChange={(e) => handleChange("priWeights", weight.key, Number(e.target.value))}
                                        className="flex-1 accent-indigo-600 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 appearance-none cursor-pointer"
                                    />
                                    <Input
                                        type="number"
                                        value={config.priWeights[weight.key as keyof typeof config.priWeights]}
                                        onChange={(e) => handleChange("priWeights", weight.key, Number(e.target.value))}
                                        className="w-16 h-9 rounded-xl border-slate-200 dark:border-slate-800 text-center font-bold text-[11px]"
                                    />
                                </div>
                            </div>
                        ))}

                        <div className={`mt-8 p-4 rounded-2xl flex items-center justify-between border ${currentTotalWeight === 100 ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-600' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-600'}`}>
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Spectral Allocation</span>
                            </div>
                            <span className="text-lg font-black tabular-nums">{currentTotalWeight}%</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    {/* Risk Boundaries */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center border border-rose-100 dark:border-rose-900/60">
                                <ShieldCheck className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Risk Boundaries</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Score Threshold Vectors</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {[
                                { label: "Placement Ready Magnitude", key: "ready", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200" },
                                { label: "Moderate Risk Ceiling", key: "moderate", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-200" },
                                { label: "Critical Risk Floor", key: "critical", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-200" }
                            ].map((row, i) => (
                                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${row.bg} ${row.border}`}>
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${row.color}`}>{row.label}</Label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Score</span>
                                        <Input
                                            type="number"
                                            value={config.riskThresholds[row.key as keyof typeof config.riskThresholds]}
                                            onChange={(e) => handleChange("riskThresholds", row.key, Number(e.target.value))}
                                            className="w-20 h-10 rounded-xl bg-white dark:bg-slate-900 border-none font-black text-center text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Operational Protocols */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">Protocols</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Automated System Behaviors</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {[
                                { title: "Auto-Approve Faculty", desc: "Bypass manual triage for new faculty signatures.", key: "autoApproveFaculty" },
                                { title: "Registration Master Switch", desc: "Allow or restrict new faculty registration.", key: "enableFacultyRegistration" },
                                { title: "Autonomous Trace Capture", desc: "Silent telemetry capture of frontend exceptions.", key: "enableAutoLogging" }
                            ].map((proto, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <Label className="text-[12px] font-black tracking-tight uppercase group-hover:text-blue-500 transition-colors">{proto.title}</Label>
                                        <p className="text-[10px] font-medium text-slate-400">{proto.desc}</p>
                                    </div>
                                    <Switch
                                        checked={config[proto.key as keyof typeof config] as boolean}
                                        onCheckedChange={(checked) => handleChange("root", proto.key, checked)}
                                        className="data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Institutional Identity */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Institutional Identity</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Global Branding & Academic Cycle</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Canonic Institution Name</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    value={config.institutionName || "ALSA"}
                                    onChange={(e) => handleChange("root", "institutionName", e.target.value)}
                                    className="h-14 pl-12 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-tighter"
                                    placeholder="Enter system name..."
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Academic Vector</Label>
                            <div className="relative group">
                                <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    value={config.academicYear}
                                    onChange={(e) => handleChange("root", "academicYear", e.target.value)}
                                    className="h-14 pl-12 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-tighter"
                                    placeholder="e.g. 2024-2025"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
