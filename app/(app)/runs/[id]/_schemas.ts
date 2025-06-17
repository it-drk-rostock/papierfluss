import { z } from "zod";
import { idSchema } from "@/schemas/id-schema";

export const saveProcessRunSchema = idSchema.extend({
  data: z.any(),
});
