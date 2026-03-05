"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Activity,
    AlertCircle,
    GraduationCap,
    Zap,
    BookOpen,
    Star,
    Target,
    ChevronRight
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
    Legend
} from "recharts";
import { onFacultyStudentsSnapshot } from "@/lib/firestore";
import { calculatePRI, getPlacementReadiness } from "@/lib/placement-calculations";
import { User as AppUser } from "@/types";
import { analyzeClassPerformance, generateFacultyStudentRoadmap } from "@/lib/faculty-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { StudentDetailsSheet } from "@/components/student-details-sheet";

// ─── Premium KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, gradient, ring }: any) {
    return (
        <div className={`group relative overflow-hidden rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${gradient} border ${ring}`}>
            {/* Glow blob */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 mb-1">{title}</p>
                    <p className="text-4xl font-black text-white leading-none">{value}</p>
                    <p className="text-[11px] font-semibold text-white/50 mt-2">{sub}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors shadow-inner">
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );
}

// ─── No-data placeholder ───────────────────────────────────────────────────────
const NoDataState = ({ text = "No Data Available Yet" }) => (
    <div className="flex w-full h-full items-center justify-center min-h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50/60">
        <span className="text-slate-400 dark:text-slate-300 italic font-medium">{text}</span>
    </div>
);

// ─── Custom recharts tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
                <p className="font-bold text-white/80 mb-0.5">{label}</p>
                <p className="font-black text-lg">{payload[0].value}<span className="text-xs font-normal text-white/50 ml-1">pts</span></p>
            </div>
        );
    }
    return null;
};

