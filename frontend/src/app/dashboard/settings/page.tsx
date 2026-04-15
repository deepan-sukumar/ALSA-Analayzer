"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Laptop, User, Building2, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";
import { getAllStudents } from "@/lib/firebase/firestore";
import { calculatePRI } from "@/lib/calculations/placement-calculations";
import { User as AppUser } from "@/types";

export default function SettingsPage() {
    const { setTheme } = useTheme();
    const { user, updateUserProfile } = useAuth();

    const [name, setName] = useState(user?.name || "");
    const [department, setDepartment] = useState(user?.department || "");
    const [facultyStats, setFacultyStats] = useState<{ total: number, avgPRI: number } | null>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const isGoogleLogin = user?.loginProvider === "google.com";
    const requiresCurrentPassword = !isGoogleLogin || user?.hasPassword;

    useEffect(() => {
        if (user) {
            setName(user.name);
            setDepartment(user.department || "");

            if (user.role === "faculty") {
                const fetchStats = async () => {
                    const students = await getAllStudents();
                    const deptStudents = students.filter((s: any) => s.department === (user.department || department));
                    const avg = deptStudents.length > 0
                        ? Math.round(deptStudents.reduce((acc, s) => acc + calculatePRI(s as AppUser).pri, 0) / deptStudents.length)
                        : 0;
                    setFacultyStats({ total: deptStudents.length, avgPRI: avg });
                };
                fetchStats();
            }
        }
    }, [user, department]);

    const handleSaveProfile = async () => {
        try {
            await updateUserProfile({
                name,
                department
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleSavePassword = async () => {
        if (!newPassword || newPassword !== confirmPassword) {
            toast.error("New passwords do not match or are empty.");
            return;
        }

        if (requiresCurrentPassword && !currentPassword) {
            toast.error("Please enter your current password.");
            return;
        }

        setIsSavingPassword(true);
        try {
            // Pass hasPassword: true so local context updates immediately
            await updateUserProfile({ newPassword, hasPassword: true });
            toast.success(!requiresCurrentPassword ? "Password set successfully." : "Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error("Failed to update password: " + (error.message || "Unknown error"));
        } finally {
            setIsSavingPassword(false);
        }
    };

    const allDepartments = [...IT_DEPARTMENTS, ...CORE_DEPARTMENTS];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">System Administration</p>
                        <h1 className="text-3xl font-black mb-2 tracking-tight flex items-center gap-3">
                            <Settings className="h-8 w-8 text-slate-300" /> Account Settings
                        </h1>
                        <p className="text-white/60 font-medium text-sm">Manage your personal profile, security, and notification preferences.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-white dark:bg-slate-900 border shadow-sm rounded-xl p-1 h-auto flex flex-wrap max-w-2xl gap-1">
                    <TabsTrigger value="profile" className="flex-1 min-w-[120px] h-10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Profile</TabsTrigger>
                    <TabsTrigger value="account" className="flex-1 min-w-[120px] h-10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Security</TabsTrigger>
                    <TabsTrigger value="notifications" className="flex-1 min-w-[120px] h-10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="group border-none shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 group-hover:bg-blue-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,1)] transition-all duration-500" />
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 pb-6">
                            <CardTitle className="text-xl text-slate-800 dark:text-white">Profile Information</CardTitle>
                            <CardDescription className="dark:text-slate-400">
                                Update your personal details and academic department.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3 max-w-md group/input">
                                <Label htmlFor="name" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold group-focus-within/input:text-blue-500 transition-colors duration-300">
                                    <User className="h-4 w-4 text-blue-500 group-focus-within/input:animate-pulse" /> Full Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 transition-all duration-300 hover:border-blue-400 focus-visible:ring-offset-2 focus-visible:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                />
                            </div>
                            <div className="space-y-3 max-w-md group/input">
                                <Label htmlFor="department" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold group-focus-within/input:text-indigo-500 transition-colors duration-300">
                                    <Building2 className="h-4 w-4 text-indigo-500 group-focus-within/input:animate-pulse" /> Department
                                </Label>
                                <Select value={department} onValueChange={setDepartment}>
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 transition-all duration-300 hover:border-indigo-400 focus-visible:ring-offset-2 focus-visible:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allDepartments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {user?.role === "student" && (
                                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-500/80 mt-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-100 dark:border-amber-900/50">
                                        Note: Changing your department will reset your core competency matrix and PRI benchmarks.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/60 pt-6">
                            <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-500 text-white shadow-md font-bold px-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5">Save Profile</Button>
                        </CardFooter>
                    </Card>

                    {user?.role === "faculty" && facultyStats && (
                        <Card className="border-none shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all duration-500 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 group-hover:scale-110 group-hover:opacity-10 dark:group-hover:opacity-20 transition-all duration-700">
                                <Building2 className="w-40 h-40" />
                            </div>
                            <CardHeader className="relative z-10">
                                <CardTitle className="text-indigo-900 dark:text-indigo-100">Academic Mapping Stats</CardTitle>
                                <CardDescription className="text-indigo-700/70 dark:text-indigo-300/70">Your current department-level engagement metrics.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                                <div className="p-6 rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm">
                                    <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Students Mentored</p>
                                    <p className="text-4xl font-black text-slate-800 dark:text-white">{facultyStats.total}</p>
                                </div>
                                <div className="p-6 rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm">
                                    <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Avg. Department PRI</p>
                                    <p className="text-4xl font-black text-slate-800 dark:text-white">{facultyStats.avgPRI}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="account" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="group border-none shadow-xl hover:shadow-2xl hover:shadow-slate-500/10 dark:hover:shadow-slate-500/20 transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800 dark:bg-slate-400 group-hover:bg-slate-600 dark:group-hover:bg-slate-300 group-hover:shadow-[0_0_15px_rgba(71,85,105,0.8)] dark:group-hover:shadow-[0_0_15px_rgba(148,163,184,0.8)] transition-all duration-500" />
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 pb-6">
                            <CardTitle className="text-xl text-slate-800 dark:text-white">Security & Password</CardTitle>
                            <CardDescription className="dark:text-slate-400">
                                {!requiresCurrentPassword ? "Set a password for your account. You can still log in using Google." : "Change your password here. You may need to log in again after changing."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6 max-w-md">
                            {requiresCurrentPassword && (
                                <div className="space-y-2 group/input">
                                    <Label htmlFor="current" className="text-slate-700 dark:text-slate-300 font-semibold group-focus-within/input:text-slate-900 dark:group-focus-within/input:text-white transition-colors duration-300">Current password</Label>
                                    <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:border-slate-400 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:shadow-[0_0_15px_rgba(148,163,184,0.2)]" />
                                </div>
                            )}
                            <div className="space-y-2 group/input">
                                <Label htmlFor="new" className="text-slate-700 dark:text-slate-300 font-semibold group-focus-within/input:text-slate-900 dark:group-focus-within/input:text-white transition-colors duration-300">{!requiresCurrentPassword ? "Set password" : "New password"}</Label>
                                <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:border-slate-400 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:shadow-[0_0_15px_rgba(148,163,184,0.2)]" />
                            </div>
                            <div className="space-y-2 group/input">
                                <Label htmlFor="confirm" className="text-slate-700 dark:text-slate-300 font-semibold group-focus-within/input:text-slate-900 dark:group-focus-within/input:text-white transition-colors duration-300">Confirm password</Label>
                                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 transition-all duration-300 hover:border-slate-400 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:shadow-[0_0_15px_rgba(148,163,184,0.2)]" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/60 pt-6">
                            <Button onClick={handleSavePassword} disabled={isSavingPassword} className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 shadow-md font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(100,116,139,0.4)] dark:hover:shadow-[0_0_20px_rgba(203,213,225,0.4)] hover:-translate-y-0.5">
                                {isSavingPassword ? "Saving..." : !requiresCurrentPassword ? "Set Password" : "Update Password"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="group border-none shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20 transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 group-hover:bg-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,1)] transition-all duration-500" />
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 pb-6">
                            <CardTitle className="text-xl text-slate-800 dark:text-white">Notification Preferences</CardTitle>
                            <CardDescription className="dark:text-slate-400">Configure how you receive updates and alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 pt-6">
                            <div className="flex items-start justify-between space-x-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <Label htmlFor="email-notif" className="flex flex-col space-y-1.5 cursor-pointer group/label">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover/label:text-emerald-600 dark:group-hover/label:text-emerald-400 transition-colors">Email Notifications</span>
                                    <span className="font-medium text-xs leading-snug text-slate-500 dark:text-slate-400">
                                        Receive emails about your account activity, placement readiness alerts, and academic updates.
                                    </span>
                                </Label>
                                <Switch id="email-notif" defaultChecked className="data-[state=checked]:bg-emerald-500 data-[state=checked]:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all" />
                            </div>
                            <div className="flex items-start justify-between space-x-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <Label htmlFor="marketing-notif" className="flex flex-col space-y-1.5 cursor-pointer group/label">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover/label:text-emerald-600 dark:group-hover/label:text-emerald-400 transition-colors">System Updates</span>
                                    <span className="font-medium text-xs leading-snug text-slate-500 dark:text-slate-400">
                                        Receive occasional emails regarding new ALSA features and platform upgrades.
                                    </span>
                                </Label>
                                <Switch id="marketing-notif" className="data-[state=checked]:bg-emerald-500 data-[state=checked]:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}


