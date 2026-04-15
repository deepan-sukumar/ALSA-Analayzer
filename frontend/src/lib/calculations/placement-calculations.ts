import { User, PlacementMetrics, PlacementReadiness, Gap } from "@/types";
import { ROLE_SKILL_MATRIX, PlacementRole } from "@/lib/core/role-skills";
import { CORE_ACADEMIC_TOPICS, CoreDomain } from "@/lib/core/core-topics";
import { calculateEnrichmentScore, calculateEngagementScore, calculateGrowthIndex } from "./academic-calculations";
import { getCoreSubjects, getDepartmentGroup } from "../core/department-core";

// -------------------------------------------------------------
// CONSTANTS: APTITUDE TOPICS (Reference)
// -------------------------------------------------------------
export const APTITUDE_TOPICS = {
    QUANTITATIVE: [
        "Number System", "Divisibility Rules", "LCM & HCF", "Percentages", "Ratio & Proportion",
        "Average", "Mixtures & Allegations", "Profit & Loss", "Simple Interest", "Compound Interest",
        "Time & Work", "Pipes & Cisterns", "Time, Speed & Distance", "Boats & Streams", "Partnership",
        "Ages Problems", "Linear Equations", "Quadratic Equations", "Surds & Indices", "Logarithms",
        "Permutation & Combination", "Probability", "Set Theory", "AP & GP", "Geometry Basics", "Mensuration"
    ],
    LOGICAL: [
        "Seating Arrangement", "Blood Relations", "Direction Sense", "Ranking & Order", "Puzzles",
        "Syllogism", "Statement & Assumption", "Statement & Conclusion", "Cause & Effect", "Coding-Decoding"
    ],
    DATA_INTERPRETATION: [
        "Bar Graph", "Pie Chart", "Line Graph", "Table DI", "Caselet DI", "Mixed Graph"
    ],
    VERBAL: [
        "Tenses", "Subject-Verb Agreement", "Articles & Prepositions", "Error Spotting", "Sentence Correction",
        "Reading Comprehension", "Para Jumbles", "Synonyms & Antonyms", "Idioms & Phrases", "Fill in the blanks"
    ]
};

// -------------------------------------------------------------
// HELPER: SCORING METRICS
// -------------------------------------------------------------

export function getCommunicationScore(metrics: PlacementMetrics): number {
    if (metrics.communication) {
        const fluency = metrics.communication.fluency || 0;
        const checklistCount = metrics.communication.checklists?.length || 0;
        const checklistScore = Math.min(100, checklistCount * 15);
        return Math.round((0.6 * fluency) + (0.4 * checklistScore));
    }
    return metrics.communicationScore || 0;
}

// -------------------------------------------------------------
// 1. CORE ACADEMIC FOUNDATION SCORE (DEPARTMENT INTELLIGENT)
// -------------------------------------------------------------
export function calculateCoreFoundationScore(user: User): { score: number, coverage: number } {
    if (!user) return { score: 0, coverage: 0 };
    const dept = user.department || "General";
    const mandatorySubjects = getCoreSubjects(dept);
    // Score only relies on verified topics
    const selectedTopics = user.verifiedCoreTopics || {} as Record<string, string[]>;

    if (!mandatorySubjects || mandatorySubjects.length === 0) return { score: 0, coverage: 0 };

    // For each mandatory subject, check if the user has selected topics under that key
    // and compute a per-subject coverage percentage
    let totalCoverage = 0;
    let coveredSubjectCount = 0;

    mandatorySubjects.forEach(subject => {
        const allTopics = (CORE_ACADEMIC_TOPICS as any)[subject] || [];
        // Try exact match then lowercase for robustness
        const userSelected = (selectedTopics as any)[subject] || (selectedTopics as any)[subject.toLowerCase()] || [];

        if (allTopics.length > 0) {
            coveredSubjectCount++; // Subject exists in our rubric
            totalCoverage += (userSelected.length / allTopics.length) * 100;
        }
    });

    const overallCoverage = coveredSubjectCount > 0
        ? totalCoverage / coveredSubjectCount
        : 100; // If no topics defined in rubric for subjects, don't penalize

    return {
        score: Math.round(overallCoverage), // 0-100 overall coverage
        coverage: coveredSubjectCount
    };
}

