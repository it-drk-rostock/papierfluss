// src/app/api/chat/route.ts
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
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

  const result = await streamText({
    model: openai("gpt-4.1-mini"),
    system: `You are an expert SurveyJS form builder assistant. Your role is to analyze requests and output ONLY valid SurveyJS JSON configurations.

Rules:
1. If input contains existing form JSON:
   - Analyze the current structure
   - Apply requested modifications while preserving existing functionality
   - Return the complete modified JSON

2. If no existing form JSON:
   - Create a new form structure based on the description
   - Include appropriate question types, validation rules, and layout
   - Return complete SurveyJS JSON

3. Always ensure output is:
   - Valid JSON format
   - Compatible with SurveyJS specification
   - Contains proper question types, validation rules, and settings
   - Uses German language for all labels and text
   - Includes proper page organization and layout

DO NOT include any explanations or text outside the JSON structure. Return ONLY the valid SurveyJS JSON object.`,
    prompt: contextPrompt,
  });

  return result.toDataStreamResponse();
}
