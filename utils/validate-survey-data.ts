import { Model as SurveyModel } from "survey-core";

/**
 * Recursively walks a survey schema (or any nested JSON) and collects every
 * dynamic variable name referenced via {curly-brace} tokens. These tokens are
 * used by SurveyJS in `html`, `visibleIf`, `enableIf`, `expression`, etc. to
 * pull in values that are stored in the run data but are NOT backed by an
 * answerable question. We treat them as valid data keys so strict validation
 * doesn't reject them.
 */
function collectVariableReferences(node: unknown): Set<string> {
  const names = new Set<string>();

  const visit = (value: unknown) => {
    if (typeof value === "string") {
      const matches = value.matchAll(/\{([^}]+)\}/g);
      for (const match of matches) {
        // Take the base name before any property/array access, e.g.
        // "{item.link}" -> "item", "{files[0]}" -> "files".
        const base = match[1].trim().split(/[.[]/)[0].trim();
        if (base) names.add(base);
      }
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(visit);
    }
  };

  visit(node);
  return names;
}

export async function validateSurveyData(
  schema: any,
  data: any,
  options: { strict?: boolean } = {}
) {
  try {
    // Create survey model with minimal configuration for server-side validation
    const survey = new SurveyModel(schema);

    // Set data before validation
    survey.data = data;

    // Use validate() instead of tryComplete() for server-side validation
    // tryComplete() requires DOM/browser environment which isn't available server-side
    const validationResult = survey.validate();

    if (!validationResult) {
      // Collect errors from all questions
      const errors: Array<{ question: string | null; message: string }> = [];

      try {
        const allQuestions = survey.getAllQuestions();
        for (const question of allQuestions) {
          const questionName = question.name || null;
          const questionTitle =
            (question as any).title || questionName || "Feld";

          // Check if question has errors (after survey.validate() was called)
          const questionErrors = (question as any).errors || [];
          const hasErrors = questionErrors.length > 0;

          // Also check if required field is empty
          const isEmpty =
            (question as any).isEmpty &&
            typeof (question as any).isEmpty === "function"
              ? (question as any).isEmpty()
              : false;
          const isRequired = (question as any).isRequired === true;

          if (hasErrors) {
            // Question has validation errors
            for (const error of questionErrors) {
              let errorMessage = "Validierungsfehler";
              if (typeof error === "string") {
                errorMessage = error;
              } else if (error && typeof error === "object") {
                // SurveyJS error objects have getText() method or text property
                errorMessage =
                  error.getText && typeof error.getText === "function"
                    ? error.getText()
                    : error.text || "Validierungsfehler";
              }

              // Translate common English error messages to German
              errorMessage = errorMessage
                .replace(/Response required\.?/gi, "ist erforderlich")
                .replace(/This field is required\.?/gi, "ist erforderlich")
                .replace(
                  /Please answer the question\.?/gi,
                  "Bitte beantworten Sie die Frage"
                )
                .replace(
                  /Please enter a value\.?/gi,
                  "Bitte geben Sie einen Wert ein"
                )
                .replace(/Invalid value\.?/gi, "Ungültiger Wert")
                .replace(
                  /Please enter a valid value\.?/gi,
                  "Bitte geben Sie einen gültigen Wert ein"
                );

              // Include field name in error message (avoid duplication if already in message)
              const finalMessage = errorMessage.includes(questionTitle)
                ? errorMessage
                : `${questionTitle}: ${errorMessage}`;

              errors.push({
                question: questionName,
                message: finalMessage,
              });
            }
          } else if (isRequired && isEmpty) {
            // Required field is empty
            const requiredError =
              (question as any).requiredErrorText ||
              `${questionTitle} ist erforderlich`;
            errors.push({
              question: questionName,
              message: requiredError,
            });
          }
        }
      } catch (error) {
        console.warn("Error collecting validation errors:", error);
      }

      // If we found errors, return them
      if (errors.length > 0) {
        return {
          valid: false,
          errors,
        };
      }

      // Fallback if validation failed but we couldn't collect errors
      // Try to get at least some information about required fields
      const requiredFields: string[] = [];
      try {
        const allQuestions = survey.getAllQuestions();
        for (const question of allQuestions) {
          if ((question as any).isRequired === true) {
            const title = (question as any).title || question.name || "Feld";
            requiredFields.push(title);
          }
        }
      } catch {
        // Ignore errors here
      }

      const fallbackMessage =
        requiredFields.length > 0
          ? `Validierung fehlgeschlagen - Bitte folgende erforderliche Felder ausfüllen: ${requiredFields.join(
              ", "
            )}`
          : "Validierung fehlgeschlagen - Bitte alle erforderlichen Felder ausfüllen";

      return {
        valid: false,
        errors: [
          {
            question: null,
            message: fallbackMessage,
          },
        ],
      };
    }

    // Get allowed keys from schema questions
    const allowedKeys = new Set<string>();
    try {
      survey.getAllQuestions().forEach((q) => {
        if (q.name) {
          allowedKeys.add(q.name);
        }
      });
    } catch (error) {
      // If we can't get questions, log but continue
      console.warn("Could not get survey questions:", error);
    }

    // Allow dynamic variables: any {token} referenced anywhere in the schema
    // (e.g. html "{Some_Link}" or visibleIf "{Some_Link} notempty") lives in the
    // run data as a value even though it isn't an answerable question.
    collectVariableReferences(schema).forEach((name) => allowedKeys.add(name));

    // Allow explicit SurveyJS variables and calculated values.
    try {
      (survey as any).getVariableNames?.().forEach((name: string) => {
        if (name) allowedKeys.add(name);
      });
    } catch {
      // Ignore - getVariableNames may not exist in all versions
    }
    if (Array.isArray((schema as any)?.calculatedValues)) {
      (schema as any).calculatedValues.forEach((cv: any) => {
        if (cv?.name) allowedKeys.add(cv.name);
      });
    }

    // Clean data - only keep keys that exist in the schema
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedKeys.has(key)) {
        cleaned[key] = value;
      }
    }

    // Strict mode: reject extra keys
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
  } catch (error) {
    // Catch any errors from SurveyJS and return them properly
    console.error("Survey validation error:", error);

    return {
      valid: false,
      errors: [
        {
          question: null,
          message:
            error instanceof Error
              ? error.message
              : "Validierungsfehler aufgetreten",
        },
      ],
    };
  }
}
