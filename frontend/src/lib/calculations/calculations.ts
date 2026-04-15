import { User, Certification, Competition, ExtraCurricular, PlacementMetrics } from "@/types";
import {
    calculateEnrichmentScore,
    calculateAppliedKnowledgeScore,
    calculateEngagementScore
} from "./academic-calculations";
import { calculatePRI } from "./placement-calculations";

// --- Module 1: Academic Performance (APS) ---
export function calculateAcademicScore(cgpa: number | string | undefined): number {
    const val = typeof cgpa === 'number' ? cgpa : parseFloat(cgpa || "0");
    if (!val) return 0;
    return Math.min(100, Math.round(val * 10));
}

// --- Module 2: Certification Performance (CPS) ---
export function calculateCertificationScore(certifications: Certification[] | undefined = []): number {
    return calculateEnrichmentScore(certifications);
}

// --- Module 3: Competition Performance (CompS) ---
export function calculateCompetitionScore(competitions: Competition[] | undefined = []): number {
    return calculateAppliedKnowledgeScore(competitions);
}

// --- Module 4: Extra-Curricular Development (EDS) ---
export function calculateExtraCurricularScore(activities: ExtraCurricular[] | undefined = []): number {
    return calculateEngagementScore(activities);
}

// --- Module 5: Placement Readiness (PRS) ---
// Note: PRS is being superseded by PRI
export function calculatePlacementScore(user: User): number {
    return calculatePRI(user).pri;
}

// --- Balanced Student Development Index (BSDI) ---
export function calculateBSDI(user: User): {
    academic: number;
    certification: number;
    competition: number;
    extraCurricular: number;
    placement: number;
    bsdi: number;
    riskProfile: { status: string; color: string };
} {
    // Check both new and legacy properties
    const academic = calculateAcademicScore(user.cgpa);

    // Use new properties if available, fallback to legacy
    const certification = calculateEnrichmentScore(user.academicEnrichment || user.certifications);
    const competition = calculateAppliedKnowledgeScore(user.appliedKnowledge || user.competitions);
    const extraCurricular = calculateEngagementScore(user.academicEngagement || user.extraCurricular);

    // Placement - use the comprehensive PRI calculation
    const placement = calculatePRI(user).pri;

    // Equal weight: 20% each
    const bsdi = Math.round(
        (academic * 0.2) +
        (certification * 0.2) +
        (competition * 0.2) +
        (extraCurricular * 0.2) +
        (placement * 0.2)
    );

    let riskProfile = { status: "Unknown", color: "text-gray-500" };

    if (bsdi >= 80) riskProfile = { status: "Excellent Development", color: "text-green-600" };
    else if (bsdi >= 60) riskProfile = { status: "Good Development", color: "text-blue-600" };
    else if (bsdi >= 40) riskProfile = { status: "Moderate Risk", color: "text-amber-600" };
    else riskProfile = { status: "High Risk", color: "text-red-600" };

    return {
        academic,
        certification,
        competition,
        extraCurricular,
        placement,
        bsdi,
        riskProfile
    };
}

