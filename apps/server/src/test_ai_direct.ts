
import * as dotenv from "dotenv";
dotenv.config();
import { AIService } from "./services/ai.service";

async function main() {
    console.log("Testing Gemini AI Service...");
    const key = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("Missing Gemini Key (checked GOOGLE_AI_API_KEY and GEMINI_API_KEY)");
        return;
    }

    console.log("Key found (length: " + key.length + ")");

    const ai = new AIService({ apiKey: key });
    try {
        console.log("Generating workflow...");
        const res = await ai.generateWorkflow("Create a daily email workflow");
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch (e: any) {
        console.error("Error:", e);
    }
}

main();
