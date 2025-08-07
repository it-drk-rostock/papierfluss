"use client";

import { ActionIcon, ActionIconProps } from "@mantine/core";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { baseIconStyles } from "@/constants/base-icon-styles";

export type BackActionIconProps = Omit<ActionIconProps, "onClick" | "children">;

export const BackActionIcon = (props: BackActionIconProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Simpler check that works with Next.js navigation
    const checkNavigationState = () => {
      try {
        // We consider navigation possible if:
        // 1. We have history entries
        // 2. We're not at the root path
        const hasHistory = window.history.length > 2;
        const isNotRoot = pathname !== "/";

        setCanGoBack(hasHistory && isNotRoot);
      } catch {
        setCanGoBack(false);
      }
    };

    checkNavigationState();

    // Re-check when pathname changes
    window.addEventListener("popstate", checkNavigationState);

    return () => {
      window.removeEventListener("popstate", checkNavigationState);
    };
  }, [pathname]); // Add pathname as dependency

  if (!canGoBack) {
    return null;
  }

  return (
    <ActionIcon
      {...props}
      variant="outline"
      w="fit-content"
      color="gray"
      loading={isPending}
      onClick={() => startTransition(() => router.back())}
    >
      <IconArrowLeft style={baseIconStyles} />
    </ActionIcon>
  );
};
