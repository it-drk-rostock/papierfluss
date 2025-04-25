"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { updateFormSubmissionSchema } from "./_schemas";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import { idSchema } from "@/schemas/id-schema";

/**
 * Retrieves forms from the database based on user's role and access permissions.
 *
 * Access rules:
 * - Admin users: Can access all forms
 * - Regular users: Can access:
 *   1. All public forms
 *   2. Forms where the user belongs to an assigned team
 *
 * Note: Results are automatically deduplicated if a form matches multiple conditions
 *
 * @returns {Promise<Array<{
 *   id: string;
 *   schema: any;
 * }>>} Array of form objects matching the access criteria
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getFormSubmission = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.formSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        form: {
          select: {
            id: true,
            title: true,
            schema: true,
          },
        },
        status: true,
        data: true,
      },
    });
  }

  const form = await prisma.formSubmission.findFirst({
    where: {
      OR: [
        {
          form: {
            isPublic: true,
          },
        },
        {
          form: {
            teams: {
              some: {
                users: {
                  some: { id: user.id },
                },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      form: {
        select: {
          id: true,
          title: true,
          schema: true,
        },
      },
      status: true,
      data: true,
    },
  });

  return form;
};

export type FormSubmissionProps = Awaited<ReturnType<typeof getFormSubmission>>;

export const updateFormSubmission = authActionClient
  .schema(updateFormSubmissionSchema)
  .metadata({
    event: "updateFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, data } = parsedInput;

    try {
      await prisma.formSubmission.update({
        where: {
          id,
          submittedById: ctx.session.user.id,
          status: "ongoing",
        },
        data: {
          data,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde gespeichert",
    };
  });

export const submitFormSubmission = authActionClient
  .schema(updateFormSubmissionSchema)
  .metadata({
    event: "submitFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, data } = parsedInput;

    try {
      await prisma.formSubmission.update({
        where: {
          id,
          submittedById: ctx.session.user.id,
          status: "ongoing",
        },
        data: {
          status: "submitted",
          data,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde gespeichert und eingereicht",
    };
  });

export const reviewFormSubmission = authActionClient
  .schema(idSchema)
  .metadata({
    event: "reviewFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id } = parsedInput;

    try {
      await prisma.formSubmission.update({
        where: {
          id,
          status: "submitted",
        },
        data: {
          status: "inReview",
        },
      });
    } catch (error) {
      console.log(error);
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde zur Prüfung aktualisiert",
    };
  });
