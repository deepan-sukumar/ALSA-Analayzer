"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    TrendingDown,
    Activity,
    Building2,
    BookOpen,
    Clock,
    CheckCircle2,
    Lightbulb,
    ShieldCheck,
    ArrowUpRight,
    TrendingUp,
    Zap
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts";
import { User } from "@/types";
import { calculatePRI, getPlacementReadiness } from "@/lib/calculations/placement-calculations";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { normalizeDepartment } from "@/lib/core/department-core";

const CHART_AXIS_COLOR = "hsl(var(--muted-foreground))";
const CHART_GRID_COLOR = "hsl(var(--border))";

const formatBucketLabel = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

const parseTimestamp = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTrendBuckets = (students: User[]) => {
    const monthly = new Map<string, { monthDate: Date; count: number; priTotal: number }>();

    students.forEach((student, index) => {
        const sourceDate =
            parseTimestamp(student.lastUpdated) ||
            parseTimestamp((student as any).updatedAt) ||
            parseTimestamp((student as any).createdAt);

        const date = sourceDate || new Date(Date.now() - (students.length - index) * 86400000);
        const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const key = monthDate.toISOString();
        const current = monthly.get(key) || { monthDate, count: 0, priTotal: 0 };
        current.count += 1;
        current.priTotal += calculatePRI(student).pri;
        monthly.set(key, current);
    });

    const sorted = Array.from(monthly.values()).sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
    return sorted.slice(-6).map((entry) => ({
        name: formatBucketLabel(entry.monthDate),
        score: Math.round(entry.priTotal / Math.max(entry.count, 1)),
        avg: Math.round(entry.priTotal / Math.max(entry.count, 1)),
        count: entry.count,
    }));
};

