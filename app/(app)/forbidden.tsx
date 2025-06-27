import { LinkBackButton } from "@/components/link-back-button";
import { Center, Paper, Stack, Text, Title } from "@mantine/core";

export default function Forbidden() {
  return (
    <Center>
      <Paper withBorder p="lg">
        <Stack>
          <Title order={1}>Fehlende Berechtigung</Title>
          <Text>
            Sie haben keine Berechtigung, um auf diese Ressource zuzugreifen.
          </Text>
          <LinkBackButton>Zurück</LinkBackButton>
        </Stack>
      </Paper>
    </Center>
  );
}
