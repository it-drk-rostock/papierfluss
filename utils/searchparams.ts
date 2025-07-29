import { parseAsString, createLoader } from "nuqs/server";

export const searchParams = {
  search: parseAsString.withDefault(""),
};

export const searchParamsLoader = createLoader(searchParams);


export type SearchParams = {
  search: string;
};