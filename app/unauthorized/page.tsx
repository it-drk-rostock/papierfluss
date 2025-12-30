import { BaseLayout } from "@/components/base-layout";
import { ButtonLink } from "@/components/button-link";
import { Paper, Stack, Text, Title, Center } from "@mantine/core";

export default function Unauthorized() {
  return (
    <BaseLayout>
      <Paper withBorder p="lg">
        <Stack gap="sm">
          <Title order={1}>Anmeldung erforderlich</Title>
          <Text>
            Sie sind nicht angemeldet. Bitte melden Sie sich an, um auf diese
            Seite zuzugreifen.
          </Text>
          <ButtonLink title="Zur Anmeldung" href="/" />
        </Stack>
      </Paper>
    </BaseLayout>
  );
}
