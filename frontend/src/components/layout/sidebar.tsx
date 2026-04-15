"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Settings,
    LogOut,
    GraduationCap,
    Activity,
    Target,
    AlertCircle,
    ShieldAlert,
    Database,
    UserCog,
    FileBarChart,
    Gauge,
    Radar,
    Sparkles,
} from "lucide-react";
import { Role } from "@/types";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: Role;
    isMobile?: boolean;
}

export function Sidebar({ className, role: propRole, isMobile }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

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

    // Faculty routes with relevant icons
    const facultyRoutes = [
        {
            title: "Professional Readiness",
            href: "/dashboard/faculty",
            icon: Gauge,
            position: "top" as const,
        },
        {
            title: "Risk Monitoring",
            href: "/dashboard/faculty/risk-monitor",
            icon: Radar,
            position: "middle" as const,
        },
        {
            title: "Performance Integrity",
            href: "/dashboard/faculty/integrity-hub",
            icon: ShieldAlert,
            position: "middle" as const,
        },
        {
            title: "Academic Reports",
            href: "/dashboard/faculty/reports",
            icon: FileBarChart,
            position: "middle" as const,
        },
        {
            title: "My Profile",
            href: "/dashboard/faculty/profile",
            icon: UserCog,
            position: "middle" as const,
        },
    ];

    // Student routes with relevant icons
    const studentRoutes = [
        {
            title: "Dashboard",
            href: "/dashboard/student",
            icon: LayoutDashboard,
            position: "top" as const,
        },
        {
            title: "Academic Records",
            href: "/dashboard/student/academic-records",
            icon: BookOpen,
            position: "middle" as const,
        },
        {
            title: "Outcome Alignment",
            href: "/dashboard/student/placement/update",
            icon: Target,
            position: "middle" as const,
        },
        {
            title: "Readiness & Risk",
            href: "/dashboard/student/placement-insights",
            icon: Activity,
            position: "middle" as const,
        },
        {
            title: "Enrichment",
            href: "/dashboard/student/portfolio/enrichment",
            icon: Sparkles,
            position: "middle" as const,
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            position: "middle" as const,
        },
    ];

    const adminRoutes = [
        {
            title: "Dashboard",
            href: "/admin/dashboard",
            icon: LayoutDashboard,
            position: "top" as const,
        },
        {
            title: "Analytics",
            href: "/admin/system-analytics",
            icon: Activity,
            position: "middle" as const,
        },
        {
            title: "Issues",
            href: "/admin/issue-monitor",
            icon: AlertCircle,
            badge: openIssuesCount > 0 ? openIssuesCount : undefined,
            position: "middle" as const,
        },
        {
            title: "Approvals",
            href: "/admin/faculty-approvals",
            icon: Users,
            position: "middle" as const,
        },
        {
            title: "Users",
            href: "/admin/users",
            icon: UserCog,
            position: "middle" as const,
        },
        {
            title: "Data Control",
            href: "/admin/data-control",
            icon: Database,
            position: "middle" as const,
        },
        {
            title: "Settings",
            href: "/admin/settings",
            icon: Settings,
            position: "middle" as const,
        },
    ];

    let routes = studentRoutes;
    if (currentRole === "faculty") routes = facultyRoutes;
    else if (currentRole === "admin") routes = adminRoutes;

    // Arrange routes: top items first, middle items, logout at bottom
    const topRoutes = routes.filter(r => r.position === "top");
    const middleRoutes = routes.filter(r => r.position === "middle");
    const allNavRoutes = [...topRoutes, ...middleRoutes];

    // Role-specific accent colors — normalized active states instead of intense gradients
    const accentMap: Record<string, { active: string; activeBg: string; ring: string; glow: string; brand: string; brandBg: string }> = {
        faculty: {
            active: "text-indigo-600 dark:text-indigo-400 drop-shadow-md",
            activeBg: "bg-indigo-500/12 dark:bg-indigo-500/18",
            ring: "ring-indigo-400/40",
            glow: "shadow-indigo-500/20",
            brand: "from-indigo-500 to-violet-600",
            brandBg: "bg-indigo-500/10 text-indigo-400",
        },
        admin: {
            active: "text-rose-600 dark:text-rose-400 drop-shadow-md",
            activeBg: "bg-rose-500/12 dark:bg-rose-500/18",
            ring: "ring-rose-400/40",
            glow: "shadow-rose-500/20",
            brand: "from-rose-500 to-pink-600",
            brandBg: "bg-rose-500/10 text-rose-400",
        },
        student: {
            active: "text-indigo-600 dark:text-indigo-400 drop-shadow-md",
            activeBg: "bg-indigo-500/12 dark:bg-indigo-500/18",
            ring: "ring-indigo-400/40",
            glow: "shadow-indigo-500/20",
            brand: "from-indigo-500 to-blue-600",
            brandBg: "bg-indigo-500/10 text-indigo-400",
        },
    };

    const accent = accentMap[currentRole] || accentMap.student;

    if (isMobile) {
        return (
            <div className={cn("flex h-screen flex-col justify-between overflow-y-auto bg-slate-950 text-white border-r border-slate-800/60 pb-8", className)}>
                <div className="space-y-4 py-4">
                    <div className="px-4 py-2">
                        <div className="flex items-center gap-3 px-2 mb-8">
                            <div className={cn("p-2 rounded-xl bg-gradient-to-br shadow-md", accent.brand)}>
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-white">ALSA</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {currentRole === "faculty" ? "Faculty Portal"
                                        : currentRole === "admin" ? "Admin Control"
                                            : "Student Portal"}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {allNavRoutes.map((route: any) => {
                                const isActive = pathname === route.href;
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        className={cn(
                                            "group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                                            isActive
                                                ? "bg-white/10 text-white"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <route.icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                                            <span>{route.title}</span>
                                        </div>
                                        {route.badge !== undefined && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                                {route.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-800/60">
                    <button
                        onClick={logout}
                        className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    // ── Desktop: Half-circle floating dock ──
    const totalItems = allNavRoutes.length + 1; // +1 for logout
    const arcStartAngle = -60; // degrees from center (top of arc)
    const arcEndAngle = 60; // degrees from center (bottom of arc)
    const arcRadius = Math.max(100, totalItems * 18); // responsive radius

    const getItemPosition = (index: number, total: number) => {
        const angleRange = arcEndAngle - arcStartAngle;
        const angleStep = angleRange / (total - 1);
        const angle = arcStartAngle + angleStep * index;
        const radians = (angle * Math.PI) / 180;
        const x = Math.cos(radians) * arcRadius;
        const y = Math.sin(radians) * arcRadius;
        return { x, y, angle };
    };

    return (
        <div
            ref={sidebarRef}
            className={cn(
                "fixed left-0 top-0 h-[100dvh] z-40 flex items-center",
                "transition-all duration-500 ease-out",
                className
            )}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => { setExpanded(false); setHoveredIndex(null); }}
        >
            {/* Collapsed rail — always visible */}
            <div className={cn(
                "relative flex flex-col items-center py-6 h-full w-[68px]",
                "bg-transparent",
                "transition-all duration-500"
            )}>
                {/* Brand logo at top */}
                <div className="mb-6 mt-2 relative group">
                    <div className={cn(
                        "p-2.5 rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300",
                        accent.brand,
                        expanded && "scale-110 shadow-xl"
                    )} title="ALSA">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50">
                        <div className="relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-800 text-white shadow-xl border border-slate-700/60">
                            ALSA
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-slate-800 border-l border-b border-slate-700/60 rotate-45 rounded-sm" />
                        </div>
                    </div>
                </div>

                {/* Navigation icons — arranged vertically with arc curve effect */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1 relative w-full">
                    {allNavRoutes.map((route, index) => {
                        const isActive = pathname === route.href;
                        const isHovered = hoveredIndex === index;
                        const total = allNavRoutes.length;

                        // Calculate arc offset for half-circle effect
                        const midIndex = (total - 1) / 2;
                        const distFromMid = Math.abs(index - midIndex);
                        const maxDist = midIndex;
                        const normalizedDist = maxDist > 0 ? distFromMid / maxDist : 0;
                        // Parabolic curve: items at edges push left, items in middle push right
                        const arcOffsetX = expanded
                            ? Math.round((1 - normalizedDist * normalizedDist) * 22)
                            : 0;

                        // Base scale based on position (center icon is larger)
                        const baseScale = 1 + ((1 - normalizedDist) * 0.25); // Center is 25% larger

                        return (
                            <div
                                key={route.href}
                                className="relative group flex justify-center w-full"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <Link
                                    href={route.href}
                                    className={cn(
                                        "relative flex items-center justify-center w-11 h-11 rounded-2xl",
                                        "transition-all duration-300 ease-out",
                                        isActive
                                            ? cn(accent.active, accent.activeBg, "shadow-sm")
                                            : isHovered
                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-md z-10"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                    style={{
                                        transform: `translateX(${arcOffsetX}px) scale(${isHovered ? baseScale * 1.15 : baseScale})`,
                                        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                >
                                    <route.icon className={cn(
                                        "h-[18px] w-[18px] transition-all duration-300",
                                        isActive ? "scale-110 drop-shadow-sm" : ""
                                    )} />

                                    {/* Badge */}
                                    {(route as any).badge !== undefined && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black min-w-[16px] h-4 flex items-center justify-center rounded-full animate-pulse shadow-md">
                                            {(route as any).badge}
                                        </span>
                                    )}

                                    {/* Active indicator ring */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-2xl ring-2 ring-violet-500/20 dark:ring-white/20 animate-pulse" />
                                    )}
                                </Link>

                                {/* Floating tooltip — appears on hover */}
                                <div
                                    className={cn(
                                        "absolute left-full ml-4 top-1/2 -translate-y-1/2 pointer-events-none z-50",
                                        "transition-all duration-300 ease-out",
                                        isHovered
                                            ? "opacity-100 translate-x-0 scale-100"
                                            : "opacity-0 -translate-x-2 scale-95"
                                    )}
                                >
                                    <div className={cn(
                                        "relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap",
                                        "bg-slate-800 dark:bg-slate-800 text-white shadow-xl border border-slate-700/60",
                                        "backdrop-blur-sm"
                                    )}>
                                        {route.title}
                                        {/* Arrow */}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-slate-800 border-l border-b border-slate-700/60 rotate-45 rounded-sm" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom section */}
                <div className="mt-auto flex flex-col items-center gap-4 pb-8">
                    {/* System health indicator for admin */}
                    {currentRole === "admin" && (
                        <div className="relative group">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                                "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                            )}>
                                <div className={cn(
                                    "w-2.5 h-2.5 rounded-full animate-pulse",
                                    healthStatus === "Healthy" ? "bg-emerald-500" :
                                        healthStatus === "Warning" ? "bg-amber-500" : "bg-red-500"
                                )} />
                            </div>
                            {/* Health tooltip */}
                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50">
                                <div className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-800 dark:bg-slate-800 text-white shadow-xl border border-slate-700/60">
                                    System: {healthStatus}
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-slate-800 border-l border-b border-slate-700/60 rotate-45 rounded-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logout button — always at bottom, ensured visibility */}
                    <div className="relative group">
                        <button
                            onClick={logout}
                            className={cn(
                                "flex items-center justify-center w-11 h-11 rounded-2xl",
                                "text-rose-500 hover:text-white hover:bg-rose-500",
                                "dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-500/80",
                                "transition-all duration-300 ease-out",
                                "hover:scale-110 hover:shadow-lg hover:shadow-rose-500/30"
                            )}
                        >
                            <LogOut className="h-[18px] w-[18px]" />
                        </button>
                        {/* Logout tooltip */}
                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50">
                            <div className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-rose-500 text-white shadow-xl shadow-rose-500/20 border border-rose-600">
                                Logout
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-rose-500 border-l border-b border-rose-600 rotate-45 rounded-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

