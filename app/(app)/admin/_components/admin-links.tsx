import { adminQuery } from "@server/utils/admin-query";
import { SimpleGrid } from "@mantine/core";
import { AdminCards } from "./admin-cards";

export const AdminLinks = async () => {
  await adminQuery();

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="md">
      <AdminCards
        href="/admin/users"
        title="Benutzer"
        description="Verwalten Sie Benutzerkonten, Berechtigungen und Rollen."
      />
      <AdminCards
        href="/admin/teams"
        title="Bereiche"
        description="Verwalten Sie Bereiche und deren Einstellungen."
      />
      <AdminCards
        href="/admin/n8n"
        title="n8n Workflows"
        description="Verwalten Sie n8n-Workflows."
      />
      <AdminCards
        href="/admin/cronjobs"
        title="Cronjobs"
        description="Verwalten Sie Cronjobs."
      />
      <AdminCards
        href="/workflows"
        title="Portale"
        description="Verwalten Sie Portale."
      />
      <AdminCards
        href="/forms"
        title="Formulare"
        description="Verwalten Sie Formulare."
      />
    </SimpleGrid>
  );
};
