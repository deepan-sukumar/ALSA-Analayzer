"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, LogOut, GraduationCap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { updateUserDocument } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export default function PendingApprovalPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    const handleSwitchToStudent = async () => {
        if (!user) return;
        try {
            await updateUserDocument(user.id, {
                role: "student",
                approved: true
            });
            toast.success("Identity updated to Student");
            // The useEffect listener in AuthContext or this page will handle redirection
            router.push("/dashboard/student");
        } catch (error: any) {
            toast.error("Failed to update role: " + error.message);
        }
    };

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace("/login");
            } else if (!user.role) {
                router.replace("/select-role");
            } else if (user.role === "faculty" && user.approved) {
                router.replace("/dashboard/faculty");
            } else if (user.role === "student") {
                router.replace("/dashboard/student");
            } else if (user.role === "admin") {
                router.replace("/admin/dashboard");
            }
        }
    }, [user, isLoading, router]);

    // Real-time listener for admin approval from both identity sources.
    useEffect(() => {
        if (!user?.id || user.approved) return;

        let hasRedirected = false;
        const redirectIfApproved = () => {
            if (hasRedirected) return;
            hasRedirected = true;
            toast.success("Account approved! Redirecting to dashboard...");
            router.replace("/dashboard/faculty");
        };

        const unsubscribeUsers = onSnapshot(doc(db, "users", user.id), (docSnap) => {
            if (!docSnap.exists()) return;
            const data = docSnap.data();
            if (data.approved === true) {
                redirectIfApproved();
            }
        });

        const unsubscribeFaculty = onSnapshot(doc(db, "faculty", user.id), (docSnap) => {
            if (!docSnap.exists()) return;
            const data = docSnap.data();
            if (data.approved === true) {
                redirectIfApproved();
            }
        });

        return () => {
            unsubscribeUsers();
            unsubscribeFaculty();
        };
    }, [user?.id, user?.approved, router]);

    if (isLoading || !user) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-amber-500">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-amber-100 p-3 rounded-full w-16 h-16 flex items-center justify-center text-amber-600">
                        <Clock className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Account Pending</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Your account is under admin review.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6 pt-4">
                    <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                        <p>
                            Thank you for registering as faculty. You will be able to access your dashboard and manage students once an administrator approves your account.
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                            <p className="font-bold text-amber-800 mb-1 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" /> Are you a Student?
                            </p>
                            <p className="text-amber-700 text-xs">
                                If you are a student and see this page, something went wrong. Please <b>Log Out</b> and sign in again using your official university email.
                            </p>
                        </div>
                    </div>
                    <Button onClick={logout} variant="outline" className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}

