"use client";

import { DrawerMenuItem } from "@/components/drawer-menu-item";
import { MenuItemLink } from "@/components/link-menu-item";
import {
  Card,
  Title,
  Text,
  Divider,
  Menu,
  Button,
  Stack,
  Badge,
  Group,
  MenuItem,
  MenuLabel,
  MenuDivider,
} from "@mantine/core";
import { useClipboard, useDisclosure } from "@mantine/hooks";
import {
  IconBrandTeams,
  IconExternalLink,
  IconEye,
  IconPencil,
  IconTrash,
  IconWriting,
} from "@tabler/icons-react";
import { deleteForm, fillOutForm, FormProps, removeTeam } from "../_actions";
import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { FormForm } from "./form-form";
import { SurveyPreview } from "@/components/survey-preview";
import { MenuItemAction } from "@/components/menu-item-action";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { ModalButton } from "@/components/modal-button";
import { TeamList } from "@/components/team-list";
import { AssignTeamsForm } from "./assign-teams-form";
import { useAuthSession } from "@/hooks/use-auth-session";

export const FormCard = ({ form }: { form: FormProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);
  const clipboard = useClipboard({ timeout: 500 });
  const { hasAccess } = useAuthSession();

  return (
    <Card key={form.id} padding="lg" withBorder w={350}>
      <Title order={2}>{form.title}</Title>
      <Text c="dimmed">{form.description}</Text>
      <Group gap="xs">
        <Badge color="gray">{form.isPublic ? "Öffentlich" : "Privat"}</Badge>
        <Badge color={form.isActive ? "green" : "red"}>
          {form.isActive ? "Aktiv" : "Inaktiv"}
        </Badge>
      </Group>

      {form.responsibleTeam && (
        <Text>Verantwortlicher Bereich: {form.responsibleTeam?.name}</Text>
      )}
      <Card.Section>
        <Divider my="lg" />
      </Card.Section>
      <Menu
        shadow="md"
        opened={opened}
        width={200}
        closeOnItemClick={false}
        closeOnClickOutside={false}
      >
        <Menu.Target>
          <Button onClick={handlers.toggle} variant="light">
            Aktionen
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <DrawerMenuItem
            leftSection={<IconEye size={14} />}
            drawers={[
              {
                id: "preview-form",
                title: "Formular Vorschau",
                children: (stack) => (
                  <Stack gap="sm">
                    <SurveyPreview json={form.schema} />
                  </Stack>
                ),
              },
            ]}
            initialDrawerId="preview-form"
          >
            Formular Vorschau
          </DrawerMenuItem>
          <MenuItemLink href={`/forms/${form.id}`}>
            Formular Dashboard
          </MenuItemLink>
          {hasAccess("moderator") && (
            <>
              <MenuLabel>Bearbeiten</MenuLabel>
              <MenuItemLink href={`/forms/${form.id}/designer`}>
                Formular Designer
              </MenuItemLink>
              <MenuItemLink href={`/forms/${form.id}/n8n`}>
                N8n Workflows
              </MenuItemLink>
              <DrawerMenuItem
                leftSection={<IconWriting size={14} />}
                drawers={[
                  {
                    id: "update-form",
                    title: "Formular bearbeiten",
                    children: (stack) => <FormForm form={form} />,
                  },
                ]}
                initialDrawerId="update-form"
              >
                Formular bearbeiten
              </DrawerMenuItem>
              <DrawerMenuItem
                leftSection={<IconBrandTeams size={14} />}
                drawers={[
                  {
                    id: "update-teams",
                    title: "Bereiche bearbeiten",
                    children: (stack) => (
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Title order={2}>Bereiche</Title>
                          <ModalButton
                            title="Bereich hinzufügen"
                            content={<AssignTeamsForm formId={form.id} />}
                          >
                            Bereich hinzufügen
                          </ModalButton>
                        </Group>
                        <TeamList
                          teams={form.teams}
                          actions={(team) => (
                            <ModalActionIcon
                              title="Mitglied entfernen"
                              variant="light"
                              content={
                                <ButtonAction
                                  fullWidth
                                  action={removeTeam}
                                  values={{ id: form.id, teamId: team.id }}
                                >
                                  Entfernen
                                </ButtonAction>
                              }
                            >
                              <IconTrash style={baseIconStyles} />
                            </ModalActionIcon>
                          )}
                        />
                      </Stack>
                    ),
                  },
                ]}
                initialDrawerId="update-teams"
              >
                Bereiche bearbeiten
              </DrawerMenuItem>
            </>
          )}
          <MenuLabel>Ausfüllen</MenuLabel>
          <MenuItemAction
            action={fillOutForm}
            values={{ id: form.id }}
            leftSection={<IconPencil size={14} />}
            hideNotification={true}
          >
            Formular Ausfüllen
          </MenuItemAction>
          <MenuItem
            disabled={!form.isActive}
            leftSection={<IconExternalLink size={14} />}
            onClick={() =>
              clipboard.copy(
                `${process.env.NEXT_PUBLIC_BASE_URL}/api/form/${form.id}/generate-link`
              )
            }
          >
            {clipboard.copied
              ? "Link kopiert"
              : "Formular Ausfüll Link generieren"}
          </MenuItem>
          {hasAccess("moderator") && (
            <>
              <MenuDivider />
              <ModalMenuItem
                leftSection={<IconTrash size={14} />}
                color="red"
                title="Formular löschen"
                content={
                  <>
                    <ButtonAction
                      fullWidth
                      action={deleteForm}
                      values={{ id: form.id }}
                    >
                      Löschen
                    </ButtonAction>
                  </>
                }
              >
                Löschen
              </ModalMenuItem>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    </Card>
  );
};
