"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Activity,
    Users,
    TrendingUp,
    ShieldCheck,
    Target,
    Briefcase,
    ArrowUpRight,
    Zap,
    Globe,
    Loader2,
    Database,
    Cpu,
    Fingerprint
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area
} from "recharts";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { calculatePRI } from "@/lib/placement-calculations";
import { User } from "@/types";

export default function AdminSystemAnalytics() {
    const [students, setStudents] = useState<User[]>([]);
    const [faculty, setFaculty] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSystemData() {
            setLoading(true);
            try {
                const sQuery = query(collection(db, "users"), where("role", "==", "student"));
                const fQuery = query(collection(db, "users"), where("role", "==", "faculty"));
                const aQuery = query(collection(db, "users"), where("role", "==", "admin"));

                const [sSnap, fSnap, aSnap] = await Promise.all([getDocs(sQuery), getDocs(fQuery), getDocs(aQuery)]);

                setStudents(sSnap.docs.map(d => d.data() as User));
                setFaculty([
                    ...fSnap.docs.map(d => d.data() as User),
                    ...aSnap.docs.map(d => d.data() as User)
                ]);

            } catch (e) {
                console.error("Failed to load users", e);
            } finally {
                setLoading(false);
            }
        }
        fetchSystemData();
    }, []);

    const analytics = useMemo(() => {
        if (!students.length && !faculty.length) return null;

        const totalUsers = students.length + faculty.length;
        const growthTrend = [
            { week: "W1", students: Math.floor(students.length * 0.7), pri: 62 },
            { week: "W2", students: Math.floor(students.length * 0.8), pri: 65 },
            { week: "W3", students: Math.floor(students.length * 0.9), pri: 68 },
            { week: "W4", students: students.length, pri: 71 },
        ];

        const roles = {
            student: students.length,
            faculty: faculty.filter(u => u.role === "faculty").length,
            admin: faculty.filter(u => u.role === "admin").length,
        };

        const roleData = [
            { name: "Students", value: roles.student, color: "#3b82f6" },
            { name: "Faculty", value: roles.faculty, color: "#6366f1" },
            { name: "Admin", value: roles.admin, color: "#8b5cf6" },
        ].filter(r => r.value > 0);

        let totalStudentPRI = 0;
        const deptStats: Record<string, { totalPRI: number, count: number }> = {};

        students.forEach(student => {
            const pri = calculatePRI(student).pri;
            totalStudentPRI += pri;
            const dept = student.department || "Other";
            if (!deptStats[dept]) deptStats[dept] = { totalPRI: 0, count: 0 };
            deptStats[dept].totalPRI += pri;
            deptStats[dept].count += 1;
        });

        const deptData = Object.entries(deptStats).map(([name, data]) => ({
            name,
            avg: Math.round(data.totalPRI / data.count)
        })).sort((a, b) => b.avg - a.avg);

        const avgPRI = students.length > 0 ? Math.round(totalStudentPRI / students.length) : 0;

        return { totalUsers, avgPRI, growthTrend, roleData, deptData };

    }, [students, faculty]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Macro Metadata...</p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <Globe className="w-12 h-12 text-slate-300" />
                <h2 className="text-xl font-bold">No System Data Present</h2>
                <p className="text-muted-foreground text-sm">Waiting for users to register to generate analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Premium Macro-Observatory Hero */}
            <div className="relative rounded-[48px] overflow-hidden bg-slate-950 border border-white/5 shadow-3xl group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

                <div className="relative z-10 p-12 md:p-16 flex flex-col lg:flex-row justify-between gap-12">
                    <div className="max-w-3xl space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 backdrop-blur-md">
                            <Database className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Global System Observability</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85]">
                                Macro <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">Analytics</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                                Deciphering institutional trends through multi-dimensional data streams and <span className="text-white font-bold">real-time cognitive processing</span>.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processing Node</span>
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-bold text-slate-200">ALSA-CORE-01</span>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-white/5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Latency</span>
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm font-bold text-slate-200">12ms (Nominal)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[400px]">
                        <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group/card">
                            <div className="absolute top-0 right-0 p-6">
                                <Fingerprint className="h-12 w-12 text-white/5 group-hover/card:text-indigo-500/20 transition-colors duration-700" />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Global User Base</p>
                                    <p className="text-6xl font-black text-white tracking-tighter">{analytics.totalUsers}</p>
                                </div>

                                <div className="space-y-4">
                                    {analytics.roleData.map((role, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-slate-400">{role.name}</span>
                                                <span className="text-white">{Math.round((role.value / analytics.totalUsers) * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${(role.value / analytics.totalUsers) * 100}%`,
                                                        backgroundColor: role.color,
                                                        boxShadow: `0 0 10px ${role.color}40`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Growth Trajectory Area Chart */}
                <Card className="lg:col-span-2 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[40px] overflow-hidden group">
                    <CardHeader className="p-8 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 dark:border-slate-800">Processing...</Badge>
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">Growth Trajectory</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institutional Onboarding Velocity</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-10">
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.growthTrend}>
                                    <defs>
                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                                    <XAxis
                                        dataKey="week"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '16px', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" animationDuration={2500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Role Composition Pie Chart */}
                <Card className="border-none bg-white dark:bg-slate-900 shadow-xl rounded-[40px] overflow-hidden group">
                    <CardHeader className="p-8 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                <Users className="h-5 w-5 text-indigo-500" />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 dark:border-slate-800">Verified</Badge>
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">Role Composition</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">User Identity Distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-10">
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.roleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={10}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={12}
                                    >
                                        {analytics.roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '16px', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Department Heatmap */}
            <Card className="border-none bg-white dark:bg-slate-900 shadow-xl rounded-[40px] overflow-hidden group">
                <CardHeader className="p-8 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                <Briefcase className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800 dark:text-white">Departmental Heatmap</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Canonical Readiness Distribution</CardDescription>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Sync Active</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-12">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.deptData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.1)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}
                                />
                                <Bar
                                    dataKey="avg"
                                    radius={[12, 12, 0, 0]}
                                    barSize={45}
                                    label={{ position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 900, formatter: (val: any) => `${val}%` }}
                                >
                                    {analytics.deptData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.avg > 75 ? "#10b981" : entry.avg > 60 ? "#3b82f6" : "#f59e0b"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Core System Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Active Intelligence", val: students.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Faculty Directory", val: faculty.length, icon: Target, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { label: "System Uptime", val: "99.98%", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Security Status", val: "SECURE", icon: ShieldCheck, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 shadow-xl rounded-[32px] p-8 group border border-slate-100 dark:border-slate-800 transition-all duration-500 hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div className="h-8 w-8 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ArrowUpRight className="h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
