"use server";

import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import {
  assignTeamsSchema,
  formSchema,
  removeTeamSchema,
  updateFormSchema,
} from "./_schemas";
import prisma from "@/lib/prisma";
import { formatError } from "@/utils/format-error";
import { authQuery } from "@/server/utils/auth-query";
import { idSchema } from "@/schemas/id-schema";
import { redirect } from "next/navigation";
import { adminQuery } from "@/server/utils/admin-query";

/**
 * Creates a new form in the database.
 *
 * The function:
 * 1. Creates a new form in the database.
 * 2. Revalidates the form cache tag to ensure data consistency.
 * 3. Redirects to the form list page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const createForm = authActionClient
  .schema(formSchema)
  .metadata({
    event: "createFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { title, description, icon, isPublic, isActive } = parsedInput;

    try {
      await prisma.form.create({
        data: {
          title,
          description,
          icon,
          isPublic,
          isActive,
          createdById: ctx.session.user.id,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/forms");
    return {
      message: "Formular erstellt",
    };
  });

/**
 * Updates an existing form in the database.
 *
 * The function:
 * 1. Updates the form in the database.
 * 2. Revalidates the form cache tag to ensure data consistency.
 * 3. Redirects to the form list page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const updateForm = authActionClient
  .schema(updateFormSchema)
  .metadata({
    event: "updateFormAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id, title, description, icon, isPublic, isActive } = parsedInput;

    try {
      await prisma.form.update({
        where: { id },
        data: { title, description, icon, isPublic, isActive },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/forms");
    return {
      message: "Formular aktualisiert",
    };
  });

/**
 * Deletes a user from the database
 * @param {Object} options.parsedInput - The validated input data
 * @param {string} options.parsedInput.id - The ID of the form to delete
 * @returns {Promise<void>}
 * @throws {Error} If the delete operation fails
 */
export const deleteForm = authActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteFormAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id } = parsedInput;
    try {
      await prisma.form.delete({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw formatError(error);
    }
    revalidatePath("/forms");
    return {
      message: "Formular gelöscht",
    };
  });

export const fillOutForm = authActionClient
  .schema(idSchema)
  .metadata({
    event: "fillOutFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    let formSubmissionId: string;

    try {
      const submission = await prisma.$transaction(async (tx) => {
        const form = await tx.form.findUnique({
          where: { id: parsedInput.id },
          select: { isActive: true },
        });

        if (!form?.isActive) {
          throw new Error("Formular ist nicht aktiviert");
        }

        return await tx.formSubmission.create({
          data: {
            formId: parsedInput.id,
            submittedById: ctx.session.user.id,
          },
        });
      });

      formSubmissionId = submission.id;
    } catch (error) {
      throw formatError(error);
    }

    redirect(`/form-submissions/${formSubmissionId}`);
  });

export type UserSearchParams = {
  name: string;
};

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
 *   title: string;
 *   description: string | null;
 *   icon: string | null;
 *   schema: any;
 *   isActive: boolean;
 *   isPublic: boolean;
 * }>>} Array of form objects matching the access criteria
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getForms = async () => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.form.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        schema: true,
        isActive: true,
        isPublic: true,
        teams: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });
  }

  const forms = await prisma.form.findMany({
    where: {
      OR: [
        { isPublic: true },
        {
          teams: {
            some: {
              users: {
                some: { id: user.id },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      icon: true,
      schema: true,
      isActive: true,
      isPublic: true,
      teams: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
        },
      },
    },
  });

  return forms;
};

export type FormProps = Awaited<ReturnType<typeof getForms>>;

export const removeTeam = authActionClient
  .schema(removeTeamSchema)
  .metadata({
    event: "removeTeamAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id, teamId } = parsedInput;
    try {
      await prisma.form.update({
        where: {
          id,
        },
        data: {
          teams: {
            disconnect: {
              id: teamId,
            },
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/forms");

    return {
      message: "Team entfernt",
    };
  });

export const assignTeams = authActionClient
  .schema(assignTeamsSchema)
  .metadata({
    event: "assignTeamsAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { teams, id } = parsedInput;
    try {
      await prisma.form.update({
        where: {
          id,
        },
        data: {
          teams: {
            connect: teams.map((team) => ({ id: team.id })),
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/forms");

    return {
      message: "Teams hinzugefügt",
    };
  });

export type AvailableTeamsParams = {
  formId: string;
};

export const getAvailableTeams = async ({ formId }: AvailableTeamsParams) => {
  await adminQuery();
  const teams = await prisma.team.findMany({
    where: {
      forms: {
        none: {
          id: formId,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return teams;
};
