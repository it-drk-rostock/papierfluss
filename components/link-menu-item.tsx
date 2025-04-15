"use client";
import { Loader, Menu, MenuItemProps } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";

export type MenuItemLinkProps = MenuItemProps & {
  href: string;
};

export const MenuItemLink = ({ href, ...props }: MenuItemLinkProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Menu.Item
      {...props}
      leftSection={isPending ? <Loader size={14} /> : <IconEye size={14} />}
      onClick={() => startTransition(() => router.push(href))}
    >
      {props.children}
    </Menu.Item>
  );
};
