"use client";
import { Button, ButtonProps } from "@mantine/core";
import Link, { useLinkStatus } from "next/link";
import React from "react";

export type LinkButtonProps = ButtonProps & {
  href: string;
  title: string;
};

export const LinkButton = ({ href, ...props }: LinkButtonProps) => {
  const { pending } = useLinkStatus();
  return (
    <Button {...props} component={Link} loading={pending} href={href}>
      TestLink
    </Button>
  );
};
