"use client";

import { useEffect, useState } from "react";
import { getPlacementReadiness, APTITUDE_TOPICS } from "@/lib/calculations/placement-calculations";
import { User, PlacementMetrics } from "@/types";

export default function TestAptitudePage() {
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        const runTests = () => {
            const testResults = [];

            // Mock User Factory
            const createMockUser = (aptitude: any): User => {
                return {
                    id: 'test-user',
                    name: 'Test Student',
                    email: 'test@example.com',
                    role: 'student',
                    gender: 'MALE',
                    cgpa: 8.5,
                    standingArrears: 0,
                    placementMetrics: {
                        aptitude: {
                            completionPercentage: 0,
                            topics: [],
                            quantitative: [],
                            logical: [],
                            dataInterpretation: [],
                            verbal: [],
                            confidence: {},
                            ...aptitude
                        },
                        technical: {
                            languages: [{ name: 'Java', level: 'Advanced' }],
                            dsaTopics: ['Arrays', 'Trees', 'Graph', 'DP', 'Stack'], // 5 topics
                            dbTopics: ['SQL Basics']
                        },
                        communication: {
                            fluency: 80,
                            checklists: ['Self Introduction', 'Project Explanation']
                        },
                        aptitudeScore: 0,
                        codingScore: 0,
                        communicationScore: 0,
                        mockInterviewScore: 0,
                        internshipCompleted: false
                    }
                } as User;
            };

            // Test 1: Full Coverage, High Confidence
            const user1 = createMockUser({
                quantitative: APTITUDE_TOPICS.QUANTITATIVE,
                logical: APTITUDE_TOPICS.LOGICAL,
                dataInterpretation: APTITUDE_TOPICS.DATA_INTERPRETATION,
                verbal: APTITUDE_TOPICS.VERBAL,
                confidence: APTITUDE_TOPICS.QUANTITATIVE.reduce((acc: any, t: string) => ({ ...acc, [t]: 'High' }), {})
            });
            const analysis1 = getPlacementReadiness(user1);
            testResults.push({
                name: "Test 1: Full Coverage, High Confidence",
                pri: analysis1.pri,
                tier: analysis1.tier,
                risk: analysis1.finalRisk?.label,
                passed: analysis1.tier === "Ready"
            });

            // Test 2: Partial Coverage
            const user2 = createMockUser({
                quantitative: APTITUDE_TOPICS.QUANTITATIVE.filter((t: string) => t !== "Probability" && t !== "Permutation & Combination"),
                logical: APTITUDE_TOPICS.LOGICAL.filter((t: string) => t !== "Seating Arrangement"),
                dataInterpretation: APTITUDE_TOPICS.DATA_INTERPRETATION,
                verbal: APTITUDE_TOPICS.VERBAL,
                confidence: {}
            });
            const analysis2 = getPlacementReadiness(user2);
            testResults.push({
                name: "Test 2: Missing Probability, P&C, Seating",
                pri: analysis2.pri,
                tier: analysis2.tier,
                risk: analysis2.finalRisk?.label,
                passed: analysis2.pri < 100
            });

            // Test 3: Low Quant Coverage (High Risk Trigger)
            const lowQuantTopics = APTITUDE_TOPICS.QUANTITATIVE.slice(0, 5);
            const user3 = createMockUser({
                quantitative: lowQuantTopics,
                logical: APTITUDE_TOPICS.LOGICAL,
                dataInterpretation: APTITUDE_TOPICS.DATA_INTERPRETATION,
                verbal: APTITUDE_TOPICS.VERBAL,
                confidence: {}
            });
            const analysis3 = getPlacementReadiness(user3);
            testResults.push({
                name: "Test 3: Low Quant Coverage",
                pri: analysis3.pri,
                tier: analysis3.tier,
                risk: analysis3.finalRisk!.label,
                passed: analysis3.tier === "High" || analysis3.tier === "Moderate"
            });

            setResults(testResults);
        };

        runTests();
    }, []);

    return (
        <div className="p-10 font-mono">
            <h1 className="text-2xl font-bold mb-4">Aptitude Module Logic Verification</h1>
            <div className="space-y-4">
                {results.map((res, i) => (
                    <div key={i} className={`p-4 border rounded ${res.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h2 className="font-bold">{res.name}</h2>
                        <pre className="text-xs mt-2 whitespace-pre-wrap">
                            {JSON.stringify(res, null, 2)}
                        </pre>
                        <div className="mt-2 text-sm font-bold">
                            Result: {res.passed ? "PASSED ✅" : "FAILED ❌"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

