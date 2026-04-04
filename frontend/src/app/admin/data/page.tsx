"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { ServerCrash, Eraser, AlertTriangle, Loader2 } from "lucide-react";
import { User as AppUser } from "@/types";

export default function DataControlPage() {
    const [processingD, setProcessingD] = useState(false);
    const [processingE, setProcessingE] = useState(false);
    const [processingS, setProcessingS] = useState(false);

    const syncStudentsCollection = async () => {
        setProcessingS(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            const users = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppUser);
            const students = users.filter(u => u.role === "student");

            const batchPromises = students.map(s => {
                const studentId = s.id || s.registerNumber || s.registerNo;
                if (!studentId) return Promise.resolve();
                return updateDoc(doc(db, "students", studentId), s as any).catch(() =>
                    // Fallback to setDoc if it doesn't exist
                    import("firebase/firestore").then(mod => mod.setDoc(doc(db, "students", studentId), s, { merge: true }))
                );
            });

            await Promise.all(batchPromises);
            toast.success(`Successfully synced ${students.length} students to the dedicated collection.`);
        } catch (e) {
            toast.error("Failed to sync students: " + (e as Error).message);
        } finally {
            setProcessingS(false);
        }
    };

    const wipeAllEnrichments = async () => {
        const confirm1 = window.confirm("WARNING: Are you sure you want to delete ALL enrichment records for ALL users?");
        if (!confirm1) return;

        const confirm2 = window.prompt("Type 'CONFIRM' to wipe all enrichment data.");
        if (confirm2 !== "CONFIRM") {
            toast.error("Wipe cancelled.");
            return;
        }

        setProcessingE(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            const batchPromises = snap.docs.map(d => updateDoc(doc(db, "users", d.id), {
                academicEnrichment: [],
                appliedKnowledge: [],
                academicEngagement: [],
                certifications: [],
                competitions: [],
                extraCurricular: []
            }));
            await Promise.all(batchPromises);
            toast.success("Successfully wiped all enrichment records globally.");
        } catch (e) {
            toast.error("Failed to wipe enrichment data: " + (e as Error).message);
        } finally {
            setProcessingE(false);
        }
    };

    const wipeAllSystemData = async () => {
        const confirm1 = window.confirm("CRITICAL DANGER: Are you sure you want to DELETE ALL STUDENTS AND FACULTY from the database?");
        if (!confirm1) return;

        const confirm2 = window.prompt("Type 'NUKE SYSTEM' to permanently delete all non-admin user data.");
        if (confirm2 !== "NUKE SYSTEM") {
            toast.error("System wipe cancelled.");
            return;
        }

        setProcessingD(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            const users = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AppUser);

            // Filter out Admins to prevent locking ourselves out
            const toDelete = users.filter(u => u.role !== "admin");

            const batchPromises = toDelete.map(u => deleteDoc(doc(db, "users", u.id)));
            await Promise.all(batchPromises);

            toast.success(`Successfully deleted ${toDelete.length} user records.`);
        } catch (e) {
            toast.error("Failed to wipe system data: " + (e as Error).message);
        } finally {
            setProcessingD(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-red-600">Data Control Center</h1>
                <p className="text-muted-foreground">Perform mass data wiping and global system resets. Use with extreme caution.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-blue-200 shadow-md">
                    <CardHeader className="bg-blue-50 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <ServerCrash className="w-5 h-5 rotate-180" /> Sync Collections
                        </CardTitle>
                        <CardDescription className="text-blue-700/80">
                            Port pre-registered users to the student database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            If Faculty member dashboards show 0 students instead of the true count, use this to clone missing student records from the master 'users' collection into the 'students' sub-system.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full border-blue-500 text-blue-600 hover:bg-blue-100"
                            onClick={syncStudentsCollection}
                            disabled={processingS || processingD || processingE}
                        >
                            {processingS ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</> : "Sync Students Database"}
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="border-amber-200 shadow-md">
                    <CardHeader className="bg-amber-50 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <Eraser className="w-5 h-5" /> Wipe Enrichments
                        </CardTitle>
                        <CardDescription className="text-amber-700/80">
                            Removes all enrichment, certification, and extracurricular records from every user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            This action iterates through all registered users (Faculty and Students) and resets their portfolio activity arrays to empty. Base profiles and academic records will remain untouched.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full border-amber-500 text-amber-600 hover:bg-amber-100"
                            onClick={wipeAllEnrichments}
                            disabled={processingE || processingD}
                        >
                            {processingE ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Wipe All Enrichment Data"}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-red-200 shadow-md">
                    <CardHeader className="bg-red-50 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <ServerCrash className="w-5 h-5" /> Global System Wipe
                        </CardTitle>
                        <CardDescription className="text-red-700/80">
                            Permanently deletes ALL students and faculty members.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3 bg-red-100/50 p-4 rounded-md border border-red-200">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-900 leading-relaxed">
                                <strong>Warning:</strong> This will destroy the entire user database including portfolios, placements, and risk logs. Admin accounts will be preserved to maintain dashboard access.
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={wipeAllSystemData}
                            disabled={processingE || processingD}
                        >
                            {processingD ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Nuking Database...</> : "Delete All System Data"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
