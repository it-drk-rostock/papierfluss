"use client";

import { DrawerMenuItem } from "@/components/drawer-menu-item";
import { MenuItemLink } from "@/components/link-menu-item";
import {
  Card,
  Avatar,
  Title,
  Text,
  Divider,
  Menu,
  Button,
  Stack,
  Badge,
  Group,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandTeams,
  IconEye,
  IconPencil,
  IconTrash,
  IconUsersGroup,
  IconWriting,
} from "@tabler/icons-react";
import { deleteForm, fillOutForm, FormProps, removeTeam } from "../_actions";
import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { DynamicIcon } from "@/components/dynamic-icon";
import { FormForm } from "./form-form";
import { SurveyPreview } from "@/components/survey-preview";
import { MenuItemAction } from "@/components/menu-item-action";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { ModalButton } from "@/components/modal-button";
import { TeamList } from "@/components/team-list";
import { AssignTeamsForm } from "./assign-teams-form";

export const FormCard = ({ form }: { form: FormProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);

  return (
    <Card key={form.id} padding="lg" withBorder w={300}>
      <Avatar color="red" radius="sm" size="xl">
        {form.icon && <DynamicIcon name={form.icon} size={32} />}
      </Avatar>
      <Title order={2}>{form.title}</Title>
      <Text c="dimmed">{form.description}</Text>
      <Badge color="gray">{form.isPublic ? "Öffentlich" : "Privat"}</Badge>
      <Badge color={form.isActive ? "green" : "red"}>
        {form.isActive ? "Aktiv" : "Inaktiv"}
      </Badge>
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
          <MenuItemLink href={`/forms/${form.id}/designer`}>
            Zum Designer
          </MenuItemLink>
          <MenuItemLink href={`/forms/${form.id}`}>
            Formular Dashboard
          </MenuItemLink>
          <MenuItemAction
            action={fillOutForm}
            values={{ id: form.id }}
            leftSection={<IconPencil size={14} />}
            hideNotification={true}
          >
            Formular Ausfüllen
          </MenuItemAction>
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
          <DrawerMenuItem
            leftSection={<IconBrandTeams size={14} />}
            drawers={[
              {
                id: "update-teams",
                title: "Teams bearbeiten",
                children: (stack) => (
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Title order={2}>Teams</Title>
                      <ModalButton
                        title="Team hinzufügen"
                        content={<AssignTeamsForm formId={form.id} />}
                      >
                        Team hinzufügen
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
            Teams bearbeiten
          </DrawerMenuItem>
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
        </Menu.Dropdown>
      </Menu>
    </Card>
  );
};
