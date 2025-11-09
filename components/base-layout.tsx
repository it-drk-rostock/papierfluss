"use client";
import { Box, Center, Container, Divider } from "@mantine/core";
import React from "react";
import { Navbar } from "./navbar";

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box h="100%" mih="100vh">
      <Container fluid p="md">
        <Navbar />
      </Container>
      <Divider my="sm" />
      <Container fluid p="md">
        <Center> {children}</Center>
      </Container>
    </Box>
  );
};
