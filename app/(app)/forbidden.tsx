import { LinkBackButton } from "@/components/link-back-button";
import { Center, Paper, Stack, Text, Title } from "@mantine/core";

export default function Forbidden() {
  return (
    <Center>
      <Paper withBorder p="lg">
        <Stack gap="sm">
          <Title order={1}>Zugriff verweigert</Title>
          <Text>
            Sie haben keine Berechtigung, um auf diese Seite zuzugreifen. Wenden
            Sie sich an Ihren Administrator, falls Sie glauben, dass dies ein
            Fehler ist.
          </Text>
          <LinkBackButton>Zurück</LinkBackButton>
        </Stack>
      </Paper>
    </Center>
  );
}
