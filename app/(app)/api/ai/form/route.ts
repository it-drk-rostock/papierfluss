import { generateText, streamText } from "ai";
import { authQuery } from "@/server/utils/auth-query";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

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
    // Create OpenAI compatible client
    const model = createOpenAICompatible({
      baseURL: "https://openai.inference.de-txl.ionos.com/v1/chat/completions",
      name: "meta-llama/CodeLlama-13b-Instruct-hf",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = streamText({
      model: model.chatModel("meta-llama/CodeLlama-13b-Instruct-hf"),
      /* system: `You are an expert SurveyJS form builder assistant. Your role is to analyze requests and output ONLY valid SurveyJS JSON configurations.

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

DO NOT include any explanations or text outside the JSON structure. Return ONLY the valid SurveyJS JSON object.`, */
      prompt: contextPrompt,
      temperature: 0.7, // Add some creativity while keeping responses focused
    });

    if (!response || !response.text) {
      throw new Error("No response received from AI service");
    }

    return response.toDataStreamResponse();
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
