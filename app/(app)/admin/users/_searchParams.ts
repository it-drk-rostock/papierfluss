import { parseAsString, createLoader } from "nuqs/server";

export const userSearchParams = {
  name: parseAsString.withDefault(""),
};

export const userSearchParamsLoader = createLoader(userSearchParams);