export default function FacultyDashboard() {
    const { user: facultyUser } = useAuth();
    const [allStudents, setAllStudents] = useState<AppUser[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<AppUser | null>(null);

    useEffect(() => {
        if (!facultyUser || !facultyUser.department) {
            setLoadingStudents(false);
            return;
        }
        const facultyDept = facultyUser.department;
        const unsubscribe = onFacultyStudentsSnapshot(facultyDept, (studentsData) => {
            setAllStudents(studentsData as AppUser[]);
            setLoadingStudents(false);
        });
        return () => unsubscribe();
    }, [facultyUser]);

    const analytics = useMemo(() => {
        const count = allStudents.length;
        if (count === 0) return null;

        let totalPRI = 0, totalCGPA = 0, totalArrears = 0;
        const riskCounts = { Ready: 0, Moderate: 0, High: 0, Critical: 0 };
        const moduleScores = { academic: 0, core: 0, role: 0, aptitude: 0, enrichment: 0 };
        let studentsWithData = 0;

        allStudents.forEach(student => {
            const currentPRI = student.priScore || 0;
            const currentCGPA = typeof student.cgpa === "number" ? student.cgpa : parseFloat(student.cgpa || "0");
            const priData = calculatePRI(student);

            if (currentPRI > 0 || currentCGPA > 0) studentsWithData++;
            totalPRI += currentPRI;
            totalCGPA += currentCGPA;
            totalArrears += student.arrears || 0;

            if (currentPRI >= 75) riskCounts.Ready++;
            else if (currentPRI >= 60) riskCounts.Moderate++;
            else if (currentPRI >= 40) riskCounts.High++;
            else riskCounts.Critical++;

            moduleScores.academic += priData.breakDown.academic;
            moduleScores.core += priData.breakDown.core;
            moduleScores.role += priData.breakDown.role;
            moduleScores.aptitude += priData.breakDown.aptitude;
            moduleScores.enrichment += priData.breakDown.enrichment;
        });

        const avgPRI = Math.round(totalPRI / count);
        const avgCGPAValue = totalCGPA / count;
        const academicAvg = Math.round(moduleScores.academic / count);
        const aptitudeAvg = Math.round(moduleScores.aptitude / count);
        const enrichmentAvg = Math.round(moduleScores.enrichment / count);
        const roleAlignmentAvg = Math.round(moduleScores.role / count);
        const classInsights = analyzeClassPerformance(allStudents);

        const topHighRisk = [...allStudents]
            .map(s => {
                const readiness = getPlacementReadiness(s);
                return { ...s, pri: s.priScore || 0, gaps: readiness.performanceGaps || [], roadmap: generateFacultyStudentRoadmap(s) };
            })
            .sort((a, b) => a.pri - b.pri)
            .slice(0, 5);

        const coreGaps = [...allStudents]
            .map(s => ({ ...s, coreScore: calculatePRI(s).breakDown.coreNormalized }))
            .sort((a, b) => a.coreScore - b.coreScore)
            .slice(0, 5);

        const enrichmentGaps = [...allStudents]
            .map(s => ({ ...s, enrichmentScore: calculatePRI(s).breakDown.enrichmentNormalized }))
            .sort((a, b) => a.enrichmentScore - b.enrichmentScore)
            .slice(0, 5);

        return {
            totalStudents: count,
            avgPRI,
            avgCGPA: avgCGPAValue.toFixed(2),
            totalArrears,
            highRiskCount: riskCounts.High,
            criticalCount: riskCounts.Critical,
            classInsights,
            topHighRisk,
            coreGaps,
            enrichmentGaps,
            riskData: [
                { name: "Ready", value: riskCounts.Ready, color: "#22c55e" },
                { name: "Moderate", value: riskCounts.Moderate, color: "#6366f1" },
                { name: "High", value: riskCounts.High, color: "#f97316" },
                { name: "Critical", value: riskCounts.Critical, color: "#ef4444" },
            ].filter(d => d.value > 0),
            moduleData: [
                { name: "Academic", score: academicAvg, fill: "#8b5cf6" },
                { name: "Core", score: Math.round(moduleScores.core / count), fill: "#3b82f6" },
                { name: "Role Fit", score: roleAlignmentAvg, fill: "#10b981" },
                { name: "Aptitude", score: aptitudeAvg, fill: "#f59e0b" },
                { name: "Enrichment", score: enrichmentAvg, fill: "#ef4444" },
            ]
        };
    }, [allStudents]);

    const priGradient = analytics
        ? analytics.avgPRI >= 75 ? "from-emerald-500 to-emerald-700"
            : analytics.avgPRI >= 60 ? "from-blue-500 to-blue-700"
                : analytics.avgPRI >= 40 ? "from-amber-500 to-orange-600"
                    : "from-red-500 to-rose-700"
        : "from-slate-500 to-slate-700";

    return (
        <div className="space-y-8 animate-in fade-in duration-500 px-1">

            {/* ── Page Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl p-7">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Faculty Intelligence Portal</p>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Professional Readiness Analytics</h1>
                    <p className="text-white/60 font-medium text-sm">
                        Cohort evaluation &amp; risk monitoring — <span className="text-white/90 font-bold">{facultyUser?.department}</span>
                    </p>
                </div>
            </div>

            {loadingStudents ? (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin" />
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-300 animate-pulse">Loading Department Metrics...</p>
                    </div>
                </div>
            ) : !analytics ? (
                <div className="p-12"><NoDataState text="No students registered in your department yet." /></div>
            ) : (
                <>
                    {/* ── KPI Grid ── */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <KpiCard
                            title="Total Students"
                            value={analytics.totalStudents}
                            sub="Registered in dept"
                            icon={Users}
                            gradient="bg-gradient-to-br from-indigo-500 to-indigo-800"
                            ring="border-indigo-400/30"
                        />
                        <KpiCard
                            title="Class Avg PRI"
                            value={`${analytics.avgPRI}%`}
                            sub="Readiness Index"
                            icon={analytics.avgPRI >= 60 ? TrendingUp : TrendingDown}
                            gradient={`bg-gradient-to-br ${priGradient}`}
                            ring="border-white/20"
                        />
                        <KpiCard
                            title="High Risk"
                            value={analytics.highRiskCount}
                            sub="PRI 40 – 59"
                            icon={AlertTriangle}
                            gradient="bg-gradient-to-br from-orange-400 to-orange-700"
                            ring="border-orange-400/30"
                        />
                        <KpiCard
                            title="Critical Risk"
                            value={analytics.criticalCount}
                            sub="PRI Below 40"
                            icon={AlertCircle}
                            gradient="bg-gradient-to-br from-rose-500 to-red-800"
                            ring="border-rose-400/30"
                        />
                        <KpiCard
                            title="Avg CGPA"
                            value={analytics.avgCGPA}
                            sub="Academic baseline"
                            icon={GraduationCap}
                            gradient="bg-gradient-to-br from-cyan-500 to-blue-700"
                            ring="border-cyan-400/30"
                        />
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        {/* Module Breakdown Bar Chart */}
                        <Card className="col-span-4 border-0 shadow-lg rounded-2xl overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-r from-slate-50 dark:from-slate-800/60 to-white dark:to-slate-900/0 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                                        <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black text-slate-800 dark:text-white">PRI Module Breakdown</CardTitle>
                                        <CardDescription className="text-xs">Class average per readiness module</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pl-1">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={analytics.moduleData} margin={{ left: 0, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} fontWeight={700} tick={{ fill: "#64748b" }} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "#94a3b8" }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)", radius: 8 }} />
                                        <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={52}>
                                            {analytics.moduleData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Risk Distribution */}
                        <Card className="col-span-3 border-0 shadow-lg rounded-2xl overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-r from-slate-50 dark:from-slate-800/60 to-white dark:to-slate-900/0 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50">
                                        <Target className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black text-slate-800 dark:text-white">Risk Distribution</CardTitle>
                                        <CardDescription className="text-xs">Segmented by Professional Readiness Index</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.riskData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={68}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {analytics.riskData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {analytics.riskData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 dark:text-slate-100">{d.name}</span>
                                            <span className="ml-auto text-[11px] font-black" style={{ color: d.color }}>{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Gap Intel Cards ── */}
                    <div className="grid gap-5 md:grid-cols-3">
                        {/* Core Gaps */}
                        <div className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                            <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 dark:from-indigo-950/30 to-white dark:to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                                        <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">Core Academic Gaps</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-300">Lowest core topic coverage</p>
                                    </div>
                                </div>
                                <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border-none text-[10px] font-bold">Skills</Badge>
                            </div>
                            <div className="p-3 space-y-1">
                                {analytics.coreGaps.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 border border-transparent transition-all duration-200 cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[130px] block group-hover:text-indigo-700 dark:text-indigo-400 transition-colors">{s.name}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-300">Core Coverage</span>
                                        </div>
                                        <Badge className="bg-indigo-50 text-indigo-600 dark:text-indigo-400 border-indigo-200 border text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {s.coreScore}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enrichment Gaps */}
                        <div className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                            <div className="px-5 py-4 border-b bg-gradient-to-r from-emerald-50 dark:from-emerald-950/30 to-white dark:to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                        <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">Enrichment Gaps</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-300">Lowest activity participation</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-none text-[10px] font-bold">Activity</Badge>
                            </div>
                            <div className="p-3 space-y-1">
                                {analytics.enrichmentGaps.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-200 border border-transparent transition-all duration-200 cursor-pointer"
                                    >
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[130px] block group-hover:text-emerald-700 dark:text-emerald-400 transition-colors">{s.name}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-300">Achievement Index</span>
                                        </div>
                                        <Badge className="bg-emerald-50 text-emerald-600 dark:text-emerald-400 border-emerald-200 border text-[10px] font-black group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            {s.enrichmentScore}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cohort Health */}
                        <div className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                            <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-50 dark:from-blue-950/30 to-white dark:to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">Cohort Health</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-300">AI performance analysis</p>
                                    </div>
                                </div>
                                <Badge className={`border text-[10px] font-black ${(analytics.classInsights.overallHealth as string) === 'Good' ? 'bg-emerald-100 dark:bg-emerald-900/50 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : (analytics.classInsights.overallHealth as string) === 'Moderate' ? 'bg-amber-100 dark:bg-amber-900/50 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-red-100 dark:bg-red-900/50 dark:bg-red-900/60 text-red-700 dark:text-red-400 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                                    {analytics.classInsights.overallHealth}
                                </Badge>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                    <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Risk Population</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">{analytics.classInsights.studentsAtRisk} at-risk students</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase">Top Weakness</p>
                                        <p className="text-sm font-black text-rose-600 dark:text-rose-400">{analytics.classInsights.topWeakness}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── AI Class Performance Gaps ── */}
                    <div className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-900 border-0">
                        <div className="px-6 py-5 border-b bg-gradient-to-r from-violet-50 dark:from-violet-950/30 via-indigo-50 dark:via-indigo-950/30 to-white dark:to-slate-900/0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-900/20">
                                    <Activity className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-black text-base text-slate-800 dark:text-white">AI Class Performance Gaps</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-300">Major drawbacks dynamically identified across the <span className="font-bold text-indigo-600 dark:text-indigo-400">{facultyUser?.department}</span> cohort</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {analytics.classInsights.drawbacks.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {analytics.classInsights.drawbacks.map((db: any, idx: number) => {
                                        const isCritical = db.impactLevel === "Critical" || db.impactLevel === "High";
                                        return (
                                            <div
                                                key={idx}
                                                className={`group relative p-5 rounded-xl border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default ${isCritical
                                                        ? 'bg-red-50/70 dark:bg-red-950/40 border-l-red-500 border border-red-100 dark:border-red-900/50'
                                                        : 'bg-amber-50/70 dark:bg-amber-950/40 border-l-amber-500 border border-amber-100 dark:border-amber-900/50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <h5 className={`font-black text-sm flex items-center gap-1.5 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                        {isCritical && <AlertCircle className="h-4 w-4" />}
                                                        {db.domain}
                                                    </h5>
                                                    <Badge className={`text-[10px] font-black border-0 ${isCritical ? 'bg-red-100 dark:bg-red-900/50 dark:bg-red-900/60 text-red-700 dark:text-red-400 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/50 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 dark:text-amber-300'}`}>
                                                        {db.affectedStudents} Students
                                                    </Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-300 mb-1">Problem Analysis</p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-200 leading-relaxed">{db.primaryReason}</p>
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
                                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 dark:text-slate-100 mb-2">Recommended Action</p>
                                                        <ul className="space-y-1.5">
                                                            {db.facultyActionPlan.map((action: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 dark:text-slate-200">
                                                                    <ChevronRight className={`h-3 w-3 mt-0.5 shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                                                                    {action}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-white dark:to-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3">
                                        <Star className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="font-black text-emerald-700 dark:text-emerald-400">No significant cohort-level gaps detected.</p>
                                    <p className="text-xs text-emerald-500 mt-1">The class is tracking positive progression.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Urgent Intervention ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 dark:text-white">Urgent Intervention Required</h2>
                                <p className="text-xs text-slate-400 dark:text-slate-300">Individual drawbacks &amp; Smart Recovery Roadmaps for the most at-risk students</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {analytics.topHighRisk.length > 0 ? (
                                analytics.topHighRisk.map((student, idx) => (
                                    <div key={idx} className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-md hover:shadow-xl hover:border-red-200 transition-all duration-300">
                                        {/* Student Header */}
                                        <div className="bg-red-50/80 dark:bg-red-950/40 px-6 py-4 border-b border-red-100 dark:border-red-900/50 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2.5 flex-wrap">
                                                    {student.name}
                                                    <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 border text-[10px] font-black">Critical Risk</Badge>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-[11px] font-bold bg-white dark:bg-slate-900 dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm transition-all duration-200"
                                                        onClick={() => setSelectedStudent(student)}
                                                    >
                                                        View Profile
                                                    </Button>
                                                </h4>
                                                <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 font-medium">{student.id} • {student.department}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-3xl font-black text-red-500">{student.pri}%</div>
                                                <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider">PRI Score</div>
                                            </div>
                                        </div>

                                        <div className="p-6 grid md:grid-cols-2 gap-6">
                                            {/* Drawback */}
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">Primary Drawback</p>
                                                {student.gaps && student.gaps.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {student.gaps.slice(0, 1).map((gap: any, gIdx: number) => (
                                                            <div key={gIdx} className="p-6 rounded-xl bg-gradient-to-br from-rose-50 dark:from-rose-950/30 to-white dark:to-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-sm">
                                                                <div className="font-black text-sm text-slate-800 dark:text-white mb-1.5">{gap.domain}</div>
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-200 leading-relaxed mb-2">{gap.problem}</p>
                                                                {gap.missingTopics && gap.missingTopics.length > 0 && (
                                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-300 flex flex-wrap gap-1 mt-2">
                                                                        {gap.missingTopics.map((t: string, ti: number) => (
                                                                            <span key={ti} className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">{t}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {student.gaps.length > 1 && (
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-300 italic">+ {student.gaps.length - 1} more gaps — view full profile</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 dark:text-slate-300 italic">No specific gap identified yet. Score is generally low.</p>
                                                )}
                                            </div>

                                            {/* Roadmap */}
                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">Smart Recovery Roadmap</p>
                                                {student.roadmap && student.roadmap.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {student.roadmap.slice(0, 2).map((phase: any, pIdx: number) => (
                                                            <div key={pIdx} className={`relative pl-4 py-1 border-l-2 ${phase.priority === "Critical" ? "border-l-red-400" : phase.priority === "High" ? "border-l-amber-400" : "border-l-blue-400"}`}>
                                                                <div className="flex justify-between items-center mb-0.5">
                                                                    <span className="text-xs font-black text-slate-800 dark:text-white">{phase.week}</span>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${phase.priority === "Critical" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400" : phase.priority === "High" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"}`}>
                                                                        {phase.priority}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-300 mb-1">{phase.focus}</p>
                                                                <ul className="space-y-0.5">
                                                                    {phase.tasks.slice(0, 2).map((t: string, tIdx: number) => (
                                                                        <li key={tIdx} className="text-[10px] text-slate-400 dark:text-slate-300 flex items-start gap-1.5">
                                                                            <span className="text-slate-300 mt-0.5">›</span>
                                                                            <span className="truncate">{t}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 dark:text-slate-300 italic">Roadmap generation processing...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl p-8 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-white dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/40 text-center">
                                    <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                        <Star className="h-7 w-7 text-emerald-500" />
                                    </div>
                                    <p className="font-black text-emerald-700 dark:text-emerald-400">No students in critical risk currently.</p>
                                    <p className="text-xs text-emerald-500 mt-1">The cohort is performing within acceptable ranges.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <StudentDetailsSheet
                open={!!selectedStudent}
                onOpenChange={(open) => !open && setSelectedStudent(null)}
                student={selectedStudent}
            />
        </div>
    );
}

function TrendUpOrDown(val: number) {
    if (val >= 75) return TrendingUp;
    if (val < 50) return TrendingDown;
    return Activity;
}
