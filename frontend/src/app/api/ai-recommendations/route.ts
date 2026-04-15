import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ROLE_SKILL_MATRIX, PlacementRole } from '@/lib/core/role-skills';
import { getPlacementReadiness } from '@/lib/calculations/placement-calculations';
import { analyzeClassPerformance } from '@/lib/faculty/faculty-insights';

type DrawbackItem = { drawback: string; suggestion: string };
type RoadmapItem = { week: string; priority: string; focus: string; tasks: string[] };
const GENERIC_ACADEMIC_PHRASES = [
    "no critical drawbacks found",
    "your academic profile looks strong",
    "no recovery plan needed",
    "your academic profile is on track",
    "skills refinement",
    "focus on core concepts",
    "review technical documentation",
];
const GENERIC_OUTCOME_PHRASES = [
    "skills refinement",
    "focus on core concepts",
    "review technical documentation",
    "no significant drawbacks detected",
    "profile is perfectly optimized",
    "general review",
];

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

function getOutcomeVerificationSummary(student: any) {
    const selectedCoreTopics = student?.outcomeAlignment?.coreTopics || student?.coreAcademicTopics || {};
    const verifiedCoreTopics = student?.verifiedCoreTopics || {};
    const selectedRoleConcepts = student?.outcomeAlignment?.role?.concepts || { core: [], intermediate: [], advanced: [] };
    const verifiedRoleConcepts = student?.verifiedRoleConcepts || { core: [], intermediate: [], advanced: [] };

    const unverifiedCoreByDomain: Record<string, string[]> = {};
    const verifiedCoreCount = Object.values(verifiedCoreTopics).reduce((sum: number, topics: any) => {
        return sum + (Array.isArray(topics) ? topics.length : 0);
    }, 0);

    Object.entries(selectedCoreTopics).forEach(([domain, topics]) => {
        const selected = Array.isArray(topics) ? topics : [];
        const verified = Array.isArray((verifiedCoreTopics as any)[domain]) ? (verifiedCoreTopics as any)[domain] : [];
        const pending = selected.filter((topic: string) => !verified.includes(topic));
        if (pending.length > 0) {
            unverifiedCoreByDomain[domain] = pending;
        }
    });

    const unverifiedRoleConcepts = {
        core: (selectedRoleConcepts.core || []).filter((topic: string) => !(verifiedRoleConcepts.core || []).includes(topic)),
        intermediate: (selectedRoleConcepts.intermediate || []).filter((topic: string) => !(verifiedRoleConcepts.intermediate || []).includes(topic)),
        advanced: (selectedRoleConcepts.advanced || []).filter((topic: string) => !(verifiedRoleConcepts.advanced || []).includes(topic)),
    };

    const selectedRoleCount =
        (selectedRoleConcepts.core || []).length +
        (selectedRoleConcepts.intermediate || []).length +
        (selectedRoleConcepts.advanced || []).length;
    const verifiedRoleCount =
        (verifiedRoleConcepts.core || []).length +
        (verifiedRoleConcepts.intermediate || []).length +
        (verifiedRoleConcepts.advanced || []).length;

    return {
        selectedTrack: student?.roleTrackProfile?.trackSelected || student?.outcomeAlignment?.role?.trackSelected || student?.outcomeAlignment?.trackSelected || "",
        selectedCoreTopics,
        verifiedCoreTopics,
        unverifiedCoreByDomain,
        selectedRoleConcepts,
        verifiedRoleConcepts,
        unverifiedRoleConcepts,
        verifiedCoreCount,
        verifiedRoleCount,
        selectedRoleCount,
        failedVerifications: Number(student?.failedVerifications || 0),
        verificationScore: Number(student?.verificationScore || 0),
    };
}

function hasOutcomeRecommendationData(student: any) {
    return Boolean(student);
}

