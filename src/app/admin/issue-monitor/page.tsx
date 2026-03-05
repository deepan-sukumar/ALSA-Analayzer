"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
    AlertCircle,
    CheckCircle2,
    Search,
    Trash2,
    Eye,
    ShieldAlert,
    AlertTriangle,
    ShieldCheck,
    Terminal,
    Activity,
    Zap,
    History,
    MoreVertical,
    Loader2,
    Globe,
    UserCircle
} from "lucide-react";
import { format } from "date-fns";

export default function AdminIssueMonitor() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Details/Action Dialog
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [resolutionNote, setResolutionNote] = useState("");
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "system_issues"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIssues(data);
            setLoading(false);
        }, (error) => {
            console.error(error);
            toast.error("Failed to sync diagnostics.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const kpis = useMemo(() => {
        const totalOpen = issues.filter(i => i.status === "open").length;
        const totalResolved = issues.filter(i => i.status === "resolved").length;
        const criticalCount = issues.filter(i => i.status === "open" && i.priority === "critical").length;

        return { totalOpen, totalResolved, criticalCount };
    }, [issues]);

    const filteredIssues = useMemo(() => {
        return issues.filter(i => {
            if (statusFilter !== "all" && i.status !== statusFilter) return false;
            if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
            if (searchQuery) {
                const s = searchQuery.toLowerCase();
                return (
                    i.userName?.toLowerCase().includes(s) ||
                    i.department?.toLowerCase().includes(s) ||
                    i.errorType?.toLowerCase().includes(s) ||
                    i.id?.toLowerCase().includes(s)
                );
            }
            return true;
        });
    }, [issues, statusFilter, priorityFilter, searchQuery]);

    const handleResolve = async () => {
        if (!selectedIssue) return;
        setIsResolving(true);
        try {
            await updateDoc(doc(db, "system_issues", selectedIssue.id), {
                status: "resolved",
                resolutionNote: resolutionNote,
                resolvedAt: new Date()
            });
            toast.success("Issue safely mitigated.");
            setSelectedIssue(null);
            setResolutionNote("");
        } catch (e) {
            toast.error("Resolution failed.");
        } finally {
            setIsResolving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently purge this diagnostic trace?")) return;
        try {
            await deleteDoc(doc(db, "system_issues", id));
            toast.success("Trace purged.");
        } catch (e) {
            toast.error("Purge failed.");
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "bg-rose-500/10 text-rose-600 border-rose-200 shadow-sm shadow-rose-500/10";
            case "high": return "bg-orange-500/10 text-orange-600 border-orange-200";
            case "medium": return "bg-amber-500/10 text-amber-600 border-amber-200";
            case "low": return "bg-blue-500/10 text-blue-600 border-blue-200";
            default: return "bg-slate-500/10 text-slate-600 border-slate-200";
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "Unknown";
        try {
            if (timestamp.toDate) return format(timestamp.toDate(), "MMM d, h:mm a");
            return format(new Date(timestamp), "MMM d, h:mm a");
        } catch (e) {
            return "Invalid Date";
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12">
            {/* Premium Cognitive Sentinel Hero */}
            <div className="relative rounded-[48px] overflow-hidden bg-slate-950 border border-white/5 shadow-3xl group">
                {/* Visual Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(244,63,94,0.15),transparent_70%)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

                <div className="relative z-10 p-12 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="max-w-3xl space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20 backdrop-blur-md">
                            <Activity className="h-3.5 w-3.5 text-rose-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300">Cognitive Sentinel Protocol</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85]">
                                Issue <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400">Monitor</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
                                Real-time telemetry stream intercepts <span className="text-white font-bold">system exceptions</span> and anomalous behavioral vectors for immediate triage.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-8 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Flaws</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-white">{kpis.totalOpen}</span>
                                    {kpis.totalOpen > 0 && <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />}
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Critical Triage</span>
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                                    <span className="text-sm font-bold text-slate-200">{kpis.criticalCount} Required</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[320px]">
                        <div className="relative group/radar">
                            <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full group-hover/radar:bg-rose-500/30 transition-colors duration-1000" />
                            <div className="relative bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
                                <Terminal className="h-16 w-16 text-rose-400/20 mb-6 group-hover/radar:text-rose-400 transition-colors duration-700" />
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Telemetry Uplink</p>
                                <p className="text-5xl font-black text-white tracking-tighter italic font-serif">TRCE</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnostic Stream */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-6 pt-8">
                    <div className="flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
                        <div className="relative flex-1 w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                            <Input
                                placeholder="Search by trace ID, user or error vector..."
                                className="pl-12 h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl focus-visible:ring-rose-500/50 transition-all font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-bold uppercase tracking-widest text-[10px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 backdrop-blur-xl">
                                    <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Status</SelectItem>
                                    <SelectItem value="open" className="font-bold uppercase tracking-widest text-[10px]">Active</SelectItem>
                                    <SelectItem value="resolved" className="font-bold uppercase tracking-widest text-[10px]">Mitigated</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-[140px] h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 font-bold uppercase tracking-widest text-[10px]">
                                    <SelectValue placeholder="All Priority" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 backdrop-blur-xl">
                                    <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Priority</SelectItem>
                                    <SelectItem value="critical" className="font-bold uppercase tracking-widest text-[10px]">Critical</SelectItem>
                                    <SelectItem value="high" className="font-bold uppercase tracking-widest text-[10px]">High</SelectItem>
                                    <SelectItem value="medium" className="font-bold uppercase tracking-widest text-[10px]">Medium</SelectItem>
                                    <SelectItem value="low" className="font-bold uppercase tracking-widest text-[10px]">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                                <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                    <TableHead className="w-[180px] h-14 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Trace Timestamp</TableHead>
                                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Origin Node</TableHead>
                                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Diagnostic Vector</TableHead>
                                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Severity</TableHead>
                                    <TableHead className="h-14 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                                    <TableHead className="h-14 text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Operations</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Diagnostic Monitors...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredIssues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <History className="w-12 h-12 text-slate-200" />
                                                <p className="text-sm font-bold text-slate-400">Diagnostic stream is currently clear.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredIssues.map((issue) => (
                                        <TableRow key={issue.id} className={`group border-slate-50 dark:border-slate-800/40 hover:bg-rose-50/10 dark:hover:bg-rose-900/5 transition-colors ${issue.status === 'resolved' ? 'opacity-60' : ''}`}>
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <Activity className={`w-3 h-3 ${issue.status === 'open' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter tabular-nums">{formatDate(issue.timestamp)}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-black text-slate-900 dark:text-white text-[12px] tracking-tight truncate max-w-[150px]">{issue.userName || "ANONYMOUS"}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{issue.department || "No Dept"}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <code className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-rose-600 truncate max-w-[200px] border border-slate-200 dark:border-slate-700">
                                                        {issue.errorType}
                                                    </code>
                                                    <p className="text-[9px] font-medium text-slate-400 truncate max-w-[200px]">{issue.page || "/untracked"}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={`text-[9px] h-5 font-black uppercase tracking-widest rounded-full px-2.5 ${getPriorityColor(issue.priority)}`}>
                                                    {issue.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {issue.status === "open" ? (
                                                    <div className="flex items-center justify-center gap-2 text-amber-500">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Mitigated</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                        onClick={() => setSelectedIssue(issue)}
                                                    >
                                                        <Eye className="h-4 w-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        onClick={() => handleDelete(issue.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Premium Details & Triage Interface */}
            <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0 rounded-[32px] border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl">
                    <div className="relative h-24 bg-gradient-to-r from-slate-900 to-rose-900 flex items-center px-8 text-white">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                <ShieldAlert className="h-6 w-6 text-rose-300" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black tracking-tight uppercase">Diagnostic Trace</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-rose-200 uppercase tracking-widest opacity-80">Reference Node: {selectedIssue?.id}</DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            {[
                                { label: "Origin Object", val: selectedIssue?.userName || "Anonymous", icon: UserCircle },
                                { label: "System Vector", val: selectedIssue?.page || "/root", icon: Globe },
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <item.icon className="w-3 h-3" />
                                        {item.label}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{item.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exception Payload</h4>
                                <Badge variant="outline" className={`text-[9px] h-5 font-black uppercase tracking-widest rounded-full px-2.5 ${getPriorityColor(selectedIssue?.priority)}`}>
                                    {selectedIssue?.priority} Severity
                                </Badge>
                            </div>
                            <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 font-mono text-[11px] leading-relaxed border border-slate-800 shadow-inner group relative">
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                <pre className="text-rose-400/90 whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                                    {selectedIssue?.errorMessage}
                                </pre>
                            </div>
                        </div>

                        {selectedIssue?.status === "open" ? (
                            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mitigation Strategy</h4>
                                <Textarea
                                    placeholder="Record standard operating procedures used for mitigation..."
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    className="min-h-[120px] rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-rose-500/50 p-4 font-medium"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Resolution Log</h4>
                                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 italic text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    {selectedIssue?.resolutionNote || "No mitigation notes recorded."}
                                    <p className="mt-3 text-[10px] not-italic font-black uppercase tracking-widest text-emerald-600 opacity-60">
                                        Mitigated on: {formatDate(selectedIssue?.resolvedAt)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between px-8">
                        <Button variant="ghost" onClick={() => setSelectedIssue(null)} className="rounded-xl font-black uppercase tracking-widest text-[10px]">Close Trace</Button>
                        {selectedIssue?.status === "open" && (
                            <Button
                                onClick={handleResolve}
                                disabled={isResolving}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 font-black uppercase tracking-widest text-[10px] h-11 px-6"
                            >
                                {isResolving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Commiting Mitigation...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Mark Mitigated
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            `}</style>
        </div>
    );
}

// Mock items to satisfy linter if needed, though they should be imported correctly from lucide
// UserCircle is imported, Globe is imported.
