"use client";

import React from "react";
import { Group } from "@mantine/core";
import { UserCard } from "./user-card";
import { UserWithRole } from "better-auth/plugins";

export const UserList = ({ users }: { users: UserWithRole[] }) => {
  
  return (
    <>
      <Group justify="center" gap="xl">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </Group>
    </>
  );
};
