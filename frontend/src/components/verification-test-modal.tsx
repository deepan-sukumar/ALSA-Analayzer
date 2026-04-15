"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { AlertCircle, Maximize, Clock, ShieldAlert, Loader2, Lock, UserCheck } from "lucide-react";
import { CoreTopicSelection } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeDepartment } from "@/lib/core/department-core";
import { Textarea } from "@/components/ui/textarea";

interface Question {
    id: string;
    topic: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    difficulty: string;
}

interface VerificationTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTopics: CoreTopicSelection;
    onVerificationComplete: (verifiedTopics: CoreTopicSelection, score: number) => void;
}

const TARGET_QUESTION_COUNT = 10; // 6 easy + 3 medium + 1 hard
const PASS_SCORE_OUT_OF_TEN = 5;
const MAX_FAILED_ATTEMPTS = 3;

function normalizeSelectedTopics(selectedTopics: CoreTopicSelection): string[] {
    return Array.from(
        new Set(
            Object.values(selectedTopics)
                .flat()
                .map((topic) => String(topic || "").trim())
                .filter((topic) => topic.length > 0)
        )
    );
}

export function VerificationTestModal({ isOpen, onClose, selectedTopics, onVerificationComplete }: VerificationTestModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<"terms" | "loading" | "test" | "result">("terms");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(8 * 60); // 8 minutes
    const [warnings, setWarnings] = useState(0);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [malpracticeDetected, setMalpracticeDetected] = useState(false);

    const [attemptStatus, setAttemptStatus] = useState<"allowed" | "locked" | "pending_approval">("allowed");
    const [accessDocId, setAccessDocId] = useState<string | null>(null);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
    const [isRequesting, setIsRequesting] = useState(false);
    const [unlockReason, setUnlockReason] = useState("");
    const [generationNote, setGenerationNote] = useState("");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasSubmittedRef = useRef(false);

    // Flatten and sanitize selected topic strings for stable access control + AI generation.
    const flatTopics = normalizeSelectedTopics(selectedTopics);
    const topicsKey = [...flatTopics].sort((a, b) => a.localeCompare(b)).join(",");

    async function checkAccessControl() {
        if (!user) return;
        try {
            if (!topicsKey) {
                setAttemptStatus("allowed");
                setAccessDocId(null);
                return;
            }

            const q = query(collection(db, "testAccessControl"), where("userId", "==", user.id), where("topicsKey", "==", topicsKey));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docSnap = snap.docs[0];
                const data = docSnap.data();
                setAccessDocId(docSnap.id);
                if (data.status === "pending_approval") {
                    setAttemptStatus("pending_approval");
                } else if (data.status === "locked" || data.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                    setAttemptStatus("locked");
                    fetchFaculties();
                } else {
                    setAttemptStatus("allowed");
                }
            } else {
                setAttemptStatus("allowed");
                setAccessDocId(null);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchFaculties() {
        const q = query(collection(db, "users"), where("role", "==", "faculty"));
        const snap = await getDocs(q);
        setFaculties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    const handleRequestUnlock = async () => {
        if (!selectedFacultyId) {
            toast.error("Please select a faculty member.");
            return;
        }
        if (unlockReason.trim().length < 10) {
            toast.error("Please provide a valid reason (at least 10 characters).");
            return;
        }
        setIsRequesting(true);
        const selFac = faculties.find(f => f.id === selectedFacultyId);
        try {
            if (accessDocId) {
                await updateDoc(doc(db, "testAccessControl", accessDocId), {
                    status: "pending_approval",
                    requestedFacultyId: selectedFacultyId,
                    requestedFacultyName: selFac?.name || "Faculty",
                    unlockReason: unlockReason.trim(),
                    timestamp: serverTimestamp()
                });
            } else {
                const docRef = await addDoc(collection(db, "testAccessControl"), {
                    userId: user?.id,
                    studentName: user?.name,
                    topicsKey,
                    status: "pending_approval",
                    failedAttempts: MAX_FAILED_ATTEMPTS,
                    requestedFacultyId: selectedFacultyId,
                    requestedFacultyName: selFac?.name || "Faculty",
                    unlockReason: unlockReason.trim(),
                    timestamp: serverTimestamp()
                });
                setAccessDocId(docRef.id);
            }
            setAttemptStatus("pending_approval");
            setUnlockReason("");
            toast.success("Unlock request sent to faculty!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send request.");
        }
        setIsRequesting(false);
    };

    const loadQuestions = async () => {
        setStep("loading");
        setGenerationNote("");
        try {
            if (flatTopics.length === 0) {
                toast.error("No topics selected.");
                onClose();
                return;
            }

            let fetchedQuestions: Question[] = [];

            try {
                console.log("Loading AI Questions for topics:", flatTopics);
                // Fetch AI generated questions dynamically from our new endpoint
                const res = await fetch("/api/ai-verification-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topics: flatTopics })
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("AI Questions Data Received:", data);
                    if (data.questions && data.questions.length > 0) {
                        fetchedQuestions = data.questions;
                    }
                    if (data?.meta?.note) {
                        setGenerationNote(data.meta.note);
                    }
                    if (data?.meta?.source === "system_fallback" && data?.meta?.retryAfterMs > 0) {
                        toast.info("AI is under progress. System-generated questions are shown now.");
                        window.setTimeout(async () => {
                            try {
                                const retryRes = await fetch("/api/ai-verification-test", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ topics: flatTopics })
                                });
                                if (!retryRes.ok) return;
                                const retryData = await retryRes.json();
                                if (retryData?.meta?.source === "ai" && Array.isArray(retryData.questions) && retryData.questions.length > 0) {
                                    const retryShuffled = retryData.questions.sort(() => 0.5 - Math.random()).slice(0, TARGET_QUESTION_COUNT);
                                    const retryFinal = retryShuffled.map((q: Question) => ({ ...q, options: [...q.options].sort(() => 0.5 - Math.random()) }));
                                    setQuestions(retryFinal);
                                    setGenerationNote("AI is now ready. Questions auto-updated.");
                                    toast.success("AI recovered. Questions auto-updated.");
                                }
                            } catch (retryError) {
                                console.error("AI retry failed for verification test:", retryError);
                            }
                        }, data.meta.retryAfterMs);
                    }
                } else {
                    const errorText = await res.text();
                    console.error("AI returned error:", errorText);
                    toast.error("AI Generation issue. Check logs.");
                }
            } catch (err) {
                console.error("AI API error, using mocks.", err);
                toast.error("AI connection failed. Using system fallback.");
            }

            if (fetchedQuestions.length < TARGET_QUESTION_COUNT) {
                fetchedQuestions = generateMockQuestions(flatTopics);
            }

            // FEATURE 9: Question shuffling
            const shuffled = fetchedQuestions.sort(() => 0.5 - Math.random()).slice(0, TARGET_QUESTION_COUNT);

            // Shuffle options for each
            const finalQuestions = shuffled.map(q => {
                const opts = [...q.options].sort(() => 0.5 - Math.random());
                return { ...q, options: opts };
            });

            setQuestions(finalQuestions);
            setStep("test");

            // FEATURE 6: Start fullscreen
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => { });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load test");
            onClose();
        }
    };

    // Render Canvas Question
    const renderCanvas = useCallback(() => {
        if (!canvasRef.current || questions.length === 0 || step !== "test") return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize
        canvas.width = canvas.parentElement?.clientWidth || 600;
        canvas.height = 120; // fixed height

        // Clear
        ctx.fillStyle = "#ffffff";
        if (document.documentElement.classList.contains("dark")) {
            ctx.fillStyle = "#0f172a";
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Watermark (FEATURE 10)
        ctx.font = "14px Arial";
        ctx.fillStyle = "rgba(100, 116, 139, 0.15)";
        ctx.textAlign = "center";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 12);
        ctx.fillText(`ALSA Verification - ${user?.name || "Student"} - ${new Date().toISOString().split('T')[0]}`, 0, 0);
        ctx.rotate(Math.PI / 12);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Text
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#f1f5f9" : "#1e293b";
        ctx.textAlign = "left";

        const text = `Q${currentQIndex + 1}. ${questions[currentQIndex].questionText}`;

        // Simple word wrap
        const words = text.split(" ");
        let line = "";
        let y = 40;
        const maxWidth = canvas.width - 40;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, 20, y);
                line = words[i] + " ";
                y += 25;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 20, y);

    }, [currentQIndex, questions, step, user?.name]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    const handleOptionSelect = (opt: string) => {
        setAnswers(prev => ({ ...prev, [currentQIndex]: opt }));
    };

    async function autoSubmitTest(reason: "normal" | "malpractice" = "normal") {
        if (hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;

        let calculatedScore = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) {
                calculatedScore += 1;
            }
        });

        // Pass threshold normalized to 10-point scale
        const normalizedScore = Number(((calculatedScore / Math.max(questions.length, 1)) * 10).toFixed(1));
        const isPass = reason !== "malpractice" && normalizedScore >= PASS_SCORE_OUT_OF_TEN;
        setPassed(isPass);
        setScore(normalizedScore);

        try {
            // Get current attempt number
            let currentAttemptNum = 1;
            let currentFailedAttempts = 0;
            if (accessDocId) {
                const snap = await getDocs(query(collection(db, "testAccessControl"), where("__name__", "==", accessDocId)));
                if (!snap.empty) {
                    currentFailedAttempts = snap.docs[0].data().failedAttempts || 0;
                    currentAttemptNum = currentFailedAttempts + 1;
                }
            }

            // Save to verificationResults collection
            if (user?.id) {
                await addDoc(collection(db, "verificationResults"), {
                    userId: user.id,
                    studentName: user.name || "Student",
                    registerNumber: user.registerNumber || user.registerNo || "N/A",
                    department: normalizeDepartment(user.department || "N/A"),
                    topicsVerified: flatTopics,
                    topicsByDomain: selectedTopics,
                    topicsKey: topicsKey,
                    score: normalizedScore,
                    rawScore: calculatedScore,
                    totalQuestions: questions.length,
                    malpracticeDetected: reason === "malpractice" || malpracticeDetected,
                    submissionReason: reason === "malpractice" ? "malpractice" : "normal",
                    passed: isPass,
                    attemptNumber: currentAttemptNum,
                    timestamp: serverTimestamp()
                });
            }
            // Track attempt limits
            if (!isPass) {
                if (accessDocId) {
                    const nextFailedAttempts = currentFailedAttempts + 1;
                    await updateDoc(doc(db, "testAccessControl", accessDocId), { 
                        failedAttempts: nextFailedAttempts,
                        status: nextFailedAttempts >= MAX_FAILED_ATTEMPTS ? "locked" : "allowed",
                        studentName: user?.name || "Student",
                        registerNumber: user?.registerNumber || user?.registerNo || "N/A",
                        department: user?.department || "N/A",
                        lastFailureReason: reason === "malpractice" ? "malpractice" : "score"
                    });
                } else if (user?.id) {const newDoc = await addDoc(collection(db, "testAccessControl"), {
                        userId: user?.id,
                        studentName: user?.name || "Student",
                        registerNumber: user?.registerNumber || user?.registerNo || "N/A",
                        department: user?.department || "N/A",
                        topicsKey,
                        topics: flatTopics,
                        failedAttempts: 1,
                        status: "allowed",
                        lastFailureReason: reason === "malpractice" ? "malpractice" : "score",
                        timestamp: serverTimestamp()
                    });
                    setAccessDocId(newDoc.id);
                }
            } else if (accessDocId) {
                // reset or ignore, could reset failedAttempts to 0
                await updateDoc(doc(db, "testAccessControl", accessDocId), { failedAttempts: 0, status: "allowed" });
            }
        } catch (e) {
            console.error("Failed to save result", e);
        }

        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
        setStep("result");
    }

    // Reset state on open
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (isOpen) {
            hasSubmittedRef.current = false;
            setStep("terms");
            setQuestions([]);
            setCurrentQIndex(0);
            setAnswers({});
            setTimeLeft(8 * 60);
            setWarnings(0);
            setScore(0);
            setPassed(false);
            setMalpracticeDetected(false);
            setUnlockReason("");
            setGenerationNote("");
            checkAccessControl();
        }
    }, [isOpen]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Timer Logic
    useEffect(() => {
        if (step !== "test") return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    autoSubmitTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [step]);

    // Anti-cheat: Tab visibility
    useEffect(() => {
        if (step !== "test") return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => {
                    const newWarnings = prev + 1;
                    if (newWarnings > 3) {
                        toast.error("Test Auto-submitted due to frequent tab switching.");
                        setMalpracticeDetected(true);
                        autoSubmitTest("malpractice");
                    } else {
                        toast.error(`Tab switching detected! Warning ${newWarnings}/3`);
                    }
                    return newWarnings;
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [step]);

    // Anti-cheat: Fullscreen monitor
    useEffect(() => {
        if (step !== "test") return;

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                toast.warning("Verification Test must be taken in fullscreen mode.");
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, [step]);

    // Anti-cheat: Context menu and copy/paste
    useEffect(() => {
        if (step !== "test") return;

        const preventContext = (e: MouseEvent) => e.preventDefault();
        const preventKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
                e.preventDefault();
            }
        };

        document.addEventListener("contextmenu", preventContext);
        document.addEventListener("keydown", preventKeys);

        return () => {
            document.removeEventListener("contextmenu", preventContext);
            document.removeEventListener("keydown", preventKeys);
        };
    }, [step]);


    const handleComplete = () => {
        // Find which domains these flatTopics belong to for the final output
        // If they pass, all selectedTopics become verified. If they fail, none do.
        if (passed) {
            onVerificationComplete(selectedTopics, score);
        } else {
            // Empty / or keep existing
            onVerificationComplete({}, score);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && step !== "test" && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Verification Test</DialogTitle>
                    <DialogDescription>Topic-based verification assessment.</DialogDescription>
                </DialogHeader>
                {attemptStatus === "pending_approval" && (
                    <div className="py-12 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                            <Clock className="h-8 w-8 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Request Pending Approval</h2>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Your faculty member is currently reviewing your unlock request. Please wait until they approve it.
                        </p>
                        <Button onClick={onClose} className="mt-4 bg-slate-800 dark:bg-slate-200 text-white dark:text-black">
                            Return to Dashboard
                        </Button>
                    </div>
                )}

                {attemptStatus === "locked" && (
                    <div className="py-10 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Lock className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Maximum Attempts Reached</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            You have reached {MAX_FAILED_ATTEMPTS} failed attempts. To take the test again, explain your reason and request faculty approval.
                        </p>
                        
                        <div className="max-w-sm mx-auto text-left space-y-2 pt-4">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Faculty to Request</label>
                            <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a faculty member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {faculties.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="max-w-sm mx-auto text-left space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Reason for extra attempt</label>
                            <Textarea
                                value={unlockReason}
                                onChange={(e) => setUnlockReason(e.target.value)}
                                placeholder="Explain why you need another attempt..."
                                className="min-h-[96px]"
                            />
                        </div>
                        
                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleRequestUnlock} disabled={isRequesting || !selectedFacultyId || unlockReason.trim().length < 10} className="bg-red-600 hover:bg-red-700 text-white">
                                {isRequesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                                Request Unlock Permission
                            </Button>
                        </div>
                    </div>
                )}

                {attemptStatus === "allowed" && step === "terms" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                                <ShieldAlert className="h-6 w-6 text-indigo-600" />
                                Verification Test Rules
                            </DialogTitle>
                            <DialogDescription className="text-base pt-4">
                                To validate your self-reported topic completion, you must pass a short verification test.
                                Only verified topics will contribute to your Placement Readiness Index (PRI).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800">
                            <ul className="space-y-3 font-medium text-slate-700 dark:text-slate-300">
                                <li className="flex items-center gap-3"><Maximize className="h-5 w-5 text-slate-400" /> Test must be taken in fullscreen</li>
                                <li className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-slate-400" /> Do not switch tabs (Max 3 warnings)</li>
                                <li className="flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-slate-400" /> Copy/paste & Context menus are disabled</li>
                                <li className="flex items-center gap-3"><Clock className="h-5 w-5 text-slate-400" /> Timer: 8 minutes for {TARGET_QUESTION_COUNT} questions</li>
                                <li className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400"><ShieldAlert className="h-5 w-5" /> Passing criteria: {PASS_SCORE_OUT_OF_TEN} / 10</li>
                                <li className="flex items-center gap-3 text-amber-600 dark:text-amber-400"><Lock className="h-5 w-5" /> Maximum failed attempts allowed: {MAX_FAILED_ATTEMPTS}</li>
                                <li className="flex items-center gap-3"><UserCheck className="h-5 w-5 text-slate-400" /> After {MAX_FAILED_ATTEMPTS} failed attempts, you must submit a reason and request faculty approval for unlock</li>
                                <li className="flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-slate-400" /> Malpractice or auto-submit due to violations counts as a failed attempt</li>
                            </ul>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={loadQuestions} className="bg-indigo-600 hover:bg-indigo-700">Accept & Start Test</Button>
                        </DialogFooter>
                    </>
                )}

                {step === "loading" && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <h3 className="text-lg font-bold">Generating secure test...</h3>
                        {generationNote ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center max-w-md">{generationNote}</p>
                        ) : null}
                    </div>
                )}

                {step === "test" && questions.length > 0 && (
                    <div className="space-y-6 animate-in fade-in">
                        {generationNote ? (
                            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                                {generationNote}
                            </div>
                        ) : null}
                        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="font-bold text-slate-600 dark:text-slate-400">
                                Question {currentQIndex + 1} of {questions.length}
                            </div>
                            <div className="flex items-center gap-4">
                                {warnings > 0 && <span className="text-red-500 font-black text-sm animate-pulse">Warnings: {warnings}/3</span>}
                                <div className={`font-black flex items-center gap-2 ${timeLeft < 60 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    <Clock className="h-5 w-5" />
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>

                        {/* CANVAS QUESTION TO PREVENT COPYING */}
                        <div className="rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm relative pointer-events-none">
                            <canvas ref={canvasRef} className="w-full bg-white dark:bg-slate-900" />
                            {/* An invisible overlay just to capture clicks and prevent selection */}
                            <div className="absolute inset-0 z-10 select-none"></div>
                        </div>

                        <div className="space-y-3 pt-4">
                            {questions[currentQIndex].options.map((opt, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleOptionSelect(opt)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQIndex] === opt
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQIndex] === opt ? 'border-indigo-600' : 'border-slate-400'}`}>
                                            {answers[currentQIndex] === opt && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                        </div>
                                        <span className="font-medium text-slate-800 dark:text-slate-200 select-none">{opt}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQIndex(p => Math.max(0, p - 1))}
                                disabled={currentQIndex === 0}
                            >
                                Previous
                            </Button>
                            {currentQIndex === questions.length - 1 ? (
                                <Button onClick={() => autoSubmitTest("normal")} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    Submit Test
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setCurrentQIndex(p => p + 1)}
                                    className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800"
                                >
                                    Next
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === "result" && (
                    <div className="text-center py-10 space-y-6">
                        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{score.toFixed(1)}/10</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                                {passed ? "Verification Passed!" : "Verification Failed"}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                {passed
                                    ? "Your selected topics have been verified and added to your PRI calculation."
                                    : malpracticeDetected
                                        ? "Test closed due to malpractice behavior. This attempt is counted as failed."
                                        : "You did not meet the 5/10 passing score. Unverified topics do not contribute to your PRI."}
                            </p>
                        </div>
                        <Button onClick={handleComplete} className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto mt-4 px-10">
                            Return to Dashboard
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Helper to generate mock questions if DB is empty
function generateMockQuestions(topics: string[]) {
    const sourceTopics = topics.length > 0
        ? Array.from(new Set(topics.map((topic) => String(topic || "").trim()).filter(Boolean)))
        : ["General Academic Concepts"];
    const plan: Array<"easy" | "medium" | "hard"> = [
        "easy", "easy", "easy", "easy", "easy", "easy",
        "medium", "medium", "medium",
        "hard"
    ];

    return plan.map((difficulty, idx) => {
        const topic = sourceTopics[idx % sourceTopics.length];
        if (difficulty === "easy") {
            const correct = `Understanding the core principle behind ${topic}`;
            return {
                id: `mock-${idx}`,
                topic,
                questionText: `A learner claims ${topic} is useful only for exams. What best explains its real value?`,
                options: [
                    correct,
                    "Memorizing keywords without using them",
                    "Ignoring problem constraints in implementation",
                    "Treating all systems as identical"
                ],
                correctAnswer: correct,
                difficulty
            };
        }
        if (difficulty === "medium") {
            const correct = `Choose an approach where ${topic} aligns with the problem constraints`;
            return {
                id: `mock-${idx}`,
                topic,
                questionText: `When applying ${topic}, what decision most improves solution reliability?`,
                options: [
                    correct,
                    "Pick whichever method has the shortest name",
                    "Avoid validating assumptions",
                    "Prefer random trial-and-error over analysis"
                ],
                correctAnswer: correct,
                difficulty
            };
        }
        const correct = `Re-check whether assumptions in ${topic} still hold under real conditions`;
        return {
            id: `mock-${idx}`,
            topic,
            questionText: `A system using ${topic} fails in production despite passing tests. What is the best first step?`,
            options: [
                correct,
                "Rewrite every module before analysis",
                "Disable diagnostics to reduce noise",
                "Ignore edge cases seen in live data"
            ],
            correctAnswer: correct,
            difficulty
        };
    });
}


