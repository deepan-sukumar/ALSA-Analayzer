"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  TrendingUp,
  Zap,
  ChevronRight,
  BookOpen,
  BrainCircuit,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  Flame,
  Star,
  Sparkles,
  FileBarChart,
  AlertCircle,
  RadarIcon,
} from "lucide-react";

const NAV_ITEMS = ["For Students", "For Faculty", "How It Works", "About"];

const STUDENT_FEATURES = [
  { icon: Flame, title: "Placement Readiness Index (PRI)", desc: "Your composite placement score across 6 modules: Academic, Technical Role Fit, Core Coverage, Aptitude, Enrichment, and Consistency.", color: "violet" },
  { icon: RadarIcon, title: "Skill Radar Chart", desc: "A visual 6-axis radar breaking down your PRI into component scores — see exactly where you stand and what to improve.", color: "blue" },
  { icon: TrendingUp, title: "CGPA & Semester Trend", desc: "Longitudinal line chart of your SGPA across each semester to track growth — or catch decline — early.", color: "indigo" },
  { icon: Target, title: "Placement Tier Eligibility", desc: "Know if you qualify for Product, Service, or Core companies based on your current PRI before placements begin.", color: "emerald" },
  { icon: AlertTriangle, title: "Personal Drawback Engine", desc: "AI flags for specific weaknesses: low aptitude, missing core topics, poor attendance, or skill gaps in your preferred role.", color: "amber" },
  { icon: Sparkles, title: "Academic Enrichment Score", desc: "Track certifications, internships, projects, and hackathons. Your Enrichment module contributes directly to your PRI.", color: "pink" },
];

const FACULTY_FEATURES = [
  { icon: BarChart3, title: "Class Avg PRI Dashboard", desc: "5-KPI command center: Total Students, Class Average PRI, High Risk Count, Critical Risk Count, and Average CGPA — live from Firestore.", color: "violet" },
  { icon: Activity, title: "PRI Module Breakdown", desc: "Department-level bar chart showing class averages per module: Academic, Core, Role Fit, Aptitude, and Enrichment.", color: "blue" },
  { icon: Target, title: "Risk Distribution Pie", desc: "Pie chart segmenting your cohort into Ready (≥75), Moderate (60–74), High (40–59), and Critical (<40) risk tiers.", color: "rose" },
  { icon: BrainCircuit, title: "AI Class Performance Gaps", desc: "Auto-identified cohort-wide drawbacks with root cause analysis and a Faculty Action Plan for each problem domain.", color: "indigo" },
  { icon: AlertCircle, title: "Urgent Intervention Monitor", desc: "Ranked list of the 5 most at-risk students with their primary drawbacks and a Smart Recovery Roadmap.", color: "orange" },
  { icon: FileBarChart, title: "Core & Enrichment Gap Intel", desc: "Separate leaderboards for students with lowest Core Academic Coverage and worst Enrichment participation.", color: "emerald" },
];

const PRI_MODULES = [
  { name: "Academic", weight: "40%", desc: "CGPA, SGPA, arrears", color: "#7c3aed", bg: "bg-violet-100", text: "text-violet-700" },
  { name: "Core Coverage", weight: "25%", desc: "Subject topic mastery", color: "#2563eb", bg: "bg-blue-100", text: "text-blue-700" },
  { name: "Role Fit", weight: "15%", desc: "Preferred role skill match", color: "#059669", bg: "bg-emerald-100", text: "text-emerald-700" },
  { name: "Aptitude", weight: "10%", desc: "Quant, Verbal, DI, Logic", color: "#d97706", bg: "bg-amber-100", text: "text-amber-700" },
  { name: "Enrichment", weight: "10%", desc: "Certs, internships, projects", color: "#db2777", bg: "bg-pink-100", text: "text-pink-700" },
];

