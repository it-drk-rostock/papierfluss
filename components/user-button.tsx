"use client";

import { ActionIcon, Avatar, Loader, Menu } from "@mantine/core";
import React, { useTransition } from "react";
import { IconLogout, IconRefresh } from "@tabler/icons-react";
import { authClient } from "@lib/auth-client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/utils/get-initials";

export const UserButton = () => {
  const router = useRouter();

  const [isPendingLogout, startTransitionLogout] = useTransition();
  const [isRefreshing, startRefreshing] = useTransition();

  const { data: session, isPending, error, refetch } = authClient.useSession();

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
            isRefreshing ? <Loader size={16} /> : <IconRefresh size={16} />
          }
          onClick={() =>
            startRefreshing(() => {
              refetch();
              window.location.reload();
            })
          }
        >
          Sitzung aktualisieren
        </Menu.Item>
        <Menu.Item
          leftSection={
            isPendingLogout ? <Loader size={16} /> : <IconLogout size={16} />
          }
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
