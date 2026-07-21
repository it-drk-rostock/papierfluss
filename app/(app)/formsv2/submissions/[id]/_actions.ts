"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";
import type { RulesLogic } from "json-logic-js";

type SurveyQuestion = {
  name?: string;
  viewPermissionRule?: RulesLogic;
  elements?: SurveyQuestion[];
  pages?: SurveyQuestion[];
  templateElements?: SurveyQuestion[];
};

const questionsWithViewRules = (schema: unknown): SurveyQuestion[] => {
  if (!schema || typeof schema !== "object") return [];

  const question = schema as SurveyQuestion;
  return [
    ...(question.name && question.viewPermissionRule ? [question] : []),
    ...(question.pages?.flatMap(questionsWithViewRules) ?? []),
    ...(question.elements?.flatMap(questionsWithViewRules) ?? []),
    ...(question.templateElements?.flatMap(questionsWithViewRules) ?? []),
  ];
};

export const getSubmissionV2 = async (id: string) => {
  const { user } = await authQuery();
  const submission = await prisma.formSubmissionV2.findUnique({
    where: { id },
    include: {
      formVersion: {
        select: {
          schema: true,
          form: {
            select: {
              isPublic: true,
              readSubmissionPermissions: true,
              responsibleTeam: { select: { name: true } },
              teams: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!submission || !submission.data || typeof submission.data !== "object") {
    return submission;
  }

  const data = structuredClone(submission.data) as Record<string, unknown>;
  const form = submission.formVersion.form;
  const context = {
    user: { ...user, teams: user.teams?.map((team) => team.name) ?? [] },
    form: {
      isPublic: form.isPublic,
      responsibleTeam: form.responsibleTeam?.name,
      teams: form.teams.map((team) => team.name),
    },
  };
  const mayRead = user.role === "admin" || (form.readSubmissionPermissions
    ? jsonLogic.apply(JSON.parse(form.readSubmissionPermissions), context)
    : form.isPublic || context.form.teams.some((team) => context.user.teams.includes(team)) || context.user.teams.includes(context.form.responsibleTeam ?? ""));

  if (!mayRead) throw new Error("Unauthorized");

  for (const question of questionsWithViewRules(submission.formVersion.schema)) {
    if (!jsonLogic.apply(question.viewPermissionRule, context)) {
      delete data[question.name!];
    }
  }

  return { ...submission, data };
};