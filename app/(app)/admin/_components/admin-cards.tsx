"use client";
import { Card, Title, Text } from "@mantine/core";
import Link from "next/link";

export const AdminCards = ({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) => {
  return (
    <Card padding="lg" component={Link} href={href} withBorder>
      <Title order={2}>{title}</Title>
      <Text c="dimmed">{description}</Text>
    </Card>
  );
};
