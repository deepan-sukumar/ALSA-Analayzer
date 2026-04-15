"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ResponsiveContainer, Tooltip as RechartsTooltip,
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
    Activity, Award, BookOpen, Briefcase, Medal, Trophy,
    Sparkles, TrendingUp, Zap, Target, AlertTriangle, GraduationCap,
    Lightbulb, UserCheck, Flame, ChevronRight, CheckCircle2, Clock, Calendar,
    ShieldCheck, ArrowUpRight, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculatePRI, getPlacementReadiness } from "@/lib/calculations/placement-calculations";
import { calculateEnrichmentScore, calculateEngagementScore } from "@/lib/calculations/academic-calculations";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function StudentDashboard() {
    const { user } = useAuth();

    // AI Recommendations State
    const [aiDrawbacks, setAiDrawbacks] = useState<any[]>([]);
    const [aiRoadmap, setAiRoadmap] = useState<any[]>([]);
    const [aiLoading, setAiLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        const fetchAI = async () => {
            setAiLoading(true);
            try {
                const res = await fetch('/api/ai-recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store',
                    body: JSON.stringify({ student: user, context: 'overall', requestedAt: Date.now() })
                });
                if (res.ok && !cancelled) {
                    const data = await res.json();
                    setAiDrawbacks(data.drawbacks || []);
                    setAiRoadmap(data.roadmap || []);
                }
            } catch (err) {
                console.error('AI fetch failed', err);
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

    // --- PRI Calculations ---
    const priData = useMemo(() => {
        if (!user) return null;
        return calculatePRI(user);
    }, [user]);

    const readiness = useMemo(() => {
        if (!user) return null;
        return getPlacementReadiness(user);
    }, [user]);

    const firstName = user ? user.name.split(" ")[0] : "Student";
    const priValue = priData?.pri || 0;
    const riskLevel = readiness?.finalRisk?.label || "Low";
    const recoveryLabel = readiness?.recoveryIndex?.label || "Academic Trajectory";
    const recoveryValue = recoveryLabel === "Insufficient Data"
        ? "Insufficient Data"
        : readiness?.recoveryIndex?.trend === "improving"
            ? "Up"
            : readiness?.recoveryIndex?.trend === "declining"
                ? "Down"
                : "Stable";

    const getRiskStyles = (level: string) => {
        switch (level) {
            case "Critical": return { text: "text-red-600 dark:text-red-400", bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" };
            case "High": return { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500" };
            case "Moderate": return { text: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-500" };
            default: return { text: "text-green-600 dark:text-green-400", bg: "bg-green-50", border: "border-green-200", icon: "text-green-500" };
        }
    };

    const riskStyles = getRiskStyles(riskLevel);

    const hasAcademicData = (user?.cgpa && Number(user.cgpa) > 0) || (user?.academicRecords && user.academicRecords.length > 0) || user?.areGradesComplete;
    const hasPlacementData = user?.coreAcademicTopics || user?.roleTrackProfile || user?.outcomeAlignment || user?.placementMetrics;
    const showAnalytics = hasAcademicData && hasPlacementData;

    // --- Chart Data ---
    const radarData = useMemo(() => {
        if (!priData || !user) return [];
        const { breakDown } = priData;

        return [
            { subject: "Academic", A: breakDown.academicNormalized, fullMark: 100 },
            { subject: "Technical", A: breakDown.roleNormalized, fullMark: 100 },
            { subject: "Core Coverage", A: breakDown.coreNormalized, fullMark: 100 },
            { subject: "Aptitude", A: breakDown.aptitudeNormalized, fullMark: 100 },
            { subject: "Enrichment", A: breakDown.enrichmentNormalized, fullMark: 100 },
            { subject: "Consistency", A: breakDown.riskFactor, fullMark: 100 },
        ];
    }, [priData, user]);

    const pieData = [
        { name: "Academic", value: 40, color: "#3b82f6" },
        { name: "Core", value: 25, color: "#10b981" },
        { name: "Role", value: 15, color: "#f59e0b" },
        { name: "Aptitude", value: 10, color: "#8b5cf6" },
        { name: "Enrichment", value: 10, color: "#ec4899" },
    ];

    const barData = useMemo(() => {
        if (!priData) return [];
        const { breakDown } = priData;
        return [
            {
                name: "Modules",
                Academic: breakDown.academic,
                Core: breakDown.core,
                Role: breakDown.role,
                Enrichment: breakDown.enrichment,
                Aptitude: breakDown.aptitude
            }
        ];
    }, [priData]);

    const growthData = useMemo(() => {
        if (!user?.academicRecords || user.academicRecords.length === 0) {
            return [];
        }
        return user.academicRecords.map(rec => ({
            name: `Sem ${rec.semester}`,
            score: parseFloat((rec.sgpa * 10).toFixed(1))
        }));
    }, [user?.academicRecords]);

    const displayRoadmap = useMemo(() => {
        if (aiRoadmap.length > 0) return aiRoadmap;

        const smartRoadmap = readiness?.smartRoadmap || [];
        if (smartRoadmap.length > 0) {
            return smartRoadmap.map((item: any) => ({
                week: item.week,
                priority: item.priority,
                focus: item.title || item.focus,
                tasks: item.tasks || [],
            }));
        }

        const weeklyRoadmap = readiness?.weeklyRoadmap || [];
        if (weeklyRoadmap.length > 0) {
            return weeklyRoadmap.map((item: any, idx: number) => ({
                week: item.week || `Phase ${idx + 1}`,
                priority: idx === 0 ? "High" : "Moderate",
                focus: "Strategic Improvement",
                tasks: item.tasks || [],
            }));
        }

        return [];
    }, [aiRoadmap, readiness]);

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

        const gaps = readiness?.performanceGaps || [];
        gaps.forEach((gap: any) => {
            addUnique({
                drawback: gap.problem || `${gap.domain} needs attention.`,
                suggestion: Array.isArray(gap.actionPlan) && gap.actionPlan.length > 0
                    ? gap.actionPlan.slice(0, 2).join(" ")
                    : "Review this area and improve coverage steadily.",
            });
        });

        const improvements = readiness?.strategy?.improvements || [];
        improvements.forEach((item: any) => {
            addUnique({
                drawback: item.area,
                suggestion: item.solution,
            });
        });

        (readiness?.growthSuggestions || []).slice(0, 4).forEach((suggestion: string) => {
            addUnique({
                drawback: "Growth Opportunity",
                suggestion,
            });
        });

        return merged.slice(0, 14);
    }, [aiDrawbacks, readiness]);

    // --- Tier Eligibility ---
    const tier = readiness?.tier || "Service Based";

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* 1. Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 dark:from-indigo-900 dark:via-purple-900 dark:to-slate-900 p-8 md:p-10 text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(30,27,75,0.8)] group">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/10 to-transparent blur-3xl group-hover:from-white/20 transition-all duration-1000" />
                <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
                <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="space-y-5 max-w-[calc(100%-12rem)]">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 dark:bg-slate-900/40 px-4 py-1.5 text-xs font-bold tracking-wide backdrop-blur-md border border-white/30 text-white shadow-inner">
                            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                            <span>Professional Development Active</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 drop-shadow-sm pb-2 leading-tight">Prime Progress, {firstName}</h1>
                        <div className="text-white/90 max-w-xl text-lg leading-relaxed space-y-2 pb-1">
                            <p>Your <span className="text-white font-black tracking-wide drop-shadow-md">Professional Readiness Index (PRI)</span> is currently <span className="text-amber-300 font-extrabold text-xl px-1 drop-shadow-md">{priValue}%</span></p>
                            <p className="text-sm">Target tier: <span className="bg-white/20 dark:bg-indigo-900/60 text-white px-2.5 py-1 rounded-md font-bold backdrop-blur-sm border border-white/20">{tier}</span></p>
                        </div>
                        <div className="flex flex-wrap items-center gap-5 pt-3">
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-32 bg-white/20 dark:bg-slate-900/40 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)]" style={{ width: `${priValue}%` }} />
                                </div>
                                <span className="text-sm text-white font-bold tracking-wide">{priValue}% Readiness</span>
                            </div>
                            <div className="hidden md:block w-px h-5 bg-white/30 dark:bg-slate-900/50" />
                            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 dark:from-emerald-900/60 dark:to-teal-900/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
                                <Activity className="h-4 w-4 text-emerald-100" />
                                <span className="text-sm font-black text-white">{riskLevel} Risk Profile</span>
                            </div>
                        </div>
                    </div>

                    {/* Circular PRI Display */}
                    <div className="relative group/circle shrink-0">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-300 rounded-full blur-xl opacity-40 group-hover/circle:opacity-70 group-hover/circle:blur-2xl transition duration-700 animate-spin-slow" />
                        <div className="relative flex h-36 w-36 md:h-44 md:w-44 items-center justify-center rounded-full bg-white dark:bg-slate-900/30 border-[6px] border-white/30 shadow-2xl group-hover/circle:border-amber-400 group-hover/circle:scale-105 transition-all duration-500 backdrop-blur-xl">
                            <div className="text-center transform group-hover/circle:-translate-y-1 transition-transform">
                                <span className="text-5xl md:text-6xl font-black text-indigo-900 dark:text-white drop-shadow-md">{priValue}</span>
                                <span className="block text-xs uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300 mt-1 font-black">PRI Score</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Professional Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Cumulative GPA"
                    value={user?.cgpa || "0.0"}
                    sub={`Base Score: ${priData?.breakDown.academic}%`}
                    icon={Award}
                    color="blue"
                />
                <StatCard
                    title="Readiness Status"
                    value={riskLevel}
                    sub={`Unified risk score: ${readiness?.finalRisk?.index || 0}`}
                    icon={Activity}
                    color={riskLevel === "Low" ? "emerald" : riskLevel === "Moderate" ? "yellow" : "orange"}
                    isRisk
                />
                <StatCard
                    title="Tier Eligibility"
                    value={readiness?.tier || "Normal"}
                    sub={readiness?.eligibleFor?.[0] || "Placement tier pending"}
                    icon={Briefcase}
                    color="purple"
                    isLarge
                />
                <StatCard
                    title="Recovery Trend"
                    value={recoveryValue}
                    sub={recoveryLabel}
                    icon={TrendingUp}
                    color="pink"
                />
            </div>

            {!showAnalytics ? (
                <Card className="border-2 border-slate-900 dark:border-slate-100 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all mt-8 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                    <CardContent className="flex flex-col items-center justify-center p-14 text-center space-y-7 relative z-10">
                        <div className="p-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <div className="space-y-3 max-w-lg">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Analytics Engine Standby</h3>
                            <p className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                We need a bit more information to generate your personalized Readiness Index and Strategic Roadmap.
                                Complete your profiles below to unlock deep insights.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                            {!hasAcademicData && (
                                <Link href="/dashboard/student/academic-records/setup" className="inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 h-12 px-8 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                    <BookOpen className="h-4 w-4 mr-2.5" /> Setup Academic Records
                                </Link>
                            )}
                            {!hasPlacementData && (
                                <Link href="/dashboard/student/placement/update" className="inline-flex items-center justify-center rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-slate-900 dark:border-white bg-transparent hover:bg-slate-50 text-slate-900 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-white h-12 px-8 hover:-translate-y-0.5">
                                    <Target className="h-4 w-4 mr-2.5" /> Setup Outcome Alignment
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* 3. Deep Analytics Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* 3.1 Outcome Profile (Radar) */}
                        <Card className="lg:col-span-4 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-500 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden group/card relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                            <CardHeader className="pb-0 relative z-10">
                                <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                        <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    Professional Fit
                                </CardTitle>
                                <CardDescription className="font-medium text-slate-500 dark:text-slate-400">Strength distribution across core domains</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 relative z-10">
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                                            <PolarGrid stroke="#000000" strokeOpacity={0.2} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#000000", fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Readiness"
                                                dataKey="A"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fill="#10b981"
                                                fillOpacity={0.4}
                                            />
                                            <RechartsTooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', background: 'rgba(15, 23, 42, 0.95)', color: '#fff', backdropFilter: 'blur(10px)' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Compact domain scores — fills bottom gap */}
                                <div className="px-5 pb-5 space-y-2.5">
                                    {radarData.map((d, i) => {
                                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-cyan-500", "bg-violet-500", "bg-pink-500", "bg-amber-500"];
                                        const glowColors = ["shadow-blue-500/50", "shadow-emerald-500/50", "shadow-cyan-500/50", "shadow-violet-500/50", "shadow-pink-500/50", "shadow-amber-500/50"];
                                        return (
                                            <div key={i} className="flex items-center gap-3 group/bar">
                                                <span className="text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase w-20 shrink-0 truncate group-hover/bar:text-slate-800 dark:group-hover/bar:text-slate-200 transition-colors">{d.subject}</span>
                                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                                                    <div className={cn("h-full rounded-full transition-all duration-1000", colors[i % colors.length], "group-hover/bar:shadow-[0_0_10px_rgba(0,0,0,0.5)]", glowColors[i % colors.length])} style={{ width: `${d.A}%` }} />
                                                </div>
                                                <span className={cn("text-[11px] font-black w-8 text-right drop-shadow-sm", d.A >= 70 ? "text-emerald-600 dark:text-emerald-400" : d.A >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>{Math.round(d.A)}%</span>
                                            </div>
                                        );
                                    })}
                                    {(() => {
                                        const avg = radarData.length > 0 ? Math.round(radarData.reduce((s, d) => s + d.A, 0) / radarData.length) : 0;
                                        const enrichVal = radarData.find(d => d.subject === "Enrichment")?.A || 0;
                                        return (
                                            <>
                                                <div className="flex justify-between pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                                                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Overall Balance</span>
                                                    <span className="text-[12px] font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{avg}%</span>
                                                </div>
                                                {enrichVal < 30 && (
                                                    <div className="px-3 py-2 mt-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 shadow-sm animate-pulse-slow">
                                                        <p className="text-[10px] font-black tracking-wide text-red-600 dark:text-red-400">⚠ Enrichment critically low ({enrichVal}%)</p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3.2 Weightage & Breakdown (Pie + Bar) */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-950 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                                    <CardTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white">PRI Weightage</CardTitle>
                                    <CardDescription className="font-medium text-slate-500 dark:text-slate-400 mt-1">How your score is calculated</CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} className="text-slate-700 dark:text-slate-300" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-950 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                                    <CardTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Module Contribution (Weighted)</CardTitle>
                                    <CardDescription className="font-medium text-slate-500 dark:text-slate-400 mt-1">Professional Readiness Index breakdown</CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#000000" strokeOpacity={0.2} />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" hide />
                                                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                                <Bar dataKey="Academic" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                <Bar dataKey="Core" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                                <Bar dataKey="Role" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                                <Bar dataKey="Enrichment" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                                                <Bar dataKey="Aptitude" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400 mt-3 font-bold">
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm bg-blue-500" /> Academic (40%)</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm bg-emerald-500" /> Core (25%)</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm bg-amber-500" /> Role (15%)</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm bg-violet-500" /> Aptitude (10%)</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded shadow-sm bg-pink-500" /> Enrich (10%)</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3.3 Line Chart */}
                            <Card className="md:col-span-2 border border-indigo-100 dark:border-indigo-900/50 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-white to-white dark:from-slate-950 dark:to-slate-950 backdrop-blur-md group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-700 pointer-events-none" />
                                <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                                    <CardTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white">Academic Consistency</CardTitle>
                                    <CardDescription className="font-medium text-slate-600 dark:text-slate-400 mt-1">Score trajectory across semesters</CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    {growthData.length > 0 ? (
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={growthData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeOpacity={0.2} />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                                        tickLine={{ stroke: "#000000" }}
                                                        tick={{ fontSize: 12, fill: "#000000", fontWeight: 600 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                        axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                                        tickLine={{ stroke: "#000000" }}
                                                        tick={{ fontSize: 12, fill: "#000000", fontWeight: 600 }}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="#7c3aed"
                                                        strokeWidth={4}
                                                        dot={{ r: 6, fill: "#7c3aed", strokeWidth: 3, stroke: "#fff" }}
                                                        activeDot={{ r: 8, strokeWidth: 4 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                            Add semester records to unlock the academic consistency chart.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 4. Unified Readiness & Risk Analysis */}
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl shadow-md shadow-rose-500/20">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Readiness &amp; Risk Analysis</h2>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live intelligence engine output</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* LEFT COLUMN */}
                            <div className="space-y-5">

                                {/* Unified Risk Score — Gradient Hero card */}
                                {readiness?.unifiedRisk && (
                                    <Card className={cn("border-none shadow-xl overflow-hidden relative group",
                                        readiness.unifiedRisk.level === "Critical" ? "bg-gradient-to-br from-red-600 via-rose-600 to-red-700" :
                                            readiness.unifiedRisk.level === "High" ? "bg-gradient-to-br from-orange-500 via-orange-600 to-red-500" :
                                                readiness.unifiedRisk.level === "Moderate" ? "bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500" :
                                                    "bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600"
                                    )}>
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                                        <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                        <CardContent className="p-6 relative z-10 text-white">
                                            <div className="flex items-start justify-between mb-5">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Unified Risk Index</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-5xl font-black tracking-tight">{readiness.unifiedRisk.score}</span>
                                                        <span className="text-lg font-bold text-white/60">/ 100</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 shadow-inner">
                                                    {readiness.unifiedRisk.level}
                                                </span>
                                            </div>
                                            <div className="space-y-3 mt-2">
                                                {Object.entries(readiness.unifiedRisk.breakdown).map(([key, val]) => (
                                                    <div key={key} className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest w-20 shrink-0">
                                                            {key === "skillGap" ? "Skill Gap" : key.charAt(0).toUpperCase() + key.slice(1)}
                                                        </span>
                                                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden shadow-inner">
                                                            <div className="h-full bg-white rounded-full transition-all duration-700"
                                                                style={{ width: `${Math.min(100, (val as number) * 4)}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-white/80 w-5 text-right">{val as number}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Industry Exposure */}
                                {readiness?.enrichmentBreakdown && (
                                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative group">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
                                        <CardContent className="p-5 pl-6 relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Industry Exposure</p>
                                                    <p className="text-lg font-black text-slate-800 dark:text-white">Enrichment Profile</p>
                                                </div>
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-2 shadow-sm",
                                                    readiness.enrichmentBreakdown.risk === "HIGH" ? "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800" :
                                                        readiness.enrichmentBreakdown.risk === "MEDIUM" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                                                            "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                )}>{readiness.enrichmentBreakdown.risk} Risk</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {["Certification", "Workshop", "Internship", "Competition"].map(cat => {
                                                    const isCovered = readiness.enrichmentBreakdown!.covered.includes(cat);
                                                    return (
                                                        <div key={cat} className={cn(
                                                            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all duration-200 border-2",
                                                            isCovered
                                                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:shadow-md hover:shadow-emerald-500/10"
                                                                : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                                        )}>
                                                            {isCovered
                                                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                                                : <AlertTriangle className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />}
                                                            {cat}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {readiness.enrichmentBreakdown.missing.length > 0 && (
                                                <div className="mt-4 p-3 rounded-xl bg-slate-900 dark:bg-white/10 border border-slate-800 dark:border-white/10">
                                                    <p className="text-[11px] font-black text-white dark:text-slate-200 leading-relaxed">
                                                        <span className="text-amber-400 dark:text-amber-300 uppercase tracking-widest mr-2 text-[10px]">Missing:</span>
                                                        {readiness.enrichmentBreakdown.missing.join(", ")}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Critical Insight */}
                                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative group">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-violet-500 to-purple-600" />
                                    <CardContent className="p-5 pl-6 relative z-10">
                                        <div className="flex items-center gap-2.5 mb-4">
                                            <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg border border-violet-200 dark:border-violet-800">
                                                <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Intelligence Engine</p>
                                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">Critical Priority</p>
                                            </div>
                                        </div>
                                        <blockquote className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed pl-4 border-l-4 border-violet-400 dark:border-violet-600 italic">
                                            &ldquo;{readiness?.performanceGaps?.[0]?.problem || readiness?.strategy.improvements?.[0]?.solution || "Continue maintaining your current trajectory. You are performing above the expected benchmark for product-ready tiers."}&rdquo;
                                        </blockquote>
                                    </CardContent>
                                </Card>

                            </div>

                            {/* 4.2 Dynamic Roadmap from Smart Engine */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                        <Flame className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white tracking-wide">Smart Recovery Roadmap</h2>
                                </div>

                                <div className="space-y-3">
                                    {aiLoading ? (
                                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                            <p className="text-xs font-medium text-slate-500">Generating strategic roadmap...</p>
                                        </div>
                                    ) : displayRoadmap.length > 0 ? (
                                        displayRoadmap.slice(0, 6).map((week: any, idx: number) => {
                                            const colors = ["blue", "emerald", "purple", "blue", "emerald", "purple"];
                                            const icons = [Clock, Calendar, Target, Clock, Calendar, CheckCircle2];
                                            const Ic = icons[idx % 6];
                                            return (
                                                <PlanCard
                                                    key={idx}
                                                    time={week.week}
                                                    desc={week.priority || "Focus"}
                                                    title={week.title || week.focus}
                                                    steps={week.tasks?.slice(0, 3) || []}
                                                    icon={Ic}
                                                    color={colors[idx % 6]}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 text-sm text-slate-500 italic border rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            No roadmap needed! Your profile is strong.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Performance Gaps & Development Priorities — ALWAYS VISIBLE */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-100 dark:bg-amber-950/30 rounded-xl">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">Performance Gaps & Development Priorities</h2>
                        </div>

                        {aiLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                                <p className="text-sm font-medium text-slate-500">Analyzing your profile data for gaps...</p>
                            </div>
                        ) : displayDrawbacks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {displayDrawbacks.map((item: any, idx: number) => {
                                    return (
                                        <div key={idx} className="p-5 rounded-2xl border-2 space-y-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group/gap bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800/80">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover/gap:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 dark:bg-amber-600 opacity-80" />

                                            {/* Fault / Weakness */}
                                            <div className="flex items-start gap-3 relative z-10 pb-3 border-b border-amber-200/50 dark:border-amber-800/50">
                                                <div className="p-2.5 rounded-xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-rose-200 dark:border-rose-900/50 shrink-0">
                                                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                                                </div>
                                                <div className="mt-0.5">
                                                    <span className="font-black text-[10px] uppercase tracking-widest text-rose-600 dark:text-rose-400">Fault / Weakness</span>
                                                    <p className="font-bold text-[15px] text-slate-800 dark:text-white leading-tight mt-1">{item.drawback}</p>
                                                </div>
                                            </div>

                                            {/* Correction / Fix */}
                                            <div className="flex items-start gap-3 relative z-10 pt-1">
                                                <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0 mt-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <span className="font-black text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Correction / Idea to Improve</span>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-1">{item.suggestion}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* No gaps — show growth suggestions */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(readiness?.growthSuggestions || []).map((sug: string, idx: number) => (
                                    <div key={idx} className="p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2 transition-all hover:shadow-md">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Growth Opportunity</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 ml-auto">Next Level</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-foreground font-medium">{sug}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4 mt-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 rounded-2xl p-6 border-2 border-slate-900 dark:border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="p-4 bg-slate-900 dark:bg-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-500">
                                        <Zap className="h-7 w-7 text-white dark:text-slate-900" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Development Logs</h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">Recent enrichment activities shaping your profile</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 relative z-10">
                                    <div className="text-center px-8 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-900/10 dark:border-white/10 shadow-inner">
                                        <p className="text-4xl font-black text-slate-900 dark:text-white">{user?.academicEnrichment?.length || 0}</p>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Total Logs</p>
                                    </div>
                                </div>
                            </div>

                            {user?.academicEnrichment && user.academicEnrichment.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {user.academicEnrichment.slice(0, 4).map((item, idx) => (
                                        <div key={idx} className="group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 transition-all shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                                            <div className="flex items-start gap-4">
                                                <div className={cn("p-2.5 rounded-lg border-2 shadow-sm",
                                                    item.type === "Certification" ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400" :
                                                        item.type === "Internship" ? "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/30 dark:border-purple-800/50 dark:text-purple-400" :
                                                            item.type === "Workshop" ? "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-400" :
                                                                "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400"
                                                )}>
                                                    {item.type === "Certification" ? <Award className="h-5 w-5" /> :
                                                        item.type === "Internship" ? <Briefcase className="h-5 w-5" /> :
                                                            item.type === "Workshop" ? <BookOpen className="h-5 w-5" /> :
                                                                <Trophy className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">{item.title}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{item.organization}</p>
                                                    <div className="flex items-center gap-2 mt-2.5">
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800">{item.type}</Badge>
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none">{item.level || "Institutional"}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:text-right shrink-0">
                                                <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 font-black tracking-wide border border-blue-200 dark:border-blue-800 pointer-events-none px-3 py-1">
                                                    + {item.type === "Certification" ? 10 : item.type === "Internship" ? 20 : 5} PRI
                                                </Badge>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 font-bold uppercase tracking-widest">{item.date || "Completed"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-12 rounded-2xl border-2 border-slate-900 dark:border-slate-100 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                            <Trophy className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Logs Available</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-md mx-auto font-medium leading-relaxed">Start logging your certifications, workshops, and achievements in your Portfolio to boost your PRI and showcase your development.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ title, value, sub, icon: Icon, color, isRisk, isLarge, isPink }: any) {
    const colorClasses: any = {
        blue: "from-blue-500/10 to-transparent dark:from-blue-500/20 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 shadow-blue-500/5",
        emerald: "from-emerald-500/10 to-transparent dark:from-emerald-500/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5",
        orange: "from-orange-500/10 to-transparent dark:from-orange-500/20 border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 shadow-orange-500/5",
        purple: "from-purple-500/10 to-transparent dark:from-purple-500/20 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 shadow-purple-500/5",
        pink: "from-pink-500/10 to-transparent dark:from-pink-500/20 border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 shadow-pink-500/5",
    };

    const iconBgClasses: any = {
        blue: "bg-blue-100 dark:bg-blue-900/60 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
        emerald: "bg-emerald-100 dark:bg-emerald-900/60 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
        orange: "bg-orange-100 dark:bg-orange-900/60 shadow-[0_0_15px_rgba(249,115,22,0.5)]",
        purple: "bg-purple-100 dark:bg-purple-900/60 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
        pink: "bg-pink-100 dark:bg-pink-900/60 shadow-[0_0_15px_rgba(236,72,153,0.5)]",
    };

    return (
        <Card className={cn(
            "border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:border-transparent dark:hover:border-transparent cursor-default",
            isRisk ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-900",
            `hover:shadow-[0_10px_30px_-10px_var(--tw-shadow-color)] ${colorClasses[color].split(' ').pop()}`
        )}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 dark:opacity-30 group-hover:opacity-100 transition-opacity duration-500", colorClasses[color].split(' ').slice(0, 2).join(' '))} />
            <CardContent className="p-5 flex items-center gap-5 relative z-10">
                <div className={cn("p-3 rounded-2xl border border-white/20 dark:border-slate-800/50 flex shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", iconBgClasses[color])}>
                    <Icon className={cn("h-6 w-6", colorClasses[color].split(' ')[4])} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
                    <div className={cn("font-black tracking-tight truncate drop-shadow-sm", isLarge ? "text-2xl text-slate-800 dark:text-white" : "text-3xl text-slate-800 dark:text-white")}>{value}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1 max-w-[90%] truncate leading-none">{sub}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function RiskMetric({ label, status, icon: Icon, color, isText }: any) {
    const colorClasses: any = {
        blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50",
        emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50",
        amber: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50",
        purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50",
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card hover:border-border/80 transition-all shadow-sm">
            <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", colorClasses[color])}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{label}</span>
            </div>
            <span className={cn("text-xs font-black italic uppercase tracking-tighter", isText ? "text-foreground" : (status === "Low" || status === "None" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"))}>
                {status}
            </span>
        </div>
    );
}

function PlanCard({ time, desc, title, steps, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400 hover:shadow-blue-500/10",
        emerald: "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-400 hover:shadow-emerald-500/10",
        purple: "border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-400 hover:shadow-purple-500/10",
    };

    const gradientClasses: any = {
        blue: "from-blue-500/5 to-transparent",
        emerald: "from-emerald-500/5 to-transparent",
        purple: "from-purple-500/5 to-transparent",
    };

    return (
        <Card className={cn("border-2 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative", colorClasses[color].split(' hover:')[0], colorClasses[color].split(' ').filter((c: string) => c.startsWith('hover')).join(' '))}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", gradientClasses[color])} />
            <CardContent className="p-4 relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm bg-white dark:bg-slate-900", colorClasses[color].split(' ')[0], colorClasses[color].split(' ')[2])}>{time}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{desc}</span>
                        </div>
                        <h3 className={cn("font-black text-slate-800 dark:text-slate-100 text-base transition-colors group-hover:text-shadow-sm", colorClasses[color].split(' ')[2].replace('text-', 'group-hover:text-').replace('dark:text-', 'dark:group-hover:text-'))}>{title}</h3>
                    </div>
                    <div className={cn("p-2 rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md", colorClasses[color].split(' ')[0])}>
                        <Icon className={cn("h-4 w-4", colorClasses[color].split(' ')[2])} />
                    </div>
                </div>
                <div className="space-y-2 mt-4 bg-white/40 dark:bg-slate-900/40 p-2 rounded-lg border border-black/5 dark:border-white/5">
                    {steps.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <div className={cn("h-1.5 w-1.5 rounded-full shadow-sm", color === 'blue' ? 'bg-blue-500' : (color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'))} />
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-tight">{step}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

const Separator = ({ orientation, className }: { orientation: string, className: string }) => (
    <div className={cn(orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full', className)} />
);

