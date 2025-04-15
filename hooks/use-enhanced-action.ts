"use client";

import { useStateAction } from "next-safe-action/stateful-hooks";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { v4 as uuidv4 } from "uuid";
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
  const executeNotification = uuidv4();
  const { execute, result, status } = useStateAction(action, {
    onExecute() {
      if (!hideNotification) {
        showNotification("Aktion wird ausgeführt", "info", executeNotification);
      }

      if (onExecute) {
        onExecute();
      }
    },
    onSuccess(data) {
      if (!hideNotification) {
        notifications.hide(executeNotification);

        if (data) {
          console.
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
      notifications.hide(executeNotification);

      if (error) {
        showNotification(
          error.error?.serverError
            ? (error.error.serverError as string)
            : "Aktion fehlgeschlagen, versuchen sie es später erneut",
          "error",
          uuidv4()
        );
      }

      if (onError && error) {
        onError(error);
      }
    },
  });

  return { execute, result, status };
};
