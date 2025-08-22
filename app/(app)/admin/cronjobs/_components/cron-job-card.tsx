"use client";

import { Card, Title, Divider, Menu, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { N8nCronjobsProps } from "../_actions";
import { IconExternalLink } from "@tabler/icons-react";

export const CronjobCard = ({ cronjob }: { cronjob: N8nCronjobsProps[0] }) => {
  const [opened, handlers] = useDisclosure(false);

  return (
    <Card key={cronjob.id} padding="lg" withBorder w={350}>
      <Title order={2}>{cronjob.name}</Title>
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
          <Menu.Item
            component="a"
            target="_blank"
            leftSection={<IconExternalLink size={14} />}
            href={`${process.env.NEXT_PUBLIC_N8N_URL}/workflow/${cronjob.id}`}
          >
            Zum Cronjob
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Card>
  );
};
