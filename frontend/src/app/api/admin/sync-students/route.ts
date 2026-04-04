import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

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

        const batch = adminDb.batch();
        let count = 0;

        usersSnap.forEach((docSnap: QueryDocumentSnapshot) => {
            const data = docSnap.data();
            const studentId = data.id || data.registerNumber || data.registerNo;
            if (!studentId) return;

            // Simplified recalculation since we just want to prove the logic
            const cgpa = typeof data.cgpa === 'number' ? data.cgpa : parseFloat(data.cgpa || "0");
            const standingArrears = data.standingArrears || data.arrears || 0;
            const academicScore = ((cgpa / 10) * 100) * 0.40;

            let aptitudeScore = 0;
            if (data.placementMetrics?.detailedAptitude) {
                let totalCoverage = 0; let numTopics = 0;
                for (const cat of Object.values(data.placementMetrics.detailedAptitude) as any[]) {
                    if (cat.topics) {
                        for (const top of Object.values(cat.topics) as any[]) {
                            totalCoverage += Number(top.coverage) || 0; numTopics++;
                        }
                    }
                }
                aptitudeScore = (numTopics > 0 ? (totalCoverage / numTopics) : 0) * 0.10;
            } else if (data.placementMetrics?.aptitudeScore) {
                aptitudeScore = data.placementMetrics.aptitudeScore * 0.10;
            }

            let coreScore = 0;
            if (data.coreAcademicTopics && data.coreAcademicTopics.length > 0) {
                let totalProgress = 0;
                for (const t of data.coreAcademicTopics) {
                    if (t.status === "Completed") totalProgress += 100;
                    else if (t.status === "In Progress") totalProgress += 50;
                }
                coreScore = (totalProgress / data.coreAcademicTopics.length) * 0.25;
            }

            let roleScore = 0;
            if (data.roleTrackProfile?.trackSelected) {
                roleScore = (data.roleTrackProfile.roleSkillScore || 0) * 0.15;
            }

            let enrichmentScore = 0;
            if (data.academicEnrichment) {
                const enr = data.academicEnrichment;
                const certsCount = enr.certifications?.length || 0;
                let certScore = 0;
                if (certsCount >= 3) certScore = 100;
                else if (certsCount === 2) certScore = 70;
                else if (certsCount === 1) certScore = 40;
                const pubScore = enr.publications?.length > 0 ? 10 : 0;
                const compScore = enr.competitions?.length > 0 ? 15 : 0;
                const portScore = enr.portfolioLink ? 20 : 0;
                enrichmentScore = Math.min(100, certScore + pubScore + compScore + portScore) * 0.10;
            }

            const arrearPenalty = standingArrears * 5;
            const rawPri = Math.max(0, (academicScore + coreScore + roleScore + aptitudeScore + enrichmentScore) - arrearPenalty);
            const priResult = Math.round(Math.min(100, rawPri));

            let riskCategory = "Ready";
            if (priResult < 40) riskCategory = "Critical";
            else if (priResult < 60) riskCategory = "High";
            else if (priResult < 75) riskCategory = "Moderate";

            const studentRef = adminDb.collection("students").doc(studentId);
            batch.set(studentRef, {
                ...data,
                priScore: priResult,
                riskLevel: riskCategory
            }, { merge: true });

            count++;
        });

        await batch.commit();

        return NextResponse.json({ success: true, count, message: `Successfully synced ${count} students.` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
