"use client";

import { UserAvatar } from "@/components/user-avatar";
import { Center, Divider, Group, List, ScrollArea, Text } from "@mantine/core";
import { IconUserOff } from "@tabler/icons-react";
import React from "react";

import { ViewActionIcon } from "./view-action-icon";
import { TextIcon } from "./text-icon";

export type MemberListProps = {
  members: {
    name: string;
    image?: string | null;
    id: string;
  }[];
  actions?: (
    member: MemberListProps["members"][0],
    index: number
  ) => React.ReactNode;
};

export const MemberList = ({ members, actions }: MemberListProps) => {
  if (members.length === 0) {
    return (
      <Center>
        <TextIcon
          color="gray"
          variant="light"
          icon={IconUserOff}
          text="keine Mitglieder vorhanden"
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
        {members.map((member, index) => (
          <React.Fragment key={member.id}>
            <List.Item
              w="100%"
              icon={<UserAvatar src={member.image} name={member.name} />}
            >
              <Group justify="space-between" w="100%">
                <Text>{member.name}</Text>
                <Group gap="xs">
                  <ViewActionIcon href={`/admin/users/${member.id}`} />
                  {actions?.(member, index)}
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
