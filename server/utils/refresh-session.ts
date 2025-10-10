"use server";

import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import z from "zod";
import { authActionClient } from "./action-clients";

/**
 * Refreshes the session
 */
export const refreshSession = authActionClient
  .schema(z.object({}))
  .metadata({
    event: "refreshSessionAction",
  })
  .stateAction(async () => {
    try {
      revalidatePath(`/`, "layout");
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Sitzung aktualisiert",
    };
  });