// -------------------------------------------------------------
// 2. ROLE-BASED COMPETENCY SCORE
// -------------------------------------------------------------
export function calculateNewRoleScore(user: User): number {
    if (user.roleTrackProfile) {
        const { trackSelected } = user.roleTrackProfile;
        const concepts = user.verifiedRoleConcepts || { core: [], intermediate: [], advanced: [] };
        const matrix = ROLE_SKILL_MATRIX[trackSelected as PlacementRole];

        if (!matrix) return 0;

        const calc = (current: string[], required: string[]) => {
            const valid = current.filter(c => required.includes(c));
            return required.length > 0 ? (valid.length / required.length) * 100 : 0;
        };

        const corePct = calc(concepts.core, matrix.core);
        const interPct = calc(concepts.intermediate, matrix.intermediate);
        const advPct = calc(concepts.advanced, matrix.advanced);

        // Weighted: 50% Core, 30% Intermediate, 20% Advanced
        return Math.round((0.5 * corePct) + (0.3 * interPct) + (0.2 * advPct));
    }

    // Fallback
    if (user.placementMetrics?.roleSkills && user.placementMetrics.preferredRole) {
        const role = user.placementMetrics.preferredRole as PlacementRole;
        const matrix = ROLE_SKILL_MATRIX[role];
        if (!matrix) return 0;
        const s = user.placementMetrics.roleSkills;

        const c = matrix.core.length > 0 ? (s.core.length / matrix.core.length) * 100 : 0;
        const i = matrix.intermediate.length > 0 ? (s.intermediate.length / matrix.intermediate.length) * 100 : 0;
        const a = matrix.advanced.length > 0 ? (s.advanced.length / matrix.advanced.length) * 100 : 0;
        return Math.round((0.5 * c) + (0.3 * i) + (0.2 * a));
    }

    return 0;
}
// -------------------------------------------------------------
// 3. PROFESSIONAL READINESS INDEX (PRI) - MODERATE FORMULA (UPGRADED)
// -------------------------------------------------------------

// -------------------------------------------------------------
// 3. REFINED PROFESSIONAL READINESS INDEX (PRI)
// -------------------------------------------------------------

export function calculateAptitudeScore(user: User): number {
    const selectedTopics = user.verifiedCoreTopics || {} as Record<string, string[]>;
    const selectedAptitude = (selectedTopics as any)["Aptitude"] || (selectedTopics as any)["aptitude"];
    const totalAptitudeTopics = (CORE_ACADEMIC_TOPICS as any)["Aptitude"] || [];

    // If user has any core topics or if Aptitude key exists, use it exclusively
    if (totalAptitudeTopics.length > 0 && (selectedAptitude !== undefined || Object.keys(selectedTopics).length > 0)) {
        return Math.round(((selectedAptitude?.length || 0) / totalAptitudeTopics.length) * 100);
    }

    // Fallback: legacy placementMetrics (Only if no modern topics exist at all)
    if (user.placementMetrics?.aptitude) {
        return user.placementMetrics.aptitude.completionPercentage || 0;
    }
    return user.placementMetrics?.aptitudeScore || 0;
}

export function calculatePRI(user: User): { pri: number, breakDown: any } {
    if (!user) {
        return {
            pri: 0,
            breakDown: { academic: 0, core: 0, role: 0, aptitude: 0, enrichment: 0 }
        };
    }
    const rawCGPA = user.cgpa;
    const cgpa = (rawCGPA !== undefined && rawCGPA !== null && String(rawCGPA) !== "") ? parseFloat(String(rawCGPA)) : 0;
    const standingArrears = user.standingArrears || user.arrears || 0;

    // 1. Academic Score (40%): (CGPA / 10) × 100 × 0.40
    const academicNormalized = (cgpa / 10) * 100;
    const academicScore = academicNormalized * 0.40;

    // 2. Core Subject Coverage (25%): (Selected / Total) × 100 × 0.25
    const coreStats = calculateCoreFoundationScore(user);
    const coreScore = coreStats.score * 0.25;

    // 3. Skill / Role Alignment (15%): Coverage × 0.15
    const roleCoverage = calculateNewRoleScore(user);
    const roleScore = roleCoverage * 0.15;

    // 4. Aptitude Coverage (10%): Coverage × 0.10
    const aptitudeCoverage = calculateAptitudeScore(user);
    const aptitudeScore = aptitudeCoverage * 0.10;

    // 5. Enrichment Score (10%): Normalized Enrichment × 0.10
    const enrichmentNormalized = calculateEnrichmentScore(user.academicEnrichment);
    const enrichmentScore = enrichmentNormalized * 0.10;

    // FINAL PRI (Apply penalty for standing arrears: -5 PRI per arrear)
    const arrearPenalty = standingArrears * 5;
    const pri = Math.max(0, (academicScore + coreScore + roleScore + aptitudeScore + enrichmentScore) - arrearPenalty);

    return {
        pri: Math.round(Math.min(100, pri)),
        breakDown: {
            academic: Math.round(academicScore),
            core: Math.round(coreScore),
            role: Math.round(roleScore),
            aptitude: Math.round(aptitudeScore),
            enrichment: Math.round(enrichmentScore),
            academicNormalized,
            coreNormalized: coreStats.score,
            roleNormalized: roleCoverage,
            aptitudeNormalized: aptitudeCoverage,
            enrichmentNormalized,
            riskFactor: Math.max(0, 100 - (standingArrears * 20))
        }
    };
}

export function determineTier(pri: number, arrears: number): "Ready" | "Moderate" | "High" | "Critical" {
    if (arrears >= 4) return "Critical";
    if (arrears >= 2) {
        if (pri >= 60) return "High";
        if (pri >= 40) return "High";
        return "Critical";
    }
    if (arrears >= 1) {
        if (pri >= 75) return "Moderate";
        if (pri >= 60) return "High";
        if (pri >= 40) return "High";
        return "Critical";
    }
    if (pri >= 75) return "Ready";
    if (pri >= 60) return "Moderate";
    if (pri >= 40) return "High";
    return "Critical";
}

