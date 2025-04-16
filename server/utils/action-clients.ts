import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { adminQuery } from "./admin-query";
import { authQuery } from "./auth-query";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      event: z.string(),
    });
  },
  async handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return "Ein Fehler ist aufgetreten. Versuchen Sie es erneut.";
  },
});

export const adminActionClient = actionClient.use(async ({ next }) => {
  const session = await adminQuery();

  return next({ ctx: { session } });
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await authQuery();

  return next({ ctx: { session } });
});
