"use client";
import React from "react";
import { Menu, MenuItemProps } from "@mantine/core";
import { DrawerStack, DrawerProps } from "./drawer-stack";

export type DrawerMenuItemProps = Omit<MenuItemProps, "onClick"> & {
  drawers: DrawerProps[];
  initialDrawerId: string;
};

export function DrawerMenuItem({
  children,
  drawers,
  initialDrawerId,
  ...props
}: DrawerMenuItemProps) {
  return (
    <DrawerStack drawers={drawers} initialDrawerId={initialDrawerId}>
      {(openDrawer) => (
        <Menu.Item
          {...props}
          onClick={(e) => {
            e.preventDefault();
            openDrawer();
          }}
        >
          {children}
        </Menu.Item>
      )}
    </DrawerStack>
  );
}