function generateOutcomeDrawbacks(student: any): DrawbackItem[] {
    const readiness = getPlacementReadiness(student);
    const gaps = readiness.performanceGaps || [];
    const outcome = getOutcomeVerificationSummary(student);
    const drawbacks: DrawbackItem[] = [];

    Object.entries(outcome.unverifiedCoreByDomain).forEach(([domain, topics]) => {
        drawbacks.push({
            drawback: `${domain} still has ${topics.length} selected topic${topics.length > 1 ? "s" : ""} not yet verified.`,
            suggestion: `Take the verification test again for ${domain} and focus first on ${topics.slice(0, 3).join(", ")}.`,
        });
    });

    if (outcome.unverifiedRoleConcepts.core.length > 0 || outcome.unverifiedRoleConcepts.intermediate.length > 0 || outcome.unverifiedRoleConcepts.advanced.length > 0) {
        const totalPendingRole =
            outcome.unverifiedRoleConcepts.core.length +
            outcome.unverifiedRoleConcepts.intermediate.length +
            outcome.unverifiedRoleConcepts.advanced.length;

        drawbacks.push({
            drawback: `${totalPendingRole} role-aligned concept${totalPendingRole > 1 ? "s remain" : " remains"} selected but not yet verified for your chosen track.`,
            suggestion: `Reattempt role verification by clearing ${(outcome.unverifiedRoleConcepts.core[0] || outcome.unverifiedRoleConcepts.intermediate[0] || outcome.unverifiedRoleConcepts.advanced[0] || "the pending concepts")} first, then move to the remaining unverified concepts.`,
        });
    }

    if (outcome.failedVerifications > 0) {
        drawbacks.push({
            drawback: `You have ${outcome.failedVerifications} failed verification attempt${outcome.failedVerifications > 1 ? "s" : ""}, which suggests conceptual preparation is still incomplete.`,
            suggestion: "Before retaking the test, revise the failed topics in small blocks, solve examples, and attempt a short self-check before the next verification.",
        });
    }

    if (gaps.length === 0 && drawbacks.length === 0) {
        return [
            {
                drawback: "Your readiness profile is strong, but premium companies will still expect sharper execution in mock interviews, timed coding, and project storytelling.",
                suggestion: "Move from basic preparation to advanced preparation by practicing company-style mock rounds and refining your best project for deep technical discussion.",
            },
            {
                drawback: "A strong score can still hide a conversion gap between preparation and interview performance.",
                suggestion: "Use weekly timed assessments for coding, aptitude, and communication so your readiness remains interview-ready rather than theory-only.",
            },
        ];
    }

    const performanceGapDrawbacks = gaps.slice(0, 6).map((gap) => ({
        drawback: `${gap.domain} is at ${gap.coverage}% coverage. ${gap.problem}`,
        suggestion: gap.actionPlan.slice(0, 2).join(" "),
    }));

    const merged = [...drawbacks];
    const seen = new Set(merged.map((item) => normalizeText(item.drawback)));
    for (const item of performanceGapDrawbacks) {
        const key = normalizeText(item.drawback);
        if (!seen.has(key)) {
            merged.push(item);
            seen.add(key);
        }
    }

    return merged.slice(0, 6);
}

