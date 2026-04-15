"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { OutcomeAlignment, CoreAcademicProfile, RoleTrackProfile, CoreTopicSelection } from "@/types";
import { calculateOutcomeAlignmentScore } from "@/lib/calculations/academic-calculations";
import { PLACEMENT_ROLES, ROLE_SKILL_MATRIX, PlacementRole, getRolesForDepartment } from "@/lib/core/role-skills";
import { CORE_ACADEMIC_TOPICS } from "@/lib/core/core-topics";
import { getCoreSubjects } from "@/lib/core/department-core";
import { Loader2, Save, BrainCircuit, GraduationCap, Target, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VerificationTestModal } from "@/components/verification-test-modal";

const CORE_SUBJECT_LABELS: Record<string, string> = {
    // Labels are now mostly identity or slightly cleaned
};

export default function OutcomeAlignmentPage() {
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // STATE - Core Topics
    const [selectedCoreTopics, setSelectedCoreTopics] = useState<CoreTopicSelection>({
        "Aptitude": [],
        "Communication": [],
        "Data Structures": [],
        "Algorithms": [],
        "DBMS": [],
        "Operating Systems": [],
        "Computer Networks": [],
        "OOPS": [],
        "Problem Solving": []
    });

    // STATE - Role Track
    const [selectedTrack, setSelectedTrack] = useState<string>("");
    const [conceptState, setConceptState] = useState<{
        core: string[];
        intermediate: string[];
        advanced: string[];
    }>({ core: [], intermediate: [], advanced: [] });

    // Modals
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingTopics, setPendingTopics] = useState<CoreTopicSelection>({});
    const [verifiedCoreTopics, setVerifiedCoreTopics] = useState<CoreTopicSelection>({});

    // New: Role Verification State
    const [verifiedRoleConcepts, setVerifiedRoleConcepts] = useState<{
        core: string[];
        intermediate: string[];
        advanced: string[];
    }>({ core: [], intermediate: [], advanced: [] });

    // Track which section triggered the test
    const [testMode, setTestMode] = useState<"core" | "role" | null>(null);

    // Load existing data
    useEffect(() => {
        if (!user) return;

        if (user.verifiedCoreTopics) {
            setVerifiedCoreTopics(user.verifiedCoreTopics);
        }
        if (user.verifiedRoleConcepts) {
            setVerifiedRoleConcepts(user.verifiedRoleConcepts);
        }

        if (user.outcomeAlignment) {
            const oa = user.outcomeAlignment;

            if (oa.coreTopics) {
                setSelectedCoreTopics(prev => ({
                    ...prev,
                    ...oa.coreTopics
                }));
            }

            // Role
            if (oa.role) {
                setSelectedTrack(oa.role.trackSelected || "");
                setConceptState({
                    core: oa.role?.concepts?.core || [],
                    intermediate: oa.role?.concepts?.intermediate || [],
                    advanced: oa.role?.concepts?.advanced || []
                });
            } else if (oa.track) {
                // Legacy support
                setSelectedTrack(oa.track);
            }
        } else if (user?.placementMetrics?.preferredRole) {
            // Very old legacy
            setSelectedTrack(user.placementMetrics.preferredRole);
        }
    }, [user]);

    // HANDLERS
    const handleTrackChange = (track: string) => {
        // Reset concepts if changing track manually
        if (track !== selectedTrack) {
            setConceptState({ core: [], intermediate: [], advanced: [] });
        }
        setSelectedTrack(track);
    };

    const toggleConcept = (category: keyof typeof conceptState, concept: string) => {
        setConceptState(prev => {
            const current = prev[category];
            const updated = current.includes(concept)
                ? current.filter(s => s !== concept)
                : [...current, concept];
            return { ...prev, [category]: updated };
        });
    };

    const handleSelectAllConcept = (category: keyof typeof conceptState, select: boolean) => {
        if (!currentTrackMatrix) return;
        setConceptState(prev => ({
            ...prev,
            [category]: select ? [...currentTrackMatrix[category]] : []
        }));
    };

    const calculatedCoreProfile = useMemo(() => {
        const dept = user?.department || "CSE";
        const mandatorySubjects = getCoreSubjects(dept);
        const profile: Record<string, number> = {};
        let totalScore = 0;

        mandatorySubjects.forEach(subject => {
            const allTopics = (CORE_ACADEMIC_TOPICS as any)[subject] || [];
            // Use verifiedCoreTopics so the UI reflects the real verified score
            const verified = (verifiedCoreTopics as any)[subject] || [];
            const score = allTopics.length > 0
                ? Math.round((verified.length / allTopics.length) * 100)
                : 0;

            profile[subject] = score;
            totalScore += score;
        });

        const coreCoverage = mandatorySubjects.length > 0 ? Math.round(totalScore / mandatorySubjects.length) : 0;
        return {
            ...profile,
            coreCoverage
        };
    }, [verifiedCoreTopics, user?.department]);


    const handleSaveCore = () => {
        // Find unverified new topics
        const newUnverifiedTopics: CoreTopicSelection = {};
        let hasNew = false;

        Object.keys(selectedCoreTopics).forEach(domain => {
            const selected = selectedCoreTopics[domain] || [];
            const verified = verifiedCoreTopics[domain] || [];
            const newlySelected = selected.filter(t => !verified.includes(t));
            if (newlySelected.length > 0) {
                newUnverifiedTopics[domain] = newlySelected;
                hasNew = true;
            }
        });

        if (hasNew) {
            setPendingTopics(newUnverifiedTopics);
            setTestMode("core");
            setShowVerificationModal(true);
        } else {
            finalizeSave(verifiedCoreTopics, verifiedRoleConcepts);
        }
    };

    const handleSaveRole = () => {
        const newUnverifiedTopics: CoreTopicSelection = {};
        let hasNew = false;

        // Add Role Concepts
        const newCore = conceptState.core.filter(c => !verifiedRoleConcepts.core.includes(c));
        const newInter = conceptState.intermediate.filter(c => !verifiedRoleConcepts.intermediate.includes(c));
        const newAdv = conceptState.advanced.filter(c => !verifiedRoleConcepts.advanced.includes(c));

        if (newCore.length > 0 || newInter.length > 0 || newAdv.length > 0) {
            hasNew = true;
            if (newCore.length > 0) newUnverifiedTopics["Role Core"] = newCore;
            if (newInter.length > 0) newUnverifiedTopics["Role Intermediate"] = newInter;
            if (newAdv.length > 0) newUnverifiedTopics["Role Advanced"] = newAdv;
        }

        if (hasNew) {
            setPendingTopics(newUnverifiedTopics);
            setTestMode("role");
            setShowVerificationModal(true);
        } else {
            finalizeSave(verifiedCoreTopics, verifiedRoleConcepts);
        }
    };

    const handleVerificationComplete = async (newVerifiedTopics: CoreTopicSelection, score: number) => {
        if (testMode === "core") {
            const mergedVerifiedCore: CoreTopicSelection = { ...verifiedCoreTopics };
            Object.keys(newVerifiedTopics).forEach(domain => {
                if (!domain.startsWith("Role ")) {
                    const existing = mergedVerifiedCore[domain] || [];
                    mergedVerifiedCore[domain] = [...new Set([...existing, ...newVerifiedTopics[domain]])];
                }
            });
            setVerifiedCoreTopics(mergedVerifiedCore);
            await finalizeSave(mergedVerifiedCore, verifiedRoleConcepts, score);
        } else if (testMode === "role") {
            const mergedVerifiedRole = {
                core: [...new Set([...verifiedRoleConcepts.core, ...(newVerifiedTopics["Role Core"] || [])])],
                intermediate: [...new Set([...verifiedRoleConcepts.intermediate, ...(newVerifiedTopics["Role Intermediate"] || [])])],
                advanced: [...new Set([...verifiedRoleConcepts.advanced, ...(newVerifiedTopics["Role Advanced"] || [])])]
            };
            setVerifiedRoleConcepts(mergedVerifiedRole);
            await finalizeSave(verifiedCoreTopics, mergedVerifiedRole, score);
        } else {
            // Backup fallback just in case
            await finalizeSave(verifiedCoreTopics, verifiedRoleConcepts, score);
        }
    };

    const finalizeSave = async (latestVerifiedTopics: CoreTopicSelection, latestVerifiedRole: { core: string[], intermediate: string[], advanced: string[] }, testScore?: number) => {
        setLoading(true);

        try {
            // Recalculate based on verified for saving
            const dept = user?.department || "CSE";
            const mandatorySubjects = getCoreSubjects(dept);
            const profile: Record<string, number> = {};
            let totalCoreScore = 0;

            mandatorySubjects.forEach(subject => {
                const allTopics = (CORE_ACADEMIC_TOPICS as any)[subject] || [];
                const verified = (latestVerifiedTopics as any)[subject] || [];
                const score = allTopics.length > 0
                    ? Math.round((verified.length / allTopics.length) * 100)
                    : 0;
                profile[subject] = score;
                totalCoreScore += score;
            });

            const coreCoverage = mandatorySubjects.length > 0 ? Math.round(totalCoreScore / mandatorySubjects.length) : 0;
            const updatedCoreProfile = { ...profile, coreCoverage };

            const updatedRoleProfile: RoleTrackProfile = {
                trackSelected: selectedTrack,
                concepts: {
                    core: conceptState.core,
                    intermediate: conceptState.intermediate,
                    advanced: conceptState.advanced
                },
                roleTrackCoverage: 0
            };

            // 2. Calculate Role Coverage locally for storage
            let roleCov = 0;
            if (selectedTrack) {
                const matrix = ROLE_SKILL_MATRIX[selectedTrack as PlacementRole];
                if (matrix) {
                    const corePct = matrix.core.length > 0 ? (conceptState.core.length / matrix.core.length) * 100 : 0;
                    const interPct = matrix.intermediate.length > 0 ? (conceptState.intermediate.length / matrix.intermediate.length) * 100 : 0;
                    const advPct = matrix.advanced.length > 0 ? (conceptState.advanced.length / matrix.advanced.length) * 100 : 0;
                    roleCov = (0.5 * corePct) + (0.3 * interPct) + (0.2 * advPct);
                }
            }
            updatedRoleProfile.roleTrackCoverage = Math.round(Number.isNaN(roleCov) ? 0 : roleCov);

            // 3. Construct OutcomeAlignment
            const alignmentData: OutcomeAlignment = {
                core: updatedCoreProfile,
                role: updatedRoleProfile,
                coreTopics: selectedCoreTopics, // Save all selected
                score: 0,
                lastUpdated: new Date().toISOString()
            };

            // 4. Calculate Final Score (the updated academic-calculations will use the supplied verifiedCoreTopics if we pass it dynamically, or we rely on the DB hook. Let's just update the user profile first).
            const mockUserForCalc = { ...user, verifiedCoreTopics: latestVerifiedTopics, outcomeAlignment: alignmentData };
            // Note: calculateOutcomeAlignmentScore in original code relies on outcome alignment data.
            const finalScore = calculateOutcomeAlignmentScore(alignmentData);
            alignmentData.score = finalScore;

            // 5. Save to Firestore
            await updateUserProfile({
                coreAcademicProfile: updatedCoreProfile,
                roleTrackProfile: updatedRoleProfile,
                coreAcademicTopics: selectedCoreTopics, // Explicit top-level save
                verifiedCoreTopics: latestVerifiedTopics, // NEW FIELD
                verifiedRoleConcepts: latestVerifiedRole, // NEW FIELD
                ...(testScore !== undefined && { verificationScore: testScore }),
                ...(testScore !== undefined && testScore < 5 && { failedVerifications: (user?.failedVerifications || 0) + 1 }),
                outcomeAlignment: alignmentData,
                // Explicitly sync scores for Faculty Portal visibility
                priScore: finalScore,
                riskLevel: finalScore >= 75 ? "Ready" : finalScore >= 60 ? "Moderate" : "High"
            });

            // Analytics History
            if (user?.id) {
                const alignRef = doc(db, "users", user.id, "academicOutcomes", "alignment");
                await setDoc(alignRef, { ...alignmentData, updatedAt: serverTimestamp() });
            }

            toast.success("Outcome Alignment updated successfully!");
        } catch (error) {
            console.error("Error saving alignment:", error);
            toast.error("Failed to save alignment data.");
        } finally {
            setLoading(false);
        }
    };

    // Current calculations for UI feedback
    const currentTrackMatrix = selectedTrack ? ROLE_SKILL_MATRIX[selectedTrack as PlacementRole] : null;

    // Department-filtered roles
    const departmentRoles = useMemo(() => {
        return getRolesForDepartment(user?.department || "CSE");
    }, [user?.department]);

    // Quick role calc for display metrics using verified
    let currentRoleScore = 0;
    if (currentTrackMatrix) {
        const calc = (current: string[], required: string[]) => {
            const valid = current.filter(c => required.includes(c));
            return required.length > 0 ? (valid.length / required.length) * 100 : 0;
        };
        const corePct = calc(verifiedRoleConcepts.core, currentTrackMatrix.core);
        const interPct = calc(verifiedRoleConcepts.intermediate, currentTrackMatrix.intermediate);
        const advPct = calc(verifiedRoleConcepts.advanced, currentTrackMatrix.advanced);
        currentRoleScore = (0.5 * corePct) + (0.3 * interPct) + (0.2 * advPct);
    }

    const currentFinalScore = selectedTrack
        ? Math.round((0.5 * calculatedCoreProfile.coreCoverage!) + (0.5 * currentRoleScore))
        : calculatedCoreProfile.coreCoverage!;

    const displayScore = Math.round(Number.isNaN(currentFinalScore) ? 0 : currentFinalScore);


    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(30,27,75,0.8)] p-8 md:p-10 text-white group">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/10 to-transparent blur-3xl group-hover:from-white/20 transition-all duration-1000" />
                <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
                <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 dark:bg-slate-900/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/20 text-white shadow-inner">
                            <Sparkles className="h-3 w-3 text-amber-300" />
                            <span>Student Intelligence Portal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.12] pb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100 drop-shadow-sm">Development Alignment</h1>
                        <p className="text-white/80 font-medium text-base md:text-lg leading-relaxed">
                            Define your career trajectory and map your skills to industry standards. This drives your Professional Readiness Index (PRI).
                        </p>
                    </div>
                    <div className="relative group/circle shrink-0 mt-4 md:mt-0">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-400 via-teal-500 to-emerald-300 rounded-full blur-xl opacity-40 group-hover/circle:opacity-70 group-hover/circle:blur-2xl transition duration-700 animate-spin-slow" />
                        <div className="relative flex flex-col h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-full bg-white/10 dark:bg-slate-900/30 border-4 border-white/20 shadow-2xl group-hover/circle:border-emerald-400 group-hover/circle:scale-105 transition-all duration-500 backdrop-blur-xl">
                            <span className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{displayScore}</span>
                            <span className="block text-[10px] uppercase tracking-[0.15em] text-emerald-300 mt-1 font-black">Alignment</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. CORE ACADEMIC FOUNDATIONS */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl shadow-inner border border-indigo-200 dark:border-indigo-800 group-hover:scale-110 transition-transform duration-300">
                            <BrainCircuit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase">Core Academic Foundations</CardTitle>
                            <CardDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Select the topics you have mastered in each mandatory core domain.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {getCoreSubjects(user?.department || "CSE").map((subject) => {
                            const topics = (CORE_ACADEMIC_TOPICS as any)[subject] || [];
                            const score = (calculatedCoreProfile as any)[subject] || 0;
                            const selectedCount = (selectedCoreTopics as any)[subject]?.length || 0;
                            const allSelected = selectedCount === topics.length && topics.length > 0;

                            return (
                                <div key={subject} className="space-y-4 p-5 border-2 rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors shadow-sm relative overflow-hidden group/subject">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 opacity-0 group-hover/subject:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    <div className="relative z-10 flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <Label className="font-black text-slate-800 dark:text-slate-200 text-lg cursor-pointer tracking-tight" htmlFor={`all-${subject}`}>{subject}</Label>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge className={cn("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm", score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700')}>
                                                Verified: {score}%
                                            </Badge>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedCount}/{topics.length} Selected</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex items-center space-x-2 py-2 border-b-2 border-slate-100 dark:border-slate-800 mb-2 pb-3">
                                        <Checkbox
                                            id={`all-${subject}`}
                                            checked={allSelected}
                                            onCheckedChange={(checked) => {
                                                setSelectedCoreTopics(prev => ({
                                                    ...prev,
                                                    [subject]: checked ? [...topics] : []
                                                }));
                                            }}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 border-slate-300 dark:border-slate-600"
                                        />
                                        <Label htmlFor={`all-${subject}`} className="text-[11px] font-black text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                            Select All
                                        </Label>
                                    </div>

                                    <ScrollArea className="h-48 w-full pr-4 relative z-10">
                                        <div className="space-y-2.5">
                                            {topics.map((topic: string) => {
                                                const isSelected = (selectedCoreTopics as any)[subject]?.includes(topic);
                                                const isVerified = (verifiedCoreTopics as any)[subject]?.includes(topic);

                                                return (
                                                    <div key={topic} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <Checkbox
                                                            id={`${subject}-${topic}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => {
                                                                setSelectedCoreTopics(prev => {
                                                                    const currentList = (prev as any)[subject] || [];
                                                                    const updatedList = currentList.includes(topic)
                                                                        ? currentList.filter((t: string) => t !== topic)
                                                                        : [...currentList, topic];
                                                                    return { ...prev, [subject]: updatedList };
                                                                });
                                                            }}
                                                            className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 border-slate-300 dark:border-slate-600"
                                                        />
                                                        <div className="flex-1 flex items-center justify-between">
                                                            <Label
                                                                htmlFor={`${subject}-${topic}`}
                                                                className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight cursor-pointer"
                                                            >
                                                                {topic}
                                                            </Label>
                                                            {isSelected && isVerified && (
                                                                <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800">Verified</Badge>
                                                            )}
                                                            {isSelected && !isVerified && (
                                                                <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800">Pending Test</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-5 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative z-10">
                        <span className="font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest text-sm">Total Core Coverage</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">{calculatedCoreProfile.coreCoverage}</span>
                            <span className="text-lg font-bold text-indigo-400 dark:text-indigo-600">%</span>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 relative z-10 border-t border-slate-100 dark:border-slate-800 mt-5 md:mt-6">
                        <Button
                            onClick={handleSaveCore}
                            disabled={loading}
                            className="relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base font-black tracking-wide rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 group hover:-translate-y-0.5"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                            {loading && testMode === "core" ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-200" />
                                    <span>Updating Core...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    <span>Commit Core Foundations</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>


            {/* 2. TRACK SELECTION */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/50 rounded-xl shadow-inner border border-violet-200 dark:border-violet-800 group-hover:scale-110 transition-transform duration-300">
                            <GraduationCap className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase">Outcome Alignment</CardTitle>
                            <CardDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Select the specialized track that aligns with your professional goals.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-6">
                    <div className="flex flex-col space-y-4 max-w-xl">
                        <Label className="font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest">Target Track</Label>
                        <Select
                            value={selectedTrack}
                            onValueChange={handleTrackChange}
                        >
                            <SelectTrigger className="w-full text-lg h-14 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:ring-violet-500 focus:border-violet-500 rounded-xl shadow-sm transition-all focus:-translate-y-0.5 font-bold text-slate-800 dark:text-slate-200">
                                <SelectValue placeholder="Choose an Academic Track" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-xl">
                                {departmentRoles.map(role => (
                                    <SelectItem key={role} value={role} className="cursor-pointer font-bold py-3 hover:bg-violet-50 dark:hover:bg-violet-900/30 focus:bg-violet-50 dark:focus:bg-violet-900/30 transition-colors">{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 3. CONCEPTS MATRIX */}
            {selectedTrack && currentTrackMatrix ? (
                <Card className="border-none shadow-xl transition-all duration-500 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-4 relative overflow-hidden group/matrix">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover/matrix:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-inner border border-blue-200 dark:border-blue-800">
                                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase">{selectedTrack} Competency Matrix</CardTitle>
                                <CardDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Validate your mastery of role-specific concepts. This builds your Role Skill Score.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-8 space-y-6">
                        {/* CORE */}
                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-l-4 border-emerald-500 pl-4 py-2 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30 rounded-r-xl gap-4">
                                <div>
                                    <Label className="text-xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">Core Concepts</Label>
                                    <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mt-1">Foundation (50% Weightage)</p>
                                </div>
                                <div className="flex items-center gap-5 mr-4">
                                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <Checkbox
                                            id="all-core-concepts"
                                            checked={conceptState.core.length === currentTrackMatrix.core.length && currentTrackMatrix.core.length > 0}
                                            onCheckedChange={(checked) => handleSelectAllConcept("core", checked as boolean)}
                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                        <Label htmlFor="all-core-concepts" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-600 dark:text-slate-400">Select All</Label>
                                    </div>
                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-sm px-3 py-1 shadow-sm">
                                        {conceptState.core.length} / {currentTrackMatrix.core.length}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currentTrackMatrix.core.map(concept => {
                                    const isSelected = conceptState.core.includes(concept);
                                    const isVerified = verifiedRoleConcepts.core.includes(concept);
                                    return (
                                        <div key={concept} className={cn("flex items-start space-x-3 p-3.5 rounded-xl border-2 transition-all shadow-sm group/box", isSelected ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/50")}>
                                            <Checkbox
                                                id={`core-${concept}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleConcept("core", concept)}
                                                className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-slate-300 dark:border-slate-600 drop-shadow-sm"
                                            />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <Label htmlFor={`core-${concept}`} className={cn("cursor-pointer font-bold text-sm transition-colors", isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-slate-700 dark:text-slate-300 group-hover/box:text-slate-900 dark:group-hover/box:text-white")}>{concept}</Label>
                                                <div className="flex w-full">
                                                    {isSelected && isVerified && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-widest bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800 whitespace-nowrap">Verified</Badge>
                                                    )}
                                                    {isSelected && !isVerified && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800 whitespace-nowrap">Pending Test</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* INTERMEDIATE */}
                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-l-4 border-blue-500 pl-4 py-2 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 rounded-r-xl gap-4">
                                <div>
                                    <Label className="text-xl font-black text-blue-800 dark:text-blue-400 uppercase tracking-wide">Intermediate Application</Label>
                                    <p className="text-xs font-bold text-blue-600/70 dark:text-blue-500/70 uppercase tracking-widest mt-1">Application (30% Weightage)</p>
                                </div>
                                <div className="flex items-center gap-5 mr-4">
                                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <Checkbox
                                            id="all-inter-concepts"
                                            checked={conceptState.intermediate.length === currentTrackMatrix.intermediate.length && currentTrackMatrix.intermediate.length > 0}
                                            onCheckedChange={(checked) => handleSelectAllConcept("intermediate", checked as boolean)}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <Label htmlFor="all-inter-concepts" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-600 dark:text-slate-400">Select All</Label>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-black text-sm px-3 py-1 shadow-sm">
                                        {conceptState.intermediate.length} / {currentTrackMatrix.intermediate.length}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currentTrackMatrix.intermediate.map(concept => {
                                    const isSelected = conceptState.intermediate.includes(concept);
                                    const isVerified = verifiedRoleConcepts.intermediate.includes(concept);
                                    return (
                                        <div key={concept} className={cn("flex items-start space-x-3 p-3.5 rounded-xl border-2 transition-all shadow-sm group/box", isSelected ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50")}>
                                            <Checkbox
                                                id={`inter-${concept}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleConcept("intermediate", concept)}
                                                className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-slate-300 dark:border-slate-600 drop-shadow-sm"
                                            />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <Label htmlFor={`inter-${concept}`} className={cn("cursor-pointer font-bold text-sm transition-colors", isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300 group-hover/box:text-slate-900 dark:group-hover/box:text-white")}>{concept}</Label>
                                                <div className="flex w-full">
                                                    {isSelected && isVerified && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-widest bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-800 whitespace-nowrap">Verified</Badge>
                                                    )}
                                                    {isSelected && !isVerified && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800 whitespace-nowrap">Pending Test</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ADVANCED */}
                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between border-l-4 border-purple-500 pl-4 py-2 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/30 rounded-r-xl gap-4">
                                <div>
                                    <Label className="text-xl font-black text-purple-800 dark:text-purple-400 uppercase tracking-wide">Advanced Mastery</Label>
                                    <p className="text-xs font-bold text-purple-600/70 dark:text-purple-500/70 uppercase tracking-widest mt-1">Mastery (20% Weightage)</p>
                                </div>
                                <div className="flex items-center gap-5 mr-4">
                                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <Checkbox
                                            id="all-adv-concepts"
                                            checked={conceptState.advanced.length === currentTrackMatrix.advanced.length && currentTrackMatrix.advanced.length > 0}
                                            onCheckedChange={(checked) => handleSelectAllConcept("advanced", checked as boolean)}
                                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <Label htmlFor="all-adv-concepts" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-slate-600 dark:text-slate-400">Select All</Label>
                                    </div>
                                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-black text-sm px-3 py-1 shadow-sm">
                                        {conceptState.advanced.length} / {currentTrackMatrix.advanced.length}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currentTrackMatrix.advanced.map(concept => {
                                    const isSelected = conceptState.advanced.includes(concept);
                                    const isVerified = verifiedRoleConcepts.advanced.includes(concept);
                                    return (
                                        <div key={concept} className={cn("flex items-start space-x-3 p-3.5 rounded-xl border-2 transition-all shadow-sm group/box", isSelected ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/50")}>
                                            <Checkbox
                                                id={`adv-${concept}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleConcept("advanced", concept)}
                                                className="mt-0.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 border-slate-300 dark:border-slate-600 drop-shadow-sm"
                                            />
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <Label htmlFor={`adv-${concept}`} className={cn("cursor-pointer font-bold text-sm transition-colors", isSelected ? "text-purple-900 dark:text-purple-100" : "text-slate-700 dark:text-slate-300 group-hover/box:text-slate-900 dark:group-hover/box:text-white")}>{concept}</Label>
                                                <div className="flex w-full">
                                                    {isSelected && isVerified && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-widest bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-800 whitespace-nowrap">Verified</Badge>
                                                    )}
                                                    {isSelected && !isVerified && (
                                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800 whitespace-nowrap">Pending Test</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end pt-8 relative z-10 border-t border-slate-100 dark:border-slate-800 mt-6">
                            <Button
                                onClick={handleSaveRole}
                                disabled={loading || !selectedTrack}
                                className="relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base font-black tracking-wide rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 group hover:-translate-y-0.5"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                                {loading && testMode === "role" ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-indigo-200" />
                                        <span>Updating Track...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        <span>Commit Outcome Alignment</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-16 text-center animate-in fade-in zoom-in-95 duration-500 group hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <Target className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Select a Track to Begin</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 font-medium text-sm leading-relaxed">
                            Choose an academic track above to view the full competency matrix and map your skills to industry standards.
                        </p>
                    </div>
                </div>
            )}

            {/* 4. OLD COMBINED SAVE BUTTON (Removed) */}
            <VerificationTestModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                selectedTopics={pendingTopics}
                onVerificationComplete={handleVerificationComplete}
            />
        </div>
    );
}



