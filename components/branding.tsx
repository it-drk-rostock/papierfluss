"use client";
import { Group, Image, Text, Stack } from "@mantine/core";
import Link from "next/link";
import React from "react";

export const Branding = () => {
  return (
    <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
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
    </Link>
  );
};
