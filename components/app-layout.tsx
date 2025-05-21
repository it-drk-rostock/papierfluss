"use client";
import { AppShell, Burger, NavLink, Stack, Group } from "@mantine/core";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import { Branding } from "./branding";
import { UserButton } from "./user-button";
import {
  IconClipboard,
  IconHome,
  IconTopologyRing,
  IconUserShield,
} from "@tabler/icons-react";
import Link from "next/link";

import { useAuthSession } from "@/hooks/use-auth-session";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { hasAccess } = useAuthSession();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Branding />
          <UserButton />
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
          />
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
          />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack gap="sm">
          <NavLink
            component={Link}
            href="/dashboard"
            label="Dashboard"
            leftSection={<IconHome size={16} stroke={1.5} />}
          />
          <NavLink
            component={Link}
            href="/workflows"
            label="Worfklows"
            disabled
            leftSection={<IconTopologyRing size={16} stroke={1.5} />}
          />
          <NavLink
            component={Link}
            href="/forms"
            label="Formulare"
            leftSection={<IconClipboard size={16} stroke={1.5} />}
          />
          {hasAccess("admin") && (
            <NavLink
              href="/admin"
              label="Admin"
              leftSection={<IconUserShield size={16} stroke={1.5} />}
            />
          )}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Stack gap="md">{children}</Stack>
      </AppShell.Main>
    </AppShell>
  );
};
