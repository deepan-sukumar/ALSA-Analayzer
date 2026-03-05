"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { onFacultyStudentsSnapshot } from "@/lib/firestore";
import { calculatePRI } from "@/lib/placement-calculations";
import {
    FileText,
    Download,
    TrendingUp,
    Activity,
    PieChart as PieChartIcon,
    Layers,
    GraduationCap,
    AlertCircle,
    Star,
    BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";
import { User as AppUser } from "@/types";

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
                <p className="font-bold text-white/70 mb-0.5">{label}</p>
                <p className="font-black text-lg">{payload[0].value}<span className="text-xs font-normal text-white/50 ml-1">students</span></p>
            </div>
        );
    }
    return null;
};

// ─── Stat Tile ───────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, gradient, ring, icon: Icon }: any) {
    return (
        <div className={`group relative overflow-hidden rounded-2xl p-5 cursor-default transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${gradient} border ${ring}`}>
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 mb-1">{label}</p>
                    <p className="text-4xl font-black text-white leading-none">{value}</p>
                    {sub && <p className="text-[11px] font-semibold text-white/50 mt-2">{sub}</p>}
                </div>
                <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors shadow-inner">
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>
        </div>
    );
}

export default function FacultyReportsPage() {
    const { user: facultyUser } = useAuth();
    const [allStudents, setAllStudents] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!facultyUser || !facultyUser.department) { setLoading(false); return; }
        const unsubscribe = onFacultyStudentsSnapshot(facultyUser.department, (students) => {
            setAllStudents(students as AppUser[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [facultyUser]);

    const reportData = useMemo(() => {
        const count = allStudents.length;
        if (count === 0) return null;

        let totalPRI = 0, totalCGPA = 0, validCGPACount = 0, totalArrears = 0;
        const riskDistribution = { Ready: 0, Moderate: 0, High: 0, Critical: 0 };
        const cgpaBuckets: Record<string, number> = { "9+": 0, "8-9": 0, "7-8": 0, "6-7": 0, "<6": 0 };
        const moduleWeakness: Record<string, number> = { Academic: 0, Core: 0, Role: 0, Aptitude: 0, Enrichment: 0 };

        allStudents.forEach(student => {
            const pri = student.priScore || 0;
            const rawCGPA = student.cgpa;
            const cgpa = (rawCGPA !== undefined && rawCGPA !== null && String(rawCGPA) !== "") ? parseFloat(String(rawCGPA)) : 0;
            const priData = calculatePRI(student);

            totalPRI += pri;
            if (!Number.isNaN(cgpa) && cgpa > 0) { totalCGPA += cgpa; validCGPACount++; }
            totalArrears += (student.standingArrears || student.arrears || 0);

            if (pri >= 75) riskDistribution.Ready++;
            else if (pri >= 60) riskDistribution.Moderate++;
            else if (pri >= 40) riskDistribution.High++;
            else riskDistribution.Critical++;

            if (cgpa >= 9) cgpaBuckets["9+"]++;
            else if (cgpa >= 8) cgpaBuckets["8-9"]++;
            else if (cgpa >= 7) cgpaBuckets["7-8"]++;
            else if (cgpa >= 6) cgpaBuckets["6-7"]++;
            else cgpaBuckets["<6"]++;

            const bd = priData.breakDown;
            const scores = [
                { name: "Academic", score: bd.academic }, { name: "Core", score: bd.core },
                { name: "Role", score: bd.role }, { name: "Aptitude", score: bd.aptitude },
                { name: "Enrichment", score: bd.enrichment }
            ];
            const weakest = scores.reduce((p, c) => p.score < c.score ? p : c);
            moduleWeakness[weakest.name]++;
        });

        const weaknessColors: Record<string, string> = {
            Academic: "#8b5cf6", Core: "#3b82f6", Role: "#10b981", Aptitude: "#f59e0b", Enrichment: "#ef4444"
        };

        return {
            avgPRI: Math.round(totalPRI / count),
            avgCGPA: validCGPACount > 0 ? (totalCGPA / validCGPACount).toFixed(2) : "0.00",
            validCGPAStudents: validCGPACount,
            totalArrears,
            criticalCount: riskDistribution.Critical,
            riskBreakdown: [
                { name: "Ready", value: riskDistribution.Ready, fill: "#22c55e" },
                { name: "Moderate", value: riskDistribution.Moderate, fill: "#6366f1" },
                { name: "High", value: riskDistribution.High, fill: "#f97316" },
                { name: "Critical", value: riskDistribution.Critical, fill: "#ef4444" }
            ].filter(r => r.value > 0),
            cgpaDistribution: Object.entries(cgpaBuckets).map(([key, val]) => ({ name: key, count: val })),
            weaknessHeatmap: Object.entries(moduleWeakness).map(([key, val]) => ({ name: key, students: val, color: weaknessColors[key] })),
            studentDetails: allStudents.map(student => {
                const pri = student.priScore || 0;
                const priData = calculatePRI(student);
                let tier = pri >= 75 ? "Ready" : pri >= 60 ? "Moderate" : pri >= 40 ? "High" : "Critical";
                return {
                    name: student.name,
                    pri,
                    risk: tier,
                    cgpa: student.cgpa || 0,
                    missingCore: 100 - (priData.breakDown.coreNormalized || 0)
                };
            }).sort((a, b) => a.pri - b.pri)
        };
    }, [allStudents]);

    const exportData = () => {
        const fileName = `Department_Report_${facultyUser?.department}_${new Date().toISOString().split("T")[0]}.csv`;
        alert(`Generating and downloading ${fileName}...`);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-sm font-bold text-slate-400 dark:text-slate-300 animate-pulse">Generating Live Academic Report...</p>
        </div>
    );

    if (!reportData) return (
        <div className="flex flex-col items-center justify-center h-48 gap-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/40">
            <Activity className="h-10 w-10 text-slate-300" />
            <p className="text-slate-400 dark:text-slate-300 font-medium italic">No students registered in your department yet.</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 px-1">

            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-xl p-7">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Faculty Intelligence Portal</p>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Academic Reports</h1>
                        <p className="text-white/60 font-medium text-sm">
                            Department-level performance summaries — <span className="text-white/90 font-bold">{facultyUser?.department}</span>
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={exportData}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-colors border border-white/20"
                        >
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 text-sm font-black shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] transition-all"
                        >
                            <FileText className="h-4 w-4" /> Print PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KPI Tiles ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatTile
                    label="Dept Avg PRI"
                    value={`${reportData.avgPRI}%`}
                    sub="Professional Readiness"
                    icon={TrendingUp}
                    gradient={`bg-gradient-to-br ${reportData.avgPRI >= 75 ? "from-emerald-500 to-emerald-700" : reportData.avgPRI >= 60 ? "from-indigo-500 to-indigo-700" : "from-amber-500 to-orange-600"}`}
                    ring="border-white/20"
                />
                <StatTile
                    label="Average CGPA"
                    value={reportData.avgCGPA}
                    sub={`${reportData.validCGPAStudents} students`}
                    icon={GraduationCap}
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-700"
                    ring="border-blue-400/30"
                />
                <StatTile
                    label="Total Arrears"
                    value={reportData.totalArrears}
                    sub="Standing in dept"
                    icon={BookOpen}
                    gradient="bg-gradient-to-br from-orange-400 to-orange-700"
                    ring="border-orange-400/30"
                />
                <StatTile
                    label="Critical Cases"
                    value={reportData.criticalCount}
                    sub="Immediate focus required"
                    icon={AlertCircle}
                    gradient="bg-gradient-to-br from-rose-500 to-red-700"
                    ring="border-rose-400/30"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* CGPA Distribution */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                    <div className="px-6 py-5 border-b bg-blue-50/60 dark:bg-blue-950/20 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-black text-sm text-slate-800 dark:text-white">CGPA Distribution</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-300">Students per grade bracket</p>
                        </div>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={reportData.cgpaDistribution} margin={{ left: 0, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={700} tick={{ fill: "#64748b" }} />
                                <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: "#94a3b8" }} />
                                <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)", radius: 8 }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Breakdown Pie */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                    <div className="px-6 py-5 border-b bg-rose-50/60 dark:bg-rose-950/20 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50">
                            <PieChartIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="font-black text-sm text-slate-800 dark:text-white">Risk Level Breakdown</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-300">Cohort by Professional Readiness Index</p>
                        </div>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={reportData.riskBreakdown}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={6}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {reportData.riskBreakdown.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    formatter={(value) => <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Module Weakness Heatmap ── */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                <div className="px-6 py-5 border-b bg-amber-50/60 dark:bg-amber-950/20 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                        <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="font-black text-sm text-slate-800 dark:text-white">Professional Development Blockers</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-300">Primary module weakness per student count</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {reportData.weaknessHeatmap.map((item) => {
                            const isHigh = item.students > Math.max(...reportData.weaknessHeatmap.map(x => x.students)) * 0.5;
                            return (
                                <div
                                    key={item.name}
                                    className="group relative overflow-hidden rounded-2xl p-5 border-2 border-dashed border-slate-100 dark:border-slate-700/60 hover:border-transparent hover:shadow-lg transition-all duration-300 cursor-default text-center flex flex-col items-center gap-2"
                                    style={{ "--hover-color": item.color } as any}
                                >
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{ background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)` }} />
                                    <span
                                        className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-300 group-hover:font-extrabold transition-colors"
                                        style={{ color: undefined }}
                                    >
                                        {item.name}
                                    </span>
                                    <span
                                        className="relative z-10 text-4xl font-black transition-colors duration-300"
                                        style={{ color: item.color }}
                                    >
                                        {item.students}
                                    </span>
                                    <span className="relative z-10 text-[10px] font-bold text-slate-400 dark:text-slate-300">Students</span>
                                    {isHigh && (
                                        <span className="relative z-10 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: item.color }}>
                                            High Risk
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Student Performance Log ── */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                <div className="px-6 py-5 border-b bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                        <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="font-black text-sm text-slate-800 dark:text-white">Student Performance Log</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-300">Comprehensive metrics for all department students</p>
                    </div>
                    <span className="ml-auto text-[11px] font-black text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-3 py-1 rounded-full">
                        {reportData.studentDetails.length} students
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60">
                                <th className="py-4 px-6 font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-white text-left">Student</th>
                                <th className="py-4 px-4 font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-white text-left">PRI</th>
                                <th className="py-4 px-4 font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-white text-left">Risk</th>
                                <th className="py-4 px-4 font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-white text-left">CGPA</th>
                                <th className="py-4 px-4 font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-white text-left">Core Gap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.studentDetails.map((student, idx) => {
                                const priColor = student.pri < 40 ? "text-red-600" : student.pri < 60 ? "text-orange-500" : student.pri < 75 ? "text-amber-600" : "text-emerald-600";
                                const riskBadge = student.pri < 40 ? "bg-red-500 text-white" : student.pri < 60 ? "bg-orange-500 text-white" : student.pri < 75 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white";
                                return (
                                    <tr
                                        key={idx}
                                        className="group border-b border-slate-100 dark:border-slate-700/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors duration-200 cursor-default"
                                    >
                                        <td className="py-3.5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-950/60 to-violet-100 dark:to-violet-950/60 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    {student.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:text-indigo-400 transition-colors">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`text-xl font-black ${priColor}`}>{student.pri}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-300 ml-0.5">%</span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${riskBadge} shadow-sm`}>{student.risk}</span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-black text-slate-700 dark:text-slate-200 dark:text-slate-100">{student.cgpa}</span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black ${student.missingCore > 50 ? "text-red-500" : "text-indigo-600 dark:text-indigo-400"}`}>
                                                    {student.missingCore}%
                                                </span>
                                                <div className="w-20 h-2 bg-slate-100 dark:bg-slate-900/50 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${student.missingCore > 50 ? "bg-red-500" : "bg-indigo-500"}`}
                                                        style={{ width: `${Math.min(student.missingCore, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
