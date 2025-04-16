import { baseIconStyles } from "@/constants/base-icon-styles";
import { ActionIcon } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";

export const ViewActionIcon = ({ href }: { href: string }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <ActionIcon
      loading={isPending}
      component={Link}
      href={href}
      variant="subtle"
      onClick={() => startTransition(() => router.push(href))}
    >
      <IconEye style={baseIconStyles} stroke={1.5} />
    </ActionIcon>
  );
};
