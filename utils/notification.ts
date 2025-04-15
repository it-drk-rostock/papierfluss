import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { createElement } from "react";

const notificationConfig = {
  error: {
    color: "red",
    Icon: IconX,
    title: "Fehler",
    autoClose: 5000,
  },
  success: {
    color: "green",
    Icon: IconCheck,
    title: "Erfolgreich",
    autoClose: 5000,
  },
  info: {
    color: "yellow",
    Icon: undefined,
    title: "Aktion wird ausgeführt",
    autoClose: 30000,
  },
} as const;

export const showNotification = (
  message: string,
  type: "error" | "success" | "info" = "info",
  id?: string
) => {
  const config = notificationConfig[type];

  notifications.show({
    withBorder: true,
    id,

    position: "top-right",
    withCloseButton: true,
    loading: type === "info",
    autoClose: config.autoClose,
    title: config.title,
    message,
    color: config.color,

    icon: config.Icon ? createElement(config.Icon) : undefined,
  });
};
