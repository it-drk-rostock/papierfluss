import { Suspense } from "react";
import { 
  Title, 
  Text, 
  Container, 
  Grid, 
  Card, 
  Badge, 
  Button, 
  Group, 
  Stack, 
  ThemeIcon, 
  ActionIcon, 
  Tooltip,
  TextInput,
  SimpleGrid,
  Loader
} from "@mantine/core";
import { 
  IconClipboardText, 
  IconPlus, 
  IconSearch, 
  IconSettings, 
  IconPlayerPlay, 
  IconEye,
  IconArrowRight,
  IconClock,
  IconUsers
} from "@tabler/icons-react";
import Link from "next/link";
import { authQuery } from "@/server/utils/auth-query";

// Mock V2 forms data for UI presentation prior to DB migrations completion
const MOCK_V2_FORMS = [
  {
    id: "urlaubsantrag-v2",
    title: "Urlaubsantrag V2",
    description: "Digitaler Urlaubsantrag mit mehrstufiger Genehmigung (Mitarbeiter -> Teamleiter -> HR).",
    version: "v2.1.0",
    status: "Aktiv",
    permissions: "Alle Mitarbeiter",
    responsibleTeam: "Personalwesen (HR)",
    lastModified: "Vor 2 Std.",
  },
  {
    id: "reisekosten-v2",
    title: "Reisekostenabrechnung",
    description: "Erfassung von Reisebelegen und Spesen mit automatischer n8n-Schnittstelle zur Buchhaltung.",
    version: "v2.0.4",
    status: "Aktiv",
    permissions: "Alle Mitarbeiter",
    responsibleTeam: "Finanzen",
    lastModified: "Gestern",
  },
  {
    id: "it-equipment-v2",
    title: "IT-Hardwareanforderung",
    description: "Bestellprozess für Laptops, Bildschirme und Zubehör inklusive Budgetfreigabe.",
    version: "v2.0.0",
    status: "Entwurf",
    permissions: "Abteilungsleiter",
    responsibleTeam: "IT-Support",
    lastModified: "Vor 3 Tagen",
  }
];

async function FormsV2List() {
  // Protect the route using the authQuery cache helper
  const session = await authQuery();

  return (
    <Stack gap="xl">
      {/* Premium Header Banner with Gradient */}
      <Card 
        padding="xl" 
        radius="md" 
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-red-9) 0%, var(--mantine-color-red-7) 100%)",
          color: "var(--mantine-color-white)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--mantine-shadow-md)"
        }}
      >
        {/* Decorative background element */}
        <div 
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none"
          }}
        />

        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ maxWidth: "70%" }}>
            <Badge color="red.3" variant="light" size="lg">
              Forms V2 Engine
            </Badge>
            <Title order={1} style={{ fontWeight: 800, fontSize: "2rem" }}>
              Formularverwaltung V2
            </Title>
            <Text size="sm" opacity={0.9}>
              Erstellen, konfigurieren und verwalten Sie hochdynamische Formular-Workflows mit 
              feingranularen Feldberechtigungen und direkter n8n-Automatisierung.
            </Text>
          </Stack>
          
          <Button
            component={Link}
            href="/formsv2/create"
            variant="white"
            color="red"
            size="md"
            radius="md"
            leftSection={<IconPlus size={18} />}
            style={{
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "var(--mantine-shadow-sm)"
            }}
            className="hover-scale"
          >
            Neues Formular erstellen
          </Button>
        </Group>
      </Card>

      {/* Search & Filter Bar */}
      <Group justify="space-between">
        <TextInput
          placeholder="Formulare durchsuchen..."
          leftSection={<IconSearch size={16} stroke={1.5} />}
          radius="md"
          style={{ width: 350 }}
        />
        <Text size="xs" c="dimmed">
          Angemeldet als: <strong>{session.user.name}</strong> ({session.user.role})
        </Text>
      </Group>

      {/* List Grid */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
        {MOCK_V2_FORMS.map((form) => (
          <Card 
            key={form.id} 
            padding="lg" 
            radius="md" 
            withBorder 
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer"
            }}
            className="hover-card"
          >
            <Stack gap="md">
              <Group justify="space-between" align="start">
                <ThemeIcon color="red" variant="light" size="xl" radius="md">
                  <IconClipboardText size={24} />
                </ThemeIcon>
                <Group gap="xs">
                  <Badge color="gray.3" c="gray.8" variant="flat">
                    {form.version}
                  </Badge>
                  <Badge color={form.status === "Aktiv" ? "green" : "orange"} variant="light">
                    {form.status}
                  </Badge>
                </Group>
              </Group>

              <div>
                <Title order={3} size="h4" style={{ fontWeight: 700 }} mb="xs">
                  {form.title}
                </Title>
                <Text size="sm" c="dimmed" lineClamp={3}>
                  {form.description}
                </Text>
              </div>
            </Stack>

            <Stack gap="sm" mt="xl">
              <div style={{ borderTop: "1px solid var(--mantine-color-gray-2)", paddingTop: "12px" }}>
                <Group justify="space-between" mb="xs">
                  <Group gap="5" wrap="nowrap">
                    <IconUsers size={14} className="icon-dimmed" />
                    <Text size="xs" c="dimmed">Bereich:</Text>
                  </Group>
                  <Text size="xs" style={{ fontWeight: 600 }}>{form.responsibleTeam}</Text>
                </Group>
                
                <Group justify="space-between">
                  <Group gap="5" wrap="nowrap">
                    <IconClock size={14} className="icon-dimmed" />
                    <Text size="xs" c="dimmed">Zuletzt geändert:</Text>
                  </Group>
                  <Text size="xs" c="dimmed">{form.lastModified}</Text>
                </Group>
              </div>

              <Group gap="sm" grow mt="xs">
                <Button 
                  component={Link}
                  href={`/formsv2/${form.id}`}
                  variant="light" 
                  color="red"
                  size="xs"
                  radius="md"
                  leftSection={<IconPlayerPlay size={14} />}
                >
                  Ausfüllen
                </Button>
                <Button 
                  component={Link}
                  href={`/formsv2/submissions/${form.id}`}
                  variant="outline" 
                  color="gray"
                  size="xs"
                  radius="md"
                  leftSection={<IconEye size={14} />}
                >
                  Dashboard
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default function Page() {
  return (
    <Container size="xl" py="md">
      <Suspense fallback={<Loader color="red" size="md" />}>
        <FormsV2List />
      </Suspense>
    </Container>
  );
}
