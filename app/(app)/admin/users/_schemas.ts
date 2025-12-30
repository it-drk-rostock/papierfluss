import { UserRole } from "@/generated/prisma/client";
import { z } from "zod/v4";

export const updateUserSchema = z.object({
  userId: z.string().min(1, {
    message: "Benutzer-ID ist erforderlich",
  }),
  name: z.string().min(1, {
    message: "Name ist erforderlich",
  }),
  role: z.enum(UserRole),
});
