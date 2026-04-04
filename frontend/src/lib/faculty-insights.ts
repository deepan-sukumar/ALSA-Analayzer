import { User } from "@/types";
import { calculatePRI } from "./placement-calculations";

export interface ClassDrawback {
    domain: string;
    affectedStudents: number;
    impactLevel: "Critical" | "High" | "Moderate" | "Low";
    primaryReason: string;
    facultyActionPlan: string[];
}

export interface ClassAnalysis {
    drawbacks: ClassDrawback[];
    overallHealth: "Excellent" | "Good" | "Needs Attention" | "Critical";
    topWeakness: string;
    studentsAtRisk: number;
}

export function analyzeClassPerformance(students: User[]): ClassAnalysis {
    if (!students || students.length === 0) {
        return { drawbacks: [], overallHealth: "Good", topWeakness: "None", studentsAtRisk: 0 };
    }

    let lowAcademicCount = 0;
    let lowCoreCount = 0;
    let lowRoleCount = 0;
    let lowAptitudeCount = 0;
    let lowEnrichmentCount = 0;
    let totalRiskCount = 0;

    students.forEach(student => {
        const { breakDown, pri } = calculatePRI(student);
        if (pri < 60) totalRiskCount++;

        // Thresholds for defining a "drawback" for a student in a specific area
        if (breakDown.academicNormalized < 60) lowAcademicCount++;
        if (breakDown.coreNormalized < 50) lowCoreCount++;
        if (breakDown.roleNormalized < 50) lowRoleCount++;
        if (breakDown.aptitudeNormalized < 50) lowAptitudeCount++;
        if (breakDown.enrichmentNormalized < 40) lowEnrichmentCount++;
    });

    const total = students.length;
    const drawbacks: ClassDrawback[] = [];

    // 1. Academic Drawbacks
    if (lowAcademicCount > 0) {
        const pct = (lowAcademicCount / total) * 100;
        if (pct > 20) {
            drawbacks.push({
                domain: "Academic Foundations",
                affectedStudents: lowAcademicCount,
                impactLevel: pct > 50 ? "Critical" : "High",
                primaryReason: "A significant portion of the class has low CGPA or standing arrears.",
                facultyActionPlan: [
                    "Identify common subjects where arrears occur and arrange remedial classes.",
                    "Implement a peer-tutoring system pairing high-CGPA students with those struggling.",
                    "Review internal assessment patterns to catch failing students earlier in the semester."
                ]
            });
        }
    }

    // 2. Core Coverage Drawbacks
    if (lowCoreCount > 0) {
        const pct = (lowCoreCount / total) * 100;
        if (pct > 30) {
            drawbacks.push({
                domain: "Core Engineering Subjects",
                affectedStudents: lowCoreCount,
                impactLevel: pct > 50 ? "Critical" : pct > 30 ? "High" : "Moderate",
                primaryReason: "Students are failing to master mandatory departmental core topics.",
                facultyActionPlan: [
                    "Integrate mini-projects into core subject curriculum to force application of theory.",
                    "Assign mandatory departmental topic revisions prior to placement season.",
                    "Conduct department-wide core competency tests."
                ]
            });
        }
    }

    // 3. Role/Skill Drawbacks
    if (lowRoleCount > 0) {
        const pct = (lowRoleCount / total) * 100;
        if (pct > 30) {
            drawbacks.push({
                domain: "Role-Specific Skills",
                affectedStudents: lowRoleCount,
                impactLevel: pct > 60 ? "Critical" : "High",
                primaryReason: "Students lack the necessary technical stack proficiencies for their chosen placement roles.",
                facultyActionPlan: [
                    "Mandate modern tech stack workshops (e.g., React, Node, DevOps).",
                    "Require students to build role-aligned portfolio projects.",
                    "Organize hackathons focused on industry-standard tools."
                ]
            });
        }
    }

    // 4. Aptitude Drawbacks
    if (lowAptitudeCount > 0) {
        const pct = (lowAptitudeCount / total) * 100;
        if (pct > 25) {
            drawbacks.push({
                domain: "Aptitude & Problem Solving",
                affectedStudents: lowAptitudeCount,
                impactLevel: pct > 50 ? "Critical" : "High",
                primaryReason: "Students are missing coverage in Quantitative, Logical, or Verbal reasoning.",
                facultyActionPlan: [
                    "Schedule mandatory weekly 2-hour aptitude solving sessions.",
                    "Integrate verbal reasoning and communication exercises into regular lab sessions.",
                    "Conduct bi-weekly mock aptitude tests mimicking company formats."
                ]
            });
        }
    }

    // 5. Enrichment Drawbacks
    if (lowEnrichmentCount > 0) {
        const pct = (lowEnrichmentCount / total) * 100;
        if (pct > 40) {
            drawbacks.push({
                domain: "Academic Enrichment",
                affectedStudents: lowEnrichmentCount,
                impactLevel: "Moderate",
                primaryReason: "The class lacks external certifications, internships, or competition participation.",
                facultyActionPlan: [
                    "Mandate at least one NPTEL or Coursera certification per semester.",
                    "Incentivize participation in platforms like LeetCode or Hackerrank.",
                    "Circulate internship opportunities actively through department channels."
                ]
            });
        }
    }

    // Sort by most affected
    drawbacks.sort((a, b) => b.affectedStudents - a.affectedStudents);

    let health: ClassAnalysis["overallHealth"] = "Good";
    const riskPct = (totalRiskCount / total) * 100;
    if (riskPct > 50) health = "Critical";
    else if (riskPct > 25) health = "Needs Attention";
    else if (riskPct < 10 && drawbacks.length === 0) health = "Excellent";

    return {
        drawbacks,
        overallHealth: health,
        topWeakness: drawbacks.length > 0 ? drawbacks[0].domain : "None",
        studentsAtRisk: totalRiskCount
    };
}

