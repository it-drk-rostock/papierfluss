import { Suspense } from "react";
import { 
  Title, 
  Text, 
  Container, 
  Stack, 
  Anchor, 
  Group,
  Loader
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { authQuery } from "@/server/utils/auth-query";
import { CreateWizard } from "../_components/create-wizard";

async function FormV2Create() {
  // 1. Route protection via authQuery cache helper
  await authQuery();

  return (
    <Stack gap="lg">
      {/* Back navigation */}
      <Group>
        <Anchor component={Link} href="/formsv2" size="sm" c="red" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconArrowLeft size={16} />
          Zurück zur Formularübersicht
        </Anchor>
      </Group>

      {/* Header Title Section */}
      <div>
        <Title order={1} size="h2" style={{ fontWeight: 800 }} mb="xs">
          Neues Formular anlegen (V2 Wizard)
        </Title>
        <Text size="sm" c="dimmed">
          Konfigurieren Sie Ihr Formular Schritt für Schritt. Alle Änderungen werden bei Abschluss 
          gesichert.
        </Text>
      </div>

      {/* Render the interactive multi-step client wizard */}
      <CreateWizard />
    </Stack>
  );
}

export default function Page() {
  return (
    <Container size="lg" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <FormV2Create />
      </Suspense>
    </Container>
  );
}
