/**
 * Gemini API integration using @google/genai
 */
import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-pro-preview";

/**
 * Get or initialize the Google Gen AI client
 */
export function getClient(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY environment variable is not set");
    }
    genAI = new GoogleGenAI({
      apiKey,
    });
  }
  return genAI;
}

/**
 * Send a text prompt to Gemini and get a response
 * @param prompt - The text prompt to send
 * @param modelName - Optional model name (default: "gemini-2.5-flash")
 * @returns The generated text response
 */
export async function sendPrompt(
  prompt: string,
  modelName: string = DEFAULT_GEMINI_MODEL
): Promise<string> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });
  return response.text || "";
}
