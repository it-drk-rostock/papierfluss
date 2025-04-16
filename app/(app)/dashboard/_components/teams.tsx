import React from "react";
import { Card, Stack, Title } from "@mantine/core";
import { getTeams } from "../_actions";

export const Teams = async () => {
  const teams = await getTeams();

  return (
    <Stack align="center" gap="xl">
      {teams.map((team) => (
        <Card key={team.id} padding="lg" withBorder w={300}>
          <Title order={2}>{team.name}</Title>
        </Card>
      ))}
    </Stack>
  );
};
