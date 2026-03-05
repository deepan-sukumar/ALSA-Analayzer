"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { getPlacementReadiness } from "@/lib/placement-calculations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Target, TrendingUp, CheckCircle2, BookOpen, Calendar, Map, Activity, ShieldAlert, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DevelopmentAnalyticsPage() {
    const { user } = useAuth();

    const analysis = useMemo(() => {
        if (!user) return null;
        return getPlacementReadiness(user);
    }, [user]);

    if (!analysis) return null;

    // Helper for risk color
    const getRiskColor = (label: string) => {
        switch (label) {
            case "High": return "text-red-600 dark:text-red-400";
            case "Moderate": return "text-yellow-600 dark:text-yellow-400";
            case "Ready": return "text-blue-600 dark:text-blue-400";
            default: return "text-green-600 dark:text-green-400";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0c0a1f] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.4)] border border-indigo-500/20 group">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.3),transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" />
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent group-hover:via-indigo-400/40 transition-colors duration-700" />
                <div className="absolute bottom-0 left-10 h-px w-1/2 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
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
            </div>

            {/* Top Stats */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* PRI Card */}
                <Card className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white border-none shadow-[0_15px_40px_-10px_rgba(99,102,241,0.5)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 cursor-default">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                    <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 blur-3xl rounded-full group-hover:bg-white/20 transition-all duration-500" />
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity group-hover:rotate-12 duration-500">
                        <Target className="w-24 h-24" />
                    </div>

                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100/80 drop-shadow-sm">Professional Readiness Index</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-baseline gap-2 mt-2">
                            <div className="text-7xl font-black tracking-tighter drop-shadow-lg">{analysis.pri}</div>
                            <div className="text-2xl font-bold text-indigo-200 mb-2">/ 100</div>
                        </div>
                        <p className="mt-3 text-indigo-100 text-xs font-bold uppercase tracking-wider bg-white/10 self-start inline-flex px-3 py-1 rounded-md backdrop-blur-sm border border-white/10">Official Placement Readiness Score</p>

                        {user?.outcomeAlignment?.role?.trackSelected && (
                            <div className="mt-6 pt-5 border-t border-white/10">
                                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border border-white/20 backdrop-blur-md shadow-inner text-xs font-bold px-3 py-1">
                                    🎯 {user.outcomeAlignment.role.trackSelected}
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Industry Alignment */}
                <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-xl" />
                    <div className="absolute -right-8 -bottom-8 bg-blue-50 dark:bg-blue-900/20 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Industry Alignment</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">{analysis.tier}</div>
                        <div className="flex flex-wrap gap-2">
                            {analysis.eligibleFor.slice(0, 3).map((e, i) => (
                                <Badge key={i} variant="outline" className="bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm">
                                    {e}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Readiness Profile */}
                <Card className={cn(
                    "border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1",
                    analysis.tier === "High" ? "shadow-red-500/10" : analysis.tier === "Moderate" ? "shadow-amber-500/10" : analysis.tier === "Ready" ? "shadow-blue-500/10" : "shadow-emerald-500/10"
                )}>
                    <div className={cn(
                        "absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b rounded-l-xl",
                        analysis.tier === "High" ? "from-red-400 to-red-600" : analysis.tier === "Moderate" ? "from-amber-400 to-amber-600" : analysis.tier === "Ready" ? "from-blue-400 to-blue-600" : "from-emerald-400 to-emerald-600"
                    )} />
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                                "p-1.5 rounded-lg",
                                analysis.tier === "High" ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400" : analysis.tier === "Moderate" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400" : analysis.tier === "Ready" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                            )}>
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Readiness Profile</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <div className={`text-4xl font-black ${getRiskColor(analysis.tier.split(' ')[0])} tracking-tight drop-shadow-sm`}>
                            {analysis.tier}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Arrears Active:</span>
                            <Badge variant={analysis.standingArrears > 0 ? "destructive" : "secondary"} className={cn("text-[10px] font-bold px-2 py-0.5", analysis.standingArrears === 0 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300")}>
                                {analysis.standingArrears === 0 ? "None" : analysis.standingArrears}
                            </Badge>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 dark:bg-slate-600 rounded-l-lg" />
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold italic pl-2">
                                &ldquo;{analysis.strategy.holisticView}&rdquo;
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Score Breakdown */}
                <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Activity className="h-4 w-4" />
                            </div>
                            Competency Breakdown
                        </CardTitle>
                        <CardDescription>Factors influencing your PRI calculation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Academic 40% */}
                        <div className="space-y-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Academic Score</span>
                                </div>
                                <span className="font-black text-blue-700 dark:text-blue-400">{analysis.academicScore} <span className="text-slate-400 text-xs font-semibold">/ 40</span></span>
                            </div>
                            <Progress value={(analysis.academicScore / 40) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-gradient-to-r from-blue-400 to-blue-600" />
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Normalized CGPA performance <span className="text-blue-500 dark:text-blue-400">(40% Weight)</span></p>
                        </div>

                        {/* Core Foundation 25% */}
                        <div className="space-y-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Core Subject Coverage</span>
                                </div>
                                <span className="font-black text-indigo-700 dark:text-indigo-400">{analysis.coreScore} <span className="text-slate-400 text-xs font-semibold">/ 25</span></span>
                            </div>
                            <Progress value={(analysis.coreScore / 25) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-gradient-to-r from-indigo-400 to-indigo-600" />
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department-specific mandatory domains <span className="text-indigo-500 dark:text-indigo-400">(25% Weight)</span></p>
                        </div>

                        {/* Role Score 15% */}
                        <div className="space-y-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Role & Skill Alignment</span>
                                </div>
                                <span className="font-black text-purple-700 dark:text-purple-400">{analysis.roleScore} <span className="text-slate-400 text-xs font-semibold">/ 15</span></span>
                            </div>
                            <Progress value={(analysis.roleScore / 15) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-gradient-to-r from-purple-400 to-purple-600" />
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Technical proficiency for selected track <span className="text-purple-500 dark:text-purple-400">(15% Weight)</span></p>
                        </div>

                        {/* Aptitude 10% */}
                        <div className="space-y-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Aptitude Coverage</span>
                                </div>
                                <span className="font-black text-rose-700 dark:text-rose-400">{analysis.aptitudeScore} <span className="text-slate-400 text-xs font-semibold">/ 10</span></span>
                            </div>
                            <Progress value={(analysis.aptitudeScore / 10) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-gradient-to-r from-rose-400 to-rose-600" />
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quant, Logical & Verbal topics <span className="text-rose-500 dark:text-rose-400">(10% Weight)</span></p>
                        </div>

                        {/* Enrichment 10% */}
                        <div className="space-y-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Academic Enrichment</span>
                                </div>
                                <span className="font-black text-amber-700 dark:text-amber-400">{analysis.enrichmentScore} <span className="text-slate-400 text-xs font-semibold">/ 10</span></span>
                            </div>
                            <Progress value={(analysis.enrichmentScore / 10) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-gradient-to-r from-amber-400 to-amber-600" />
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Certs, Workshops, Internships <span className="text-amber-500 dark:text-amber-400">(10% Weight)</span></p>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Gaps & Smart Roadmap */}
                <Card className="flex flex-col border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl group overflow-hidden relative">
                    <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                    Performance Gaps
                                </CardTitle>
                                <CardDescription>Data-driven gap detection with personalized recovery plan</CardDescription>
                            </div>
                            {analysis.recoveryIndex && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 border-none shadow-sm",
                                        analysis.recoveryIndex.trend === "improving" ? "bg-emerald-100 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-900/50" :
                                            analysis.recoveryIndex.trend === "declining" ? "bg-red-100 text-red-700 dark:text-red-400 dark:bg-red-900/50" :
                                                "bg-slate-100 text-slate-700 dark:text-slate-300 dark:bg-slate-800"
                                    )}
                                >
                                    {analysis.recoveryIndex.trend === "improving" ? "📈" : analysis.recoveryIndex.trend === "declining" ? "📉" : "➡️"}{" "}
                                    {analysis.recoveryIndex.label}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <ScrollArea className="h-[450px] pr-4">
                            {analysis.performanceGaps && analysis.performanceGaps.length > 0 ? (
                                analysis.performanceGaps.map((gap, idx) => {
                                    const riskColor = gap.riskLevel === "High" ? "red" : gap.riskLevel === "Moderate" ? "amber" : "blue";
                                    const riskBg = riskColor === "red" ? "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" : riskColor === "amber" ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" : "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50";
                                    const riskText = riskColor === "red" ? "text-red-700 dark:text-red-400" : riskColor === "amber" ? "text-amber-700 dark:text-amber-400" : "text-blue-700 dark:text-blue-400";
                                    const riskBadgeColor = riskColor === "red" ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" : riskColor === "amber" ? "bg-amber-100 text-amber-800 dark:text-amber-900/50 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:text-blue-900/50 dark:text-blue-300";

                                    return (
                                        <Alert key={idx} className={cn("mb-4 border-l-4 transition-all hover:shadow-md relative overflow-hidden group/alert", riskBg, `border-l-${riskColor}-500`)}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover/alert:opacity-100 transition-opacity duration-300" />
                                            <ShieldAlert className={cn("h-4 w-4 mt-0.5", riskText)} />
                                            <AlertTitle className={cn("font-black flex flex-wrap items-center justify-between gap-2", riskText)}>
                                                <span>{gap.domain} — {gap.coverage}% Coverage</span>
                                                <Badge className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-none", riskBadgeColor)}>
                                                    {gap.riskLevel} Risk • {gap.priority}
                                                </Badge>
                                            </AlertTitle>
                                            <AlertDescription className="mt-4 space-y-3 relative z-10">
                                                <div className="flex items-start gap-2 hidden group-hover/alert:flex">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 w-16 shrink-0 mt-0.5">Problem</span>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{gap.problem}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 dark:text-rose-400 w-16 shrink-0 mt-0.5">Impact</span>
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{gap.impact}</span>
                                                </div>
                                                {gap.missingTopics.length > 0 && (
                                                    <div className="flex items-start gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 dark:text-indigo-400 w-16 shrink-0 mt-0.5">Missing</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {gap.missingTopics.slice(0, 4).map((t, i) => (
                                                                <span key={i} className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300">{t}</span>
                                                            ))}
                                                            {gap.missingTopics.length > 4 && <span className="text-[10px] font-bold text-slate-500">+{gap.missingTopics.length - 4} more</span>}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-2 bg-white/50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-black/5 dark:border-white/5 mt-2">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400 w-16 shrink-0 mt-0.5">Action</span>
                                                    <ul className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
                                                        {gap.actionPlan.map((a, i) => <li key={i} className="flex items-start gap-1.5"><div className="mt-1 h-1 w-1 bg-emerald-500 rounded-full shrink-0" />{a}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Timeline: {gap.timeline}</span>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    );
                                })
                            ) : (
                                <Alert className="border-l-4 border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    <AlertTitle className="text-emerald-800 dark:text-emerald-300 font-black tracking-tight text-base mb-1">All Components On Track!</AlertTitle>
                                    <AlertDescription className="text-emerald-700 dark:text-emerald-400/80 font-medium">
                                        No significant gaps detected. Continue building advanced skills for premium placement readiness.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* PRIORITY DEVELOPMENT AREAS & SMART ROADMAP */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Priority Development Areas */}
                <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <CardTitle>Priority Development Areas</CardTitle>
                        </div>
                        <CardDescription>Risk-based gap prioritization with exact missing components.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analysis.performanceGaps && analysis.performanceGaps.length > 0 ? (
                            <ScrollArea className="h-[350px] pr-4">
                                <Accordion type="single" collapsible className="w-full space-y-3">
                                    {analysis.performanceGaps.map((gap, idx) => {
                                        const badgeColor = gap.riskLevel === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : gap.riskLevel === "Moderate" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
                                        const progressColor = gap.riskLevel === "High" ? "bg-red-500 dark:bg-red-600" : gap.riskLevel === "Moderate" ? "bg-amber-500 dark:bg-amber-600" : "bg-blue-500 dark:bg-blue-600";

                                        return (
                                            <AccordionItem key={idx} value={`gap-${idx}`} className="border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 rounded-xl px-4 py-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                                                <AccordionTrigger className="text-sm font-bold hover:no-underline py-3">
                                                    <div className="flex items-center gap-3 flex-1 text-left">
                                                        <span className="text-slate-800 dark:text-slate-200">{gap.domain}</span>
                                                        <Badge className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-none", badgeColor)}>{gap.riskLevel}</Badge>
                                                        <span className="text-slate-400 dark:text-slate-500 text-[11px] font-black ml-auto mr-2">{gap.coverage}% covered</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-4 pt-2 pb-4">
                                                    <div className="mb-4">
                                                        <Progress value={gap.coverage} className="h-1.5 bg-slate-100 dark:bg-slate-800" indicatorClassName={progressColor} />
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{gap.problem}</p>
                                                    </div>
                                                    {gap.missingTopics.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Missing Topics</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {gap.missingTopics.map(t => (
                                                                    <span key={t} className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300">{t}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Target Completion: {gap.timeline}</span>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 dark:text-slate-400">
                                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                                <p className="font-bold">All Development Areas On Track!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Smart Recovery Roadmap */}
                <Card className="bg-gradient-to-br from-[#0c0a1f] to-indigo-950 text-white border-transparent shadow-[0_20px_50px_-15px_rgba(79,70,229,0.3)] overflow-hidden relative group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                        <Map className="w-64 h-64 mix-blend-overlay" />
                    </div>

                    <CardHeader className="relative z-10 border-b border-indigo-500/10 pb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/20">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-white">Smart Recovery Roadmap</CardTitle>
                        </div>
                        <CardDescription className="text-indigo-200/70">Personalized 6-week plan driven by your weakest areas.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-6">
                        <ScrollArea className="h-[326px] pr-4">
                            <div className="space-y-0 text-sm">
                                {analysis.smartRoadmap?.map((week, idx) => {
                                    const getIcon = (i: number) => {
                                        if (i === 0) return <BookOpen className="w-3.5 h-3.5 text-rose-400" />;
                                        if (i === 1) return <Map className="w-3.5 h-3.5 text-amber-400" />;
                                        if (i === 2) return <TrendingUp className="w-3.5 h-3.5 text-purple-400" />;
                                        return <Target className="w-3.5 h-3.5 text-emerald-400" />;
                                    };

                                    const priorityColor = week.priority === "Critical" ? "border-rose-500/30 text-rose-300 bg-rose-500/10" : week.priority === "High" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" : "border-emerald-500/30 text-emerald-300 bg-emerald-500/10";
                                    const borderColor = week.priority === "Critical" ? "hover:border-rose-500/50" : week.priority === "High" ? "hover:border-amber-500/50" : "hover:border-emerald-500/50";

                                    return (
                                        <div key={idx} className="relative pl-8 pb-8 last:pb-0 group/timeline">
                                            {idx !== (analysis.smartRoadmap?.length || 0) - 1 && (
                                                <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-indigo-900/50 group-hover/timeline:bg-indigo-500/50 transition-colors" />
                                            )}

                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-slate-950 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.2)] group-hover/timeline:scale-110 group-hover/timeline:border-indigo-400 transition-all duration-300">
                                                {getIcon(idx)}
                                            </div>

                                            <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5 transition-all hover:shadow-lg hover:-translate-y-0.5", borderColor)}>
                                                <h4 className="font-bold text-white text-sm mb-1.5 flex flex-wrap items-center justify-between gap-2">
                                                    <span>Week {week.week}: {week.title}</span>
                                                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5", priorityColor)}>{week.priority}</Badge>
                                                </h4>
                                                <p className="text-xs font-medium text-indigo-300 mb-4 pb-3 border-b border-white/5"><span className="text-indigo-400/50 uppercase tracking-widest text-[9px] font-black mr-2">Focus</span>{week.focus}</p>
                                                <ul className="space-y-2.5">
                                                    {week.tasks.map((task, tIdx) => (
                                                        <li key={tIdx} className="text-indigo-100/80 flex items-start gap-3 group/item text-xs font-medium">
                                                            <div className="mt-1 h-3 w-3 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shrink-0 group-hover/item:bg-indigo-500/40 group-hover/item:border-indigo-400 transition-colors">
                                                                <div className="h-1 w-1 bg-indigo-300 rounded-full" />
                                                            </div>
                                                            <span className="leading-snug pt-0.5">{task}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