export default function AdminDashboard() {
    const [students, setStudents] = useState<User[]>([]);
    const [faculty, setFaculty] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const studentQuery = query(collection(db, "users"), where("role", "==", "student"));
                const facultyQuery = query(collection(db, "users"), where("role", "==", "faculty"));

                const [studentSnap, facultySnap] = await Promise.all([getDocs(studentQuery), getDocs(facultyQuery)]);

                setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() }) as User));
                setFaculty(facultySnap.docs.map(d => ({ id: d.id, ...d.data() }) as User));
            } catch (e) {
                console.error("Failed to load users from Firestore", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Analytics Calculation
    const analytics = useMemo(() => {
        if (students.length === 0) return null;

        const departmentCounts: Record<string, { totalPRI: number, count: number }> = {};
        const riskCounts = { Ready: 0, Moderate: 0, High: 0, Critical: 0 };
        const moduleScores = { academic: 0, core: 0, role: 0, aptitude: 0, enrichment: 0 };
        let totalPRI = 0;
        const consistencyTrendData = getTrendBuckets(students);

        students.forEach((student) => {
            const priData = calculatePRI(student);
            const readiness = getPlacementReadiness(student);

            totalPRI += priData.pri;

            // Department
            const dept = normalizeDepartment(student.department || "Unknown");
            if (!departmentCounts[dept]) departmentCounts[dept] = { totalPRI: 0, count: 0 };
            departmentCounts[dept].totalPRI += priData.pri;
            departmentCounts[dept].count += 1;

            // Risk
            const readinessLabel = readiness.finalRisk?.label || "Low";
            if (readinessLabel === "Low") riskCounts.Ready++;
            else if (readinessLabel === "Moderate") riskCounts.Moderate++;
            else if (readinessLabel === "High") riskCounts.High++;
            else riskCounts.Critical++;

            // Module avgs
            moduleScores.academic += priData.breakDown.academic;
            moduleScores.core += priData.breakDown.core;
            moduleScores.role += priData.breakDown.role;
            moduleScores.aptitude += priData.breakDown.aptitude;
            moduleScores.enrichment += priData.breakDown.enrichment;
        });

        const count = students.length;
        const totalFaculty = faculty.length;
        const approvedFaculty = faculty.filter(f => f.approved).length;
        const pendingFaculty = totalFaculty - approvedFaculty;

        const sortedTrend = consistencyTrendData;
        const latestTrend = sortedTrend[sortedTrend.length - 1];
        const previousTrend = sortedTrend[sortedTrend.length - 2];
        const priDelta = latestTrend && previousTrend ? latestTrend.score - previousTrend.score : 0;
        const facultyApprovalRate = totalFaculty > 0 ? Math.round((approvedFaculty / totalFaculty) * 100) : 0;

        return {
            avgPRI: Math.round(totalPRI / count),
            totalStudents: count,
            totalFaculty,
            approvedFaculty,
            pendingFaculty,
            highRiskCount: riskCounts.High + riskCounts.Critical,
            facultyApprovalRate,
            priDelta,
            activeDepartments: Object.keys(departmentCounts).length,

            departmentData: Object.entries(departmentCounts).map(([name, data]) => ({
                name,
                score: Math.round(data.totalPRI / data.count)
            })),

            riskData: [
                { name: "Ready", value: riskCounts.Ready, color: "#10b981" },
                { name: "Moderate", value: riskCounts.Moderate, color: "#3b82f6" },
                { name: "High", value: riskCounts.High, color: "#f59e0b" },
                { name: "Critical", value: riskCounts.Critical, color: "#ef4444" },
            ],

            modulePerformance: [
                { name: "Academic", score: Math.round(moduleScores.academic / count), fill: "#3b82f6" },
                { name: "Core Skills", score: Math.round(moduleScores.core / count), fill: "#6366f1" },
                { name: "Role Prep", score: Math.round(moduleScores.role / count), fill: "#8b5cf6" },
                { name: "Aptitude", score: Math.round(moduleScores.aptitude / count), fill: "#ec4899" },
                { name: "Enrichment", score: Math.round(moduleScores.enrichment / count), fill: "#f43f5e" },
            ],

            consistencyTrendData: sortedTrend,
            insights: [] as string[]
        };
    }, [students, faculty]);

    // Generate AI Insights
    useEffect(() => {
        if (!analytics || analytics.totalStudents === 0) return;

        const generatedInsights: string[] = [];

        const moderateRiskPct = Math.round(((analytics.riskData[1].value + analytics.riskData[2].value) / analytics.totalStudents) * 100);
        if (moderateRiskPct >= 15) {
            generatedInsights.push(`${moderateRiskPct}% of the student body requires targeted placement mentorship.`);
        }

        if (analytics.departmentData.length > 0) {
            const lowestDept = [...analytics.departmentData].sort((a, b) => a.score - b.score)[0];
            if (lowestDept && lowestDept.score < 60) {
                generatedInsights.push(`Academic calibration needed for ${lowestDept.name} department.`);
            }
        }

        const weakModules = analytics.modulePerformance.filter(m => m.score < 50);
        if (weakModules.length > 0) {
            generatedInsights.push(`Intervention suggested for ${weakModules.map(m => m.name).join(", ")} modules.`);
        }

        if (analytics.pendingFaculty > 0) {
            generatedInsights.push(`Attention required: ${analytics.pendingFaculty} faculty credentials awaiting verification.`);
        }

        if (generatedInsights.length === 0) {
            generatedInsights.push("All institutional metrics are currently within optimal operational thresholds.");
        }

        analytics.insights = generatedInsights;
    }, [analytics]);

    if (loading || !analytics) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[60vh]">
                <Activity className="w-12 h-12 animate-pulse text-blue-500" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Aggregating Global Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Premium Institutional Command Center Hero */}
            <div className="relative rounded-[40px] overflow-hidden bg-slate-950 shadow-3xl border border-white/5 group">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-blue-600/10 to-transparent opacity-50 transition-opacity duration-700 group-hover:opacity-70" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -ml-24 -mb-24" />

                {/* Technical Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

                <div className="relative z-10 p-10 md:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="max-w-3xl space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 ring-4 ring-white/5 transition-transform duration-500 group-hover:rotate-12">
                                <ShieldCheck className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80 leading-none">ALSA Network</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Security Verified Hub</span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-white leading-[0.9]">
                                Institutional <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-400">Command Center</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                                Orchestrating macro-level insights across <span className="text-white font-bold">{analytics.totalStudents} intelligence nodes</span> and <span className="text-white font-bold">{analytics.totalFaculty} verified faculty members</span>.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">System Live</span>
                            </div>
                            <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                                <Activity className="h-3 w-3 text-blue-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Faculty Approval: {analytics.facultyApprovalRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative group/score">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full scale-75 opacity-0 group-hover/score:opacity-100 transition-opacity duration-700" />
                        <div className="relative bg-white/5 backdrop-blur-2xl rounded-[40px] p-10 border border-white/10 shadow-inner min-w-[280px] hover:border-blue-500/30 transition-all duration-500">
                            <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.25em] mb-4">Global PRI Index</p>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-8xl font-black leading-none text-white tracking-tighter">{analytics.avgPRI}</p>
                                    <div className="flex flex-col">
                                    {analytics.priDelta >= 0 ? (
                                        <TrendingUp className="h-8 w-8 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="h-8 w-8 text-rose-400" />
                                    )}
                                    <span className={`text-[10px] font-black tracking-widest ${analytics.priDelta >= 0 ? "text-emerald-400/80" : "text-rose-400/80"}`}>
                                        {analytics.priDelta >= 0 ? "+" : ""}{analytics.priDelta}
                                    </span>
                                    </div>
                                </div>
                                <div className="mt-5 pt-6 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>Department Coverage</span>
                                    <span className="text-blue-400">{analytics.activeDepartments} Active</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${Math.min(100, Math.max(10, analytics.facultyApprovalRate || 10))}%` }}
                                    />
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>

            {/* Premium KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-5">
                {[
                    { label: "Institutional Nodes", val: analytics.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { label: "Faculty Directory", val: analytics.totalFaculty, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                    { label: "Verified Assets", val: analytics.approvedFaculty, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { label: "Auth Backlog", val: analytics.pendingFaculty, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", alert: analytics.pendingFaculty > 0 },
                    { label: "Critical Risk", val: analytics.highRiskCount, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", alert: analytics.highRiskCount > 5 },
                    { label: "Departments Active", val: analytics.activeDepartments, icon: Building2, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
                ].map((kpi, i) => (
                    <Card key={i} className={`relative border-none bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden rounded-[32px] ${kpi.alert ? 'ring-2 ring-rose-500/20' : ''}`}>
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${kpi.color.replace('text', 'bg')}`} />
                        <CardContent className="p-7">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`h-12 w-12 rounded-2xl ${kpi.bg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                                <div className="h-8 w-8 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors uppercase">{kpi.label}</p>
                                <div className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white transition-transform duration-500 group-hover:translate-x-1">{kpi.val}</div>
                            </div>
                            {kpi.alert && (
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Action Required</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* AI Insights Engine - Terminal Aesthetic */}
            {analytics.insights && analytics.insights.length > 0 && (
                <div className="relative group/insights overflow-hidden rounded-[32px] bg-slate-950 border border-white/10 shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent" />
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <CardHeader className="relative z-10 pb-4 border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                                    <Lightbulb className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-white">Neural Insights Engine</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Institutional Strategy Recommendations</CardDescription>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2">
                                <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Model Active</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {analytics.insights.map((insight, i) => (
                                <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white/5 p-5 border border-white/5 shadow-inner hover:bg-white/10 hover:border-blue-500/30 transition-all duration-500 group/insight">
                                    <div className="flex items-center justify-between">
                                        <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/20">
                                            0{i + 1}
                                        </div>
                                        <TrendingUp className="h-3 w-3 text-slate-600 group-hover:insight:text-blue-400 transition-colors" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-300 leading-relaxed tracking-wide">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-12 mt-5">
                {/* Risk Distribution - Interactive Radial */}
                <Card className="lg:col-span-4 border-none bg-white dark:bg-slate-900 shadow-3xl rounded-[40px] overflow-hidden group">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                                <TrendingDown className="h-5 w-5 text-rose-500" />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 dark:border-slate-800">Live Census</Badge>
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">Risk Distribution</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Institutional Placement Readiness</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="h-[320px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.riskData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={85}
                                        outerRadius={115}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={8}
                                    >
                                        {analytics.riskData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="hover:opacity-80 transition-opacity duration-300 cursor-pointer shadow-xl"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                            color: '#fff',
                                            padding: '12px 16px',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            fontSize: '10px',
                                            letterSpacing: '0.1em'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center PRI Display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Index</p>
                                <p className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{analytics.avgPRI}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-5">
                            {analytics.riskData.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{item.value} Users</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Growth - Neon Area Chart */}
                <Card className="lg:col-span-8 border-none bg-white dark:bg-slate-900 shadow-3xl rounded-[40px] overflow-hidden group">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 dark:bg-blue-900/20">2024 Audit</Badge>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">Active Cohort</Badge>
                            </div>
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">Institutional Growth Trend</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">PRI Consistency Metrics Over Strategic Eras</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-10">
                        <div className="h-[380px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.consistencyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={{ stroke: CHART_AXIS_COLOR, strokeWidth: 1 }}
                                        tickLine={{ stroke: CHART_AXIS_COLOR }}
                                        tick={{ fontSize: 10, fontWeight: 900, fill: CHART_AXIS_COLOR }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={{ stroke: CHART_AXIS_COLOR, strokeWidth: 1 }}
                                        tickLine={{ stroke: CHART_AXIS_COLOR }}
                                        tick={{ fontSize: 10, fontWeight: 900, fill: CHART_AXIS_COLOR }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_COLOR} strokeOpacity={0.35} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '20px',
                                            border: 'none',
                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                            padding: '16px',
                                            fontWeight: '900',
                                            textTransform: 'uppercase',
                                            fontSize: '10px',
                                            color: '#fff'
                                        }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        animationDuration={2000}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avg"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        strokeDasharray="10 10"
                                        fillOpacity={1}
                                        fill="url(#colorAvg)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Module Benchmarking */}
                <Card className="lg:col-span-12 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                        <CardTitle className="text-base font-black uppercase tracking-widest">Global Module Benchmarking</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Average Score Distribution Across Competency Domains</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.modulePerformance} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_COLOR} strokeOpacity={0.35} />
                                    <XAxis
                                        dataKey="name"
                                        fontSize={10}
                                        fontWeight="black"
                                        tickLine={{ stroke: CHART_AXIS_COLOR }}
                                        axisLine={{ stroke: CHART_AXIS_COLOR, strokeWidth: 1 }}
                                        tick={{ dy: 10, fill: CHART_AXIS_COLOR }}
                                    />
                                    <YAxis
                                        fontSize={10}
                                        fontWeight="bold"
                                        tickLine={{ stroke: CHART_AXIS_COLOR }}
                                        axisLine={{ stroke: CHART_AXIS_COLOR, strokeWidth: 1 }}
                                        tick={{ fill: CHART_AXIS_COLOR }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={60}>
                                        {analytics.modulePerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