function generateOutcomeRoadmap(student: any): RoadmapItem[] {
    const readiness = getPlacementReadiness(student);
    const gaps = readiness.performanceGaps || [];
    const outcome = getOutcomeVerificationSummary(student);
    const highGaps = gaps.filter((gap) => gap.riskLevel === "High");
    const moderateGaps = gaps.filter((gap) => gap.riskLevel === "Moderate");
    const primaryGap = highGaps[0] || moderateGaps[0] || gaps[0];
    const secondaryGap = highGaps[1] || moderateGaps[1] || gaps[1];
    const pendingCoreDomain = Object.keys(outcome.unverifiedCoreByDomain)[0];
    const pendingCoreTopics = pendingCoreDomain ? outcome.unverifiedCoreByDomain[pendingCoreDomain] : [];
    const pendingRoleTopic = outcome.unverifiedRoleConcepts.core[0] || outcome.unverifiedRoleConcepts.intermediate[0] || outcome.unverifiedRoleConcepts.advanced[0];

    if (gaps.length === 0) {
        return [
            {
                week: "Week 1-2",
                priority: "High",
                focus: pendingCoreDomain ? `${pendingCoreDomain} Verification Recovery` : "Outcome Verification Recovery",
                tasks: [
                    pendingCoreTopics.length > 0
                        ? `Revise the still-unverified ${pendingCoreDomain} topics first: ${pendingCoreTopics.slice(0, 3).join(", ")}.`
                        : "Review the selected but still-unverified outcome topics from your last test.",
                    pendingRoleTopic
                        ? `Retake role preparation by clearing ${pendingRoleTopic} and the remaining unverified track concepts.`
                        : "Strengthen role-track concepts that were selected but not yet verified.",
                    "Attempt the next verification only after finishing one focused revision cycle.",
                ],
            },
            {
                week: "Week 3-4",
                priority: "Moderate",
                focus: "Coverage Expansion",
                tasks: [
                    "Convert unverified topics into verified coverage domain by domain.",
                    "Track which topics were selected, verified, and still pending after each test round.",
                    "Use mistakes from the verification test as the next revision checklist.",
                ],
            },
            {
                week: "Week 5-6",
                priority: "Moderate",
                focus: "Outcome Alignment Consolidation",
                tasks: [
                    "Retake the remaining tests until core and role-topic verification coverage improves meaningfully.",
                    "Consolidate verified topics into a role-wise quick revision sheet.",
                    "Once verification coverage improves, move to broader readiness preparation.",
                ],
            },
        ];
    }

    return [
        {
            week: "Week 1-2",
            priority: highGaps.length > 0 ? "Critical" : "High",
            focus: primaryGap ? `${primaryGap.domain} Recovery` : "Foundation Recovery",
            tasks: primaryGap?.actionPlan.slice(0, 3) || [
                "Review the highest-impact placement gaps first.",
                "Set daily study targets for readiness improvement.",
                "Track progress with one checkpoint at the end of each week.",
            ],
        },
        {
            week: "Week 3-4",
            priority: secondaryGap ? "High" : "Moderate",
            focus: secondaryGap ? `${secondaryGap.domain} Strengthening` : "Role and Aptitude Strengthening",
            tasks: secondaryGap?.actionPlan.slice(0, 3) || [
                "Strengthen role-specific concepts based on your selected track.",
                "Practice coding and aptitude in timed conditions.",
                "Review weak topics using mock-test mistakes.",
            ],
        },
        {
            week: "Week 5-6",
            priority: "Moderate",
            focus: "Placement Conversion Plan",
            tasks: [
                "Combine technical, aptitude, and communication practice into full mock rounds.",
                "Refine resume, project explanations, and self-introduction for interviews.",
                `Close the remaining visible gaps: ${(gaps.slice(0, 3).map((gap) => gap.domain).join(", ")) || "general readiness"}.`,
            ],
        },
    ];
}

function generateOverallDrawbacks(student: any): DrawbackItem[] {
    const academicDrawbacks = generateAcademicDrawbacks(student);
    const outcomeDrawbacks = generateOutcomeDrawbacks(student);
    const readiness = getPlacementReadiness(student);
    const drawbacks: DrawbackItem[] = [];
    const enrichmentCount = Array.isArray(student?.academicEnrichment) ? student.academicEnrichment.length : 0;
    const engagementCount = Array.isArray(student?.academicEngagement) ? student.academicEngagement.length : 0;
    const appliedCount = Array.isArray(student?.appliedKnowledge) ? student.appliedKnowledge.length : 0;
    const attendance = Number(student?.attendance || 0);
    const performanceGaps = readiness?.performanceGaps || [];
    const strategyImprovements = readiness?.strategy?.improvements || [];
    const enrichmentBreakdown = readiness?.enrichmentBreakdown;

    const addUnique = (item: DrawbackItem) => {
        const key = normalizeText(item.drawback);
        if (!drawbacks.some((existing) => normalizeText(existing.drawback) === key)) {
            drawbacks.push(item);
        }
    };

    academicDrawbacks.forEach(addUnique);
    outcomeDrawbacks.forEach(addUnique);

    performanceGaps.slice(0, 8).forEach((gap: any) => {
        addUnique({
            drawback: gap.problem || `${gap.domain} has visible readiness gaps.`,
            suggestion: Array.isArray(gap.actionPlan) && gap.actionPlan.length > 0
                ? gap.actionPlan.slice(0, 2).join(" ")
                : "Review this area and improve the missing coverage step by step.",
        });
    });

    strategyImprovements.forEach((item: any) => {
        addUnique({
            drawback: `${item.area} needs attention across your overall profile.`,
            suggestion: item.solution,
        });
    });

    if (enrichmentCount === 0) {
        addUnique({
            drawback: "Your overall profile lacks enrichment evidence such as certifications, internships, workshops, or project-based achievements.",
            suggestion: "Add at least one visible enrichment proof this cycle, preferably a certification, internship, or project that supports your target role.",
        });
    }

    if (engagementCount === 0 && appliedCount === 0) {
        addUnique({
            drawback: "Applied learning and academic engagement are still thin, which makes the profile look theory-heavy instead of practice-backed.",
            suggestion: "Balance academics with one practical activity such as a project, hackathon, workshop, technical club contribution, or competition entry.",
        });
    }

    if (enrichmentBreakdown?.missing?.length > 0) {
        enrichmentBreakdown.missing.forEach((category: string) => {
            addUnique({
                drawback: `${category} is missing from your current overall profile evidence.`,
                suggestion: `Add at least one ${category.toLowerCase()}-based activity or achievement so your portal profile reflects broader development.`,
            });
        });
    }

    if (attendance > 0 && attendance < 75) {
        addUnique({
            drawback: `Attendance is currently ${attendance}%, which can affect consistency, internal marks, and semester performance stability.`,
            suggestion: "Improve attendance discipline immediately and combine it with a weekly catch-up plan for missed classes and pending notes.",
        });
    }

    if ((readiness?.performanceGaps?.length || 0) === 0 && drawbacks.length < 4) {
        (readiness?.growthSuggestions || []).slice(0, 2).forEach((suggestion: string) => {
            addUnique({
                drawback: "Your profile is stable, but higher-tier growth still depends on converting current strengths into visible advanced outcomes.",
                suggestion,
            });
        });
    }

    if (drawbacks.length === 0) {
        addUnique({
            drawback: "Your overall profile is balanced, but sustained growth needs stronger conversion of current work into measurable academic, technical, and portfolio outcomes.",
            suggestion: "Keep academics stable, complete pending verifications, and add one role-aligned proof point every cycle so the dashboard stays growth-oriented instead of static.",
        });
    }

    return drawbacks.slice(0, 14);
}

