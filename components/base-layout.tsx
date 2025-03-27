"use client";
import { Box, Container } from "@mantine/core";
import React from "react";

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box h="100%" mih="100vh">
      <Container fluid p="md">
        <Box bg="red" w="100%">
          Navbar
        </Box>
        {children}
      </Container>
    </Box>
  );
};
