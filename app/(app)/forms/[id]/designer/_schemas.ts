import { idSchema } from "@/schemas/id-schema";
import { z } from "zod";

export const formSchema = z.object({
  schema: z.any(),
});

export const updateFormSchema = formSchema.extend(idSchema.shape);
