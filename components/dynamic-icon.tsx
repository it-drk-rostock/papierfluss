"use client";
import * as TablerIcons from "@tabler/icons-react";

interface DynamicIconProps {
  name: string;
  size?: number;
}

export const DynamicIcon = ({ name, size = 24 }: DynamicIconProps) => {
  // Add "Icon" prefix back to match Tabler icon names
  const iconName = "Icon" + name;
  const Icon = (
    TablerIcons as Record<string, React.ComponentType<{ size: number }>>
  )[iconName];

  if (!Icon) {
    return null;
  }

  return <Icon size={size} />;
};
