"use client";

import { useStateAction } from "next-safe-action/stateful-hooks";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";
import { showNotification } from "@/utils/notification";

export type EnhancedActionProps = {
  action: any;
  redirectUrl?: string;
  hideModals?: boolean;
  hideNotification?: boolean;
  onExecute?: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
};

export const useEnhancedAction = ({
  action,
  redirectUrl,
  hideModals,
  hideNotification,
  onExecute,
  onSuccess,
  onError,
}: EnhancedActionProps) => {
  const router = useRouter();
  // OLD: const executeNotification = uuidv4();
  const executeNotificationRef = useRef<string>("");
  const { execute, result, status } = useStateAction(action, {
    onExecute() {
      // Defensive: hide any previous notification before showing a new one
      if (executeNotificationRef.current) {
        notifications.hide(executeNotificationRef.current);
      }
      executeNotificationRef.current = uuidv4();
      if (!hideNotification) {
        // OLD: showNotification("Aktion wird ausgeführt", "info", executeNotification);
        showNotification(
          "Aktion wird ausgeführt",
          "info",
          executeNotificationRef.current,
        );
      }

      if (onExecute) {
        onExecute();
      }
    },
    onSuccess(data) {
      if (!hideNotification) {
        // OLD: notifications.hide(executeNotification);
        notifications.hide(executeNotificationRef.current);

        if (data) {
          showNotification(data.data?.message as string, "success", uuidv4());
        }
      }

      if (hideModals) {
        modals.closeAll();
      }

      if (onSuccess && data) {
        onSuccess(data);
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      }

      return data;
    },
    onError(error) {
      // Always show error notifications regardless of hideNotification
      // OLD: notifications.hide(executeNotification);
      notifications.hide(executeNotificationRef.current);

      if (error) {
        showNotification(
          error.error?.serverError
            ? (error.error.serverError as string)
            : "Aktion fehlgeschlagen, versuchen sie es später erneut",
          "error",
          uuidv4(),
        );
      }

      if (onError && error) {
        onError(error);
      }
    },
  });

  return { execute, result, status };
};
