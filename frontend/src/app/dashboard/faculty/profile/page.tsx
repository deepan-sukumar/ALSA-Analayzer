"use client";

import { useAuth } from "@/context/auth-context";
import {
    User, Mail, GraduationCap, CheckCircle2, ShieldAlert,
    Activity, BookOpen, Users, Zap, Building2, BadgeCheck
} from "lucide-react";

export default function FacultyProfilePage() {
    const { user } = useAuth();
    if (!user) return null;

    const isApproved = user.approved !== false;

    const privileges = [
        { icon: Users, label: "Access Student Metrics", color: "text-indigo-600", bg: "bg-indigo-50", hoverBg: "hover:bg-indigo-100 dark:bg-indigo-900/50 hover:border-indigo-200" },
        { icon: BookOpen, label: "Generate Dept Reports", color: "text-emerald-600", bg: "bg-emerald-50", hoverBg: "hover:bg-emerald-100 dark:bg-emerald-900/50 hover:border-emerald-200" },
        { icon: Activity, label: "Intervention Oversight", color: "text-violet-600", bg: "bg-violet-50", hoverBg: "hover:bg-violet-100 dark:bg-violet-900/50 hover:border-violet-200" },
    ];

    const infoFields = [
        { icon: Mail, label: "Email Address", value: user.email || "—", color: "text-blue-600", bg: "bg-blue-50" },
        { icon: Building2, label: "Assigned Department", value: user.department || "No Department Assigned", color: "text-indigo-600", bg: "bg-indigo-50" },
        { icon: GraduationCap, label: "Role", value: "Faculty", color: "text-violet-600", bg: "bg-violet-50" },
        { icon: BadgeCheck, label: "Account Status", value: isApproved ? "Verified & Active" : "Pending Approval", color: isApproved ? "text-emerald-600" : "text-amber-600", bg: isApproved ? "bg-emerald-50" : "bg-amber-50" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 px-1">

            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-xl p-7">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Faculty Intelligence Portal</p>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Personal &amp; Professional Profile</h1>
                    <p className="text-white/60 font-medium text-sm">Manage your faculty account details and department assignments.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">

                {/* ── Avatar Card ── */}
                <div className="md:col-span-1 rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                    {/* Top accent */}
                    <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                    <div className="p-8 flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-5">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                                <span className="text-3xl font-black text-white">
                                    {user.name?.substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${isApproved ? "bg-emerald-500" : "bg-amber-400"}`}>
                                {isApproved
                                    ? <CheckCircle2 className="h-4 w-4 text-white" />
                                    : <ShieldAlert className="h-4 w-4 text-white" />
                                }
                            </div>
                        </div>

                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">{user.name}</h2>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-4">Faculty Member</p>

                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border ${isApproved ? "bg-emerald-50 text-emerald-700 dark:text-emerald-400 border-emerald-200" : "bg-amber-50 text-amber-700 dark:text-amber-400 border-amber-200"}`}>
                            {isApproved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Verified Account</> : <><ShieldAlert className="h-3.5 w-3.5" /> Approval Pending</>}
                        </span>

                        {/* Quick stats strip */}
                        <div className="mt-6 w-full grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-center">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 dark:text-indigo-300 mb-0.5">Portal</p>
                                <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">Faculty</p>
                            </div>
                            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 text-center">
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400 dark:text-violet-300 mb-0.5">Access</p>
                                <p className="text-sm font-black text-violet-700 dark:text-violet-300">{isApproved ? "Full" : "Limited"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Details Panel ── */}
                <div className="md:col-span-2 space-y-5">

                    {/* Account Info */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                        <div className="px-6 py-5 border-b bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                                <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-slate-800 dark:text-white">Account Details</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-300">Your registered information</p>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {infoFields.map((field, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 group">
                                    <div className={`p-2.5 rounded-xl ${field.bg} shrink-0`}>
                                        <field.icon className={`h-4 w-4 ${field.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-300">{field.label}</p>
                                        <p className={`font-black text-sm mt-0.5 ${field.color} group-hover:opacity-90 transition-opacity`}>{field.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Privileges */}
                    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg overflow-hidden border-0">
                        <div className="px-6 py-5 border-b bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-slate-800 dark:text-white">System Privileges</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-300">Granted faculty-level permissions</p>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {privileges.map((priv, idx) => (
                                <div
                                    key={idx}
                                    className={`group flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 cursor-default transition-all duration-200 ${priv.hoverBg} hover:border-transparent hover:shadow-md`}
                                >
                                    <div className={`p-2 rounded-lg ${priv.bg} shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                                        <priv.icon className={`h-4 w-4 ${priv.color}`} />
                                    </div>
                                    <span className={`text-xs font-black ${priv.color}`}>{priv.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Approval Warning */}
                    {!isApproved && (
                        <div className="rounded-2xl overflow-hidden border-0 bg-amber-50/80 dark:bg-amber-950/30 shadow-md">
                            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                            <div className="p-5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0 mt-0.5">
                                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-black text-amber-800 dark:text-amber-300 mb-1">Limited Access Mode</h4>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                                        Your account is currently awaiting administrative approval. Some analytics modules may be restricted until verified by an administrator.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


