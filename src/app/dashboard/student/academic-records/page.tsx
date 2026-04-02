"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { FileText, TrendingUp, PlusCircle } from "lucide-react";

export default function AcademicRecordsPage() {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Student Intelligence Portal</p>
                    <h1 className="text-3xl font-black mb-2 tracking-tight">Academic Records 📚</h1>
                    <p className="text-white/60 font-medium text-sm">Manage your semester grades and view your academic history.</p>
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
        </div>
    );
}
