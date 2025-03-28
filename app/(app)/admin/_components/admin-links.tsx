import React from "react";
import { adminQuery } from "@server/utils/admin-query";
import { Card, Text, Title, Group } from "@mantine/core";
import Link from "next/link";

export const AdminLinks = async () => {
  await adminQuery();

  return (
    <Group justify="center" gap="xl">
      <Card
        padding="lg"
        component={Link}
        href="/admin/users"
        withBorder
        w={300}
      >
        <Title order={2}>Users</Title>
        <Text c="dimmed">Manage user accounts, permissions, and roles.</Text>
      </Card>

      <Card
        padding="lg"
        withBorder
        component={Link}
        href="/admin/teams"
        w={300}
      >
        <Title order={2}>Teams</Title>
        <Text c="dimmed">Manage teams, members, and team settings.</Text>
      </Card>
    </Group>
  );
};
