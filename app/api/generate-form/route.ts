import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(
      `Generate a JSON object for a form with fields based on this description: ${prompt}.
       Respond with ONLY valid JSON in this format:
       {
         "fields": [
           { "label": "", "name": "", "type": "", "placeholder": "" }
         ]
       }`
    );

    return NextResponse.json({
      text: result.response.text(),
    });
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}
