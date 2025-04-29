"use client";

import { UserAvatar } from "@/components/user-avatar";
import {
  Center,
  Divider,
  Group,
  List,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconBuildingSkyscraper } from "@tabler/icons-react";
import React from "react";

import { ViewActionIcon } from "./view-action-icon";
import { TextIcon } from "./text-icon";

export type TeamListProps = {
  teams: {
    name: string;
    contactEmail?: string | null;
    id: string;
  }[];
  actions?: (team: TeamListProps["teams"][0], index: number) => React.ReactNode;
};

export const TeamList = ({ teams, actions }: TeamListProps) => {
  if (teams.length === 0) {
    return (
      <Center>
        <TextIcon
          color="gray"
          variant="light"
          icon={IconBuildingSkyscraper}
          text="keine Teams vorhanden"
        />
      </Center>
    );
  }

  return (
    <ScrollArea.Autosize mah={180} offsetScrollbars>
      <List
        spacing="sm"
        center
        styles={{
          itemLabel: { width: "100%" },
          itemWrapper: { width: "100%" },
        }}
      >
        {teams.map((team, index) => (
          <React.Fragment key={team.id}>
            <List.Item w="100%" icon={<UserAvatar name={team.name} />}>
              <Group justify="space-between" w="100%">
                <Stack gap={0}>
                  <Text>{team.name}</Text>
                  {team.contactEmail && (
                    <Text size="sm" c="dimmed">
                      {team.contactEmail}
                    </Text>
                  )}
                </Stack>
                <Group gap="xs">
                  <ViewActionIcon href={`/admin/teams/${team.id}`} />
                  {actions?.(team, index)}
                </Group>
              </Group>
            </List.Item>
            <Divider mt="sm" />
          </React.Fragment>
        ))}
      </List>
    </ScrollArea.Autosize>
  );
};
