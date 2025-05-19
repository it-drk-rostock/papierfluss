"use client";
import React from "react";
import { Menu, MenuItemProps } from "@mantine/core";
import { modals } from "@mantine/modals";

export type ModalMenuItemProps = Omit<MenuItemProps, "onClick"> & {
  title?: string;
  children: React.ReactNode;
  content: React.ReactNode;
  modalSize?: string;
};

export function ModalMenuItem({
  children,
  title,
  content,
  modalSize = "md",
  ...props
}: ModalMenuItemProps) {
  return (
    <Menu.Item
      {...props}
      onClick={(e) => {
        e.preventDefault();
        modals.open({
          id: title,
          closeOnClickOutside: false,
          size: modalSize,
          title: title,
          children: content,
        });
      }}
    >
      {children}
    </Menu.Item>
  );
}
