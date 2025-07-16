"use client";
import React from "react";
import "dayjs/locale/de";
import { MantineProvider as MantineProviderCore } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { theme } from "@/lib/theme";

export const MantineProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <MantineProviderCore theme={theme}>
      <Notifications />
      <DatesProvider
        settings={{
          locale: "de",
        }}
      >
        <ModalsProvider>{children}</ModalsProvider>
      </DatesProvider>
    </MantineProviderCore>
  );
};
