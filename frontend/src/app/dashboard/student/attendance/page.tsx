"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function StudentAttendancePage() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const attendanceData = [
        { subject: "Data Structures", total: 45, present: 40, percentage: 88, status: "Good" },
        { subject: "Operating Systems", total: 42, present: 31, percentage: 73, status: "Warning" },
        { subject: "DBMS", total: 40, present: 38, percentage: 95, status: "Excellent" },
        { subject: "Computer Networks", total: 38, present: 32, percentage: 84, status: "Good" },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Excellent": return "success";
            case "Good": return "default";
            case "Warning": return "destructive";
            default: return "secondary";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-1">Student Intelligence Portal</p>
                        <h1 className="text-3xl font-black mb-2 tracking-tight leading-[1.15] pb-1">Attendance Tracking 📅</h1>
                        <p className="text-white/85 font-medium text-sm">Monitor your subject-wise presence and attendance consistency.</p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md",
                                    !date && "text-white/60"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-2xl">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {attendanceData.map((data) => (
                    <Card key={data.subject} className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative group">
                        <div className={cn(
                            "absolute top-0 left-0 w-1.5 h-full",
                            data.percentage >= 90 ? "bg-emerald-500" : data.percentage >= 75 ? "bg-blue-500" : "bg-rose-500"
                        )} />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{data.subject}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{data.percentage}%</div>
                            <Progress value={data.percentage} className="h-2 mt-3" indicatorClassName={cn(
                                data.percentage >= 90 ? "bg-emerald-500" : data.percentage >= 75 ? "bg-blue-500" : "bg-rose-500"
                            )} />
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                                    {data.present}/{data.total} Classes
                                </p>
                                <Badge variant={getStatusColor(data.status) as any} className="text-[10px] font-black uppercase border-none px-2 py-0.5">
                                    {data.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-800/20">
                    <CardTitle className="text-slate-800 dark:text-white">Recent Attendance History</CardTitle>
                    <CardDescription className="dark:text-slate-400">Log for the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {[
                            { date: "Today", status: "Present", subject: "Data Structures", time: "09:00 AM" },
                            { date: "Today", status: "Absent", subject: "Operating Systems", time: "11:00 AM" },
                            { date: "Yesterday", status: "Present", subject: "DBMS", time: "10:00 AM" },
                            { date: "Yesterday", status: "Present", subject: "Computer Networks", time: "02:00 PM" },
                            { date: "12 Feb", status: "Present", subject: "Data Structures", time: "09:00 AM" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.subject}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.date} • {item.time}</span>
                                </div>
                                <Badge variant={item.status === "Present" ? "success" : "destructive"} className="font-black uppercase text-[10px]">
                                    {item.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}



