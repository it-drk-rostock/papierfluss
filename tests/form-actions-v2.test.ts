import { beforeEach, describe, expect, it, vi } from "vitest";
import { triggerFormActionV2 } from "@/app/(app)/formsv2/submissions/[id]/_actions";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));
vi.mock("@/utils/trigger-n8n-webhooks", () => ({ triggerN8nWebhooks: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/prisma", () => ({
  default: {
    formSubmissionV2: { findUnique: vi.fn(), update: vi.fn() },
    formActionV2: { findUnique: vi.fn() },
    formStatusTransitionV2: { findUnique: vi.fn() },
    formSubmissionLogV2: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const mockSubmission = {
  id: "sub-1",
  statusId: "status-draft",
  status: { id: "status-draft", name: "Draft", label: "Entwurf" },
  formVersion: {
    formId: "form-1",
    form: {
      id: "form-1",
      isPublic: true,
      responsibleTeam: null,
      teams: [],
    },
  },
};

const mockAction = {
  id: "act-approve",
  formId: "form-1",
  label: "Approve",
  toStatusId: "status-approved",
  toStatus: { id: "status-approved", name: "Approved", label: "Genehmigt" },
  permissions: JSON.stringify({ "==": [{ var: "user.role" }, "manager"] }),
  n8nWorkflows: [{ workflowId: "webhook-123" }],
};

describe("triggerFormActionV2", () => {
  const transaction = {
    formSubmissionV2: { findUnique: vi.fn(), update: vi.fn() },
    formActionV2: { findUnique: vi.fn() },
    formStatusTransitionV2: { findUnique: vi.fn() },
    formSubmissionLogV2: { create: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transaction.formSubmissionV2.findUnique).mockResolvedValue(mockSubmission as never);
    vi.mocked(transaction.formActionV2.findUnique).mockResolvedValue(mockAction as never);
    vi.mocked(transaction.formSubmissionV2.update).mockResolvedValue({
      ...mockSubmission,
      statusId: "status-approved",
      status: { id: "status-approved", name: "Approved", label: "Genehmigt" },
    } as never);
    vi.mocked(transaction.formSubmissionLogV2.create).mockResolvedValue({ id: "log-1" } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => cb(transaction as never));
  });

  it("blocks execution if user fails json-logic permissions rule", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { id: "user-1", role: "user", teams: [] } } as never);

    await expect(
      triggerFormActionV2("sub-1", { actionId: "act-approve" })
    ).rejects.toThrow("Unauthorized action execution");

    expect(transaction.formSubmissionV2.update).not.toHaveBeenCalled();
    expect(transaction.formSubmissionLogV2.create).not.toHaveBeenCalled();
  });

  it("transitions status and writes STATUS_TRANSITION audit log when authorized", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { id: "mgr-1", role: "manager", teams: [] } } as never);

    const result = await triggerFormActionV2("sub-1", { actionId: "act-approve" });

    expect(result.statusId).toBe("status-approved");
    expect(transaction.formSubmissionV2.update).toHaveBeenCalledWith({
      where: { id: "sub-1" },
      data: { statusId: "status-approved" },
      include: { status: true },
    });
    expect(transaction.formSubmissionLogV2.create).toHaveBeenCalledWith({
      data: {
        submissionId: "sub-1",
        actorId: "mgr-1",
        formActionId: "act-approve",
        actionType: "STATUS_TRANSITION",
        details: { from: "Draft", to: "Approved" },
      },
    });
  });

  it("fires attached n8n webhooks asynchronously", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { id: "admin-1", role: "admin", teams: [] } } as never);

    await triggerFormActionV2("sub-1", { actionId: "act-approve" });

    expect(triggerN8nWebhooks).toHaveBeenCalledWith(["webhook-123"], expect.objectContaining({
      submissionId: "sub-1",
    }));
  });
});
