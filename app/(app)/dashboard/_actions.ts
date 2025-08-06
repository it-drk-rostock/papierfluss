"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

/**
 * Retrieves users from the database with optional name filtering
 * @param {string} [name] - Optional name filter for searching users
 * @returns {Promise<User[]>} Array of user objects matching the search criteria
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getTeams = async () => {
  const { user } = await authQuery();

  const teams = await prisma.team.findMany({
    where: {
      users: {
        some: {
          id: user.id,
        },
      },
    },
  });

  return teams;
};

export type TeamProps = Awaited<ReturnType<typeof getTeams>>;

/**
 * Retrieves form submissions from the database for the current user
 * @returns {Promise<Array<{
 *   id: string;
 *   status: string;
 *   form: {
 *     title: string;
 *   };
 * }>>} Returns an array of form submissions with their associated form titles
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getFormSubmissions = async () => {
  const { user } = await authQuery();

  return prisma.formSubmission.findMany({
    where: {
      submittedById: user.id,
      isArchived: false,
    },
    select: {
      id: true,
      status: true,
      form: {
        select: {
          title: true,
        },
      },
    },
  });
};

export type FormSubmissionProps = Awaited<
  ReturnType<typeof getFormSubmissions>
>;
