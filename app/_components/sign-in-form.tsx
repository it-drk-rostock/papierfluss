"use client";
import { Paper, Stack, Title, Text, Button } from "@mantine/core";
import React from "react";

export const SignInForm = () => {
  return (
    <Paper withBorder p="md" maw={400} mx="auto">
      <Stack gap="sm">
        <Title order={2}>Anmeldung</Title>
        <Text>
          Nach dem Klick auf Anmelden werden Sie weitergeleitet. Geben Sie dort
          Ihre Zugangsdaten für Ihr Firmenkonto ein.
        </Text>
        <Button>Anmelden</Button>
      </Stack>
    </Paper>
  );
};
