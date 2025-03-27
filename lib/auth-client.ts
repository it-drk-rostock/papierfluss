import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    adminClient(),
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
  ],
});