// -------------------------------------------------------------
// 4. MISSING TOPICS ANALYSIS
// -------------------------------------------------------------
export function getMissingTopics(user: User) {
    const missing: Record<string, string[]> = {};
    const domains = Object.keys(CORE_ACADEMIC_TOPICS) as CoreDomain[];
    const selected = user.verifiedCoreTopics || {}; // treat unverified as missing

    domains.forEach(domain => {
        const all = CORE_ACADEMIC_TOPICS[domain];
        const userHas = (selected as any)[domain] || (selected as any)[domain.toLowerCase()] || [];
        const diff = all.filter(t => !userHas.includes(t));
        if (diff.length > 0) missing[domain] = diff;
    });

    return missing;
}

// -------------------------------------------------------------
// 5. INTELLIGENT GAP DETECTION & SMART ROADMAP ENGINE
// -------------------------------------------------------------
import { PerformanceGap, RoadmapWeek } from "@/types";

function classifyRisk(coverage: number): { risk: PerformanceGap["riskLevel"], priority: PerformanceGap["priority"] } {
    if (coverage < 30) return { risk: "High", priority: "Critical" };
    if (coverage <= 60) return { risk: "Moderate", priority: "Important" };
    if (coverage <= 80) return { risk: "Low", priority: "Monitor" };
    return { risk: "On Track", priority: "Monitor" };
}

function getImpactText(domain: string, risk: string): string {
    const impacts: Record<string, Record<string, string>> = {
        "High": {
            default: `Severely impacts PRI score. ${domain} is a critical gap that recruiters evaluate in technical rounds.`,
            "Aptitude": "Critical blocker for aptitude rounds. Most companies filter candidates at this stage.",
            "Communication": "Poor communication skills directly reduce interview success rate by 40-60%.",
        },
        "Moderate": {
            default: `${domain} coverage is below industry expectations. Limits eligibility for premium tier companies.`,
            "Aptitude": "Moderate aptitude gaps may cause failures in screening rounds at MNC-level companies.",
        },
        "Low": {
            default: `${domain} is progressing but minor gaps remain. Addressing these will push your profile into elite readiness.`,
        }
    };
    return impacts[risk]?.[domain] || impacts[risk]?.default || `${domain} needs improvement to strengthen placement readiness.`;
}

function getActionPlan(domain: string, missing: string[], risk: string): string[] {
    const actions: string[] = [];

    if (risk === "High") {
        actions.push(`Immediately prioritize ${domain} — allocate 2+ hours daily for the next 2 weeks.`);
        if (missing.length > 3) {
            actions.push(`Start with fundamentals: ${missing.slice(0, 3).join(", ")}.`);
            actions.push(`Then progress to: ${missing.slice(3, 6).join(", ")}.`);
        } else {
            actions.push(`Cover remaining: ${missing.join(", ")}.`);
        }
        actions.push("Complete practice problems after each topic to reinforce concepts.");
    } else if (risk === "Moderate") {
        actions.push(`Schedule structured revision for ${domain} — 1 hour daily.`);
        actions.push(`Focus on: ${missing.slice(0, 4).join(", ")}.`);
        actions.push("Attempt mock tests to validate understanding.");
    } else {
        actions.push(`Review remaining topics: ${missing.slice(0, 3).join(", ")}.`);
        actions.push("Polish with timed practice sessions.");
    }

    return actions;
}

function getTimeline(risk: string, missingCount: number): string {
    if (risk === "High") return missingCount > 5 ? "2-3 Weeks (Intensive)" : "1-2 Weeks (Focused)";
    if (risk === "Moderate") return "2-3 Weeks (Steady)";
    return "1 Week (Light Review)";
}

