"use client";
import { baseIconStyles } from "@/constants/base-icon-styles";
import {
  Flex,
  ThemeIcon,
  Text,
  useMantineTheme,
  ThemeIconVariant,
  rem,
  type FlexProps,
} from "@mantine/core";
import { IconProps } from "@tabler/icons-react";
import React from "react";

export type TextIconProps = FlexProps & {
  icon: React.FC<IconProps>;
  text: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fontSize?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  variant?: ThemeIconVariant;
  radius?: "xs" | "sm" | "md" | "lg" | "xl";
};

export const TextIcon: React.FC<TextIconProps> = ({
  icon: Icon,
  text,
  size = "lg",
  fontSize = "sm",
  color = "blue",
  variant = "filled",
  radius = "sm",
  ...props
}) => {
  const theme = useMantineTheme();

  const getBackgroundColor = () => {
    if (variant === "light") return theme.colors[color][1];
    if (variant === "filled") return theme.colors[color][6];
    return "transparent";
  };

  const getTextColor = () => {
    if (variant === "light") return theme.colors[color][6];
    if (variant === "filled") return theme.white;
    return theme.colors[color][6];
  };

  const getBorderColor = () => {
    if (variant === "outline") return theme.colors[color][6];
    return "transparent";
  };

  return (
    <Flex
      align="center"
      gap={rem(2)}
      pr="xs"
      style={{
        backgroundColor: getBackgroundColor(),
        borderRadius: theme.radius[radius],
        border: `1px solid ${getBorderColor()}`,
        width: "fit-content",
      }}
      {...props}
    >
      <ThemeIcon
        size={size}
        color={color}
        bg={getBackgroundColor()}
        variant={variant}
        radius={radius}
      >
        <Icon style={baseIconStyles} />
      </ThemeIcon>
      {text && (
        <Text size={fontSize} c={getTextColor()} fw={500}>
          {text}
        </Text>
      )}
    </Flex>
  );
};
