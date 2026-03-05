"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { onFacultyStudentsSnapshot } from "@/lib/firestore";
import { calculatePRI } from "@/lib/placement-calculations";
import {
    Activity,
    AlertTriangle,
    ShieldAlert,
    TrendingDown,
    Search,
    ArrowLeft,
    Eye,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { User as AppUser } from "@/types";
import { StudentDetailsSheet } from "@/components/student-details-sheet";
import { useRouter } from "next/navigation";

export default function RiskMonitorPage() {
    const { user: facultyUser } = useAuth();
    const router = useRouter();
    const [allStudents, setAllStudents] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<AppUser | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!facultyUser || !facultyUser.department) {
            setLoading(false);
            return;
        }
        const facultyDept = facultyUser.department;
        const unsubscribe = onFacultyStudentsSnapshot(facultyDept, (students) => {
            setAllStudents(students as AppUser[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [facultyUser]);

    const analyzedStudents = useMemo(() => {
        return allStudents.map(student => {
            const priData = calculatePRI(student);
            let riskCategory = student.riskLevel || "High";
            const breakdown = priData.breakDown;
            const scores = [
                { name: "Academic", score: breakdown.academic },
                { name: "Core", score: breakdown.core },
                { name: "Role Fit", score: breakdown.role },
                { name: "Aptitude", score: breakdown.aptitude },
                { name: "Enrichment", score: breakdown.enrichment }
            ];
            const weakestModule = scores.reduce((prev, curr) => (prev.score < curr.score) ? prev : curr).name;
            return {
                ...student,
                calculatedPRI: student.priScore || 0,
                riskCategory,
                arrears: student.standingArrears || student.arrears || 0,
                weakestModule,
                lastUpdated: (student as any).updatedAt?.toDate?.().toLocaleDateString() || "Recently"
            };
        });
    }, [allStudents]);

    const filteredStudents = useMemo(() => {
        let result = analyzedStudents.filter(s => s.calculatedPRI < 75);
        if (searchQuery.trim() !== "") {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lowerQ) ||
                (s.registerNumber && s.registerNumber.toLowerCase().includes(lowerQ)) ||
                (s.registerNo && s.registerNo.toLowerCase().includes(lowerQ))
            );
        }
        return result.sort((a, b) => a.calculatedPRI - b.calculatedPRI);
    }, [analyzedStudents, searchQuery]);

    const stats = useMemo(() => {
        const atRisk = analyzedStudents.filter(s => s.calculatedPRI < 75);
        let critical = 0, high = 0, moderate = 0;
        atRisk.forEach(s => {
            if (s.riskCategory === "Critical") critical++;
            else if (s.riskCategory === "High") high++;
            else if (s.riskCategory === "Moderate") moderate++;
        });
        return { critical, high, moderate };
    }, [analyzedStudents]);

    const riskConfig = (cat: string) => {
        switch (cat) {
            case "Critical": return { text: "text-red-700", bg: "bg-red-100 dark:bg-red-900/50", border: "border-red-200", badge: "bg-red-500 text-white" };
            case "High": return { text: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/50", border: "border-orange-200", badge: "bg-orange-500 text-white" };
            case "Moderate": return { text: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/50", border: "border-amber-200", badge: "bg-amber-500 text-white" };
            default: return { text: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/50", border: "border-emerald-200", badge: "bg-emerald-500 text-white" };
        }
    };

    const priColor = (pri: number) =>
        pri < 40 ? "text-red-600" : pri < 60 ? "text-orange-500" : "text-blue-600";

    return (
        <div className="space-y-8 animate-in fade-in duration-500 px-1">

            {/* ── Page Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-orange-600 shadow-xl p-7">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Faculty Intelligence Portal</p>
                        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Risk Monitoring Center</h1>
                        <p className="text-white/60 font-medium text-sm">Coordinate interventions for at-risk students — <span className="text-white/90 font-bold">{facultyUser?.department}</span></p>
                    </div>
                </div>
            </div>

            {/* ── Risk Stat Cards ── */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/30 p-5 cursor-default hover:scale-[1.02] hover:shadow-2xl transition-all duration-300">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 mb-1">Critical Risk</p>
                            <p className="text-5xl font-black text-white">{stats.critical}</p>
                            <p className="text-[11px] font-bold text-white/50 mt-2">PRI Below 40 · Immediate intervention</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                            <ShieldAlert className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-orange-700 border border-orange-400/30 p-5 cursor-default hover:scale-[1.02] hover:shadow-2xl transition-all duration-300">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 mb-1">High Risk</p>
                            <p className="text-5xl font-black text-white">{stats.high}</p>
                            <p className="text-[11px] font-bold text-white/50 mt-2">PRI 40–59 · Skill gaps detected</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                            <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-400/30 p-5 cursor-default hover:scale-[1.02] hover:shadow-2xl transition-all duration-300">
                    <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 mb-1">Moderate Risk</p>
                            <p className="text-5xl font-black text-white">{stats.moderate}</p>
                            <p className="text-[11px] font-bold text-white/50 mt-2">PRI 60–74 · Needs roadmap guidance</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                            <TrendingDown className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Student Table ── */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl border-0 overflow-hidden">
                {/* Table Header / Search */}
                <div className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50">
                            <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h2 className="font-black text-sm text-slate-800 dark:text-white">At-Risk Student Registry</h2>
                            <p className="text-[11px] text-slate-400 dark:text-slate-300">{filteredStudents.length} students requiring attention</p>
                        </div>
                    </div>
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-300" />
                        <Input
                            placeholder="Search students..."
                            className="pl-9 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all rounded-xl text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="h-10 w-10 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-300 animate-pulse">Synchronizing Risk Metrics...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-800 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700/80 border-b border-slate-700">
                                    <TableHead className="font-extrabold text-white dark:text-white py-4 pl-6 text-xs uppercase tracking-wider">Student</TableHead>
                                    <TableHead className="font-extrabold text-white dark:text-white text-xs uppercase tracking-wider">PRI</TableHead>
                                    <TableHead className="font-extrabold text-white dark:text-white text-xs uppercase tracking-wider">Risk Level</TableHead>
                                    <TableHead className="font-extrabold text-white dark:text-white text-xs uppercase tracking-wider">Arrears</TableHead>
                                    <TableHead className="font-extrabold text-white dark:text-white text-xs uppercase tracking-wider">Weakest Module</TableHead>
                                    <TableHead className="font-extrabold text-white dark:text-white text-xs uppercase tracking-wider text-right pr-6">Last Updated</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-36">
                                            <div className="flex flex-col items-center gap-2">
                                                <Zap className="h-6 w-6 text-slate-300" />
                                                <p className="text-sm font-bold text-slate-400 dark:text-slate-300 italic">No students found matching current risk criteria.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const rc = riskConfig(student.riskCategory);
                                        return (
                                            <TableRow
                                                key={student.id}
                                                className="group border-b border-slate-100 dark:border-slate-700/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors duration-200 cursor-default"
                                            >
                                                <TableCell className="pl-6 h-16">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 dark:text-slate-200 shrink-0">
                                                            {student.name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-indigo-700 dark:text-indigo-400 transition-colors">{student.name}</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-300">{student.registerNumber || student.registerNo || "—"}</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-[11px] font-bold ml-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all duration-200"
                                                            onClick={() => setSelectedStudent(student)}
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Profile
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-2xl font-black ${priColor(student.calculatedPRI)}`}>
                                                        {student.calculatedPRI}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-300 font-bold ml-0.5">%</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${rc.badge}`}>
                                                        {student.riskCategory}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {(student.arrears ?? 0) > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500 text-white">
                                                            {student.arrears} Arrear{(student.arrears ?? 0) > 1 ? "s" : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
                                                            ✓ Clear
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400">
                                                        {student.weakestModule}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-400 dark:text-slate-300 font-medium text-right pr-6">{student.lastUpdated}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <StudentDetailsSheet
                open={!!selectedStudent}
                onOpenChange={(open) => !open && setSelectedStudent(null)}
                student={selectedStudent}
            />
        </div>
    );
}
