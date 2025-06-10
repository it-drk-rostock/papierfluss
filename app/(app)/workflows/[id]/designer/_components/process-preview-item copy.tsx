"use client";

import { Box, Group, Stack, Text, ActionIcon, Divider } from "@mantine/core";
import { IconCircleCheck, IconFile } from "@tabler/icons-react";

interface ProcessPreviewItemProps {
  name: string;
  description: string | null;
  isCategory: boolean;
  status?: "open" | "ongoing" | "completed";
}

export const ProcessPreviewItem = ({
  name,
  description,
  isCategory,
  status = "open",
}: ProcessPreviewItemProps) => {
  const handleColor = () => {
    if (isCategory) return "gray";
    switch (status) {
      case "open":
        return "gray";
      case "ongoing":
        return "yellow";
      case "completed":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <Box>
      <Group wrap="nowrap" gap="sm" align="flex-start">
        <Stack align="center" gap={4}>
          <ActionIcon
            radius="xl"
            variant="filled"
            size={42}
            color={handleColor()}
          >
            {isCategory ? (
              <IconFile size={18} color="#FFFFFF" />
            ) : (
              <IconCircleCheck size={26} color="#FFFFFF" strokeWidth={2} />
            )}
          </ActionIcon>
          <Divider
            color={handleColor()}
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
            <Text size="xs" c={handleColor()}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          )}
        </Stack>
      </Group>
    </Box>
  );
};
