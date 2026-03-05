import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type IssuePriority = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "resolved";
export type ErrorType = "API_ERROR" | "404" | "AUTH_ERROR" | "CALCULATION_ERROR" | "UI_ERROR" | "UNKNOWN";
export type UserRole = "student" | "faculty" | "admin" | "system" | "guest";

export interface LogIssueParams {
    role?: UserRole;
    userId?: string;
    userName?: string;
    department?: string;
    page: string;
    errorType: ErrorType;
    errorMessage: string;
}

/**
 * Automatically determines priority based on error type if not explicitly provided.
 */
function determinePriority(errorType: ErrorType): IssuePriority {
    switch (errorType) {
        case "CALCULATION_ERROR":
            return "critical";
        case "AUTH_ERROR":
            return "high";
        case "404":
        case "API_ERROR":
            return "medium";
        case "UI_ERROR":
        case "UNKNOWN":
        default:
            return "low";
    }
}

/**
 * Logs an issue to the centralized system_issues Firestore collection.
 * Does not block the main thread; runs asynchronously.
 */
export async function logSystemIssue(params: LogIssueParams): Promise<void> {
    try {
        const priority = determinePriority(params.errorType);

        const issueData = {
            ...params,
            role: params.role || "SYSTEM",
            userId: params.userId || "anonymous",
            userName: params.userName || "Anonymous User",
            department: params.department || "N/A",
            status: "open" as IssueStatus,
            priority,
            resolutionNote: "",
            timestamp: serverTimestamp(), // Firestore timestamp
        };

        await addDoc(collection(db, "system_issues"), issueData);
        // Silently succeed so it doesn't interrupt UX
    } catch (e) {
        // If the logger itself fails, log to console but do not crash the app
        console.error("Critical Failure: Unable to log system issue to datastore.", e);
    }
}
