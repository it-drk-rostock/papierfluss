"use server";

import prisma from "@/lib/prisma";
import { updateFormSchema } from "./_schemas";
import { authActionClient } from "@/server/utils/action-clients";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import { authQuery } from "@/server/utils/auth-query";

/**
 * Updates a form in the database.
 *
 * The function:
 * 1. Updates a form in the database.
 * 2. Revalidates the form cache tag to ensure data consistency.
 * 3. Redirects to the form list page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const updateForm = authActionClient
  .schema(updateFormSchema)
  .metadata({
    event: "updateFormSchema",
  })
  .stateAction(async ({ parsedInput }) => {
    const { schema, id } = parsedInput;

    try {
      await prisma.form.update({
        where: { id },
        data: {
          schema,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/forms/${id}/designer`);
    return {
      message: "Formular aktualisiert",
    };
  });

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
export const getDesigner = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        schema: true,
      },
    });
  }

  const form = await prisma.form.findFirst({
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
      schema: true,
    },
  });

  return form;
};

export type FormProps = Awaited<ReturnType<typeof getDesigner>>;
