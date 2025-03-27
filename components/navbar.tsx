"use client";

import React from "react";
import { Box, Group } from "@mantine/core";
import { Branding } from "./branding";
import { UserButton } from "./user-button";

export const Navbar = () => {
  return (
    <Box w="100%">
      <Group justify="space-between">
        <Branding />
        <UserButton />
      </Group>
    </Box>
  );
};
