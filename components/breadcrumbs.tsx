"use client";

import {
  Breadcrumbs as MantineBreadcrumbs,
  rem,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { ButtonLink } from "./button-link";
import { usePathname } from "next/navigation";
import urls from "@/constants/urls.json";

interface BreadcrumbItem {
  title: string;
  href?: string;
}

export const Breadcrumbs = () => {
  const theme = useMantineTheme();
  const pathname = usePathname();

  // Function to get translated title for a path segment
  const getTranslatedTitle = (segment: string): string => {
    // Remove any potential dynamic segments (anything after '[')
    const baseSegment = segment.split("[")[0];
    // Check if we have a translation for this segment
    return (urls as Record<string, string>)[baseSegment] || segment;
  };

  // Generate breadcrumb items from pathname
  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    if (!pathname) return [];

    // Split the pathname into segments and remove empty strings
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
      // Build the href for this breadcrumb
      const href = "/" + segments.slice(0, index + 1).join("/");

      // Get the title - either translated or raw segment
      let title = getTranslatedTitle(segment);

      // If the segment includes a dynamic part (contains '['), keep the dynamic value
      if (segment.includes("[")) {
        title = segment;
      }

      return {
        title,
        href,
      };
    });
  };

  const items = generateBreadcrumbItems();

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;

    return (
      <ButtonLink
        href={item.href ?? ""}
        key={index}
        variant="subtle"
        size="compact-sm"
        color={isLast ? "red" : "gray"}
        title={item.title}
      />
    );
  });

  return (
    <MantineBreadcrumbs
      styles={{
        root: {
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.colors.gray[3]}`,
          width: "fit-content",
        },
      }}
      p="sm"
      bg="transparent"
      separator={<IconChevronRight size={16} stroke={1.5} color="#868e96" />}
      separatorMargin={rem(4)}
    >
      {breadcrumbItems}
    </MantineBreadcrumbs>
  );
};
