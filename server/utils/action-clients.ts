import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  async handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return "Ein Fehler ist aufgetreten";
  },
});
