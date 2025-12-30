"use client";

import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { assignUsersSchema } from "../_schemas";
import { assignUsers, getAvailableUsers } from "../_actions";
import { ActionIcon, Button, Loader, Stack, Title, Text } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { MemberList } from "@/components/member-list";
import { useQuery } from "@tanstack/react-query";

export const AssignUsersForm = ({ teamId }: { teamId: string }) => {
  const form = useForm({
    validate: zod4Resolver(assignUsersSchema),
    mode: "uncontrolled",
    initialValues: {
      id: teamId,
      users: [],
    },
  });

  const { execute, status } = useEnhancedAction({
    action: assignUsers,
    hideModals: true,
  });

  const {
    data: availableUsers,
    isPending: isPendingAvailableUsers,
    isError: isErrorAvailableUsers,
  } = useQuery({
    queryKey: ["availableUsers", teamId],
    queryFn: () => getAvailableUsers({ teamId }),
    staleTime: 0,
  });

  if (isPendingAvailableUsers) {
    return <Loader />;
  }

  if (isErrorAvailableUsers) {
    return <Text c="red">Fehler beim Laden der Benutzer</Text>;
  }

  return (
    <form onSubmit={form.onSubmit((values) => execute(values))}>
      <Stack gap="md">
        <Stack gap="sm">
          <Title order={3}>Benutzer auswählen</Title>
          <MemberList
            members={(availableUsers || []).filter(
              (user) =>
                !form.values.users.some((formUser) => formUser.id === user.id)
            )}
            actions={(user) => (
              <ActionIcon
                variant="light"
                onClick={() =>
                  form.insertListItem("users", {
                    id: user.id,
                    name: user.name,
                  })
                }
              >
                <IconPlus />
              </ActionIcon>
            )}
          />
        </Stack>
        <Stack gap="sm">
          <Title order={3}>Hinzugefügte Mitglieder</Title>
          <MemberList
            members={form.values.users as { id: string; name: string }[]}
            actions={(user, index) => (
              <ActionIcon
                variant="light"
                onClick={() => form.removeListItem("users", index)}
              >
                <IconX />
              </ActionIcon>
            )}
          />
          <Button type="submit" loading={status === "executing"}>
            Speichern
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
