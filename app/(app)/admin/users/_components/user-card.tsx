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
  Group,
  Stack,
  Select,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { type UserWithRole } from "better-auth/plugins/admin";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { updateUserSchema } from "../_schemas";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { deleteUser, updateUser } from "../_actions";
import { userRoles } from "../_constants";
import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { getInitials } from "@/utils/get-initials";



export const UserCard = ({ user }: { user: UserWithRole }) => {
  const [opened, handlers] = useDisclosure(false);

  const form = useForm({
    validate: zodResolver(updateUserSchema),
    mode: "uncontrolled",
    initialValues: {
      role: user.role,
      name: user.name,
      userId: user.id,
    },
  });

  const { execute, status } = useEnhancedAction({
    action: updateUser,
    hideModals: true,
  });

  return (
    <Card key={user.id} padding="lg" withBorder w={350}>
      <Avatar color="red" src={user.image || undefined} radius="sm" >
        {getInitials(user.name)}
      </Avatar>
      <Title order={2}>{user.name}</Title>
      <Text c="dimmed">{user.email}</Text>
      <Text c="dimmed">{user.role}</Text>
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
          <MenuItemLink href={`/admin/users/${user.id}`}>
            Zum Nutzer
          </MenuItemLink>
          <DrawerMenuItem
            leftSection={<IconEdit size={14} />}
            drawers={[
              {
                id: "update-user",
                title: "Benutzer bearbeiten",
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
                        <Select
                          label="App Berechtigung"
                          data={userRoles}
                          key={form.key("role")}
                          {...form.getInputProps("role")}
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
            initialDrawerId="update-user"
          >
            Bearbeiten
          </DrawerMenuItem>
          <ModalMenuItem
            leftSection={<IconTrash size={14} />}
            color="red"
            title="Benutzer löschen"
            content={
              <ButtonAction
                fullWidth
                action={deleteUser}
                values={{ userId: user.id }}
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
