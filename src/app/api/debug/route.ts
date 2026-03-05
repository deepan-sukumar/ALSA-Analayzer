import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { calculatePRI } from "@/lib/placement-calculations";

export async function GET() {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const allDeepaks: any[] = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.toLowerCase().includes("deepak")) {
                const priObj = calculatePRI(data as any);
                allDeepaks.push({
                    id: doc.id,
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
        return NextResponse.json({ error: e.message });
    }
}
