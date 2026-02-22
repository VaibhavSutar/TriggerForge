import { FastifyInstance } from "fastify";
import { aiService } from "../services";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TestCase {
    id: string;
    prompt: string;
    expectedOutcome: string;
}

const GOLDEN_SET: TestCase[] = [
    {
        id: "TC-001",
        prompt: "Every Monday at 9am, check for new emails from 'boss@company.com' and send a summary to Slack.",
        expectedOutcome: "Should have a Cron trigger (Monday 9am), a Gmail 'List Messages' action (filter: from:boss@company.com), an AI summary node, and a Slack 'Send Message' action."
    },
    {
        id: "TC-002",
        prompt: "If the bitcoin price is above $50k, email me 'Sell now!'.",
        expectedOutcome: "Should have a HTTP Polling trigger or Cron + HTTP Request (Coindesk API), a Condition node (price > 50000), and an Email action."
    }
];

export async function evalRoutes(app: FastifyInstance) {
    app.get("/run", async (req, reply) => {
        // We use aiService to parse the prompt, and Gemini directly as a judge
        const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!API_KEY) {
            return reply.code(500).send({ ok: false, error: "Missing GEMINI_API_KEY in environment" });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const results = [];

        try {
            for (const testCase of GOLDEN_SET) {
                // 1. Generate real workflow JSON from the service
                const generatedOutput = await aiService.generateWorkflow(testCase.prompt);
                const generatedJsonString = JSON.stringify(generatedOutput, null, 2);

                // 2. Evaluate using LLM-as-a-judge
                const judgePrompt = `
                You are an expert AI evaluator for a workflow automation platform.
                
                User Request: "${testCase.prompt}"
                Expected Outcome Strategy: "${testCase.expectedOutcome}"
                
                Actual AI Generated Output JSON:
                ${generatedJsonString}
                
                Task: Rate the Actual Output on a scale of 0 to 10 based on how well it matches the Expected Outcome Strategy. 
                Focus on whether the correct connectors and logic were chosen.
                Return ONLY the number.
                `;

                try {
                    const judgeResult = await model.generateContent(judgePrompt);
                    const score = parseInt(judgeResult.response.text().trim()) || 0;
                    results.push({
                        id: testCase.id,
                        prompt: testCase.prompt,
                        score,
                        passed: score >= 7,
                        generatedOutput: generatedJsonString
                    });
                } catch (evalErr: any) {
                    console.error("Evaluation judgement failed:", evalErr);
                    results.push({
                        id: testCase.id,
                        prompt: testCase.prompt,
                        score: 0,
                        passed: false,
                        error: "Generation successful, but judgement failed: " + evalErr.message
                    });
                }
            }

            const passed = results.filter(r => r.passed).length;

            return reply.send({
                ok: true,
                summary: {
                    total: results.length,
                    passed,
                    failed: results.length - passed
                },
                results
            });

        } catch (error: any) {
            console.error("Eval Pipeline Error:", error);
            return reply.code(500).send({ ok: false, error: error.message });
        }
    });
}
