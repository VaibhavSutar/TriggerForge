
import * as dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
    console.log("Listing Gemini Models...");
    const key = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("Missing Gemini Key");
        return;
    }

    // Log key prefix to ensure it's loaded correctly (safety: only first 4 chars)
    console.log("Key prefix:", key.substring(0, 4) + "...");

    const genAI = new GoogleGenerativeAI(key);
    // There isn't a direct listModels on the instance in 0.24.1 directly compliant with all docs sometimes, 
    // but let's try via the model manager if exposed, or just try to instantiate a few common ones.

    // Use fetch to list models directly
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        console.log("Fetching models from:", url.replace(key, "HIDDEN_KEY"));
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods?.join(", ")})`);
            });
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (e: any) {
        console.error("Fetch error:", e);
    }
}

main();
