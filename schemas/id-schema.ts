import { z } from "zod/v4";

export const idSchema = z.object({
  id: z.string().min(1),
});