const RISK_TIERS = [
  { label: "Ready", range: "PRI ≥ 75", color: "#16a34a", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", desc: "Product & Service tier eligible" },
  { label: "Moderate", range: "PRI 60–74", color: "#4f46e5", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", desc: "Service companies — fix skill gaps" },
  { label: "High Risk", range: "PRI 40–59", color: "#ea580c", bg: "bg-orange-50 border-orange-200", text: "text-orange-700", desc: "Needs focused intervention plan" },
  { label: "Critical", range: "PRI < 40", color: "#dc2626", bg: "bg-red-50 border-red-200", text: "text-red-700", desc: "Urgent faculty roadmap required" },
];

const colorMap: Record<string, string> = {
  violet: "bg-violet-50 border-violet-200 text-violet-600",
  blue: "bg-blue-50 border-blue-200 text-blue-600",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
  amber: "bg-amber-50 border-amber-200 text-amber-600",
  pink: "bg-pink-50 border-pink-200 text-pink-600",
  rose: "bg-rose-50 border-rose-200 text-rose-600",
  orange: "bg-orange-50 border-orange-200 text-orange-600",
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"student" | "faculty">("student");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = activeTab === "student" ? STUDENT_FEATURES : FACULTY_FEATURES;

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 shadow-md" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">ALSA</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
            <Link href="/signup"
              className="text-sm font-bold px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md hover:shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 bg-gradient-to-b from-violet-50/60 via-white to-white">
        {/* Subtle radial */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-violet-100/60 blur-[120px] pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.4]"
          style={{ backgroundImage: "radial-gradient(circle, #c4b5fd 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold tracking-widest uppercase">
            <Zap className="h-3 w-3" />Academic Intelligence Platform
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] text-slate-900">
            Your Placement
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Readiness Score</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 leading-relaxed">
            ALSA calculates your <span className="text-slate-900 font-bold">Placement Readiness Index (PRI)</span> across 5 weighted modules — Academic, Core Coverage, Role Fit, Aptitude, and Enrichment — so you know exactly where you stand before placements begin.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-violet-200 hover:shadow-violet-300 transition-all duration-300 hover:-translate-y-1">
              Check My PRI Score <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-base shadow-md hover:shadow-lg transition-all duration-300">
              Faculty Portal <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRI Module Breakdown ── */}
      <section id="how-it-works" className="py-24 bg-slate-50 border-y-2 border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <p className="text-violet-600 font-bold text-xs uppercase tracking-[0.3em]">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">The PRI is made up of 5 modules</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Your score is a weighted composite. Fix the right module and your PRI climbs.</p>
          </div>
          <div className="space-y-3">
            {PRI_MODULES.map((m) => (
              <div key={m.name} className="flex items-center gap-5 p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-violet-300 shadow-md hover:shadow-lg transition-all duration-300 group">
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${m.bg} shrink-0`}>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${m.bg} ${m.text}`}>{m.weight}</span>
                    <span className="text-xs text-slate-400">{m.desc}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: m.weight, backgroundColor: m.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk Tiers ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <p className="text-violet-600 font-bold text-xs uppercase tracking-[0.3em]">Placement Tiers</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Know your tier before placement day</h2>
            <p className="text-slate-500 max-w-lg mx-auto">ALSA classifies every student into one of four tiers based on their live PRI score.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RISK_TIERS.map((t) => (
              <div key={t.label} className={`rounded-2xl border-2 p-6 space-y-3 ${t.bg} hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                <div className={`text-2xl font-black ${t.text}`}>{t.label}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.range}</div>
                <div className="h-1 rounded-full" style={{ backgroundColor: t.color }} />
                <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Tabs ── */}
      <section id="for-students" className="py-24 bg-slate-50 border-t-2 border-slate-200 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <p className="text-violet-600 font-bold text-xs uppercase tracking-[0.3em]">Platform Features</p>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900">Built for every role</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Switch between what ALSA offers students vs. faculty.</p>
          </div>
          <div className="flex justify-center mb-10">
            <div className="flex p-1 gap-1 rounded-2xl bg-slate-100 border-2 border-slate-300 w-fit">
              {(["student", "faculty"] as const).map((t) => {
                const Icon = t === "student" ? GraduationCap : Users;
                return (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === t
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"}`}>
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div id="for-faculty" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const cls = colorMap[f.color];
              return (
                <div key={f.title}
                  className="relative rounded-2xl border-2 border-slate-200 hover:border-violet-200 bg-white p-7 group hover:-translate-y-2 transition-all duration-500 hover:shadow-xl shadow-md animate-in fade-in duration-300">
                  <div className={`inline-flex p-3 rounded-xl mb-4 border ${cls}`}>
                    <f.icon className={`h-5 w-5 ${cls.split(" ").pop()}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Faculty Analytics Preview ── */}
      <section className="py-24 px-6 border-t-2 border-slate-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <p className="text-violet-600 font-bold text-xs uppercase tracking-[0.3em]">For Faculty</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              See your entire cohort's risk in <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">one view</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              The Faculty Intelligence Portal gives you KPIs, risk distribution, module gaps, and AI-generated action plans — all scoped to your department, live from the database.
            </p>
            <ul className="space-y-3">
              {["Live PRI averages by module for your class", "Risk distribution: Ready / Moderate / High / Critical", "AI-identified cohort-wide performance gaps", "Per-student drawbacks & smart recovery roadmaps", "Core gap & enrichment gap intel boards"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-violet-600 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Faculty KPI mock */}
          <div className="rounded-3xl border-2 border-slate-300 bg-white p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-900 font-bold">Faculty Intelligence Portal</p>
                <p className="text-slate-400 text-xs">Computer Science · Live</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-700 text-xs font-bold">● Live</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Students", val: "148", gradient: "from-indigo-600 to-indigo-800" },
                { label: "Avg PRI", val: "72%", gradient: "from-violet-600 to-violet-800" },
                { label: "Avg CGPA", val: "7.8", gradient: "from-cyan-600 to-blue-700" },
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-xl bg-gradient-to-br ${kpi.gradient} p-4 text-center`}>
                  <p className="text-2xl font-black text-white">{kpi.val}</p>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Risk Distribution</p>
              {[
                { name: "Ready (≥75)", count: 52, color: "#16a34a", pct: 35 },
                { name: "Moderate (60–74)", count: 61, color: "#4f46e5", pct: 41 },
                { name: "High (40–59)", count: 24, color: "#ea580c", pct: 16 },
                { name: "Critical (<40)", count: 11, color: "#dc2626", pct: 8 },
              ].map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>{d.name}</span>
                    <span className="font-bold text-slate-900">{d.count} students</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-red-50 border-2 border-red-300 p-4">
              <p className="text-xs font-black text-red-600 flex items-center gap-2 mb-1"><AlertTriangle className="h-3.5 w-3.5" />AI Gap Detected</p>
              <p className="text-xs text-slate-600 leading-relaxed">Aptitude coverage critically low — 34 students score below 30% on Quantitative Reasoning.</p>
              <p className="text-[11px] font-bold text-slate-400 mt-2">→ Recommended: Schedule focused aptitude sessions this week.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Student Score Preview ── */}
      <section className="py-24 px-6 border-t-2 border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Student mock */}
          <div className="rounded-3xl border-2 border-slate-300 bg-white p-8 shadow-2xl space-y-5 order-2 lg:order-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-900 font-bold">Good morning, Riya 👋</p>
                <p className="text-slate-400 text-xs">Computer Science · Sem 6</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-violet-600">78%</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">PRI Score</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Module Breakdown</p>
              {[
                { name: "Academic", score: 85, color: "#7c3aed" },
                { name: "Core Coverage", score: 72, color: "#2563eb" },
                { name: "Role Fit", score: 80, color: "#059669" },
                { name: "Aptitude", score: 55, color: "#d97706" },
                { name: "Enrichment", score: 68, color: "#db2777" },
              ].map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>{m.name}</span>
                    <span className="font-bold text-slate-900">{m.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.score}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-violet-50 border-2 border-violet-300 p-3 text-center">
                <p className="text-sm font-black text-violet-700">Moderate</p>
                <p className="text-[10px] text-slate-400 font-semibold">Risk Level</p>
              </div>
              <div className="rounded-xl bg-blue-50 border-2 border-blue-300 p-3 text-center">
                <p className="text-sm font-black text-blue-700">Service</p>
                <p className="text-[10px] text-slate-400 font-semibold">Tier</p>
              </div>
              <div className="rounded-xl bg-amber-50 border-2 border-amber-300 p-3 text-center">
                <p className="text-sm font-black text-amber-700">⚠ Aptitude</p>
                <p className="text-[10px] text-slate-400 font-semibold">Weakest Flag</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <p className="text-violet-600 font-bold text-xs uppercase tracking-[0.3em]">For Students</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Know your PRI, fix your gaps, <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">land your offer</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              ALSA shows every student their detailed Placement Readiness Index — broken down by module — with AI-identified personal drawbacks and recommended actions.
            </p>
            <ul className="space-y-3">
              {["Live PRI score with 6-axis radar chart", "Semester-by-semester CGPA trend line", "Preferred role selection & role skill score", "Personal drawback engine with specific flags", "Enrichment score from certs, projects & internships", "Placement tier (Product / Service / Core) eligibility"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-violet-600 shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="inline-flex items-center gap-2 font-bold text-violet-600 hover:text-violet-800 transition-colors text-sm group">
              Create your free account <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-indigo-50 p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-violet-100/80 blur-[80px] pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900">
              Know your PRI.<br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Own your placement.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              Join students and faculty using ALSA to turn raw academic data into targeted placement success.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup"
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-2xl shadow-violet-200 hover:shadow-violet-300 transition-all duration-300 hover:-translate-y-1">
                I&apos;m a Student <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login"
                className="px-8 py-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold hover:shadow-lg transition-all">
                I&apos;m Faculty →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t-2 border-slate-200 py-10 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-sm">ALSA</span>
            <span className="text-slate-400 text-sm ml-2">Academic Learning &amp; Skills Analyzer</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 ALSA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

