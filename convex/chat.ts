import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const sendMessage = action({
    args: { message: v.string() },
    handler: async (ctx, { message }) => {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not set");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const systemPrompt = `You are a helpful AI assistant for Smart Formify, a web app for building, publishing, and managing dynamic forms with AI assistance and Google Sheets integration.

Key features:
- Form Builder: Drag-and-drop elements like text, email, textarea, select, radio, checkbox, number.
- AI Generation: Generate forms from prompts (e.g., "job application" creates JSON schema with relevant fields).
- Publishing: Share forms via URL or embed code.
- Submissions: Track and export responses to Google Sheets.
- Dashboard: Manage forms, view analytics.

Guidelines for responses:
- Be friendly, concise, and app-focused.
- If user asks for a form, suggest a JSON structure matching this schema: {id: string, title: string, description: string, status: "draft", elements: [{id: string, type: "text|email|... ", label: string, placeholder?: string, required: boolean, options?: string[], validation?: {minLength?: number, maxLength?: number, pattern?: string}}]}.
- Explain how to use features (e.g., "In the form builder, drag a text element and set label to 'Name'").
- For troubleshooting, guide to dashboard or contact support.
- Do not mention external services unless relevant (e.g., Google Sheets integration).`;

        try {
            const result = await model.generateContent([systemPrompt, message]);
            const response = await result.response.text();

            // Limit response size to prevent memory issues
            const maxResponseLength = 4000; // characters
            const limitedResponse = response.length > maxResponseLength
                ? response.substring(0, maxResponseLength) + "..."
                : response;

            return { response: limitedResponse };
        } catch (error: any) {
            console.error('Error in chat sendMessage:', error);

            // Provide a fallback response if the AI service fails
            if (error.message?.includes('404') || error.message?.includes('not found')) {
                return {
                    response: "I'm currently experiencing technical difficulties. Please try again in a moment or contact support if the issue persists."
                };
            }

            // For other errors, provide a generic response
            return {
                response: "I apologize, but I'm unable to process your request right now. Please try again later."
            };
        }
    },
});

