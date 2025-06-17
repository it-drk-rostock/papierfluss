import { Box, Group, Stack, Text, ActionIcon, Divider } from "@mantine/core";
import { IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";
import { workflowStatus } from "@/constants/workflow-status";

interface ProcessRunItemProps {
  name: string;
  description: string | null;
  isCategory: boolean;
  status?: "open" | "ongoing" | "completed";
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
  name,
  description,
  isCategory,
  status = "open",
  hasChildren,
  expanded,
  childrenStatus,
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

      // If any child is ongoing, make it yellow
      if (childrenStatus.ongoing > 0) return "yellow";

      // If all children are completed, make it green
      if (
        childrenStatus.completed ===
        childrenStatus.open + childrenStatus.ongoing + childrenStatus.completed
      ) {
        return "green";
      }

      // If all children are open, make it gray
      if (
        childrenStatus.open ===
        childrenStatus.open + childrenStatus.ongoing + childrenStatus.completed
      ) {
        return "gray";
      }

      return "gray";
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
            <Text size="xs" c={getColor()}>
              {workflowStatus[status].label}
            </Text>
          )}
        </Stack>
      </Group>
    </Box>
  );
};
