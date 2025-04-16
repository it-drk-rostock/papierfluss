import { parseAsString, createLoader } from "nuqs/server";

export const teamSearchParams = {
  name: parseAsString.withDefault(""),
};

export const teamSearchParamsLoader = createLoader(teamSearchParams);
