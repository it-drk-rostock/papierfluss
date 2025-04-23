"use client";
import { Center, ThemeIconVariant } from "@mantine/core";
import React from "react";
import { TextIcon } from "./text-icon";
import { IconDatabaseOff, IconProps } from "@tabler/icons-react";

type EmptyStateProps = {
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
}: EmptyStateProps) => {
  return (
    <Center>
      <TextIcon
        color={color}
        variant={variant}
        icon={icon ? icon : IconDatabaseOff}
        text={text}
      />
    </Center>
  );
};
