"use client";

import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import React from "react";
import { assignTeamsSchema } from "../_schemas";
import { assignTeams, getAvailableTeams } from "../_actions";
import { ActionIcon, Button, Loader, Stack, Title, Text } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { TeamList } from "@/components/team-list";
import { useQuery } from "@tanstack/react-query";

export const AssignTeamsForm = ({ formId }: { formId: string }) => {
  const form = useForm({
    validate: zodResolver(assignTeamsSchema),
    mode: "uncontrolled",
    initialValues: {
      id: formId,
      teams: [],
    },
  });

  const { execute, status } = useEnhancedAction({
    action: assignTeams,
    hideModals: true,
  });

  const {
    data: availableTeams,
    isPending: isPendingAvailableTeams,
    isError: isErrorAvailableTeams,
  } = useQuery({
    queryKey: ["availableTeams", formId],
    queryFn: () => getAvailableTeams({ formId }),
    staleTime: 0,
  });

  if (isPendingAvailableTeams) {
    return <Loader />;
  }

  if (isErrorAvailableTeams) {
    return <Text c="red">Fehler beim Laden der Bereiche</Text>;
  }

  return (
    <form onSubmit={form.onSubmit((values) => execute(values))}>
      <Stack gap="md">
        <Stack gap="sm">
          <Title order={3}>Benutzer auswählen</Title>
          <TeamList
            teams={(availableTeams || []).filter(
              (team) =>
                !form.values.teams.some((formTeam) => formTeam.id === team.id)
            )}
            actions={(team) => (
              <ActionIcon
                variant="light"
                onClick={() =>
                  form.insertListItem("teams", {
                    id: team.id,
                    name: team.name,
                  })
                }
              >
                <IconPlus />
              </ActionIcon>
            )}
          />
        </Stack>
        <Stack gap="sm">
          <Title order={3}>Hinzugefügte Mitglieder</Title>
          <TeamList
            teams={form.values.teams as { id: string; name: string }[]}
            actions={(team, index) => (
              <ActionIcon
                variant="light"
                onClick={() => form.removeListItem("teams", index)}
              >
                <IconX />
              </ActionIcon>
            )}
          />
          <Button type="submit" loading={status === "executing"}>
            Speichern
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
