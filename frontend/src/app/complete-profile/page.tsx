"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Calendar,
    CheckCircle2,
    GraduationCap,
    Lock,
    School,
    Shield,
    Sparkles,
    UserCircle2,
    Check,
    Loader2
} from "lucide-react";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function CompleteProfilePage() {
    const { user, updateUserProfile, isLoading: authLoading, handleRoleRedirection } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        registerNo: "",
        degree: "UG",
        department: "",
        yearOfStudy: "",
        currentSemester: "",
        gender: "",
        password: "",
        confirmPassword: "",
        cgpa: "",
        attendance: "",
    });

    // Sync form with user data and handle auto-skip
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                gender: user.gender?.toLowerCase() || prev.gender,
                department: user.department || prev.department,
                cgpa: user.cgpa?.toString() || prev.cgpa,
                attendance: user.attendance?.toString() || prev.attendance,
                degree: user.degree || prev.degree,
                yearOfStudy: user.yearOfStudy?.toString() || prev.yearOfStudy,
                currentSemester: user.currentSemester?.toString() || prev.currentSemester,
                registerNo: user.registerNo || prev.registerNo,
            }));

            // Guard: If not a student, redirect to appropriate page
            if (!authLoading && user.role !== "student") {
                handleRoleRedirection(user);
                return;
            }

            // If profile is already complete, don't stay here
            if (!authLoading && (user.isProfileComplete || user.profileCompleted) && user.currentSemester) {
                router.push("/dashboard/student/academic-records/setup");
                return;
            }

            // If user signed up via email/password, they already set gender & password. Skip to Step 2.
            if (user.loginProvider === "password" && step === 1) {
                setStep(2);
            }
        }
    }, [user]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.gender) {
                toast.error("Please select your gender.");
                return;
            }
            // Password check for Google users if they started typing one
            if (user?.loginProvider === "google.com" && formData.password) {
                if (formData.password.length < 6) {
                    toast.error("Password must be at least 6 characters.");
                    return;
                }
                if (formData.password !== formData.confirmPassword) {
                    toast.error("Passwords do not match.");
                    return;
                }
            }
            setStep(2);
        }
    };

    const handleBack = () => setStep(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.registerNo || !formData.department || !formData.yearOfStudy || !formData.currentSemester || !formData.cgpa || !formData.attendance) {
            toast.error("Please fill in all mandatory details.");
            return;
        }

        if (formData.registerNo.length < 5) {
            toast.error("Please enter a valid Register Number.");
            return;
        }

        const cgpaVal = parseFloat(formData.cgpa);
        if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
            toast.error("CGPA must be between 0 and 10.");
            return;
        }

        const attendVal = parseInt(formData.attendance);
        if (isNaN(attendVal) || attendVal < 0 || attendVal > 100) {
            toast.error("Attendance must be between 0 and 100.");
            return;
        }

        setIsLoading(true);

        try {
            const totalSemesters = formData.degree === "UG" ? 8 : 4;

            await updateUserProfile({
                registerNo: formData.registerNo,
                gender: (formData.gender.toUpperCase() || user?.gender) as any,
                degree: formData.degree as "UG" | "PG",
                department: formData.department,
                yearOfStudy: parseInt(formData.yearOfStudy),
                currentSemester: parseInt(formData.currentSemester),
                totalSemesters: totalSemesters,
                cgpa: cgpaVal,
                attendance: attendVal,
                isProfileComplete: true,
                role: "student",
                approved: true, // Students are auto-approved in this system
                academicRecords: [],
                newPassword: formData.password || undefined,
                hasPassword: !!formData.password || user?.hasPassword
            });

            toast.success("Profile fully set up!");
            router.push("/dashboard/student/academic-records/setup");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to complete profile.");
        } finally {
            setIsLoading(false);
        }
    };

    // Loading screen while syncing
    if (user?.loginProvider === "password" && step === 1) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm italic">Syncing Profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center overflow-x-hidden bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <Card className="w-full max-w-xl shadow-2xl border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Visual Step Indicator Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-tighter text-lg leading-none">Onboarding</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Finalizing your credentials</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {[1, 2].map(s => (
                            <div key={s} className={cn(
                                "h-2 w-8 rounded-full transition-all duration-500",
                                step >= s ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-700"
                            )}></div>
                        ))}
                    </div>
                </div>

                <CardHeader className="px-5 pt-6 pb-4 sm:px-8 sm:pt-8">
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        {step === 1 ? (
                            <><UserCircle2 className="h-6 w-6 text-blue-500" /> Basic Details</>
                        ) : (
                            <><GraduationCap className="h-6 w-6 text-blue-500" /> Academic Setup</>
                        )}
                    </CardTitle>
                    <CardDescription className="font-medium text-slate-500 dark:text-slate-400">
                        {step === 1
                            ? "Provide essential information to secure and personalize your account."
                            : "Enter your current academic metrics to initialize your dashboard."
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                                {/* Gender Selection Premium */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Select Gender</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleChange("gender", "male")}
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-3",
                                                formData.gender === "male"
                                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-md"
                                                    : "bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 hover:border-slate-400"
                                            )}
                                        >
                                            <span className="text-lg">👨</span>
                                            <span className="font-black uppercase text-xs tracking-widest">Male</span>
                                            {formData.gender === "male" && <Check className="h-4 w-4 ml-auto" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange("gender", "female")}
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-3",
                                                formData.gender === "female"
                                                    ? "bg-pink-50 dark:bg-pink-900/20 border-pink-500 text-pink-700 dark:text-pink-400 shadow-md"
                                                    : "bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 hover:border-slate-400"
                                            )}
                                        >
                                            <span className="text-lg">👩</span>
                                            <span className="font-black uppercase text-xs tracking-widest">Female</span>
                                            {formData.gender === "female" && <Check className="h-4 w-4 ml-auto" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Section (Only for Google) */}
                                {user?.loginProvider === "google.com" && (
                                    <div className="space-y-6 pt-2">
                                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex gap-4 transition-all">
                                            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                                <Shield className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-400">Security Recommendation</p>
                                                <p className="text-[11px] leading-relaxed text-amber-900/70 dark:text-amber-300/60 font-medium">Set a local password to enable login fallback if Google services are unavailable.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 group/input">
                                            <div className="space-y-2">
                                                <Label htmlFor="password" title="Set account password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-focus-within/input:text-blue-500 transition-colors">Local Password (Optional)</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        className="h-12 pl-11 bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 focus:border-blue-500 transition-all rounded-xl"
                                                        placeholder="Min 6 characters"
                                                        value={formData.password}
                                                        onChange={(e) => handleChange("password", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {formData.password && (
                                                <div className="space-y-2 group/input animate-in slide-in-from-top-2 duration-300">
                                                    <Label htmlFor="confirmPassword" title="Confirm password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Confirm Password</Label>
                                                    <div className="relative">
                                                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                                                        <Input
                                                            id="confirmPassword"
                                                            type="password"
                                                            className="h-12 pl-11 bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 focus:border-emerald-500 transition-all rounded-xl"
                                                            value={formData.confirmPassword}
                                                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button type="button" onClick={handleNext} className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                                    Next: Academic Info <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-500">
                                {/* Register Number (Crucial) */}
                                <div className="space-y-2 group/input">
                                    <Label htmlFor="registerNo" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-focus-within/input:text-blue-500 transition-colors">Register Number / ID</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within/input:text-blue-500 transition-colors" />
                                        <Input
                                            id="registerNo"
                                            className="h-12 pl-11 bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 focus:border-blue-500 transition-all rounded-xl font-mono font-bold"
                                            placeholder="71762104xxx"
                                            value={formData.registerNo}
                                            onChange={(e) => handleChange("registerNo", e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Department (Dropdown) */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Academic Department</Label>
                                    <Select
                                        value={formData.department}
                                        onValueChange={(val) => handleChange("department", val)}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {IT_DEPARTMENTS.map(dept => (
                                                <SelectItem key={dept} value={dept} className="font-medium">{dept}</SelectItem>
                                            ))}
                                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                            {CORE_DEPARTMENTS.map(dept => (
                                                <SelectItem key={dept} value={dept} className="font-medium">{dept}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Current CGPA</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-12 rounded-xl bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 font-bold"
                                            placeholder="e.g. 8.5"
                                            value={formData.cgpa}
                                            onChange={(e) => handleChange("cgpa", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Attendance %</Label>
                                        <Input
                                            type="number"
                                            className="h-12 rounded-xl bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800 font-bold"
                                            placeholder="e.g. 85"
                                            value={formData.attendance}
                                            onChange={(e) => handleChange("attendance", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Year of Study</Label>
                                        <Select value={formData.yearOfStudy} onValueChange={(val) => handleChange("yearOfStudy", val)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4].map(y => <SelectItem key={y} value={y.toString()} className="font-medium">{y}{y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Current Sem</Label>
                                        <Select value={formData.currentSemester} onValueChange={(val) => handleChange("currentSemester", val)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-950/50 border-slate-300 dark:border-slate-800">
                                                <SelectValue placeholder="Sem" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: formData.degree === "UG" ? 8 : 4 }, (_, i) => i + 1).map(sem => (
                                                    <SelectItem key={sem} value={sem.toString()} className="font-medium">Semester {sem}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                                    <Button type="button" variant="outline" onClick={handleBack} className="h-12 flex-1 rounded-xl border-slate-300 dark:border-slate-800 font-black uppercase tracking-widest text-xs">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="submit" className="h-12 flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20" disabled={isLoading}>
                                        {isLoading ? "Saving Profile..." : "Initialize Dashboard"} <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card >
        </div >
    );
}

