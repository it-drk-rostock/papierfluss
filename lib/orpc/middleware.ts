import { auth } from "@lib/auth"; // Your Better Auth instance
import { base } from "@lib/orpc/context";
import { ORPCError } from "@orpc/server";
import { os } from "@orpc/server";

// Create auth middleware - it will receive the merged context from base when used
export const authMiddleware = os.middleware(async ({ context, next }) => {
  // Headers are available from execution context (provided by base middleware)
  // Type assertion needed because os doesn't know about headers, but base provides them
  const headers = (context as { headers: Headers }).headers;

  const sessionData = await auth.api.getSession({
    headers,
  });

  if (!sessionData?.session || !sessionData?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  // Adds session and user to the context
  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});

// Apply auth middleware to base
// The middleware will receive the merged context including headers from base
export const authorized = base.use(authMiddleware);
