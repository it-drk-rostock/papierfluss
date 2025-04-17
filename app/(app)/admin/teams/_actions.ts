"use server";

import { actionClient, adminActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import {
  assignUsersSchema,
  createTeamSchema,
  editUserSchema,
  removeMemberSchema,
  updateTeamSchema,
} from "./_schemas";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { adminQuery } from "@/server/utils/admin-query";
import { z } from "zod";
import { idSchema } from "@/schemas/id-schema";
import { formatError } from "@/utils/format-error";
import { after } from "next/server";

/**
 * Accepts the privacy policy and updates or creates a user record in the database.
 *
 * The function:
 * 1. Authenticates the user using Clerk authentication.
 * 2. Applies rate limiting to prevent abuse.
 * 3. Retrieves the current user information from Clerk.
 * 4. If user exists in database:
 *    - Updates their privacy policy acceptance status
 * 5. If user doesn't exist:
 *    - Creates a new user record with basic information and privacy policy status
 * 6. Revalidates the user cache tag to ensure data consistency.
 * 7. Redirects to the personal details page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */

export const createTeam = adminActionClient
  .schema(createTeamSchema)
  .metadata({
    event: "createTeamAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { name } = parsedInput;
    try {
      await prisma.team.create({
        data: {
          name,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/teams");
    return {
      message: "Team erstellt",
    };
  });

export const updateTeam = adminActionClient
  .schema(updateTeamSchema)
  .metadata({
    event: "updateTeamAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id, name } = parsedInput;
    try {
      await prisma.team.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/teams");
    return {
      message: "Team aktualisiert",
    };
  });

export const deleteTeam = adminActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteTeamAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id } = parsedInput;
    try {
      await prisma.team.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/teams");
    return {
      message: "Team gelöscht",
    };
  });

export const removeMember = adminActionClient
  .schema(removeMemberSchema)
  .metadata({
    event: "removeMemberAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id, userId } = parsedInput;
    try {
      await prisma.team.update({
        where: {
          id,
        },
        data: {
          users: {
            disconnect: {
              id: userId,
            },
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/teams");

    return {
      message: "Mitglied entfernt",
    };
  });

export const assignUsers = adminActionClient
  .schema(assignUsersSchema)
  .metadata({
    event: "assignUsersAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { users, id } = parsedInput;
    try {
      await prisma.team.update({
        where: {
          id,
        },
        data: {
          users: {
            connect: users.map((user) => ({ id: user.id })),
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/teams");

    return {
      message: "Mitglieder hinzugefügt",
    };
  });

export type TeamSearchParams = {
  name: string;
};

export const getTeams = async (name?: string) => {
  await adminQuery();
  const teams = await prisma.team.findMany({
    where: {
      ...(name && {
        name: { contains: name, mode: "insensitive" },
      }),
    },
    select: {
      id: true,
      name: true,
      users: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return teams;
};

export type TeamProps = Awaited<ReturnType<typeof getTeams>>;

export type AvailableUsersParams = {
  teamId: string;
};

export const getAvailableUsers = async ({ teamId }: AvailableUsersParams) => {
  await adminQuery();
  const users = await prisma.user.findMany({
    where: {
      teams: {
        none: {
          id: teamId,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return users;
};
