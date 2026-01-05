import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No Gemini API key set" }, { status: 500 });
  }

  // Gemini wants an array of conversation turns. We'll concatenate all previous turns, send latest as prompt.
  // For free tier/text-only, use gemini-pro.
  // API: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
  // Body: { contents: [{role: "user", parts: [{text: "your text"}]}] }
  const lastUserMessage = messages
    .filter((msg: { role: string; }) => msg.role === 'user')
    .map((msg: { content: string; }) => msg.content)
    .join('\n');

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: lastUserMessage }],
            },
          ],
        }),
      }
    );
    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      // Forward Gemini error detail for easier debugging
      return NextResponse.json({ error: data.error?.message || "Gemini error" }, { status: geminiRes.status });
    }
    return NextResponse.json({
      choices: [
        {
          message: {
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini",
          },
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
