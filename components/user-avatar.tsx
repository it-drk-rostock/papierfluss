import { Avatar, type AvatarProps as MantineAvatarProps } from "@mantine/core";
import React from "react";

export type AvatarProps = MantineAvatarProps & {
  name: string;
};

export const UserAvatar = ({ name, ...props }: AvatarProps) => {
  if (!props.src) {
    return <Avatar name={name} color="red" radius="xl" {...props} />;
  }

  return <Avatar color="red" radius="xl" {...props} />;
};
