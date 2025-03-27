"use client";
import { Group, Image, Text, Stack } from "@mantine/core";
import React from "react";

export const Branding = () => {
  return (
    <Group gap="sm">
      <Image
        src={process.env.NEXT_PUBLIC_LOGO_URL}
        alt="logo"
        w={150}
        h="auto"
        loading="lazy"
        fit="contain"
      />
      <Stack gap="sm">
        <Text fw={700} size="xl">
          {process.env.NEXT_PUBLIC_ORGANIZATION_NAME}
        </Text>
        <Text mt="-lg" fw={700} size="xl">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </Text>
      </Stack>
    </Group>
  );
};
