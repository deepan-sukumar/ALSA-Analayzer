"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, GraduationCap, Phone, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateStudent } from "@/lib/firebase/firestore";
import { IT_DEPARTMENTS, CORE_DEPARTMENTS } from "@/lib/core/department-core";

const ALL_DEPARTMENTS = [...IT_DEPARTMENTS, ...CORE_DEPARTMENTS].sort();

interface EditStudentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: any | null;
}

export function EditStudentSheet({ open, onOpenChange, student }: EditStudentSheetProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [gender, setGender] = useState<"male" | "female" | "">("");

    const [formData, setFormData] = useState({
        registerNumber: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        year: "1",
        section: "A",
        cgpa: "",
        attendance: "",
        riskLevel: "High",
    });

    useEffect(() => {
        if (student) {
            setFormData({
                registerNumber: student.registerNumber || student.registerNo || student.id || "",
                name: student.name || "",
                email: student.email || "",
                phone: student.phone || "",
                department: student.department || "",
                year: (student.year || student.yearOfStudy || "1").toString(),
                section: student.section || "A",
                cgpa: (student.cgpa || "").toString(),
                attendance: (student.attendance || "").toString(),
                riskLevel: student.riskLevel || "High",
            });
            setGender(student.gender?.toLowerCase() === "male" ? "male" : "female");
        }
    }, [student]);

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
            toast.error("Please fill in all mandatory details");
            return;
        }

        setLoading(true);
        try {
            const updatedData = {
                ...formData,
                department: department.toUpperCase(),
                gender: gender === "male" ? "MALE" : "FEMALE",
                yearOfStudy: parseInt(formData.year),
                readinessScore: student.readinessScore || 0,
            };

            await updateStudent(registerNumber, updatedData);

            toast.success("Student profile updated successfully");
            onOpenChange(false);
        } catch (err: any) {
            console.error("Failed to update student:", err);
            toast.error("Failed to update student: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full flex flex-col h-full p-0 overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Edit Student Profile</SheetTitle>
                    <SheetDescription>
                        Modify details for {formData.name} ({formData.registerNumber}).
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">Basic & Contact</TabsTrigger>
                            <TabsTrigger value="academic">Academic & Risk</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <TabsContent value="basic" className="space-y-4 mt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 opacity-70">
                                    <Label>Register Number</Label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-3 h-4 w-4" />
                                        <Input disabled value={formData.registerNumber} className="pl-9 bg-muted" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input id="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50" />
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
                        </TabsContent>

                        <TabsContent value="academic" className="space-y-6 mt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cgpa">CGPA</Label>
                                    <Input id="cgpa" type="number" step="0.01" value={formData.cgpa} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="attendance">Attendance %</Label>
                                    <Input id="attendance" type="number" value={formData.attendance} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center gap-2 text-primary">
                                    <ShieldAlert className="h-4 w-4" />
                                    <Label className="font-bold">Manual Risk Level Override</Label>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {["Critical", "High", "Moderate", "Ready"].map((level) => (
                                        <div
                                            key={level}
                                            onClick={() => handleSelectChange("riskLevel", level)}
                                            className={`cursor-pointer flex items-center justify-center p-3 rounded-lg border transition-all capitalize text-[10px] font-bold ${formData.riskLevel === level
                                                ? level === "Ready" ? "border-green-600 bg-green-50 text-green-700"
                                                    : level === "Moderate" ? "border-amber-600 bg-amber-50 text-amber-700"
                                                        : level === "High" ? "border-orange-600 bg-orange-50 text-orange-700"
                                                            : "border-red-600 bg-red-50 text-red-700"
                                                : "border-input hover:bg-muted"
                                                }`}
                                        >
                                            {level}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Manual override persists until the next student data update triggers a re-calculation.</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <SheetFooter className="px-6 py-4 border-t bg-muted/30">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="px-8">
                        {loading ? "Saving Changes..." : "Update Student"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

