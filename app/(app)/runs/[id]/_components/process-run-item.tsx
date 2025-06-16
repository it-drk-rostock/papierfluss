import { Box, Group, Stack, Text, ActionIcon, Divider } from "@mantine/core";
import { IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";
import { workflowStatus } from "@/constants/workflow-status";

interface ProcessRunItemProps {
  name: string;
  description: string | null;
  isCategory: boolean;
  status: "open" | "ongoing" | "completed";
  hasChildren: boolean;
  expanded: boolean;
  elementProps?: React.HTMLProps<HTMLDivElement>;
}

export const ProcessRunItem = ({
  name,
  description,
  isCategory,
  status,
  hasChildren,
  expanded,
  elementProps,
}: ProcessRunItemProps) => {
  const getIcon = () => {
    if (hasChildren) {
      if (expanded) {
        return (
          <IconFolderOpen
            size={16}
            color={`var(--mantine-color-${workflowStatus[status].color}-filled)`}
          />
        );
      }
      return (
        <IconFolder
          size={16}
          color={`var(--mantine-color-${workflowStatus[status].color}-filled)`}
        />
      );
    }

    if (isCategory) {
      return <IconFolder size={16} />;
    }

    return <IconFile size={16} />;
  };

  return (
    <Box {...elementProps}>
      <Group wrap="nowrap" gap="sm" align="flex-start">
        <Stack align="center" gap={4}>
          <ActionIcon
            radius="xl"
            variant="filled"
            size={42}
            color={workflowStatus[status].color}
          >
            {getIcon()}
          </ActionIcon>
          <Divider
            color={workflowStatus[status].color}
            size="sm"
            style={{
              height: 25,
              width: 2,
              alignSelf: "center",
            }}
            orientation="vertical"
          />
        </Stack>
        <Stack gap={0}>
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
            <Text size="sm" c="dimmed" fw={500}>
              {description}
            </Text>
          )}
          {!isCategory && (
            <Text size="xs" c={workflowStatus[status].color}>
              {workflowStatus[status].label}
            </Text>
          )}
        </Stack>
      </Group>
    </Box>
  );
};
