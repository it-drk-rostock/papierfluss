"use client";

import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { v4 as uuidv4 } from "uuid";
import { showNotification } from "@/utils/notification";
import { useServerAction as useOrpcServerAction } from "@orpc/react/hooks";
import { onError, onStart, onSuccess } from "@orpc/client";

export type EnhancedActionProps = {
  action: any;
  redirectUrl?: string;
  hideModals?: boolean;
  hideNotification?: boolean;
  onExecute?: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
};

export const useServerAction = ({
  action,
  redirectUrl,
  hideModals,
  hideNotification,
  onExecute,
  onSuccess: onSuccessCallback,
  onError: onErrorCallback,
}: EnhancedActionProps) => {
  const router = useRouter();
  const executeNotification = uuidv4();

  const { execute, data, error, status } = useOrpcServerAction(action, {
    interceptors: [
      onStart(() => {
        if (!hideNotification) {
          showNotification(
            "Aktion wird ausgeführt",
            "info",
            executeNotification
          );
        }

        if (onExecute) {
          onExecute();
        }
      }) as any,
      onSuccess((data: any) => {
        if (!hideNotification) {
          notifications.hide(executeNotification);

          if (data) {
            showNotification(data.message as string, "success", uuidv4());
          }
        }

        if (hideModals) {
          modals.closeAll();
        }

        if (onSuccessCallback && data) {
          onSuccessCallback(data);
        }

        if (redirectUrl) {
          router.push(redirectUrl);
        }

        return data;
      }) as any,
      onError((error: any) => {
        // Always show error notifications regardless of hideNotification
        notifications.hide(executeNotification);

        // Extract error message - log to see structure
        let errorMessage =
          "Aktion fehlgeschlagen, versuchen sie es später erneut";

        showNotification(errorMessage, "error", uuidv4());

        if (onErrorCallback && error) {
          onErrorCallback(error);
        }
      }) as any,
    ],
  });

  return { execute, data, error, status };
};
