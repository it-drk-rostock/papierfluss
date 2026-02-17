"use client";

import { UserAvatar } from "@/components/user-avatar";
import {
  Autocomplete,
  Center,
  Divider,
  Group,
  List,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconSearch, IconUserOff } from "@tabler/icons-react";
import React, { useState } from "react";

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
    index: number,
  ) => React.ReactNode;
};

export const MemberList = ({ members, actions }: MemberListProps) => {
  const [search, setSearch] = useState("");

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

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Stack>
      <Autocomplete
        placeholder="Mitglied suchen..."
        leftSection={<IconSearch size={16} />}
        data={[...new Set(members.map((m) => m.name))]}
        value={search}
        onChange={setSearch}
      />
      <ScrollArea.Autosize mah={180} offsetScrollbars>
        <List
          spacing="sm"
          center
          styles={{
            itemLabel: { width: "100%" },
            itemWrapper: { width: "100%" },
          }}
        >
          {filteredMembers.map((member, index) => (
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
    </Stack>
  );
};
