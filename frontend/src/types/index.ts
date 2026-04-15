export type Role = "student" | "faculty" | "admin";

export type Gender = "MALE" | "FEMALE" | "OTHER";

// --- Unified Academic Enrichment Model ---
export interface AcademicEnrichment {
    id: string;
    type: "Certification" | "Competition" | "Workshop" | "Internship" | "Publication" | "Research" | "Technical Club" | "Project";
    category: string; // Dynamic category (e.g. "Web Dev", "Robotics")
    title: string;
    organization: string;
    date: string;

    // Achievement Logic
    status: "Completed" | "Winner" | "Runner-up" | "Participated" | "Ongoing";
    level: "College" | "Intercollege" | "State" | "National" | "International";

    isElite: boolean; // Elite / Gold Certified
    duration?: number; // hours (optional)
    score?: number; // percentage (optional)
}

export type Certification = AcademicEnrichment;
export type Competition = AcademicEnrichment;
export type ExtraCurricular = AcademicEnrichment;
export type AcademicEngagement = AcademicEnrichment;
export type AppliedKnowledge = AcademicEnrichment;

// --- Module 5: Outcome Alignment (Former Placement) ---
// --- Module 5: Outcome Alignment (Former Placement) ---
export interface CoreAcademicProfile {
    [subject: string]: number | undefined;
    coreCoverage?: number; // Calculated average
}


export interface RoleTrackProfile {
    trackSelected: string;
    concepts: {
        core: string[];
        intermediate: string[];
        advanced: string[];
    };
    roleTrackCoverage?: number; // Calculated
}

export interface CoreTopicSelection {
    [domain: string]: string[];
}

export interface OutcomeAlignment {
    // Composite object for easier fetching/usage, though saved separately in DB if requested
    core?: CoreAcademicProfile;
    role?: RoleTrackProfile;
    coreTopics?: CoreTopicSelection;

    // Legacy / Composite fields
    trackSelected?: string;
    track?: string; // Legacy field
    concepts?: {
        core: string[];
        intermediate: string[];
        advanced: string[];
    };

    score: number; // Final OA Score
    lastUpdated?: string;

    // New: Topic Verification System
    verifiedCoreTopics?: Record<string, string[]>; // only topics that passed the test
    verifiedRoleConcepts?: {
        core: string[];
        intermediate: string[];
        advanced: string[];
    };
    topicVerifications?: Record<string, {
        status: "verified" | "unverified";
        score: number;
        attempts: number;
        lastAttempt?: string;
    }>;
}


// --- Final Academic Outcome Index (AOI) ---
export interface AcademicOutcomeIndex {
    aoi: number; // 0-100
    academicScore: number; // Semester contribution
    growthIndex: number; // Growth/Consistency
    enrichmentScore: number;
    appliedScore: number;
    engagementScore: number;
    alignmentScore: number;

    riskProfile: {
        category: string;
        riskLevel: "Low" | "Moderate" | "High" | "Critical";
        missingArea: string;
        impact: string;
        suggestion: string;
        priority: string;
    }[];

    overview: {
        academicText: string;
        outcomeText: string;
        riskText: string;
    };
}

// --- Placement & Risk Types ---
export interface Gap {
    category: "Academic" | "Technical" | "Aptitude" | "Communication";
    riskLevel: "Critical" | "High" | "Moderate" | "Low";
    missingArea: string;
    impact: string;
    suggestion: string;
    priority: string;
}

export interface PerformanceGap {
    domain: string;
    coverage: number;  // 0-100
    riskLevel: "High" | "Moderate" | "Low" | "On Track";
    priority: "Critical" | "Important" | "Monitor";
    problem: string;
    impact: string;
    missingTopics: string[];
    actionPlan: string[];
    timeline: string;
}

export interface RoadmapWeek {
    week: string;
    title: string;
    focus: string;
    tasks: string[];
    priority: "Critical" | "High" | "Medium";
}

export interface PlacementReadiness {
    pri: number; // Professional Readiness Index
    tippingPoint?: number; // Normalized total
    tier: "Ready" | "Moderate" | "High" | "Critical";

