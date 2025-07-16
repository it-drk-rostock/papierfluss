"use client";
import React from "react";
import { Button, ButtonProps, MantineSize } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconProps } from "@tabler/icons-react";

export type ModalButtonProps = ButtonProps & {
  children: React.ReactNode;
  title?: string;
  content: React.ReactNode;
  modalSize?: MantineSize;
};

export const ModalButton = ({
  children,
  title,
  content,
  modalSize = "md",
  ...props
}: ModalButtonProps) => {
  return (
    <Button
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
    </Button>
  );
};

export type ModalButtonWithIconProps = ModalButtonProps & {
  icon: React.ComponentType<IconProps>;
  iconSize?: number;
};

export const ModalButtonWithIcon = ({
  children,
  title,
  content,
  modalSize = "md",
  icon: Icon,
  iconSize = 16,
  ...props
}: ModalButtonWithIconProps) => {
  return (
    <Button
      {...props}
      leftSection={<Icon size={iconSize} />}
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
    </Button>
  );
};
