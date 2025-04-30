import { requiredFieldMessage } from "@/constants/required-field-message";
import { idSchema } from "@/schemas/id-schema";
import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  description: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  icon: z.string().optional(),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateFormSchema = formSchema.extend(idSchema.shape);

export const removeTeamSchema = z
  .object({
    teamId: z.string().min(1),
  })
  .extend(idSchema.shape);

export const assignTeamsSchema = z
  .object({
    teams: z.array(
      z.object({
        id: z.string().min(1),
      })
    ),
  })
  .extend(idSchema.shape);
