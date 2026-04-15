"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GraduationCap, Users, ArrowRight, Loader2, BookOpen, Briefcase, Sparkles } from "lucide-react";
import { createUserDocument } from "@/lib/firebase/firestore";
import { auth, db } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ALL_DEPARTMENTS = [...IT_DEPARTMENTS, ...CORE_DEPARTMENTS].sort();
const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "HOD", "Dean", "Other"];

export default function SelectRolePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [department, setDepartment] = useState("");
    const [selectedRole, setSelectedRole] = useState<"student" | "faculty" | null>(null);
    const [designation, setDesignation] = useState("");

    // Initialize from user state if available
    useEffect(() => {
        if (user?.role) {
            setSelectedRole(user.role as any);
        }
    }, [user]);

    const handleRegistration = async () => {
        if (!auth.currentUser) return;
        if (!department) {
            toast.error("Please select your department.");
            return;
        }
        if (!selectedRole) {
            toast.error("Please select your role.");
            return;
        }
        if (selectedRole === "faculty" && !designation) {
            toast.error("Please select your designation.");
            return;
        }

        setIsLoading(true);

        try {
            const userData = {
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName || "Google User",
                email: auth.currentUser.email,
                role: selectedRole,
                department: department,
                approved: selectedRole === "student" ? true : false,
                // Critical: Students must complete their profile details (Reg No, Sem, Year)
                // Faculty must be approved by admin.
                isProfileComplete: false,
                profileCompleted: false,
                areGradesComplete: false,
                gradesCompleted: false,
                ...(selectedRole === "faculty" ? { designation } : {})
            };

            await createUserDocument(auth.currentUser.uid, userData);

            if (selectedRole === "student") {
                await setDoc(doc(db, "students", auth.currentUser.uid), {
                    uid: auth.currentUser.uid,
                    name: auth.currentUser.displayName || "Google User",
                    email: auth.currentUser.email || "",
                    department: department,
                    cgpa: 0,
                    pri: 0,
                    riskLevel: "High",
                    arrears: 0,
                    weakestModule: "None",
                    updatedAt: new Date(),
                }, { merge: true });
            } else if (selectedRole === "faculty") {
                await setDoc(doc(db, "faculty", auth.currentUser.uid), {
                    uid: auth.currentUser.uid,
                    name: auth.currentUser.displayName || "Google User",
                    email: auth.currentUser.email || "",
                    department: department,
                    approved: false,
                    designation: designation,
                }, { merge: true });
            }

            toast.success(`Registered as ${selectedRole.toUpperCase()}`);

            if (selectedRole === "student") {
                // Force to complete profile for Reg No, Year, Semester
                router.push("/complete-profile");
            } else {
                router.push("/faculty/pending-approval");
            }
        } catch (error: any) {
            console.error("Role selection error:", error);
            toast.error("Failed to save role: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center overflow-x-hidden bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <Card className="w-full max-w-4xl shadow-2xl border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="grid md:grid-cols-5 h-full">
                    {/* Left Panel - Branding */}
                    <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_70%)] opacity-50"></div>
                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-6">
                                <Sparkles className="h-6 w-6 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter mb-4 italic uppercase">Identity Setup</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Join the next generation of professional readiness tracking. Select your role to unlock personalized analytics and growth roadmaps.
                            </p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4 group">
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/40 transition-all">
                                    <BookOpen className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="text-xs">
                                    <span className="block font-black uppercase text-slate-300 tracking-widest">Academic Hub</span>
                                    <span className="text-slate-500 font-bold">Comprehensive data sync</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500/40 transition-all">
                                    <Briefcase className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="text-xs">
                                    <span className="block font-black uppercase text-slate-300 tracking-widest">Career Strategy</span>
                                    <span className="text-slate-500 font-bold">AI-driven placement insights</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="md:col-span-3 p-5 sm:p-6 md:p-10 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Final Step, {auth.currentUser?.displayName?.split(" ")[0] || "User"}</h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Complete your profile to access the platform.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Department Selection */}
                                <div className="space-y-3 group/input">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-focus-within/input:text-blue-500 transition-colors">
                                        Academic Department
                                    </Label>
                                    <Select value={department} onValueChange={setDepartment}>
                                        <SelectTrigger className="h-12 bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                                            <SelectValue placeholder="Pick your department..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {ALL_DEPARTMENTS.map((dept) => (
                                                <SelectItem key={dept} value={dept} className="font-medium">{dept}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Role Selection Cards (Only show if role not pre-selected) */}
                                {!user?.role && (
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Primary Role
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole("student")}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group",
                                                    selectedRole === "student"
                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-500/10"
                                                        : "bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                                                    selectedRole === "student" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                )}>
                                                    <GraduationCap className="h-5 w-5" />
                                                </div>
                                                <span className={cn("block font-black text-sm uppercase", selectedRole === "student" ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>Student</span>
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">Full academic & placement hub</span>
                                                {selectedRole === "student" && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole("faculty")}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group",
                                                    selectedRole === "faculty"
                                                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10"
                                                        : "bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                                                    selectedRole === "faculty" ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                )}>
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <span className={cn("block font-black text-sm uppercase", selectedRole === "faculty" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300")}>Faculty</span>
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">Administration & monitoring</span>
                                                {selectedRole === "faculty" && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Designation Selection (Faculty Only) */}
                                {selectedRole === "faculty" && (
                                    <div className="space-y-3 group/input animate-in slide-in-from-top-2 duration-300">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-500 transition-colors">
                                            Academic Designation
                                        </Label>
                                        <Select value={designation} onValueChange={setDesignation}>
                                            <SelectTrigger className="h-12 bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                                                <SelectValue placeholder="Select your designation..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DESIGNATIONS.map((des) => (
                                                    <SelectItem key={des} value={des} className="font-medium">{des}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button
                                    onClick={handleRegistration}
                                    disabled={isLoading}
                                    className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-xl disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                            Finalizing Account...
                                        </>
                                    ) : (
                                        <>
                                            Complete Registration <ArrowRight className="h-5 w-5 ml-3" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

