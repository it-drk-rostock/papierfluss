import { Model as SurveyModel } from "survey-core";

export async function validateSurveyData(
  schema: any,
  data: any,
  options: { strict?: boolean } = {}
) {
  const survey = new SurveyModel(schema);

  survey.data = data;

  // Run validation, supports async validators too
  await survey.tryComplete(); // instead of doComplete()

  if (survey.hasErrors()) {
    return {
      valid: false,
      errors: survey.getAllErrors().map((e) => ({
        question: e.locator?.name ?? null,
        message: e.getText(),
      })),
    };
  }

  const allowedKeys = new Set<string>();
  survey.getAllQuestions().forEach((q) => allowedKeys.add(q.name));

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (allowedKeys.has(key)) {
      cleaned[key] = value;
    }
  }

  if (options.strict) {
    const extraKeys = Object.keys(data).filter((k) => !allowedKeys.has(k));
    if (extraKeys.length > 0) {
      return {
        valid: false,
        errors: [
          {
            question: null,
            message: `Fehler oder ungültige Felder: ${extraKeys.join(", ")}`,
          },
        ],
      };
    }
  }

  return { valid: true, data: cleaned };
}
