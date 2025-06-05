"use client";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { ActionIcon, ActionIconProps } from "@mantine/core";
import React from "react";

type ActionIconActionProps = ActionIconProps & {
  action: any;
  values?: { [key: string]: any };
  hideNotification?: boolean;
  onSuccess?: () => void;
};

export const ActionIconAction = ({
  action,
  values,
  hideNotification,
  onSuccess,
  ...props
}: ActionIconActionProps) => {
  const { execute, status } = useEnhancedAction({
    action: action,
    hideModals: true,
    hideNotification: hideNotification,
    onSuccess: onSuccess,
  });

  return (
    <ActionIcon
      loading={status === "executing"}
      onClick={(e) => {
        e.stopPropagation();
        execute({ ...values });
      }}
      {...props}
    >
      {props.children}
    </ActionIcon>
  );
};
