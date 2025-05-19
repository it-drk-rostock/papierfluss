import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [customSessionClient<typeof auth>()],
});
