"use client";
import {
  AppShell,
  NavLink,
  Stack,
  Group,
  ActionIcon,
  Loader,
} from "@mantine/core";
import React, { Suspense } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Branding } from "./branding";
import { UserButton } from "./user-button";
import {
  IconApps,
  IconClipboard,
  IconFolder,
  IconHome,
  IconLayoutSidebarRightExpand,
  IconMessage2Star,
  IconUserShield,
} from "@tabler/icons-react";
import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { Breadcrumbs } from "./breadcrumbs";
import { useQuery } from "@tanstack/react-query";
import { getWorkflowsAndForms } from "@/app/(app)/_actions";
import { modals } from "@mantine/modals";
import { CreateFeedbackForm } from "./create-feedback-form";
import {
  getAccessibleFolderTree,
  type FolderNodeV2,
} from "@/app/(app)/formsv2/_actions";

const FolderNavigation = ({ folder }: { folder: FolderNodeV2 }) => (
  <NavLink
    label={folder.name}
    leftSection={<IconFolder size={16} stroke={1.5} />}
  >
    {folder.forms.map((form) => (
      <NavLink
        key={form.id}
        component={Link}
        href={"/formsv2/" + form.id}
        label={form.title}
      />
    ))}
    {folder.children.map((child) => (
      <FolderNavigation key={child.id} folder={child} />
    ))}
  </NavLink>
);

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const { data, isPending } = useQuery({
    queryKey: ["workflowsAndForms"],
    queryFn: getWorkflowsAndForms,
  });
  const { data: folderTreeV2, isPending: isPendingFolderTreeV2 } = useQuery({
    queryKey: ["accessibleFolderTreeV2"],
    queryFn: getAccessibleFolderTree,
  });

  const { hasAccess, session } = useAuthSession();
  const workflows = data?.workflows ?? [];
  const forms = data?.forms ?? [];
  const disablePortale = !isPending && workflows.length === 0;
  const disableFormulare = !isPending && forms.length === 0;
  const disableFormulareV2 =
    !isPendingFolderTreeV2 &&
    !folderTreeV2?.folders.length &&
    !folderTreeV2?.forms.length;

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
          <Group>
            <ActionIcon
              size="lg"
              color="yellow"
              onClick={() => {
                modals.open({
                  title: "Feedback",
                  children: <CreateFeedbackForm />,
                });
              }}
              variant="subtle"
            >
              <IconMessage2Star style={baseIconStyles} stroke={1.5} />
            </ActionIcon>
            <Suspense fallback={<Loader />}>
              <UserButton />
            </Suspense>
          </Group>
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
            label="Portale"
            leftSection={<IconApps size={16} stroke={1.5} />}
            href="#required-for-focus"
            disabled={disablePortale}
          >
            {["admin", "moderator"].includes(session?.user.role) && (
              <NavLink
                component={Link}
                href="/workflows"
                label="Alle Portale"
              />
            )}
            {isPending ? (
              <NavLink
                label="Portale werden geladen"
                leftSection={<Loader size="xs" />}
              />
            ) : (
              workflows.map((w) => (
                <NavLink
                  key={w.id}
                  component={Link}
                  href={`/workflows/${w.id}`}
                  label={w.name}
                />
              ))
            )}
          </NavLink>
          <NavLink
            component={Link}
            label="Formulare"
            href="#required-for-focus"
            leftSection={<IconClipboard size={16} stroke={1.5} />}
            disabled={disableFormulare}
          >
            {["admin", "moderator"].includes(session?.user.role) && (
              <NavLink component={Link} href="/forms" label="Alle Formulare" />
            )}
            {isPending ? (
              <NavLink
                label="Formulare werden geladen"
                leftSection={<Loader size="xs" />}
              />
            ) : (
              forms.map((f) => (
                <NavLink
                  key={f.id}
                  component={Link}
                  href={`/forms/${f.id}`}
                  label={f.title}
                />
              ))
            )}
          </NavLink>
          {hasAccess("admin") && (
            <NavLink
              component={Link}
              href="/admin"
              label="Admin"
              leftSection={<IconUserShield size={16} stroke={1.5} />}
            />
          )}
          <NavLink
            label="Formulare(V2)"
            href="#required-for-focus"
            leftSection={<IconClipboard size={16} stroke={1.5} />}
            disabled={disableFormulareV2}
          >
            <NavLink component={Link} href="/formsv2" label="Alle Formulare" />
            {isPendingFolderTreeV2 ? (
              <NavLink
                label="Formulare werden geladen"
                leftSection={<Loader size="xs" />}
              />
            ) : (
              <>
                {folderTreeV2?.forms.map((form) => (
                  <NavLink
                    key={form.id}
                    component={Link}
                    href={"/formsv2/" + form.id}
                    label={form.title}
                  />
                ))}
                {folderTreeV2?.folders.map((folder) => (
                  <FolderNavigation key={folder.id} folder={folder} />
                ))}
              </>
            )}
          </NavLink>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Stack gap="md">
          <Suspense fallback={<Loader />}>
            <Breadcrumbs />
          </Suspense>
          {children}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
};
