"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { User, Mail, Shield, GraduationCap, Building2, Pencil, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";

const ALL_DEPARTMENTS = [...IT_DEPARTMENTS, ...CORE_DEPARTMENTS].sort();

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { user, updateUserProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [name, setName] = useState("");
    const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("OTHER");
    const [department, setDepartment] = useState("");
    const [designation, setDesignation] = useState("");
    const [cgpa, setCgpa] = useState("");
    const [attendance, setAttendance] = useState("");

    // Sync local state when dialog opens or user changes
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setGender((user.gender as any) || "OTHER");
            setDepartment(user.department || "");
            setDesignation(user.designation || "");
            setCgpa(user.cgpa != null ? String(user.cgpa) : "");
            setAttendance(user.attendance != null ? String(user.attendance) : "");
        }
    }, [user, open]);

    if (!user) return null;

    const getAvatar = () => {
        if (user.gender === "MALE") return "https://avatar.iran.liara.run/public/boy";
        if (user.gender === "FEMALE") return "https://avatar.iran.liara.run/public/girl";
        return "";
    };

    const handleCancel = () => {
        // Reset to original values
        setName(user.name || "");
        setGender((user.gender as any) || "OTHER");
        setDepartment(user.department || "");
        setDesignation(user.designation || "");
        setCgpa(user.cgpa != null ? String(user.cgpa) : "");
        setAttendance(user.attendance != null ? String(user.attendance) : "");
        setEditing(false);
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setSaving(true);
        try {
            const updates: Record<string, any> = {
                name: name.trim(),
                gender,
            };

            if (user.role === "student") {
                if (cgpa) updates.cgpa = parseFloat(cgpa);
                if (attendance) updates.attendance = parseFloat(attendance);
            } else {
                if (designation) updates.designation = designation;
            }

            if (department) updates.department = department;

            updateUserProfile(updates);
            toast.success("Profile updated successfully!");
            setEditing(false);
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setEditing(false); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[480px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/60 dark:border-indigo-500/20 shadow-2xl overflow-hidden p-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <div className="relative z-10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-slate-900 dark:text-white font-bold">User Profile</DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400">
                                    {editing ? "Edit your profile information below." : "View and manage your profile details."}
                                </DialogDescription>
                            </div>
                            {!editing && (
                                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Avatar & Name Header */}
                        <div className="flex flex-col items-center gap-4 mb-2 relative">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                <Avatar className="h-24 w-24 border-[3px] border-white dark:border-slate-900 shadow-md relative">
                                    <AvatarImage src={getAvatar()} alt={user.name} />
                                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-2xl font-black text-slate-700 dark:text-slate-300">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            {!editing && (
                                <div className="text-center space-y-1.5">
                                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{user.name}</h3>
                                    <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 px-3 py-0.5 shadow-sm">
                                        <span className="uppercase font-extrabold tracking-widest text-[10px]">{user.role}</span>
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Fields */}
                        <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 relative">
                            <div className="absolute -left-px top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/50 to-purple-500/50 rounded-r-full" />
                            {/* Name */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="profile-name" className="text-right text-slate-500 dark:text-slate-400">
                                    <User className="h-4 w-4 ml-auto" />
                                </Label>
                                {editing ? (
                                    <Input
                                        id="profile-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="col-span-3 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-medium"
                                        placeholder="Your full name"
                                    />
                                ) : (
                                    <Input id="profile-name" value={user.name} className="col-span-3 bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 shadow-sm font-semibold tracking-tight" readOnly />
                                )}
                            </div>

                            {/* Email (always read-only) */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="profile-email" className="text-right text-slate-500 dark:text-slate-400">
                                    <Mail className="h-4 w-4 ml-auto" />
                                </Label>
                                <Input id="profile-email" value={user.email} className="col-span-3 bg-slate-100/50 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 shadow-inner text-sm font-medium" readOnly />
                            </div>

                            {/* Gender */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Gender</Label>
                                {editing ? (
                                    <div className="col-span-3">
                                        <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                                            <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <Input value={user.gender || "Not set"} className="col-span-3 bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 shadow-sm font-medium" readOnly />
                                )}
                            </div>

                            {/* Department */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-slate-500 dark:text-slate-400">
                                    <Building2 className="h-4 w-4 ml-auto" />
                                </Label>
                                {editing ? (
                                    <div className="col-span-3">
                                        <Select value={department} onValueChange={setDepartment}>
                                            <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 text-sm font-medium">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_DEPARTMENTS.map((dept) => (
                                                    <SelectItem key={dept} value={dept}>
                                                        {dept}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="col-span-3">
                                        <Input value={user.department || "Not set"} className="w-full bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 shadow-sm font-medium overflow-hidden text-ellipsis" readOnly />
                                    </div>
                                )}
                            </div>

                            {/* Role-specific fields */}
                            {user.role === "student" ? (
                                <>
                                    {/* CGPA */}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">CGPA</Label>
                                        {editing ? (
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                value={cgpa}
                                                onChange={(e) => setCgpa(e.target.value)}
                                                className="col-span-3 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-medium font-mono"
                                                placeholder="e.g. 8.5"
                                            />
                                        ) : (
                                            <Input value={user.cgpa != null ? String(user.cgpa) : "--"} className="col-span-3 bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 shadow-sm font-semibold font-mono" readOnly />
                                        )}
                                    </div>

                                    {/* Attendance */}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Attend.</Label>
                                        {editing ? (
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={attendance}
                                                onChange={(e) => setAttendance(e.target.value)}
                                                className="col-span-3 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-medium font-mono"
                                                placeholder="e.g. 85"
                                            />
                                        ) : (
                                            <Input value={user.attendance != null ? `${user.attendance}%` : "--"} className="col-span-3 bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 shadow-sm font-semibold font-mono" readOnly />
                                        )}
                                    </div>
                                </>
                            ) : user.role === "faculty" ? (
                                <>

                                    {/* Designation */}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-slate-500 dark:text-slate-400">
                                            <GraduationCap className="h-4 w-4 ml-auto" />
                                        </Label>
                                        {editing ? (
                                            <div className="col-span-3">
                                                <Select value={designation} onValueChange={setDesignation}>
                                                    <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-medium text-sm">
                                                        <SelectValue placeholder="Select Designation" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="prof">Professor</SelectItem>
                                                        <SelectItem value="assoc">Associate Professor</SelectItem>
                                                        <SelectItem value="asst">Assistant Professor</SelectItem>
                                                        <SelectItem value="lect">Lecturer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <Input value={user.designation || "Not set"} className="col-span-3 bg-white/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 shadow-sm font-medium" readOnly />
                                        )}
                                    </div>
                                </>
                            ) : null}

                            {/* ID (always read-only) */}
                            <div className="grid grid-cols-4 items-center gap-4 mt-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                <Label htmlFor="profile-id" className="text-right text-slate-500 dark:text-slate-400">
                                    <Shield className="h-4 w-4 ml-auto" />
                                </Label>
                                <div className="col-span-3">
                                    <Badge variant="outline" className="font-mono text-[9px] bg-slate-100/30 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 tracking-wider w-full justify-center py-1">
                                        {user.id}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer with Save/Cancel when editing */}
                    {editing && (
                        <DialogFooter className="gap-2 sm:gap-0 pt-2 pb-2">
                            <Button variant="outline" onClick={handleCancel} disabled={saving} className="bg-white/50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 font-semibold shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="h-4 w-4 mr-1.5" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold">
                                {saving ? (
                                    <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="h-4 w-4 mr-1.5" /> Save Changes</>
                                )}
                            </Button>
                        </DialogFooter>
                    )}

                    {!editing && (
                        <DialogFooter className="sm:justify-between items-center bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 mt-4 p-4 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0 h-8 flex items-center justify-center sm:justify-start uppercase tracking-widest pl-2 w-full text-center">
                                System Access Valid
                            </div>
                        </DialogFooter>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

