import { requiredFieldMessage } from "@/constants/required-field-message";
import { idSchema } from "@/schemas/id-schema";
import { z } from "zod";

const informationSchema = z.object({
  fields: z.array(
    z.object({
      label: z.string().min(1, { message: requiredFieldMessage }),
      fieldKey: z.string().min(1, { message: requiredFieldMessage }),
    })
  ),
});

export const formSchema = z.object({
  title: z.string().min(1, { message: requiredFieldMessage }),
  description: z.string().optional(),
  isPublic: z.boolean(),
  isActive: z.boolean(),
  editFormPermissions: z.string().optional(),
  reviewFormPermissions: z.string().optional(),
  responsibleTeam: z.object({
    id: z.string().min(1, { message: requiredFieldMessage }),
    name: z.string(),
  }),
  information: informationSchema.optional(),
});

export const updateFormSchema = formSchema.extend(idSchema.shape);

export const updateFormInformationSchema = informationSchema.extend(
  idSchema.shape
);

export const removeTeamSchema = z
  .object({
    teamId: z.string().min(1),
  })
  .extend(idSchema.shape);

export const assignTeamsSchema = z
  .object({
    teams: z.array(
      z.object({
        id: z.string().min(1),
      })
    ),
  })
  .extend(idSchema.shape);
