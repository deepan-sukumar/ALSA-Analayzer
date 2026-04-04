export type DepartmentGroup = "IT" | "CORE";

export const IT_DEPARTMENTS = [
    "Computer Science and Engineering",
    "Information Technology",
    "Artificial Intelligence and Machine Learning",
    "Artificial Intelligence and Data Science",
    "Cyber Security",
    "Software Engineering"
];

export const CORE_DEPARTMENTS = [
    "Mechanical Engineering",
    "Civil Engineering",
    "Mechatronics Engineering",
    "Electrical and Electronics Engineering",
    "Electronics and Communication Engineering",
    "Automobile Engineering",
    "Chemical Engineering",
    "Production Engineering"
];

export const DEPARTMENT_MAP: Record<string, string> = {
    "IT": "Information Technology",
    "CSE": "Computer Science and Engineering",
    "ECE": "Electronics and Communication Engineering",
    "EEE": "Electrical and Electronics Engineering",
    "AIML": "Artificial Intelligence and Machine Learning",
    "AI & DS": "Artificial Intelligence and Data Science",
    "AI&DS": "Artificial Intelligence and Data Science",
    "MECH": "Mechanical Engineering",
    "MECHANICAL": "Mechanical Engineering",
    "CIVIL": "Civil Engineering",
    "MECHATRONICS": "Mechatronics Engineering",
    "AUTOMOBILE": "Automobile Engineering",
    "CHEMICAL": "Chemical Engineering",
    "PRODUCTION": "Production Engineering",
    "SOFTWARE": "Software Engineering"
};

export function normalizeDepartment(dept: string): string {
    const upper = (dept || "").trim().toUpperCase();

    // 1. Check if it's an abbreviation needing expansion
    if (DEPARTMENT_MAP[upper]) return DEPARTMENT_MAP[upper];

    // 2. Check if it matches a full name (case insensitive)
    const all = [...IT_DEPARTMENTS, ...CORE_DEPARTMENTS];
    const foundCanonical = all.find(c => c.toUpperCase() === upper);
    if (foundCanonical) return foundCanonical;

    return dept; // Fallback to original
}

export const DEPARTMENT_CORE_SUBJECTS: Record<string, string[]> = {
    "Information Technology": [
        "Data Structures",
        "Algorithms",
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "OOPS",
        "Problem Solving",
        "Aptitude",
        "Communication"
    ],
    "Computer Science and Engineering": [
        "Data Structures",
        "Algorithms",
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "OOPS",
        "Problem Solving",
        "Aptitude",
        "Communication"
    ],
    "Mechanical Engineering": [
        "Engineering Mechanics",
        "Thermodynamics",
        "Fluid Mechanics",
        "Strength of Materials",
        "Manufacturing Technology",
        "Machine Design",
        "Engineering Mathematics",
        "CAD Basics",
        "Aptitude",
        "Communication"
    ],
    "Civil Engineering": [
        "Structural Analysis",
        "RCC",
        "Geotechnical Engineering",
        "Environmental Engineering",
        "Transportation Engineering",
        "Surveying",
        "Engineering Mathematics",
        "Aptitude",
        "Communication"
    ],
    "Electrical and Electronics Engineering": [
        "Circuit Theory",
        "Electrical Machines",
        "Power Systems",
        "Power Electronics",
        "Control Systems",
        "Measurements",
        "Engineering Mathematics",
        "Aptitude",
        "Communication"
    ],
    "Electronics and Communication Engineering": [
        "Analog Electronics",
        "Digital Electronics",
        "Signals & Systems",
        "Communication Systems",
        "Microprocessors",
        "VLSI Basics",
        "Engineering Mathematics",
        "Aptitude",
        "Communication"
    ],
    "Mechatronics Engineering": [
        "Engineering Mechanics",
        "Electrical Systems",
        "Control Systems",
        "Sensors & Actuators",
        "Robotics Basics",
        "PLC Programming",
        "Embedded Systems Basics",
        "Engineering Mathematics",
        "Aptitude",
        "Communication"
    ]
};

export function getDepartmentGroup(dept: string): DepartmentGroup {
    if (IT_DEPARTMENTS.includes(dept)) return "IT";
    return "CORE";
}

export function getCoreSubjects(dept: string): string[] {
    // Exact match
    if (DEPARTMENT_CORE_SUBJECTS[dept]) return DEPARTMENT_CORE_SUBJECTS[dept];

    // Normalized match
    const normalized = normalizeDepartment(dept);
    if (DEPARTMENT_CORE_SUBJECTS[normalized]) return DEPARTMENT_CORE_SUBJECTS[normalized];

    const group = getDepartmentGroup(normalized);
    if (group === "IT") return DEPARTMENT_CORE_SUBJECTS["Information Technology"] || DEPARTMENT_CORE_SUBJECTS["Computer Science and Engineering"];

    // Fallback logic for CORE departments
    if (normalized === "Automobile Engineering" || normalized === "Production Engineering")
        return DEPARTMENT_CORE_SUBJECTS["Mechanical Engineering"];

    if (normalized === "Chemical Engineering") return DEPARTMENT_CORE_SUBJECTS["Electrical and Electronics Engineering"];

    return DEPARTMENT_CORE_SUBJECTS["Mechanical Engineering"]; // Ultimate fallback
}