    // Exact Formula Components
    academicScore: number;       // 40% contribution
    coreScore: number;           // 25% contribution
    roleScore: number;           // 15% contribution
    aptitudeScore: number;       // 10% contribution
    enrichmentScore: number;     // 10% contribution

    consistencyIndex: number;
    standingArrears: number;

    // Backward compatibility & Extended Metrics
    finalRisk?: { label: "Low" | "Moderate" | "High" | "Critical", index: number };
    recommendedRole?: string;

    gaps: Gap[];
    eligibleFor: string[];
    tierSuggestions?: string[];
    notEligibleFor: string[];
    missingTopics?: Record<string, string[]>;

    strategy: {
        holisticView: string;
        roadmapStep: string;
        keyStrengths: string[];
        improvements: { area: string, solution: string, priority: string }[];
    };

    weeklyRoadmap?: { week: string, tasks: string[] }[];

    // New: Intelligent Gap Detection
    performanceGaps?: PerformanceGap[];
    smartRoadmap?: RoadmapWeek[];
    recoveryIndex?: { label: string, trend: "improving" | "declining" | "stable" };

    // New: Dashboard Intelligence
    enrichmentBreakdown?: { missing: string[], covered: string[], risk: "HIGH" | "MEDIUM" | "LOW", coverageCount: number };
    growthSuggestions?: string[];
    unifiedRisk?: { score: number, level: "Critical" | "High" | "Moderate" | "Low", breakdown: { academic: number, skillGap: number, aptitude: number, enrichment: number, consistency: number } };
}

// --- Legacy Placement Types (Keep for compatibility if needed, else deprecate) ---
export interface PlacementMetrics {
    // Keep existing structure for now to avoid breaking old pages immediately, 
    // but we will migrate away from it.
    aptitude?: any;
    technical?: any;
    communication?: any;
    preferredRole?: string;
    roleSkills?: any;
    aptitudeScore?: number;
    codingScore?: number;
    communicationScore?: number;
    mockInterviewScore?: number;
    internshipCompleted?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    approved?: boolean;
    gender: Gender;
    avatarUrl?: string;
    department?: string;
    designation?: string;
    registerNumber?: string;
    registerNo?: string; // Keep for legacy compatibility during migration
    phone?: string;
    riskLevel?: "Critical" | "High" | "Moderate" | "Ready";
    readinessScore?: number;
    priScore?: number;
    weakestModule?: string;
    lastUpdated?: any;

    // Academic Data
    degree?: "UG" | "PG";
    yearOfStudy?: number;
    currentSemester?: number;
    totalSemesters?: number;

    // Academic Records
    academicRecords?: {
        semester: number;
        sgpa: number;
        arrears?: number;
    }[];

    standingArrears?: number;
    arrearDetails?: {
        subjectName: string;
        semester: number;
        type: "Core" | "Non-Core";
    }[];

    cgpa?: number;
    arrears?: number; // Legacy
    attendance?: number | string;

    // New Academic Modules
    academicEnrichment?: AcademicEnrichment[];
    appliedKnowledge?: AppliedKnowledge[];
    academicEngagement?: AcademicEngagement[];
    outcomeAlignment?: OutcomeAlignment;

    // Explicit Profiles (Saved as top-level fields)
    coreAcademicProfile?: CoreAcademicProfile;
    roleTrackProfile?: RoleTrackProfile;
    coreAcademicTopics?: CoreTopicSelection; // selected topics

    // New: Topic Verification System
    verifiedCoreTopics?: CoreTopicSelection; // only topics that passed the test
    verifiedRoleConcepts?: {
        core: string[];
        intermediate: string[];
        advanced: string[];
    };
    verificationScore?: number; // Latest / Average test score
    failedVerifications?: number; // Count of failed tests

    // Final Calculation
    academicOutcomeIndex?: AcademicOutcomeIndex;

    // Legacy / Transition
    certifications?: any[];
    competitions?: any[];
    extraCurricular?: any[];
    placementMetrics?: PlacementMetrics;
    placement?: any; // Old PlacementReadiness

    // Flags
    loginProvider?: string;
    hasPassword?: boolean;
    profileCompleted?: boolean;
    isProfileComplete?: boolean;
    areGradesComplete?: boolean;

    // Enrichment Metadata
    enrichmentCount?: number;
}

export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "ghost";
}

