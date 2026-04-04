import {
    User,
    AcademicEnrichment,
    AppliedKnowledge,
    AcademicEngagement,
    OutcomeAlignment,
    AcademicOutcomeIndex
} from "@/types";
import { PLACEMENT_ROLES, ROLE_SKILL_MATRIX, PlacementRole } from "@/lib/role-skills";
import { getCoreSubjects } from "@/lib/department-core";
import { CORE_ACADEMIC_TOPICS } from "@/lib/core-topics";

// -------------------------------------------------------------
// 1. ACADEMIC ENRICHMENT SCORE (Unified version)
// -------------------------------------------------------------
export function calculateEnrichmentScore(items: AcademicEnrichment[] | undefined): number {
    if (!items || items.length === 0) return 0;

    let totalScore = 0;

    items.forEach(item => {
        let score = 0;

        // Scoring rules from user:
        // Completed Certification = 10
        // Winner = 15
        // Runner = 10
        // Participation = 5
        // Workshop = 5
        // Internship = 20

        switch (item.status) {
            case "Winner": score = 15; break;
            case "Runner-up": score = 10; break;
            case "Participated": score = 5; break;
            case "Completed": {
                if (item.type === "Certification") score = 10;
                else if (item.type === "Internship") score = 20;
                else if (item.type === "Workshop") score = 5;
                else score = 10; // Default completed
                break;
            }
            default: score = 5;
        }

        // Add elite bonus if gold/elite
        if (item.isElite) score += 5;

        // Level bonus (modest)
        if (item.level === "National") score += 2;
        if (item.level === "International") score += 5;

        totalScore += score;
    });

    // Normalize to 100 as requested
    return Math.min(100, totalScore);
}

// -------------------------------------------------------------
// 2. EXTRA-CURRICULAR / APPLIED KNOWLEDGE (Now Aliased)
// -------------------------------------------------------------
export function calculateAppliedKnowledgeScore(items: AcademicEnrichment[] | undefined): number {
    return calculateEnrichmentScore(items);
}

export function calculateEngagementScore(items: AcademicEnrichment[] | undefined): number {
    return calculateEnrichmentScore(items);
}

// -------------------------------------------------------------
// 4. OUTCOME ALIGNMENT SCORE (OAS)
// -------------------------------------------------------------
// -------------------------------------------------------------
// 4. OUTCOME ALIGNMENT SCORE (OAS)
// -------------------------------------------------------------
export function calculateOutcomeAlignmentScore(data: OutcomeAlignment | undefined): number {
    if (!data) return 0;

    // 1. Calculate Core Coverage (Department Aware)
    let coreCoverage = 0;
    if (data.core) {
        // Fallback to old behavior if user dept is unknown, but ideally we have user object
        // Since OAS usually takes OutcomeAlignment which doesn't have User, 
        // we might need to rely on the saved coreCoverage or pass user.
        if (data.core.coreCoverage !== undefined) {
            coreCoverage = data.core.coreCoverage;
        } else {
            // Very legacy fallback
            const fields = Object.values(data.core).filter(v => typeof v === 'number') as number[];
            const sum = fields.reduce((a, b) => a + b, 0);
            coreCoverage = fields.length > 0 ? Math.round(sum / fields.length) : 0;
        }
    }

    // 2. Calculate Role Track Coverage
    let roleCoverage = 0;
    if (data.role && data.role.trackSelected) {
        // If we have explicit coverage calculated, use it
        if (typeof data.role.roleTrackCoverage === 'number') {
            roleCoverage = data.role.roleTrackCoverage;
        } else {
            // Otherwise calculate from concepts
            const matrix = ROLE_SKILL_MATRIX[data.role.trackSelected as PlacementRole];
            if (matrix) {
                const coreCount = matrix.core.length;
                const interCount = matrix.intermediate.length;
                const advCount = matrix.advanced.length;

                const myCore = data.role.concepts.core.length;
                const myInter = data.role.concepts.intermediate.length;
                const myAdv = data.role.concepts.advanced.length;

                const corePct = coreCount > 0 ? (myCore / coreCount) * 100 : 0;
                const interPct = interCount > 0 ? (myInter / interCount) * 100 : 0;
                const advPct = advCount > 0 ? (myAdv / advCount) * 100 : 0;

                // (0.5 * Core) + (0.3 * Inter) + (0.2 * Adv) -- applied to the Role Score
                roleCoverage = (0.5 * corePct) + (0.3 * interPct) + (0.2 * advPct);
            }
        }
    }

    // 3. Final Formula
    // OutcomeAlignmentScore = (0.5 × CoreCoverage) + (0.5 × RoleTrackCoverage)
    // If no role selected: OutcomeAlignmentScore = CoreCoverage

    let finalScore = 0;
    if (!data.role || !data.role.trackSelected) {
        finalScore = coreCoverage;
    } else {
        finalScore = (0.5 * coreCoverage) + (0.5 * roleCoverage);
    }

    return Math.round(Number.isNaN(finalScore) ? 0 : finalScore);
}

// -------------------------------------------------------------
// 5. ACADEMIC SEMESTER SCORE & GROWTH
// -------------------------------------------------------------
export function calculateAcademicSemesterScore(user: User): number {
    const cgpa = typeof user.cgpa === 'number' ? user.cgpa : parseFloat(user.cgpa as any || "0");
    // Normalize CGPA (0-10) to 0-100
    let score = Math.min(100, Math.round(cgpa * 10));

    // Arrear Penalty: Reduce 5 points per backlog (max -20)
    const arrears = user.standingArrears || user.arrears || 0;
    const penalty = Math.min(20, arrears * 5);

    score -= penalty;

    return Math.max(0, score);
}

