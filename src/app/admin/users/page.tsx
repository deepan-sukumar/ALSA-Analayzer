"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    UserCircle,
    Mail,
    Shield,
    Trash2,
    RotateCcw,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Building2,
    Users,
    Fingerprint,
    Loader2,
    RefreshCw
} from "lucide-react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { User as AppUser } from "@/types";
import { deleteUserCompletely, updateUserDocument } from "@/lib/firestore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserManagementPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filters
    const [roleFilter, setRoleFilter] = useState<string>("ALL");
    const [deptFilter, setDeptFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AppUser);

            // Deduplicate by ID to prevent "duplicate key" React errors
            const uniqueMap = new Map();
            data.forEach(u => uniqueMap.set(u.id, u));
            const uniqueUsers = Array.from(uniqueMap.values());

            // Exclude Admins from the management list to prevent self-deletion
            setUsers(uniqueUsers.filter(u => u.role !== "admin"));
            setLoading(false);
        }, (error) => {
            console.error(error);
            toast.error("Real-time identity sync failed.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`CRITICAL WARNING: Are you sure you want to PERMANENTLY delete ${name}'s data? This cannot be undone.`)) return;

        setProcessingId(id);
        try {
            await deleteUserCompletely(id);
            toast.success(`Deleted user: ${name}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete user");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReset = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to reset ${name}'s profile data?`)) return;

        setProcessingId(id);
        try {
            await updateUserDocument(id, {
                academicEnrichment: [],
                appliedKnowledge: [],
                academicEngagement: [],
                certifications: [],
                competitions: [],
                extraCurricular: [],
                isProfileComplete: false,
                areGradesComplete: false
            });
            toast.success(`Reset profile for: ${name}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to reset user data");
        } finally {
            setProcessingId(null);
        }
    };

    // Derived Lists
    const departments = useMemo(() => {
        return Array.from(new Set(users.map(u => u.department).filter(Boolean))) as string[];
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchRole = roleFilter === "ALL" || user.role === roleFilter;
            const matchDept = deptFilter === "ALL" || user.department === deptFilter;
            const matchSearch =
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchRole && matchDept && matchSearch;
        });
    }, [users, roleFilter, deptFilter, searchQuery]);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Premium Identity Governance Hero */}
            <div className="relative rounded-[48px] overflow-hidden bg-slate-950 border border-white/5 shadow-3xl group">
                {/* Visual Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(16,185,129,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

                <div className="relative z-10 p-12 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="max-w-3xl space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 backdrop-blur-md">
                            <Shield className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Identity Governance Protocol</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85]">
                                User <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Directory</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                                Managing institutional identities with <span className="text-white font-bold">cryptographic precision</span> and multi-layered access oversight.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-8 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active nodes</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-white">{users.length}</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auth Status</span>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    <span className="text-sm font-bold text-slate-200">System Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[320px]">
                        <div className="relative group/hex">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full group-hover/hex:bg-emerald-500/30 transition-colors duration-1000" />
                            <div className="relative bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
                                <Fingerprint className="h-16 w-16 text-emerald-400/20 mb-6 group-hover/hex:text-emerald-400 transition-colors duration-700" />
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Global Registry</p>
                                <p className="text-5xl font-black text-white tracking-tighter">ALSA</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Directory Controls */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-6 pt-8">
                    <div className="flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
                        <div className="relative flex-1 w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Search by name, email or register number..."
                                className="pl-12 h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-emerald-500/50 transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[140px] h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-bold uppercase tracking-widest text-[10px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 backdrop-blur-xl">
                                    <SelectItem value="ALL" className="font-bold uppercase tracking-widest text-[10px]">All Roles</SelectItem>
                                    <SelectItem value="student" className="font-bold uppercase tracking-widest text-[10px]">Students</SelectItem>
                                    <SelectItem value="faculty" className="font-bold uppercase tracking-widest text-[10px]">Faculty</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={deptFilter} onValueChange={setDeptFilter}>
                                <SelectTrigger className="w-[160px] h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-bold uppercase tracking-widest text-[10px]">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 backdrop-blur-xl">
                                    <SelectItem value="ALL" className="font-bold uppercase tracking-widest text-[10px]">All Depts</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d} value={d} className="font-bold uppercase tracking-widest text-[10px]">{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 p-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => { setSearchQuery(""); setRoleFilter("ALL"); setDeptFilter("ALL"); }}
                            >
                                <RefreshCw className="h-4 w-4 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                                <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                    <TableHead className="w-[300px] h-14 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Identity Structure</TableHead>
                                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</TableHead>
                                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Status Vector</TableHead>
                                    <TableHead className="h-14 text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Operations</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronizing Identity Nodes...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Fingerprint className="w-12 h-12 text-slate-200" />
                                                <p className="text-sm font-bold text-slate-400">No identities match your search parameters.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="group border-slate-50 dark:border-slate-800/40 hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-white dark:border-slate-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                        <UserCircle className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{user.name || "UNREGISTERED"}</p>
                                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                                            <Mail className="w-3 h-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] h-5 font-black uppercase tracking-widest rounded-full px-2.5 ${user.role === 'faculty' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                                                'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                }`}
                                                        >
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold text-wrap max-w-[150px]">
                                                        <Building2 className="w-3 h-3 shrink-0" />
                                                        {user.department || "No Dept Assigned"}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.role === "faculty" ? (
                                                    user.approved ? (
                                                        <div className="flex items-center gap-2 text-emerald-600">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Approved</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                                                            <Fingerprint className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Pending Triage</span>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <Shield className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Active Node</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                                            <MoreVertical className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-3">Institutional Control</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            className="rounded-xl flex items-center gap-3 p-3 focus:bg-emerald-50 dark:focus:bg-emerald-950/40 cursor-pointer"
                                                            onClick={() => handleReset(user.id!, user.name)}
                                                            disabled={!!processingId}
                                                        >
                                                            <RotateCcw className={`w-4 h-4 text-emerald-600 ${processingId === user.id ? 'animate-spin' : ''}`} />
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black uppercase tracking-tight">Reset Profile</span>
                                                                <span className="text-[9px] text-slate-400">Force re-initialization</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
                                                        <DropdownMenuItem
                                                            className="rounded-xl flex items-center gap-3 p-3 focus:bg-rose-50 dark:focus:bg-rose-950/40 text-rose-600 cursor-pointer"
                                                            onClick={() => handleDelete(user.id!, user.name)}
                                                            disabled={!!processingId}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black uppercase tracking-tight">Purge Identity</span>
                                                                <span className="text-[9px] text-rose-400/80">Permanent deletion</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
