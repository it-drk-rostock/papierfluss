import { requiredFieldMessage } from "@/constants/required-field-message";
import { z } from "zod";

export const processSchema = z.object({
  name: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  description: z.string().optional(),
  isCategory: z.boolean().default(false),
  parentId: z.string().nullable(),
  workflowId: z.string().min(1),
});

export const manageDependenciesSchema = z.object({
  processId: z.string().min(1),
  dependencies: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
  ),
});

export const removeDependencySchema = z.object({
  processId: z.string().min(1),
  dependencyId: z.string().min(1),
});

export const moveProcessSchema = z.object({
  processId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});
