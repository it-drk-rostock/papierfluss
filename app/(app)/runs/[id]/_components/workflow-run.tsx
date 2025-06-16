import { Grid, Stack, Title, Text, Paper, GridCol } from "@mantine/core";

import React from "react";

export const WorkflowRun = () => {
  return (
    <Stack gap="md">
      <Stack gap="0">
        <Title order={2}>Mitarbeitereinstellung</Title>
        <Text c="dimmed">Onboarding</Text>
      </Stack>

      <Grid gutter="lg">
        {/* Forms Section - 6 columns (half the width) */}
        <GridCol span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Formulare</Title>
            </Stack>
          </Paper>
        </GridCol>

        <GridCol span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Prozesse</Title>
            </Stack>
          </Paper>
        </GridCol>

        {/* Information Section - 3 columns (quarter width) */}
        <GridCol span={{ base: 12, md: 3 }}>
          <Paper withBorder p="md">
            <Stack>
              <Title order={3}>Informationen</Title>
              <Stack gap="md"></Stack>
            </Stack>
          </Paper>
        </GridCol>
      </Grid>
    </Stack>
  );
};
