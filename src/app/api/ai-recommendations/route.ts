import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

function generateFallbackRecommendations(student: any) {
    const drawbacks = [];
    const roadmap = [];

    const cgpa = parseFloat(student.cgpa) || 0;
    const standingArrears = parseInt(student.standingArrears || student.arrears || 0);
    const aptitudeScore = student.placementMetrics?.aptitudeScore || 0;
    const codingScore = student.placementMetrics?.codingScore || 0;
    const commScore = student.placementMetrics?.communicationScore || 0;
    const certCount = student.certifications?.length || 0;
    const enrichCount = student.enrichment?.length || 0;

    // Drawbacks Logic
    if (standingArrears > 0) {
        drawbacks.push({
            drawback: `Active Standing Arrears (${standingArrears})`,
            suggestion: `To fix this, you should focus only on passing these pending subjects first. Stop spending time on new skills until these are cleared. Register for the supplementary exams immediately.`
        });
        roadmap.push({
            week: "Week 1-2",
            priority: "Critical",
            focus: "Arrear Clearance & Core Academics",
            tasks: ["Identify arrear subjects and gather past question papers", "Dedicate 2 hours daily specifically for arrear subjects"]
        });
    }

    if (cgpa > 0 && cgpa < 6.5) {
        drawbacks.push({
            drawback: `Low Academic Performance (CGPA: ${cgpa})`,
            suggestion: `Top companies filter out students with a CGPA below 6.5. To fix this, aim to score very high grades in your current and upcoming semesters to pull your overall average up.`
        });
        if (roadmap.length === 0) {
            roadmap.push({
                week: "Week 1-2",
                priority: "Critical",
                focus: "Academic Revival",
                tasks: ["Review current semester syllabus", "Seek help from peers or faculty for difficult subjects"]
            });
        }
    }

    if (codingScore < 60) {
        drawbacks.push({
            drawback: `Weak Programming Skills (${codingScore}%)`,
            suggestion: `Your coding speed is too slow for technical rounds. To fix this, pick one language (like Python or Java) and solve 2 basic Data Structures and Algorithms problems every single day.`
        });
        roadmap.push({
            week: roadmap.length > 0 ? "Week 3-4" : "Week 1-2",
            priority: "High",
            focus: "DSA & Programming Logic",
            tasks: ["Solve 3-5 basic problems on LeetCode/HackerRank daily", "Master Arrays, Strings, and basic sorting algorithms"]
        });
    }

    if (aptitudeScore < 60) {
        drawbacks.push({
            drawback: `Below Average Aptitude (${aptitudeScore}%)`,
            suggestion: `You are failing standard math and logic tests. To fix this, practice 15 quantitative math questions (like Profit & Loss, Time & Speed) every evening using a timer.`
        });
        roadmap.push({
            week: roadmap.length > 0 ? (roadmap.length === 1 ? "Week 3-4" : "Week 5-6") : "Week 1-2",
            priority: "Moderate",
            focus: "Quantitative & Logical Reasoning",
            tasks: ["Practice 20 aptitude questions daily (Time & Work, Profit & Loss)", "Take two 30-minute timed mock tests per week"]
        });
    }

    if (commScore < 60) {
        drawbacks.push({
            drawback: `Communication Gaps (${commScore}%)`,
            suggestion: `You will struggle to pass HR rounds. To fix this, practice speaking English aloud for 15 minutes a day, and record yourself answering standard interview questions like 'Tell me about yourself'.`
        });
        if (roadmap.length < 3) {
            roadmap.push({
                week: roadmap.length === 0 ? "Week 1-2" : roadmap.length === 1 ? "Week 3-4" : "Week 5-6",
                priority: "Moderate",
                focus: "Verbal Articulation",
                tasks: ["Read one technical article out loud daily", "Participate in mock interviews or peer group discussions"]
            });
        }
    }

    if (certCount === 0 && enrichCount === 0) {
        drawbacks.push({
            drawback: `Empty Professional Portfolio`,
            suggestion: `Your resume has nothing extra to show. To fix this, enroll in one free online course (like AWS, Google, or Coursera) related to your field and finish the certification.`
        });
    }

    // Default if profile is absolutely flawless
    if (drawbacks.length === 0) {
        drawbacks.push({
            drawback: `Advanced Specialization Needed`,
            suggestion: `Profile is very strong across basic metrics. Shift focus to advanced topics (e.g., System Design, Cloud) or open-source contributions.`
        });
        roadmap.push({
            week: "Week 1-3",
            priority: "Standard",
            focus: "Advanced Technical Depth",
            tasks: ["Build a full-stack project or contribute to open-source", "Start learning System Design concepts"]
        });
        roadmap.push({
            week: "Week 4-6",
            priority: "Standard",
            focus: "Interview Polish",
            tasks: ["Schedule multiple mock interviews", "Prepare STAR format answers for behavioral questions"]
        });
    }

    return { drawbacks: drawbacks.slice(0, 5), roadmap: roadmap.slice(0, 3) };
}

