"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

async function verifyAdmin() {
  const { user } = await authQuery();
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export interface Step1Input {
  formId?: string | null;
  title: string;
  description?: string | null;
  schema?: any;
}

export const saveWizardStep1 = async (input: Step1Input) => {
  const user = await verifyAdmin();

  if (!input.formId) {
    const newForm = await prisma.formV2.create({
      data: {
        title: input.title.trim() || "Unbenanntes Formular",
        description: input.description?.trim() || null,
        isActive: false,
        createdById: user.id,
        versions: {
          create: {
            version: 1,
            schema: input.schema ?? {},
          },
        },
      },
    });
    return newForm;
  }

  const updatedForm = await prisma.formV2.update({
    where: { id: input.formId },
    data: {
      title: input.title.trim() || "Unbenanntes Formular",
      description: input.description?.trim() || null,
    },
  });

  const v1 = await prisma.formVersionV2.findFirst({
    where: { formId: input.formId, version: 1 },
  });

  if (v1) {
    await prisma.formVersionV2.update({
      where: { id: v1.id },
      data: { schema: input.schema ?? {} },
    });
  } else {
    await prisma.formVersionV2.create({
      data: {
        formId: input.formId,
        version: 1,
        schema: input.schema ?? {},
      },
    });
  }

  return updatedForm;
};

export interface StatusInput {
  name: string;
  label?: string;
  color?: string;
  order?: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

export const saveWizardStep2 = async (formId: string, statuses: StatusInput[]) => {
  await verifyAdmin();

  return prisma.$transaction(async (tx) => {
    await tx.formStatusV2.deleteMany({ where: { formId } });

    if (statuses.length > 0) {
      await tx.formStatusV2.createMany({
        data: statuses.map((s, idx) => ({
          formId,
          name: s.name,
          label: s.label || s.name,
          color: s.color || "gray",
          order: s.order ?? idx,
          isInitial: s.isInitial ?? (idx === 0),
          isFinal: s.isFinal ?? false,
        })),
      });
    }

    return tx.formStatusV2.findMany({
      where: { formId },
      orderBy: { order: "asc" },
    });
  });
};

export interface TransitionInput {
  fromStatusName: string;
  toStatusName: string;
  label?: string | null;
  permissions?: string | null;
}

export const saveWizardStep3 = async (formId: string, transitions: TransitionInput[]) => {
  await verifyAdmin();

  return prisma.$transaction(async (tx) => {
    const statuses = await tx.formStatusV2.findMany({ where: { formId } });
    const statusMap = new Map(statuses.map((s) => [s.name, s]));

    await tx.formStatusTransitionV2.deleteMany({
      where: { fromStatus: { formId } },
    });

    const validTransitions = transitions
      .map((t) => {
        const from = statusMap.get(t.fromStatusName);
        const to = statusMap.get(t.toStatusName);
        if (!from || !to) return null;
        return {
          fromStatusId: from.id,
          toStatusId: to.id,
          label: t.label || null,
          permissions: t.permissions || null,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (validTransitions.length > 0) {
      await tx.formStatusTransitionV2.createMany({ data: validTransitions });
    }
  });
};

export interface ActionInput {
  label: string;
  role?: string;
  toStatusName?: string;
  color?: string;
}

export const saveWizardStep4 = async (formId: string, actions: ActionInput[]) => {
  await verifyAdmin();

  return prisma.$transaction(async (tx) => {
    const statuses = await tx.formStatusV2.findMany({ where: { formId } });
    const statusMap = new Map(statuses.map((s) => [s.name, s]));

    await tx.formActionV2.deleteMany({ where: { formId } });

    const validActions = actions.map((a) => {
      const toStatus = a.toStatusName ? statusMap.get(a.toStatusName) : null;
      const permissions =
        a.role && a.role !== "Jeder"
          ? JSON.stringify({ "==": [{ var: "user.role" }, a.role] })
          : null;
      return {
        formId,
        label: a.label,
        color: a.color || "gray",
        permissions,
        toStatusId: toStatus?.id || null,
      };
    });

    if (validActions.length > 0) {
      await tx.formActionV2.createMany({ data: validActions });
    }
  });
};

export interface N8nConfigInput {
  webhookUrl?: string;
  events?: string[];
}

export const saveWizardStep5 = async (formId: string, config: N8nConfigInput) => {
  await verifyAdmin();

  if (!config.webhookUrl?.trim()) return;

  const url = config.webhookUrl.trim();
  const n8nRecord = await prisma.n8nWorkflowV2.upsert({
    where: { workflowId: url },
    create: { workflowId: url, name: "n8n Webhook" },
    update: {},
  });

  const events = config.events || [];
  const isSubmit = events.includes("create");
  const isArchive = events.includes("archive");

  await prisma.formV2.update({
    where: { id: formId },
    data: {
      submitWorkflows: isSubmit
        ? { connect: [{ id: n8nRecord.id }] }
        : { disconnect: [{ id: n8nRecord.id }] },
      archiveN8nWorkflows: isArchive
        ? { connect: [{ id: n8nRecord.id }] }
        : { disconnect: [{ id: n8nRecord.id }] },
    },
  });
};

export const publishFormV2 = async (formId: string) => {
  await verifyAdmin();

  return prisma.formV2.update({
    where: { id: formId },
    data: { isActive: true },
  });
};
