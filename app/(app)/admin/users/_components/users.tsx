import React from "react";
import { adminQuery } from "@server/utils/admin-query";
import { Stack, Title } from "@mantine/core";
import { UserList } from "./user-list";
import { QuickSearch } from "@/components/quick-search";

export const Users = async () => {
  await adminQuery();

  return (
    <Stack align="center" gap="xl">
      <Title order={2}>Benutzer</Title>
      <QuickSearch param="name" />
      <UserList />
    </Stack>
  );
};
