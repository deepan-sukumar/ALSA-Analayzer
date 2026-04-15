"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { FileText, TrendingUp, PlusCircle, BrainCircuit, Loader2, ShieldAlert, CheckCircle2, Activity, Calendar, BookOpen, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function buildAcademicFallback(student: any) {
    const records = Array.isArray(student?.academicRecords)
        ? [...student.academicRecords]
            .map((record) => ({
                semester: Number(record?.semester || 0),
                sgpa: Number(record?.sgpa || 0),
                arrears: Number(record?.arrears || 0),
            }))
            .filter((record) => record.semester > 0 && record.sgpa > 0)
            .sort((a, b) => a.semester - b.semester)
        : [];

    const cgpa = Number(student?.cgpa || 0);
    const standingArrears = Number(student?.standingArrears ?? student?.arrears ?? 0);
    const drawbacks: { drawback: string; suggestion: string }[] = [];

    const minSgpa = records.length > 0 ? Math.min(...records.map((record) => record.sgpa)) : 0;
    const maxSgpa = records.length > 0 ? Math.max(...records.map((record) => record.sgpa)) : 0;
    const latest = records.length > 0 ? records[records.length - 1] : null;
    const previous = records.length > 1 ? records[records.length - 2] : null;
    const latestDelta = latest && previous ? latest.sgpa - previous.sgpa : 0;
    const criticalSemesters = records.filter((record) => record.sgpa < 6.5);

    if (standingArrears > 0) {
        drawbacks.push({
            drawback: `Standing arrears are active (${standingArrears}), which can slow academic progress and eligibility.`,
            suggestion: `Prioritize clearing ${standingArrears} pending subject${standingArrears > 1 ? "s" : ""} first with a dedicated weekly revision and test plan.`,
        });
    }

    if (criticalSemesters.length > 0) {
        drawbacks.push({
            drawback: `Low-scoring semesters are still affecting your profile: ${criticalSemesters.map((record) => `Sem ${record.semester} (${record.sgpa.toFixed(2)})`).join(", ")}.`,
            suggestion: "Revisit the lowest-scoring semesters first, identify the weak units, and target stronger recovery in the next result cycle.",
        });
    }

    if (records.length >= 3 && (maxSgpa - minSgpa) >= 1.5) {
        drawbacks.push({
            drawback: `Semester performance is inconsistent, with SGPA ranging from ${minSgpa.toFixed(2)} to ${maxSgpa.toFixed(2)}.`,
            suggestion: "Use a fixed weekly study routine and complete revision before internals so every semester stays more stable.",
        });
    }

    if (latest && previous && latestDelta <= -0.4) {
        drawbacks.push({
            drawback: `Recent academic momentum dropped in Sem ${latest.semester} compared with the previous semester.`,
            suggestion: "Review what changed in workload, preparation pattern, or difficult subjects and correct it early for the next term.",
        });
    }

    if (cgpa > 0 && cgpa < 7.5) {
        drawbacks.push({
            drawback: `CGPA is currently ${cgpa.toFixed(2)}, so there is room to move from average to stronger academic standing.`,
            suggestion: `Set a short-term CGPA target above ${Math.min(9.5, cgpa + 0.5).toFixed(2)} by improving higher-credit subjects first.`,
        });
    }

    if (drawbacks.length === 0) {
        drawbacks.push(
            {
                drawback: "No severe academic blocker is visible, but strong performers still need continuous score conversion to avoid a plateau.",
                suggestion: "Use your best semester as a benchmark and push the next semester one step higher through advanced revision and tighter subject tracking.",
            },
            {
                drawback: "Good grades can still hide topic-level gaps that show up in later semesters or placements.",
                suggestion: "After each semester, list the toughest units and close them with short concept reviews and extra practice.",
            }
        );
    }

    const roadmap = [
        {
            week: "Week 1-2",
            priority: standingArrears > 0 || criticalSemesters.length > 0 ? "Critical" : "High",
            focus: standingArrears > 0 ? "Backlog and Weak Semester Recovery" : "Academic Trend Review",
            tasks: standingArrears > 0
                ? [
                    "List all pending arrear subjects and split them into daily revision targets.",
                    "Start revision from the weakest semester topics first.",
                    "Solve previous university questions for the most difficult papers.",
                ]
                : [
                    "Review your semester trend and mark the lowest-scoring subjects.",
                    "Set one SGPA and CGPA target for the next academic cycle.",
                    "Create a weekly timetable with concept study and revision blocks.",
                ],
        },
        {
            week: "Week 3-4",
            priority: latestDelta < 0 ? "High" : "Moderate",
            focus: "Consistency Improvement",
            tasks: [
                "Track weak topics weekly and convert them into revision checklists.",
                "Attempt one timed test or previous paper every week.",
                "Finish one full revision cycle before internal assessments begin.",
            ],
        },
        {
            week: "Week 5-6",
            priority: "Moderate",
            focus: cgpa >= 8 ? "Sustain Strong Performance" : "CGPA Upgrade Strategy",
            tasks: [
                "Protect high-credit subjects because they move CGPA faster.",
                "Document repeated mistakes from tests and remove them before finals.",
                "Convert strong academic work into projects, certifications, or subject mastery proof.",
            ],
        },
    ];

    return { drawbacks, roadmap };
}

