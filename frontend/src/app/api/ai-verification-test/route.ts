import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const DIFFICULTY_PLAN = [
    "easy", "easy", "easy", "easy", "easy", "easy",
    "medium", "medium", "medium",
    "hard"
] as const;
const TARGET_QUESTION_COUNT = DIFFICULTY_PLAN.length;
const FORBIDDEN_PATTERNS = [
    /which option relates to/i,
    /which of the following belongs to/i,
    /which concept is associated with/i,
    /which of the following matches/i
];

type Difficulty = "easy" | "medium" | "hard";
type Question = {
    id: string;
    topic: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    difficulty: Difficulty;
};
type QuestionPayload = {
    questions: Question[];
    meta: {
        source: "ai" | "system_fallback";
        aiStatus: "ready" | "under_progress" | "unavailable";
        note: string;
        retryAfterMs: number;
    };
};

function withQuestionMeta(
    questions: Question[],
    source: "ai" | "system_fallback",
    aiStatus: "ready" | "under_progress" | "unavailable",
    note: string,
    retryAfterMs: number
): QuestionPayload {
    return {
        questions,
        meta: { source, aiStatus, note, retryAfterMs }
    };
}

const fallbackTemplates: Record<Difficulty, (topic: string) => Omit<Question, "id" | "topic" | "difficulty">> = {
    easy: (topic) => ({
        questionText: `A junior student says "${topic}" is only about memorizing definitions. Which response is conceptually correct?`,
        options: [
            `It is mainly about understanding why core principles of ${topic} work in practice.`,
            `It focuses only on syntax and not on behavior.`,
            `It is useful only for interview theory questions.`,
            `It has no relation to real-world systems.`
        ],
        correctAnswer: `It is mainly about understanding why core principles of ${topic} work in practice.`
    }),
    medium: (topic) => ({
        questionText: `When applying ${topic} to solve a problem, what should be decided first to avoid wrong implementation?`,
        options: [
            `The underlying constraints and assumptions that ${topic} depends on.`,
            `The IDE theme and project naming convention.`,
            `The shortest variable names for faster typing.`,
            `The number of comments in each file.`
        ],
        correctAnswer: `The underlying constraints and assumptions that ${topic} depends on.`
    }),
    hard: (topic) => ({
        questionText: `A system based on ${topic} performs well in testing but fails under production load. What is the most defensible first analysis step?`,
        options: [
            `Re-evaluate whether the original ${topic} assumptions still hold under real workload patterns.`,
            `Increase random retries without measuring root cause.`,
            `Disable logging permanently to save resources.`,
            `Rewrite all modules immediately without profiling.`
        ],
        correctAnswer: `Re-evaluate whether the original ${topic} assumptions still hold under real workload patterns.`
    })
};

function normalizeDifficulty(input: string): Difficulty | null {
    const normalized = String(input || "").trim().toLowerCase();
    if (normalized === "easy" || normalized === "medium" || normalized === "hard") return normalized;
    return null;
}

function isConceptualEnough(questionText: string) {
    if (!questionText || questionText.length < 20) return false;
    return !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(questionText));
}

function buildFallbackQuestion(topic: string, difficulty: Difficulty, index: number): Question {
    const template = fallbackTemplates[difficulty](topic);
    return {
        id: `fallback-${Date.now()}-${index}`,
        topic,
        questionText: template.questionText,
        options: template.options,
        correctAnswer: template.correctAnswer,
        difficulty
    };
}

function generateFallbackQuestions(topics: string[]) {
    const sourceTopics = topics.length > 0 ? topics : ["General Academic Concepts"];
    return DIFFICULTY_PLAN.map((difficulty, index) => {
        const topic = sourceTopics[index % sourceTopics.length];
        return buildFallbackQuestion(topic, difficulty, index);
    });
}

function sanitizeTopics(input: unknown): string[] {
    if (!Array.isArray(input)) return [];

    const cleaned = input
        .map((topic) => String(topic || "").trim())
        .filter((topic) => topic.length > 0)
        .map((topic) => topic.slice(0, 80));

    return Array.from(new Set(cleaned)).slice(0, 30);
}

