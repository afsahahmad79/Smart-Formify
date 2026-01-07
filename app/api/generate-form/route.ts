import { NextResponse } from "next/server";
import OpenAI from "openai";

// OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_SECRET,
});

// Valid field types for FormElement
const VALID_FIELD_TYPES = ["text", "email", "textarea", "select", "radio", "checkbox", "number"];

// Helper function to extract JSON from markdown code blocks
function extractJSON(text: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}

// Validate and transform field to match FormElement structure
function transformField(field: any, index: number): any {
  // Map common field types to valid types
  const typeMapping: Record<string, string> = {
    "string": "text",
    "input": "text",
    "text": "text",
    "email": "email",
    "textarea": "textarea",
    "select": "select",
    "dropdown": "select",
    "radio": "radio",
    "checkbox": "checkbox",
    "number": "number",
    "integer": "number",
  };

  const fieldType = (field.type || "text").toLowerCase();
  const mappedType = typeMapping[fieldType] || "text";
  const validType = VALID_FIELD_TYPES.includes(mappedType) ? mappedType : "text";

  const transformed: any = {
    id: field.id || `element-${Date.now()}-${index}`,
    type: validType,
    label: field.label || field.name || `Field ${index + 1}`,
    required: field.required === true || field.required === "true" || false,
  };

  if (field.placeholder) {
    transformed.placeholder = field.placeholder;
  }

  // Add options for select and radio fields
  if ((validType === "select" || validType === "radio") && field.options) {
    transformed.options = Array.isArray(field.options)
      ? field.options
      : [];
  } else if ((validType === "select" || validType === "radio") && !field.options) {
    // Provide default options if missing
    transformed.options = ["Option 1", "Option 2", "Option 3"];
  }

  return transformed;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_SECRET) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please set OPENAI_API_KEY or OPENAI_API_SECRET environment variable." },
        { status: 500 }
      );
    }

    // Construct the system prompt for OpenAI
    const systemPrompt = `You are a form generation assistant. Generate a JSON object for a form based on the user's description.

Available field types:
- "text": Single-line text input
- "email": Email input with validation
- "textarea": Multi-line text input
- "select": Dropdown selection
- "radio": Radio button group
- "checkbox": Checkbox input
- "number": Numeric input

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown, no explanations, no code blocks
2. Each field must have: "label", "type", "required" (boolean)
3. Optional fields: "placeholder", "options" (for select/radio)
4. Field types must be one of the valid types listed above
5. Select and radio fields MUST include an "options" array with at least 2 options
6. Use appropriate field types based on the description (e.g., email fields should use "email" type)
7. Set "required" to true for important fields like email, password, etc.

Example JSON format:
{
  "title": "Form Title",
  "description": "Form description",
  "fields": [
    {
      "label": "Full Name",
      "type": "text",
      "required": true,
      "placeholder": "Enter your full name"
    },
    {
      "label": "Email Address",
      "type": "email",
      "required": true,
      "placeholder": "Enter your email"
    },
    {
      "label": "Country",
      "type": "select",
      "required": false,
      "options": ["USA", "Canada", "UK", "Other"]
    },
    {
      "label": "Message",
      "type": "textarea",
      "required": false,
      "placeholder": "Enter your message"
    }
  ]
}

User's form description: ${prompt}

Generate the JSON now:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use gpt-4o-mini for cost-effectiveness, or gpt-4o for better quality
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }, // Request JSON response format
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Extract JSON from response
    const jsonString = extractJSON(responseText);

    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON. Please try again." },
        { status: 500 }
      );
    }

    // Validate structure
    if (!parsedData.fields || !Array.isArray(parsedData.fields)) {
      return NextResponse.json(
        { error: "AI response missing 'fields' array. Please try again." },
        { status: 500 }
      );
    }

    // Transform fields to match FormElement structure
    const transformedFields = parsedData.fields.map((field: any, index: number) =>
      transformField(field, index)
    );

    // Return structured data
    return NextResponse.json({
      title: parsedData.title || "AI Generated Form",
      description: parsedData.description || "",
      elements: transformedFields,
    });
  } catch (error: any) {
    console.error("OpenAI error:", error);

    // Check for OpenAI credit/quota errors
    const errorMessage = error.message || "";
    const errorCode = error.code || error.status || "";

    // Detect out of credits/quota errors
    if (
      errorCode === "insufficient_quota" ||
      errorCode === 429 ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("credit") ||
      errorMessage.toLowerCase().includes("billing") ||
      errorMessage.toLowerCase().includes("insufficient") ||
      errorMessage.toLowerCase().includes("exceeded")
    ) {
      return NextResponse.json(
        { error: "Out of credits. Please check your OpenAI account billing and credits." },
        { status: 402 } // 402 Payment Required
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate form" },
      { status: 500 }
    );
  }
}
