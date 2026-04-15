"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, BookOpen, Loader2, AlertCircle, ArrowLeft, BarChart3, BrainCircuit, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const HIGHLIGHTS = [
    { icon: BarChart3, text: "Placement readiness scores" },
    { icon: BrainCircuit, text: "AI-powered risk analysis" },
    { icon: TrendingUp, text: "CGPA trend analytics" },
    { icon: Zap, text: "Real-time Firestore sync" },
];

export default function LoginPage() {
    const [role, setRole] = useState<"student" | "faculty">("student");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, googleLogin } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login({ email, password });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError("");
        try {
            // Explicitly pass the current local role to ensure intent is preserved
            await googleLogin(role);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex bg-white overflow-x-hidden">
            {/* ── Left Branding Panel ── */}
            <div className="hidden lg:flex flex-col justify-between w-[46%] xl:w-[42%] relative overflow-hidden p-8 xl:p-12 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800">
                {/* Subtle inner light */}
                <div className="absolute top-0 right-0 w-[60%] h-[50%] rounded-full bg-white/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[40%] rounded-full bg-indigo-900/30 blur-[80px] pointer-events-none" />
                {/* Dot pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.12]"
                    style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4" />Back to home
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="p-3 rounded-2xl bg-white/15 backdrop-blur border border-white/20 w-fit">
                        <GraduationCap className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-white leading-tight">
                            Your academic <br />intelligence hub.
                        </h2>
                        <p className="text-white/70 text-base max-w-xs leading-relaxed">
                            ALSA transforms complex academic data into clear, actionable placement insights.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {HIGHLIGHTS.map((h) => (
                            <div key={h.text} className="flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-xl px-4 py-3">
                                <h.icon className="h-4 w-4 text-white/80 shrink-0" />
                                <span className="text-xs font-medium text-white/80">{h.text}</span>
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
                {/* Mobile back */}
                <div className="lg:hidden absolute top-4 left-4 sm:top-6 sm:left-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4" />Home
                    </Link>
                </div>

                <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-7 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="space-y-1.5">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
                        <p className="text-slate-400 text-sm">Sign in to your ALSA account</p>
                    </div>

                    {/* Role toggle */}
                    <div className="flex flex-wrap p-1 gap-1 rounded-2xl bg-slate-100 border-2 border-slate-300">
                        {(["student", "faculty"] as const).map((r) => (
                            <button key={r} onClick={() => {
                                setRole(r);
                                localStorage.setItem("alsa_preferred_role", r);
                            }}
                                suppressHydrationWarning
                                className={`min-w-0 flex-1 flex items-center justify-center gap-2 h-10 rounded-xl px-2 text-sm font-semibold transition-all duration-300 ${role === r
                                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-700"}`}>
                                {r === "student" ? <GraduationCap className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                                <span className="capitalize">{r}</span>
                            </button>
                        ))}
                    </div>

                    {/* Google */}
                    <button type="button" onClick={handleGoogleLogin} disabled={loading || googleLoading}
                        suppressHydrationWarning
                        className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-white border-2 border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50">
                        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : (
                            <>
                                <svg className="h-5 w-5" viewBox="0 0 48 48">
                                    <path fill="#EA4335" d="M24 9.5c3.3 0 6.2 1.2 8.5 3.1l6.3-6.3C34.8 2.9 29.7.5 24 .5 14.7.5 6.8 6 3 14l7.4 5.7C12.2 13.2 17.6 9.5 24 9.5z" />
                                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.3 5.4-4.8 7l7.4 5.7c4.3-4 6.9-9.9 7.2-16.7z" />
                                    <path fill="#FBBC05" d="M10.4 28.2A14.6 14.6 0 0 1 9.5 24c0-1.5.3-2.9.7-4.3L2.8 14C1 17.1 0 20.4 0 24s1 6.9 2.8 9.9l7.6-5.7z" />
                                    <path fill="#34A853" d="M24 47.5c5.7 0 10.5-1.9 14-5.1l-7.4-5.7c-1.9 1.3-4.2 2-6.6 2-6.4 0-11.8-3.7-13.7-9.4L3 34.9C6.8 42 14.7 47.5 24 47.5z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-slate-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-4 text-xs uppercase tracking-widest font-semibold text-slate-400">or</span>
                        </div>
                    </div>

                    {/* Email/password form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</Label>
                            <Input type="email" placeholder="you@university.edu" required value={email} onChange={(e) => setEmail(e.target.value)}
                                suppressHydrationWarning
                                className="h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</Label>
                            <Input type="password" placeholder="••••••••••" required value={password} onChange={(e) => setPassword(e.target.value)}
                                suppressHydrationWarning
                                className="h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-300 focus-visible:ring-violet-500 focus-visible:border-violet-400 focus-visible:ring-offset-0 rounded-xl shadow-md" />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-700 text-sm font-medium">
                                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                            </div>
                        )}

                        <Button type="submit" disabled={loading || googleLoading}
                            suppressHydrationWarning
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all duration-300 hover:-translate-y-0.5">
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign In"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-bold text-violet-600 hover:text-violet-800 transition-colors">Create one free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

