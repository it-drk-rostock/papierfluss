"use client";

import { useMemo, useState } from "react";
import {
  Modal,
  Stack,
  TextInput,
  Text,
  Group,
  Badge,
  ActionIcon,
  Tooltip,
  Paper,
  ScrollArea,
  Alert,
  Loader,
  Center,
  Button,
} from "@mantine/core";
import {
  IconSearch,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconVariable,
  IconRefresh,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useClipboard } from "@mantine/hooks";
import { showNotification } from "@/utils/notification";
import {
  AvailableVariable,
  getWorkflowAvailableVariables,
} from "../_actions";

interface WorkflowVariablesModalProps {
  opened: boolean;
  onClose: () => void;
  processId: string;
  workflowId?: string;
}

export const WorkflowVariablesModal = ({
  opened,
  onClose,
  processId,
  workflowId,
}: WorkflowVariablesModalProps) => {
  const [search, setSearch] = useState("");
  const clipboard = useClipboard({ timeout: 1500 });
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["workflow-available-variables", processId, workflowId],
    queryFn: () => getWorkflowAvailableVariables({ processId, workflowId }),
    enabled: opened,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const variables = data?.variables ?? [];

  const filteredVariables = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return variables;
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        (v.sourceProcessName && v.sourceProcessName.toLowerCase().includes(query)) ||
        (v.sampleValue !== undefined &&
          String(v.sampleValue).toLowerCase().includes(query)),
    );
  }, [variables, search]);

  const handleCopy = (varName: string) => {
    const textToCopy = `{${varName}}`;
    clipboard.copy(textToCopy);
    setCopiedVar(varName);
    showNotification(`Kopiert: ${textToCopy}`, "success");
    setTimeout(() => {
      setCopiedVar(null);
    }, 1500);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconVariable size={22} style={{ color: "var(--mantine-color-blue-filled)" }} />
          <div>
            <Text fw={600} size="md">
              Verfügbare Workflow-Variablen
            </Text>
            {data?.workflowName && (
              <Text size="xs" c="dimmed">
                Workflow: {data.workflowName}
              </Text>
            )}
          </div>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      zIndex={1200}
    >
      <Stack gap="md">
        <Alert
          variant="light"
          color="blue"
          icon={<IconInfoCircle size={18} />}
          title="Verwendung im Formular-Designer"
        >
          <Text size="xs">
            Alle unten aufgeführten Felder werden bei der Ausführung flach bereitgestellt.
            Du kannst sie in Fragen, Titeln oder Ausdrücken (z. B.{" "}
            <code>visibleIf: &#123;Bereich&#125; notempty</code>) direkt mit den geschweiften Klammern{" "}
            <code>&#123;VariablenName&#125;</code> einbinden.
          </Text>
        </Alert>

        <Group justify="space-between" align="center">
          <TextInput
            placeholder="Variablen oder Prozesse durchsuchen..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
            size="sm"
          />
          <Tooltip label="Neu laden">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => refetch()}
              loading={isFetching}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Group gap="xs">
          <Badge variant="light" color="blue">
            {filteredVariables.length}{" "}
            {filteredVariables.length === 1 ? "Variable" : "Variablen"}
          </Badge>
          {data && (
            <Badge variant="subtle" color="gray">
              Aus den letzten {data.runCount}{" "}
              {data.runCount === 1 ? "Ausführung" : "Ausführungen"}
            </Badge>
          )}
        </Group>

        <ScrollArea.Autosize mah={420} type="always" offsetScrollbars>
          {isLoading ? (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <Loader size="md" />
                <Text size="sm" c="dimmed">
                  Lade Variablen aus den letzten Ausführungen...
                </Text>
              </Stack>
            </Center>
          ) : isError ? (
            <Alert color="red" variant="light" title="Fehler">
              Variablen konnten nicht geladen werden.
            </Alert>
          ) : filteredVariables.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed" size="sm">
                {search
                  ? "Keine passenden Variablen gefunden."
                  : "Noch keine Variablen oder Submissions für diesen Workflow vorhanden."}
              </Text>
            </Center>
          ) : (
            <Stack gap="xs">
              {filteredVariables.map((v) => {
                const isCopied = copiedVar === v.name;
                return (
                  <Paper
                    key={v.name}
                    withBorder
                    p="xs"
                    radius="sm"
                    style={{
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap" align="center">
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" wrap="nowrap">
                          <Text
                            fw={600}
                            size="sm"
                            style={{
                              fontFamily: "monospace",
                              userSelect: "all",
                            }}
                          >
                            &#123;{v.name}&#125;
                          </Text>
                          {v.isSystem && (
                            <Badge size="xs" color="violet" variant="light">
                              System
                            </Badge>
                          )}
                          {v.sourceProcessName && !v.isSystem && (
                            <Badge size="xs" color="gray" variant="outline">
                              {v.sourceProcessName}
                            </Badge>
                          )}
                          {v.count > 0 && (
                            <Text size="xs" c="dimmed">
                              ({v.count}x befüllt)
                            </Text>
                          )}
                        </Group>

                        {v.sampleValue !== undefined && (
                          <Text size="xs" c="dimmed" truncate>
                            Beispiel:{" "}
                            <span style={{ color: "var(--mantine-color-text)" }}>
                              {typeof v.sampleValue === "object"
                                ? JSON.stringify(v.sampleValue)
                                : String(v.sampleValue)}
                            </span>
                          </Text>
                        )}
                      </Stack>

                      <Button
                        variant={isCopied ? "filled" : "light"}
                        color={isCopied ? "teal" : "blue"}
                        size="xs"
                        leftSection={
                          isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />
                        }
                        onClick={() => handleCopy(v.name)}
                      >
                        {isCopied ? "Kopiert" : "Kopieren"}
                      </Button>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
