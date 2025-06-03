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
  MenuLabel,
  MenuDivider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandTeams, IconTrash, IconWriting } from "@tabler/icons-react";
import { deleteWorkflow, removeTeam, WorkflowProps } from "../_actions";
import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { WorkflowForm } from "./workflow-form";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { baseIconStyles } from "@/constants/base-icon-styles";
import { ModalButton } from "@/components/modal-button";
import { TeamList } from "@/components/team-list";
import { AssignTeamsForm } from "./assign-teams-form";
import { useAuthSession } from "@/hooks/use-auth-session";

export const WorkflowCard = ({ workflow }: { workflow: WorkflowProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);
  const { hasAccess } = useAuthSession();

  return (
    <Card key={workflow.id} padding="lg" withBorder w={300}>
      <Title order={2}>{workflow.name}</Title>
      <Text c="dimmed">{workflow.description}</Text>
      <Badge color="gray">{workflow.isPublic ? "Öffentlich" : "Privat"}</Badge>
      <Badge color={workflow.isActive ? "green" : "red"}>
        {workflow.isActive ? "Aktiv" : "Inaktiv"}
      </Badge>
      {workflow.responsibleTeam && (
        <Text>Verantwortlicher Bereich: {workflow.responsibleTeam?.name}</Text>
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
          <MenuItemLink href={`/workflows/${workflow.id}`}>
            Workflow Übersicht
          </MenuItemLink>
          {hasAccess("moderator") && (
            <>
              <MenuLabel>Bearbeiten</MenuLabel>
              <MenuItemLink href={`/workflows/${workflow.id}/designer`}>
                Workflow Designer
              </MenuItemLink>
              <MenuItemLink href={`/workflows/${workflow.id}/n8n`}>
                N8n Workflows
              </MenuItemLink>
              <DrawerMenuItem
                leftSection={<IconWriting size={14} />}
                drawers={[
                  {
                    id: "update-workflow",
                    title: "Workflow bearbeiten",
                    children: (stack) => <WorkflowForm workflow={workflow} />,
                  },
                ]}
                initialDrawerId="update-workflow"
              >
                Workflow bearbeiten
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
                            content={
                              <AssignTeamsForm workflowId={workflow.id} />
                            }
                          >
                            Bereich hinzufügen
                          </ModalButton>
                        </Group>
                        <TeamList
                          teams={workflow.teams}
                          actions={(team) => (
                            <ModalActionIcon
                              title="Mitglied entfernen"
                              variant="light"
                              content={
                                <ButtonAction
                                  fullWidth
                                  action={removeTeam}
                                  values={{ id: workflow.id, teamId: team.id }}
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

          {hasAccess("moderator") && (
            <>
              <MenuDivider />
              <ModalMenuItem
                leftSection={<IconTrash size={14} />}
                color="red"
                title="Workflow löschen"
                content={
                  <>
                    <ButtonAction
                      fullWidth
                      action={deleteWorkflow}
                      values={{ id: workflow.id }}
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
