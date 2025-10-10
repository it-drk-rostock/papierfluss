import React from "react";
import { Card, Group, Title } from "@mantine/core";
import { getTeams } from "../_actions";
import { EmptyState } from "@/components/empty-state";

export const Teams = async () => {
  const teams = await getTeams();

  if (teams.length === 0) {
    return (
      <Group align="center" gap="sm">
        <EmptyState text="Keine Bereiche gefunden" variant="light" />
      </Group>
    );
  }

  return (
    <Group align="center" gap="sm">
      {teams.map((team) => (
        <Card key={team.id} padding="lg" withBorder w={300}>
          <Title order={2}>{team.name}</Title>
        </Card>
      ))}
    </Group>
  );
};
