"use client";

import { MenuItemLink } from "@/components/link-menu-item";
import { Card, Title, Divider, Menu, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FormProps } from "../_actions";
import { FormSubmissionStatusBadge } from "@/components/form-submission-status-badge";

export const FormSubmissionCard = ({
  submission,
}: {
  submission: NonNullable<FormProps>["submissions"][0];
}) => {
  const [opened, handlers] = useDisclosure(false);

  return (
    <Card key={submission.id} padding="lg" withBorder w={300}>
      <Title order={2}>{submission.submittedBy?.name ?? "Unbekannt"}</Title>
      <FormSubmissionStatusBadge status={submission.status} />
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
          <MenuItemLink href={`/form-submissions/${submission.id}`}>
            Zum Formular
          </MenuItemLink>
        </Menu.Dropdown>
      </Menu>
    </Card>
  );
};
