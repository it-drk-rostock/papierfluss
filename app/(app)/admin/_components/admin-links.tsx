import React from "react";
import { adminQuery } from "@server/utils/admin-query";
import { Card, Text, Title, Group } from "@mantine/core";
import Link from "next/link";

export const AdminLinks = async () => {
  await adminQuery();

  return (
    <Group justify="center" gap="md">
      <Card
        padding="lg"
        component={Link}
        href="/admin/users"
        withBorder
        w={300}
      >
        <Title order={2}>Benutzer</Title>
        <Text c="dimmed">
          Verwalten Sie Benutzerkonten, Berechtigungen und Rollen.
        </Text>
      </Card>

      <Card
        padding="lg"
        withBorder
        component={Link}
        href="/admin/teams"
        w={300}
      >
        <Title order={2}>Bereiche</Title>
        <Text c="dimmed">Verwalten Sie Bereiche und deren Einstellungen.</Text>
      </Card>
      <Card padding="lg" withBorder component={Link} href="/admin/n8n" w={300}>
        <Title order={2}>n8n Workflows</Title>
        <Text c="dimmed">Verwalten Sie n8n-Workflows.</Text>
      </Card>
      <Card
        padding="lg"
        component={Link}
        href="/admin/cronjobs"
        withBorder
        w={300}
      >
        <Title order={2}>Cronjobs</Title>
        <Text c="dimmed">Verwalten Sie Cronjobs.</Text>
      </Card>
      <Card
        padding="lg"
        component={Link}
        href="/workflows"
        withBorder
        w={300}
      >
        <Title order={2}>Portale</Title>
        <Text c="dimmed">Verwalten Sie Portale.</Text>
      </Card>
      <Card
        padding="lg"
        component={Link}
        href="/forms"
        withBorder
        w={300}
      >
        <Title order={2}>Formulare</Title>
        <Text c="dimmed">Verwalten Sie Formulare.</Text>
      </Card>
    </Group>
  );
};
