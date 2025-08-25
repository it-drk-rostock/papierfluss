"use client";

import React from "react";
import { Group } from "@mantine/core";
import { TeamCard } from "./team-card";
import { TeamProps } from "../_actions";

export const TeamList = ({ teams }: { teams: TeamProps }) => {
  return (
    <>
      <Group justify="center">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </Group>
    </>
  );
};
