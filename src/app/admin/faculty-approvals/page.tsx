"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User as AppUser } from "@/types";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Check, X, Loader2, ShieldCheck, UserPlus, Building2, Mail, Briefcase } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { deleteUserCompletely } from "@/lib/firestore";

export default function FacultyApprovalsPage() {
    const [faculty, setFaculty] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchFaculty = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"), where("role", "==", "faculty"));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppUser);
            // Sort to put pending first
            data.sort((a, b) => {
                if (a.approved === b.approved) return 0;
                return a.approved ? 1 : -1;
            });
            setFaculty(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch faculty list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaculty();
    }, []);

    const { user: adminUser } = useAuth();

    const handleApprove = async (id: string, name: string) => {
        setProcessingId(id);
        try {
            await updateDoc(doc(db, "users", id), {
                approved: true,
                approvedBy: adminUser?.id || "admin_system",
                approvedAt: serverTimestamp()
            });
            await updateDoc(doc(db, "faculty", id), {
                approved: true
            });
            toast.success(`Approved faculty member: ${name}`);
            setFaculty(prev => prev.map(f => f.id === id ? { ...f, approved: true } : f));
        } catch (e) {
            toast.error("Failed to approve faculty");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to reject and delete the application for ${name}?`)) return;

        setProcessingId(id);
        try {
            await deleteUserCompletely(id);
            toast.success(`Rejected and removed faculty: ${name}`);
            setFaculty(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            console.error(e);
            toast.error("Failed to reject faculty");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Header */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 shadow-2xl p-8 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Security Clearance</p>
                        </div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">Faculty Approvals</h1>
                        <p className="text-slate-400 font-medium max-w-xl">Review credentials and authorize access for newly registered academic staff members.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Requests</p>
                        <p className="text-4xl font-black text-white">{faculty.filter(f => !f.approved).length}</p>
                    </div>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60 pb-6 px-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Approval Queue</CardTitle>
                        <CardDescription className="font-medium text-slate-500">Real-time listing of faculty account requests.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchFaculty} disabled={loading} className="rounded-lg border-slate-300 dark:border-slate-700 font-bold uppercase tracking-widest text-[10px] h-8">
                        {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                        Refresh Data
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing encrypted data...</p>
                        </div>
                    ) : faculty.length === 0 ? (
                        <div className="text-center p-20 flex flex-col items-center gap-4">
                            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <UserPlus className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="font-bold text-slate-500">No faculty members found in the system.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 h-12">Name & Email</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 h-12">Role Details</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 h-12">Status</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-500 px-8 h-12">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faculty.map((member) => (
                                    <TableRow key={member.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800 dark:text-white text-base tracking-tight">{member.name}</span>
                                                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    <Mail className="h-3 w-3" /> {member.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{member.department || "General"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{member.designation || "Faculty Member"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {member.approved ? (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] font-black uppercase tracking-widest border-none px-3 py-1 shadow-lg shadow-emerald-500/20">
                                                    <Check className="h-3 w-3 mr-1" /> Approved
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/5 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Pending
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right px-8 py-5">
                                            {!member.approved && (
                                                <div className="flex items-center justify-end gap-3 animate-in fade-in slide-in-from-right-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 px-4 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500 font-bold uppercase tracking-widest text-[10px] transition-all"
                                                        onClick={() => handleApprove(member.id, member.name)}
                                                        disabled={processingId === member.id}
                                                    >
                                                        {processingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-2" />}
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 px-4 rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-500 font-bold uppercase tracking-widest text-[10px] transition-all"
                                                        onClick={() => handleReject(member.id, member.name)}
                                                        disabled={processingId === member.id}
                                                    >
                                                        {processingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5 mr-2" />}
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
