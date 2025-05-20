import React from "react";
import { Card, Group, Title } from "@mantine/core";
import { getTeams } from "../_actions";

export const Teams = async () => {
  const teams = await getTeams();

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
