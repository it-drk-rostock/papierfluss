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

export const updateProcessSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, {
    message: requiredFieldMessage,
  }),
  description: z.string().optional(),
});

export const updateProcessPermissionsSchema = z.object({
  id: z.string().min(1),
  editProcessPermissions: z.string().optional(),
  submitProcessPermissions: z.string().optional(),
  viewProcessPermissions: z.string().optional(),
  resetProcessPermissions: z.string().optional(),
  skippablePermissions: z.string().optional(),
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

export const manageSkippableProcessesSchema = z.object({
  processId: z.string().min(1),
  skippableProcesses: z.array(
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

export const updateProcessFormSchema = z.object({
  id: z.string().min(1),
  schema: z.any(),
  theme: z.any(),
});
