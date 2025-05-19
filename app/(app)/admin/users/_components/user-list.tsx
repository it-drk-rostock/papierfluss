"use client";

import React from "react";
import { Group } from "@mantine/core";
import { UserCard } from "./user-card";
import { UserProps } from "../_actions";

export const UserList = ({ users }: { users: UserProps }) => {
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
