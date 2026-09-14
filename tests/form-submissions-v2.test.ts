import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSubmissionV2, saveSubmissionV2 } from "@/app/(app)/formsv2/submissions/[id]/_actions";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  default: {
    formSubmissionV2: { findUnique: vi.fn(), update: vi.fn() },
    formSubmissionLogV2: { create: vi.fn() },
    $transaction: vi.fn(),
  },
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
describe("saveSubmissionV2", () => {
  const transaction = { formSubmissionV2: { findUnique: vi.fn(), update: vi.fn() }, formSubmissionLogV2: { create: vi.fn() } };
  const editableSubmission = {
    id: "submission-1",
    data: { employeeName: "Ada", managerSignature: "Approved" },
    formVersion: { schema: { pages: [{ elements: [
      { name: "employeeName" },
      { name: "managerSignature", editPermissionRule: { "==": [{ var: "user.role" }, "manager"] } },
    ] }] } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transaction.formSubmissionV2.findUnique).mockResolvedValue(editableSubmission as never);
    vi.mocked(transaction.formSubmissionV2.update).mockResolvedValue({ id: "submission-1" } as never);
    vi.mocked(transaction.formSubmissionLogV2.create).mockResolvedValue({ id: "log-1" } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(transaction as never));
  });

  it("blocks a submitter from overwriting a protected field", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { id: "user-1", role: "user", teams: [] } } as never);
    await expect(saveSubmissionV2("submission-1", { employeeName: "Ada", managerSignature: "Forged" }))
      .rejects.toThrow("Unauthorized update to protected field: managerSignature");
    expect(transaction.formSubmissionV2.update).not.toHaveBeenCalled();
  });

  it("saves permitted changes and records their diff", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { id: "manager-1", role: "manager", teams: [] } } as never);
    await saveSubmissionV2("submission-1", { employeeName: "Grace", managerSignature: "Approved" });
    expect(transaction.formSubmissionV2.update).toHaveBeenCalledWith({ where: { id: "submission-1" }, data: { data: { employeeName: "Grace", managerSignature: "Approved" } } });
    expect(transaction.formSubmissionLogV2.create).toHaveBeenCalledWith({ data: {
      submissionId: "submission-1", actorId: "manager-1", actionType: "SAVE",
      details: { employeeName: { old: "Ada", new: "Grace" } },
      },
    });
  });
});

