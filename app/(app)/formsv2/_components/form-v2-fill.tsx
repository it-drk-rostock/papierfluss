"use client";

import React from "react";
import { 
  Title, 
  Text, 
  Card, 
  Badge, 
  Button, 
  Group, 
  Stack, 
  TextInput, 
  Textarea, 
  Select, 
  Divider,
  Anchor,
  ThemeIcon,
  Alert
} from "@mantine/core";
import { 
  IconArrowLeft, 
  IconLock, 
  IconCheck, 
  IconInfoCircle,
  IconShieldLock
} from "@tabler/icons-react";
import Link from "next/link";

interface FormV2FillProps {
  id: string;
  session: {
    user: {
      name?: string | null;
      role: string;
    };
  };
}

export const FormV2Fill = ({ id, session }: FormV2FillProps) => {
  return (
    <Stack gap="lg">
      {/* Back navigation */}
      <Group>
        <Anchor component={Link} href="/formsv2" size="sm" c="red" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconArrowLeft size={16} />
          Zurück zur Formularübersicht
        </Anchor>
      </Group>

      {/* Form Title & Metadata Card */}
      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" align="start">
          <Stack gap="xs">
            <Group gap="xs">
              <Title order={1} size="h2" style={{ fontWeight: 800 }}>
                Formular-Ausfüllbereich (V2)
              </Title>
              <Badge color="red" variant="filled">V2 Active</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Formular-ID: <code>{id}</code> &bull; Version: <code>v2.1.0</code>
            </Text>
          </Stack>
          <Badge color="green" size="lg" variant="light">
            Status: Bereit zum Ausfüllen
          </Badge>
        </Group>
      </Card>

      {/* Field-level permission advisory alert */}
      <Alert variant="light" color="blue" title="Sicherheitshinweis" icon={<IconInfoCircle size={16} />}>
        Dieses Formular verwendet die neue Forms V2 Feldschutz-Engine. Bestimmte sensible Eingabefelder sind 
        je nach Ihrer Benutzerrolle (Aktuell: <strong>{session.user.role}</strong>) gesperrt oder verborgen.
      </Alert>

      {/* The Form Content Container */}
      <Card withBorder padding="xl" radius="md" style={{ boxShadow: "var(--mantine-shadow-xs)" }}>
        <Stack gap="md">
          <Title order={3} size="h3" style={{ fontWeight: 700 }} mb="xs">
            Antragsdaten
          </Title>
          
          {/* Field 1: Standard Input */}
          <TextInput
            label="Vollständiger Name des Mitarbeiters"
            placeholder="z.B. Max Mustermann"
            description="Ihr Name für die Zuordnung des Antrags"
            required
            radius="md"
          />

          {/* Field 2: Standard Select */}
          <Select
            label="Abteilung / Team"
            placeholder="Wählen Sie Ihr Team"
            data={["IT-Support", "Personalwesen (HR)", "Finanzen", "Marketing", "Vertrieb"]}
            required
            radius="md"
          />

          {/* Field 3: Textarea */}
          <Textarea
            label="Begründung / Beschreibung des Anliegens"
            placeholder="Beschreiben Sie hier kurz Ihr Anliegen..."
            minRows={3}
            radius="md"
          />

          <Divider my="sm" label="Interne Bereiche (Geschützte Felder)" labelPosition="left" />

          {/* Field 4: Protected Field (Simulating locking context) */}
          <div style={{ position: "relative" }}>
            <TextInput
              label="Genehmigungsvermerk des Teamleiters"
              placeholder="Nur für Teamleiter freigegeben"
              disabled
              radius="md"
              rightSection={
                <ThemeIcon size="xs" color="orange" variant="light">
                  <IconLock size={12} />
                </ThemeIcon>
              }
            />
            <Group gap="xs" mt="xs">
              <IconShieldLock size={14} color="var(--mantine-color-orange-6)" />
              <Text size="xs" c="orange.7">
                Geschütztes Feld: Erfordert <code>editPermissionRule: teamleader</code>.
              </Text>
            </Group>
          </div>

          {/* Field 5: Highly Protected Field */}
          <div style={{ position: "relative", marginTop: "10px" }}>
            <TextInput
              label="HR-Freigabestempel & Unterschrift"
              placeholder="Nur für HR-Abteilung freigegeben"
              disabled
              radius="md"
              rightSection={
                <ThemeIcon size="xs" color="red" variant="light">
                  <IconLock size={12} />
                </ThemeIcon>
              }
            />
            <Group gap="xs" mt="xs">
              <IconShieldLock size={14} color="var(--mantine-color-red-6)" />
              <Text size="xs" c="red.7">
                Geschütztes Feld: Erfordert <code>editPermissionRule: admin_or_hr</code>.
              </Text>
            </Group>
          </div>

          {/* Actions */}
          <Group justify="space-between" mt="xl">
            <Button component={Link} href="/formsv2" variant="subtle" color="gray" radius="md">
              Abbrechen
            </Button>
            <Group gap="sm">
              <Button variant="outline" color="red" radius="md">
                Als Entwurf speichern
              </Button>
              <Button color="red" radius="md" leftSection={<IconCheck size={16} />}>
                Formular absenden
              </Button>
            </Group>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
