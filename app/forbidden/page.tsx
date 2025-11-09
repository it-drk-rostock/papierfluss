import { BaseLayout } from "@/components/base-layout";
import { ButtonLink } from "@/components/button-link";
import { Paper, Stack, Text, Title } from "@mantine/core";

export default function Forbidden() {
  return (
    <BaseLayout>
      <Paper withBorder p="lg">
        <Stack gap="sm">
          <Title order={1}>Zugriff nicht erlaubt</Title>
          <Text>
            Sie sind nicht angemeldet oder haben keine Berechtigung, um auf
            diese Seite zuzugreifen.
          </Text>
          <ButtonLink title="Zurück zur Startseite" href="/" />
        </Stack>
      </Paper>
    </BaseLayout>
  );
}
