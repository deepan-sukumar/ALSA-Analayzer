import {
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    serverTimestamp,
    deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizeDepartment } from "../core/department-core";

const getStudentMergeKey = (record: any) =>
    record?.registerNumber ||
    record?.registerNo ||
    record?.email?.toLowerCase?.() ||
    record?.id;

const mergeStudentRecords = (students: any[], users: any[]) => {
    const merged = new Map<string, any>();

    students.forEach((student) => {
        const key = getStudentMergeKey(student);
        if (!key) return;
        merged.set(key, student);
    });

    users
        .filter((user) => user.role === "student")
        .forEach((user) => {
            const key = getStudentMergeKey(user);
            if (!key) return;
            const existing = merged.get(key) || {};
            merged.set(key, { ...existing, ...user });
        });

    return Array.from(merged.values());
};

// 🛡️ Recursive Helper to clean objects of undefined values
const cleanObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;

    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => cleanObject(item)).filter(v => v !== undefined);
    }

    // Handle Objects
    return Object.fromEntries(
        Object.entries(obj)
            .map(([k, v]) => [k, cleanObject(v)])
            .filter(([_, v]) => v !== undefined)
    );
};

// ──────────────────────────────────
// User Document  users/{uid}
// ──────────────────────────────────

export async function createUserDocument(
    uid: string,
    data: Record<string, any>
) {
    const ref = doc(db, "users", uid);
    const cleanedData = cleanObject(data);

    // Auto-normalize email and department if present
    if (cleanedData.email) {
        cleanedData.email = cleanedData.email.toLowerCase().trim();
    }
    if (cleanedData.department) {
        cleanedData.department = normalizeDepartment(cleanedData.department);
    }

    await setDoc(ref, {
        ...cleanedData,
        createdAt: serverTimestamp(),
    });
}

export async function getUserDocument(uid: string) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function getUserByEmail(email: string) {
    const normalEmail = email.toLowerCase().trim();
    const q = query(collection(db, "users"), where("email", "==", normalEmail));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    // Priority 1: Find a verified student record
    const studentDoc = snap.docs.find(d => d.data().role === "student");
    if (studentDoc) return { id: studentDoc.id, ...studentDoc.data() };

    // Priority 2: Find an approved faculty record
    const approvedFaculty = snap.docs.find(d => d.data().role === "faculty" && d.data().approved === true);
    if (approvedFaculty) return { id: approvedFaculty.id, ...approvedFaculty.data() };

    // Fallback: Just return the first one found
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function updateUserDocument(
    uid: string,
    data: Record<string, any>
) {
    const ref = doc(db, "users", uid);
    const cleanData = cleanObject(data);

    // Auto-normalize email and department if present
    if (cleanData.email) {
        cleanData.email = cleanData.email.toLowerCase().trim();
    }
    if (cleanData.department) {
        cleanData.department = normalizeDepartment(cleanData.department);
    }

    if (Object.keys(cleanData).length === 0) return;

    await updateDoc(ref, cleanData);

    // 🔄 Sync with role-specific collections if role is known
    // We fetch the current doc to check role if not provided in update
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const fullData = snap.data();
        if (fullData.role === "student") {
            await setDoc(doc(db, "students", uid), cleanData, { merge: true });
        } else if (fullData.role === "faculty") {
            await setDoc(doc(db, "faculty", uid), cleanData, { merge: true });
        }
    }
}

/**
 * 🗑️ Permanently deletes a user from all institutional registries.
 * Cascades across 'users', 'students', and 'faculty' collections.
 */
export async function deleteUserCompletely(uid: string) {
    // 1. Delete from primary identity registry
    await deleteDoc(doc(db, "users", uid));

    // 2. Cascade delete from role-specific registries
    await deleteDoc(doc(db, "students", uid));
    await deleteDoc(doc(db, "faculty", uid));

    // 3. Optional: Delete sub-collections (Semesters etc. if needed)
    // Note: Firestore doesn't auto-delete sub-collections on doc delete.
    // For now, primary registries are cleared to prevent dashboard orphans.
}

// ──────────────────────────────────
// Semesters   users/{uid}/semesters/{semId}
// ──────────────────────────────────

export async function saveSemesterData(
    uid: string,
    semesterId: string,
    data: Record<string, any>
) {
    const ref = doc(db, "users", uid, "semesters", semesterId);
    await setDoc(ref, {
        ...cleanObject(data),
        createdAt: serverTimestamp(),
    });
}

export async function getSemesters(uid: string) {
    const colRef = collection(db, "users", uid, "semesters");
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ──────────────────────────────────
// Academic Enrichment (Former Certification)
// ──────────────────────────────────
export async function saveEnrichmentIndex(uid: string, data: any[]) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { academicEnrichment: cleanObject(data) });
}

// ──────────────────────────────────
// Applied Knowledge (Former Competition)
// ──────────────────────────────────
export async function saveAppliedKnowledgeIndex(uid: string, data: any[]) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { appliedKnowledge: cleanObject(data) });
}

// ──────────────────────────────────
// Academic Engagement (Former Extra-Curricular)
// ──────────────────────────────────
export async function saveEngagementIndex(uid: string, data: any[]) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { academicEngagement: cleanObject(data) });
}

// ──────────────────────────────────
// Outcome Alignment (Former Placement)
// ──────────────────────────────────
export async function saveOutcomeAlignment(uid: string, data: any) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { outcomeAlignment: cleanObject(data) });
}

