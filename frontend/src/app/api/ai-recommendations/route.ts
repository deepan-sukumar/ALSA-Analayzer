import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ROLE_SKILL_MATRIX, PlacementRole } from '@/lib/role-skills';

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

function generateFallbackRecommendations(student: any, context: string) {
    const drawbacks: any[] = [];
    const roadmap: { week: string; priority: string; focus: string; tasks: string[] }[] = [];

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

    const finalRoadmap = aiRoadmap.length > 0 ? aiRoadmap : mandatory.roadmap;
    return { drawbacks: mergedDrawbacks.slice(0, 8), roadmap: finalRoadmap.slice(0, 3) };
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

        const prompt = `Analyze this student profile for context: ${context}.
        CGPA: ${cgpa}, Arrears: ${student.standingArrears || 0}, Role: ${roleTrack}.
        Scores: Aptitude ${student.placementMetrics?.aptitudeScore || 0}%, Coding ${student.placementMetrics?.codingScore || 0}%, Comm ${student.placementMetrics?.communicationScore || 0}%.
        Incomplete Topics: ${incompleteList.join(' | ') || "None"}.
        Identify 4-8 weaknesses/faults and a 6-week roadmap (3 phases: Week 1-2, Week 3-4, Week 5-6).
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