function sanitizeAIQuestions(rawQuestions: any[]): Question[] {
    const sanitized: Question[] = [];
    for (let i = 0; i < (rawQuestions || []).length; i++) {
        const q = rawQuestions[i] || {};
        const difficulty = normalizeDifficulty(q.difficulty);
        const questionText = String(q.questionText || q.question || "").trim();
        const topic = String(q.topic || "General Academic Concepts").trim();
        const rawOptions: string[] = Array.isArray(q.options)
            ? q.options
                .map((opt: unknown) => String(opt || "").trim())
                .filter((opt: string) => opt.length > 0)
            : [];
        const options: string[] = Array.from(new Set<string>(rawOptions));

        if (!difficulty || !isConceptualEnough(questionText) || options.length !== 4) {
            continue;
        }

        let correctAnswer = String(q.correctAnswer || "").trim();
        if (!options.includes(correctAnswer)) {
            const match = options.find((opt) => opt.toLowerCase() === correctAnswer.toLowerCase());
            correctAnswer = match || options[0];
        }

        sanitized.push({
            id: `ai-${Date.now()}-${i}`,
            topic: topic || "General Academic Concepts",
            questionText,
            options,
            correctAnswer,
            difficulty
        });
    }
    return sanitized;
}

function enforceDifficultyPlan(aiQuestions: Question[], topics: string[]): Question[] {
    const sourceTopics = topics.length > 0 ? topics : ["General Academic Concepts"];
    const grouped: Record<Difficulty, Question[]> = {
        easy: aiQuestions.filter((q) => q.difficulty === "easy"),
        medium: aiQuestions.filter((q) => q.difficulty === "medium"),
        hard: aiQuestions.filter((q) => q.difficulty === "hard")
    };

    const usedQuestionText = new Set<string>();
    const finalQuestions: Question[] = [];

    DIFFICULTY_PLAN.forEach((difficulty, index) => {
        let picked = grouped[difficulty].find((q) => !usedQuestionText.has(q.questionText.toLowerCase()));
        if (picked) {
            grouped[difficulty] = grouped[difficulty].filter((q) => q !== picked);
        } else {
            const topic = sourceTopics[index % sourceTopics.length];
            picked = buildFallbackQuestion(topic, difficulty, index);
        }

        usedQuestionText.add(picked.questionText.toLowerCase());
        finalQuestions.push({ ...picked, id: `final-${Date.now()}-${index}` });
    });

    return finalQuestions.slice(0, TARGET_QUESTION_COUNT);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const topics = sanitizeTopics(body?.topics);

        if (topics.length === 0) {
            return NextResponse.json({ error: "Topics array is required" }, { status: 400 });
        }

        const hasValidAnthropic = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("your_");
        const hasValidGemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_");

        if (!hasValidAnthropic && !hasValidGemini) {
            console.log("No valid AI API keys found, using fallback questions.");
            return NextResponse.json(
                withQuestionMeta(
                    generateFallbackQuestions(topics),
                    "system_fallback",
                    "unavailable",
                    "AI question engine is unavailable. Showing system-generated questions.",
                    0
                )
            );
        }

        try {
            const prompt = `You are an AI academic question generator for a student verification system.

Your task is to generate concept-based multiple choice questions based on the topics selected by the student.

INPUT:
Selected Topics = [${topics.join(", ")}]

The questions must test whether the student truly understands the concepts from the selected topics.

TEST FORMAT:
Generate exactly ${TARGET_QUESTION_COUNT} questions.

Difficulty distribution:
6 Easy
3 Medium
1 Hard

IMPORTANT RULES:
1. Questions must be directly related to the selected topics.
2. Questions must test conceptual understanding.
3. Do NOT generate questions like: "Which option relates to <topic>?" or "Which of the following belongs to <topic>?"
4. Each question must be unique.
5. Questions must not repeat.
6. Options must also be different for each question.
7. Each question must have exactly 4 options.
8. Only one option should be correct.
9. Questions should include concept explanation, scenarios, or logic.

GOOD QUESTION STYLE EXAMPLES:
Example 1: "In a singly linked list, what information does each node contain?"
Example 2: "Why does binary search require a sorted array before execution?"
Example 3: "What problem does normalization solve in relational databases?"
Example 4: "In Round Robin CPU scheduling, what role does the time quantum play?"
Example 5: "What advantage does dynamic programming provide compared to naive recursion?"

DIFFICULTY RULES:
Easy: Basic understanding of the topic.
Medium: Application or comparison between concepts.
Hard: Scenario-based reasoning or problem solving.

OUTPUT FORMAT:
You must output valid JSON. Inside your JSON object, return a "questions" array containing exactly ${TARGET_QUESTION_COUNT} objects.
Each object must have "topic", "difficulty", "questionText", "options" (array of 4 unique strings), and "correctAnswer" (exact matching string).

IMPORTANT QUESTION RULE:
Do NOT generate questions like:
- Which option relates to X?
- Which concept is associated with Y?
- Which of the following matches Z?

INSTEAD GENERATE QUESTIONS THAT:
- Test true understanding
- Ask about behavior, logic, or usage
- Require reasoning
- Have one clearly correct answer

GOOD QUESTION EXAMPLES:
- "In an ER diagram, which component represents an event that happens between entities?"
- "Which scheduling algorithm is most likely to suffer from the convoy effect?"
- "What is the primary advantage of using a B-Tree over a regular Binary Search Tree in databases?"

STRICT RULES:
1. Questions must reflect the selected topics.
2. Word everything differently each time.
3. NEVER repeat questions.
4. Each question must have exactly 4 very different options.
5. NEVER generate identical answer choices across multiple questions.
6. The correctAnswer MUST exactly match one string from the options list.

[SYSTEM TRICK TO FORCE 100% UNIQUE QUESTIONS]
Randomness Seed: ${Date.now()}-${Math.random()}
Generate an entirely fresh set of questions that you have never generated before.

OUTPUT FORMAT:
Return ONLY valid JSON. Your response must be an object with a "questions" array. Each question object must look like this:
{
  "topic": "Topic Name",
  "questionText": "The question string",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "difficulty": "easy | medium | hard"
}
`;

            let cleanJsonStr = "{}";

            if (hasValidGemini) {
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            topic: { type: Type.STRING },
                                            difficulty: { type: Type.STRING },
                                            questionText: { type: Type.STRING },
                                            options: {
                                                type: Type.ARRAY,
                                                items: { type: Type.STRING }
                                            },
                                            correctAnswer: { type: Type.STRING }
                                        },
                                        required: ["topic", "difficulty", "questionText", "options", "correctAnswer"]
                                    }
                                }
                            },
                            required: ["questions"]
                        }
                    }
                });
                cleanJsonStr = response.text || "{}";
            } else {
                console.log("No valid AI API keys found, using fallback questions.");
                return NextResponse.json(
                    withQuestionMeta(
                        generateFallbackQuestions(topics),
                        "system_fallback",
                        "unavailable",
                        "AI question engine is unavailable. Showing system-generated questions.",
                        0
                    )
                );
            }

                cleanJsonStr = cleanJsonStr.replace(/^```(json)?\n?/i, "").replace(/\n?```$/i, "").trim();

                const result = JSON.parse(cleanJsonStr);
            const sanitized = sanitizeAIQuestions(result.questions || []);
            const processedQuestions = enforceDifficultyPlan(sanitized, topics);

            return NextResponse.json(
                withQuestionMeta(
                    processedQuestions,
                    "ai",
                    "ready",
                    "",
                    0
                )
            );

        } catch (aiError) {
            console.error("AI Generation failed, using fallback questions. Error:", aiError);
            return NextResponse.json(
                withQuestionMeta(
                    generateFallbackQuestions(topics),
                    "system_fallback",
                    "under_progress",
                    "AI is under progress. Showing system-generated questions for now.",
                    15000
                )
            );
        }

    } catch (error: unknown) {
        console.error("General Error in verification test route:", error);
        return NextResponse.json(
            { error: "Failed to generate AI questions", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

