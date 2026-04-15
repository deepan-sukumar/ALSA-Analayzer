import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { calculatePRI } from "@/lib/calculations/placement-calculations";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const adminDb = admin.firestore();

export async function GET() {
    try {
        const snapshot = await adminDb.collection("users").get();

        const allDeepaks: any[] = [];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.name && data.name.toLowerCase().includes("deepak")) {
                const priObj = calculatePRI(data as any);
                allDeepaks.push({
                    id: docSnap.id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    priScoreSaved: data.priScore || 0,
                    priScoreCalculated: priObj.pri,
                    arrears: data.arrears || data.standingArrears || 0
                });
            }
        });

        return NextResponse.json({
            count: allDeepaks.length,
            deepaks: allDeepaks
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

