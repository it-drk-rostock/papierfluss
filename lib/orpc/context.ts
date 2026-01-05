import { os } from "@orpc/server";
import { headers } from "next/headers";

// Create headers middleware that provides headers as execution context
// This works for both HTTP requests and Server Actions
const headersMiddleware = os.middleware(async ({ next }) => {
  // Provide headers as execution context
  // This works for both HTTP requests and Server Actions
  return next({
    context: {
      headers: await headers(),
    },
  });
});

// Base with headers middleware applied
// Headers are now available in context for all procedures using this base
export const base = os.use(headersMiddleware);
