import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { calculatePRI, getPlacementReadiness } from "@/lib/calculations/placement-calculations";
import { normalizeDepartment } from "@/lib/core/department-core";

// Initialize Firebase Admin SDK inline (no separate module needed)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const adminDb = admin.firestore();

export async function POST() {
    try {
        const usersSnap = await adminDb.collection("users").where("role", "==", "student").get();
        if (usersSnap.empty) {
            return NextResponse.json({ success: true, count: 0, message: "No students found." });
        }

        let count = 0;
        let batches = 0;
        let batch = adminDb.batch();

        const commitChunkIfNeeded = async (force = false) => {
            if (count > 0 && (force || count % 400 === 0)) {
                await batch.commit();
                batches++;
                batch = adminDb.batch();
            }
        };

        for (const docSnap of usersSnap.docs as QueryDocumentSnapshot[]) {
            const data = docSnap.data();
            const studentId = data.registerNumber || data.registerNo || docSnap.id;
            if (!studentId) continue;

            const student = { id: docSnap.id, ...data } as any;
            const priResult = calculatePRI(student).pri;
            const readiness = getPlacementReadiness(student);
            const riskCategory = readiness.finalRisk?.label === "Low"
                ? "Ready"
                : (readiness.finalRisk?.label || "High");
            const normalizedDepartment = normalizeDepartment(data.department || "");

            const studentRef = adminDb.collection("students").doc(studentId);
            batch.set(studentRef, {
                ...data,
                registerNumber: data.registerNumber || data.registerNo || studentId,
                registerNo: data.registerNo || data.registerNumber || studentId,
                department: normalizedDepartment,
                priScore: priResult,
                cachedPRI: priResult,
                readinessScore: readiness.finalRisk?.index || 0,
                riskLevel: riskCategory,
                lastCalculated: new Date(),
                updatedAt: new Date(),
            }, { merge: true });

            count++;
            await commitChunkIfNeeded();
        }

        await commitChunkIfNeeded(true);

        return NextResponse.json({ success: true, count, batches, message: `Successfully synced ${count} students.` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

