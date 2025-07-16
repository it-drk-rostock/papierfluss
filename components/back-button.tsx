"use client";

import { Button, ButtonProps } from "@mantine/core";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { IconArrowLeft } from "@tabler/icons-react";

export type BackButtonProps = Omit<ButtonProps, "onClick" | "children">;

export const BackButton = (props: BackButtonProps) => {
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
    <Button
      {...props}
      leftSection={<IconArrowLeft size={16} />}
      w="fit-content"
      loading={isPending}
      onClick={() => startTransition(() => router.back())}
    >
      Zurück
    </Button>
  );
};
