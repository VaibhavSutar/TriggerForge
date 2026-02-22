
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: "../../apps/server/.env" }); // Try to load env from server app

// Fix: Read GEMINI_API_KEY first as per our server configuration
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("Error: GEMINI_API_KEY not found in environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

interface TestCase {
    id: string;
    prompt: string;
    expectedOutcome: string; // Description of what should happen
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

const SERVER_URL = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";
const TEST_USER_ID = "eval-pipeline-test-user"; // Mock userId for the API

// REAL IMPLEMENTATION: We hit the actual server to test end-to-end integration
async function generateWorkflowReal(userPrompt: string): Promise<string> {
    console.log(`Sending real request to ${SERVER_URL}/ai/generate-workflow...`);
    try {
        const response = await fetch(`${SERVER_URL}/ai/generate-workflow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userPrompt, userId: TEST_USER_ID })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return JSON.stringify(data.workflow, null, 2);
    } catch (error) {
        throw new Error(`Failed to contact TriggerForge server: ${error}`);
    }
}

async function evaluate(testCase: TestCase) {
    console.log(`\n--- Running Test Case: ${testCase.id} ---`);
    console.log(`Prompt: ${testCase.prompt}`);

    try {
        // Hit the REAL server, not a mock!
        const generatedOutput = await generateWorkflowReal(testCase.prompt);
        console.log(`Real Generated Output (Truncated): ${generatedOutput.substring(0, 150)}...`);

        // LLM-as-a-Judge
        const judgePrompt = `
        You are an expert AI evaluator for a workflow automation platform.
        
        User Request: "${testCase.prompt}"
        Expected Outcome Strategy: "${testCase.expectedOutcome}"
        
        Actual AI Generated Output JSON from Real Server:
        ${generatedOutput}
        
        Task: Rate the Actual Output on a scale of 0 to 10 based on how well it matches the Expected Outcome Strategy. 
        Focus on whether the correct connectors (Cron, Email, Slack, HTTP) and logic were chosen.
        Return ONLY the number.
        `;

        const judgeResult = await model.generateContent(judgePrompt);
        const score = parseInt(judgeResult.response.text().trim());

        console.log(`Judge Score: ${score}/10`);

        return { id: testCase.id, score, passed: score >= 7 };

    } catch (error) {
        console.error("Evaluation failed:", error);
        return { id: testCase.id, score: 0, passed: false, error: (error as Error).message };
    }
}

async function runPipeline() {
    console.log("Starting Eval Pipeline testing LIVE Server...");

    const results = [];
    for (const testCase of GOLDEN_SET) {
        results.push(await evaluate(testCase));
    }

    console.log("\n--- Final Report ---");
    console.table(results);

    const passed = results.filter(r => r.passed).length;
    console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${results.length - passed}`);

    // Exit cleanly based on pipeline results
    if (passed < results.length) {
        process.exit(1);
    }
}

runPipeline();
