"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TranscriptPage() {
    const { user } = useAuth();

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case "O": return "bg-green-100 text-green-700 dark:text-green-400 border-green-200";
            case "A+": return "bg-emerald-100 text-emerald-700 dark:text-emerald-400 border-emerald-200";
            case "A": return "bg-blue-100 text-blue-700 dark:text-blue-400 border-blue-200";
            case "B+": return "bg-indigo-100 text-indigo-700 dark:text-indigo-400 border-indigo-200";
            case "B": return "bg-yellow-100 text-yellow-700 dark:text-yellow-400 border-yellow-200";
            case "C": return "bg-orange-100 text-orange-700 dark:text-orange-400 border-orange-200";
            case "U": return "bg-red-100 text-red-700 dark:text-red-400 border-red-200";
            default: return "bg-gray-100 text-gray-700 dark:text-gray-200";
        }
    };

    if (!user || !user.academicRecords || user.academicRecords.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No Academic Records Found</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Please update your semester grades in the setup page to generate your transcript.
                </p>
                <Button className="mt-4" onClick={() => window.location.href = "/dashboard/student/academic-records/setup"}>
                    Update Grades
                </Button>
            </div>
        );
    }

    // Sort semesters by semester number
    const sortedSemesters = [...user.academicRecords].sort((a, b) => a.semester - b.semester);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Student Intelligence Portal</p>
                        <h1 className="text-3xl font-black mb-2 tracking-tight">Academic Transcript 📜</h1>
                        <p className="text-white/60 font-medium text-sm">Official record of your semester-wise performance.</p>
                    </div>
                    <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-black uppercase tracking-widest backdrop-blur-md shadow-2xl gap-2">
                        <Download className="h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                {sortedSemesters.map((sem) => (
                    <Card key={sem.semester} className="break-inside-avoid shadow-md border-t-4 border-t-primary/20">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Semester {sem.semester}</CardTitle>
                                    <CardDescription>
                                        Arrears: {sem.arrears ? <span className="text-red-500 font-bold">{sem.arrears}</span> : "0"}
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">{sem.sgpa || "0.00"}</div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">SGPA</p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
