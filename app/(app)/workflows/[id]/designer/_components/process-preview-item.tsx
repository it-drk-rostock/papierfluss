"use client";

import { Box, Group, Stack, Text, ActionIcon, Divider } from "@mantine/core";
import { IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";

interface ProcessPreviewItemProps {
  name: string;
  description: string | null;
  isCategory: boolean;
  hasChildren: boolean;
  expanded: boolean;
  elementProps?: React.HTMLProps<HTMLDivElement>;
}

export const ProcessPreviewItem = ({
  name,
  description,
  isCategory,
  hasChildren,
  expanded,
  elementProps,
}: ProcessPreviewItemProps) => {
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

  return (
    <Box {...elementProps}>
      <Group wrap="nowrap" gap="sm" align="flex-start">
        <Stack align="center" gap={4}>
          <ActionIcon
            radius="xl"
            variant="filled"
            size={42}
            color={hasChildren ? "red" : "gray"}
          >
            {getIcon()}
          </ActionIcon>
          <Divider
            color={hasChildren ? "red" : "gray"}
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
        </Stack>
      </Group>
    </Box>
  );
};
