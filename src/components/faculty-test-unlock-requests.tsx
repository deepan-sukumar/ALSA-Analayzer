"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, UserCheck, ShieldAlert } from "lucide-react";

const MAX_FAILED_ATTEMPTS = 3;

export function FacultyTestUnlockRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'faculty') return;

        const q = query(
            collection(db, "testAccessControl"),
            where("requestedFacultyId", "==", user.id),
            where("status", "==", "pending_approval")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(reqs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching unlock requests:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleApprove = async (requestId: string) => {
        try {
            const requestRef = doc(db, "testAccessControl", requestId);
            await updateDoc(requestRef, {
                status: "allowed",
                failedAttempts: MAX_FAILED_ATTEMPTS - 1, // one extra attempt after approval
                approvedAt: serverTimestamp(),
                approvedBy: user?.name,
                unlockReason: ""
            });
            toast.success("Request approved! Student can now re-take the test.");
        } catch (error) {
            console.error("Error approving request:", error);
            toast.error("Failed to approve request.");
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            const requestRef = doc(db, "testAccessControl", requestId);
            // Optionally set to locked again or just delete the request status
            await updateDoc(requestRef, {
                status: "locked",
                rejectedAt: serverTimestamp(),
                rejectedBy: user?.name
            });
            toast.warning("Request rejected.");
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Failed to reject request.");
        }
    };

    if (loading) return null;
    if (requests.length === 0) return null;

    return (
        <Card className="border-none shadow-xl transition-all duration-500 bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white uppercase">Verification Unlock Requests</CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">Students needing extra attempts for verification tests</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800 font-bold">
                        {requests.length} Pending
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req) => (
                        <div key={req.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-900 dark:text-white">{req.studentName}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 truncate max-w-[180px]">
                                        {req.topicsKey.replace(/,/g, " • ")}
                                    </p>
                                </div>
                                <Badge className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                                    {req.failedAttempts} Fails
                                </Badge>
                            </div>
                            {req.lastFailureReason === "malpractice" && (
                                <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                                    Last Fail: Malpractice
                                </Badge>
                            )}
                            {req.unlockReason && (
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Student Reason</p>
                                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{req.unlockReason}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                                <Button 
                                    size="sm" 
                                    onClick={() => handleApprove(req.id)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[11px] font-bold rounded-lg"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 border-slate-200 dark:border-slate-700 h-8 text-[11px] font-bold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

