import { idSchema } from "@/schemas/id-schema";
import { SubmissionStatus } from "@prisma-client/client";
import { z } from "zod";

export const formSubmissionSchema = z.object({
  data: z.any(),
});

export const updateFormSubmissionSchema = formSubmissionSchema.extend(
  idSchema.shape
);

export const updateFormSubmissionStatusSchema = z
  .object({
    status: z.nativeEnum(SubmissionStatus),
    message: z.string().optional(),
  })
  .extend(idSchema.shape);
