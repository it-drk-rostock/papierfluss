import React from "react";
import { Stack, Title } from "@mantine/core";
import { QuickSearchAdd } from "@/components/quick-search-add";
import { getTeams, TeamSearchParams } from "../_actions";
import { TeamList } from "./team-list";
import { TeamForm } from "./team-form";

export const Teams = async ({
  params,
}: {
  params: Promise<TeamSearchParams>;
}) => {
  const searchParams = await params;
  const teams = await getTeams(searchParams.name);

  return (
    <Stack align="center" gap="xl">
      <QuickSearchAdd
        modalTitle="Bereich hinzufügen"
        modalContent={<TeamForm />}
      />
      <TeamList teams={teams} />
    </Stack>
  );
};
