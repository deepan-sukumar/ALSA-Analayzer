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
    ChevronRight,
    CheckCircle2
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
import { analyzeClassPerformance } from "@/lib/faculty-insights";
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
    <div className="flex w-full h-full items-center justify-center min-h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
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

        // Topic Verification Stats
        let totalSelectedTopics = 0;
        let totalVerifiedTopics = 0;
        let sumVerificationScore = 0;
        let validVerificationScoreCount = 0;
        let failingVerificationStudents = 0;

        allStudents.forEach(student => {
            const currentPRI = student.priScore || 0;
            const currentCGPA = typeof student.cgpa === "number" ? student.cgpa : parseFloat(student.cgpa || "0");
            const priData = calculatePRI(student);

            // Verification Metrics
            let stuSelectedCount = 0;
            let stuVerifiedCount = 0;
            Object.keys(student.coreAcademicTopics || {}).forEach(k => {
                stuSelectedCount += (student.coreAcademicTopics![k] || []).length;
            });
            Object.keys(student.verifiedCoreTopics || {}).forEach(k => {
                stuVerifiedCount += (student.verifiedCoreTopics![k] || []).length;
            });

            totalSelectedTopics += stuSelectedCount;
            totalVerifiedTopics += stuVerifiedCount;

            if (student.verificationScore !== undefined) {
                sumVerificationScore += student.verificationScore;
                validVerificationScoreCount++;
            }
            if ((student.failedVerifications || 0) > 0) {
                failingVerificationStudents++;
            }

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

        // All students sorted by PRI ascending (worst first) for intervention
        const allStudentsSortedByRisk = [...allStudents]
            .map(s => ({ ...s, pri: s.priScore || 0 }))
            .sort((a, b) => a.pri - b.pri);

        const topHighRisk = allStudentsSortedByRisk.slice(0, 5);

        const coreGaps = [...allStudents]
            .map(s => ({ ...s, coreScore: calculatePRI(s).breakDown.coreNormalized }))
            .sort((a, b) => a.coreScore - b.coreScore)
            .slice(0, 5);

        const enrichmentGaps = [...allStudents]
            .map(s => ({ ...s, enrichmentScore: calculatePRI(s).breakDown.enrichmentNormalized }))
            .sort((a, b) => a.enrichmentScore - b.enrichmentScore)
            .slice(0, 5);

        const verifiedPct = totalSelectedTopics > 0 ? Math.round((totalVerifiedTopics / totalSelectedTopics) * 100) : 0;
        const unverifiedPct = totalSelectedTopics > 0 ? 100 - verifiedPct : 0;

        return {
            totalStudents: count,
            avgPRI,
            avgCGPA: avgCGPAValue.toFixed(2),
            totalArrears,
            highRiskCount: riskCounts.High,
            criticalCount: riskCounts.Critical,
            classInsights,
            topHighRisk,
            allStudentsSortedByRisk,
            coreGaps,
            enrichmentGaps,
            verificationStats: {
                verifiedPercentage: verifiedPct,
                unverifiedPercentage: unverifiedPct,
                verifiedCount: totalVerifiedTopics,
                unverifiedCount: totalSelectedTopics - totalVerifiedTopics,
                avgScore: validVerificationScoreCount > 0 ? (sumVerificationScore / validVerificationScoreCount).toFixed(1) : "N/A",
                failingStudents: failingVerificationStudents
            },
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
                <div className="space-y-8">
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#000000" strokeOpacity={0.2} vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={{ stroke: "#000000" }}
                                                axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                                fontSize={11}
                                                fontWeight={700}
                                                tick={{ fill: "#000000" }}
                                            />
                                            <YAxis
                                                tickLine={{ stroke: "#000000" }}
                                                axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                                fontSize={11}
                                                tick={{ fill: "#000000" }}
                                            />
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
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {/* Verification Stats */}
                            <div className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
                                <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-50 dark:from-blue-950/30 to-white dark:to-transparent flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">Topic Verification</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-center space-y-4 text-xs font-black">
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Verified</p>
                                            <p className="text-lg text-emerald-600">{analytics.verificationStats.verifiedPercentage}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Unverified</p>
                                            <p className="text-lg text-rose-500">{analytics.verificationStats.unverifiedPercentage}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Gaps */}
                            <div className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                                <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 dark:from-indigo-950/30 to-white dark:to-transparent">
                                    <p className="text-sm font-black text-slate-800 dark:text-white">Core Academic Gaps</p>
                                </div>
                                <div className="p-3 space-y-1">
                                    {analytics.coreGaps.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.name}</span>
                                            <Badge className="bg-indigo-600 text-[10px]">{s.coreScore}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cohort Health */}
                            <div className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                                <div className="px-5 py-4 border-b bg-gradient-to-r from-emerald-50 dark:from-emerald-950/30 to-white dark:to-transparent">
                                    <p className="text-sm font-black text-slate-800 dark:text-white">Cohort Health</p>
                                </div>
                                <div className="p-4 space-y-3 font-bold text-xs">
                                    <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg">
                                        <span className="text-emerald-700 dark:text-emerald-400">At-Risk Scale</span>
                                        <span className="text-emerald-800 dark:text-emerald-300">{analytics.classInsights.studentsAtRisk} Students</span>
                                    </div>
                                    <div className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-[10px]">
                                        <p className="text-slate-400 uppercase mb-1">Top Weakness</p>
                                        <p className="text-rose-500 font-black">{analytics.classInsights.topWeakness}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Major Class Total Gaps ── */}
                        <div className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-900 border-0">
                            <div className="px-6 py-5 border-b bg-gradient-to-r from-violet-50 dark:from-violet-950/30 via-indigo-50 dark:via-indigo-950/30 to-white dark:to-slate-900/0">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-900/20">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-base text-slate-800 dark:text-white">Major Class Total Gaps</h2>
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

                        {/* ── Student Intelligence List ── */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-1">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white">All Students — Readiness Intelligence</h2>
                                    <p className="text-xs text-slate-400 dark:text-slate-300">System-generated individual drawbacks &amp; 6-week recovery roadmaps for every student, sorted by risk (lowest PRI first)</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {analytics.allStudentsSortedByRisk.length > 0 ? (
                                    analytics.allStudentsSortedByRisk.map((student, idx) => (
                                        <StudentInterventionRow
                                            key={student.id || idx}
                                            student={student}
                                            onViewProfile={() => setSelectedStudent(student)}
                                        />
                                    ))
                                ) : (
                                    <div className="rounded-2xl p-8 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/30 to-white dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/40 text-center">
                                        <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                            <Star className="h-7 w-7 text-emerald-500" />
                                        </div>
                                        <p className="font-black text-emerald-700 dark:text-emerald-400">No students registered yet.</p>
                                        <p className="text-xs text-emerald-500 mt-1">Once students join, recommendations will appear here.</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {selectedStudent && (
                <StudentDetailsSheet
                    open={!!selectedStudent}
                    onOpenChange={(open) => !open && setSelectedStudent(null)}
                    student={selectedStudent}
                />
            )}
        </div>
    );
}

function TrendUpOrDown(val: number) {
    if (val >= 75) return TrendingUp;
    if (val < 50) return TrendingDown;
    return Activity;
}

function StudentInterventionRow({ student, onViewProfile }: { student: any, onViewProfile: () => void }) {
    const [drawbacks, setDrawbacks] = useState<any[]>([]);
    const [roadmap, setRoadmap] = useState<any[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fetchAiRecommendations = async () => {
            if (!student) return;
            setIsAiLoading(true);
            try {
                const res = await fetch('/api/ai-recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ student })
                });
                if (res.ok && !cancelled) {
                    const data = await res.json();
                    setDrawbacks(data.drawbacks || []);
                    setRoadmap(data.roadmap || []);
                }
            } catch (error) {
                console.error("Failed to fetch AI recommendations for", student.name, error);
            } finally {
                if (!cancelled) setIsAiLoading(false);
            }
        };
        fetchAiRecommendations();
        return () => { cancelled = true; };
    }, [student.id]);

    // Determine risk level colour from PRI
    const pri = student.pri ?? student.priScore ?? 0;
    const isCritical = pri < 40;
    const isHighRisk = pri < 60;
    const headerBg = isCritical
        ? "bg-red-50/80 dark:bg-red-950/40 border-red-100 dark:border-red-900/50"
        : isHighRisk
            ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50"
            : "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50";
    const riskLabel = isCritical ? "Critical Risk" : isHighRisk ? "High Risk" : "Moderate / Ready";
    const riskBadge = isCritical
        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 border"
        : isHighRisk
            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-200 border"
            : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 border";
    const priColor = isCritical ? "text-red-500" : isHighRisk ? "text-amber-500" : "text-emerald-500";

    return (
        <div className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
            {/* Student Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${headerBg}`}>
                <div className="flex-1 min-w-0">
                    <h4 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2.5 flex-wrap">
                        {student.name}
                        <Badge className={`text-[10px] font-black ${riskBadge}`}>{riskLabel}</Badge>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-bold shadow-sm transition-all duration-200"
                            onClick={onViewProfile}
                        >
                            View Full Profile
                        </Button>
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 font-medium truncate">{student.id} • {student.department}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                    <div className={`text-3xl font-black ${priColor}`}>{pri}%</div>
                    <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider">PRI Score</div>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6 items-start">
                {/* AI Drawbacks — uses correct {drawback, suggestion} shape from API */}
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        🧠 Identified Drawbacks
                    </p>
                    {isAiLoading ? (
                        <div className="flex items-center gap-2 text-slate-500 py-4">
                            <div className="h-4 w-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                            <span className="text-xs font-medium">Analyzing profile data...</span>
                        </div>
                    ) : drawbacks.length > 0 ? (
                        <div className="space-y-4">
                            {(expanded ? drawbacks : drawbacks.slice(0, 3)).map((item: any, gIdx: number) => (
                                <div key={gIdx} className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 shadow-sm flex flex-col gap-2 relative overflow-hidden group/db">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 dark:bg-amber-600 rounded-l-xl opacity-50" />

                                    {/* Fault / Weakness */}
                                    <div className="flex gap-2.5 text-slate-800 dark:text-white pb-2 border-b border-amber-200/50 dark:border-amber-800/50">
                                        <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-black text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400">Fault / Weakness</span>
                                            <p className="font-bold text-sm mt-0.5">{item.drawback}</p>
                                        </div>
                                    </div>

                                    {/* Correction / Fix */}
                                    <div className="flex gap-2.5 text-slate-800 dark:text-white pt-1">
                                        <div className="h-4 w-4 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mt-0.5"><CheckCircle2 className="h-3 w-3" /></div>
                                        <div>
                                            <span className="font-black text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Correction / Idea to Improve</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-0.5">{item.suggestion}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {drawbacks.length > 3 && (
                                <button
                                    onClick={() => setExpanded(p => !p)}
                                    className="text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                >
                                    {expanded ? "Show less ▲" : `+ ${drawbacks.length - 3} more drawbacks ▼`}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 py-3 text-emerald-600 dark:text-emerald-400">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-xs font-semibold">No significant drawbacks identified.</span>
                        </div>
                    )}
                </div>

                {/* AI Recovery Roadmap */}
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        🗺️ Strategic Recovery Roadmap
                    </p>
                    {isAiLoading ? (
                        <div className="flex items-center gap-2 text-slate-500 py-4">
                            <div className="h-4 w-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                            <span className="text-xs font-medium">Generating roadmap...</span>
                        </div>
                    ) : roadmap.length > 0 ? (
                        <div className="space-y-2.5">
                            {roadmap.slice(0, 3).map((phase: any, pIdx: number) => (
                                <div
                                    key={pIdx}
                                    className={`relative pl-4 py-2 pr-2 rounded-r-xl border-l-2 bg-slate-50/80 dark:bg-slate-800/40 ${phase.priority === "Critical" ? "border-l-red-400" :
                                        phase.priority === "High" ? "border-l-amber-400" :
                                            "border-l-blue-400"
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-black text-slate-800 dark:text-white">{phase.week}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${phase.priority === "Critical" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400" :
                                            phase.priority === "High" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400" :
                                                "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                                            }`}>{phase.priority}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">{phase.focus}</p>
                                    <ul className="space-y-0.5">
                                        {phase.tasks.slice(0, 2).map((t: string, tIdx: number) => (
                                            <li key={tIdx} className="flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                                <span className="text-slate-300 mt-0.5">›</span>
                                                <span>{t}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-300 italic py-3">No roadmap generated.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
