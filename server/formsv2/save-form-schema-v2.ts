"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { Prisma } from "@/generated/prisma/client";

export const saveFormSchemaV2 = async (
  formVersionId: string,
  schema: Prisma.InputJsonValue,
  options?: { theme?: Prisma.InputJsonValue; information?: Prisma.InputJsonValue }
) => {
  const { user } = await authQuery();
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return prisma.$transaction(async (tx) => {
    const currentVersion = await tx.formVersionV2.findUnique({
      where: { id: formVersionId },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    if (!currentVersion) {
      throw new Error("Form version not found");
    }

    if (currentVersion._count.submissions === 0) {
      const updated = await tx.formVersionV2.update({
        where: { id: formVersionId },
        data: {
          schema: schema ?? currentVersion.schema ?? Prisma.JsonNull,
          ...(options?.theme !== undefined ? { theme: options.theme } : {}),
          ...(options?.information !== undefined ? { information: options.information } : {}),
        },
      });
      return { ...updated, cloned: false };
    }

    const maxVersionAgg = await tx.formVersionV2.aggregate({
      where: { formId: currentVersion.formId },
      _max: { version: true },
    });

    const nextVersion = (maxVersionAgg._max.version ?? currentVersion.version) + 1;

    const clonedVersion = await tx.formVersionV2.create({
      data: {
        formId: currentVersion.formId,
        version: nextVersion,
        schema: schema ?? currentVersion.schema ?? Prisma.JsonNull,
        theme: options?.theme !== undefined ? options.theme : (currentVersion.theme ?? Prisma.JsonNull),
        information: options?.information !== undefined ? options.information : (currentVersion.information ?? Prisma.JsonNull),
      },
    });

    return { ...clonedVersion, cloned: true };
  });
};
