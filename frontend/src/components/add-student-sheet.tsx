"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, GraduationCap, Phone } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStudent, checkStudentExists } from "@/lib/firebase/firestore";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";

const ALL_DEPARTMENTS = [...IT_DEPARTMENTS, ...CORE_DEPARTMENTS].sort();

interface AddStudentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddStudent?: (student: any) => void;
}

export function AddStudentSheet({ open, onOpenChange, onAddStudent }: AddStudentSheetProps) {
    const [loading, setLoading] = useState(false);
    const [gender, setGender] = useState<"male" | "female" | "">("");

    const [formData, setFormData] = useState({
        registerNumber: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        year: "1",
        section: "A",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        const { registerNumber, name, email, department } = formData;

        if (!registerNumber || !name || !email || !gender || !department) {
            toast.error("Please fill in all mandatory details (Reg No, Name, Email, Gender, Dept)");
            return;
        }

        setLoading(true);
        try {
            // 1. Check if student already exists
            const exists = await checkStudentExists(registerNumber);
            if (exists) {
                toast.error(`Student with Register No ${registerNumber} already exists!`);
                setLoading(false);
                return;
            }

            // 2. Prepare standardized data as per requirements
            const studentData = {
                ...formData,
                department: department.toUpperCase(),
                gender: gender === "male" ? "MALE" : "FEMALE",
                role: "student",
                certifications: [],
                enrichment: [],
                profileComplete: false,
                riskLevel: "High",
                readinessScore: 0,
            };

            // 3. Save to Firestore
            await addStudent(registerNumber, studentData);

            toast.success("Student added successfully");
            if (onAddStudent) onAddStudent({ id: registerNumber, ...studentData });

            // 4. Reset & Close
            setFormData({
                registerNumber: "",
                name: "",
                email: "",
                phone: "",
                department: "",
                year: "1",
                section: "A",
            });
            setGender("");
            onOpenChange(false);
        } catch (err: any) {
            console.error("Failed to add student:", err);
            toast.error("Failed to add student: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full flex flex-col h-full p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Add New Student</SheetTitle>
                    <SheetDescription>
                        Register a new student in the system with default "High Risk" status.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="registerNumber">Register Number *</Label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="registerNumber" placeholder="71762104xxx" className="pl-9" value={formData.registerNumber} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="name" placeholder="John Doe" className="pl-9" value={formData.name} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" placeholder="student@university.edu" className="pl-9" value={formData.email} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="phone" placeholder="+91..." className="pl-9" value={formData.phone} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select value={formData.department} onValueChange={(val) => handleSelectChange("department", val)}>
                            <SelectTrigger id="department">
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_DEPARTMENTS.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Year *</Label>
                            <Select value={formData.year} onValueChange={(val) => handleSelectChange("year", val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1st Year</SelectItem>
                                    <SelectItem value="2">2nd Year</SelectItem>
                                    <SelectItem value="3">3rd Year</SelectItem>
                                    <SelectItem value="4">4th Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Section *</Label>
                            <Select value={formData.section} onValueChange={(val) => handleSelectChange("section", val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Section A</SelectItem>
                                    <SelectItem value="B">Section B</SelectItem>
                                    <SelectItem value="C">Section C</SelectItem>
                                    <SelectItem value="D">Section D</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Gender *</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setGender("male")}
                                className={`cursor-pointer flex items-center justify-center gap-2 p-2 rounded-lg border transition-all ${gender === "male" ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-input"}`}
                            >
                                <span>👨</span> Male
                            </div>
                            <div
                                onClick={() => setGender("female")}
                                className={`cursor-pointer flex items-center justify-center gap-2 p-2 rounded-lg border transition-all ${gender === "female" ? "border-pink-500 bg-pink-50 text-pink-700 font-bold" : "border-input"}`}
                            >
                                <span>👩</span> Female
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Adding..." : "Register Student"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

