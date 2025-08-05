import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { authQuery } from "@/server/utils/auth-query";

export async function POST(req: Request) {
  await authQuery();

  // Parse the request body
  const { prompt, currentForm } = await req.json();

  // Create the appropriate prompt based on whether there's an existing form
  const contextPrompt = currentForm
    ? `Modify this existing form: ${JSON.stringify(
        currentForm
      )}\n\nRequested changes: ${prompt}`
    : `Create a new form with these requirements: ${prompt}`;

  try {
    const result = streamText({
      model: openai("gpt-4.1-mini-2025-04-14"),
      system: `You are an expert SurveyJS form builder assistant. Your role is to analyze requests and output ONLY valid SurveyJS JSON configurations.

Rules:
1. If input contains existing form JSON:
   - Carefully analyze the current structure
   - Apply ONLY the requested modifications
   - Preserve all other existing questions, settings, validations, and texts exactly as they are unless the request explicitly says to change them
   - Return the complete modified JSON

2. If no existing form JSON:
   - Create a new form structure based on the description
   - Enforce all user requirements exactly as described
   - Use a variety of appropriate question types (e.g., text, comment, checkbox, radiogroup, dropdown, rating, file, boolean, matrix, multipletext)
   - Apply dynamic features where useful (e.g., conditional logic with visibleIf, enableIf, requiredIf, calculated values, default values)
   - Include relevant SurveyJS options like placeholders, input masks, validators, and hints
   - Return the complete SurveyJS JSON

3. Always ensure output is:
   - Strictly valid JSON (no comments, no trailing commas)
   - 100% compatible with SurveyJS specification
   - Includes a "pages" array with at least one page, each containing "elements"
   - Contains proper question types, validation rules, and settings
   - All labels, titles, descriptions, placeholders, and choice texts in German
   - Well‑structured with logical page and section organization
   - User‑friendly, with varied and rich input types, not only simple text fields

4. Enforce user wishes with high priority:
   - Do not override specific texts, settings, or structure unless explicitly requested
   - If the request is ambiguous, prefer minimal changes that respect existing content

5. Do not include explanations, comments, or markdown formatting.
6. Start the response with { and end with }.
7. Return ONLY the valid SurveyJS JSON object.
`,
      prompt: contextPrompt,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Service Error:", error);

    // Return a proper error response
    return new Response(
      JSON.stringify({
        error: "Failed to generate form",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
