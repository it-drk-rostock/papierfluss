"use client";

import { Container, Paper, Stack, Title, Text, Group } from "@mantine/core";
import { IconShieldLock } from "@tabler/icons-react";
import { BackButton } from "@/components/back-button";
import { ButtonLink } from "@/components/button-link";

export default function Forbidden() {
  return (
    <Container size="sm" py="xl">
      <Paper p="md" withBorder>
        <Stack align="center" gap="sm">
          <IconShieldLock
            size={32}
            stroke={1.5}
            style={{ color: "var(--mantine-color-red-6)" }}
          />
          <Title order={2}>Zugriff verweigert</Title>
          <Text c="dimmed" ta="center">
            Sie sind nicht berechtigt, auf diese Ressource zuzugreifen.
          </Text>
          <Group w="100%" gap="md" mt="sm">
            <BackButton style={{ flex: 1 }} />
            <ButtonLink
              href="/dashboard"
              title="Zum Dashboard"
              style={{ flex: 1 }}
            />
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
