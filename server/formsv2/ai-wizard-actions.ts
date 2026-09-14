"use server";

import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

async function verifyAdminAndGetContext() {
  const { user } = await authQuery();
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const teams = await prisma.team.findMany({ select: { name: true } });
  const teamNames = teams.map((t) => t.name);
  const roles = [
    "admin",
    "moderator",
    "user",
    "Jeder",
    "Mitarbeiter",
    "Teamleiter",
    ...teamNames,
  ];

  return { user, teamNames, roles };
}

const Step1Schema = z.object({
  title: z.string().describe("Descriptive form title in German"),
  description: z
    .string()
    .describe("Short explanation of the form purpose in German"),
  schema: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      pages: z.array(
        z.object({
          name: z.string(),
          elements: z.array(z.record(z.string(), z.any())),
        }),
      ),
    })
    .optional()
    .describe("SurveyJS form schema JSON"),
});

export const generateWizardStep1AI = async (
  prompt: string,
  currentContext?: { title?: string; description?: string },
) => {
  const { roles } = await verifyAdminAndGetContext();

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: Step1Schema }),
    system: `You are an expert SurveyJS and form builder assistant for paper-flow software in German.
Available organization roles: ${roles.join(", ")}.
Generate structured title, description, and initial SurveyJS layout JSON based on prompt.`,
    prompt: `Context: ${JSON.stringify(currentContext || {})}\nPrompt: ${prompt}`,
  });

  return output;
};

const Step2Schema = z.object({
  statuses: z
    .array(z.string())
    .describe(
      "List of workflow state names representing paper route in German",
    ),
});

export const generateWizardStep2AI = async (
  prompt: string,
  currentContext?: { title?: string; existingStatuses?: string[] },
) => {
  await verifyAdminAndGetContext();

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: Step2Schema }),
    system: `You are a workflow state machine designer in German.
Generate a logical sequential list of status names for form lifecycle (e.g. Entwurf, In Prüfung, Genehmigt, Abgeschlossen).`,
    prompt: `Context: ${JSON.stringify(currentContext || {})}\nPrompt: ${prompt}`,
  });

  return output;
};

const Step3Schema = z.object({
  transitions: z
    .array(
      z.object({
        from: z.string().describe("Source status name"),
        to: z.string().describe("Target status name"),
      }),
    )
    .describe("Valid status transition paths"),
});

export const generateWizardStep3AI = async (
  prompt: string,
  currentContext: {
    statuses: string[];
    existingTransitions?: Array<{ from: string; to: string }>;
  },
) => {
  await verifyAdminAndGetContext();

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: Step3Schema }),
    system: `You are a workflow state machine transition generator.
Available statuses: ${currentContext.statuses.join(", ")}.
Generate valid transition pairs (from -> to) using ONLY available statuses.`,
    prompt: `Context: ${JSON.stringify(currentContext)}\nPrompt: ${prompt}`,
  });

  return output;
};

const Step4Schema = z.object({
  actions: z
    .array(
      z.object({
        label: z.string().describe("Button label in German"),
        role: z.string().describe("Authorized role or team name"),
        toStatus: z.string().describe("Target status after click"),
      }),
    )
    .describe("Action buttons with permissions and status transition"),
});

export const generateWizardStep4AI = async (
  prompt: string,
  currentContext: {
    statuses: string[];
    roles?: string[];
    existingActions?: Array<{ label: string; role: string; toStatus: string }>;
  },
) => {
  const { roles } = await verifyAdminAndGetContext();
  const validRoles =
    currentContext.roles && currentContext.roles.length > 0
      ? currentContext.roles
      : roles;

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: Step4Schema }),
    system: `You are a workflow action button designer.
Available statuses: ${currentContext.statuses.join(", ")}.
Available roles/teams: ${validRoles.join(", ")}.
Generate action buttons with label, target role, and target status (toStatus MUST be one of available statuses).`,
    prompt: `Context: ${JSON.stringify(currentContext)}\nPrompt: ${prompt}`,
  });

  return output;
};
