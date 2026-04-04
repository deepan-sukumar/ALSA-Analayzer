"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Loader2,
    Sparkles,
    Briefcase,
    Building2,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/department-core";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "HOD", "Dean", "Other"];

export default function CompleteFacultyProfilePage() {
    const { user, updateUserProfile, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        department: "",
        designation: ""
    });

    // Guard: If already approved or not faculty, redirect away
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === "faculty" && user.approved) {
                router.push("/dashboard/faculty");
            } else if (user.role === "student") {
                router.push("/dashboard/student");
            }
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.department || !formData.designation) {
            toast.error("Please fill in all details.");
            return;
        }

        setIsLoading(true);

        try {
            await updateUserProfile({
                department: formData.department,
                designation: formData.designation,
                role: "faculty",
                approved: false, // Must wait for admin
            });

            toast.success("Details saved! Awaiting admin approval.");
            router.push("/faculty/pending-approval");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="bg-slate-900 p-6 flex items-center gap-4 rounded-t-xl">
                    <div className="h-12 w-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase tracking-tighter text-xl">Faculty Onboarding</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Complete your professional profile</p>
                    </div>
                </div>

                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-blue-500" /> Professional Info
                    </CardTitle>
                    <CardDescription className="font-medium text-slate-500 dark:text-slate-400">
                        Select your academic department and official designation to proceed for administration approval.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            {/* Department Selection */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Academic Department</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, department: val }))}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="Which department?" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] rounded-2xl border-slate-200 dark:border-slate-800">
                                        {IT_DEPARTMENTS.map(dept => (
                                            <SelectItem key={dept} value={dept} className="font-medium">{dept}</SelectItem>
                                        ))}
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                        {CORE_DEPARTMENTS.map(dept => (
                                            <SelectItem key={dept} value={dept} className="font-medium">{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Designation Selection */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Your Designation</Label>
                                <Select
                                    value={formData.designation}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, designation: val }))}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="h-4 w-4 text-slate-400" />
                                            <SelectValue placeholder="What is your role?" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                                        {DESIGNATIONS.map(des => (
                                            <SelectItem key={des} value={des} className="font-medium">{des}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-600/20 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Submit for Approval <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
