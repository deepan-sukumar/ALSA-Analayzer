"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, getDoc, doc, deleteDoc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { calculatePRI } from "@/lib/placement-calculations";
import { User as AppUser } from "@/types";
import {
    Loader2,
    RefreshCw,
    Trash2,
    Download,
    AlertTriangle,
    ShieldAlert,
    Database,
    Eraser,
    UserX,
    Shield,
    HardDrive,
    CloudDownload,
    Terminal,
    Zap,
    History,
    Fingerprint,
    Globe,
    Briefcase,
    Users
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

export default function AdminDataControl() {
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [isDeletingStudents, setIsDeletingStudents] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isNormalizing, setIsNormalizing] = useState(false);
    const [isDeletingTest, setIsDeletingTest] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // 1. Recalculate All PRI Scores
    const handleRecalculatePRI = async () => {
        setIsRecalculating(true);
        try {
            const studentsRef = collection(db, "users");
            const q = query(studentsRef, where("role", "==", "student"));
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(db);
            let updateCount = 0;

            querySnapshot.forEach((docSnap) => {
                const studentData = { id: docSnap.id, ...docSnap.data() } as AppUser;
                const priData = calculatePRI(studentData);
                const docRef = doc(db, "users", docSnap.id);
                batch.update(docRef, { cachedPRI: priData.pri, lastCalculated: new Date() });
                updateCount++;
            });

            if (updateCount > 0) {
                await batch.commit();
                toast.success(`Metrics recalculated for ${updateCount} identity nodes.`);
            } else {
                toast.info("No identity records found in targeting vector.");
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Recalculation fault intercepted.");
        } finally {
            setIsRecalculating(false);
        }
    };

    // 2. Export Data (CSV)
    const handleExport = async (type: "students" | "faculty") => {
        setIsExporting(true);
        try {
            const colRef = collection(db, "users");
            const q = query(colRef, where("role", "==", type));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.info(`No segments found for ${type} export.`);
                setIsExporting(false);
                return;
            }

            const headers = ["ID", "Name", "Email", "Department", "Role", "Approved", "Registered At"];
            const rows = [headers.join(",")];

            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const row = [
                    docSnap.id,
                    `"${data.name || ''}"`,
                    `"${data.email || ''}"`,
                    `"${data.department || ''}"`,
                    `"${data.role || ''}"`,
                    data.approved ? "Yes" : "No",
                    data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"
                ];
                rows.push(row.join(","));
            });

            const csvContent = rows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `alsa_${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`${type} segment exported to CSV.`);
        } catch (error: any) {
            toast.error("Export integrity fault.");
        } finally {
            setIsExporting(false);
        }
    };

    // 3. Bulk Delete Engine
    const handleBulkDelete = async (type: "students" | "faculty") => {
        const setLoadState = type === "students" ? setIsDeletingStudents : () => { };
        setLoadState(true);
        try {
            const colRef = collection(db, "users");
            const q = query(colRef, where("role", "==", type));
            const querySnapshot = await getDocs(q);

            const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "users", d.id)));
            await Promise.all(deletePromises);

            toast.success(`Structural purge complete: ${deletePromises.length} nodes deleted.`);
        } catch (error: any) {
            toast.error("Purge operation intercepted logic error.");
        } finally {
            setLoadState(false);
        }
    };

    // 4. Clean Orphan Records
    const handleCleanOrphans = async () => {
        setIsCleaning(true);
        try {
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef);
            let deletedCount = 0;
            const batch = writeBatch(db);

            snap.forEach(docSnap => {
                const data = docSnap.data();
                if (!data.role || !data.email) {
                    batch.delete(doc(db, "users", docSnap.id));
                    deletedCount++;
                }
            });
            if (deletedCount > 0) await batch.commit();

            toast.success(`Orphan cleanup successfully processed ${deletedCount} nodes.`);
        } catch (e: any) {
            toast.error("Cleanup fault intercepted.");
        } finally {
            setIsCleaning(false);
        }
    };

    const handleNormalizeDepartments = async () => {
        setIsNormalizing(true);
        try {
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef);
            let updateCount = 0;
            const batch = writeBatch(db);
            const { normalizeDepartment } = await import("@/lib/department-core");

            snap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.department) {
                    const normalized = normalizeDepartment(data.department);
                    if (normalized !== data.department) {
                        batch.update(doc(db, "users", docSnap.id), { department: normalized });
                        updateCount++;
                    }
                }
            });

            if (updateCount > 0) {
                await batch.commit();
                toast.success(`Department normalization complete for ${updateCount} nodes.`);
            } else {
                toast.info("Institutional headers are already normalized.");
            }
        } catch (e: any) {
            toast.error("Normalization fault.");
        } finally {
            setIsNormalizing(false);
        }
    };

    const handleDeleteTestUsers = async () => {
        setIsDeletingTest(true);
        try {
            const usersRef = collection(db, "users");
            const snap = await getDocs(usersRef);
            let deletedCount = 0;
            const batch = writeBatch(db);

            snap.forEach(docSnap => {
                const data = docSnap.data();
                const email = data.email?.toLowerCase() || "";
                const name = data.name?.toLowerCase() || "";
                if (email.includes("test") || name.includes("test")) {
                    batch.delete(doc(db, "users", docSnap.id));
                    deletedCount++;
                }
            });
            if (deletedCount > 0) await batch.commit();

            toast.success(`Test account purge verified for ${deletedCount} nodes.`);
        } catch (e: any) {
            toast.error("Atomic test purge failed.");
        } finally {
            setIsDeletingTest(false);
        }
    };

    const handleBackupDB = async () => {
        setIsBackingUp(true);
        try {
            const usersRef = collection(db, "users");
            const issuesRef = collection(db, "system_issues");
            const [uSnap, iSnap] = await Promise.all([getDocs(usersRef), getDocs(issuesRef)]);

            const backup = {
                users: uSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                system_issues: iSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `alsa_snapshot_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Institutional snapshot downloaded safely.");
        } catch (e: any) {
            toast.error("Back-up integrity fault.");
        } finally {
            setIsBackingUp(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Premium Data Engine Hero */}
            <div className="relative rounded-[48px] overflow-hidden bg-slate-950 border border-white/5 shadow-3xl group">
                {/* Visual Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-30%,rgba(59,130,246,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

                <div className="relative z-10 p-12 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="max-w-3xl space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 backdrop-blur-md">
                            <Database className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Core Engine Control</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85]">
                                Data <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Control</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                                Managing institutional data structures with <span className="text-white font-bold">atomic precision</span>. Perform bulk operations, exports, and structural purges.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-8 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Storage</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-white">Firestore</span>
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latency Node</span>
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-blue-400" />
                                    <span className="text-sm font-bold text-slate-200">24ms (Nominal)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[320px]">
                        <div className="relative group/core">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full group-hover/core:bg-blue-500/30 transition-colors duration-1000" />
                            <div className="relative bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
                                <Terminal className="h-16 w-16 text-blue-400/20 mb-6 group-hover/core:text-blue-400 transition-colors duration-700" />
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">System Core</p>
                                <p className="text-5xl font-black text-white tracking-tighter">DBX</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Maintenance Cluster */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
                            <RefreshCw className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Structural Maintenance</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Optimization & Normalization Ops</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {[
                            {
                                title: "Recalculate PRI Vectors",
                                desc: "Re-triggers weighted calculations across the student spectrum to refresh cached placement indices.",
                                icon: Zap,
                                action: handleRecalculatePRI,
                                loading: isRecalculating,
                                btnText: "Execute Calculation Cycle"
                            },
                            {
                                title: "Institutional Normalization",
                                desc: "Standardizes departmental nomenclature using canonical mapping to ensure analytics consistency.",
                                icon: Globe,
                                action: handleNormalizeDepartments,
                                loading: isNormalizing,
                                btnText: "Normalize Headers"
                            },
                            {
                                title: "Orphaned Node Cleanup",
                                desc: "Scans for and purges user objects with fragmented fields or partial initialization states.",
                                icon: Eraser,
                                action: handleCleanOrphans,
                                loading: isCleaning,
                                btnText: "Run Garbage Collector"
                            }
                        ].map((op, i) => (
                            <div key={i} className="group p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all duration-300">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <h4 className="text-[12px] font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1.5">{op.title}</h4>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{op.desc}</p>
                                    </div>
                                    <op.icon className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <Button
                                    onClick={op.action}
                                    disabled={op.loading}
                                    variant="outline"
                                    className="h-10 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50"
                                >
                                    {op.loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                                    {op.btnText}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Portability Cluster */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 p-6 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
                            <CloudDownload className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Data Portability</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Segment Export & Cold-Storage Backups</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="p-6 rounded-2xl bg-emerald-50/20 dark:bg-emerald-900/5 border border-emerald-500/10">
                            <div className="flex items-center gap-2 mb-4">
                                <Terminal className="h-4 w-4 text-emerald-600" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">CSV Export Sequences</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-xl border-emerald-200 dark:border-emerald-900/60 bg-white/50 dark:bg-slate-900/50 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                    onClick={() => handleExport("students")}
                                    disabled={isExporting}
                                >
                                    <Users className="h-3 w-3 mr-2 text-emerald-600" />
                                    Export Students
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-xl border-emerald-200 dark:border-emerald-900/60 bg-white/50 dark:bg-slate-900/50 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                    onClick={() => handleExport("faculty")}
                                    disabled={isExporting}
                                >
                                    <Briefcase className="h-3 w-3 mr-2 text-emerald-600" />
                                    Export Faculty
                                </Button>
                            </div>
                        </div>

                        <div className="group p-8 rounded-[32px] bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/20 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black tracking-tight leading-none uppercase">Full System Backup</h4>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest opacity-80">Full Schema JSON Snapshot</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                                    <Database className="h-6 w-6 text-emerald-100" />
                                </div>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-emerald-50/80">
                                Generates a point-in-time cold-storage backup of all registered identity nodes and diagnostic issue logs. Use for periodic disaster recovery readiness.
                            </p>
                            <Button
                                onClick={handleBackupDB}
                                disabled={isBackingUp}
                                className="h-14 w-full rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 font-black uppercase tracking-[0.1em] text-[11px] shadow-xl"
                            >
                                {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HardDrive className="h-4 w-4 mr-2" />}
                                Initiate Snapshot Cycle
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone */}
            <Card className="border-rose-200 dark:border-rose-900/30 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <div className="h-2 bg-rose-500" />
                <CardHeader className="p-8 border-b border-rose-100 dark:border-rose-900/20">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center border border-rose-200 dark:border-rose-900/60">
                            <ShieldAlert className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight text-rose-600">Critical Sanctions Channel</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-tight text-slate-400">High-Risk Destructive Operations • Use with Caution</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid gap-8 md:grid-cols-2">
                        {[
                            {
                                title: "Triage Channel Cleansing",
                                desc: "Atomic purge of all user nodes flagged as 'Test' (Email or Name vectors). Use to clear environment debris.",
                                badge: "Irreversible",
                                icon: UserX,
                                action: handleDeleteTestUsers,
                                loading: isDeletingTest,
                                btnText: "Purge Test Identities"
                            },
                            {
                                title: "Identity Reset Protocol",
                                desc: "Structural reset of the entire student identity segment. Securely wipes all records from the primary users collection.",
                                badge: "Restricted",
                                icon: Trash2,
                                action: () => handleBulkDelete("students"),
                                loading: isDeletingStudents,
                                btnText: "Execute Master Purge"
                            }
                        ].map((sanction, i) => (
                            <div key={i} className="flex flex-col justify-between p-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black uppercase tracking-tight">{sanction.title}</h4>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-rose-500 border-rose-200 bg-rose-50/50">
                                            {sanction.badge}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{sanction.desc}</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="h-12 rounded-2xl bg-slate-900 hover:bg-rose-600 transition-colors duration-300 font-black uppercase tracking-widest text-[10px]"
                                        >
                                            <sanction.icon className="h-4 w-4 mr-2" />
                                            {sanction.btnText}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[32px] border-rose-200 p-8 shadow-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl">
                                        <DialogHeader>
                                            <div className="h-16 w-16 rounded-[24px] bg-rose-50 flex items-center justify-center mb-6">
                                                <AlertTriangle className="h-10 w-10 text-rose-500" />
                                            </div>
                                            <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase">Confirm Structural Purge</DialogTitle>
                                            <DialogDescription className="text-slate-500 text-base leading-relaxed pt-2">
                                                You are about to execute a destructive operation. This will permanently erase targeted identity nodes from the institutional database. This action is <b>restricted and irreversible</b> without a JSON snapshot.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="mt-8 flex items-center justify-between gap-4">
                                            <Button variant="ghost" className="rounded-xl font-black uppercase tracking-widest text-[10px]">Abandon Protocol</Button>
                                            <Button
                                                variant="destructive"
                                                onClick={sanction.action}
                                                disabled={sanction.loading}
                                                className="rounded-2xl h-14 px-8 font-black uppercase tracking-[0.1em] text-[11px] bg-rose-600 shadow-xl shadow-rose-600/20"
                                            >
                                                {sanction.loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Executing...
                                                    </>
                                                ) : (
                                                    "Acknowledge & Execute"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
