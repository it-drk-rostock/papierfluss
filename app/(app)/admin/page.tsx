import { Suspense } from "react";
import { AdminLinks } from "./_components/admin-links";

export default async function Page() {
  return (
    <>
      <h1>Admin</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminLinks />
      </Suspense>
    </>
  );
}
