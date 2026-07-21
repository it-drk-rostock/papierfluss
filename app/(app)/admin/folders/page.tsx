import { Loader, Stack, Title } from "@mantine/core";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { adminQuery } from "@/server/utils/admin-query";
import { FolderManager } from "./_components/folder-manager";

async function Folders() {
  await adminQuery();

  const folders = await prisma.formFolderV2.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
      order: true,
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return <FolderManager folders={folders} />;
}

export default function Page() {
  return (
    <Stack>
      <Title order={1}>Formular-Ordner (V2)</Title>
      <Suspense fallback={<Loader />}>
        <Folders />
      </Suspense>
    </Stack>
  );
}
