"use client";

import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Tree,
  moveTreeNode,
  type TreeNodeData,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconFolder,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createFolderV2,
  deleteFolderV2,
  reorderFoldersV2,
  updateFolderV2,
} from "@/app/(app)/formsv2/_actions";

interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

function buildTree(folders: FolderRecord[]): TreeNodeData[] {
  const nodes = new Map<string, TreeNodeData>(
    folders.map((folder) => [
      folder.id,
      {
        label: folder.name,
        value: folder.id,
        nodeProps: { name: folder.name },
        children: [],
      } satisfies TreeNodeData,
    ])
  );
  const roots: TreeNodeData[] = [];

  for (const folder of folders) {
    const node = nodes.get(folder.id)!;
    const parent = folder.parentId ? nodes.get(folder.parentId) : undefined;
    if (parent) {
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function serializeTree(
  nodes: TreeNodeData[],
  parentId: string | null = null
): Array<{ id: string; parentId: string | null; order: number }> {
  return nodes.flatMap((node, order) => [
    { id: node.value, parentId, order },
    ...serializeTree(node.children ?? [], node.value),
  ]);
}

function FolderNameForm({
  initialName = "",
  submitLabel,
  onSubmit,
}: {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        setPending(true);
        try {
          await onSubmit(name);
        } finally {
          setPending(false);
        }
      }}
    >
      <Stack>
        <TextInput
          autoFocus
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          required
        />
        <Group justify="flex-end">
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export function FolderManager({ folders }: { folders: FolderRecord[] }) {
  const [tree, setTree] = useState(() => buildTree(folders));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    setTree(buildTree(folders));
    setDirty(false);
  }, [folders]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["accessibleFolderTreeV2"] });
    router.refresh();
  };

  const runFolderMutation = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      modals.closeAll();
      notifications.show({ color: "green", message });
      await refresh();
      return true;
    } catch (error) {
      notifications.show({
        color: "red",
        message: error instanceof Error ? error.message : "Aktion fehlgeschlagen",
      });
      return false;
    }
  };

  const canOpenFolderMutation = () => {
    if (!dirty) return true;
    notifications.show({
      color: "yellow",
      message: "Layout zuerst speichern oder Seite neu laden",
    });
    return false;
  };

  const openCreate = (parentId: string | null) => {
    if (!canOpenFolderMutation()) return;
    modals.open({
      title: "Ordner erstellen",
      children: (
        <FolderNameForm
          submitLabel="Erstellen"
          onSubmit={async (name) => {
            await runFolderMutation(
              () => createFolderV2(name, parentId),
              "Ordner wurde erstellt"
            );
          }}
        />
      ),
    });
  };

  const openRename = (id: string, name: string) => {
    if (!canOpenFolderMutation()) return;
    modals.open({
      title: "Ordner umbenennen",
      children: (
        <FolderNameForm
          initialName={name}
          submitLabel="Speichern"
          onSubmit={async (nextName) => {
            await runFolderMutation(
              () => updateFolderV2(id, nextName),
              "Ordner wurde umbenannt"
            );
          }}
        />
      ),
    });
  };

  const openDelete = (id: string, name: string) => {
    if (!canOpenFolderMutation()) return;
    modals.openConfirmModal({
      title: "Ordner l\u00f6schen",
      children: (
        <Text size="sm">
          &quot;{name}&quot; l&ouml;schen? Unterordner und Formulare werden eine
          Ebene nach oben verschoben.
        </Text>
      ),
      labels: { confirm: "L\u00f6schen", cancel: "Abbrechen" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        runFolderMutation(() => deleteFolderV2(id), "Ordner wurde gel\u00f6scht"),
    });
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text c="dimmed">
          Ordner ziehen, um Reihenfolge oder Verschachtelung zu &auml;ndern.
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openCreate(null)}>
          Ordner erstellen
        </Button>
      </Group>

      <Paper withBorder p="md">
        {tree.length === 0 ? (
          <Text c="dimmed">Noch keine Formular-Ordner vorhanden.</Text>
        ) : (
          <Tree
            data={tree}
            withLines
            withDragHandle
            onDragDrop={(payload) => {
              setTree((current) => moveTreeNode(current, payload));
              setDirty(true);
            }}
            renderNode={({
              node,
              elementProps,
              expanded,
              hasChildren,
              dragHandleProps,
            }) => {
              const name = String(node.nodeProps?.name ?? node.label);
              return (
                <Group {...elementProps} gap="xs" wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={name + " verschieben"}
                    {...dragHandleProps}
                  >
                    <IconGripVertical size={16} />
                  </ActionIcon>
                  <IconFolder size={18} />
                  <Text
                    style={{ flex: 1 }}
                    fw={500}
                    aria-expanded={hasChildren ? expanded : undefined}
                  >
                    {node.label}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    aria-label={"Unterordner in " + name + " erstellen"}
                    onClick={(event) => {
                      event.stopPropagation();
                      openCreate(node.value);
                    }}
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    aria-label={name + " umbenennen"}
                    onClick={(event) => {
                      event.stopPropagation();
                      openRename(node.value, name);
                    }}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={name + " l\u00f6schen"}
                    onClick={(event) => {
                      event.stopPropagation();
                      openDelete(node.value, name);
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              );
            }}
          />
        )}
      </Paper>

      <Group justify="flex-end">
        <Button
          disabled={!dirty}
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const saved = await runFolderMutation(
                () => reorderFoldersV2(serializeTree(tree)),
                "Ordnerlayout wurde gespeichert"
              );
              if (saved) setDirty(false);
            } finally {
              setSaving(false);
            }
          }}
        >
          Layout speichern
        </Button>
      </Group>
    </Stack>
  );
}
