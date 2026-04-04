/**
 * Strict Formula for Readiness Score
 * readinessScore = (certCount * 10) + (enrichCount * 15)
 * 
 * Supports both Simplified Model and AOI Model fields.
 */
export function calculateReadinessScore(student: any): number {
    const certs = student.certifications || [];
    const enrichment = student.enrichment || [];

    // Support AOI Model fields
    const academicEnrichment = student.academicEnrichment || [];
    const appliedKnowledge = student.appliedKnowledge || [];

    // Aggregate counts
    // We treat 'certifications' and 'academicEnrichment' as pools for certCount
    // We treat 'enrichment' and 'appliedKnowledge' as pools for enrichCount
    const certCount = Math.max(certs.length, academicEnrichment.filter((i: any) => i.type === "Certification").length);
    const enrichCount = Math.max(enrichment.length, appliedKnowledge.length + academicEnrichment.filter((i: any) => i.type !== "Certification").length);

    return (certCount * 10) + (enrichCount * 15);
}

/**
 * Strict Risk Logic
 * >= 80 -> low
 * 40-79 -> moderate
 * < 40 -> high
 */
export function getRiskLevel(readinessScore: number): "Ready" | "Moderate" | "High" | "Critical" {
    if (readinessScore >= 75) return "Ready";
    if (readinessScore >= 60) return "Moderate";
    if (readinessScore >= 40) return "High";
    return "Critical";
}

export interface DrawbackItem {
    drawback: string;
    suggestion: string;
}

/**
 * Dynamic Drawback Generation Rules
 */
export function generateDrawbacks(student: any): DrawbackItem[] {
    const drawbacks: DrawbackItem[] = [];

    // Extract pools
    const certs = student.certifications || [];
    const academicEnrichment = student.academicEnrichment || [];
    const enrichment = student.enrichment || [];
    const appliedKnowledge = student.appliedKnowledge || [];

    // Calculate effective counts
    const certCount = Math.max(certs.length, academicEnrichment.filter((i: any) => i.type === "Certification").length);
    const enrichCount = Math.max(enrichment.length, appliedKnowledge.length + academicEnrichment.filter((i: any) => i.type !== "Certification").length);

    const score = student.readinessScore || ((certCount * 10) + (enrichCount * 15));

    if (certCount < 2) {
        drawbacks.push({
            drawback: "Insufficient certifications",
            suggestion: "Complete at least 2 relevant certifications to boost profile visibility."
        });
    }

    if (enrichCount < 2) {
        drawbacks.push({
            drawback: "Low participation in academic enrichment",
            suggestion: "Engage in more workshops, seminars, or technical events."
        });
    }

    // Checking for internships
    const hasInternship = student.internships?.length > 0 ||
        enrichment.some((e: any) => e.type?.toLowerCase().includes("internship") || e.title?.toLowerCase().includes("internship")) ||
        academicEnrichment.some((e: any) => e.type?.toLowerCase().includes("internship") || e.title?.toLowerCase().includes("internship"));

    if (!hasInternship) {
        drawbacks.push({
            drawback: "No internship exposure",
            suggestion: "Apply for summer/winter internships to gain industry experience."
        });
    }

    if (score < 40) {
        drawbacks.push({
            drawback: "High placement risk",
            suggestion: "Concentrate on core skills and participate in mock drives immediately."
        });
    }

    if (student.profileComplete === false && student.isProfileComplete === false) {
        drawbacks.push({
            drawback: "Incomplete student profile",
            suggestion: "Update all personal and academic details to 100% completion."
        });
    }

    return drawbacks;
}
