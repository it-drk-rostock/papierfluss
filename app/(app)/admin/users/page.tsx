import { Suspense } from "react";
import { Loader, Title } from "@mantine/core";
import { Users } from "./_components/users";
import { userSearchParamsLoader } from "./_searchParams";
import { UserSearchParams } from "./_actions";

export default function Page({
  searchParams,
}: {
  searchParams: UserSearchParams;
}) {
  const paramsPromise = userSearchParamsLoader(searchParams);

  return (
    <>
      <Title order={1}>Benutzer</Title>
      <Suspense fallback={<Loader />}>
        <Users params={Promise.resolve(paramsPromise)} />
      </Suspense>
    </>
  );
}
