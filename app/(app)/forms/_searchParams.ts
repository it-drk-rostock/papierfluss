import { parseAsString, createLoader } from "nuqs/server";

export const formsSearchParams = {
  search: parseAsString.withDefault(""),
};

export const formsSearchParamsLoader = createLoader(formsSearchParams);
