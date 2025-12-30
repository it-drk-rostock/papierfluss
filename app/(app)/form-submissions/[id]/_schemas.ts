import { idSchema } from "@/schemas/id-schema";
import { SubmissionStatus } from "@/generated/prisma/browser";
import { z } from "zod/v4";

export const formSubmissionSchema = z.object({
  data: z.any(),
});

export const updateFormSubmissionSchema = formSubmissionSchema.extend(
  idSchema.shape
);

export const updateFormSubmissionStatusSchema = z
  .object({
    status: z.enum(SubmissionStatus),
    message: z.string().optional(),
  })
  .extend(idSchema.shape);
