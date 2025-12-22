"use client";

import z from "zod";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { idSchema } from "@/schemas/id-schema";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useForm } from "@mantine/form";
import { Button, Stack, Textarea } from "@mantine/core";
import { submitFormSubmission } from "../_actions";

export const FormSubmissionSubmitForm = ({ id }: { id: string }) => {
  const form = useForm({
    name: "submit-form-submission",
    validate: zod4Resolver(idSchema.extend({ message: z.string().optional() })),
    mode: "uncontrolled",
    initialValues: {
      id: id,
      message: "",
    },
  });

  const { execute, status } = useEnhancedAction({
    action: submitFormSubmission,
    hideModals: true,
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        execute(values);
      })}
    >
      <Stack gap="sm">
        <Textarea
          placeholder=""
          label="Nachricht"
          key={form.key("message")}
          {...form.getInputProps("message")}
        />
        <Button fullWidth type="submit" loading={status === "executing"}>
          Einreichen
        </Button>
      </Stack>
    </form>
  );
};
