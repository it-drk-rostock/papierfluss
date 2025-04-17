"use client";
import React from "react";
import { ActionIcon, ActionIconProps, MantineSize } from "@mantine/core";
import { modals } from "@mantine/modals";

export type ModalActionIconProps = ActionIconProps & {
  children: React.ReactNode;
  title?: string;
  content: React.ReactNode;
  modalSize?: MantineSize;
};

export const ModalActionIcon = ({
  children,
  title,
  content,
  modalSize = "md",
  ...props
}: ModalActionIconProps) => {
  return (
    <ActionIcon
      {...props}
      onClick={() => {
        modals.open({
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
