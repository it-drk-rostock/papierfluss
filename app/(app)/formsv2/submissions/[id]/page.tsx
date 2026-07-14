import { Suspense } from "react";
import { 
  Title, 
  Text, 
  Container, 
  Card, 
  Badge, 
  Button, 
  Group, 
  Stack, 
  Tabs,
  Timeline,
  Anchor,
  SimpleGrid,
  ThemeIcon,
  Table,
  Loader
} from "@mantine/core";
import { 
  IconArrowLeft, 
  IconGitCommit, 
  IconCheck, 
  IconX, 
  IconArchive,
  IconClock,
  IconUser,
  IconDatabase,
  IconShieldLock,
  IconHistory
} from "@tabler/icons-react";
import Link from "next/link";
import { authQuery } from "@/server/utils/auth-query";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function SubmissionV2Detail({ params }: PageProps) {
  // 1. Authenticate via authQuery
  const session = await authQuery();
  
  // 2. Resolve parameters
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <Stack gap="lg">
      {/* Back navigation */}
      <Group>
        <Anchor component={Link} href="/formsv2" size="sm" c="red" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconArrowLeft size={16} />
          Zurück zur Formularübersicht
        </Anchor>
      </Group>

      {/* Submission Summary Header Card */}
      <Card withBorder padding="xl" radius="md">
        <Group justify="space-between" align="center">
          <Stack gap="xs">
            <Group gap="xs">
              <Title order={1} size="h2" style={{ fontWeight: 800 }}>
                Submission V2 Detail-Dashboard
              </Title>
              <Badge color="orange" size="lg" variant="light">
                Status: In Prüfung (Teamleiter)
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Einreichungs-ID: <code>{id}</code> &bull; Typ: <code>Urlaubsantrag V2</code>
            </Text>
          </Stack>

          <Group gap="sm">
            <Button variant="outline" color="gray" leftSection={<IconArchive size={16} />} radius="md">
              Archivieren
            </Button>
            <Button variant="outline" color="red" leftSection={<IconX size={16} />} radius="md">
              Zurückweisen
            </Button>
            <Button color="green" leftSection={<IconCheck size={16} />} radius="md">
              Genehmigen
            </Button>
          </Group>
        </Group>

        <div style={{ borderTop: "1px solid var(--mantine-color-gray-2)", marginTop: "20px", paddingTop: "15px" }}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Group gap="sm">
              <ThemeIcon color="red" variant="light" radius="xl">
                <IconUser size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Antragsteller</Text>
                <Text size="sm" style={{ fontWeight: 600 }}>Max Mustermann</Text>
              </div>
            </Group>
            <Group gap="sm">
              <ThemeIcon color="red" variant="light" radius="xl">
                <IconClock size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Eingereicht am</Text>
                <Text size="sm" style={{ fontWeight: 600 }}>14.07.2026, 11:32 Uhr</Text>
              </div>
            </Group>
            <Group gap="sm">
              <ThemeIcon color="red" variant="light" radius="xl">
                <IconDatabase size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Zugeordnete Form-Version</Text>
                <Text size="sm" style={{ fontWeight: 600 }}>Version v2.1.0 (Locked)</Text>
              </div>
            </Group>
          </SimpleGrid>
        </div>
      </Card>

      {/* Tab-driven details */}
      <Tabs defaultValue="data" color="red" variant="outline" radius="md">
        <Tabs.List>
          <Tabs.List>
            <Tabs.Tab value="data" leftSection={<IconDatabase size={16} />}>
              Eingereichte Formulardaten
            </Tabs.Tab>
            <Tabs.Tab value="timeline" leftSection={<IconHistory size={16} />}>
              Status-Historie & Audit Logs
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.List>

        <Tabs.Panel value="data" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              <Title order={3} size="h4" style={{ fontWeight: 700 }}>
                Erfasste Formularantworten
              </Title>
              <Text size="xs" c="dimmed" mb="sm">
                Die folgenden Daten wurden bei der Übertragung übermittelt.
              </Text>

              <Table variant="vertical" withTableBorder>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Th style={{ width: "30%" }}>Name des Mitarbeiters</Table.Th>
                    <Table.Td>Max Mustermann</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Abteilung / Bereich</Table.Th>
                    <Table.Td>IT-Support</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Urlaubszeitraum</Table.Th>
                    <Table.Td>01.08.2026 bis 15.08.2026 (10 Arbeitstage)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Vertretungsregelung</Table.Th>
                    <Table.Td>Erika Musterfrau (Support-Team)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" style={{ fontWeight: 700 }}>Teamleiter Freigabevermerk</Text>
                        <ThemeIcon size="xs" color="orange" variant="light">
                          <IconShieldLock size={12} />
                        </ThemeIcon>
                      </Group>
                    </Table.Th>
                    <Table.Td>
                      <Text size="sm" c="orange.8" style={{ fontStyle: "italic" }}>
                        [Ausgeblendet: Sie besitzen als Standard-Mitarbeiter keine Berechtigung für dieses Feld.]
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm" style={{ fontWeight: 700 }}>HR Freigabestempel</Text>
                        <ThemeIcon size="xs" color="red" variant="light">
                          <IconShieldLock size={12} />
                        </ThemeIcon>
                      </Group>
                    </Table.Th>
                    <Table.Td>
                      <Text size="sm" c="red.8" style={{ fontStyle: "italic" }}>
                        [Ausgeblendet: Maskiert auf Server-Ebene über `viewPermissionRule`.]
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="timeline" pt="md">
          <Card withBorder padding="xl" radius="md">
            <Stack gap="md">
              <Title order={3} size="h4" style={{ fontWeight: 700 }}>
                Audit Trail & Verlauf
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Vollständiger, unveränderlicher Audit-Log dieses Antrags gemäß <code>FormSubmissionLogV2</code>.
              </Text>

              <Timeline active={2} bulletSize={24} lineWidth={2} color="red">
                <Timeline.Item bullet={<IconGitCommit size={12} />} title="Status geändert zu 'In Prüfung'">
                  <Text c="dimmed" size="xs">
                    Status automatisch übergeben an Teamleiter zur Freigabe.
                  </Text>
                  <Text size="xs" mt={4}>
                    Mitarbeiter: <strong>System-Workflow</strong> &bull; Vor 2 Stunden
                  </Text>
                </Timeline.Item>

                <Timeline.Item bullet={<IconGitCommit size={12} />} title="Formular eingereicht (Erstantrag)">
                  <Text c="dimmed" size="xs">
                    Submission-Datensatz erfolgreich in DB geschrieben. n8n-Webhook-Trigger ausgelöst.
                  </Text>
                  <Text size="xs" mt={4}>
                    Mitarbeiter: <strong>Max Mustermann</strong> &bull; Vor 2 Stunden
                  </Text>
                </Timeline.Item>

                <Timeline.Item bullet={<IconGitCommit size={12} />} title="Entwurf zwischengespeichert">
                  <Text c="dimmed" size="xs">
                    Lokaler Entwurf auf Server gesichert.
                  </Text>
                  <Text size="xs" mt={4}>
                    Mitarbeiter: <strong>Max Mustermann</strong> &bull; Gestern
                  </Text>
                </Timeline.Item>
              </Timeline>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

export default function Page({ params }: PageProps) {
  return (
    <Container size="xl" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <SubmissionV2Detail params={params} />
      </Suspense>
    </Container>
  );
}