export default function AcademicRecordsPage() {
    const router = useRouter();
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
                    body: JSON.stringify({ student: user, context: 'academic', requestedAt: Date.now() })
                });
                if (res.ok && !cancelled) {
                    const data = await res.json();
                    const fallback = buildAcademicFallback(user);
                    const nextDrawbacks = Array.isArray(data.drawbacks) && data.drawbacks.length > 0 ? data.drawbacks : fallback.drawbacks;
                    const nextRoadmap = Array.isArray(data.roadmap) && data.roadmap.length > 0 ? data.roadmap : fallback.roadmap;
                    setAiDrawbacks(nextDrawbacks);
                    setAiRoadmap(nextRoadmap);
                } else if (!cancelled) {
                    const fallback = buildAcademicFallback(user);
                    setAiDrawbacks(fallback.drawbacks);
                    setAiRoadmap(fallback.roadmap);
                }
            } catch (err) {
                console.error('AI fetch failed', err);
                if (!cancelled) {
                    const fallback = buildAcademicFallback(user);
                    setAiDrawbacks(fallback.drawbacks);
                    setAiRoadmap(fallback.roadmap);
                }
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-1">Student Intelligence Portal</p>
                    <h1 className="text-3xl font-black mb-2 tracking-tight leading-[1.15] pb-1">Academic Records 📚</h1>
                    <p className="text-white/85 font-medium text-sm">Manage your semester grades and view your academic history.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="hover:shadow-xl transition-all cursor-pointer border-none bg-white dark:bg-slate-900 group" onClick={() => router.push("/dashboard/student/academic-records/setup")}>
                    <div className="h-1.5 w-full bg-blue-500 rounded-t-2xl" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                            <PlusCircle className="h-5 w-5 text-blue-500" />
                            Update Grades
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Enter marks for completed semesters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Keep your CGPA up to date by adding your latest semester results.</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all cursor-pointer border-none bg-white dark:bg-slate-900 group" onClick={() => router.push("/dashboard/student/academic-records/transcript")}>
                    <div className="h-1.5 w-full bg-purple-500 rounded-t-2xl" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors">
                            <FileText className="h-5 w-5 text-purple-500" />
                            View Transcript
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Full semester-wise breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Detailed view of all subjects, grades, and credits earned.</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all cursor-pointer border-none bg-white dark:bg-slate-900 group" onClick={() => router.push("/dashboard/student/academic-records/growth")}>
                    <div className="h-1.5 w-full bg-emerald-500 rounded-t-2xl" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Growth Analytics
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400">Visual performance analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Track your GPA progression and consistency over time.</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── System Analysis Section ── */}
            <div className="grid gap-6 md:grid-cols-2 mt-8">
                {/* Identified Drawbacks */}
                <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden relative flex flex-col h-full">
                    <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <BrainCircuit className="h-4 w-4" />
                            </div>
                            Academic Drawbacks
                        </CardTitle>
                        <CardDescription>Personalized improvement areas generated from your academic profile</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        {aiLoading ? (
                            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
                                <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Analyzing your academic data...</p>
                            </div>
                        ) : aiDrawbacks.length > 0 ? (
                            <div className="flex flex-col h-full">
                                <div className="grid gap-3">
                                    {aiDrawbacks.map((item, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col gap-2 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 dark:bg-blue-600 rounded-l-xl opacity-50" />
                                            {/* Fault / Weakness */}
                                            <div className="flex gap-2.5 text-slate-800 dark:text-white pb-2 border-b border-blue-200/50 dark:border-blue-800/50">
                                                <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
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
                                </div>
                                {/* Gap Filler Content */}
                                <div className="mt-auto pt-6">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Real-time Analysis Engine Active</span>
                                        </div>
                                        <Activity className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 py-10 text-center bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 border-dashed">
                                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full mb-3">
                                    <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="font-bold text-emerald-900 dark:text-emerald-300">No Critical Drawbacks Found</p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1 max-w-xs">Your academic profile looks strong! Keep maintaining your current pace.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Academic Enhancement Roadmap */}
                <div className="space-y-4 flex flex-col h-full">
                    <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-700">
                            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-black uppercase text-slate-800 dark:text-white tracking-wide">Academic Enhancement Roadmap</h2>
                    </div>

                    <div className="space-y-3 flex-1">
                        {aiLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                <p className="text-xs font-medium text-slate-500">Generating academic roadmap...</p>
                            </div>
                        ) : aiRoadmap.length > 0 ? (
                            aiRoadmap.slice(0, 6).map((week: any, idx: number) => {
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
                            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3 h-full border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">No recovery plan needed! Your academic profile is on track.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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




