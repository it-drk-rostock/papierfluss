"use client";

import { ActionIcon, Avatar, Loader, Menu } from "@mantine/core";
import React from "react";
import { IconLogout } from "@tabler/icons-react";
import { authClient } from "@lib/auth-client";
import { useRouter } from "next/navigation";

export const UserButton = () => {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }
  if (!session || error) {
    return null;
  }

  return (
    <Menu shadow="md" width={200} withinPortal>
      <Menu.Target>
        <ActionIcon color="red" size="xl" variant="subtle" radius="xl">
          <Avatar radius="xl" color="red" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{session.user.email}</Menu.Label>
        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={() => {
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
          }}
        >
          Abmelden
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