export function detectPerformanceGaps(user: User): PerformanceGap[] {
    const gaps: PerformanceGap[] = [];
    const selectedTopics = user.verifiedCoreTopics || {} as Record<string, string[]>;
    const dept = user.department || "CSE";
    const mandatorySubjects = getCoreSubjects(dept);

    // --- Arrear Gaps (Backlogs) ---
    const standingArrears = user.standingArrears || user.arrears || 0;
    const arrearDetails = user.arrearDetails || [];

    if (standingArrears > 0) {
        // Core vs Non-Core analysis
        const coreArrears = arrearDetails.filter(a => a.type === "Core");

        arrearDetails.forEach((arrear, idx) => {
            gaps.push({
                domain: `Arrear: ${arrear.subjectName}`,
                coverage: 0,
                riskLevel: "High",
                priority: "Critical",
                problem: `Active backlog in ${arrear.type} subject: ${arrear.subjectName} (Sem ${arrear.semester}).`,
                impact: `Blocks placement eligibility for most MNCs and product companies. Reduces core foundation reliability.`,
                missingTopics: [`Subject: ${arrear.subjectName}`, `Semester: ${arrear.semester}`, `Type: ${arrear.type}`],
                actionPlan: [
                    `Register for immediate supplementary examination.`,
                    `Dedicate 1 hour daily specifically for ${arrear.subjectName} revision.`,
                    `Solve previous 5 years of question papers for this subject.`,
                    `Seek tutorial support if core concepts are unclear.`
                ],
                timeline: "Immediate / Next Suppl. Exam"
            });
        });

        // If no details but count exists, add a general gap
        if (arrearDetails.length === 0) {
            gaps.push({
                domain: "Standing Arrears",
                coverage: 0,
                riskLevel: "High",
                priority: "Critical",
                problem: `You have ${standingArrears} standing arrears reported.`,
                impact: `Placement eligibility is severely restricted until all arrears are cleared.`,
                missingTopics: [`Arrear Count: ${standingArrears}`],
                actionPlan: ["Identify and prioritize backlog subjects for the upcoming examination cycle."],
                timeline: "Immediate"
            });
        }
    }

    // --- Academic Gap (uses CGPA) ---
    const cgpa = typeof user.cgpa === 'number' ? user.cgpa : parseFloat(user.cgpa || "0");
    const academicNorm = Math.min(100, (cgpa / 10) * 100);
    if (academicNorm < 65) {
        const acadRisk = classifyRisk(academicNorm);
        gaps.push({
            domain: "Academic Performance",
            coverage: Math.round(academicNorm),
            riskLevel: acadRisk.risk,
            priority: acadRisk.priority,
            problem: `CGPA ${cgpa.toFixed(1)} is below the 6.5 threshold required by most companies.`,
            impact: "Low CGPA is a direct eligibility filter. Many MNCs require minimum 6.0-7.0 CGPA.",
            missingTopics: [`Current CGPA: ${cgpa.toFixed(1)}`, `Target: 7.0+`, `Gap: ${(7.0 - cgpa).toFixed(1)} points`],
            actionPlan: [
                "Prioritize upcoming semester exams to improve CGPA.",
                "Clear any standing arrears immediately.",
                "Focus on high-credit subjects for maximum GPA impact."
            ],
            timeline: "Ongoing (Next Semester)"
        });
    }

    // --- Core Subject Gaps (per department mandatory subject) ---
    mandatorySubjects.forEach(subject => {
        const allTopics = (CORE_ACADEMIC_TOPICS as any)[subject] || [];
        // Case-insensitive lookup
        const userSelected = ((selectedTopics as any)[subject] || (selectedTopics as any)[subject.toLowerCase()] || []) as string[];

        if (allTopics.length === 0) return;

        const coverage = (userSelected.length / allTopics.length) * 100;
        const { risk, priority } = classifyRisk(coverage);

        if (risk !== "On Track") {
            const missing = allTopics.filter((t: string) => !userSelected.includes(t));
            gaps.push({
                domain: subject,
                coverage: Math.round(coverage),
                riskLevel: risk,
                priority,
                problem: `Only ${userSelected.length}/${allTopics.length} topics covered in ${subject} (${Math.round(coverage)}%).`,
                impact: getImpactText(subject, risk),
                missingTopics: missing,
                actionPlan: getActionPlan(subject, missing, risk),
                timeline: getTimeline(risk, missing.length)
            });
        }
    });

    // --- Aptitude Gap ---
    const aptAll = (CORE_ACADEMIC_TOPICS as any)["Aptitude"] || [];
    const aptSelected = ((selectedTopics as any)["Aptitude"] || (selectedTopics as any)["aptitude"] || []) as string[];
    if (aptAll.length > 0) {
        const aptCoverage = (aptSelected.length / aptAll.length) * 100;
        if (aptCoverage < 80) {
            const { risk, priority } = classifyRisk(aptCoverage);
            const aptMissing = aptAll.filter((t: string) => !aptSelected.includes(t));
            if (risk !== "On Track") {
                gaps.push({
                    domain: "Aptitude",
                    coverage: Math.round(aptCoverage),
                    riskLevel: risk,
                    priority,
                    problem: `Aptitude coverage at ${Math.round(aptCoverage)}% — ${aptSelected.length}/${aptAll.length} topics prepared.`,
                    impact: getImpactText("Aptitude", risk),
                    missingTopics: aptMissing,
                    actionPlan: getActionPlan("Aptitude", aptMissing, risk),
                    timeline: getTimeline(risk, aptMissing.length)
                });
            }
        }
    }

    // --- Role & Skill Alignment Gap ---
    const roleCoverage = calculateNewRoleScore(user);
    if (roleCoverage < 60) {
        const { risk, priority } = classifyRisk(roleCoverage);
        const selectedTrack = user.outcomeAlignment?.role?.trackSelected || "Not Selected";
        gaps.push({
            domain: "Role & Skill Alignment",
            coverage: Math.round(roleCoverage),
            riskLevel: risk,
            priority,
            problem: `Role skill alignment at ${Math.round(roleCoverage)}% for "${selectedTrack}" track.`,
            impact: `Weak role alignment means poor performance in role-specific technical interviews.`,
            missingTopics: [`Track: ${selectedTrack}`, `Core concepts gap`, `Intermediate skills needed`, `Advanced skills pending`],
            actionPlan: [
                `Focus on core skills for ${selectedTrack} role.`,
                "Complete intermediate-level projects demonstrating role competency.",
                "Practice role-specific interview patterns.",
                roleCoverage < 30 ? "Consider switching track if current role is too far from your skill base." : "Build one showcase project in this domain."
            ],
            timeline: roleCoverage < 30 ? "3-4 Weeks (Intensive)" : "2-3 Weeks (Focused)"
        });
    }

    // --- Academic Enrichment Gap ---
    const enrichmentScore = calculateEnrichmentScore(user.academicEnrichment);
    if (enrichmentScore < 40) {
        const { risk, priority } = classifyRisk(enrichmentScore);
        gaps.push({
            domain: "Academic Enrichment",
            coverage: Math.round(enrichmentScore),
            riskLevel: risk,
            priority,
            problem: `Enrichment score is ${Math.round(enrichmentScore)}% — lacking certifications, projects, or workshops.`,
            impact: "Low enrichment scores signal lack of practical exposure to recruiters.",
            missingTopics: ["Industry Certifications", "Workshop Participation", "Internship Experience", "Hackathon/Competition Entries"],
            actionPlan: [
                "Complete at least 1 industry-recognized certification (AWS/Google/Microsoft).",
                "Participate in a hackathon or coding competition.",
                "Document and publish project work on GitHub.",
                "Seek a short-term internship or virtual project experience."
            ],
            timeline: enrichmentScore < 20 ? "4-6 Weeks" : "2-3 Weeks"
        });
    }

    // --- Communication Gap ---
    const commScore = getCommunicationScore(user.placementMetrics || {});
    if (commScore < 50) {
        gaps.push({
            domain: "Communication & Soft Skills",
            coverage: Math.round(commScore),
            riskLevel: commScore < 30 ? "High" : "Moderate",
            priority: commScore < 30 ? "Critical" : "Important",
            problem: `Communication readiness at ${Math.round(commScore)}% — below interview threshold.`,
            impact: getImpactText("Communication", commScore < 30 ? "High" : "Moderate"),
            missingTopics: ["Self Introduction", "Mock Interview Practice", "Group Discussion", "HR Round Preparation"],
            actionPlan: [
                "Practice self-introduction (2 min version) daily.",
                "Complete at least 3 mock interview sessions.",
                "Join group discussions or debate clubs.",
                "Prepare answers for top 20 HR questions."
            ],
            timeline: "2-3 Weeks (Ongoing Practice)"
        });
    }

    // Sort by severity: High > Moderate > Low
    const riskOrder = { "High": 0, "Moderate": 1, "Low": 2, "On Track": 3 };
    gaps.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    return gaps;
}

