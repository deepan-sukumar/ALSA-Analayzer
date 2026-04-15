"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Users,
    TrendingUp,
    TrendingDown,
    Activity,
    Award,
    Trophy,
    Briefcase,
    Download,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    Legend,
} from "recharts";
import { User } from "@/types";
import { calculateBSDI } from "@/lib/calculations";
import { calculatePRI, getPlacementReadiness } from "@/lib/calculations/placement-calculations";
import { getAllStudents } from "@/lib/firebase/firestore";

export default function AdminDashboard() {
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const students = await getAllStudents();
                setAllUsers(students as User[]);
            } catch (e) {
                console.error("Failed to load users from Firestore", e);
            }
        }
        fetchUsers();
    }, []);

    // Analytics Calculation
    const analytics = useMemo(() => {
        if (allUsers.length === 0) return null;

        let totalBSDI = 0;
        const departmentCounts: Record<string, number> = {};
        const riskCounts = { Low: 0, Medium: 0, High: 0 };
        const moduleScores = {
            academic: 0,
            certification: 0,
            competition: 0,
            extraCurricular: 0,
            placement: 0
        };

        const tierCounts: Record<string, number> = {
            "High Industry Alignment": 0,
            "Strong Development Profile": 0,
            "Emerging Professional Profile": 0,
            "Foundational Stage": 0,
            "Not Ready": 0
        };
        let totalPRI = 0;

        allUsers.forEach(user => {
            const stats = calculateBSDI(user);
            const priData = calculatePRI(user);
            const readiness = getPlacementReadiness(user);

            totalPRI += priData.pri;
            if (readiness.tier in tierCounts) {
                tierCounts[readiness.tier]++;
            }

            totalBSDI += stats.bsdi;

            // Department
            const dept = user.department || "CSE"; // Default to CSE if missing
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

            // Risk
            if (stats.bsdi >= 80) riskCounts.Low++;
            else if (stats.bsdi >= 60) riskCounts.Medium++;
            else riskCounts.High++;

            // Module avgs
            moduleScores.academic += stats.academic;
            moduleScores.certification += stats.certification;
            moduleScores.competition += stats.competition;
            moduleScores.extraCurricular += stats.extraCurricular;
            moduleScores.placement += stats.placement;
        });

        const count = allUsers.length;
        return {
            avgBSDI: Math.round(totalBSDI / count),
            departmentData: Object.entries(departmentCounts).map(([name, value]) => ({ name, value })),
            riskData: [
                { name: "Low Risk (Excellent)", value: riskCounts.Low, color: "#22c55e" },
                { name: "Medium Risk (Good)", value: riskCounts.Medium, color: "#3b82f6" },
                { name: "High Risk (Needs Attention)", value: riskCounts.High, color: "#ef4444" },
            ],
            modulePerformance: [
                { name: "Academic", score: Math.round(moduleScores.academic / count), fullMark: 100 },
                { name: "Certifications", score: Math.round(moduleScores.certification / count), fullMark: 100 },
                { name: "Competitions", score: Math.round(moduleScores.competition / count), fullMark: 100 },
                { name: "Extra-Curricular", score: Math.round(moduleScores.extraCurricular / count), fullMark: 100 },
                { name: "Placement", score: Math.round(moduleScores.placement / count), fullMark: 100 },
            ],
            placementData: {
                avgPRI: Math.round(totalPRI / count),
                tierData: Object.entries(tierCounts).map(([name, value]) => ({
                    name,
                    value,
                    color: name === "High Industry Alignment" ? "#22c55e" :
                        name === "Strong Development Profile" ? "#3b82f6" :
                            name === "Emerging Professional Profile" ? "#eab308" : "#ef4444"
                })).filter(d => d.value > 0)
            }
        };
    }, [allUsers]);

    const handleExport = () => {
        // Mock export functionality
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Name,ID,BSDI,Risk Level\n"
            + allUsers.map(u => {
                const stats = calculateBSDI(u);
                return `${u.name},${u.id},${stats.bsdi},${stats.riskProfile.status}`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!analytics) {
        return <div className="p-8 text-center text-muted-foreground">Loading analytics Dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Administration 🛡️</h1>
                    <p className="text-muted-foreground">Global overview of student development and institutional performance</p>
                </div>
                <Button onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allUsers.length}</div>
                        <p className="text-xs text-muted-foreground">+2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Institute Avg BSDI</CardTitle>
                        <Activity className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.avgBSDI}</div>
                        <p className="text-xs text-muted-foreground">Target: 75+</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Department</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">CSE</div>
                        <p className="text-xs text-muted-foreground">Avg BSDI: {analytics.avgBSDI + 2}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.riskData[2].value}</div>
                        <p className="text-xs text-muted-foreground">Requiring intervention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Module Performance Bar Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Holistic Development by Module</CardTitle>
                        <CardDescription>Average performance across 5 key dimensions</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={analytics.modulePerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#000000" strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    fontSize={12}
                                    tickLine={{ stroke: "#000000" }}
                                    axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                    tick={{ fill: "#000000" }}
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={{ stroke: "#000000" }}
                                    axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                                    tick={{ fill: "#000000" }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="score" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Risk Distribution Pie Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Risk Profile Distribution</CardTitle>
                        <CardDescription>Student categorization based on BSDI</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.riskData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Placement Tiers */}
            <Card>
                <CardHeader>
                    <CardTitle>Placement Readiness Tiers</CardTitle>
                    <CardDescription>Institutional breakdown of student employability</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[100px] w-full flex gap-2">
                        {analytics.placementData.tierData.map((item) => (
                            <div
                                key={item.name}
                                className="h-full rounded-md flex flex-col items-center justify-center text-white text-sm font-bold transition-all hover:opacity-90 relative group"
                                style={{ width: `${(item.value / allUsers.length) * 100}%`, backgroundColor: item.color }}
                                title={`${item.name}: ${item.value} students`}
                            >
                                <span>{Math.round((item.value / allUsers.length) * 100)}%</span>
                                <span className="opacity-80 font-normal text-xs">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