export function calculateGrowthIndex(user: User): number {
    // Placeholder logic for consistency/growth
    // Ideally requires analyzing academicRecords for trend
    if (user.academicRecords && user.academicRecords.length > 1) {
        // Simple consistency check
        // If standard deviation is low, high consistency.
        // For now, return a safe default if not enough data.
        return 85;
    }
    return 80;
}


// -------------------------------------------------------------
// 6. MASTER AOI CALCULATION
// -------------------------------------------------------------
export function calculateAOI(user: User): AcademicOutcomeIndex {
    const academicScore = calculateAcademicSemesterScore(user);
    const growthIndex = calculateGrowthIndex(user);

    const enrichmentScore = calculateEnrichmentScore(user.academicEnrichment);
    const appliedScore = calculateAppliedKnowledgeScore(user.appliedKnowledge);
    const engagementScore = calculateEngagementScore(user.academicEngagement);
    const alignmentScore = calculateOutcomeAlignmentScore(user.outcomeAlignment);

    // Weighted Average
    // (0.35 × Academic) + (0.2 × Growth) + (0.15 × Enrichment) 
    // + (0.15 × Applied) + (0.1 × Engagement) + (0.05 × Alignment)

    const aoi = (0.35 * academicScore) +
        (0.20 * growthIndex) +
        (0.15 * enrichmentScore) +
        (0.15 * appliedScore) +
        (0.10 * engagementScore) +
        (0.05 * alignmentScore);

    const finalAOI = Math.round(Math.min(100, Math.max(0, aoi)));

    // Risk Engine
    const riskProfile = determineAcademicRisk(user, alignmentScore, enrichmentScore, appliedScore, engagementScore);

    // Text Generation
    const outcomeText = `AOI: ${finalAOI}/100`;
    const academicText = `CGPA: ${user.cgpa || "N/A"}`;
    const riskText = riskProfile.length > 0 ? `${riskProfile[0].riskLevel} Risk` : "Low Risk";

    return {
        aoi: finalAOI,
        academicScore,
        growthIndex,
        enrichmentScore,
        appliedScore,
        engagementScore,
        alignmentScore,
        riskProfile,
        overview: {
            academicText,
            outcomeText,
            riskText
        }
    };
}

function determineAcademicRisk(
    user: User,
    alignScore: number,
    enrichScore: number,
    appliedScore: number,
    engageScore: number
) {
    const risks = [];
    const cgpa = typeof user.cgpa === 'number' ? user.cgpa : parseFloat(user.cgpa as any || "0");
    const arrears = user.standingArrears || user.arrears || 0;

    // 1. Academic Risk
    if (arrears > 2) {
        risks.push({
            category: "Academic",
            riskLevel: "High Risk" as any, // Using standardized label
            missingArea: "Critical Backlogs",
            impact: "Severe impact on eligibility and degree completion.",
            suggestion: "Must clear standing arrears in the next attempt.",
            priority: "Immediate"
        });
    } else if (cgpa < 6.0) {
        risks.push({
            category: "Academic",
            riskLevel: "High Risk" as any,
            missingArea: "Low CGPA",
            impact: "Below academic tolerance threshold.",
            suggestion: "Must improvements grades to > 6.0.",
            priority: "Immediate"
        });
    }

    // 2. Enrichment Risk
    if (enrichScore === 0) {
        risks.push({
            category: "Enrichment",
            riskLevel: "Moderate" as const,
            missingArea: "No Academic Enrichment",
            impact: "Lack of domain depth.",
            suggestion: "Complete a certification or workshop.",
            priority: "Short-term"
        });
    }

    // 3. Applied Knowledge Risk
    if (appliedScore === 0) {
        risks.push({
            category: "Applied Knowledge",
            riskLevel: "Moderate" as const,
            missingArea: "Applied Learning Gap",
            impact: "Theoretical knowledge only.",
            suggestion: "Participate in a hackathon or contest.",
            priority: "Short-term"
        });
    }

    // 4. Engagement Risk
    if (engageScore === 0) {
        risks.push({
            category: "Engagement",
            riskLevel: "Low" as const,
            missingArea: "Low Engagement",
            impact: "Limited holistic development.",
            suggestion: "Join a club or coordinate an event.",
            priority: "Optional"
        });
    }

    // 5. Outcome Alignment Risk
    // Check core coverage specifically if data is available
    // Use optional chaining and default to avoid crash
    const coreCoverage = user.outcomeAlignment?.core?.coreCoverage ?? 0;

    // Only flag if they have actually started (i.e., coverage > 0 but < 60) OR if they have selected a track but have low core
    // If they haven't started (coverage 0), maybe don't flag "Weak Core" yet, or do?
    // Let's stick to simple threshold for now.
    if (user.outcomeAlignment && user.outcomeAlignment.score > 0 && coreCoverage < 60) {
        risks.push({
            category: "Outcome Alignment",
            riskLevel: "High" as const,
            missingArea: "Weak Core Fundamentals",
            impact: "Misaligned with selected academic track.",
            suggestion: "Strengthen core concepts in your track.",
            priority: "High"
        });
    }

    return risks;
}
