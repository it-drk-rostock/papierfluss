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
  Group,
  Stack,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { updateTeamSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { deleteTeam, removeMember, TeamProps, updateTeam } from "../_actions";
import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { MemberList } from "@/components/member-list";
import { ModalButton } from "@/components/modal-button";
import { AssignUsersForm } from "./assign-users-form";
import { ModalActionIcon } from "@/components/modal-action-icon";
import { baseIconStyles } from "@/constants/base-icon-styles";

export const TeamCard = ({ team }: { team: TeamProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);

  const form = useForm({
    validate: zodResolver(updateTeamSchema),
    mode: "uncontrolled",
    initialValues: {
      id: team.id,
      name: team.name,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: updateTeam,
    hideModals: true,
  });

  return (
    <Card key={team.id} padding="lg" withBorder w={300}>
      <Title order={2}>{team.name}</Title>
      <Text c="dimmed">Mitglieder: {team.users.length} </Text>
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
          <MenuItemLink href={`/admin/teams/${team.id}`}>Zum Team</MenuItemLink>
          <DrawerMenuItem
            leftSection={<IconEdit size={14} />}
            drawers={[
              {
                id: "update-team",
                title: "Team bearbeiten",
                children: (stack) => (
                  <Stack gap="sm">
                    <form
                      onSubmit={form.onSubmit(async (values) => {
                        execute(values);
                      })}
                    >
                      <Stack gap="sm">
                        <TextInput
                          label="Name"
                          key={form.key("name")}
                          {...form.getInputProps("name")}
                        />

                        <Group mt="lg" justify="flex-end">
                          <Button onClick={stack.closeAll} variant="outline">
                            Abbrechen
                          </Button>
                          <Button
                            loading={status === "executing"}
                            type="submit"
                            color="red"
                          >
                            Speichern
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  </Stack>
                ),
              },
            ]}
            initialDrawerId="update-team"
          >
            Bearbeiten
          </DrawerMenuItem>
          <DrawerMenuItem
            leftSection={<IconUsersGroup size={14} />}
            drawers={[
              {
                id: "update-members",
                title: "Mitglieder bearbeiten",
                children: (stack) => (
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Title order={2}>Mitglieder</Title>
                      <ModalButton
                        title="Mitglieder hinzufügen"
                        content={<AssignUsersForm teamId={team.id} />}
                      >
                        Mitglieder hinzufügen
                      </ModalButton>
                    </Group>

                    <MemberList
                      members={team.users}
                      actions={(member) => (
                        <ModalActionIcon
                          title="Mitglied entfernen"
                          variant="light"
                          content={
                            <ButtonAction
                              fullWidth
                              action={removeMember}
                              values={{ id: team.id, userId: member.id }}
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
            initialDrawerId="update-members"
          >
            Mitglieder bearbeiten
          </DrawerMenuItem>
          <ModalMenuItem
            leftSection={<IconTrash size={14} />}
            color="red"
            title="Team löschen"
            content={
              <ButtonAction
                fullWidth
                action={deleteTeam}
                values={{ id: team.id }}
              >
                Löschen
              </ButtonAction>
            }
          >
            Löschen
          </ModalMenuItem>
        </Menu.Dropdown>
      </Menu>
    </Card>
  );
};