function generateOverallRoadmap(student: any): RoadmapItem[] {
    const academicRoadmap = generateAcademicRoadmap(student);
    const outcomeRoadmap = generateOutcomeRoadmap(student);
    const readiness = getPlacementReadiness(student);
    const enrichmentCount = Array.isArray(student?.academicEnrichment) ? student.academicEnrichment.length : 0;
    const attendance = Number(student?.attendance || 0);

    const firstPhaseTasks = [
        ...(academicRoadmap[0]?.tasks || []).slice(0, 2),
        ...(outcomeRoadmap[0]?.tasks || []).slice(0, 1),
    ].slice(0, 3);

    const secondPhaseTasks = [
        ...(outcomeRoadmap[1]?.tasks || []).slice(0, 2),
        ...(academicRoadmap[1]?.tasks || []).slice(0, 1),
    ].slice(0, 3);

    const finalPhaseTasks = [
        ...(academicRoadmap[2]?.tasks || []).slice(0, 1),
        ...(outcomeRoadmap[2]?.tasks || []).slice(0, 1),
        enrichmentCount === 0
            ? "Add one enrichment milestone such as a certification, internship, or project output before the next review."
            : "Convert one existing strength into a stronger profile signal such as a better project, resume story, or certification."
    ].slice(0, 3);

    return [
        {
            week: "Week 1-2",
            priority: "Critical",
            focus: "Immediate Recovery Priorities",
            tasks: firstPhaseTasks.length > 0 ? firstPhaseTasks : [
                "Review your weakest academic and outcome-alignment areas first.",
                "Stabilize study consistency and clear the highest-impact pending topics.",
                attendance > 0 && attendance < 75 ? "Improve attendance and recover missed academic flow immediately." : "Create a disciplined weekly learning routine.",
            ],
        },
        {
            week: "Week 3-4",
            priority: "High",
            focus: "Capability Strengthening",
            tasks: secondPhaseTasks.length > 0 ? secondPhaseTasks : [
                "Strengthen the next set of weak areas from your dashboard modules.",
                "Turn unverified or uncovered topics into verified progress.",
                "Use mock tests, revision checklists, and tracked practice to improve consistency.",
            ],
        },
        {
            week: "Week 5-6",
            priority: readiness?.tier === "Ready" ? "Moderate" : "High",
            focus: "Profile Conversion and Growth",
            tasks: finalPhaseTasks,
        },
    ];
}

