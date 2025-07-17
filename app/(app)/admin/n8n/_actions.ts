"use server";

import { adminActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { adminQuery } from "@/server/utils/admin-query";
import { formatError } from "@/utils/format-error";
import { idSchema } from "@/schemas/id-schema";
import { createWorkflowSchema } from "./_schemas";
import axios, { AxiosError } from "axios";
import https from "https";

interface N8nWorkflow {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface N8nWorkflowResponse {
  data: N8nWorkflow[];
}

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

export const getN8nWorkflows = async () => {
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    throw new Error(
      "N8N configuration missing - Please check NEXT_PUBLIC_N8N_URL and N8N_API_KEY environment variables"
    );
  }

  // Create a custom HTTPS agent that ignores SSL certificate issues
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    // Log request details (remove in production)
    console.log("Attempting to fetch N8N workflows from:", n8nUrl);
    console.log("Using API key starting with:", apiKey.substring(0, 4) + "...");

    const response = await axios.get<N8nWorkflowResponse>(
      `${n8nUrl}/api/v1/workflows`,
      {
        params: {
          active: true,
        },
        headers: {
          "X-N8N-API-KEY": apiKey,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        httpsAgent,
        proxy: false,
        // Add timeout
        timeout: 5000,
        // Add additional debugging
        validateStatus: null, // Don't throw on any status
      }
    );

    // Log response status and headers (remove in production)
    console.log("N8N Response Status:", response.status);
    console.log("N8N Response Headers:", response.headers);

    if (response.status === 403) {
      throw new Error(
        "Authentication failed - Invalid API key or insufficient permissions"
      );
    }

    if (response.status !== 200) {
      throw new Error(
        `N8N API returned status ${response.status}: ${response.statusText}`
      );
    }

    if (!response.data || !Array.isArray(response.data.data)) {
      throw new Error("Invalid response format from N8N API");
    }

    return response.data.data.map((workflow: N8nWorkflow) => ({
      id: workflow.id.toString(),
      name: workflow.name,
    }));
  } catch (error) {
    // Enhanced error handling
    if (error instanceof AxiosError) {
      console.error("N8N API Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });

      if (error.response?.status === 403) {
        throw new Error(
          "Authentication failed - Please check your N8N API key"
        );
      }

      if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Could not connect to N8N - Please check if the service is running"
        );
      }

      throw new Error(
        `N8N API Error: ${error.response?.statusText || error.message}`
      );
    }

    console.error("Unexpected error fetching N8N workflows:", error);
    throw new Error(
      "Failed to fetch N8N workflows. Please check the server configuration."
    );
  }
};
