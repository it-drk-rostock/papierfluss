"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { isDeepStrictEqual } from "node:util";
import jsonLogic from "json-logic-js";
import type { RulesLogic } from "json-logic-js";

type SurveyQuestion = {
  name?: string;
  viewPermissionRule?: RulesLogic;
  editPermissionRule?: RulesLogic;
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
const questionsWithEditRules = (schema: unknown): SurveyQuestion[] => {
  if (!schema || typeof schema !== "object") return [];

  const question = schema as SurveyQuestion;
  return [
    ...(question.name && question.editPermissionRule ? [question] : []),
    ...(question.pages?.flatMap(questionsWithEditRules) ?? []),
    ...(question.elements?.flatMap(questionsWithEditRules) ?? []),
    ...(question.templateElements?.flatMap(questionsWithEditRules) ?? []),
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
    if (!jsonLogic.apply(question.viewPermissionRule!, context)) {
      delete data[question.name!];
    }
  }

  return { ...submission, data };
};
export const saveSubmissionV2 = async (id: string, newData: Record<string, unknown>) => {
  const { user } = await authQuery();
  if (!newData || typeof newData !== "object" || Array.isArray(newData)) throw new Error("Submission data must be an object");

  try { return await prisma.$transaction(async (tx) => {
    const submission = await tx.formSubmissionV2.findUnique({
      where: { id },
      include: { formVersion: { select: { schema: true } } },
    });

    if (!submission) throw new Error("Submission not found");

    const oldData = submission.data && typeof submission.data === "object" && !Array.isArray(submission.data)
      ? submission.data as Record<string, unknown> : {};
    const submittedData = { ...oldData, ...newData };
    const changedFields = Object.keys(submittedData)
      .filter((name) => !isDeepStrictEqual(oldData[name], submittedData[name]));

    if (!changedFields.length) return submission;

    const context = { user: { ...user, teams: user.teams?.map((team) => team.name) ?? [] } };
    for (const question of questionsWithEditRules(submission.formVersion.schema)) {
      if (changedFields.includes(question.name!) && !jsonLogic.apply(question.editPermissionRule!, context)) {
        throw new Error(`Unauthorized update to protected field: ${question.name}`);
      }
    }

    const details = Object.fromEntries(changedFields.map((name) => [name, {
      old: oldData[name] ?? null,
      new: submittedData[name] ?? null,
    }]));
    const updated = await tx.formSubmissionV2.update({
      where: { id },
      data: { data: submittedData as never },
    });
    await tx.formSubmissionLogV2.create({
      data: {
        submissionId: id,
        actorId: user.id,
        actionType: "SAVE",
        details,
      },
    });

    return updated;
  });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized update to protected field:")) {
      await prisma.formSubmissionLogV2.create({
        data: { submissionId: id, actorId: user.id, actionType: "UNAUTHORIZED_SAVE", details: { message: error.message } },
      });
    }
    throw error;
  }
};
