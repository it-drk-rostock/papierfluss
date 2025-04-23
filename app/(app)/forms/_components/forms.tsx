import React from "react";
import { Stack, Group } from "@mantine/core";
import { getForms } from "../_actions";
import { FormCard } from "./form-card";
import { EmptyState } from "@/components/empty-state";

export const Forms = async () => {
  const forms = await getForms();

  return (
    <Stack align="center" gap="xl">
      <Group justify="center" gap="xl">
        {forms.length === 0 ? (
          <EmptyState text="Keine Formulare gefunden" variant="light" />
        ) : (
          forms.map((form) => <FormCard key={form.id} form={form} />)
        )}
      </Group>
    </Stack>
  );
};
