import { Box, Group, Stack, Text, ActionIcon, Divider } from "@mantine/core";
import { IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";
import { workflowStatus } from "@/constants/workflow-status";
import { ModalButton } from "@/components/modal-button";
import { ResetProcessRunForm } from "./reset-process-run-form";

interface ProcessRunItemProps {
  id: string;
  name: string;
  description: string | null;
  isCategory: boolean;
  status?: "open" | "ongoing" | "completed";
  resetProcessText?: string | null;
  hasChildren: boolean;
  expanded: boolean;
  childrenStatus?: {
    open: number;
    ongoing: number;
    completed: number;
  };
  elementProps?: React.HTMLProps<HTMLDivElement>;
}

export const ProcessRunItem = ({
  id,
  name,
  description,
  isCategory,
  status = "open",
  hasChildren,
  expanded,
  childrenStatus,
  resetProcessText,
  elementProps,
}: ProcessRunItemProps) => {
  const getIcon = () => {
    if (hasChildren) {
      if (expanded) {
        return <IconFolderOpen size={18} color="#FFFFFF" />;
      }
      return <IconFolder size={18} color="#FFFFFF" />;
    }

    if (isCategory) {
      return <IconFolder size={18} color="#FFFFFF" />;
    }

    return <IconFile size={18} color="#FFFFFF" />;
  };

  const getColor = () => {
    if (isCategory) {
      if (!hasChildren) return "green";
      if (!childrenStatus) return "gray";

      const total =
        childrenStatus.open + childrenStatus.ongoing + childrenStatus.completed;

      // If any child is ongoing, make it yellow (in progress)
      if (childrenStatus.ongoing > 0) return "yellow";

      // If any child is completed, make it yellow (in progress)
      if (childrenStatus.completed > 0) return "yellow";

      // If all children are completed, make it green
      if (childrenStatus.completed === total) {
        return "green";
      }

      // If all children are open, make it gray
      if (childrenStatus.open === total) {
        return "gray";
      }

      // Default to yellow for any mixed state
      return "yellow";
    }

    return workflowStatus[status].color;
  };

  return (
    <Box {...elementProps}>
      <Group wrap="nowrap" gap="sm" align="flex-start">
        <Stack align="center" gap={4}>
          <ActionIcon radius="xl" variant="filled" size={42} color={getColor()}>
            {getIcon()}
          </ActionIcon>
          <Divider
            color={getColor()}
            size="sm"
            style={{
              height: 25,
              width: 2,
              alignSelf: "center",
            }}
            orientation="vertical"
          />
        </Stack>
        <Stack gap={0} align="flex-start">
          <Text
            style={{
              lineHeight: 1.2,
            }}
            size="md"
            c="black"
            fw={500}
          >
            {name}
          </Text>
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
          {!isCategory && (
            <Text size="xs" c={getColor()}>
              {workflowStatus[status].label}
            </Text>
          )}
          {resetProcessText && (
            <Text size="xs" c="yellow">
              Bitte beachten Sie: {resetProcessText}
            </Text>
          )}
          {!isCategory && status === "completed" && (
            <ModalButton
              title="Prozess zurücksetzen"
              variant="subtle"
              color="yellow"
              size="compact-xs"
              content={<ResetProcessRunForm id={id} />}
            >
              Prozess zurücksetzen
            </ModalButton>
          )}
        </Stack>
      </Group>
    </Box>
  );
};
