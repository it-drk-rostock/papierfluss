"use client";
import React from "react";
import { Button, ButtonProps } from "@mantine/core";
import { DrawerStack, DrawerProps } from "@/components/drawer-stack";

export type DrawerButtonProps = ButtonProps & {
  drawers: DrawerProps[];
  initialDrawerId: string;
};

export function DrawerButton({
  children,
  drawers,
  initialDrawerId,
  ...props
}: DrawerButtonProps) {
  return (
    <DrawerStack drawers={drawers} initialDrawerId={initialDrawerId}>
      {(openDrawer) => (
        <Button {...props} onClick={openDrawer}>
          {children}
        </Button>
      )}
    </DrawerStack>
  );
}
