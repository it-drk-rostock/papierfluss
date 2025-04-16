import { z } from "zod";

export const editUserSchema = z.object({
  userId: z.string().min(1, {
    message: "Benutzer-ID ist erforderlich",
  }),
  name: z.string().min(1, {
    message: "Name ist erforderlich",
  }),
  role: z.enum(["admin", "user"], {
    message: "Rolle ist erforderlich",
  }),
});