export function generateSmartRoadmap(gaps: PerformanceGap[], user: User): RoadmapWeek[] {
    const roadmap: RoadmapWeek[] = [];

    const highGaps = gaps.filter(g => g.riskLevel === "High");
    const modGaps = gaps.filter(g => g.riskLevel === "Moderate");
    const lowGaps = gaps.filter(g => g.riskLevel === "Low");

    // Week 1-2: Critical gaps & Arrears
    const arrearGaps = gaps.filter(g => g.domain.startsWith("Arrear") || g.domain === "Standing Arrears");

    if (arrearGaps.length > 0 || highGaps.length > 0) {
        const combinedFocus = [...new Set([...arrearGaps.map(g => "Backlog Clearance"), ...highGaps.map(g => g.domain)])].join(" & ");
        roadmap.push({
            week: "Week 1-2",
            title: "Zero-Backlog & Critical Recovery",
            focus: combinedFocus,
            tasks: [
                ...arrearGaps.flatMap(g => g.actionPlan.slice(0, 1)),
                ...highGaps.flatMap(g => g.actionPlan.slice(0, 1))
            ].slice(0, 4),
            priority: "Critical"
        });
    } else {
        roadmap.push({
            week: "Week 1-2",
            title: "Strengthen Foundations",
            focus: modGaps.length > 0 ? modGaps[0].domain : "General Review",
            tasks: [
                "Revise core fundamentals for your department.",
                modGaps.length > 0 ? `Focus on ${modGaps[0].domain}: ${modGaps[0].missingTopics.slice(0, 2).join(", ")}.` : "Practice aptitude and logical reasoning.",
                "Solve 30+ aptitude problems (Quant + Logical)."
            ],
            priority: "High"
        });
    }

    // Week 3-4: Moderate gaps
    if (modGaps.length > 0) {
        roadmap.push({
            week: "Week 3-4",
            title: "Skill Development Sprint",
            focus: modGaps.map(g => g.domain).slice(0, 2).join(" & "),
            tasks: modGaps.flatMap(g => g.actionPlan.slice(0, 2)).slice(0, 4),
            priority: "High"
        });
    } else {
        roadmap.push({
            week: "Week 3-4",
            title: "Advanced Skill Building",
            focus: "Role Alignment & Projects",
            tasks: [
                "Build a capstone project in your preferred role domain.",
                "Practice intermediate-level coding challenges.",
                "Complete one industry certification."
            ],
            priority: "Medium"
        });
    }

    // Week 5: Interview Prep
    roadmap.push({
        week: "Week 5",
        title: "Interview Simulation",
        focus: "Mock Interviews & Communication",
        tasks: [
            "Complete 3 timed mock interviews (technical + HR).",
            "Practice self-introduction and project explanations.",
            "Resume optimization and ATS keyword alignment.",
            "Group discussion practice session."
        ],
        priority: "High"
    });

    // Week 6: Final revision
    const allDomains = gaps.map(g => g.domain).slice(0, 3).join(", ");
    roadmap.push({
        week: "Week 6",
        title: "Final Readiness Blitz",
        focus: "Full Revision & Simulation",
        tasks: [
            allDomains ? `Quick revision: ${allDomains}.` : "Revise all core subjects.",
            "Full-length placement mock test.",
            lowGaps.length > 0 ? `Polish remaining topics in ${lowGaps[0].domain}.` : "Refine project documentation and GitHub profile.",
            "Final resume and portfolio review."
        ],
        priority: "Medium"
    });

    return roadmap;
}

