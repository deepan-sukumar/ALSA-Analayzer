"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Settings,
    LogOut,
    GraduationCap,
    Medal,
    Activity,
    Briefcase,
    TrendingUp,
    Target,
    Trophy,
    AlertCircle,
    ShieldAlert,
} from "lucide-react";
import { Role } from "@/types";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: Role;
}

export function Sidebar({ className, role: propRole }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Use propRole if provided (e.g. for mobile menu), otherwise use context user role
    const currentRole = (propRole || user?.role || "").toLowerCase();

    const [openIssuesCount, setOpenIssuesCount] = useState(0);
    const [healthStatus, setHealthStatus] = useState<"Healthy" | "Warning" | "Critical">("Healthy");

    useEffect(() => {
        if (currentRole !== "admin") return;

        const q = query(collection(db, "system_issues"), where("status", "==", "open"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOpenIssuesCount(snapshot.size);

            let hasCritical = false;
            let hasMedium = false;

            snapshot.forEach(doc => {
                const priority = doc.data().priority;
                if (priority === "critical" || priority === "high") hasCritical = true;
                if (priority === "medium") hasMedium = true;
            });

            if (hasCritical) setHealthStatus("Critical");
            else if (hasMedium) setHealthStatus("Warning");
            else setHealthStatus("Healthy");
        }, (error) => {
            console.error("Sidebar Issue Sync Error:", error.message);
        });

        return () => unsubscribe();
    }, [currentRole]);

    const facultyRoutes = [
        {
            title: "Professional Readiness",
            href: "/dashboard/faculty",
            icon: LayoutDashboard,
        },
        {
            title: "Risk Monitoring Center",
            href: "/dashboard/faculty/risk-monitor",
            icon: TrendingUp,
        },
        {
            title: "Performance Integrity",
            href: "/dashboard/faculty/integrity-hub",
            icon: ShieldAlert,
        },
        {
            title: "Academic Reports",
            href: "/dashboard/faculty/reports",
            icon: BookOpen,
        },
        {
            title: "My Profile",
            href: "/dashboard/faculty/profile",
            icon: Settings,
        },
    ];

    const studentRoutes = [
        {
            title: "Dashboard",
            href: "/dashboard/student",
            icon: LayoutDashboard,
        },
        {
            title: "Academic Records",
            href: "/dashboard/student/academic-records",
            icon: BookOpen,
        },
        // Development Analytics Group
        {
            title: "Development Analytics",
            href: "#",
            icon: TrendingUp,
            isHeader: true
        },
        {
            title: "Outcome Alignment",
            href: "/dashboard/student/placement/update",
            icon: Target,
        },
        {
            title: "Readiness & Risk Analysis",
            href: "/dashboard/student/placement-insights",
            icon: Activity,
        },
        {
            title: "Academic Enrichment",
            href: "/dashboard/student/portfolio/enrichment",
            icon: Trophy,
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
        },
    ];

    const adminRoutes = [
        {
            title: "Dashboard",
            href: "/admin/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "System Analytics",
            href: "/admin/system-analytics",
            icon: Activity,
        },
        {
            title: "Issue Monitor",
            href: "/admin/issue-monitor",
            icon: AlertCircle,
            badge: openIssuesCount > 0 ? openIssuesCount : undefined
        },
        {
            title: "Faculty Approvals",
            href: "/admin/faculty-approvals",
            icon: Users,
        },
        {
            title: "User Management",
            href: "/admin/users",
            icon: Briefcase,
        },
        {
            title: "Data Control",
            href: "/admin/data-control",
            icon: Settings,
        },
        {
            title: "Settings",
            href: "/admin/settings",
            icon: Settings,
        },
    ];

    let routes = studentRoutes;
    if (currentRole === "faculty") routes = facultyRoutes;
    else if (currentRole === "admin") routes = adminRoutes;

    // Role-specific accent colours
    const accentActive = currentRole === "faculty"
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200"
        : currentRole === "admin"
            ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-200"
            : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200";

    const accentHover = currentRole === "faculty"
        ? "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300"
        : currentRole === "admin"
            ? "hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300"
            : "hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300";

    return (
        <div className={cn("pb-12 h-screen flex flex-col justify-between bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800", className)}>
            <div className="space-y-4 py-4">
                <div className="px-4 py-2">
                    {/* Premium Brand Header */}
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className={cn(
                            "p-2 rounded-xl shadow-md",
                            currentRole === "faculty" ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                                : currentRole === "admin" ? "bg-gradient-to-br from-rose-500 to-pink-600"
                                    : "bg-gradient-to-br from-blue-500 to-cyan-600"
                        )}>
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">ALSA</h2>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {currentRole === "faculty" ? "Faculty Portal"
                                    : currentRole === "admin" ? "Admin Control"
                                        : "Student Portal"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {routes.map((route: any) => {
                            const isActive = pathname === route.href;
                            if (route.isHeader) {
                                return (
                                    <div key={route.title} className="px-3 py-2 mt-4 mb-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                        {route.title}
                                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                                        isActive
                                            ? accentActive
                                            : cn("text-slate-600 dark:text-slate-300", accentHover)
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <route.icon className={cn(
                                            "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                                            isActive ? "text-white" : ""
                                        )} />
                                        <span>{route.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {route.badge !== undefined && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                                {route.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                {currentRole === "admin" && (
                    <div className="px-4 py-3 mb-2 mx-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">System Health</span>
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                healthStatus === "Healthy" ? "bg-emerald-500" :
                                    healthStatus === "Warning" ? "bg-amber-500" : "bg-red-500"
                            )} />
                            <span className={cn(
                                "text-xs font-black",
                                healthStatus === "Healthy" ? "text-emerald-600" :
                                    healthStatus === "Warning" ? "text-amber-600" : "text-red-600"
                            )}>{healthStatus}</span>
                        </div>
                    </div>
                )}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                        onClick={logout}
                        className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 transition-all duration-200"
                    >
                        <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