export function generateFacultyStudentRoadmap(student: User): { week: string, priority: string, focus: string, tasks: string[] }[] {
    const { breakDown, pri } = calculatePRI(student);
    const roadmap = [];

    // Week 1-2: Immediate triage based on worst area
    let primaryWeakness = "Aptitude";
    let minScore = breakDown.aptitudeNormalized;

    if (breakDown.academicNormalized < minScore) { primaryWeakness = "Academic Foundations"; minScore = breakDown.academicNormalized; }
    if (breakDown.coreNormalized < minScore) { primaryWeakness = "Core Engineering"; minScore = breakDown.coreNormalized; }
    if (breakDown.roleNormalized < minScore) { primaryWeakness = "Role Skills"; minScore = breakDown.roleNormalized; }

    if (primaryWeakness === "Academic Foundations") {
        roadmap.push({
            week: "Week 1-2: Academic Triage",
            priority: "Critical",
            focus: "Clearing Arrears & Boosting CGPA",
            tasks: [
                "Schedule a mandatory 1-on-1 counseling session to identify reasons for academic drop.",
                "Enforce a strict attendance tracking protocol.",
                "Assign peer mentor from the same department to help with difficult subjects."
            ]
        });
    } else if (primaryWeakness === "Aptitude") {
        roadmap.push({
            week: "Week 1-2: Aptitude Intensive",
            priority: "High",
            focus: "Quantitative & Logical Remediation",
            tasks: [
                "Assign 50 mandatory quantitative problems per week from generic placement platforms.",
                "Monitor completion of logical reasoning mock tests every Friday.",
                "Advise student to focus specifically on missing 'Data Interpretation' modules."
            ]
        });
    } else if (primaryWeakness === "Core Engineering") {
        roadmap.push({
            week: "Week 1-2: Core Concept Revival",
            priority: "High",
            focus: "Departmental Foundation Setup",
            tasks: [
                "Assign a mandatory review project focusing on the 'Missing' core subjects.",
                "Conduct a viva-voce on fundamental departmental topics.",
                "Recommend NPTEL crash courses on standard core mechanics."
            ]
        });
    } else {
        roadmap.push({
            week: "Week 1-2: Tech Stack Validation",
            priority: "Moderate",
            focus: "Role-specific Skill Building",
            tasks: [
                "Request submission of a working GitHub repository for an ongoing project.",
                "Assign a mini-project specifically in their preferred target placement track.",
                "Review their Data Structures & Algorithms proficiency level."
            ]
        });
    }

    // Week 3-4: Secondary Weakness or Confidence Building
    roadmap.push({
        week: "Week 3-4: Capability Expansion",
        priority: "Moderate",
        focus: "Bridging the Secondary Gap",
        tasks: [
            "Check progress on Week 1-2 remediation tasks.",
            "Introduce mock technical interviews with faculty or alumni.",
            "Mandate completion of at least one external skill certification (Coursera/Udemy)."
        ]
    });

    // Week 5-6: Placement Readiness Polish
    roadmap.push({
        week: "Week 5-6: Readiness Launchpad",
        priority: "Standard",
        focus: "Final Verification",
        tasks: [
            "Conduct a comprehensive mock interview covering HR & Technical aspects.",
            "Review and approve their final updated resume.",
            "Verify their communication checklists and fluency metrics."
        ]
    });

    return roadmap;
}
