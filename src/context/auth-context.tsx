"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as AppUser, Role } from "@/types";
import { auth, db } from "@/lib/firebase";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    updatePassword,
    reauthenticateWithPopup,
    signInWithRedirect,
    getRedirectResult,
    User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import {
    createUserDocument,
    getUserDocument,
    updateUserDocument,
    getFacultyDocument,
    getUserByEmail,
} from "@/lib/firestore";
import { normalizeDepartment } from "@/lib/department-core";
import { logSystemIssue } from "@/lib/issue-logger";

// ---- Auth Context ----
interface AuthContextType {
    user: AppUser | null;
    isLoading: boolean;
    login: (data: { email: string; password: string }) => Promise<void>;
    signup: (data: any) => Promise<void>;
    googleLogin: (preferredRole?: Role) => Promise<void>;
    logout: () => void;
    updateUserProfile: (updates: Partial<AppUser> & { newPassword?: string }) => void;
    handleRoleRedirection: (appUser: AppUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Build an AppUser object from a Firestore document snapshot.
 */
function firestoreDocToAppUser(docData: Record<string, any>): AppUser {
    return {
        id: docData.id,
        name: docData.name ?? "",
        email: docData.email ?? "",
        role: docData.role?.toLowerCase(), // Explicit - no default
        approved: docData.approved,
        gender: docData.gender ?? "OTHER",
        avatarUrl: docData.avatarUrl,
        department: docData.department,
        designation: docData.designation,
        registerNumber: docData.registerNumber ?? docData.registerNo,
        registerNo: docData.registerNo,
        priScore: docData.priScore,
        cgpa: docData.cgpa,
        riskLevel: docData.riskLevel,
        weakestModule: docData.weakestModule,
        lastUpdated: docData.lastUpdated,
        degree: docData.degree,
        yearOfStudy: docData.yearOfStudy,
        currentSemester: docData.currentSemester,
        totalSemesters: docData.totalSemesters,
        academicRecords: docData.academicRecords,
        certifications: docData.certifications,
        competitions: docData.competitions,
        extraCurricular: docData.extraCurricular,
        placementMetrics: docData.placementMetrics,
        placement: docData.placement,
        arrears: docData.arrears,
        attendance: docData.attendance,
        isProfileComplete: docData.isProfileComplete ?? docData.profileCompleted ?? false,
        areGradesComplete: docData.areGradesComplete ?? docData.gradesCompleted ?? false,

        // New Academic Modules
        academicEnrichment: docData.academicEnrichment,
        appliedKnowledge: docData.appliedKnowledge,
        academicEngagement: docData.academicEngagement,
        outcomeAlignment: docData.outcomeAlignment,

        // Explicit Profiles
        coreAcademicProfile: docData.coreAcademicProfile,
        roleTrackProfile: docData.roleTrackProfile,
        coreAcademicTopics: docData.coreAcademicTopics,

        // Final Calc
        academicOutcomeIndex: docData.academicOutcomeIndex
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // ─── Firebase Auth listener ───
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                try {
                    // Check if we already have a user state from a manual login/signup flow
                    // to prevent double-redirection or race conditions.
                    if (user && user.id === firebaseUser.uid && !window.location.pathname.includes("login")) {
                        setIsLoading(false);
                        return;
                    }

                    let docData = await getUserDocument(firebaseUser.uid);

                    // PRIORITY: If a student record exists in "users" by email, it OVERRIDES everything (UID doc or faculty collection doc).
                    if (firebaseUser.email) {
                        const emailData = await getUserByEmail(firebaseUser.email);
                        if (emailData && (emailData as any).role === "student") {
                            docData = emailData as any;
                            if (emailData.id !== firebaseUser.uid) {
                                await createUserDocument(firebaseUser.uid, { ...emailData, uid: firebaseUser.uid });
                            }
                        }
                    }

                    // FALLBACK: Only check isolated collections if we haven't found a record yet
                    if (!docData) {
                        const studentSnap = await getDoc(doc(db, "students", firebaseUser.uid));
                        if (studentSnap.exists()) {
                            docData = { ...studentSnap.data(), role: "student" } as any;
                        } else {
                            const facultyData = await getFacultyDocument(firebaseUser.uid);
                            if (facultyData && (facultyData as any).role !== "student") {
                                docData = { ...facultyData, role: "faculty" } as any;
                            }
                        }
                    }

                    const providerId = firebaseUser.providerData[0]?.providerId || "password";
                    const hasPwd = firebaseUser.providerData.some(p => p.providerId === "password");

                    if (docData) {
                        const anyData = docData as any;
                        // FORCE ADMIN CHECK (Internal override)
                        if (firebaseUser.email?.toLowerCase() === "heyydean001@gmail.com") {
                            anyData.role = "admin";
                            anyData.approved = true;
                            if (anyData.role !== "admin") {
                                await updateUserDocument(firebaseUser.uid, { role: "admin", approved: true });
                            }
                        }

                        const appUser = {
                            ...firestoreDocToAppUser(docData),
                            loginProvider: providerId,
                            hasPassword: hasPwd
                        };
                        setUser(appUser);

                        // Centralized mandatory flow check
                        handleRoleRedirection(appUser, true);
                    } else {
                        // Truly New User or Skeleton in-transition
                        const storedRole = localStorage.getItem("alsa_preferred_role") as Role;

                        const skeletonUser: AppUser = {
                            id: firebaseUser.uid,
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            name: firebaseUser.displayName || "New User",
                            role: (storedRole || null) as any,
                            gender: "OTHER",
                            loginProvider: providerId,
                            hasPassword: hasPwd
                        } as AppUser;
                        setUser(skeletonUser);

                        // Only redirect if we are NOT on a special page (like select-role)
                        const path = window.location.pathname;
                        if (storedRole && !path.includes("select-role") && !path.includes("complete-profile")) {
                            handleRoleRedirection(skeletonUser);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
                localStorage.removeItem("alsa_preferred_role");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    // ─── Email / Password Login ───
    const login = async (data: { email: string; password: string }) => {
        const { email, password } = data;

        const credential = await signInWithEmailAndPassword(auth, email, password);
        let docData = await getUserDocument(credential.user.uid);

        if (!docData) {
            const facultyData = await getFacultyDocument(credential.user.uid);
            if (facultyData) {
                docData = { ...facultyData, role: "faculty" } as any;
            }
        }

        if (!docData) {
            throw new Error("Account data not found. Please register first.");
        }

        const hasPwd = credential.user.providerData.some(p => p.providerId === "password");
        const appUser = {
            ...firestoreDocToAppUser(docData),
            loginProvider: credential.user.providerData[0]?.providerId || "password",
            hasPassword: hasPwd
        };
        setUser(appUser);

        if (appUser.email === "heyydean001@gmail.com" && appUser.role !== "admin") {
            await updateUserDocument(appUser.id, { role: "admin", approved: true });
            appUser.role = "admin";
            appUser.approved = true;
        }

        handleRoleRedirection(appUser);
    };

    /**
     * Centralized Redirection Engine
     * @param passive If true, only redirects if the user is NOT already on the correct flow page.
     */
    const handleRoleRedirection = (appUser: AppUser, passive: boolean = false) => {
        const path = window.location.pathname;

        // 1. Handle Students
        if (appUser.role === "student") {
            const isComplete = (appUser.isProfileComplete || appUser.profileCompleted) && !!appUser.currentSemester;

            if (!isComplete) {
                if (!path.startsWith("/complete-profile")) router.push("/complete-profile");
            } else if (!appUser.areGradesComplete) {
                if (!path.startsWith("/dashboard/student/academic-records/setup")) {
                    router.push("/dashboard/student/academic-records/setup");
                }
            } else {
                if (!passive || (path === "/" || path === "/login" || path === "/signup")) {
                    router.push("/dashboard/student");
                }
            }
            return;
        }

        // 2. Handle Admin
        if (appUser.role === "admin") {
            if (!passive || (path === "/" || path === "/login" || path === "/signup")) {
                router.push("/admin/dashboard");
            }
            return;
        }

        // 3. Handle Faculty
        if (appUser.role === "faculty") {
            const isComplete = !!appUser.department && !!appUser.designation;
            if (!isComplete) {
                if (!path.startsWith("/complete-faculty-profile")) router.push("/complete-faculty-profile");
            } else if (!appUser.approved) {
                if (!path.startsWith("/faculty/pending-approval")) router.push("/faculty/pending-approval");
            } else {
                if (!passive || (path === "/" || path === "/login" || path === "/signup")) {
                    router.push("/dashboard/faculty");
                }
            }
            return;
        }

        // 4. Default: No role assigned yet (New User)
        if (!path.includes("select-role")) {
            router.push("/select-role");
        }
    };

    // ─── Email / Password Signup ───
    const signup = async (data: any) => {
        const { email, password, name, role, gender, ...academicData } = data;

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        // Set display name on Firebase Auth profile
        await updateProfile(credential.user, { displayName: name });

        const isDean = email.toLowerCase() === "heyydean001@gmail.com";
        const finalRole = isDean ? "admin" : role;

        if (!finalRole) {
            throw new Error("User role is required for registration.");
        }

        const finalApproved = isDean ? true : (finalRole === "faculty" ? false : true); // Students auto-approved, faculty pending

        // Create Firestore user document
        const userData: Record<string, any> = {
            name,
            email,
            role: finalRole,
            gender: gender ?? "OTHER",
            approved: finalApproved,
            profileCompleted: finalRole === "faculty",
            gradesCompleted: false,
            isProfileComplete: finalRole === "faculty",
            areGradesComplete: false,
            ...academicData,
        };

        await createUserDocument(uid, userData);

        if (finalRole === "student") {
            await setDoc(doc(db, "students", uid), {
                uid,
                name: name || "",
                email: email || "",
                department: academicData.department || "",
                cgpa: parseFloat(academicData.cgpa) || 0,
                pri: 0,
                riskLevel: "High",
                arrears: 0,
                weakestModule: "None",
                updatedAt: new Date(),
            }, { merge: true });
        } else if (finalRole === "faculty") {
            await setDoc(doc(db, "faculty", uid), {
                uid,
                name: name || "",
                email: email || "",
                department: academicData.department || "",
                approved: finalApproved,
                designation: academicData.designation || "",
            }, { merge: true });
        }

        const hasPwd = credential.user.providerData.some(p => p.providerId === "password");
        const appUser = {
            ...firestoreDocToAppUser({ id: uid, ...userData }),
            loginProvider: credential.user.providerData[0]?.providerId || "password",
            hasPassword: hasPwd
        };
        setUser(appUser);
        toast.success("Account created successfully");

        handleRoleRedirection(appUser);
    };

    // ─── Google Login ───
    const googleLogin = async (preferredRole?: Role) => {
        try {
            // Store preference in session for onAuthStateChanged hook
            if (preferredRole) {
                localStorage.setItem("alsa_preferred_role", preferredRole);
            }

            const provider = new GoogleAuthProvider();
            let result;
            try {
                result = await signInWithPopup(auth, provider);
            } catch (popupError: any) {
                if (popupError.code === "auth/popup-blocked") {
                    console.log("Popup blocked, falling back to redirect...");
                    toast.info("Pop-up blocked. Redirecting to Google Login...");
                    await signInWithRedirect(auth, provider);
                    return; // Redirect will happen, execution stops here
                }
                throw popupError;
            }
            const firebaseUser = result.user;
            const uid = firebaseUser.uid;

            // --- 1. ADMIN CHECK (Highest Priority for specific email) ---
            const isDean = firebaseUser.email?.toLowerCase() === "heyydean001@gmail.com";
            if (isDean) {
                const existingDoc = await getUserDocument(uid);
                const userData: Record<string, any> = {
                    name: firebaseUser.displayName || "Dean",
                    email: firebaseUser.email,
                    role: "admin",
                    approved: true,
                };
                if (!existingDoc) {
                    await createUserDocument(uid, userData);
                } else if ((existingDoc as any).role !== "admin") {
                    await updateUserDocument(uid, { role: "admin", approved: true });
                }
                const adminUser = firestoreDocToAppUser({ id: uid, ...userData });
                setUser(adminUser);
                toast.success("Welcome back, Admin");
                router.push("/admin/dashboard");
                return;
            }

            // --- 2. UID SEARCH (Fastest & Main Way) ---
            const existing = await getUserDocument(uid);

            // PRIORITY: Respect the intent from login page
            if (preferredRole && existing && (existing as any).role !== preferredRole) {
                // User has an account but wants a DIFFERENT role.
                // We treat them as a "Skeleton" for the new role.
                const skeletonUser: AppUser = {
                    id: uid,
                    uid: uid,
                    email: firebaseUser.email || "",
                    name: firebaseUser.displayName || "New User",
                    role: preferredRole as any,
                    gender: "OTHER",
                    loginProvider: "google.com",
                    hasPassword: firebaseUser.providerData.some(p => p.providerId === "password")
                } as AppUser;
                setUser(skeletonUser);
                toast.info(`Creating a new ${preferredRole} profile...`);
                handleRoleRedirection(skeletonUser);
                return;
            }

            if (existing) {
                const appUser = {
                    ...firestoreDocToAppUser(existing),
                    loginProvider: "google.com",
                    hasPassword: firebaseUser.providerData.some(p => p.providerId === "password")
                };
                setUser(appUser);
                toast.success(`Logged in as ${appUser.role}`);
                handleRoleRedirection(appUser);
                return;
            }

            // --- 3. EMAIL RECOVERY (For Pre-registered or Stranded accounts) ---
            if (firebaseUser.email) {
                const emailRecord = await getUserByEmail(firebaseUser.email);

                // If they have an email record for exactly the role they want, migrate/link it.
                if (emailRecord && (emailRecord as any).role === preferredRole) {
                    const appUser = {
                        ...firestoreDocToAppUser(emailRecord),
                        id: uid, // Use new UID for context
                        uid: uid,
                        loginProvider: "google.com",
                        hasPassword: firebaseUser.providerData.some(p => p.providerId === "password")
                    };

                    // MIGRATION: If the old record used a different ID (e.g. Register Number),
                    // we CREATE a new document with UID and then potentially clean up the old one.
                    // If IDs already match, updateUserDocument handles it.
                    if (emailRecord.id !== uid) {
                        await createUserDocument(uid, { ...emailRecord, uid: uid });
                        // Note: We keep the old document for legacy dashboard consistency (Dual-sync)
                    } else {
                        await updateUserDocument(uid, { uid: uid });
                    }

                    setUser(appUser);
                    handleRoleRedirection(appUser);
                    return;
                }
            }

            // --- 4. SKELETON or RECOVERY (No UID document found) ---
            const storedRole = localStorage.getItem("alsa_preferred_role") as Role;
            const activeRole = preferredRole || storedRole || null;

            // Optional: Recovery check (only if we have a clear role intent)
            if (activeRole) {
                let recoveryData = await getUserByEmail(firebaseUser.email || "");
                if (!recoveryData) {
                    // Check stranded collections
                    const stuSnap = await getDoc(doc(db, "students", uid));
                    if (stuSnap.exists()) {
                        recoveryData = { id: stuSnap.id, ...stuSnap.data(), role: "student" } as any;
                    } else {
                        const facSnap = await getDoc(doc(db, "faculty", uid));
                        if (facSnap.exists()) {
                            recoveryData = { id: facSnap.id, ...facSnap.data(), role: "faculty" } as any;
                        }
                    }
                }

                if (recoveryData && (recoveryData as any).role === activeRole) {
                    const recoveredUser = {
                        ...firestoreDocToAppUser(recoveryData),
                        loginProvider: "google.com",
                        hasPassword: firebaseUser.providerData.some(p => p.providerId === "password")
                    };
                    await createUserDocument(uid, recoveryData as any); // Migrate to users collection
                    setUser(recoveredUser);
                    toast.success("Account recovered successfully!");
                    handleRoleRedirection(recoveredUser);
                    return;
                }
            }

            const skeletonUser: AppUser = {
                id: uid,
                uid: uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || "New User",
                role: activeRole as any,
                gender: "OTHER",
                loginProvider: "google.com",
                hasPassword: firebaseUser.providerData.some(p => p.providerId === "password")
            } as AppUser;

            setUser(skeletonUser);
            localStorage.removeItem("alsa_preferred_role"); // Clean up
            handleRoleRedirection(skeletonUser);
        } catch (error: any) {
            if (error.code === "auth/popup-closed-by-user") {
                toast.warning("Google Sign-In was cancelled.");
            } else {
                console.error("Google login error:", error);
                toast.error("Google Sign-In failed: " + error.message);

                // Centralized issue logging
                logSystemIssue({
                    errorType: "AUTH_ERROR",
                    errorMessage: `Google Login Failed: ${error.code} - ${error.message}`,
                    page: window.location.pathname,
                    role: "guest"
                });
            }
        }
    };

    // ─── Update Profile ───
    const updateUserProfileFn = async (updates: Partial<AppUser> & { newPassword?: string }) => {
        if (!user || !auth.currentUser) return;

        const { newPassword, ...otherUpdates } = updates;
        const updatedUser = { ...user, ...otherUpdates };
        setUser(updatedUser);

        try {
            // 1. Handle Password Update (if provided by Google user)
            if (newPassword) {
                try {
                    await updatePassword(auth.currentUser, newPassword);
                } catch (pwdErr: any) {
                    if (pwdErr.code === "auth/requires-recent-login") {
                        try {
                            const provider = new GoogleAuthProvider();
                            await reauthenticateWithPopup(auth.currentUser, provider);
                            await updatePassword(auth.currentUser, newPassword);
                            toast.success("Password successfully attached to your Google account.");
                        } catch (reauthErr: any) {
                            if (reauthErr.code !== "auth/popup-closed-by-user") {
                                toast.error("Re-authentication failed. Password not saved.");
                            }
                        }
                    } else {
                        toast.error("Failed to set password: " + pwdErr.message);
                    }
                }
            }

            // 2. Write to Firestore
            let firestoreUpdates: Record<string, any> = { ...otherUpdates };

            // Keep Firestore field names in sync
            if ("department" in otherUpdates && otherUpdates.department) {
                firestoreUpdates.department = normalizeDepartment(otherUpdates.department);
            }
            if ("isProfileComplete" in otherUpdates) {
                firestoreUpdates.profileCompleted = otherUpdates.isProfileComplete;
            }
            if ("areGradesComplete" in otherUpdates) {
                firestoreUpdates.gradesCompleted = otherUpdates.areGradesComplete;
            }

            // Use setDoc with merge to ensure the document is created if it doesn't exist
            const userRef = doc(db, "users", user.id);
            await setDoc(userRef, {
                ...firestoreUpdates,
                updatedAt: serverTimestamp(),
                // If initializing for first time, add email and name
                email: user.email,
                name: user.name,
                uid: user.id
            }, { merge: true });

            // 3. Synchronize to Role-Specific Collections for Dashboard Queries
            if (user.role === "student") {
                await setDoc(doc(db, "students", user.id), firestoreUpdates, { merge: true });
            } else if (user.role === "faculty") {
                await setDoc(doc(db, "faculty", user.id), firestoreUpdates, { merge: true });
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
            toast.error("Failed to save profile changes.");
            throw err;
        }
    };

    // ─── Logout ───
    const logout = async () => {
        await signOut(auth);
        setUser(null);
        router.push("/login");
        toast.success("Logged out successfully");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                signup,
                googleLogin,
                logout,
                updateUserProfile: updateUserProfileFn,
                handleRoleRedirection
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
