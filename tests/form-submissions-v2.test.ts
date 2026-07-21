import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSubmissionV2 } from "@/app/(app)/formsv2/submissions/[id]/_actions";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  default: { formSubmissionV2: { findUnique: vi.fn() } },
}));

const submission = {
  id: "submission-1",
  data: { employeeName: "Ada", managerNotes: "Promote" },
  formVersion: {
    form: { isPublic: true, readSubmissionPermissions: null, responsibleTeam: null, teams: [] },
    schema: {
      pages: [
        {
          elements: [
            { name: "employeeName" },
            {
              name: "managerNotes",
              viewPermissionRule: { "==": [{ var: "user.role" }, "manager"] },
            },
          ],
        },
      ],
    },
  },
};

describe("getSubmissionV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.formSubmissionV2.findUnique).mockResolvedValue(submission as never);
  });

  it("masks protected fields for an unauthorized user", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { role: "user", teams: [] } } as never);

    await expect(getSubmissionV2("submission-1")).resolves.toEqual(expect.objectContaining({
      data: { employeeName: "Ada" },
    }));
  });

  it("keeps protected fields for an authorized manager", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { role: "manager", teams: [] } } as never);

    await expect(getSubmissionV2("submission-1")).resolves.toEqual(expect.objectContaining({
      data: { employeeName: "Ada", managerNotes: "Promote" },
    }));
  });
});