function generateFacultyClassDrawbacks(classroom: any): DrawbackItem[] {
    const students = Array.isArray(classroom?.students) ? classroom.students : [];
    const classAnalysis = analyzeClassPerformance(students as any[]);

    if (!classAnalysis.drawbacks.length) {
        return [
            {
                drawback: "No major cohort-level blockers are visible right now, but the faculty team should still monitor weak modules before placement season intensifies.",
                suggestion: "Review module-wise performance weekly and intervene early if trend lines start to dip in academics, core subjects, aptitude, or enrichment.",
            },
        ];
    }

    return classAnalysis.drawbacks.slice(0, 8).map((item) => ({
        drawback: `${item.domain} affects ${item.affectedStudents} students at ${item.impactLevel.toLowerCase()} impact level.`,
        suggestion: item.facultyActionPlan.slice(0, 2).join(" "),
    }));
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

    if (context === "outcome") {
        return {
            drawbacks: generateOutcomeDrawbacks(student),
            roadmap: generateOutcomeRoadmap(student),
        };
    }

    if (context === "overall") {
        return {
            drawbacks: generateOverallDrawbacks(student),
            roadmap: generateOverallRoadmap(student),
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

function generateFallbackFromClassroom(classroom: any) {
    return {
        drawbacks: generateFacultyClassDrawbacks(classroom),
        roadmap: [],
    };
}

function normalizeText(value: unknown) {
    return String(value || "").trim().toLowerCase();
}

function isGenericAcademicDrawbackList(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) return true;

    const joined = items
        .map((item) => `${normalizeText(item?.drawback)} ${normalizeText(item?.suggestion)}`)
        .join(" ");

    if (!joined) return true;

    return GENERIC_ACADEMIC_PHRASES.some((phrase) => joined.includes(phrase));
}

function isGenericAcademicRoadmap(items: any[]) {
    if (!Array.isArray(items) || items.length < 3) return true;

    const focuses = items.map((item) => normalizeText(item?.focus || item?.title));
    const uniqueFocuses = new Set(focuses.filter(Boolean));
    const tasks = items.map((item) =>
        Array.isArray(item?.tasks)
            ? item.tasks.map((task: string) => normalizeText(task)).filter(Boolean)
            : []
    );
    const flatTasks = tasks.flat();
    const uniqueTasks = new Set(flatTasks);
    const joined = `${focuses.join(" ")} ${flatTasks.join(" ")}`;

    if (!joined.trim()) return true;

    const containsKnownGenericText = GENERIC_ACADEMIC_PHRASES.some((phrase) => joined.includes(phrase));
    const repeatedFocuses = uniqueFocuses.size <= 1;
    const repeatedTasks = flatTasks.length > 0 && uniqueTasks.size <= 3;
    const thinTasks = tasks.some((phaseTasks) => phaseTasks.length < 2);

    return containsKnownGenericText || repeatedFocuses || repeatedTasks || thinTasks;
}

function isGenericOutcomeDrawbackList(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) return true;

    const joined = items
        .map((item) => `${normalizeText(item?.drawback)} ${normalizeText(item?.suggestion)}`)
        .join(" ");

    if (!joined) return true;

    return GENERIC_OUTCOME_PHRASES.some((phrase) => joined.includes(phrase));
}

function isGenericOutcomeRoadmap(items: any[]) {
    if (!Array.isArray(items) || items.length < 3) return true;

    const focuses = items.map((item) => normalizeText(item?.focus || item?.title));
    const uniqueFocuses = new Set(focuses.filter(Boolean));
    const tasks = items.map((item) =>
        Array.isArray(item?.tasks)
            ? item.tasks.map((task: string) => normalizeText(task)).filter(Boolean)
            : []
    );
    const flatTasks = tasks.flat();
    const uniqueTasks = new Set(flatTasks);
    const joined = `${focuses.join(" ")} ${flatTasks.join(" ")}`;

    if (!joined.trim()) return true;

    return (
        GENERIC_OUTCOME_PHRASES.some((phrase) => joined.includes(phrase)) ||
        uniqueFocuses.size <= 1 ||
        (flatTasks.length > 0 && uniqueTasks.size <= 3) ||
        tasks.some((phaseTasks) => phaseTasks.length < 2)
    );
}

function shouldFallbackForContext(drawbacks: any[], roadmap: any[], context: string) {
    if (!Array.isArray(drawbacks) || drawbacks.length === 0) return true;
    if (!Array.isArray(roadmap) || roadmap.length === 0) return true;

    if (context === "academic") {
        return isGenericAcademicDrawbackList(drawbacks) || isGenericAcademicRoadmap(roadmap);
    }

    if (context === "outcome") {
        return isGenericOutcomeDrawbackList(drawbacks) || isGenericOutcomeRoadmap(roadmap);
    }

    const joined = drawbacks
        .map((item) => `${normalizeText(item?.drawback)} ${normalizeText(item?.suggestion)}`)
        .join(" ");
    const roadmapJoined = roadmap
        .map((item) => `${normalizeText(item?.focus || item?.title)} ${Array.isArray(item?.tasks) ? item.tasks.map((task: string) => normalizeText(task)).join(" ") : ""}`)
        .join(" ");

    return (
        !joined.trim() ||
        !roadmapJoined.trim() ||
        GENERIC_ACADEMIC_PHRASES.some((phrase) => joined.includes(phrase) || roadmapJoined.includes(phrase)) ||
        GENERIC_OUTCOME_PHRASES.some((phrase) => joined.includes(phrase) || roadmapJoined.includes(phrase))
    );
}

function mergeAndEnsureCoverage(aiResult: any, student: any, context: string) {
    const mandatory = generateFallbackRecommendations(student, context);
    const aiDrawbacks = Array.isArray(aiResult?.drawbacks) ? aiResult.drawbacks : [];
    const aiRoadmap = Array.isArray(aiResult?.roadmap) ? aiResult.roadmap : [];
    const useFullFallback = shouldFallbackForContext(aiDrawbacks, aiRoadmap, context);

    const mergedDrawbacks = useFullFallback ? [] : [...aiDrawbacks];
    const existing = new Set(mergedDrawbacks.map((d: any) => String(d?.drawback || "").toLowerCase().trim()));

    for (const item of mandatory.drawbacks) {
        const key = String(item.drawback || "").toLowerCase().trim();
        if (key && !existing.has(key)) {
            mergedDrawbacks.push(item);
            existing.add(key);
        }
    }

    const finalRoadmap = !useFullFallback && aiRoadmap.length > 0
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
    let student: any = null;
    let context = "overall";
    let classroom: any = null;
    try {
        const body = await req.json();
        student = body?.student;
        context = body?.context || "overall";
        classroom = body?.classroom;

        if (context === "faculty_class") {
            if (!classroom || !Array.isArray(classroom?.students)) {
                return NextResponse.json({ error: "Classroom data required" }, { status: 400 });
            }
        } else if (!student) {
            return NextResponse.json({ error: "Student data required" }, { status: 400 });
        }

        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!geminiKey) {
            if (context === "faculty_class") {
                return NextResponse.json(generateFallbackFromClassroom(classroom));
            }
            const result = generateFallbackRecommendations(student, context);
            return NextResponse.json(result);
        }

        const ai = new GoogleGenAI({ apiKey: geminiKey });
        if (context === "faculty_class") {
            const students = Array.isArray(classroom?.students) ? classroom.students : [];
            const classAnalysis = analyzeClassPerformance(students as any[]);
            const summary = students.slice(0, 12).map((entry: any) => {
                const readiness = getPlacementReadiness(entry);
                return `${entry.name || entry.registerNumber || entry.id}: dept ${entry.department || "Unknown"}, PRI ${readiness.pri}, tier ${readiness.tier}, CGPA ${entry.cgpa || 0}, arrears ${entry.standingArrears || entry.arrears || 0}`;
            }).join(" | ");

            const prompt = `Analyze this faculty classroom cohort and identify major class total gaps.
            Department: ${classroom?.department || "Unknown"}.
            Student count: ${students.length}.
            Cohort summary: ${summary || "No student summary available"}.
            Existing class analysis summary: ${classAnalysis.drawbacks.map((item) => `${item.domain}: affects ${item.affectedStudents}, impact ${item.impactLevel}, reason ${item.primaryReason}`).join(" | ") || "No class drawbacks detected"}.
            Return 4 to 8 cohort-level drawback objects in JSON with "drawbacks" containing { drawback, suggestion }.
            Each drawback must be faculty-actionable, specific to the cohort, and based on repeated class-level weaknesses.
            Do not return generic "no issues" language unless the cohort truly has no visible pattern-level gaps.
            Return "roadmap" as an empty array.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.5,
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
                                    }
                                }
                            }
                        },
                        required: ["drawbacks", "roadmap"]
                    }
                }
            });

            const result = parseStructuredJson(response.text || "{}");
            const drawbacks = Array.isArray(result?.drawbacks) ? result.drawbacks : [];
            if (!drawbacks.length) {
                return NextResponse.json(generateFallbackFromClassroom(classroom));
            }
            return NextResponse.json({ drawbacks, roadmap: [] });
        }

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
        const readiness = context === "outcome" && hasOutcomeRecommendationData(student) ? getPlacementReadiness(student) : null;
        const outcomeGapSummary = readiness?.performanceGaps?.length
            ? readiness.performanceGaps
                .slice(0, 5)
                .map((gap) => `${gap.domain}: ${gap.coverage}% coverage, ${gap.riskLevel} risk, missing ${gap.missingTopics.slice(0, 3).join(", ")}`)
                .join(" | ")
            : "No validated outcome gap data available";
        const outcomeVerification = getOutcomeVerificationSummary(student);
        const pendingOutcomeTopicsSummary = [
            ...Object.entries(outcomeVerification.unverifiedCoreByDomain).map(([domain, topics]) => `${domain}: pending ${topics.slice(0, 4).join(", ")}`),
            outcomeVerification.unverifiedRoleConcepts.core.length > 0 ? `Role Core pending: ${outcomeVerification.unverifiedRoleConcepts.core.slice(0, 4).join(", ")}` : "",
            outcomeVerification.unverifiedRoleConcepts.intermediate.length > 0 ? `Role Intermediate pending: ${outcomeVerification.unverifiedRoleConcepts.intermediate.slice(0, 4).join(", ")}` : "",
            outcomeVerification.unverifiedRoleConcepts.advanced.length > 0 ? `Role Advanced pending: ${outcomeVerification.unverifiedRoleConcepts.advanced.slice(0, 4).join(", ")}` : "",
        ].filter(Boolean).join(" | ") || "No pending outcome-verification topics";

        const prompt = `Analyze this student profile for context: ${context}.
        CGPA: ${cgpa}, Arrears: ${student.standingArrears || 0}, Role: ${roleTrack}.
        Scores: Aptitude ${student.placementMetrics?.aptitudeScore || 0}%, Coding ${student.placementMetrics?.codingScore || 0}%, Comm ${student.placementMetrics?.communicationScore || 0}%.
        Semester records: ${semesterTrend}.
        Academic trend summary: Avg SGPA ${semesterSummary.averageSgpa}, Range ${semesterSummary.range}, Latest delta ${semesterSummary.latestDelta}, Trend ${semesterSummary.trendLabel}.
        Outcome gaps: ${outcomeGapSummary}.
        Outcome verification status: Verified core count ${outcomeVerification.verifiedCoreCount}, verified role count ${outcomeVerification.verifiedRoleCount}, failed verifications ${outcomeVerification.failedVerifications}, latest verification score ${outcomeVerification.verificationScore}.
        Unverified / uncovered outcome topics: ${pendingOutcomeTopicsSummary}.
        Incomplete Topics: ${incompleteList.join(' | ') || "None"}.
        Identify 4-8 weaknesses/faults and a 6-week roadmap (3 phases: Week 1-2, Week 3-4, Week 5-6).
        For academic context, base the drawbacks on semester-score patterns, consistency, improvements, dips, and arrears.
        Even when the student is performing well, include at least 2 constructive growth opportunities instead of returning "no drawbacks".
        For outcome context, use the actual performance gaps, verified topics, selected topics, remaining unverified topics, uncovered concepts, and verification attempts. Roadmap and drawbacks must explicitly target the topics that are still unverified or uncovered after the outcome-alignment tests. Do not return generic titles like "Skills Refinement" or repeated tasks across all phases.
        For overall context, combine academic trends, placement readiness, outcome-alignment verification status, enrichment, engagement, attendance, and uncovered topics into one consolidated recommendation set. Do not return vague "profile is strong" or "no roadmap needed" text unless there are truly no identifiable improvement areas across all modules.
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
        if (context === "faculty_class" && classroom) {
            return NextResponse.json(generateFallbackFromClassroom(classroom));
        }
        if (student) {
            return NextResponse.json(generateFallbackRecommendations(student, context));
        }
        return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }
}

