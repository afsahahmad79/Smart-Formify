import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = client.getGenerativeModel({ model: "gemini-2.5-flash" });