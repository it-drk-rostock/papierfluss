"use client";
import { AppShell, NavLink, Stack, Group, ActionIcon, Loader } from "@mantine/core";
import React, { Suspense } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Branding } from "./branding";
import { UserButton } from "./user-button";
import {
  IconClipboard,
  IconHome,
  IconLayoutSidebarRightExpand,
  IconTopologyRing,
  IconUserShield,
} from "@tabler/icons-react";
import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { Breadcrumbs } from "./breadcrumbs";
import { BackButton } from "./back-button";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { hasAccess } = useAuthSession();

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" w="100%" justify="space-between">
          <Group>
            <ActionIcon
              size="lg"
              color="gray"
              onClick={mobileOpened ? toggleMobile : toggleDesktop}
              variant="subtle"
            >
              <IconLayoutSidebarRightExpand
                style={baseIconStyles}
                stroke={1.5}
              />
            </ActionIcon>
            <Branding />
          </Group>
          <UserButton />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack gap="sm">
          <NavLink
            component={Link}
            href="/dashboard"
            label="Übersicht"
            leftSection={<IconHome size={16} stroke={1.5} />}
          />
          <NavLink
            component={Link}
            href="/workflows"
            label="Workflows"
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
              component={Link}
              href="/admin"
              label="Admin"
              leftSection={<IconUserShield size={16} stroke={1.5} />}
            />
          )}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Stack gap="md">
          <Suspense fallback={<Loader />}>
            <BackButton variant="light" />
            <Breadcrumbs />
          </Suspense>
          {children}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
};
