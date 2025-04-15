"use client";
import React from "react";
import { Drawer } from "@mantine/core";
import { useDrawersStack } from "@mantine/core";

export type DrawerStackActions = {
  open: (id: string) => void;
  closeAll: () => void;
  close: (id: string) => void;
};

export type DrawerProps = {
  id: string;
  title?: string;
  children:
    | React.ReactNode
    | ((actions: DrawerStackActions) => React.ReactNode);
  size?: string | number;
};

export type DrawerStackProps = {
  drawers: DrawerProps[];
  initialDrawerId: string;
  children: (openDrawer: () => void) => React.ReactNode;
};

export function DrawerStack({
  children,
  drawers,
  initialDrawerId,
}: DrawerStackProps) {
  const drawerIds = drawers.map((drawer) => drawer.id);
  const stack = useDrawersStack(drawerIds);

  const stackActions: DrawerStackActions = {
    open: stack.open,
    closeAll: stack.closeAll,
    close: stack.close,
  };

  return (
    <>
      <Drawer.Stack>
        {drawers.map((drawer) => (
          <Drawer
            position="right"
            key={drawer.id}
            {...stack.register(drawer.id)}
            title={drawer.title}
            size={drawer.size}
            
          >
            {typeof drawer.children === "function"
              ? drawer.children(stackActions)
              : drawer.children}
          </Drawer>
        ))}
      </Drawer.Stack>

      {children(() => stack.open(initialDrawerId))}
    </>
  );
}