export async function POST(req: Request) {
    try {
        const { student } = await req.json();

        if (!student) {
            return NextResponse.json({ error: "Student data is required" }, { status: 400 });
        }

        // If no API key is provided, safely fallback to algorithmic generation
        if (!process.env.GEMINI_API_KEY) {
            console.log("No GEMINI_API_KEY found, using algorithmic recommendations.");
            return NextResponse.json(generateFallbackRecommendations(student));
        }

        try {
            // Attempt GenAI processing if key exists
            const ai = new GoogleGenAI({});
            const certCount = student.certifications?.length || 0;
            const enrichCount = student.enrichment?.length || 0;
            const standingArrears = student.standingArrears || student.arrears || 0;
            const cgpa = student.cgpa || "N/A";
            const aptitudeScore = student.placementMetrics?.aptitudeScore || 0;
            const codingScore = student.placementMetrics?.codingScore || 0;
            const commScore = student.placementMetrics?.communicationScore || 0;
            const roleTrack = student.roleTrackProfile?.trackSelected || student.outcomeAlignment?.trackSelected || "Not Selected";

            const prompt = `
            You are an expert academic and placement counselor.
            Please analyze the following student profile and identify explicitly what they are weak in (the faults or weaknesses), 
            along with corrections or ideas to make those areas strong. Also provide a 6-week roadmap.

            Student Profile Summary:
            - Department: ${student.department || "N/A"}
            - CGPA: ${cgpa}
            - Standing Arrears: ${standingArrears}
            - Certifications Count: ${certCount}
            - Enrichment Activities Count: ${enrichCount}
            - Aptitude Score: ${aptitudeScore}%
            - Coding Score: ${codingScore}%
            - Communication Score: ${commScore}%
            - Target Role/Track: ${roleTrack}

            If they have arrears, this is a critical fault.
            If their CGPA is low (< 6.5), this is a high-priority academic weakness.
            If their aptitude or coding scores are low (< 60%), these indicate severe skill gaps.
            If they lack certifications or enrichment, they have a weak portfolio.

            VITAL INSTRUCTION: For the "suggestion" field, do NOT use complex corporate jargon. Use a very simple, everyday English explanation of the exact idea to improve. 
            Start the suggestion by directly explaining the 'why' followed by 'To fix this, you should...'. 
            Example: "You are failing standard math tests. To fix this, practice 15 quantitative math questions every evening using a timer."

            Return exactly 3-5 weaknesses/faults and a 6-phase roadmap (Weeks 1 to 6 or grouped like Week 1-2, etc.).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.7,
                    responseModalities: ["TEXT"],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            drawbacks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        drawback: { type: Type.STRING, description: "Explicit statement of the fault, weakness, or gap" },
                                        suggestion: { type: Type.STRING, description: "Simple, easy-to-understand explanation of the idea to improve. Must be written in plain English, starting with a clear action." }
                                    },
                                    required: ["drawback", "suggestion"]
                                }
                            },
                            roadmap: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        week: { type: Type.STRING, description: "e.g., Week 1-2: Core Fixes" },
                                        priority: { type: Type.STRING, description: "Must be one of: Critical, High, Moderate, Standard" },
                                        focus: { type: Type.STRING, description: "Main theme of the week" },
                                        tasks: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING, description: "Specific actionable task" }
                                        }
                                    },
                                    required: ["week", "priority", "focus", "tasks"]
                                }
                            }
                        },
                        required: ["drawbacks", "roadmap"]
                    }
                }
            });

            const textResponse = response.text || "{}";
            const result = JSON.parse(textResponse);

            return NextResponse.json({
                drawbacks: result.drawbacks || [],
                roadmap: result.roadmap || []
            });

        } catch (genAiError) {
            // Safely fallback to algorithmic generation if Gemini quota exceeded or network fails
            console.error("Gemini AI failed, using algorithmic fallback. Error:", genAiError);
            return NextResponse.json(generateFallbackRecommendations(student));
        }

    } catch (error: unknown) {
        console.error("General Error in recommendations route:", error);
        return NextResponse.json(
            { error: "Failed to generate AI recommendations", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
