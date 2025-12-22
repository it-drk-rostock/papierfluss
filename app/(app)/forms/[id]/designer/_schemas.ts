import { idSchema } from "@/schemas/id-schema";
import { z } from "zod/v4";

export const formSchema = z.object({
  schema: z.any(),
  theme: z.any(),
});

export const updateFormSchema = formSchema.extend(idSchema.shape);
