import { UserRole } from "@/generated/prisma/index";
import { z } from "zod";

export const updateUserSchema = z.object({
  userId: z.string().min(1, {
    message: "Benutzer-ID ist erforderlich",
  }),
  name: z.string().min(1, {
    message: "Name ist erforderlich",
  }),
  role: z.nativeEnum(UserRole),
});
