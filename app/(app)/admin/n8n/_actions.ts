"use server";

import { adminActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { adminQuery } from "@/server/utils/admin-query";
import { formatError } from "@/utils/format-error";
import { idSchema } from "@/schemas/id-schema";
import { createWorkflowSchema } from "./_schemas";

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
    // Ensure URL ends with no trailing slash
    const baseUrl = n8nUrl.endsWith("/") ? n8nUrl.slice(0, -1) : n8nUrl;
    const fullUrl = `${baseUrl}/api/v1/workflows?active=true`;

    // Debug URL and headers
    console.log("Attempting to fetch from URL:", fullUrl);
    console.log("Headers:", {
      "X-N8N-API-KEY": apiKey.substring(0, 4) + "...",
    });

    const response = await fetch(fullUrl, {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
      // Add credentials and mode for cross-origin requests
      credentials: "omit",
      mode: "cors",
    });

    // Debug response
    console.log("Response status:", response.status);
    console.log("Response status text:", response.statusText);

    if (!response.ok) {
      // Try to get more error details
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.text();
        console.log("Error response body:", errorBody);
        errorDetail = errorBody || errorDetail;
      } catch {
        console.log("Could not read error body");
      }

      throw new Error(`N8N API Error: ${response.status} - ${errorDetail}`);
    }

    const data = (await response.json()) as { data: N8nWorkflow[] };

    // Debug successful response
    console.log("Successfully fetched workflows:", data.data.length);

    return data.data.map((workflow) => ({
      id: workflow.id.toString(),
      name: workflow.name,
    }));
  } catch (error) {
    console.error("Error fetching N8N workflows:", error);

    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error(
        "Network error - Could not connect to N8N. Check the URL and network connection."
      );
    }

    if (error instanceof Error && error.message.includes("N8N API Error")) {
      throw error; // Pass through our custom error
    }

    throw new Error(
      "Failed to fetch N8N workflows. Please check the server configuration."
    );
  }
};
