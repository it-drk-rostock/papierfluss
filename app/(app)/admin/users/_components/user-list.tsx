"use client";
import { QuickSearch } from "@/components/quick-search";
import { authClient } from "@/lib/auth-client";
import { Title, Text, Avatar, Card, Group } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

export const UserList = () => {
  const searchParams = useSearchParams();

  const name = searchParams.get("name");

  const { isPending, error, data } = useQuery({
    queryKey: ["users", name],
    queryFn: async () => {
      const users = await authClient.admin.listUsers({
        query: {
          limit: 100,
          searchField: "name",
          searchOperator: "contains",
          searchValue: name ?? undefined,
        },
      });

      return users;
    },
  });

  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <>
      
      <Group justify="center" gap="xl">
        {data.data?.users.map((user) => (
          <Card
            key={user.id}
            padding="lg"
            component={Link}
            href="/admin/users/1"
            withBorder
            w={300}
          >
            <Avatar color="blue" radius="sm" size="xl">
              MP
            </Avatar>
            <Title order={2}>{user.name}</Title>
            <Text c="dimmed">{user.email}</Text>
            <Text c="dimmed">{user.role}</Text>
          </Card>
        ))}
      </Group>
    </>
  );
};
