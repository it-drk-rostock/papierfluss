"use server";

import { adminActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { adminQuery } from "@/server/utils/admin-query";
import { formatError } from "@/utils/format-error";
import { idSchema } from "@/schemas/id-schema";
import { createWorkflowSchema } from "./_schemas";
import { format } from "path";

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
export const createWorkflow = adminActionClient
  .schema(createWorkflowSchema)
  .metadata({
    event: "createWorkflowAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { workflows } = parsedInput;

    try {
      await prisma.n8nWorkflow.createMany({
        data: workflows.map((workflow) => ({
          workflowId: workflow.id,
          name: workflow.name,
        })),
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/admin/n8n");
    return {
      message: "Workflow erstellt",
    };
  });

/**
 * Deletes a user from the database
 * @param {Object} options.parsedInput - The validated input data
 * @param {string} options.parsedInput.userId - The ID of the user to delete
 * @returns {Promise<void>}
 * @throws {Error} If the delete operation fails
 */
export const deleteWorkflow = adminActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteWorkflowAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id } = parsedInput;
    try {
      await prisma.n8nWorkflow.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw formatError(error);
    }
    revalidatePath("/admin/n8n");
    return {
      message: "Workflow gelöscht",
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
export const getWorkflows = async () => {
  await adminQuery();

  const workflows = await prisma.n8nWorkflow.findMany({
    select: {
      id: true,
      workflowId: true,
      name: true,
    },
  });

  return workflows;
};

export type WorkflowProps = Awaited<ReturnType<typeof getWorkflows>>;

type N8nWorkflow = {
  id: number;
  name: string;
  active: boolean;
  // Add other properties if needed, but these are the ones we're using
};

export const getN8nWorkflows = async () => {
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    throw new Error("N8N configuration missing");
  }

  try {
    const fullUrl = `${n8nUrl}/api/v1/workflows?active=true`;

    const response = await fetch(fullUrl, {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
    });

    const data = (await response.json()) as { data: N8nWorkflow[] };
    console.log(data);
    // Debug successful response
    console.log("Successfully fetched workflows:", data.data.length);

    return data.data.map((workflow) => ({
      id: workflow.id.toString(),
      name: workflow.name,
    }));
  } catch (error) {
    console.log(error);
    throw formatError(error);
  }
};
