import React from "react";
import { Stack, Title } from "@mantine/core";
import { UserList } from "./user-list";
import { QuickSearch } from "@/components/quick-search";
import { getUsers } from "../_actions";
import { UserSearchParams } from "../_actions";

export const Users = async ({
  params,
}: {
  params: Promise<UserSearchParams>;
}) => {
  const searchParams = await params;
  const users = await getUsers(searchParams.name);

  return (
    <Stack align="center" gap="xl">
      <Title order={2}>Benutzer</Title>
      <QuickSearch param="name" />
      <UserList users={users} />
    </Stack>
  );
};
