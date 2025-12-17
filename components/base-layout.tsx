"use client";
import { Box, Container, Divider } from "@mantine/core";
import React from "react";
import { Navbar } from "./navbar";

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box mih="100dvh">
      <Container fluid p="md">
        <Navbar />
      </Container>
      <Divider my="-sm" />
      <Container fluid p="md">
        {children}
      </Container>
    </Box>
  );
};
