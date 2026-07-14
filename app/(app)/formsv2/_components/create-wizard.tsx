"use client";

import React, { useState } from "react";
import {
  Stepper,
  Button,
  Group,
  TextInput,
  Textarea,
  Stack,
  Card,
  Title,
  Text,
  Badge,
  ActionIcon,
  Select,
  Checkbox,
  MultiSelect,
  Grid,
  ThemeIcon,
  List
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { 
  IconPlus, 
  IconTrash, 
  IconClipboardText, 
  IconSchema, 
  IconRoute, 
  IconCheck, 
  IconBolt, 
  IconNetwork,
  IconArrowRight,
  IconArrowLeft,
  IconDeviceFloppy
} from "@tabler/icons-react";

export const CreateWizard = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  // Local state for Step 1: Base Configuration
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  
  // Local state for Step 2: Statuses
  const [statuses, setStatuses] = useState(["Entwurf", "In Prüfung", "Abgeschlossen"]);
  const [newStatusInput, setNewStatusInput] = useState("");

  // Local state for Step 3: Transitions
  const [transitions, setTransitions] = useState([
    { from: "Entwurf", to: "In Prüfung" },
    { from: "In Prüfung", to: "Abgeschlossen" }
  ]);
  const [transFrom, setTransFrom] = useState("Entwurf");
  const [transTo, setTransTo] = useState("In Prüfung");

  // Local state for Step 4: Custom Actions
  const [actions, setActions] = useState([
    { label: "Einreichen", role: "Mitarbeiter", toStatus: "In Prüfung" },
    { label: "Freigeben", role: "Teamleiter", toStatus: "Abgeschlossen" }
  ]);
  const [newActionLabel, setNewActionLabel] = useState("");
  const [newActionRole, setNewActionRole] = useState("Teamleiter");
  const [newActionToStatus, setNewActionToStatus] = useState("Abgeschlossen");

  // Local state for Step 5: Webhooks
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("https://n8n.drk-rostock.de/webhook/form-submission");
  const [triggerEvents, setTriggerEvents] = useState(["create", "archive"]);

  const nextStep = () => {
    if (activeStep < 4) {
      setActiveStep((current) => current + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep((current) => current - 1);
    }
  };

  const addStatus = () => {
    if (newStatusInput.trim() && !statuses.includes(newStatusInput.trim())) {
      setStatuses([...statuses, newStatusInput.trim()]);
      setNewStatusInput("");
    }
  };

  const removeStatus = (status: string) => {
    setStatuses(statuses.filter((s) => s !== status));
    setTransitions(transitions.filter((t) => t.from !== status && t.to !== status));
  };

  const addTransition = () => {
    if (transFrom && transTo && transFrom !== transTo) {
      const exists = transitions.some(t => t.from === transFrom && t.to === transTo);
      if (!exists) {
        setTransitions([...transitions, { from: transFrom, to: transTo }]);
      }
    }
  };

  const removeTransition = (index: number) => {
    setTransitions(transitions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    if (newActionLabel.trim()) {
      setActions([...actions, { 
        label: newActionLabel.trim(), 
        role: newActionRole, 
        toStatus: newActionToStatus 
      }]);
      setNewActionLabel("");
    }
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    notifications.show({
      title: "Formular wird veröffentlicht",
      message: `Das Formular "${formTitle || "Unbenanntes Formular"}" wurde erfolgreich im Entwurfsmodus angelegt.`,
      color: "green",
    });
  };

  return (
    <Card withBorder padding="xl" radius="md" style={{ boxShadow: "var(--mantine-shadow-md)" }}>
      <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm" color="red">
        {/* Step 1: Base Config */}
        <Stepper.Step 
          label="1. Basis-Konfiguration" 
          description="Layout & Info" 
          icon={<IconClipboardText size={18} />}
        >
          <Stack gap="md" mt="xl">
            <Title order={3} size="h4" style={{ fontWeight: 700 }}>
              Formular Stammdaten & Layout
            </Title>
            <Text size="xs" c="dimmed">
              Legen Sie den Namen und das grundlegende Verhalten des Formulars fest.
            </Text>

            <TextInput
              label="Formular Titel"
              placeholder="z.B. IT-Support Anforderung"
              value={formTitle}
              onChange={(e) => setFormTitle(e.currentTarget.value)}
              required
              radius="md"
            />

            <Textarea
              label="Beschreibung"
              placeholder="Erklären Sie den Anwendern kurz den Zweck dieses Formulars."
              value={formDesc}
              onChange={(e) => setFormDesc(e.currentTarget.value)}
              minRows={3}
              radius="md"
            />
            
            <Card withBorder padding="md" radius="md" style={{ backgroundColor: "var(--mantine-color-gray-0)" }}>
              <Group gap="sm">
                <ThemeIcon color="red" variant="light">
                  <IconSchema size={18} />
                </ThemeIcon>
                <div>
                  <Text size="sm" style={{ fontWeight: 600 }}>SurveyJS Schema-Designer Integration</Text>
                  <Text size="xs" c="dimmed">Im nächsten Schritt der Entwicklung binden wir hier den interaktiven Drag-and-Drop Editor ein.</Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Stepper.Step>

        {/* Step 2: Statuses */}
        <Stepper.Step 
          label="2. Workflow-Status" 
          description="Lifecycle States" 
          icon={<IconBolt size={18} />}
        >
          <Stack gap="md" mt="xl">
            <Title order={3} size="h4" style={{ fontWeight: 700 }}>
              Definition der Lebenszyklus-Status
            </Title>
            <Text size="xs" c="dimmed">
              Fügen Sie Statuswerte hinzu, die das Formular während seiner Bearbeitung annehmen kann.
            </Text>

            <Group align="end">
              <TextInput
                label="Neuer Status"
                placeholder="z.B. In HR-Prüfung"
                value={newStatusInput}
                onChange={(e) => setNewStatusInput(e.currentTarget.value)}
                style={{ flex: 1 }}
                radius="md"
              />
              <Button color="red" onClick={addStatus} leftSection={<IconPlus size={16} />} radius="md">
                Hinzufügen
              </Button>
            </Group>

            <Text size="sm" style={{ fontWeight: 600 }} mt="sm">
              Aktuell definierte Status:
            </Text>
            <Group gap="sm">
              {statuses.map((status) => (
                <Badge 
                  key={status} 
                  size="lg" 
                  color="red" 
                  variant="light"
                  rightSection={
                    <ActionIcon 
                      size="xs" 
                      color="red" 
                      variant="transparent" 
                      onClick={() => removeStatus(status)}
                    >
                      <IconTrash size={10} />
                    </ActionIcon>
                  }
                >
                  {status}
                </Badge>
              ))}
            </Group>
          </Stack>
        </Stepper.Step>

        {/* Step 3: Transitions */}
        <Stepper.Step 
          label="3. Status-Übergänge" 
          description="Pathways" 
          icon={<IconRoute size={18} />}
        >
          <Stack gap="md" mt="xl">
            <Title order={3} size="h4" style={{ fontWeight: 700 }}>
              Status-Übergänge (Zustandsmaschine)
            </Title>
            <Text size="xs" c="dimmed">
              Definieren Sie, von welchem Ausgangs-Status das Formular in welchen Ziel-Status wechseln darf.
            </Text>

            <Grid align="end">
              <Grid.Col span={5}>
                <Select
                  label="Von Status"
                  placeholder="Auswählen"
                  data={statuses}
                  value={transFrom}
                  onChange={(val) => setTransFrom(val || "")}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={2} style={{ textAlign: "center", paddingBottom: "10px" }}>
                <IconArrowRight size={24} style={{ color: "var(--mantine-color-gray-4)" }} />
              </Grid.Col>
              <Grid.Col span={5}>
                <Select
                  label="Zu Status"
                  placeholder="Auswählen"
                  data={statuses.filter(s => s !== transFrom)}
                  value={transTo}
                  onChange={(val) => setTransTo(val || "")}
                  radius="md"
                />
              </Grid.Col>
            </Grid>
            <Button color="red" fullWidth onClick={addTransition} leftSection={<IconPlus size={16} />} radius="md">
              Übergangspfad hinzufügen
            </Button>

            <Text size="sm" style={{ fontWeight: 600 }} mt="sm">
              Zulässige Pfade:
            </Text>
            <List spacing="xs" size="sm" center>
              {transitions.map((t, idx) => (
                <List.Item 
                  key={idx}
                  icon={
                    <ThemeIcon color="red.2" c="red.8" size={20} radius="xl">
                      <IconRoute size={12} />
                    </ThemeIcon>
                  }
                >
                  <Group justify="space-between" style={{ width: "100%", display: "inline-flex" }}>
                    <Text size="sm">
                      Von <strong>{t.from}</strong> nach <strong>{t.to}</strong>
                    </Text>
                    <ActionIcon color="red" variant="subtle" size="sm" onClick={() => removeTransition(idx)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </List.Item>
              ))}
            </List>
          </Stack>
        </Stepper.Step>

        {/* Step 4: Actions & Permissions */}
        <Stepper.Step 
          label="4. Aktionen & Rechte" 
          description="Buttons & Roles" 
          icon={<IconCheck size={18} />}
        >
          <Stack gap="md" mt="xl">
            <Title order={3} size="h4" style={{ fontWeight: 700 }}>
              Workflow-Aktionen konfigurieren
            </Title>
            <Text size="xs" c="dimmed">
              Bestimmen Sie die Aktions-Schaltflächen, die Benutzern angezeigt werden, und verknüpfen Sie sie mit Berechtigungen.
            </Text>

            <Grid align="end" gutter="sm">
              <Grid.Col span={4}>
                <TextInput
                  label="Button Beschriftung"
                  placeholder="z.B. Freigeben"
                  value={newActionLabel}
                  onChange={(e) => setNewActionLabel(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label="Berechtigte Rolle"
                  data={["Jeder", "Mitarbeiter", "Teamleiter", "Moderator", "Admin"]}
                  value={newActionRole}
                  onChange={(val) => setNewActionRole(val || "Jeder")}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <Select
                  label="Zielstatus nach Klick"
                  data={statuses}
                  value={newActionToStatus}
                  onChange={(val) => setNewActionToStatus(val || "")}
                  radius="md"
                />
              </Grid.Col>
            </Grid>
            <Button color="red" onClick={addAction} leftSection={<IconPlus size={16} />} radius="md" mt="xs">
              Aktions-Button anlegen
            </Button>

            <Text size="sm" style={{ fontWeight: 600 }} mt="sm">
              Konfigurierte Buttons:
            </Text>
            {actions.map((act, idx) => (
              <Card key={idx} withBorder padding="sm" radius="md">
                <Group justify="space-between">
                  <div>
                    <Text size="sm" style={{ fontWeight: 700 }}>Button: &quot;{act.label}&quot;</Text>
                    <Text size="xs" c="dimmed">
                      Sichtbar für: <Badge size="xs" color="blue" variant="flat">{act.role}</Badge> &bull; 
                      Aktion: Ändert Status zu <strong>{act.toStatus}</strong>
                    </Text>
                  </div>
                  <ActionIcon color="red" variant="subtle" onClick={() => removeAction(idx)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </Stepper.Step>

        {/* Step 5: Automations */}
        <Stepper.Step 
          label="5. Automatisierung" 
          description="n8n Pipeline" 
          icon={<IconNetwork size={18} />}
        >
          <Stack gap="md" mt="xl">
            <Title order={3} size="h4" style={{ fontWeight: 700 }}>
              n8n-Workflow Schnittstelle
            </Title>
            <Text size="xs" c="dimmed">
              Verknüpfen Sie dieses Formular mit einem externen n8n Automatisierungs-Webhook.
            </Text>

            <TextInput
              label="n8n Webhook URL"
              placeholder="https://..."
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.currentTarget.value)}
              radius="md"
            />

            <Checkbox.Group
              label="Webhook auslösen bei:"
              value={triggerEvents}
              onChange={setTriggerEvents}
              mt="xs"
            >
              <Group mt="xs">
                <Checkbox value="create" label="Formular-Einreichung (Erstellung)" color="red" />
                <Checkbox value="status" label="Status-Übergang" color="red" />
                <Checkbox value="archive" label="Archivierung" color="red" />
              </Group>
            </Checkbox.Group>
            
            <Card withBorder padding="md" radius="md" style={{ backgroundColor: "var(--mantine-color-gray-0)" }} mt="sm">
              <Group gap="sm">
                <ThemeIcon color="red" variant="light">
                  <IconBolt size={18} />
                </ThemeIcon>
                <div>
                  <Text size="sm" style={{ fontWeight: 600 }}>Testlauf bei Veröffentlichung</Text>
                  <Text size="xs" c="dimmed">Beim Speichern wird ein Ping-Payload an die n8n Schnittstelle gesendet, um die Erreichbarkeit zu prüfen.</Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Stepper.Step>
      </Stepper>

      {/* Navigation Buttons */}
      <Group justify="space-between" mt="xl" style={{ borderTop: "1px solid var(--mantine-color-gray-2)", paddingTop: "20px" }}>
        <Button 
          variant="default" 
          onClick={prevStep} 
          disabled={activeStep === 0}
          leftSection={<IconArrowLeft size={16} />}
          radius="md"
        >
          Zurück
        </Button>
        
        {activeStep < 4 ? (
          <Button 
            color="red" 
            onClick={nextStep}
            rightSection={<IconArrowRight size={16} />}
            radius="md"
          >
            Weiter
          </Button>
        ) : (
          <Button 
            color="green" 
            onClick={handlePublish}
            leftSection={<IconDeviceFloppy size={16} />}
            radius="md"
          >
            Entwurf Veröffentlichen
          </Button>
        )}
      </Group>
    </Card>
  );
};
