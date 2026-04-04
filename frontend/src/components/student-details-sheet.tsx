"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Mail,
    Phone,
    Calendar,
    Award,
    Trophy,
    Briefcase,
    Activity,
    GraduationCap,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    ShieldAlert,
    BookOpen,
    Code,
    Database,
    Target,
    BrainCircuit,
    Loader2,
    Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { calculateReadinessScore, getRiskLevel } from "@/lib/faculty-logic";
import { useEffect, useState } from "react";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface StudentDetailsSheetProps {
    student: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleteSuccess?: (studentId: string) => void;
}

export function StudentDetailsSheet({ student, open, onOpenChange, onDeleteSuccess }: StudentDetailsSheetProps) {
    if (!student) return null;

    // Aggregate Data for Display
    const legacyCerts = student.certifications || [];
    const aoiEnrichment = student.academicEnrichment || [];
    const legacyEnrichment = student.enrichment || [];
    const aoiApplied = student.appliedKnowledge || [];

    // Merge for portfolio display
    const allCerts = [...legacyCerts, ...aoiEnrichment.filter((i: any) => i.type === "Certification").map((i: any) => ({
        name: i.title || i.name,
        issuer: i.organization || i.issuer,
        date: i.date,
        verified: true
    }))];

    const allEnrichment = [...legacyEnrichment, ...aoiApplied, ...aoiEnrichment.filter((i: any) => i.type !== "Certification")];

    const readinessScore = calculateReadinessScore(student);
    const riskLevel = getRiskLevel(readinessScore);

    const [drawbacks, setDrawbacks] = useState<any[]>([]);
    const [roadmap, setRoadmap] = useState<any[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchVerificationHistory = async () => {
            if (!student?.id || !open) return;
            try {
                const q = query(
                    collection(db, "verificationResults"),
                    where("userId", "==", student.id)
                );
                const snap = await getDocs(q);
                const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                rows.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                setVerificationHistory(rows);
            } catch (error) {
                console.error("Error fetching verification history:", error);
            }
        };

        fetchVerificationHistory();
    }, [student?.id, open]);

    useEffect(() => {
        const fetchAiRecommendations = async () => {
            if (!student || !open) return;

            setIsAiLoading(true);
            try {
                const res = await fetch('/api/ai-recommendations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ student })
                });

                if (res.ok) {
                    const data = await res.json();
                    setDrawbacks(data.drawbacks || []);
                    setRoadmap(data.roadmap || []);
                }
            } catch (error) {
                console.error("Failed to fetch AI recommendations", error);
            } finally {
                setIsAiLoading(false);
            }
        };

        fetchAiRecommendations();
    }, [student, open]);

    const getRiskColor = (risk: string) => {
        switch (risk.toLowerCase()) {
            case "low": return "text-green-600 bg-green-100 dark:bg-green-900/50 border-green-200";
            case "moderate": return "text-yellow-600 bg-yellow-100 border-yellow-200";
            case "high": return "text-red-600 bg-red-100 dark:bg-red-900/50 border-red-200";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    const handleStudentDelete = async () => {
        if (!student?.id) return;
        const confirmDelete = window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete student ${student.name}? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "users", student.id));
            toast.success(`Successfully deleted student: ${student.name}`);
            onOpenChange(false);
            if (onDeleteSuccess) onDeleteSuccess(student.id);
        } catch (error) {
            console.error("Error deleting student:", error);
            toast.error("Failed to delete student. Check console or permissions.");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-3xl w-full flex flex-col h-full p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 dark:bg-slate-950">
                <SheetHeader className="sr-only">
                    <SheetTitle>Student Profile Details</SheetTitle>
                    <SheetDescription>Detailed view of the student&apos;s academic, portfolio, and placement metrics.</SheetDescription>
                </SheetHeader>
                {/* Header Section - Modernized & Compact */}
                <div className="bg-white dark:bg-slate-900 relative z-10 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                    {/* Top Decorative Bar */}
                    <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    <div className="p-5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-slate-100 dark:border-slate-700/60 shadow-sm">
                                    <AvatarImage src={`https://avatar.iran.liara.run/public/${student.gender === 'FEMALE' ? 'girl' : 'boy'}`} />
                                    <AvatarFallback>{student.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>

                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
                                        {student.name}
                                        <Badge className={`${getRiskColor(riskLevel)} bg-opacity-10 border shadow-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md`}>
                                            {riskLevel} Risk
                                        </Badge>
                                        
                                        {/* Latest Score & Total Attempts Summary */}
                                        {verificationHistory.length > 0 && (
                                            <div className="flex items-center gap-1.5 ml-1">
                                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-md shadow-sm">
                                                    <ShieldAlert className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-300">
                                                        {verificationHistory.length} Attempts
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-md shadow-sm">
                                                    <Target className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                                                        Latest: {verificationHistory[0].score}/10
                                                    </span>
                                                </div>
                                                {verificationHistory[0].passed && (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0 h-4">VERIFIED</Badge>
                                                )}
                                            </div>
                                        )}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">{student.registerNumber || student.registerNo || "N/A"}</Badge>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" /> {student.department}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {student.email || "No email"}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {student.phone || "No phone"}</span>
                                        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Batch 2022-2026</span>
                                    </div>
                                </div>
                            </div>
 
                             <Button variant="outline" size="sm" onClick={handleStudentDelete} className="text-red-600 dark:text-red-400 font-bold border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm hidden md:flex">
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Remove Student
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modern Pill Tabs Section */}
                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-950">
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm z-0">
                        <TabsList className="bg-slate-100 dark:bg-slate-900/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 h-auto w-full md:w-fit rounded-full flex gap-1 mx-auto overflow-x-auto">
                            <TabsTrigger value="overview" className="rounded-full px-5 py-2 text-xs font-bold data-[state=active]:bg-white dark:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-700 dark:text-indigo-400 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-sm transition-all duration-300">Overview</TabsTrigger>
                            <TabsTrigger value="academic" className="rounded-full px-5 py-2 text-xs font-bold data-[state=active]:bg-white dark:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-700 dark:text-indigo-400 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-sm transition-all duration-300">Academic</TabsTrigger>
                            <TabsTrigger value="placement" className="rounded-full px-5 py-2 text-xs font-bold data-[state=active]:bg-white dark:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-700 dark:text-indigo-400 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-sm transition-all duration-300">Placement</TabsTrigger>
                            <TabsTrigger value="portfolio" className="rounded-full px-5 py-2 text-xs font-bold data-[state=active]:bg-white dark:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-700 dark:text-indigo-400 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-sm transition-all duration-300">Portfolio</TabsTrigger>
                            <TabsTrigger value="verification" className="rounded-full px-5 py-2 text-xs font-bold data-[state=active]:bg-white dark:bg-slate-900 dark:data-[state=active]:bg-slate-700 data-[state=active]:text-indigo-700 dark:text-indigo-400 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-sm transition-all duration-300 text-amber-600 dark:text-amber-400">Verification Logs</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 border-none shadow-md overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardContent className="p-5 flex items-center justify-between relative z-10">
                                            <div>
                                                <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-1">Readiness PRI</p>
                                                <div className="flex items-baseline gap-1">
                                                    <div className="text-4xl font-black text-white">{readinessScore}</div>
                                                    <span className="text-indigo-200 font-bold text-sm">/100</span>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <TrendingUp className="h-6 w-6 text-white" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Certs Verified</p>
                                                <div className="text-4xl font-black text-slate-800 dark:text-white">{allCerts.length}</div>
                                            </div>
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl">
                                                <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Enrichment</p>
                                                <div className="text-4xl font-black text-slate-800 dark:text-white">{allEnrichment.length}</div>
                                            </div>
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/40 rounded-xl">
                                                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Summary Analysis */}
                                <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                    <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/60">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                            <ShieldAlert className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Faculty Insights & Intelligence
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 bg-white dark:bg-slate-900">
                                        <div className="space-y-4">
                                            {isAiLoading ? (
                                                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                    <p className="text-sm font-medium">Generating Faculty Insights...</p>
                                                </div>
                                            ) : drawbacks.length > 0 ? (
                                                <div className="grid gap-3">
                                                    {drawbacks.map((item, idx) => (
                                                        <div key={idx} className="p-4 rounded-xl border bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col gap-2 relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 dark:bg-amber-600 rounded-l-xl opacity-50" />

                                                            {/* Fault / Weakness */}
                                                            <div className="flex gap-2.5 text-slate-800 dark:text-white pb-2 border-b border-amber-200/50 dark:border-amber-800/50">
                                                                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
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
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 text-center bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 border-dashed">
                                                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full mb-3">
                                                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <p className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">Elite Profile Performance</p>
                                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1 max-w-sm">This student is currently exceeding all Readiness benchmarks according to our AI analytics models.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ACADEMIC TAB */}
                            <TabsContent value="academic" className="mt-0 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Aggregate CGPA</p>
                                            <div className="text-5xl font-black text-indigo-700 dark:text-indigo-400 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40 w-full py-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">{student.cgpa || "N/A"}</div>
                                        </CardContent>
                                    </Card>
                                    <Card className={student.standingArrears > 0 ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 shadow-sm" : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 shadow-sm"}>
                                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${student.standingArrears > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>Standing Arrears</p>
                                            <div className={`text-5xl font-black w-full py-4 rounded-xl border ${student.standingArrears > 0 ? "text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800" : "text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800"}`}>
                                                {student.standingArrears || 0}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                                    <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Semester-wise Academic Records
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {student.academicRecords && student.academicRecords.length > 0 ? (
                                                student.academicRecords
                                                    .slice()
                                                    .sort((a: any, b: any) => a.semester - b.semester)
                                                    .map((record: any, idx: number) => {
                                                        const sgpa = record.sgpa ?? record.gpa ?? null;
                                                        const hasArrear = (record.arrears ?? 0) > 0;
                                                        const sgpaColor =
                                                            sgpa === null ? "text-slate-400 dark:text-slate-500" :
                                                                sgpa >= 9 ? "text-emerald-600 dark:text-emerald-400" :
                                                                    sgpa >= 7.5 ? "text-indigo-600 dark:text-indigo-400" :
                                                                        sgpa >= 6 ? "text-amber-500 dark:text-amber-400" :
                                                                            "text-rose-500 dark:text-rose-400";
                                                        const sgpaBg =
                                                            sgpa === null ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/60" :
                                                                sgpa >= 9 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50" :
                                                                    sgpa >= 7.5 ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50" :
                                                                        sgpa >= 6 ? "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50" :
                                                                            "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50";
                                                        return (
                                                            <div key={idx} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${sgpaBg} transition-all hover:shadow-sm`}>
                                                                <div>
                                                                    <p className="font-black text-sm text-slate-800 dark:text-white tracking-tight">Semester {record.semester}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        {hasArrear ? (
                                                                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                                                                {record.arrears} Arrear{record.arrears > 1 ? "s" : ""}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                                                                Clear
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <span className={`text-2xl font-black ${sgpaColor}`}>
                                                                        {sgpa !== null ? Number(sgpa).toFixed(2) : "—"}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">SGPA</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="text-center py-6">
                                                    <p className="text-sm text-muted-foreground italic">No semester records available.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* PLACEMENT TAB */}
                            <TabsContent value="placement" className="mt-0 space-y-6">
                                <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                    <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 bg-blue-50/60 dark:bg-blue-950/20">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                            <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Core Assessment Scores
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 bg-white dark:bg-slate-900">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-white">
                                                    <span>Aptitude Score</span>
                                                    <span>{student.placementMetrics?.aptitudeScore || 0}%</span>
                                                </div>
                                                <Progress value={student.placementMetrics?.aptitudeScore || 0} className="h-2" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-white">
                                                    <span>Coding Score</span>
                                                    <span>{student.placementMetrics?.codingScore || 0}%</span>
                                                </div>
                                                <Progress value={student.placementMetrics?.codingScore || 0} className="h-2" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-white">
                                                    <span>Communication Score</span>
                                                    <span>{student.placementMetrics?.communicationScore || 0}%</span>
                                                </div>
                                                <Progress value={student.placementMetrics?.communicationScore || 0} className="h-2" />
                                            </div>
                                            {student.placementMetrics?.mockInterviewScore !== undefined && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm font-bold text-muted-foreground">
                                                        <span>Mock Interview Score</span>
                                                        <span>{student.placementMetrics.mockInterviewScore}%</span>
                                                    </div>
                                                    <Progress value={student.placementMetrics.mockInterviewScore} className="h-2 opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {student.roleTrackProfile && (
                                    <Card className="border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900 shadow-sm mt-4 overflow-hidden">
                                        <CardHeader className="py-4 border-b border-slate-200 dark:border-slate-700 bg-indigo-50/60 dark:bg-indigo-950/20">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Professional Track Alignment
                                            </CardTitle>
                                            <CardDescription className="text-xs">Mapped Career Trajectory</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Selected Track</span>
                                                <span className="font-black text-lg">{student.roleTrackProfile.trackSelected || student.outcomeAlignment?.trackSelected || "Not Selected"}</span>
                                            </div>
                                            <div className="p-5 space-y-6 bg-white dark:bg-slate-900">
                                                <div>
                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                                                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" /> Core Competencies <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        {student.roleTrackProfile.concepts?.core && student.roleTrackProfile.concepts.core.length > 0 ? (
                                                            student.roleTrackProfile.concepts.core.map((concept: string, idx: number) => (
                                                                <Badge key={idx} variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200 shadow-sm">
                                                                    {concept}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">No core concepts selected</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-center">Intermediate Skills</h4>
                                                        <div className="flex flex-wrap gap-2 justify-center">
                                                            {student.roleTrackProfile.concepts?.intermediate && student.roleTrackProfile.concepts.intermediate.length > 0 ? (
                                                                student.roleTrackProfile.concepts.intermediate.map((concept: string, idx: number) => (
                                                                    <Badge key={idx} variant="outline" className="px-2 py-1 bg-white dark:bg-slate-900 dark:bg-slate-700 shadow-sm border-slate-200 dark:border-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                                                                        {concept}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">None selected</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner">
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">Advanced / Niche Skills</h4>
                                                        <div className="flex flex-wrap gap-2 justify-center">
                                                            {student.roleTrackProfile.concepts?.advanced && student.roleTrackProfile.concepts.advanced.length > 0 ? (
                                                                student.roleTrackProfile.concepts.advanced.map((concept: string, idx: number) => (
                                                                    <Badge key={idx} variant="default" className="px-2 py-1 bg-slate-700 text-white hover:bg-slate-600 border border-slate-600">
                                                                        {concept}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 italic">None selected</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {student.coreAcademicTopics && Object.keys(student.coreAcademicTopics).length > 0 && (
                                    <Card className="border-emerald-200 shadow-sm mt-4 overflow-hidden">
                                        <CardHeader className="py-4 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-950/20">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                                <BrainCircuit className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Core Engineering & Aptitude Topics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 bg-white dark:bg-slate-900">
                                            <div className="grid grid-cols-1 gap-4">
                                                {Object.entries(student.coreAcademicTopics).map(([domain, topics]: [string, any], domainIdx: number) => {
                                                    if (!topics || topics.length === 0) return null;
                                                    return (
                                                        <div key={domainIdx} className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 dark:text-emerald-400 mb-3 border-b border-emerald-100/50 dark:border-emerald-900/30 pb-2">{domain}</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {topics.map((topic: string, tIdx: number) => (
                                                                    <Badge key={tIdx} variant="outline" className="text-[11px] bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 dark:border-slate-600 shadow-sm py-1">
                                                                        {topic}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* PORTFOLIO TAB */}
                            <TabsContent value="portfolio" className="mt-0 space-y-6">
                                <div className="grid gap-6">
                                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-950/20">
                                            <CardTitle className="text-sm flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Verified Certifications
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 bg-white dark:bg-slate-900">
                                            <div className="space-y-3">
                                                {allCerts.length > 0 ? allCerts.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700/60 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/60 transition-colors shadow-sm">
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</p>
                                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{item.issuer} • <span className="text-emerald-600 dark:text-emerald-400">{item.date || "Ongoing"}</span></p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px] uppercase bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-none shadow-sm">Verified ✔</Badge>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400 text-center py-6 italic border-2 border-dashed border-slate-100 dark:border-slate-700/60 dark:border-slate-700 rounded-xl">No verified certifications found in portfolio.</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 bg-purple-50/60 dark:bg-purple-950/20">
                                            <CardTitle className="text-sm flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Academic & Extracurricular Enrichment
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 bg-white dark:bg-slate-900">
                                            <div className="space-y-3">
                                                {allEnrichment.length > 0 ? allEnrichment.map((item: any, idx: number) => (
                                                    <div key={idx} className="p-4 border border-slate-100 dark:border-slate-700/60 rounded-xl bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/60 transition-colors shadow-sm">
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{item.title || item.name}</p>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{item.organization || item.issuer || "University Platform"}</p>
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 dark:bg-slate-700 border-slate-200 dark:border-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-200 dark:text-slate-300 shadow-sm">{item.type || "Workshop"}</Badge>
                                                            <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900 dark:bg-slate-700 border-slate-200 dark:border-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-200 dark:text-slate-300 shadow-sm">{item.level || "Institutional"}</Badge>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400 text-center py-6 italic border-2 border-dashed border-slate-100 dark:border-slate-700/60 dark:border-slate-700 rounded-xl">No enrichment activities recorded.</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* VERIFICATION TAB */}
                            <TabsContent value="verification" className="mt-0 space-y-6">
                                <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-l-4 border-l-amber-500">
                                    <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-700 bg-amber-50/30 dark:bg-amber-950/20">
                                        <CardTitle className="text-sm flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Topic Verification Attempt History
                                        </CardTitle>
                                        <CardDescription className="text-xs">Security logs for AI-generated concept validation tests</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-5">
                                        <div className="space-y-4">
                                            {verificationHistory.length > 0 ? (
                                                verificationHistory.map((log, idx) => (
                                                    <div key={idx} className={`p-4 rounded-xl border transition-all hover:shadow-md ${log.passed ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50' : 'bg-red-50/30 dark:bg-red-950/20 border-red-100 dark:border-red-900/50'}`}>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={log.passed ? "bg-emerald-600" : "bg-red-600"}>
                                                                        {log.passed ? "PASSED" : "FAILED"}
                                                                    </Badge>
                                                                    <span className="text-xs font-bold text-slate-500">Attempt #{log.attemptNumber || 1}</span>
                                                                </div>
                                                                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mt-2">Topics Tested:</p>
                                                                <p className="text-xs font-bold text-slate-700 dark:text-white mt-0.5">
                                                                    {Array.isArray(log.topicsVerified) ? log.topicsVerified.join(", ") : "N/A"}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-black text-slate-800 dark:text-white">{log.score}/10</div>
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase justify-end">
                                                                    <Clock className="h-3 w-3" />
                                                                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'Recent'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            <span>Integrity Method: AI Dynamic Generation</span>
                                                            {log.passed && <span className="text-emerald-600">PRI UPDATED ✅</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                    <p className="text-sm font-bold text-slate-400 italic">No verification attempts found for this student.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ANALYTICS TAB */}
                            <TabsContent value="analytics" className="mt-0 space-y-6">
                                <Card className="border-l-4 border-l-indigo-500 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                                    <CardHeader className="bg-slate-50 dark:bg-slate-800/50/50 dark:bg-slate-800/60 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Placement Readiness Breakdown</CardTitle>
                                        <CardDescription className="text-xs">Proprietary mandatory scoring metrics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Current Readiness Score</span>
                                                <span className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{readinessScore}%</span>
                                            </div>
                                            <Progress value={readinessScore} className="h-3 shadow-inner bg-slate-100 dark:bg-slate-900/50" />
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase pt-1">
                                                <span>Base Target: 40%</span>
                                                <span>Advanced Target: 80%</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                                            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl space-y-1 shadow-sm">
                                                <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 dark:text-emerald-400 uppercase tracking-widest">Certification Weight</p>
                                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{allCerts.length * 10}%</p>
                                                <p className="text-[10px] font-medium text-emerald-600/70">10 pts per certificate</p>
                                            </div>
                                            <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-xl space-y-1 shadow-sm">
                                                <p className="text-[10px] font-bold text-purple-800 dark:text-purple-300 dark:text-purple-400 uppercase tracking-widest">Enrichment Weight</p>
                                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">+{allEnrichment.length * 15}%</p>
                                                <p className="text-[10px] font-medium text-purple-600/70">15 pts per record</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Smart Recovery Roadmap for Problematic Students */}
                                {(riskLevel === "Moderate" || riskLevel === "High" || riskLevel === "Critical") && (
                                    <Card className="border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10 shadow-sm mt-6 overflow-hidden">
                                        <CardHeader className="pb-4 border-b border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-800 dark:text-red-300">
                                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" /> Smart Recovery Roadmap
                                            </CardTitle>
                                            <CardDescription className="text-xs text-red-700/80 dark:text-red-400/80">
                                                AI-generated intervention plan specifically designed to fix {student.name}&apos;s weakest areas.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-5 bg-white dark:bg-slate-900">
                                            {isAiLoading ? (
                                                <div className="flex flex-col items-center justify-center py-10 text-red-700/80">
                                                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                    <p className="text-sm font-medium">AI is designing targeted recovery roadmap...</p>
                                                </div>
                                            ) : (
                                                roadmap.map((phase, idx) => (
                                                    <div key={idx} className={`p-5 rounded-xl border flex gap-4 transition-all hover:shadow-md ${phase.priority === 'Critical' ? 'bg-red-50/60 dark:bg-red-950/30 border-red-100 dark:border-red-900/50' : phase.priority === 'High' ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50' : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50'}`}>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`rounded-full p-1.5 h-fit ${phase.priority === 'Critical' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' : phase.priority === 'High' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'}`}>
                                                                        {phase.priority === "Critical" ? <ShieldAlert className="h-3 w-3" /> : phase.priority === "High" ? <TrendingUp className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                                                    </div>
                                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white">{phase.week}</h4>
                                                                </div>
                                                                <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${phase.priority === 'Critical' ? 'text-red-700 dark:text-red-400 dark:text-red-300 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40' : phase.priority === 'High' ? 'text-amber-700 dark:text-amber-400 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40' : 'text-blue-700 dark:text-blue-400 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40'}`}>
                                                                    {phase.priority} Priority
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 pb-2 mb-2">{phase.focus}</p>
                                                            <div className="space-y-2.5 pt-1">
                                                                {phase.tasks.map((task: string, tIdx: number) => (
                                                                    <div key={tIdx} className="text-xs flex items-start gap-3">
                                                                        <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${phase.priority === 'Critical' ? 'bg-red-400' : phase.priority === 'High' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                                                        <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{task}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
