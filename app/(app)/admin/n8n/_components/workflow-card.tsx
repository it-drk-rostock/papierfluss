"use client";

import { MenuItemLink } from "@/components/link-menu-item";
import { Card, Title, Text, Divider, Menu, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconExternalLink, IconTrash } from "@tabler/icons-react";
import { deleteWorkflow, WorkflowProps } from "../_actions";
import { ButtonAction } from "@/components/button-action";
import { ModalMenuItem } from "@/components/modal-menu-item";

export const WorkflowCard = ({ workflow }: { workflow: WorkflowProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);

  return (
    <Card key={workflow.id} padding="lg" withBorder w={350}>
      <Title order={2}>{workflow.name}</Title>
      <Text c="dimmed">{workflow.workflowId}</Text>
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
          <MenuItemLink href={`/admin/workflows/${workflow.id}`}>
            Zum Workflow
          </MenuItemLink>
          <Menu.Item
            leftSection={<IconExternalLink size={14} />}
            component="a"
            target="_blank"
            href={`${process.env.NEXT_PUBLIC_N8N_URL}/workflow/${workflow.workflowId}`}
          >
            Zum N8n Workflow
          </Menu.Item>
          <ModalMenuItem
            leftSection={<IconTrash size={14} />}
            color="red"
            title="Workflow löschen"
            content={
              <ButtonAction
                fullWidth
                action={deleteWorkflow}
                values={{ id: workflow.id }}
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