export function getRecoveryIndex(user: User): { label: string, trend: "improving" | "declining" | "stable" } {
    const records = user.academicRecords || [];
    if (records.length < 2) return { label: "Insufficient Data", trend: "stable" };

    const sorted = [...records].sort((a: any, b: any) => {
        const semA = parseInt(String(a.semester ?? '').replace(/\D/g, '') || '0');
        const semB = parseInt(String(b.semester ?? '').replace(/\D/g, '') || '0');
        return semA - semB;
    });

    const recent = sorted.slice(-2);
    const prevSgpa = recent[0]?.sgpa || 0;
    const currSgpa = recent[1]?.sgpa || 0;
    const delta = currSgpa - prevSgpa;

    if (delta > 0.3) return { label: "Strong Recovery Potential", trend: "improving" };
    if (delta > 0) return { label: "Gradual Improvement", trend: "improving" };
    if (delta < -0.3) return { label: "Declining Trend Detected", trend: "declining" };
    if (delta < 0) return { label: "Slight Decline", trend: "declining" };
    return { label: "Stable Performance", trend: "stable" };
}

// LEGACY: Keep generateActionPlan for backward compat (student dashboard drawbacks)
export function generateActionPlan(
    user: User,
    coreDetails: Record<string, number>,
    roleScore: number,
    pri: number,
    missingTopics: Record<string, string[]>
) {
    const improvements: { area: string, solution: string, priority: string }[] = [];
    const cgpa = typeof user.cgpa === 'number' ? user.cgpa : parseFloat(user.cgpa || "0");
    const standingArrears = user.standingArrears || user.arrears || 0;
    const dept = user.department || "CSE";

    if (cgpa < 6.0) {
        improvements.push({ area: "Academic Consistency", solution: "CGPA < 6.0 is a blocker. Prioritize semester exams.", priority: "Immediate" });
    }
    if (standingArrears > 0) {
        improvements.push({ area: "Backlog Clearance", solution: `Clear ${standingArrears} standing arrears to unlock eligibility.`, priority: "Immediate" });
    }

    const selectedCore = user.verifiedCoreTopics || {} as Record<string, string[]>;
    const hasSubject = (sub: string) => {
        const topics = (selectedCore as any)[sub] || [];
        return topics.length > 0;
    };

    if (dept.includes("CS") || dept.includes("IT") || dept.includes("AI")) {
        if (!hasSubject("Data Structures")) improvements.push({ area: "DSA Fundamentals", solution: "Master Arrays, Linked Lists, and Trees for technical rounds.", priority: "High" });
        if (!hasSubject("DBMS")) improvements.push({ area: "DBMS Mastery", solution: "Focus on SQL Joins, Normalization, and Indexing.", priority: "High" });
    } else if (dept === "Mechanical") {
        if (!hasSubject("Thermodynamics")) improvements.push({ area: "Thermodynamics", solution: "Review 1st and 2nd Laws & Heat transfer fundamentals.", priority: "High" });
    } else if (dept === "ECE") {
        if (!hasSubject("VLSI Basics")) improvements.push({ area: "VLSI Fundamentals", solution: "Study CMOS design and Digital Logic circuits.", priority: "High" });
    } else if (dept === "Civil") {
        if (!hasSubject("Structural Analysis")) improvements.push({ area: "Structural Design", solution: "Focus on Beam analysis and Frame structures.", priority: "High" });
    } else if (dept === "EEE") {
        if (!hasSubject("Power Systems")) improvements.push({ area: "Power Systems", solution: "Study Load Flow Analysis and Grid Stability.", priority: "High" });
    }

    if (roleScore < 40) {
        improvements.push({ area: "Role Competency", solution: "Preferred role skills are low. Start following the roadmap tasks.", priority: "High" });
    }

    const commScore = getCommunicationScore(user.placementMetrics || {});
    if (commScore < 50) {
        improvements.push({ area: "Professional Comm.", solution: "Build confidence in Mock Interviews and Self-Intro.", priority: "Medium" });
    }

    return improvements;
}

