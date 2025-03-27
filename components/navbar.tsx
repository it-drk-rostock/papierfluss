"use client";

import React from "react";
import { Avatar, Box, Group } from "@mantine/core";
import { Branding } from "./branding";

export const Navbar = () => {
  return (
    <Box w="100%">
      <Group justify="space-between">
        <Branding />
        <Avatar color="red" />
      </Group>
    </Box>
  );
};
