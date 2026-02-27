"use client";
import { useEnhancedAction2 } from "@/hooks/use-action";
import { Button, ButtonProps } from "@mantine/core";
import React from "react";

type ButtonAction2Props = ButtonProps & {
  action: any;
  values?: { [key: string]: any };
  hideNotification?: boolean;
  onSuccess?: () => void;
};

export const ButtonAction2 = ({
  action,
  values,
  hideNotification,
  onSuccess,
  ...props
}: ButtonAction2Props) => {
  const { execute, status } = useEnhancedAction2({
    action: action,
    hideModals: true,
    hideNotification: hideNotification,
    onSuccess: onSuccess,
  });

  return (
    <Button
      loading={status === "executing"}
      onClick={() => {
        execute({ ...values });
      }}
      {...props}
    >
      {props.children}
    </Button>
  );
};