export function generateWeeklyRoadmap(missingTopics: Record<string, string[]>, roleScore: number) {
    const weakDomains = Object.keys(missingTopics).slice(0, 2);
    const domainFocus = weakDomains.length > 0 ? weakDomains.join(" & ") : "Advanced Concepts";

    return [
        { week: "Week 1-2: Core Strengthening", tasks: [`Focus on weakest subjects: ${domainFocus}`, "Complete 50 Aptitude Questions (Quant/Logical)", "Resolve 1 DSA problem/day (Arrays/Strings)"] },
        { week: "Week 3-4: Role & Projects", tasks: [roleScore < 50 ? "Build fundamentals in selected Tech Stack" : "Implement one key feature in Capstone Project", "Practice Intermediate Role Concepts", "System Design Basics (LLD)"] },
        { week: "Week 5: Professional Simulation", tasks: ["Mock Interview (Technical)", "Resume Review & ATS Optimization", "Timed Coding Tests (LeetCode/HackerRank)"] },
        { week: "Week 6: Final Revision", tasks: ["Review Core Subjects (OS/DBMS/CN)", "Full-length Mock Test", "Refine Project Documentation"] }
    ];
}

// -------------------------------------------------------------
// 7. DASHBOARD INTELLIGENCE FUNCTIONS
// -------------------------------------------------------------

export function getEnrichmentBreakdown(items: any[] | undefined) {
    const requiredCategories = ["Certification", "Workshop", "Internship", "Competition"];
    const covered: string[] = [];
    const missing: string[] = [];

    requiredCategories.forEach(cat => {
        const matchType = cat === "Competition" ? ["Competition"] : [cat];
        const found = (items || []).some((item: any) => matchType.includes(item.type));
        if (found) covered.push(cat);
        else missing.push(cat);
    });

    const coverageCount = covered.length;
    const risk: "HIGH" | "MEDIUM" | "LOW" = coverageCount === 0 ? "HIGH" : coverageCount <= 2 ? "MEDIUM" : "LOW";

    return { missing, covered, risk, coverageCount };
}

export function getGrowthSuggestions(gaps: PerformanceGap[]): string[] {
    const suggestions: string[] = [];
    const hasHighGaps = gaps.some(g => g.riskLevel === "High");
    const hasModGaps = gaps.some(g => g.riskLevel === "Moderate");

    if (!hasHighGaps && !hasModGaps) {
        // Strong profile — advanced suggestions
        suggestions.push(
            "Target state/national level hackathons for elite exposure",
            "Contribute to open-source projects on GitHub to build public portfolio",
            "Practice system design (LLD + HLD) for product company interviews",
            "Attempt advanced certifications (AWS Solutions Architect, Google Cloud Professional)",
            "Mentor juniors to strengthen leadership & communication skills"
        );
    } else if (!hasHighGaps) {
        // Moderate gaps — improvement + growth
        suggestions.push(
            "Move to advanced-level certifications after clearing moderate gaps",
            "Build 2 real-world projects demonstrating technical depth",
            "Participate in coding competitions (LeetCode, CodeChef weekly)",
            "Publish a technical article or blog to build professional visibility"
        );
    } else {
        // High gaps — recovery + foundation
        suggestions.push(
            "Complete all high-priority gap topics before attempting advanced work",
            "Join a study group or mentorship program for accountability",
            "Set daily learning targets (minimum 2 hours focused study)"
        );
    }

    return suggestions;
}

export function calculateUnifiedRisk(user: User): { score: number, level: "Critical" | "High" | "Moderate" | "Low", breakdown: { academic: number, skillGap: number, aptitude: number, communication: number, enrichment: number, consistency: number } } {
    const coreStats = calculateCoreFoundationScore(user);
    const roleCoverage = calculateNewRoleScore(user);
    const aptScore = calculateAptitudeScore(user);
    const commScore = getCommunicationScore(user.placementMetrics || {});
    const enrichScore = calculateEnrichmentScore(user.academicEnrichment);
    const arrears = user.standingArrears || user.arrears || 0;

    // GPA trend penalty
    const records = user.academicRecords || [];
    let consistencyPenalty = 0;
    if (records.length >= 2) {
        const sorted = [...records].sort((a: any, b: any) => {
            const semA = parseInt(String(a.semester ?? '').replace(/\D/g, '') || '0');
            const semB = parseInt(String(b.semester ?? '').replace(/\D/g, '') || '0');
            return semA - semB;
        });
        const recent = sorted.slice(-2);
        const delta = (recent[1]?.sgpa || 0) - (recent[0]?.sgpa || 0);
        if (delta < -0.5) consistencyPenalty = 30;
        else if (delta < -0.2) consistencyPenalty = 15;
        else if (delta < 0) consistencyPenalty = 5;
    }

    const breakdown = {
        academic: Math.round((100 - (coreStats.score || 0)) * 0.25),
        skillGap: Math.round((100 - (roleCoverage || 0)) * 0.20),
        aptitude: Math.round((100 - (aptScore || 0)) * 0.15),
        communication: Math.round((100 - (commScore || 0)) * 0.10),
        enrichment: Math.round((100 - (enrichScore || 0)) * 0.10),
        consistency: Math.round(consistencyPenalty * 0.10 + arrears * 10)
    };

    const score = Math.min(100, breakdown.academic + breakdown.skillGap + breakdown.aptitude + breakdown.enrichment + breakdown.consistency);
    const level: "Critical" | "High" | "Moderate" | "Low" = score >= 70 ? "Critical" : score >= 50 ? "High" : score >= 30 ? "Moderate" : "Low";

    return { score, level, breakdown };
}

