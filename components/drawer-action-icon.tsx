"use client";
import React from "react";
import { ActionIcon, ActionIconProps } from "@mantine/core";
import { DrawerStack, DrawerProps } from "./drawer-stack";

export type DrawerActionIconProps = ActionIconProps & {
  drawers: DrawerProps[];
  initialDrawerId: string;
};

export function DrawerActionIcon({
  children,
  drawers,
  initialDrawerId,
  ...props
}: DrawerActionIconProps) {
  return (
    <DrawerStack drawers={drawers} initialDrawerId={initialDrawerId}>
      {(openDrawer) => (
        <ActionIcon
          {...props}
          onClick={(e) => {
            e.preventDefault();
            openDrawer();
          }}
        >
          {children}
        </ActionIcon>
      )}
    </DrawerStack>
  );
}
