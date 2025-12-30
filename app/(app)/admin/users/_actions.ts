"use server";

import { actionClient, adminActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import { updateUserSchema } from "./_schemas";
import prisma from "@/lib/prisma";
import { adminQuery } from "@/server/utils/admin-query";
import { z } from "zod/v4";
import { formatError } from "@/utils/format-error";

/**
 * Updates a user's role and name in the database.
 *
 * The function:
 * 1. Updates the user's role and name in the database.
 * 2. Revalidates the user cache tag to ensure data consistency.
 * 3. Redirects to the personal details page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const updateUser = adminActionClient
  .schema(updateUserSchema)
  .metadata({
    event: "updateUserAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { userId, name, role } = parsedInput;

    try {
      if (userId === ctx.session.user.id && role === "user") {
        throw formatError(
          "Sie können sich nicht selbst zu einem Benutzer degradieren"
        );
      }

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          role,
          name,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/users");
    return {
      message: "Benutzer aktualisiert",
    };
  });

/**
 * Deletes a user from the database
 * @param {Object} options.parsedInput - The validated input data
 * @param {string} options.parsedInput.userId - The ID of the user to delete
 * @returns {Promise<void>}
 * @throws {Error} If the delete operation fails
 */
export const deleteUser = adminActionClient
  .schema(z.object({ userId: z.string() }))
  .metadata({
    event: "deleteUserAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { userId } = parsedInput;
    try {
      if (userId === ctx.session.user.id) {
        throw formatError("Sie können sich nicht selbst löschen");
      }

      await prisma.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw formatError(error);
    }
    revalidatePath("/admin/users");
    return {
      message: "Benutzer gelöscht",
    };
  });

export type UserSearchParams = {
  name: string;
};

/**
 * Retrieves users from the database with optional name filtering
 * @param {string} [name] - Optional name filter for searching users
 * @returns {Promise<User[]>} Array of user objects matching the search criteria
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getUsers = async (name?: string) => {
  await adminQuery();

  const users = await prisma.user.findMany({
    where: {
      ...(name && {
        name: { contains: name, mode: "insensitive" },
      }),
    },
  });

  return users;
};

export type UserProps = Awaited<ReturnType<typeof getUsers>>;