// -------------------------------------------------------------
// 8. MASTER FUNCTION (Updated with Intelligence Layer)
// -------------------------------------------------------------
export function getPlacementReadiness(user: User): PlacementReadiness {
    const { pri, breakDown } = calculatePRI(user);
    const standingArrears = user.standingArrears || user.arrears || 0;
    const tier = determineTier(pri, standingArrears);

    const coreStats = calculateCoreFoundationScore(user);
    const missingTopics = getMissingTopics(user);
    const improvements = generateActionPlan(user, { "Core": coreStats.score }, breakDown.roleNormalized, pri, missingTopics);
    const weeklyPlan = generateWeeklyRoadmap(missingTopics, breakDown.roleNormalized);

    // Intelligent gap detection & smart roadmap
    const performanceGaps = detectPerformanceGaps(user);
    const smartRoadmap = generateSmartRoadmap(performanceGaps, user);
    const recoveryIndex = getRecoveryIndex(user);

    // Dashboard intelligence
    const enrichmentBreakdown = getEnrichmentBreakdown(user.academicEnrichment);
    const growthSuggestions = getGrowthSuggestions(performanceGaps);
    const unifiedRisk = calculateUnifiedRisk(user);

    let eligibleFor: string[] = [];
    let tierSuggestions: string[] = [];

    if (tier === "Ready") { // PRI >= 75
        eligibleFor = ["Product Based Companies", "Premium Service (MAANG/Equivalent)", "High-Growth Startups", "Core Tech Roles"];
        tierSuggestions = [
            "Your profile is elite. Focus primarily on System Design (HLD/LLD) and highly optimized Data Structures.",
            "Target Product-Based Companies offering packages above 12+ LPA.",
            "Prepare for rigorous machine coding and architectural rounds."
        ];
    } else if (tier === "Moderate") { // PRI >= 60
        eligibleFor = ["MNCs & Consulting", "High-Tier Service Companies", "Mid-Level Startups", "System Integrators"];
        tierSuggestions = [
            "You have a solid foundation. You are highly eligible for standard Day-1 MNCs and Service-Based roles.",
            "To break into Product-Based companies, you need to drastically boost your Core Tech coverage and DSA solving speed.",
            "Focus on clearing aptitude and standard coding rounds flawlessly."
        ];
    } else if (tier === "High") { // PRI >= 40
        eligibleFor = ["Mid-Tier IT Services", "BPO Tech Support", "Internship-to-FTE Trainee Roles"];
        tierSuggestions = [
            "Your profile is missing key foundational elements. Avoid applying to premium roles until your gaps are closed.",
            "Target smaller IT firms or look for 6-month train-and-hire internships.",
            "Prioritize clearing backlogs immediately and building at least one solid portfolio project."
        ];
    } else { // Critical
        eligibleFor = ["Apprenticeship Programs", "Mass Recruiters (Conditional)", "Local Startups (Entry-Level)"];
        tierSuggestions = [
            "Your readiness is critically low. Focus exclusively on academic recovery first.",
            "Do not focus on advanced tech; prioritize passing grades, aptitude basics, and basic communication.",
            "Target mass recruiters or off-campus entry-level roles once academic blockers are cleared."
        ];
    }

    const finalRisk = {
        label: unifiedRisk.level,
        index: unifiedRisk.score
    };

    const keyStrengths: string[] = [];
    if (breakDown.academicNormalized >= 75) keyStrengths.push("Strong Academic Track Record");
    if (breakDown.coreNormalized >= 70) keyStrengths.push("Solid Core Subject Knowledge");
    if (breakDown.roleNormalized >= 60) keyStrengths.push("Strong Role Skill Alignment");
    if (breakDown.aptitudeNormalized >= 70) keyStrengths.push("High Aptitude Readiness");
    if (breakDown.enrichmentNormalized >= 50) keyStrengths.push("Active Co-Curricular Profile");
    if (standingArrears === 0) keyStrengths.push("Clear Placement Eligibility (No Backlogs)");
    if (keyStrengths.length === 0) keyStrengths.push("Currently in Foundation Building Phase");

    return {
        pri,
        tier,

        academicScore: breakDown.academic,
        coreScore: breakDown.core,
        roleScore: breakDown.role,
        aptitudeScore: breakDown.aptitude,
        enrichmentScore: breakDown.enrichment,

        consistencyIndex: Math.max(0, 100 - unifiedRisk.breakdown.consistency),
        standingArrears,

        finalRisk,
        recommendedRole: user.outcomeAlignment?.role?.trackSelected || "Generalist",

        gaps: [],
        eligibleFor,
        tierSuggestions,
        notEligibleFor: [],
        missingTopics,

        strategy: {
            holisticView: (tier === "Critical" || tier === "High") ? "Immediate intervention required." : "Progression is steady.",
            roadmapStep: "Development Plan",
            keyStrengths,
            improvements
        },

        weeklyRoadmap: weeklyPlan,

        // Intelligent engine
        performanceGaps,
        smartRoadmap,
        recoveryIndex,

        // Dashboard intelligence
        enrichmentBreakdown,
        growthSuggestions,
        unifiedRisk
    };
}


