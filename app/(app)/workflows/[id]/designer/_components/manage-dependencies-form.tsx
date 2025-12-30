"use client";

import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { manageDependencies, getAvailableDependencies } from "../_actions";
import { manageDependenciesSchema } from "../_schemas";
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

export const ManageDependenciesForm = ({
  processId,
  currentDependencies,
}: {
  processId: string;
  currentDependencies: Process[];
}) => {
  const form = useForm({
    validate: zod4Resolver(manageDependenciesSchema),
    mode: "uncontrolled",
    initialValues: {
      processId,
      dependencies: currentDependencies,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: manageDependencies,
    hideModals: true,
  });

  const {
    data: availableProcesses = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["availableDependencies", processId],
    queryFn: () => getAvailableDependencies(processId),
  });

  if (isPending) {
    return <Loader />;
  }

  if (isError) {
    return <Text c="red">Fehler beim Laden der verfügbaren Prozesse</Text>;
  }

  // Filter out processes that are already dependencies
  const filteredProcesses = availableProcesses.filter(
    (process) => !form.values.dependencies.some((dep) => dep.id === process.id)
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
                    form.insertListItem("dependencies", {
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
          <Title order={3}>Ausgewählte Abhängigkeiten</Title>
          {form.values.dependencies.map((process, index) => (
            <Group key={process.id} justify="space-between">
              <Text>{process.name}</Text>
              <ActionIcon
                variant="light"
                onClick={() => form.removeListItem("dependencies", index)}
              >
                <IconX />
              </ActionIcon>
            </Group>
          ))}
          {form.values.dependencies.length === 0 && (
            <EmptyState text="Keine Abhängigkeiten ausgewählt" />
          )}
          <Button loading={status === "executing"} type="submit">
            Speichern
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
