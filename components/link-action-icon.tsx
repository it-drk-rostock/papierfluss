"use client";
import { ActionIcon, ActionIconProps } from "@mantine/core";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { IconEye } from "@tabler/icons-react";

export type ActionIconLinkProps = Omit<ActionIconProps, "children"> & {
  href: string;
};

export const ActionIconLink = ({ href, ...props }: ActionIconLinkProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <ActionIcon
      {...props}
      loading={isPending}
      onClick={() => startTransition(() => router.push(href))}
    >
      <IconEye style={{ width: "70%", height: "70%" }} />
    </ActionIcon>
  );
};
