import { idSchema } from "@/schemas/id-schema";
import { z } from "zod";
import { requiredFieldMessage } from "@/constants/required-field-message";

export const createTeamSchema = z.object({
  name: z.string().min(1, {
    message: requiredFieldMessage,
  }),
});

export const updateTeamSchema = z
  .object({
    name: z.string().min(1, {
      message: requiredFieldMessage,
    }),
  })
  .extend(idSchema.shape);
