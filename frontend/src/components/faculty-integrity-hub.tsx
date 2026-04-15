"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    orderBy,
    limit,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { normalizeDepartment } from "@/lib/core/department-core";
import { CORE_ACADEMIC_TOPICS } from "@/lib/core/core-topics";
import { ROLE_SKILL_MATRIX } from "@/lib/core/role-skills";
import {
    CheckCircle2,
    ShieldAlert,
    History,
    Clock,
    Search,
    Target,
    Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type TopicGroup = { title: string; topics: string[] };
type TopicsByDomain = Record<string, string[]>;
const DEFAULT_LEGACY_TOPIC_GROUPS: TopicGroup[] = [
    { title: "Data Structures", topics: ["Arrays & Strings", "Linked Lists"] },
    { title: "Algorithms", topics: ["Sorting & Searching", "Dynamic Programming"] },
    { title: "DBMS", topics: ["ER Modeling", "Normalization"] },
    { title: "Operating Systems", topics: ["Process Management", "CPU Scheduling"] },
    { title: "Computer Networks", topics: ["OSI & TCP/IP Models", "IP Addressing"] },
    { title: "OOPS", topics: ["Classes & Objects", "Inheritance"] },
    { title: "Problem Solving", topics: ["Algorithm Design", "Pattern Recognition"] },
    { title: "Aptitude", topics: ["Numbers & Ages", "Profit & Loss"] },
    { title: "Communication", topics: ["Verbal Communication", "Written Communication"] },
];
const ALLOWED_TOPIC_MAP = new Map<string, Set<string>>(
    DEFAULT_LEGACY_TOPIC_GROUPS.map((group) => [group.title.toLowerCase(), new Set(group.topics.map((t) => t.toLowerCase()))])
);
const MAX_FAILED_ATTEMPTS = 3;

const CORE_TOPIC_TO_DOMAIN = Object.entries(CORE_ACADEMIC_TOPICS).reduce<Record<string, string>>((acc, [domain, topics]) => {
    (topics as readonly string[]).forEach((topic) => {
        acc[topic.toLowerCase()] = domain;
    });
    return acc;
}, {});

const ROLE_TOPIC_SET = new Set(
    Object.values(ROLE_SKILL_MATRIX)
        .flatMap((role) => [...role.core, ...role.intermediate, ...role.advanced])
        .map((topic) => topic.toLowerCase())
);

function normalizeTopicsByDomain(input: unknown): TopicGroup[] {
    if (!input || typeof input !== "object") return [];
    const entries = Object.entries(input as TopicsByDomain)
        .map(([title, topics]) => ({
            title,
            topics: Array.from(new Set((topics || []).map((t) => String(t).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
        }))
        .filter((g) => g.topics.length > 0);
    return entries.sort((a, b) => a.title.localeCompare(b.title));
}

function groupAttendedTopics(topics: string[]): TopicGroup[] {
    const uniqueTopics = Array.from(new Set((topics || []).filter(Boolean).map((t) => String(t).trim()))).filter(Boolean);
    const grouped = new Map<string, string[]>();

    uniqueTopics.forEach((topic) => {
        const key = topic.toLowerCase();
        const coreDomain = CORE_TOPIC_TO_DOMAIN[key];
        const groupName = coreDomain || (ROLE_TOPIC_SET.has(key) ? "Role Concepts" : "Other Topics");
        const current = grouped.get(groupName) || [];
        current.push(topic);
        grouped.set(groupName, current);
    });

    return Array.from(grouped.entries())
        .map(([title, vals]) => ({ title, topics: vals.sort((a, b) => a.localeCompare(b)) }))
        .sort((a, b) => a.title.localeCompare(b.title));
}

function dedupeLogs(rawLogs: any[]) {
    const sorted = [...rawLogs].sort((a, b) => {
        const ta = a.timestamp?.seconds || 0;
        const tb = b.timestamp?.seconds || 0;
        return tb - ta;
    });
    const kept: any[] = [];
    for (const log of sorted) {
        const logTs = log.timestamp?.seconds || 0;
        const key = [
            log.userId || "no-user",
            String(log.score ?? "no-score"),
            String(log.rawScore ?? "no-raw-score"),
            String(log.topicsKey ?? ""),
        ].join("|");

        const duplicate = kept.find((k) => {
            const kTs = k.timestamp?.seconds || 0;
            const kKey = [
                k.userId || "no-user",
                String(k.score ?? "no-score"),
                String(k.rawScore ?? "no-raw-score"),
                String(k.topicsKey ?? ""),
            ].join("|");
            return key === kKey && Math.abs(logTs - kTs) <= 120;
        });

        if (!duplicate) {
            kept.push(log);
        }
    }
    return kept;
}

function getTopicGroupsForLog(log: any): { groups: TopicGroup[]; legacyUnavailable: boolean } {
    const exactGroups = normalizeTopicsByDomain(log?.topicsByDomain);
    if (exactGroups.length > 0) {
        return { groups: exactGroups, legacyUnavailable: false };
    }

    const fallbackGroups = groupAttendedTopics(log?.topicsVerified || []);
    const fallbackCount = (log?.topicsVerified || []).length;
    if (fallbackCount > 25) {
        return { groups: [], legacyUnavailable: true };
    }
    return { groups: fallbackGroups, legacyUnavailable: false };
}

function getTopicGroupsFromUserProfile(userDoc: any): TopicGroup[] {
    if (!userDoc) return [];
    const groups: TopicGroup[] = [];

    const verifiedCoreTopics = userDoc.verifiedCoreTopics && typeof userDoc.verifiedCoreTopics === "object"
        ? (userDoc.verifiedCoreTopics as Record<string, string[]>)
        : {};

    Object.entries(verifiedCoreTopics).forEach(([domain, topics]) => {
        const clean = Array.from(new Set((topics || []).map((t) => String(t).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        if (clean.length > 0) groups.push({ title: domain, topics: clean });
    });

    const role = userDoc.verifiedRoleConcepts && typeof userDoc.verifiedRoleConcepts === "object"
        ? userDoc.verifiedRoleConcepts
        : null;
    if (role) {
        const roleMap: Array<{ key: "core" | "intermediate" | "advanced"; title: string }> = [
            { key: "core", title: "Role Core" },
            { key: "intermediate", title: "Role Intermediate" },
            { key: "advanced", title: "Role Advanced" }
        ];
        roleMap.forEach(({ key, title }) => {
            const arr = Array.isArray(role[key]) ? role[key] : [];
            const clean = Array.from(new Set(arr.map((t: any) => String(t).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
            if (clean.length > 0) groups.push({ title, topics: clean });
        });
    }

    return groups.sort((a, b) => a.title.localeCompare(b.title));
}

function sanitizeAllowedGroups(groups: TopicGroup[]): TopicGroup[] {
    const normalizedByTitle = new Map<string, { title: string; topics: Set<string> }>();

    groups.forEach((group) => {
        const titleKey = group.title.toLowerCase();
        const allowed = ALLOWED_TOPIC_MAP.get(titleKey);
        if (!allowed) return;

        const existing = normalizedByTitle.get(titleKey) || { title: group.title, topics: new Set<string>() };
        group.topics.forEach((topic) => {
            const trimmed = String(topic).trim();
            if (!trimmed) return;
            if (allowed.has(trimmed.toLowerCase())) existing.topics.add(trimmed);
        });
        normalizedByTitle.set(titleKey, existing);
    });

    return Array.from(normalizedByTitle.values())
        .map((group) => ({ title: group.title, topics: Array.from(group.topics).sort((a, b) => a.localeCompare(b)) }))
        .filter((group) => group.topics.length > 0)
        .sort((a, b) => a.title.localeCompare(b.title));
}

export function FacultyIntegrityHub() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const [legacyProfileGroups, setLegacyProfileGroups] = useState<TopicGroup[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [indexUrl, setIndexUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== "faculty" || !user.department) return;

        const qReq = query(
            collection(db, "testAccessControl"),
            where("requestedFacultyId", "==", user.id),
            where("status", "==", "pending_approval")
        );

        const unsubReq = onSnapshot(qReq, (snap) => {
            setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }, (err) => {
            console.error("Requests error:", err);
        });

        const normalizedDept = normalizeDepartment(user.department);
        const qLogs = query(
            collection(db, "verificationResults"),
            where("department", "==", normalizedDept),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubLogs = onSnapshot(qLogs, (snap) => {
            const fetchedLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const uniqueLogs = dedupeLogs(fetchedLogs);
            setLogs(uniqueLogs.slice(0, 20));
            setLoading(false);
        }, (err: any) => {
            console.error("Logs error:", err);
            setLoading(false);

            if (err.message?.includes("index")) {
                setError("A database index is required to show these logs.");
                const urlMatch = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
                if (urlMatch) setIndexUrl(urlMatch[0]);
            } else {
                setError("Failed to sync logs. Please refresh.");
            }
        });

        return () => {
            unsubReq();
            unsubLogs();
        };
    }, [user]);

    const handleApprove = async (requestId: string) => {
        try {
            const requestRef = doc(db, "testAccessControl", requestId);
            await updateDoc(requestRef, {
                status: "allowed",
                failedAttempts: MAX_FAILED_ATTEMPTS - 1,
                approvedAt: serverTimestamp(),
                approvedBy: user?.name,
                unlockReason: ""
            });
            toast.success("Request approved!");
        } catch {
            toast.error("Failed to approve.");
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            const requestRef = doc(db, "testAccessControl", requestId);
            await updateDoc(requestRef, {
                status: "locked",
                rejectedAt: serverTimestamp(),
                rejectedBy: user?.name
            });
            toast.warning("Request rejected.");
        } catch {
            toast.error("Failed to reject.");
        }
    };

    const passedCount = logs.filter((l) => l.passed).length;

    useEffect(() => {
        const loadLegacyProfileTopics = async () => {
            if (!selectedLog?.userId) {
                setLegacyProfileGroups([]);
                return;
            }

            const fromAttempt = getTopicGroupsForLog(selectedLog);
            if (fromAttempt.groups.length > 0) {
                setLegacyProfileGroups([]);
                return;
            }

            try {
                const userSnap = await getDoc(doc(db, "users", selectedLog.userId));
                if (!userSnap.exists()) {
                    setLegacyProfileGroups([]);
                    return;
                }
                setLegacyProfileGroups(getTopicGroupsFromUserProfile(userSnap.data()));
            } catch (e) {
                console.error("Failed to load legacy profile topics", e);
                setLegacyProfileGroups([]);
            }
        };
        loadLegacyProfileTopics();
    }, [selectedLog]);

    if (loading) return (
        <Card className="h-[420px] flex items-center justify-center border-dashed">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-slate-400">Loading Integrity Stream...</p>
            </div>
        </Card>
    );

    return (
        <Card className="border-0 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[560px] border-l-4 border-l-indigo-600">
            <CardHeader className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                        <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Department Integrity Hub</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-20 hover:opacity-100"
                                onClick={() => {
                                    setLoading(true);
                                    setError(null);
                                    getDocs(query(collection(db, "verificationResults"), limit(20)))
                                        .then((snap) => {
                                            setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                                            setLoading(false);
                                            toast.info("Showing last 20 logs from ALL departments for debugging.");
                                        })
                                        .catch(() => {
                                            setError("Debug fetch failed");
                                            setLoading(false);
                                        });
                                }}
                            >
                                <Search className="h-3 w-3" />
                            </Button>
                        </div>
                        <CardDescription className="text-[10px] font-bold">Real-time attendance & attempt scoring</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <div className="bg-white dark:bg-slate-900 p-3 grid grid-cols-2 gap-2 border-b">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Passed</p>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{passedCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-center">
                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Attempts</p>
                    <p className="text-lg font-black text-orange-700 dark:text-orange-300">{logs.length}</p>
                </div>
            </div>

            <Tabs defaultValue="logs" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50/50 dark:bg-slate-800/20">
                    <TabsList className="grid grid-cols-2 h-9">
                        <TabsTrigger value="logs" className="text-xs font-bold gap-2">
                            <Target className="h-3.5 w-3.5" />
                            Dynamic Logs
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="text-xs font-bold gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            Unlocks
                            {requests.length > 0 && (
                                <Badge className="bg-amber-500 text-[10px] px-1.5 h-4 min-w-[16px] animate-pulse">{requests.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="logs" className="flex-1 m-0 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-3 space-y-2.5">
                            {error ? (
                                <div className="p-6 text-center space-y-4">
                                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                                    </div>
                                    {indexUrl && (
                                        <Button
                                            onClick={() => window.open(indexUrl, "_blank")}
                                            className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none"
                                        >
                                            Click to Create Index
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-slate-400 italic">Note: Data will appear instantly after the index is active.</p>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <History className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-500">No activity logs yet</p>
                                        <p className="text-[10px] text-slate-400 max-w-[160px] mx-auto italic">Waiting for students to attend verification tests in {user?.department} department.</p>
                                    </div>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`group relative p-3 rounded-xl border transition-all hover:shadow-lg ${log.passed ? "bg-emerald-50/20 border-emerald-100 dark:border-emerald-950/40 hover:bg-emerald-50/40" : "bg-rose-50/20 border-rose-100 dark:border-rose-950/40 hover:bg-rose-50/40"}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="text-left text-xs font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight"
                                                >
                                                    {log.studentName}
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400">{log.registerNumber || "N/A"}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Click name to view topics</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`text-[10px] font-black ${log.passed ? "text-emerald-600" : "text-rose-600"}`}>
                                                        {log.score}/10
                                                    </span>
                                                    <Badge className={`${log.passed ? "bg-emerald-500" : "bg-rose-500"} text-[8px] font-black h-4 px-1 leading-none border-0`}>
                                                        {log.passed ? "PASSED" : "FAILED"}
                                                    </Badge>
                                                    {log.malpracticeDetected && (
                                                        <Badge className="bg-amber-500 text-[8px] font-black h-4 px-1 leading-none border-0">
                                                            MALPRACTICE
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[8px] font-extrabold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">Attempt #{log.attemptNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="requests" className="flex-1 m-0 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-3">
                            {requests.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 italic">No pending unlock requests</p>
                                </div>
                            ) : (
                                requests.map((req) => (
                                    <div key={req.id} className="p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/20 space-y-3 shadow-sm border-l-2 border-l-amber-400">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800 dark:text-white leading-tight uppercase">{req.studentName}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{req.registerNumber || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/40 p-2 rounded-lg">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Failed Attempts</span>
                                            <Badge variant="outline" className="text-[9px] border-amber-200 dark:border-amber-800 text-amber-700 font-black">{req.failedAttempts}</Badge>
                                        </div>
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Requested Topics:</p>
                                            <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate">{req.topicsKey || "Selected Core Topics"}</p>
                                        </div>
                                        {req.unlockReason && (
                                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60">
                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Student Reason:</p>
                                                <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{req.unlockReason}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-1">
                                            <Button size="sm" onClick={() => handleApprove(req.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-7 text-[10px] font-black transition-all shadow-md">Approve</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleReject(req.id)} className="border border-rose-200 text-rose-600 hover:bg-rose-50 h-7 text-[10px] font-black">Reject</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>

            <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <SheetContent className="sm:max-w-md w-full p-0 flex flex-col">
                    <SheetHeader className="p-5 border-b">
                        <SheetTitle className="text-base font-black uppercase tracking-tight">
                            {selectedLog?.studentName || "Student"} - Attempt #{selectedLog?.attemptNumber || "N/A"}
                        </SheetTitle>
                        <SheetDescription className="text-xs font-medium">
                            Score: {selectedLog?.score ?? "N/A"}/10
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4">
                            {selectedLog ? (
                                sanitizeAllowedGroups(getTopicGroupsForLog(selectedLog).groups.length > 0
                                    ? getTopicGroupsForLog(selectedLog).groups
                                    : legacyProfileGroups.length > 0
                                        ? legacyProfileGroups
                                        : DEFAULT_LEGACY_TOPIC_GROUPS
                                ).map((group) => (
                                    <div key={group.title} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                                            {group.title}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {group.topics.map((topic) => (
                                                <Badge key={`${group.title}-${topic}`} variant="outline" className="text-[10px] font-bold">
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-500">No attended topics found for this attempt.</p>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <span className="flex items-center gap-1 animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live Stream</span>
                <span className="text-indigo-600 dark:text-indigo-400">VERIFIED: {passedCount} / {logs.length}</span>
            </div>
        </Card>
    );
}

