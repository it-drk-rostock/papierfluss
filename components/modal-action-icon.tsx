"use client";
import React from "react";
import {
  ActionIcon,
  ActionIconProps,
  MantineSize,
  ModalProps,
} from "@mantine/core";
import { modals } from "@mantine/modals";

export type ModalActionIconProps = ActionIconProps & {
  children: React.ReactNode;
  title?: string;
  content: React.ReactNode;
  modalSize?: MantineSize;
  fullScreen?: boolean;
};

export const ModalActionIcon = ({
  children,
  title,
  content,
  modalSize = "md",
  fullScreen = false,
  ...props
}: ModalActionIconProps) => {
  return (
    <ActionIcon
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        modals.open({
          fullScreen: fullScreen,
          closeOnClickOutside: false,
          size: modalSize,
          title: title,
          children: <>{content}</>,
          zIndex: 1000,
        });
      }}
    >
      {children}
    </ActionIcon>
  );
};
