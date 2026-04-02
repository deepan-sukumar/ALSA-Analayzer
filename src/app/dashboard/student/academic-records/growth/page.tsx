"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function GrowthAnalyticsPage() {
    const { user } = useAuth();

    const growthData = useMemo(() => {
        if (!user?.academicRecords || user.academicRecords.length === 0) return [];
        return user.academicRecords.map(rec => ({
            semester: `Sem ${rec.semester}`,
            gpa: rec.sgpa || 0,
        })).sort((a, b) => parseInt(a.semester.split(" ")[1]) - parseInt(b.semester.split(" ")[1]));
    }, [user]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Student Intelligence Portal</p>
                    <h1 className="text-3xl font-black mb-2 tracking-tight">Growth Analytics 📈</h1>
                    <p className="text-white/60 font-medium text-sm">Visualize your academic trajectory and performance consistency.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-2 border-none shadow-xl bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40">
                        <CardTitle className="text-slate-800 dark:text-white">GPA Progression</CardTitle>
                        <CardDescription className="dark:text-slate-400">Semester-wise Grade Point Average</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="semester"
                                    axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                    tickLine={{ stroke: "#000000" }}
                                    tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 10]}
                                    axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                    tickLine={{ stroke: "#000000" }}
                                    tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "12px",
                                        border: "none",
                                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                        background: "hsl(var(--card))",
                                        color: "hsl(var(--card-foreground))"
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="gpa"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: "#10b981", strokeWidth: 3, stroke: "#fff" }}
                                    activeDot={{ r: 8, strokeWidth: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
