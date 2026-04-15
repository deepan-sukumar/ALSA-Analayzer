import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ROLE_SKILL_MATRIX, PlacementRole } from '@/lib/core/role-skills';

type DrawbackItem = { drawback: string; suggestion: string };
type RoadmapItem = { week: string; priority: string; focus: string; tasks: string[] };

function parseStructuredJson(raw: string): any {
    const cleaned = String(raw || "")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    if (!cleaned) return {};
    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start >= 0 && end > start) {
            const sliced = cleaned.slice(start, end + 1);
            return JSON.parse(sliced);
        }
        return {};
    }
}

function roundTo(value: number, digits = 2) {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function summarizeSemesterPerformance(student: any) {
    const records = Array.isArray(student?.academicRecords)
        ? [...student.academicRecords]
            .map((record) => ({
                semester: Number(record?.semester || 0),
                sgpa: Number(record?.sgpa || 0),
                arrears: Number(record?.arrears || 0),
            }))
            .filter((record) => record.semester > 0 && record.sgpa > 0)
            .sort((a, b) => a.semester - b.semester)
        : [];

    const sgpas = records.map((record) => record.sgpa);
    const count = sgpas.length;
    const averageSgpa = count > 0 ? sgpas.reduce((sum, value) => sum + value, 0) / count : 0;
    const minSgpa = count > 0 ? Math.min(...sgpas) : 0;
    const maxSgpa = count > 0 ? Math.max(...sgpas) : 0;
    const worstSemester = count > 0 ? records.reduce((worst, record) => (record.sgpa < worst.sgpa ? record : worst), records[0]) : null;
    const bestSemester = count > 0 ? records.reduce((best, record) => (record.sgpa > best.sgpa ? record : best), records[0]) : null;
    const totalSemesterArrears = records.reduce((sum, record) => sum + (record.arrears || 0), 0);
    const standingArrears = Number(student?.standingArrears ?? student?.arrears ?? 0);
    const latest = count > 0 ? records[count - 1] : null;
    const previous = count > 1 ? records[count - 2] : null;
    const first = count > 0 ? records[0] : null;
    const latestDelta = latest && previous ? latest.sgpa - previous.sgpa : 0;
    const overallDelta = latest && first ? latest.sgpa - first.sgpa : 0;
    const range = count > 0 ? maxSgpa - minSgpa : 0;
    const lowSemesters = records.filter((record) => record.sgpa < 7);
    const criticalSemesters = records.filter((record) => record.sgpa < 6.5);
    const strongSemesters = records.filter((record) => record.sgpa >= 8.5);
    const variance = count > 0
        ? sgpas.reduce((sum, value) => sum + ((value - averageSgpa) ** 2), 0) / count
        : 0;
    const stdDeviation = Math.sqrt(variance);
    const trendLabel = latestDelta >= 0.35
        ? "improving"
        : latestDelta <= -0.35
            ? "declining"
            : "stable";

    return {
        records,
        count,
        averageSgpa: roundTo(averageSgpa),
        minSgpa: roundTo(minSgpa),
        maxSgpa: roundTo(maxSgpa),
        range: roundTo(range),
        stdDeviation: roundTo(stdDeviation),
        standingArrears,
        totalSemesterArrears,
        latest,
        previous,
        first,
        latestDelta: roundTo(latestDelta),
        overallDelta: roundTo(overallDelta),
        lowSemesters,
        criticalSemesters,
        strongSemesters,
        worstSemester,
        bestSemester,
        trendLabel,
    };
}

function generateAcademicDrawbacks(student: any): DrawbackItem[] {
    const summary = summarizeSemesterPerformance(student);
    const drawbacks: DrawbackItem[] = [];
    const cgpa = Number(student?.cgpa || 0);

    if (summary.standingArrears > 0) {
        drawbacks.push({
            drawback: `Standing arrears are still active (${summary.standingArrears}) and can block eligibility despite semester progress.`,
            suggestion: `Prioritize clearance of ${summary.standingArrears} backlog${summary.standingArrears > 1 ? "s" : ""}; create a subject-wise revision plan with one weekly mock test for each pending paper.`,
        });
    }

    if (summary.criticalSemesters.length > 0) {
        const semList = summary.criticalSemesters.map((record) => `Sem ${record.semester} (${record.sgpa.toFixed(2)})`).join(", ");
        drawbacks.push({
            drawback: `Low-scoring semesters detected: ${semList}. These semesters pull down the overall academic profile.`,
            suggestion: `Review the subjects from these semesters first, rebuild weak units chapter-by-chapter, and target 0.75 to 1.00 SGPA improvement in the next result cycle.`,
        });
    }

    if (summary.count >= 3 && summary.stdDeviation >= 0.75) {
        drawbacks.push({
            drawback: `Semester performance is inconsistent (SGPA spread ${summary.minSgpa.toFixed(2)} to ${summary.maxSgpa.toFixed(2)}), which suggests unstable preparation quality.`,
            suggestion: `Follow a fixed weekly study pattern, increase revision before internals, and track subject-wise marks so each semester stays within a narrower performance band.`,
        });
    }

    if (summary.count >= 2 && summary.latestDelta <= -0.4 && summary.latest) {
        drawbacks.push({
            drawback: `Recent semester momentum dropped in Sem ${summary.latest.semester} by ${Math.abs(summary.latestDelta).toFixed(2)} SGPA compared with the previous semester.`,
            suggestion: `Analyze what changed in workload, attendance, or difficult subjects during the latest semester and correct it early with a weekly recovery target.`,
        });
    }

    if (summary.count >= 3 && summary.overallDelta > 0.6 && summary.first && summary.latest) {
        drawbacks.push({
            drawback: `Early-semester foundations were weaker than current performance, which may leave hidden concept gaps from Sem ${summary.first.semester}.`,
            suggestion: `Use your current momentum to revisit first-year and second-year fundamentals so strong recent grades are supported by equally strong basics.`,
        });
    }

    if (cgpa > 0 && cgpa < 7.5 && summary.standingArrears === 0) {
        drawbacks.push({
            drawback: `CGPA is currently ${cgpa.toFixed(2)}, so there is still room to move from average to strong academic standing.`,
            suggestion: `Set a near-term CGPA milestone of ${Math.min(9.5, cgpa + 0.5).toFixed(2)} by targeting higher-credit subjects and improving exam-writing precision.`,
        });
    }

    if (drawbacks.length === 0) {
        const anchorSem = summary.bestSemester?.semester ?? summary.latest?.semester ?? "recent";
        drawbacks.push({
            drawback: `No severe academic weakness is visible, but high performers can still face a plateau if the current level is only maintained and not stretched further.`,
            suggestion: `Use Sem ${anchorSem} as your benchmark and aim to convert good scores into excellent scores through advanced problem practice, faster revision cycles, and subject-wise score tracking.`,
        });
        drawbacks.push({
            drawback: `Strong grades alone may hide small topic-level gaps that appear later in placements, projects, or higher-semester theory papers.`,
            suggestion: `After each semester, list 2-3 difficult units, close them with short concept reviews, and pair academic preparation with one applied project or certification.`,
        });
    }

    return drawbacks.slice(0, 6);
}

function generateAcademicRoadmap(student: any): RoadmapItem[] {
    const summary = summarizeSemesterPerformance(student);
    const cgpa = Number(student?.cgpa || 0);
    const weakestArea = summary.standingArrears > 0
        ? "Backlog Clearance"
        : summary.criticalSemesters.length > 0
            ? "Low Semester Recovery"
            : summary.latestDelta <= -0.4
                ? "Recent Decline Control"
                : summary.stdDeviation >= 0.75
                    ? "Consistency Improvement"
                    : "Academic Excellence Upgrade";

    const firstFocusTasks = summary.standingArrears > 0
        ? [
            "List each active arrear with exam date, syllabus weightage, and scoring units.",
            "Spend the first 90 minutes of study time on backlog subjects before regular semester work.",
            "Solve previous university questions for every pending subject at least twice.",
        ]
        : summary.criticalSemesters.length > 0
            ? [
                `Revisit weak semesters first: ${summary.criticalSemesters.map((record) => `Sem ${record.semester}`).join(", ")}.`,
                "Identify 3 lowest-scoring units and rebuild them using notes, PYQs, and short daily revision.",
                "Meet a faculty mentor or topper to validate whether your study method is the main issue.",
            ]
            : [
                "Review the full semester trend and mark subjects where marks dipped more than expected.",
                "Set one numeric target for the next semester: SGPA, CGPA, and internal assessment goal.",
                "Create a weekly timetable with separate slots for concept learning, revision, and test practice.",
            ];

    const secondFocusTasks = summary.stdDeviation >= 0.75 || summary.latestDelta < 0
        ? [
            "Start a weekly subject tracker and mark red/yellow/green topics after every class.",
            "Attempt one timed mock test or past paper every week to improve consistency under exam pressure.",
            "Reduce last-minute preparation by finishing one revision cycle before internals begin.",
        ]
        : [
            "Push one tier higher in every major subject by solving higher-difficulty problems and previous papers.",
            "Build short formula or concept sheets so revision becomes faster and more repeatable.",
            "Use faculty feedback from assignments and internals to remove avoidable mistakes.",
        ];

    const finalFocusTasks = cgpa >= 8
        ? [
            "Convert strong academics into profile value through a mini project, paper, certification, or seminar output.",
            "Maintain SGPA discipline by protecting attendance, internals, and end-semester revision rhythm.",
            "Prepare a reflection note after results so each semester teaches one repeatable success habit.",
        ]
        : [
            `Target a CGPA climb from ${cgpa.toFixed(2) || "current level"} to ${Math.min(9.5, (cgpa || summary.averageSgpa) + 0.5).toFixed(2)} over the next result cycle.`,
            "Protect high-credit subjects first, because they move CGPA faster than low-credit recovery alone.",
            "Keep one fixed weekly review to compare planned study hours versus actual study hours.",
        ];

    return [
        {
            week: "Week 1-2",
            priority: summary.standingArrears > 0 || summary.criticalSemesters.length > 0 ? "Critical" : "High",
            focus: weakestArea,
            tasks: firstFocusTasks,
        },
        {
            week: "Week 3-4",
            priority: summary.latestDelta < 0 || summary.stdDeviation >= 0.75 ? "High" : "Moderate",
            focus: summary.latestDelta < 0 ? "Performance Stabilization" : "Consistency and Score Conversion",
            tasks: secondFocusTasks,
        },
        {
            week: "Week 5-6",
            priority: "Moderate",
            focus: cgpa >= 8 ? "Sustain and Elevate Strong Performance" : "CGPA Upgrade Strategy",
            tasks: finalFocusTasks,
        },
    ];
}

function generateFallbackRecommendations(student: any, context: string) {
    const drawbacks: DrawbackItem[] = [];
    const roadmap: RoadmapItem[] = [];

    const cgpa = parseFloat(student.cgpa) || 0;
    const standingArrears = parseInt(String(student.standingArrears ?? student.arrears ?? 0), 10);
    const aptitudeScore = student.placementMetrics?.aptitudeScore || 0;
    const codingScore = student.placementMetrics?.codingScore || 0;
    const commScore = student.placementMetrics?.communicationScore || 0;

    const selectedTopics = student.coreAcademicTopics || {};
    const verifiedTopics = student.verifiedCoreTopics || {};
    let pendingCount = 0;
    const pendingList: string[] = [];
    Object.keys(selectedTopics).forEach((k) => {
        const sel = selectedTopics[k] || [];
        const ver = verifiedTopics[k] || [];
        const pending = sel.filter((t: string) => !ver.includes(t));
        pendingCount += pending.length;
        if (pending.length > 0) pendingList.push(`${k}: ${pending.join(', ')}`);
    });

    const roleTrack = student.roleTrackProfile?.trackSelected || student.outcomeAlignment?.role?.trackSelected || student.outcomeAlignment?.trackSelected;
    const verifiedRoleSkills = student.verifiedRoleConcepts || { core: [], intermediate: [], advanced: [] };
    let missingRoleSkills: string[] = [];
    if (roleTrack && ROLE_SKILL_MATRIX[roleTrack as PlacementRole]) {
        const matrix = ROLE_SKILL_MATRIX[roleTrack as PlacementRole];
        const mCore = matrix.core.filter(s => !verifiedRoleSkills.core?.includes(s));
        const mInter = matrix.intermediate.filter(s => !verifiedRoleSkills.intermediate?.includes(s));
        const mAdv = matrix.advanced.filter(s => !verifiedRoleSkills.advanced?.includes(s));
        missingRoleSkills = [...mCore, ...mInter, ...mAdv];
    }

    const addTaskToRoadmap = (weekLabel: string, priority: string, focus: string, newTasks: string[]) => {
        const existing = roadmap.find(r => r.week === weekLabel);
        if (existing) {
            existing.tasks = [...new Set([...existing.tasks, ...newTasks])].slice(0, 4);
            if (priority === "Critical" || (priority === "High" && existing.priority !== "Critical")) {
                existing.priority = priority;
            }
        } else {
            roadmap.push({ week: weekLabel, priority, focus, tasks: newTasks });
        }
    };

    if (context === "academic") {
        return {
            drawbacks: generateAcademicDrawbacks(student),
            roadmap: generateAcademicRoadmap(student),
        };
    }

    if (pendingCount > 0) {
        drawbacks.push({ drawback: `Unverified Core Topics (${pendingCount} pending)`, suggestion: `Complete verification tests for: ${pendingList.join(' | ')}.` });
        addTaskToRoadmap("Week 1-2", "Critical", "Core Domain Clearance", [`Review pending topics: ${pendingList.slice(0, 2).join(', ')}`, "Attempt AI verification tests"]);
    }

    if (missingRoleSkills.length > 0 && (context === "outcome" || context === "overall")) {
        drawbacks.push({ drawback: `Role Alignment Gaps (${roleTrack})`, suggestion: `Master missing skills: ${missingRoleSkills.slice(0, 5).join(', ')}.` });
        addTaskToRoadmap("Week 1-2", "High", `${roleTrack} Competency`, [`Master core skills: ${missingRoleSkills.slice(0, 3).join(', ')}`, "Review interview questions"]);
    }

    if (context === "academic" || context === "overall") {
        if (standingArrears > 0) {
            drawbacks.push({ drawback: `Active Arrears (${standingArrears})`, suggestion: `Focus on clearing pending subjects first.` });
            addTaskToRoadmap("Week 3-4", "Critical", "Arrear Clearance", ["Gather past papers", "Dedicate specific study hours"]);
        }
        if (cgpa > 0 && cgpa < 6.5) {
            drawbacks.push({ drawback: `Low CGPA (${cgpa})`, suggestion: `Aim for higher grades in upcoming semesters.` });
            addTaskToRoadmap("Week 1-2", "High", "Academic Revival", ["Seek faculty guidance", "Practice university questions"]);
        }
    }

    if (context === "outcome" || context === "overall") {
        if (codingScore < 60) {
            drawbacks.push({ drawback: `Weak Coding (${codingScore}%)`, suggestion: `Solve 2 DSA problems daily.` });
            addTaskToRoadmap("Week 3-4", "High", "DSA Logic", ["Practice on LeetCode daily", "Master Arrays & Strings"]);
        }
        if (aptitudeScore < 60) {
            drawbacks.push({ drawback: `Low Aptitude (${aptitudeScore}%)`, suggestion: `Practice quantitative math daily.` });
            addTaskToRoadmap("Week 5-6", "Moderate", "Quantitative Reasoning", ["Take timed mock tests", "Practice quant daily"]);
        }
    }

    const weekMap: any = { "Week 1-2": 1, "Week 3-4": 2, "Week 5-6": 3 };
    const finalRoadmap = ["Week 1-2", "Week 3-4", "Week 5-6"].map(w => {
        const found = roadmap.find(r => r.week === w);
        return found || { week: w, priority: "Standard", focus: "Skills Refinement", tasks: ["Focus on core concepts", "Review technical documentation"] };
    });

    return { drawbacks: drawbacks.slice(0, 8), roadmap: finalRoadmap };
}

function mergeAndEnsureCoverage(aiResult: any, student: any, context: string) {
    const aiDrawbacks = Array.isArray(aiResult?.drawbacks) ? aiResult.drawbacks : [];
    const aiRoadmap = Array.isArray(aiResult?.roadmap) ? aiResult.roadmap : [];
    const mandatory = generateFallbackRecommendations(student, context);

    const mergedDrawbacks = [...aiDrawbacks];
    const existing = new Set(mergedDrawbacks.map((d: any) => String(d?.drawback || "").toLowerCase().trim()));

    for (const item of mandatory.drawbacks) {
        const key = String(item.drawback || "").toLowerCase().trim();
        if (key && !existing.has(key)) {
            mergedDrawbacks.push(item);
            existing.add(key);
        }
    }

    const finalRoadmap = aiRoadmap.length > 0
        ? aiRoadmap.map((item: any, index: number) => ({
            ...mandatory.roadmap[index],
            ...item,
            tasks: Array.isArray(item?.tasks) && item.tasks.length > 0 ? item.tasks : mandatory.roadmap[index]?.tasks || [],
        }))
        : mandatory.roadmap;

    return {
        drawbacks: mergedDrawbacks.slice(0, Math.max(3, mandatory.drawbacks.length)),
        roadmap: finalRoadmap.slice(0, 3),
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { student, context = "overall" } = body;

        if (!student) return NextResponse.json({ error: "Student data required" }, { status: 400 });

        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!geminiKey) {
            const result = generateFallbackRecommendations(student, context);
            return NextResponse.json(result);
        }

        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const cgpa = student.cgpa || "N/A";
        const roleTrack = student.roleTrackProfile?.trackSelected || student.outcomeAlignment?.trackSelected || "Not Selected";

        const selectedTopics = student.coreAcademicTopics || {};
        const verifiedTopics = student.verifiedCoreTopics || {};
        const incompleteList: string[] = [];
        Object.keys(selectedTopics).forEach((subject) => {
            const pending = (selectedTopics[subject] || []).filter((t: string) => !(verifiedTopics[subject] || []).includes(t));
            if (pending.length > 0) incompleteList.push(`${subject}: ${pending.join(', ')}`);
        });
        const semesterSummary = summarizeSemesterPerformance(student);
        const semesterTrend = semesterSummary.records.length > 0
            ? semesterSummary.records.map((record) => `Sem ${record.semester}: SGPA ${record.sgpa.toFixed(2)}${record.arrears ? `, arrears ${record.arrears}` : ""}`).join(" | ")
            : "No semester records available";

        const prompt = `Analyze this student profile for context: ${context}.
        CGPA: ${cgpa}, Arrears: ${student.standingArrears || 0}, Role: ${roleTrack}.
        Scores: Aptitude ${student.placementMetrics?.aptitudeScore || 0}%, Coding ${student.placementMetrics?.codingScore || 0}%, Comm ${student.placementMetrics?.communicationScore || 0}%.
        Semester records: ${semesterTrend}.
        Academic trend summary: Avg SGPA ${semesterSummary.averageSgpa}, Range ${semesterSummary.range}, Latest delta ${semesterSummary.latestDelta}, Trend ${semesterSummary.trendLabel}.
        Incomplete Topics: ${incompleteList.join(' | ') || "None"}.
        Identify 4-8 weaknesses/faults and a 6-week roadmap (3 phases: Week 1-2, Week 3-4, Week 5-6).
        For academic context, base the drawbacks on semester-score patterns, consistency, improvements, dips, and arrears.
        Even when the student is performing well, include at least 2 constructive growth opportunities instead of returning "no drawbacks".
        Return purely JSON with "drawbacks" (drawback, suggestion) and "roadmap" (week, priority: Critical/High/Moderate/Standard, focus, tasks: string[]).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        drawbacks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    drawback: { type: Type.STRING },
                                    suggestion: { type: Type.STRING }
                                },
                                required: ["drawback", "suggestion"]
                            }
                        },
                        roadmap: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    week: { type: Type.STRING },
                                    priority: { type: Type.STRING },
                                    focus: { type: Type.STRING },
                                    tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["week", "priority", "focus", "tasks"]
                            }
                        }
                    },
                    required: ["drawbacks", "roadmap"]
                }
            }
        });

        const result = parseStructuredJson(response.text || "{}");
        const merged = mergeAndEnsureCoverage(result, student, context);

        return NextResponse.json(merged);
    } catch (error) {
        console.error("AI recommendations failure:", error);
        return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }
}

