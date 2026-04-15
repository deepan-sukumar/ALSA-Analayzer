"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getPlacementReadiness } from "@/lib/calculations/placement-calculations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, CheckCircle2, Calendar, Map, ShieldAlert, Clock, Sparkles, BrainCircuit, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DevelopmentAnalyticsPage() {
    const { user } = useAuth();

    const analysis = useMemo(() => {
        if (!user) return null;
        return getPlacementReadiness(user);
    }, [user]);

    const [aiDrawbacks, setAiDrawbacks] = useState<{ drawback: string; suggestion: string }[]>([]);
    const [aiRoadmap, setAiRoadmap] = useState<{ week: string; priority: string; focus: string; tasks: string[] }[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const hasOutcomeAlignmentProgress = useMemo(() => {
        if (!user) return false;

        const selectedTrack = user.roleTrackProfile?.trackSelected || user.outcomeAlignment?.role?.trackSelected || user.outcomeAlignment?.trackSelected;
        const selectedCoreCount = Object.values(user.outcomeAlignment?.coreTopics || user.coreAcademicTopics || {}).reduce((sum: number, topics: any) => {
            return sum + (Array.isArray(topics) ? topics.length : 0);
        }, 0);
        const verifiedCoreCount = Object.values(user.verifiedCoreTopics || {}).reduce((sum: number, topics: any) => {
            return sum + (Array.isArray(topics) ? topics.length : 0);
        }, 0);
        const selectedRoleCount = ["core", "intermediate", "advanced"].reduce((sum, level) => {
            const topics = user.outcomeAlignment?.role?.concepts?.[level as "core" | "intermediate" | "advanced"];
            return sum + (Array.isArray(topics) ? topics.length : 0);
        }, 0);
        const verifiedRoleCount = ["core", "intermediate", "advanced"].reduce((sum, level) => {
            const topics = user.verifiedRoleConcepts?.[level as "core" | "intermediate" | "advanced"];
            return sum + (Array.isArray(topics) ? topics.length : 0);
        }, 0);
        const failedVerifications = Number(user.failedVerifications || 0);

        return Boolean(
            selectedTrack ||
            (
                selectedCoreCount > 0 ||
                verifiedCoreCount > 0 ||
                selectedRoleCount > 0 ||
                verifiedRoleCount > 0 ||
                failedVerifications > 0
            )
        );
    }, [user]);

    useEffect(() => {
        if (!user) {
            setAiDrawbacks([]);
            setAiRoadmap([]);
            setAiLoading(false);
            return;
        }
        let cancelled = false;
        const fetchAI = async () => {
            setAiLoading(true);
            try {
                const res = await fetch('/api/ai-recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store',
                    body: JSON.stringify({ student: user, context: 'outcome', requestedAt: Date.now() })
                });
                if (res.ok && !cancelled) {
                    const data = await res.json();
                    setAiDrawbacks(data.drawbacks || []);
                    setAiRoadmap(data.roadmap || []);
                }
            } catch (err) {
                console.error('AI recommendations fetch failed', err);
            } finally {
                if (!cancelled) setAiLoading(false);
            }
        };
        fetchAI();
        const handleFocus = () => {
            if (document.visibilityState === "visible") {
                fetchAI();
            }
        };
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleFocus);
        return () => {
            cancelled = true;
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleFocus);
        };
    }, [user]);

    const displayDrawbacks = useMemo(() => {
        if (aiDrawbacks.length > 0) return aiDrawbacks;

        const merged: { drawback: string; suggestion: string }[] = [];
        const addUnique = (item: { drawback: string; suggestion: string }) => {
            const key = String(item.drawback || "").trim().toLowerCase();
            if (!key) return;
            if (!merged.some((existing) => String(existing.drawback || "").trim().toLowerCase() === key)) {
                merged.push(item);
            }
        };

        (analysis?.performanceGaps || []).forEach((gap: any) => {
            addUnique({
                drawback: gap.problem || `${gap.domain} remains uncovered or unverified.`,
                suggestion: Array.isArray(gap.actionPlan) && gap.actionPlan.length > 0
                    ? gap.actionPlan.slice(0, 2).join(" ")
                    : `Prioritize ${gap.domain} and complete the remaining verification topics.`,
            });
        });

        (analysis?.strategy?.improvements || []).forEach((item: any) => {
            addUnique({
                drawback: item.area || "Outcome alignment gap",
                suggestion: item.solution || "Close the remaining uncovered concepts with structured revision and verification.",
            });
        });

        (analysis?.growthSuggestions || []).slice(0, 4).forEach((suggestion: string) => {
            addUnique({
                drawback: "Readiness growth opportunity",
                suggestion,
            });
        });

        return merged.slice(0, 12);
    }, [aiDrawbacks, analysis]);

    const displayRoadmap = useMemo(() => {
        if (aiRoadmap.length > 0) return aiRoadmap;

        const smartRoadmap = analysis?.smartRoadmap || [];
        if (smartRoadmap.length > 0) {
            return smartRoadmap.slice(0, 3).map((item: any) => ({
                week: item.week,
                priority: item.priority,
                focus: item.title || item.focus || "Outcome Recovery",
                tasks: Array.isArray(item.tasks) ? item.tasks : [],
            }));
        }

        const weeklyRoadmap = analysis?.weeklyRoadmap || [];
        if (weeklyRoadmap.length > 0) {
            return weeklyRoadmap.slice(0, 3).map((item: any, idx: number) => ({
                week: item.week || `Phase ${idx + 1}`,
                priority: idx === 0 ? "High" : "Moderate",
                focus: item.focus || "Outcome Recovery",
                tasks: Array.isArray(item.tasks) ? item.tasks : [],
            }));
        }

        const topGaps = (analysis?.performanceGaps || []).slice(0, 3);
        if (topGaps.length > 0) {
            return topGaps.map((gap: any, idx: number) => ({
                week: ["Week 1-2", "Week 3-4", "Week 5-6"][idx] || `Phase ${idx + 1}`,
                priority: gap.priority === "Critical" ? "Critical" : gap.riskLevel === "High" ? "High" : "Moderate",
                focus: gap.domain || "Outcome Alignment Improvement",
                tasks: Array.isArray(gap.actionPlan) && gap.actionPlan.length > 0
                    ? gap.actionPlan.slice(0, 3)
                    : [`Complete the remaining ${gap.domain} topics.`, "Attempt verification tests again."],
            }));
        }

        return [];
    }, [aiRoadmap, analysis]);

    if (!analysis) return null;

    const getRiskColor = (label: string) => {
        switch (label) {
            case "Critical": return "text-red-700 dark:text-red-400";
            case "High": return "text-red-600 dark:text-red-400";
            case "Moderate": return "text-yellow-600 dark:text-yellow-400";
            case "Low": return "text-blue-600 dark:text-blue-400";
            default: return "text-green-600 dark:text-green-400";
        }
    };

    const readinessLevel = analysis.finalRisk?.label || "Low";

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0c0a1f] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.4)] border border-indigo-500/20 group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.3),transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" />
                <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-950/50 px-3 py-1 text-xs font-bold tracking-widest uppercase text-indigo-300 border border-indigo-500/30 shadow-inner backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Student Intelligence Portal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 drop-shadow-sm">
                        Development Analytics
                    </h1>
                    <p className="text-indigo-200/70 font-medium text-sm md:text-base max-w-xl leading-relaxed">
                        Professional Readiness Index (PRI) & Competency Growth Tracking. AI-driven insights to accelerate your career trajectory.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white border-none shadow-[0_15px_40px_-10px_rgba(99,102,241,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 cursor-default">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100/80 drop-shadow-sm">Professional Readiness Index</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-baseline gap-2 mt-2">
                            <div className="text-7xl font-black tracking-tighter drop-shadow-lg">{analysis.pri}</div>
                            <div className="text-2xl font-bold text-indigo-200 mb-2">/ 100</div>
                        </div>
                        <p className="mt-3 text-indigo-100 text-xs font-bold uppercase tracking-wider bg-white/10 self-start inline-flex px-3 py-1 rounded-md backdrop-blur-sm border border-white/10">Official Placement Readiness Score</p>
                        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-3">
                            {user?.outcomeAlignment?.role?.trackSelected && (
                                <Badge variant="secondary" className="w-fit bg-white/20 text-white hover:bg-white/30 border border-white/20 backdrop-blur-md shadow-inner text-xs font-bold px-3 py-1">
                                    🎯 {user.outcomeAlignment.role.trackSelected}
                                </Badge>
                            )}
                            {analysis.recoveryIndex && (
                                <div className="flex items-center gap-2">
                                    <TrendingUp className={cn("h-4 w-4", analysis.recoveryIndex.trend === "declining" ? "text-rose-400 rotate-180" : analysis.recoveryIndex.trend === "stable" ? "text-blue-300 rotate-90" : "text-emerald-300")} />
                                    <span className="text-xs font-semibold text-indigo-100">{analysis.recoveryIndex.label}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-xl" />
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Industry Alignment</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className="flex flex-col gap-1">
                            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">{analysis.tier}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Tier Eligibility</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {analysis.eligibleFor.map((e, i) => (
                                <Badge key={i} variant="outline" className="bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm">
                                    {e}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className={cn("absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b rounded-l-xl", readinessLevel === "Critical" ? "from-red-500 to-red-700" : readinessLevel === "High" ? "from-red-400 to-red-600" : readinessLevel === "Moderate" ? "from-amber-400 to-amber-600" : readinessLevel === "Low" ? "from-blue-400 to-blue-600" : "from-emerald-400 to-emerald-600")} />
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Readiness Profile</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className={`text-4xl font-black ${getRiskColor(readinessLevel)} tracking-tight drop-shadow-sm`}>
                            {readinessLevel}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="text-slate-500 dark:text-slate-400">Arrears:</span>
                            <Badge variant={analysis.standingArrears > 0 ? "destructive" : "secondary"}>
                                {analysis.standingArrears === 0 ? "None" : analysis.standingArrears}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
                            &ldquo;{analysis.strategy.holisticView}&rdquo;
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex flex-col border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl group overflow-hidden relative">
                    <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            Performance Gaps
                        </CardTitle>
                        <CardDescription>AI-generated readiness drawbacks with personalized recovery guidance</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[500px] pr-4">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                                    <p className="text-xs font-medium text-slate-500">Analyzing readiness drawbacks...</p>
                                </div>
                            ) : displayDrawbacks.length > 0 ? (
                                displayDrawbacks.map((item, idx) => (
                                    <div key={idx} className="mb-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 shadow-sm">
                                        <div className="flex gap-3 border-b border-rose-200/50 dark:border-rose-800/50 pb-3">
                                            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Identified Gap</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">{item.drawback}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 rounded-xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-slate-950/30 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">AI Action Plan</p>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{item.suggestion}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                                    <p className="font-bold text-slate-800 dark:text-white">{hasOutcomeAlignmentProgress ? "No dynamic gaps are available right now." : "No outcome-alignment data available yet."}</p>
                                    <p className="text-sm text-slate-500">{hasOutcomeAlignmentProgress ? "AI and fallback analysis did not find a usable recommendation set for the current profile." : "Select outcome topics or attempt verification tests to generate AI-backed drawbacks and roadmap."}</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-700">
                            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white tracking-wide">Outcome Alignment Roadmap</h2>
                    </div>
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                    <p className="text-xs font-medium text-slate-500">Generating placement roadmap...</p>
                                </div>
                            ) : displayRoadmap.length > 0 ? (
                                displayRoadmap.map((week, idx) => (
                                    <PlanCard
                                        key={idx}
                                        time={week.week}
                                        desc={week.priority}
                                        title={week.focus}
                                        steps={week.tasks}
                                        icon={[Clock, Calendar, Target][idx % 3]}
                                        color={["blue", "emerald", "purple"][idx % 3]}
                                    />
                                ))
                            ) : (
                                <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500">{hasOutcomeAlignmentProgress ? "No dynamic roadmap is available right now." : "Outcome-alignment AI roadmap will appear here once progress is available."}</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <Card className="md:col-span-2 border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl group overflow-hidden relative">
                    <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                                <BrainCircuit className="h-4 w-4" />
                            </div>
                            Identified Drawbacks
                        </CardTitle>
                        <CardDescription>AI-generated profile weaknesses and improvement suggestions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {aiLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                            </div>
                        ) : displayDrawbacks.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {displayDrawbacks.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 flex flex-col gap-2">
                                        <div className="flex gap-2 items-start text-rose-600 dark:text-rose-400">
                                            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider">Weakness</span>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{item.drawback}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-start text-emerald-600 dark:text-emerald-400 pt-1 border-t border-amber-200/50">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider">Strategy</span>
                                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.suggestion}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 italic">{hasOutcomeAlignmentProgress ? "No dynamic drawbacks are available right now." : "AI suggestions will appear here from uncovered and unverified outcome-alignment topics."}</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PlanCard({ time, desc, title, steps, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
        emerald: "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
        purple: "border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20",
    };

    return (
        <Card className={cn("border-2 shadow-sm transition-all duration-300 group overflow-hidden relative", colorClasses[color])}>
            <CardContent className="p-4 relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm bg-white dark:bg-slate-900")}>{time}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{desc}</span>
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
                    </div>
                    <div className="p-2 rounded-xl border bg-white dark:bg-slate-900 shadow-sm">
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <div className="space-y-1.5 mt-4">
                    {steps.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-slate-400" />
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