// ──────────────────────────────────
// Final Academic Outcome Index (AOI)
// ──────────────────────────────────
export async function saveAOI(uid: string, data: any) {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { academicOutcomeIndex: cleanObject(data) });
}

// ──────────────────────────────────
// Legacy Support (Optional)
// ──────────────────────────────────
export async function savePlacementMetrics(
    uid: string,
    data: Record<string, any>
) {
    const ref = doc(db, "users", uid, "placementMetrics", "current");
    await setDoc(ref, {
        ...cleanObject(data),
        createdAt: serverTimestamp(),
    });
}

export async function getPlacementMetrics(uid: string) {
    const ref = doc(db, "users", uid, "placementMetrics", "current");
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
}

// ──────────────────────────────────
// Faculty helpers
// ──────────────────────────────────

export async function getAllStudents() {
    const [studentsSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "students"))),
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
    ]);

    const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return mergeStudentRecords(students, users);
}

/**
 * Listens for real-time updates to all students.
 */
export function onStudentsSnapshot(callback: (students: any[]) => void) {
    const studentsQuery = query(collection(db, "students"));
    const usersQuery = query(collection(db, "users"), where("role", "==", "student"));

    let latestStudents: any[] = [];
    let latestUsers: any[] = [];

    const emitMerged = () => {
        callback(mergeStudentRecords(latestStudents, latestUsers));
    };

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
        latestStudents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        emitMerged();
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        latestUsers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        emitMerged();
    });

    return () => {
        unsubscribeStudents();
        unsubscribeUsers();
    };
}

/**
 * Listens for real-time updates to students within a specific department.
 */
export function onDepartmentStudentsSnapshot(department: string, callback: (students: any[]) => void) {
    const deptToFetch = department && department !== "All" ? normalizeDepartment(department) : department;
    const studentsQuery = deptToFetch && deptToFetch !== "All"
        ? query(collection(db, "students"), where("department", "==", deptToFetch))
        : query(collection(db, "students"));
    const usersQuery = deptToFetch && deptToFetch !== "All"
        ? query(collection(db, "users"), where("department", "==", deptToFetch))
        : query(collection(db, "users"));

    let latestStudents: any[] = [];
    let latestUsers: any[] = [];

    const emitMerged = () => {
        callback(mergeStudentRecords(latestStudents, latestUsers));
    };

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
        latestStudents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        emitMerged();
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        latestUsers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        emitMerged();
    });

    return () => {
        unsubscribeStudents();
        unsubscribeUsers();
    };
}

// ──────────────────────────────────
// Faculty & Students Specific (Senior Fix)
// ──────────────────────────────────

export async function getFacultyDocument(uid: string) {
    const ref = doc(db, "faculty", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function updateFacultyProfile(uid: string, data: Record<string, any>) {
    const ref = doc(db, "faculty", uid);
    await updateDoc(ref, cleanObject(data));
}

export function onFacultyStudentsSnapshot(department: string, callback: (students: any[]) => void) {
    // Normalize to Canonical Form
    const dept = normalizeDepartment(department);
    const studentsQuery = query(collection(db, "students"), where("department", "==", dept));
    const usersQuery = query(collection(db, "users"), where("department", "==", dept));

    let latestStudents: any[] = [];
    let latestUsers: any[] = [];

    const emitMerged = () => {
        callback(mergeStudentRecords(latestStudents, latestUsers));
    };

    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
        latestStudents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        emitMerged();
    }, (error) => {
        console.error("onFacultyStudentsSnapshot students error:", error);
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        latestUsers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        emitMerged();
    }, (error) => {
        console.error("onFacultyStudentsSnapshot users error:", error);
    });

    return () => {
        unsubscribeStudents();
        unsubscribeUsers();
    };
}

/**
 * Checks if a student with given registerNo already exists in students collection.
 */
export async function checkStudentExists(registerNumber: string) {
    const ref = doc(db, "students", registerNumber);
    const snap = await getDoc(ref);
    return snap.exists();
}

/**
 * Adds a new student using registerNo as document ID into "users" collection (UNIFIED).
 */
export async function addStudent(registerNumber: string, data: Record<string, any>) {
    const ref = doc(db, "users", registerNumber); // Use registerNumber as ID for pre-registered students

    const studentData = {
        name: data.name || "",
        registerNumber,
        registerNo: registerNumber, // Compatibility
        role: "student",
        department: normalizeDepartment(data.department || ""),
        year: data.year || 1,
        section: data.section || "A",
        email: data.email || "",
        phone: data.phone || "",
        cgpa: data.cgpa || 0,
        priScore: data.priScore || 0,
        riskLevel: data.riskLevel || "High",
        arrears: data.arrears || 0,
        weakestModule: data.weakestModule || "None",
        lastUpdated: serverTimestamp(),
        readinessScore: data.readinessScore || 0,
        createdAt: new Date(),
        updatedAt: serverTimestamp(),
    };

    // Dual-write to both collections so admin and faculty dashboards stay perfectly synced
    // before the student does their very first login.
    await setDoc(ref, studentData, { merge: true });

    // Also write directly to the 'students' sub-system for Faculty dashboards
    const studentDbRef = doc(db, "students", registerNumber);
    await setDoc(studentDbRef, studentData, { merge: true });
}

/**
 * Updates an existing student record in "users" collection.
 */
export async function updateStudent(registerNumber: string, data: Record<string, any>) {
    const ref = doc(db, "users", registerNumber);
    const updatedData = {
        ...data,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    await updateDoc(ref, cleanObject(updatedData));
}

