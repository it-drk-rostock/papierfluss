"use client";
import { authClient } from "@lib/auth-client";
import { Paper, Stack, Title, Text, Button } from "@mantine/core";
import React, { useTransition } from "react";

export const SignInForm = () => {
  const [isPending, startTransition] = useTransition();
  const signIn = async () => {
    startTransition(async () => {
      const data = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/dashboard", //the url to redirect to after the sign in
      });
    });
  };

  return (
    <Paper withBorder p="md" maw={400} mx="auto">
      <Stack gap="sm">
        <Title order={2}>Anmeldung</Title>
        <Text>
          Nach dem Klick auf Anmelden werden Sie weitergeleitet. Geben Sie dort
          Ihre Zugangsdaten für Ihr Firmenkonto ein.
        </Text>
        <Button loading={isPending} onClick={signIn}>
          Anmelden
        </Button>
      </Stack>
    </Paper>
  );
};
