"use client";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { Loader, Menu, MenuItemProps } from "@mantine/core";
import React from "react";

type MenuItemActionProps = MenuItemProps & {
  action: any;
  values?: { [key: string]: any };
  hideNotification?: boolean;
};

export const MenuItemAction = ({
  action,
  values,
  hideNotification,
  ...props
}: MenuItemActionProps) => {
  const { execute, status } = useEnhancedAction({
    action: action,
    hideModals: true,
    hideNotification: hideNotification,
  });

  return (
    <Menu.Item
      {...props}
      leftSection={
        status === "executing" ? <Loader size={14} /> : props.leftSection
      }
      onClick={() => execute({ ...values })}
    >
      {props.children}
    </Menu.Item>
  );
};
