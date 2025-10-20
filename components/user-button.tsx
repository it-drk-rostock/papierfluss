"use client";

import { ActionIcon, Avatar, Loader, Menu } from "@mantine/core";
import React, { useTransition } from "react";
import { IconLogout, IconRefresh } from "@tabler/icons-react";
import { authClient } from "@lib/auth-client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/utils/get-initials";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { refreshSession } from "@/server/utils/refresh-session";

export const UserButton = () => {
  const router = useRouter();

  const [isPendingLogout, startTransitionLogout] = useTransition();

  const { data: session, isPending, error, refetch } = authClient.useSession();

  const { execute, status } = useEnhancedAction({
    action: refreshSession,
    hideModals: true,

    onSuccess: () => {
      refetch();
      window.location.reload();
    },
  });

  if (isPending) {
    return <Loader />;
  }
  if (!session || error) {
    return null;
  }

  return (
    <Menu shadow="md" width={200} withinPortal closeOnItemClick={false}>
      <Menu.Target>
        <ActionIcon color="red" size="xl" variant="subtle" radius="xl">
          <Avatar color="red" src={session.user.image || undefined} radius="xl">
            {getInitials(session.user.name)}
          </Avatar>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{session.user.email}</Menu.Label>
        <Menu.Item
          leftSection={
            status === "executing" ? (
              <Loader size={16} />
            ) : (
              <IconRefresh size={16} />
            )
          }
          onClick={() => execute({})}
        >
          Sitzung aktualisieren
        </Menu.Item>
        <Menu.Item
          leftSection={isPendingLogout ? <Loader size={16} /> : <IconLogout size={16} />}
          onClick={() => {
            startTransitionLogout(() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.replace("/");
                },
                onError: (ctx) => {
                  alert(ctx.error.message);
                  },
                },
              });
            });
          }}
        >
          Abmelden
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
