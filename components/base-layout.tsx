"use client";
import { Box, Center, Container } from "@mantine/core";
import React from "react";
import { Navbar } from "./navbar";

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box h="100%" mih="100vh">
      <Container fluid p="md">
        <Navbar />
        <Center> {children}</Center>
      </Container>
    </Box>
  );
};
