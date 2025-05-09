import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { Button, ButtonProps } from "@mantine/core";
import React from "react";

type ButtonActionProps = ButtonProps & {
  action: any;
  values?: { [key: string]: any };
  hideNotification?: boolean;
  onSuccess?: () => void;
};

export const ButtonAction = ({
  action,
  values,
  hideNotification,
  onSuccess,
  ...props
}: ButtonActionProps) => {
  const { execute, status } = useEnhancedAction({
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
