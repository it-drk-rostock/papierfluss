"use client";
import { Center, Stack, ThemeIconVariant } from "@mantine/core";
import React from "react";
import { TextIcon } from "./text-icon";
import { IconDatabaseOff, IconProps } from "@tabler/icons-react";

type EmptyStateProps = {
  children?: React.ReactNode;
  icon?: React.FC<IconProps>;
  text: string;
  color?: string;
  variant?: ThemeIconVariant;
};

export const EmptyState = ({
  icon,
  text,
  color = "gray",
  variant = "light",
  children,
}: EmptyStateProps) => {
  return (
    <Center>
      <Stack gap="sm">
        <TextIcon
          color={color}
          variant={variant}
          icon={icon ? icon : IconDatabaseOff}
          text={text}
        />

        {children}
      </Stack>
    </Center>
  );
};
