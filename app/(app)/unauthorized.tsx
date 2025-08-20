import { ButtonLink } from "@/components/button-link";
import { Center, Paper, Stack, Text, Title } from "@mantine/core";

export default function Unauthorized() {
  return (
    <Center>
      <Paper withBorder p="lg">
        <Stack>
          <Title order={1}>Anmeldung erforderlich</Title>
          <Text>
            Sie sind nicht angemeldet. Bitte melden Sie sich an, um auf diese
            Seite zuzugreifen.
          </Text>
          <ButtonLink title="Zur Anmeldung" href="/" />
        </Stack>
      </Paper>
    </Center>
  );
}
