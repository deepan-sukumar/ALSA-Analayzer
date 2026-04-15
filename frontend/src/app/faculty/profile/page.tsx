"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, GraduationCap, CheckCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import { useState } from "react";
import { updateFacultyProfile } from "@/lib/firebase/firestore";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { normalizeDepartment } from "@/lib/core/department-core";

export default function StandaloneFacultyProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [department, setDepartment] = useState(user?.department || "");
    const [isSaving, setIsSaving] = useState(false);

    if (!user) return null;

    const handleSave = async () => {
        if (!name.trim() || !department.trim()) {
            toast.error("Name and Department are required");
            return;
        }

        setIsSaving(true);
        try {
            await updateFacultyProfile(user.id, {
                name: name.trim(),
                department: normalizeDepartment(department.trim())
            });
            toast.success("Profile updated successfully");
            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout user={user}>
            <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Faculty Profile 👤</h1>
                        <p className="text-muted-foreground font-medium">Verified professional identity and department assignment</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => {
                                setName(user.name);
                                setDepartment(user.department || "");
                                setIsEditing(true);
                            }}>Modify Profile</Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-1 shadow-md border-primary/10">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <User className="h-12 w-12 text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-black italic uppercase">{user.name}</CardTitle>
                            <CardDescription className="font-bold text-primary uppercase tracking-widest text-xs mt-1">{user.role}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            <Badge variant={user.approved ? "success" : "warning"} className="px-6 py-1.5 font-black text-[10px] uppercase tracking-tighter shadow-sm border-2">
                                {user.approved ? "Verified" : "Verification Pending"}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-md border-l-4 border-l-primary overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Account Credentials</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                        <Mail className="h-3.5 w-3.5 mr-2 text-primary" />
                                        Work Email
                                    </div>
                                    <p className="text-lg font-black text-foreground">{user.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                        <User className="h-3.5 w-3.5 mr-2 text-primary" />
                                        Full Name
                                    </div>
                                    {isEditing ? (
                                        <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold" />
                                    ) : (
                                        <p className="text-lg font-black text-foreground">{user.name}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                        <GraduationCap className="h-3.5 w-3.5 mr-2 text-primary" />
                                        Department
                                    </div>
                                    {isEditing ? (
                                        <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="font-bold" placeholder="e.g. IT, CSE" />
                                    ) : (
                                        <p className="text-lg font-black text-foreground">{user.department || "PENDING DEPT ASSIGNMENT"}</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-5">
                                <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    Active System Privileges
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        "Real-time Student Oversight",
                                        "Department Analytics Export",
                                        "Professional Readiness Audit",
                                        "Intervention Management"
                                    ].map((skill) => (
                                        <div key={skill} className="p-4 border-2 border-primary/5 rounded-xl bg-primary/5 flex items-center gap-3 group hover:border-primary/20 transition-all">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="text-xs font-black uppercase tracking-tight">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!user.approved && (
                                <div className="p-5 bg-red-50 dark:bg-red-950/20 border-2 border-red-100 rounded-2xl flex gap-4 animate-pulse">
                                    <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-black text-red-900 dark:text-red-200 uppercase">Verification Pending</h4>
                                        <p className="text-xs text-red-800/80 dark:text-red-300/80 font-medium leading-relaxed">
                                            Your account credentials are currently under review by the Institute Administrator. Data access will be fully enabled once verified.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

