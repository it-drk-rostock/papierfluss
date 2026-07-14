import { describe, expect, it } from "vitest";
import { formatError } from "@/utils/format-error";

describe("Vitest Sanity Test", () => {
  it("should assert true successfully", () => {
    expect(true).toBe(true);
  });

  it("should successfully import with path alias", () => {
    const error = new Error("Test error message");
    const formatted = formatError(error);
    expect(formatted.message).toBe("Test error message");
  });
});
