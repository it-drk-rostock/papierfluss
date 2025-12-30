import { SubmissionStatus } from "@/generated/prisma/client";
import { parseAsString, createLoader, parseAsStringEnum } from "nuqs/server";

export const formsSearchParams = {
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum(Object.values(SubmissionStatus)),
};

export const formsSearchParamsLoader = createLoader(formsSearchParams);
