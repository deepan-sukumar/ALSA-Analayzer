"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    GraduationCap, BookOpen, User, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";

const STEPS = ["Role", "Account", "Details"];

export default function SignupPage() {
    const router = useRouter();
    const { signup, googleLogin } = useAuth();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"student" | "faculty">("student");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [gender, setGender] = useState<"male" | "female" | "">("");
    const [formData, setFormData] = useState({
        name: "", email: "", password: "", confirmPassword: "",
        cgpa: "", attendance: "", department: "", designation: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleNext = () => {
        if (step === 2) {
            if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !gender) {
                toast.error("Please fill in all fields."); return;
            }
            const email = formData.email.toLowerCase();
            if (role === "student") {
                if (!email.endsWith("@gmail.com") && !email.endsWith("@bitsathy.ac.in")) {
                    toast.error("Students must use @gmail.com or @bitsathy.ac.in"); return;
                }
            } else {
                if (!email.endsWith("@college.edu") && !email.endsWith("@teacher.ac.in")) {
                    toast.error("Faculty must use @college.edu or @teacher.ac.in"); return;
                }
            }
            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match."); return;
            }
        }
        setStep((prev) => prev + 1);
    };

    const handleBack = () => setStep((prev) => prev - 1);

    const handleSubmit = async () => {
        if (role === "student") {
            if (!formData.cgpa || !formData.attendance || !formData.department) {
                toast.error("Please fill in CGPA, Attendance, and Department"); return;
            }
            const cgpa = parseFloat(formData.cgpa);
            if (cgpa < 0 || cgpa > 10) { toast.error("CGPA must be between 0 and 10"); return; }
            const attendance = parseInt(formData.attendance);
            if (attendance < 0 || attendance > 100) { toast.error("Attendance must be between 0 and 100"); return; }
        } else {
            if (!formData.department || !formData.designation) {
                toast.error("Please fill in Department and Designation"); return;
            }
        }
        if (!formData.email || !formData.password) { toast.error("Email and Password are required"); return; }
        setLoading(true);
        try {
            await signup({ ...formData, role, gender: gender.toUpperCase() });
        } catch (error: any) {
            if (error.code === "auth/email-already-in-use") {
                toast.error("Email already exists. Please sign in.");
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await googleLogin(role);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex bg-white overflow-x-hidden">
            {/* ── Left Branding Panel ── */}
            <div className="hidden lg:flex flex-col justify-between w-[40%] xl:w-[36%] relative overflow-hidden p-8 xl:p-12 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800">
                <div className="absolute top-0 right-0 w-[60%] h-[50%] rounded-full bg-white/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[40%] rounded-full bg-indigo-900/30 blur-[80px] pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none opacity-[0.12]"
                    style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4" />Back to home
                    </Link>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="p-3 rounded-2xl bg-white/15 backdrop-blur border border-white/20 w-fit">
                        <GraduationCap className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-white leading-tight">
                            Join the future <br />of academics.
                        </h2>
                        <p className="text-white/70 text-base max-w-xs leading-relaxed">
                            Create your ALSA account in under 2 minutes and get instant access to AI-driven placement insights.
                        </p>
                    </div>

                    {/* Step tracker */}
                    <div className="space-y-3 pt-2">
                        {STEPS.map((s, i) => (
                            <div key={s} className={`flex items-center gap-3 transition-all duration-300 ${step > i ? "opacity-100" : "opacity-40"}`}>
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black border transition-all duration-300 ${step > i + 1 ? "bg-emerald-400 border-emerald-400 text-white" : step === i + 1 ? "bg-white border-white text-violet-700" : "border-white/30 text-white/40"}`}>
                                    {step > i + 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                                </div>
                                <span className={`text-sm font-semibold ${step === i + 1 ? "text-white" : "text-white/50"}`}>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-xs text-white/40 font-medium">© 2026 ALSA · Academic Learning &amp; Skills Analyzer</p>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-4 py-20 sm:px-6 sm:py-12 md:px-10 lg:px-12">
                {/* Mobile top bar */}
                <div className="lg:hidden absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between gap-3">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4" />Home
                    </Link>
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step > i ? (step === i + 1 ? "w-6 bg-violet-500" : "w-3 bg-emerald-400") : "w-3 bg-slate-200"}`} />
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-sm sm:max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* Step header */}
                    <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-600">Step {step} of 3</p>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {step === 1 && "Choose your role"}
                            {step === 2 && "Create account"}
                            {step === 3 && (role === "student" ? "Academic details" : "Professional details")}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {step === 1 && "Select how you'll be using ALSA"}
                            {step === 2 && "Set up your secure credentials"}
                            {step === 3 && "A few more details to personalise your experience"}
                        </p>
                    </div>

                    {/* ── Step 1: Role ── */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(["student", "faculty"] as const).map((r) => {
                                    const Icon = r === "student" ? GraduationCap : BookOpen;
                                    const isActive = role === r;
                                    return (
                                        <button key={r} onClick={() => setRole(r)}
                                            className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 ${isActive
                                                ? "border-violet-400 bg-violet-50 shadow-xl shadow-violet-100"
                                                : "border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-md"}`}>
                                            <div className={`p-4 rounded-2xl transition-all duration-300 ${isActive
                                                ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md"
                                                : "bg-slate-100 text-slate-400"}`}>
                                                <Icon className="h-8 w-8" />
                                            </div>
                                            <div className="text-center">
                                                <p className={`font-bold text-base capitalize ${isActive ? "text-violet-700" : "text-slate-500"}`}>{r}</p>
                                                <p className="text-xs text-slate-400 mt-1">{r === "student" ? "Track & grow" : "Manage & analyse"}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-400 font-bold tracking-widest">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={googleLoading}
                                className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                            >
                                {googleLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.3 0 6.2 1.2 8.5 3.1l6.3-6.3C34.8 2.9 29.7.5 24 .5 14.7.5 6.8 6 3 14l7.4 5.7C12.2 13.2 17.6 9.5 24 9.5z" />
                                            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.3 5.4-4.8 7l7.4 5.7c4.3-4 6.9-9.9 7.2-16.7z" />
                                            <path fill="#FBBC05" d="M10.4 28.2A14.6 14.6 0 0 1 9.5 24c0-1.5.3-2.9.7-4.3L2.8 14C1 17.1 0 20.4 0 24s1 6.9 2.8 9.9l7.6-5.7z" />
                                            <path fill="#34A853" d="M24 47.5c5.7 0 10.5-1.9 14-5.1l-7.4-5.7c-1.9 1.3-4.2 2-6.6 2-6.4 0-11.8-3.7-13.7-9.4L3 34.9C6.8 42 14.7 47.5 24 47.5z" />
                                        </svg>
                                        Sign up with Google
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* ── Step 2: Account ── */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-6 fade-in duration-400">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                                    <Input id="name" placeholder="Jane Doe" value={formData.name} onChange={handleInputChange}
                                        className="pl-10 h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                                    <Input id="email" type="email" placeholder="you@university.edu" value={formData.email} onChange={handleInputChange}
                                        className="pl-10 h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(["male", "female"] as const).map((g) => (
                                        <button key={g} type="button" onClick={() => setGender(g)}
                                            className={`h-11 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 shadow-sm ${gender === g
                                                ? g === "male" ? "border-blue-400 bg-blue-50 text-blue-700 shadow-blue-100" : "border-pink-400 bg-pink-50 text-pink-700 shadow-pink-100"
                                                : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-400"}`}>
                                            <span className="text-base">{g === "male" ? "👨" : "👩"}</span>
                                            <span className="capitalize">{g}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                                        <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange}
                                            className="pl-10 h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-300" />
                                        <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange}
                                            className="pl-10 h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Details ── */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right-6 fade-in duration-400">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</Label>
                                <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}>
                                    <SelectTrigger className="h-12 bg-white border-2 border-slate-300 text-slate-900 focus:ring-violet-500 focus:border-violet-400 focus:ring-offset-0 rounded-xl shadow-md font-medium">
                                        <SelectValue placeholder="Select department…" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                        {IT_DEPARTMENTS.map((d) => (
                                            <SelectItem key={d} value={d} className="focus:bg-violet-50 focus:text-violet-900 cursor-pointer">{d}</SelectItem>
                                        ))}
                                        <div className="h-px bg-slate-100 my-1" />
                                        {CORE_DEPARTMENTS.map((d) => (
                                            <SelectItem key={d} value={d} className="focus:bg-violet-50 focus:text-violet-900 cursor-pointer">{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {role === "student" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CGPA</Label>
                                        <Input id="cgpa" placeholder="e.g. 8.5" type="number" step="0.01" value={formData.cgpa} onChange={handleInputChange}
                                            className="h-12 bg-white border-2 border-slate-300 text-slate-900 font-bold placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance %</Label>
                                        <Input id="attendance" placeholder="e.g. 85" type="number" value={formData.attendance} onChange={handleInputChange}
                                            className="h-12 bg-white border-2 border-slate-300 text-slate-900 font-bold placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</Label>
                                    <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, designation: val }))}>
                                        <SelectTrigger className="h-12 bg-white border-2 border-slate-300 text-slate-900 focus:ring-violet-500 focus:border-violet-400 focus:ring-offset-0 rounded-xl shadow-md font-medium">
                                            <SelectValue placeholder="Select title…" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                            {["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "HOD"].map((t) => (
                                                <SelectItem key={t} value={t} className="focus:bg-violet-50 focus:text-violet-900 cursor-pointer">{t === "HOD" ? "Head of Department" : t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className="flex gap-3 pt-2">
                        {step > 1 && (
                            <Button type="button" onClick={handleBack} disabled={loading}
                                className="h-12 px-5 rounded-xl bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 shadow-md transition-all">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button type="button" onClick={handleNext}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all duration-300 hover:-translate-y-0.5">
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleSubmit} disabled={loading}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 hover:-translate-y-0.5">
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Create Account</>}
                            </Button>
                        )}
                    </div>

                    <p className="text-center text-sm text-slate-400 pt-1">
                        Already have an account?{" "}
                        <Link href="/login" className="font-bold text-violet-600 hover:text-violet-800 transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

