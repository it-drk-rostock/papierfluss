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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEye, IconTrash, IconWriting } from "@tabler/icons-react";
import { deleteForm, FormProps } from "../_actions";

import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { DynamicIcon } from "@/components/dynamic-icon";
import { FormForm } from "./form-form";

export const FormCard = ({ form }: { form: FormProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);

  /* const form = useForm({
    validate: zodResolver(updateUserSchema),
    mode: "uncontrolled",
    initialValues: {
      role: user.role,
      name: user.name,
      userId: user.id,
    },
  }); */

  /* const { execute, status } = useEnhancedAction({
    action: updateUser,
    hideModals: true,
  }); */

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
                    <Text>Formular vorschau</Text>
                  </Stack>
                ),
              },
            ]}
            initialDrawerId="preview-form"
          >
            Formular Vorschau
          </DrawerMenuItem>
          <ModalMenuItem
            leftSection={<IconTrash size={14} />}
            color="red"
            title="Formular löschen"
            content={
              <ButtonAction
                fullWidth
                action={deleteForm}
                values={{ id: form.id }}
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
