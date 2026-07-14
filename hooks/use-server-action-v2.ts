"use client";

import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { v4 as uuidv4 } from "uuid";
import { showNotification } from "@/utils/notification";
import { useServerAction as useOrpcServerAction } from "@orpc/react/hooks";
import { onError, onStart, onSuccess } from "@orpc/client";
import type { ActionableClient, UnactionableError } from "@orpc/server";
import type { ORPCErrorJSON } from "@orpc/client";

export function getFriendlyErrorMessage(error: any): string {
  if (!error) {
    return "Aktion fehlgeschlagen, versuchen Sie es später erneut";
  }

  // 1. Handle validation error with nested issues (Standard Schema / Zod format)
  if (
    error.data &&
    typeof error.data === "object" &&
    Array.isArray(error.data.issues)
  ) {
    const issueMessages = error.data.issues.map((issue: any) => {
      if (Array.isArray(issue.path) && issue.path.length > 0) {
        const pathStr = issue.path.join(".");
        return `${pathStr}: ${issue.message}`;
      }
      return issue.message;
    });

    if (issueMessages.length > 0) {
      return `Validierungsfehler: ${issueMessages.join(", ")}`;
    }
  }

  // 2. Handle cases where the error object has a nested 'error' property in data
  if (
    error.data &&
    typeof error.data === "object" &&
    "error" in error.data
  ) {
    const nested = error.data.error;
    if (nested && typeof nested === "object") {
      if (nested.message) return nested.message;
    } else if (typeof nested === "string") {
      return nested;
    }
  }

  // 3. If there is a custom message that is not the default generic ones, use it
  if (
    error.message &&
    error.message !== "Internal Server Error" &&
    error.message !== "Bad Request" &&
    error.message !== "Internal Server Error."
  ) {
    return error.message;
  }

  // 4. Translate standard ORPC / HTTP error codes
  const code = error.code || "";
  const status = error.status;

  if (code === "UNAUTHORIZED" || status === 401) {
    return "Sie müssen angemeldet sein, um diese Aktion auszuführen.";
  }
  if (code === "FORBIDDEN" || status === 403) {
    return "Sie haben keine Berechtigung für diese Aktion.";
  }
  if (code === "NOT_FOUND" || status === 404) {
    return "Die angeforderte Ressource wurde nicht gefunden.";
  }
  if (code === "CONFLICT" || status === 409) {
    return "Es ist ein Konflikt aufgetreten. Bitte versuchen Sie es erneut.";
  }
  if (code === "TOO_MANY_REQUESTS" || status === 429) {
    return "Zu viele Anfragen. Bitte warten Sie einen Moment.";
  }
  if (code === "BAD_REQUEST" || status === 400) {
    return "Ungültige Anfrage.";
  }

  return "Aktion fehlgeschlagen, versuchen Sie es später erneut";
}

export type EnhancedActionProps<TInput, TOutput, TError> = {
  action: ActionableClient<TInput, TOutput, any>;
  redirectUrl?: string;
  hideModals?: boolean;
  hideNotification?: boolean;
  onExecute?: () => void;
  onSuccess?: (data: TOutput) => void;
  onError?: (error: UnactionableError<TError>) => void;
};

export const useServerAction = <
  TInput,
  TOutput,
  TError extends ORPCErrorJSON<any, any>
>({
  action,
  redirectUrl,
  hideModals,
  hideNotification,
  onExecute,
  onSuccess: onSuccessCallback,
  onError: onErrorCallback,
}: EnhancedActionProps<TInput, TOutput, TError>) => {
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

          if (data && typeof data === "object" && "message" in data) {
            showNotification(data.message as string, "success", uuidv4());
          }
        }

        if (hideModals) {
          modals.closeAll();
        }

        if (onSuccessCallback && data) {
          onSuccessCallback(data as TOutput);
        }

        if (redirectUrl) {
          router.push(redirectUrl);
        }

        return data;
      }) as any,
      onError((error: any) => {
        console.error(error);
        
        // Always show error notifications regardless of hideNotification
        notifications.hide(executeNotification);

        const errorMessage = getFriendlyErrorMessage(error);
        showNotification(errorMessage, "error", uuidv4());

        if (onErrorCallback && error) {
          onErrorCallback(error);
        }
      }) as any,
    ],
  });

  return { execute, data, error, status };
};
