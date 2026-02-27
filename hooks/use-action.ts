"use client";

import { useAction } from "next-safe-action/hooks";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { v4 as uuidv4 } from "uuid";
import { useRef } from "react";
import { showNotification } from "@/utils/notification";

export type EnhancedAction2Props = {
  action: any;
  redirectUrl?: string;
  hideModals?: boolean;
  hideNotification?: boolean;
  onExecute?: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
};

export const useEnhancedAction2 = ({
  action,
  redirectUrl,
  hideModals,
  hideNotification,
  onExecute,
  onSuccess,
  onError,
}: EnhancedAction2Props) => {
  const router = useRouter();
  const executeNotificationRef = useRef<string>("");
  const { execute, result, status } = useAction(action, {
    onExecute() {
      executeNotificationRef.current = uuidv4();
      if (!hideNotification) {
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
    onSuccess({ data }) {
      if (!hideNotification) {
        notifications.hide(executeNotificationRef.current);

        if (data) {
          showNotification(
            (data as any)?.message as string,
            "success",
            uuidv4(),
          );
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
    },
    onError({ error }) {
      // Always show error notifications regardless of hideNotification
      notifications.hide(executeNotificationRef.current);

      if (error) {
        showNotification(
          error.serverError
            ? (error.serverError as string)
            : "Aktion fehlgeschlagen, versuchen sie es später erneut",
          "error",
          uuidv4(),
        );
      }

      if (onError && error) {
        onError(error);
      }
    },
    // onSettled fires for success, error, AND navigation (revalidatePath)
    // This ensures the loading notification is always cleaned up
    onSettled() {
      notifications.hide(executeNotificationRef.current);

      if (hideModals) {
        modals.closeAll();
      }
    },
  });

  return { execute, result, status };
};
