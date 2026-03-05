"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { saveSemesterData } from "@/lib/firestore";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SemesterData {
    semester: number;
    sgpa: string; // Keep as string for input handling, convert to number for calcs
    isCompleted: boolean;
}

export default function AcademicRecordsSetupPage() {
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // State to hold data for ALL semesters up to current
    const [semesters, setSemesters] = useState<SemesterData[]>([]);
    const [activeTab, setActiveTab] = useState("sem-1");

    // Arrear State
    const [arrearCount, setArrearCount] = useState<number>(0);
    const [arrearDetails, setArrearDetails] = useState<{ id: string, name: string, sem: number, type: "Core" | "Non-Core" }[]>([]);

    useEffect(() => {
        if (user && user.currentSemester) {
            // Initialize data structure for semesters 1 to current - 1 (completed semesters)
            const total = user.currentSemester;
            const init: SemesterData[] = [];

            for (let i = 1; i < total; i++) {
                init.push({
                    semester: i,
                    sgpa: "",
                    isCompleted: false
                });
            }
            setSemesters(init);
        }
    }, [user?.currentSemester]);

    const handleSgpaChange = (semIndex: number, value: string) => {
        // Validate input: limit to 2 decimal places, max 10
        if (value && !/^\d*\.?\d{0,2}$/.test(value)) return;

        const numValue = parseFloat(value);
        if (numValue > 10) return;

        const newSemesters = [...semesters];
        newSemesters[semIndex].sgpa = value;
        newSemesters[semIndex].isCompleted = value !== "" && !isNaN(parseFloat(value));
        setSemesters(newSemesters);
    };

    const handleArrearCountChange = (val: string) => {
        const count = parseInt(val) || 0;
        setArrearCount(count);

        // Adjust details array size
        if (count > arrearDetails.length) {
            const added = Array(count - arrearDetails.length).fill(null).map(() => ({
                id: Math.random().toString(36).substr(2, 9),
                name: "",
                sem: 1,
                type: "Core" as "Core" | "Non-Core"
            }));
            setArrearDetails([...arrearDetails, ...added]);
        } else {
            setArrearDetails(arrearDetails.slice(0, count));
        }
    };

    const updateArrearDetail = (index: number, field: string, value: any) => {
        const newDetails = [...arrearDetails];
        // @ts-ignore
        newDetails[index][field] = value;
        setArrearDetails(newDetails);
    };

    const handleSaveAll = async () => {
        if (!user) return;

        // Validate Semesters
        const incomplete = semesters.find(s => !s.isCompleted || s.sgpa === "");
        if (incomplete) {
            toast.error(`Please enter SGPA for Semester ${incomplete.semester}`);
            return;
        }

        // Validate Arrears
        if (arrearCount > 0) {
            const incompleteArrear = arrearDetails.find(a => !a.name || !a.sem);
            if (incompleteArrear) {
                toast.error("Please fill in all details for your arrears.");
                return;
            }
        }

        setIsLoading(true);
        try {
            // Convert to persistent format
            const academicRecords = semesters.map(s => ({
                semester: s.semester,
                sgpa: parseFloat(s.sgpa)
            }));

            // Save each semester to Firestore subcollection
            if (user) {
                for (const rec of academicRecords) {
                    await saveSemesterData(user.id, `sem-${rec.semester}`, {
                        semesterNumber: rec.semester,
                        sgpa: rec.sgpa,
                    });
                }
            }

            // Calc CGPA = Sum(SGPA) / N
            let totalSgpa = 0;
            let count = 0;

            academicRecords.forEach(rec => {
                totalSgpa += rec.sgpa;
                count++;
            });

            const finalCgpa = count > 0 ? parseFloat((totalSgpa / count).toFixed(2)) : 0;

            // Prepare Arrear Data
            const finalArrearDetails = arrearDetails.map(a => ({
                subjectName: a.name,
                semester: a.sem,
                type: a.type
            }));

            await updateUserProfile({
                academicRecords,
                cgpa: finalCgpa,
                areGradesComplete: true,
                standingArrears: arrearCount,
                arrearDetails: finalArrearDetails,
                arrears: arrearCount // Legacy Sync
            });

            toast.success("Academic records updated!");
            router.push("/dashboard/student");

        } catch (e) {
            console.error(e);
            toast.error("Failed to save records");
        } finally {
            setIsLoading(false);
        }
    };

    if (semesters.length === 0) return <div className="p-8 text-center">Loading academic setup...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/50 mb-1">Student Intelligence Portal</p>
                        <h1 className="text-3xl font-black mb-2 tracking-tight">Academic Records Setup 📝</h1>
                        <p className="text-white/60 font-medium text-sm">Initialize your academic profile and verify your semester performance.</p>
                    </div>
                    <Button onClick={handleSaveAll} disabled={isLoading} size="lg" className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-black uppercase tracking-widest backdrop-blur-md shadow-2xl">
                        {isLoading ? "Saving..." : "Save & Finish Setup"}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap h-auto p-1 bg-white dark:bg-slate-900 border shadow-sm rounded-xl mb-6">
                    {semesters.map(sem => (
                        <TabsTrigger
                            key={sem.semester}
                            value={`sem-${sem.semester}`}
                            className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-primary data-[state=active]:text-white"
                        >
                            Sem {sem.semester}
                            {sem.isCompleted && <CheckCircle className="ml-2 h-4 w-4" />}
                        </TabsTrigger>
                    ))}
                    <TabsTrigger value="arrears" className="flex-1 min-w-[100px] h-10 data-[state=active]:bg-destructive data-[state=active]:text-white">
                        Arrears / Backlogs
                        {arrearCount > 0 && <span className="ml-2 bg-white dark:bg-slate-900 text-destructive text-xs px-1.5 rounded-full font-bold">{arrearCount}</span>}
                    </TabsTrigger>
                </TabsList>

                {semesters.map((sem, sIdx) => (
                    <TabsContent key={sem.semester} value={`sem-${sem.semester}`}>
                        <Card className="border-t-4 border-t-indigo-500 shadow-md">
                            <CardHeader>
                                <CardTitle>Semester {sem.semester} Performance</CardTitle>
                                <CardDescription>
                                    Enter your Semester Grade Point Average (SGPA).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor={`sgpa-${sem.semester}`}>SGPA (0 - 10)</Label>
                                    <Input
                                        id={`sgpa-${sem.semester}`}
                                        type="number"
                                        placeholder="e.g. 8.5"
                                        min="0"
                                        max="10"
                                        step="0.01"
                                        value={sem.sgpa}
                                        onChange={e => handleSgpaChange(sIdx, e.target.value)}
                                        className="text-lg"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the SGPA exactly as mentioned in your mark sheet.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}

                <TabsContent value="arrears">
                    <Card className="border-t-4 border-t-red-500 shadow-md">
                        <CardHeader>
                            <CardTitle>Standing Arrears / Backlogs</CardTitle>
                            <CardDescription>
                                Do you have any active arrears (subjects not yet cleared)?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 max-w-xs">
                                <Label>Number of Standing Arrears</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={arrearCount}
                                    onChange={e => handleArrearCountChange(e.target.value)}
                                    className="text-lg"
                                />
                                <p className="text-xs text-muted-foreground">Enter 0 if you have cleared all subjects.</p>
                            </div>

                            {arrearCount > 0 && (
                                <div className="space-y-4 border rounded-lg p-4 bg-red-50/50">
                                    <h3 className="font-semibold text-sm">Arrear Details</h3>
                                    {arrearDetails.map((detail, idx) => (
                                        <div key={detail.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-white dark:bg-slate-900 rounded-md border shadow-sm">
                                            <div className="md:col-span-1 flex items-center justify-center h-full">
                                                <span className="bg-red-100 text-red-700 dark:text-red-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            <div className="md:col-span-5 space-y-1">
                                                <Label className="text-xs">Subject Name</Label>
                                                <Input
                                                    placeholder="e.g. Engineering Maths I"
                                                    value={detail.name}
                                                    onChange={e => updateArrearDetail(idx, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-3 space-y-1">
                                                <Label className="text-xs">Semester</Label>
                                                <Select
                                                    value={detail.sem.toString()}
                                                    onValueChange={v => updateArrearDetail(idx, 'sem', parseInt(v))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[...Array(8)].map((_, i) => (
                                                            <SelectItem key={i} value={(i + 1).toString()}>Sem {i + 1}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="md:col-span-3 space-y-1">
                                                <Label className="text-xs">Type</Label>
                                                <Select
                                                    value={detail.type}
                                                    onValueChange={v => updateArrearDetail(idx, 'type', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Core">Core</SelectItem>
                                                        <SelectItem value="Non-Core">Non-Core</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
