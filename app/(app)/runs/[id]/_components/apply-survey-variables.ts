import { Model } from "survey-core";

export interface FormProcessItem {
  id: string;
  status: "open" | "ongoing" | "completed";
  data: Record<string, unknown> | null;
  resetProcessText?: string | null;
  process: {
    id: string;
    name: string;
    description?: string | null;
    isCategory?: boolean;
    order?: number;
  };
}

/**
 * Transforms workflow process submissions into flat SurveyJS variables.
 * Each field from each process submission is mapped directly at the top level
 * (e.g. {Bereich}, {currentUserEmail}) so they can be referenced directly in
 * the SurveyJS designer as flat values without nested paths.
 */
export function computeSurveyVariables(
  currentUserEmail: string,
  processes?: FormProcessItem[],
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};

  if (processes && processes.length > 0) {
    for (const item of processes) {
      if (item.data && typeof item.data === "object") {
        const itemData = item.data as Record<string, unknown>;
        for (const [key, value] of Object.entries(itemData)) {
          variables[key] = value;
        }
      }
    }
  }

  // Ensure currentUserEmail is always set
  variables.currentUserEmail = currentUserEmail;

  return variables;
}

/**
 * Imperatively applies variables to a SurveyJS Model, skipping unchanged values
 * to avoid triggering unnecessary internal SurveyJS re-evaluations.
 */
export function applySurveyVariables(
  model: Model,
  variables: Record<string, unknown>,
) {
  for (const [key, value] of Object.entries(variables)) {
    if (model.getVariable(key) !== value) {
      model.setVariable(key, value);
    }
  }
}
