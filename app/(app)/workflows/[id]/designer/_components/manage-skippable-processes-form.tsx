"use client";

import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import {
  manageSkippableProcesses,
  getAvailableSkippableProcesses,
} from "../_actions";
import { manageSkippableProcessesSchema } from "../_schemas";
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";

interface Process {
  id: string;
  name: string;
}

export const ManageSkippableProcessesForm = ({
  processId,
  currentSkippableProcesses,
}: {
  processId: string;
  currentSkippableProcesses: Process[];
}) => {
  const form = useForm({
    validate: zod4Resolver(manageSkippableProcessesSchema),
    mode: "uncontrolled",
    initialValues: {
      processId,
      skippableProcesses: currentSkippableProcesses,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: manageSkippableProcesses,
    hideModals: true,
  });

  const {
    data: availableProcesses = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["availableSkippableProcesses", processId],
    queryFn: () => getAvailableSkippableProcesses(processId),
  });

  if (isPending) {
    return <Loader />;
  }

  if (isError) {
    return <Text c="red">Fehler beim Laden der verfügbaren Prozesse</Text>;
  }

  // Filter out processes that are already skippable
  const filteredProcesses = availableProcesses.filter(
    (process) =>
      !form.values.skippableProcesses.some((skip) => skip.id === process.id)
  );

  return (
    <form onSubmit={form.onSubmit((values) => execute(values))}>
      <Stack gap="md">
        <Stack gap="sm">
          <Title order={3}>Verfügbare Prozesse</Title>
          {filteredProcesses.length === 0 ? (
            <EmptyState text="Keine Prozesse verfügbar" />
          ) : (
            filteredProcesses.map((process) => (
              <Group key={process.id} justify="space-between">
                <Text>{process.name}</Text>
                <ActionIcon
                  variant="light"
                  onClick={() =>
                    form.insertListItem("skippableProcesses", {
                      id: process.id,
                      name: process.name,
                    })
                  }
                >
                  <IconPlus />
                </ActionIcon>
              </Group>
            ))
          )}
        </Stack>
        <Stack gap="sm">
          <Title order={3}>Überspringbare Prozesse</Title>
          {form.values.skippableProcesses.map((process, index) => (
            <Group key={process.id} justify="space-between">
              <Text>{process.name}</Text>
              <ActionIcon
                variant="light"
                onClick={() => form.removeListItem("skippableProcesses", index)}
              >
                <IconX />
              </ActionIcon>
            </Group>
          ))}
          {form.values.skippableProcesses.length === 0 && (
            <EmptyState text="Keine überspringbaren Prozesse ausgewählt" />
          )}
          <Button loading={status === "executing"} type="submit">
            Speichern
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
