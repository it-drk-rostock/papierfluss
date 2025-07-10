"use client";

import { MenuItemLink } from "@/components/link-menu-item";
import { Card, Title, Divider, Menu, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { deleteFormSubmission, FormProps } from "../_actions";
import { FormSubmissionStatusBadge } from "@/components/form-submission-status-badge";
import { IconArchive, IconTrash } from "@tabler/icons-react";
import { ModalMenuItem } from "@/components/modal-menu-item";
import { FormSubmissionArchiveForm } from "./form-submission-archive-form";
import { ButtonAction } from "@/components/button-action";

export const FormSubmissionCard = ({
  submission,
}: {
  submission: FormProps["submissions"][number];
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
          <ModalMenuItem
            leftSection={<IconArchive size={14} />}
            color="gray"
            title="Archivieren"
            content={<FormSubmissionArchiveForm id={submission.id} />}
          >
            Archivieren
          </ModalMenuItem>
          <ModalMenuItem
            leftSection={<IconTrash size={14} />}
            color="red"
            title="Löschen"
            content={
              <ButtonAction
                fullWidth
                action={deleteFormSubmission}
                values={{ id: submission.id }}
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
