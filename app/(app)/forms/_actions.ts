"use server";

import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import { formSchema } from "./_schemas";
import prisma from "@/lib/prisma";
import { formatError } from "@/utils/format-error";
import { authQuery } from "@/server/utils/auth-query";
import { idSchema } from "@/schemas/id-schema";

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
    },
  });

  return forms;
};

export type FormProps = Awaited<ReturnType<typeof getForms>>;
