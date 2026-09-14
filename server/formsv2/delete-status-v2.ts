"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

export const deleteFormStatusV2 = async (id: string, fallbackStatusId?: string) => {
  const { user } = await authQuery();
  if (user.role !== "admin") throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    const status = await tx.formStatusV2.findUnique({ where: { id }, select: { formId: true } });
    if (!status) throw new Error("Form status not found");

    const activeSubmissionCount = await tx.formSubmissionV2.count({ where: { statusId: id, isArchived: false } });
    if (activeSubmissionCount && !fallbackStatusId) throw new Error("Active submissions require a fallback status");

    if (fallbackStatusId) {
      if (fallbackStatusId === id) throw new Error("Fallback status must be different");
      const fallbackStatus = await tx.formStatusV2.findUnique({ where: { id: fallbackStatusId }, select: { formId: true } });
      if (!fallbackStatus || fallbackStatus.formId !== status.formId) throw new Error("Fallback status must belong to the same form");
      await tx.formSubmissionV2.updateMany({ where: { statusId: id }, data: { statusId: fallbackStatusId } });
    }

    return tx.formStatusV2.delete({ where: { id } });
  }, { isolationLevel: "Serializable" });
};
