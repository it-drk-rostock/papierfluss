"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@lib/tanstack-query";
import type * as React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { MantineProvider } from "@/providers/mantine-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <MantineProvider>{children}</MantineProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
};
