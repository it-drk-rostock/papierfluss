"use client";
import { Button, ButtonProps } from "@mantine/core";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";

export type LinkBackButtonProps = ButtonProps;

export const LinkBackButton = ({ ...props }: LinkBackButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      {...props}
      loading={isPending}
      onClick={() => startTransition(() => router.back())}
    >
      {props.children}
    </Button>
  );
};
