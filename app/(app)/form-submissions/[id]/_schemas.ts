import { idSchema } from "@/schemas/id-schema";
import { z } from "zod";

export const formSubmissionSchema = z.object({
  data: z.any(),
});

export const updateFormSubmissionSchema = formSubmissionSchema.extend(
  idSchema.shape
);
