import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFormStatusV2 } from "@/server/formsv2/delete-status-v2";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));
vi.mock("@/lib/prisma", () => {
  const client = {
    formStatusV2: { findUnique: vi.fn(), delete: vi.fn() },
    formSubmissionV2: { count: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(async (callback) => callback(client)),
  };
  return { default: client };
});

describe("deleteFormStatusV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authQuery).mockResolvedValue({ user: { role: "admin" } } as never);
    vi.mocked(prisma.formStatusV2.findUnique).mockResolvedValue({ id: "status-old", formId: "form-1" } as never);
  });

  it("blocks deletion when active Form Submissions have no fallback Form Status", async () => {
    vi.mocked(prisma.formSubmissionV2.count).mockResolvedValue(1);

    await expect(deleteFormStatusV2("status-old")).rejects.toThrow("Active submissions require a fallback status");
    expect(prisma.formStatusV2.delete).not.toHaveBeenCalled();
  });

  it("migrates submissions before deleting a Form Status", async () => {
    vi.mocked(prisma.formSubmissionV2.count).mockResolvedValue(2);
    vi.mocked(prisma.formStatusV2.findUnique)
      .mockResolvedValueOnce({ id: "status-old", formId: "form-1" } as never)
      .mockResolvedValueOnce({ id: "status-new", formId: "form-1" } as never);
    vi.mocked(prisma.formStatusV2.delete).mockResolvedValue({ id: "status-old" } as never);

    await expect(deleteFormStatusV2("status-old", "status-new")).resolves.toEqual({ id: "status-old" });
    expect(prisma.formSubmissionV2.updateMany).toHaveBeenCalledWith({
      where: { statusId: "status-old" },
      data: { statusId: "status-new" },
    });
    expect(prisma.formStatusV2.delete).toHaveBeenCalledWith({ where: { id: "status-old" } });
  });
});
