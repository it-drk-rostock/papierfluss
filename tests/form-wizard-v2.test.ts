import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  saveWizardStep1,
  saveWizardStep2,
  saveWizardStep3,
  saveWizardStep4,
  saveWizardStep5,
  publishFormV2,
} from "@/server/formsv2/wizard-actions";
import { getAccessibleFolderTree } from "@/app/(app)/formsv2/_actions";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));

vi.mock("@/lib/prisma", () => {
  const client = {
    formV2: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    formVersionV2: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    formStatusV2: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    formStatusTransitionV2: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    formActionV2: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    n8nWorkflowV2: {
      upsert: vi.fn(),
    },
    formFolderV2: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (arg) => {
      if (typeof arg === "function") {
        return await arg(client);
      }
      return arg;
    }),
  };
  return { default: client };
});

describe("Wizard Actions (Stepped DB Commit & Publishing)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authQuery).mockResolvedValue({
      user: { id: "user-1", role: "admin" },
    } as never);
  });

  describe("saveWizardStep1", () => {
    it("creates a new draft FormV2 with isActive: false when no formId given", async () => {
      vi.mocked(prisma.formV2.create).mockResolvedValue({
        id: "form-123",
        title: "Test Form",
        description: "Test Desc",
        isActive: false,
      } as never);

      const result = await saveWizardStep1({
        title: "Test Form",
        description: "Test Desc",
        schema: { pages: [] },
      });

      expect(prisma.formV2.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test Form",
          description: "Test Desc",
          isActive: false,
          createdById: "user-1",
          versions: {
            create: {
              version: 1,
              schema: { pages: [] },
            },
          },
        }),
      });
      expect(result.id).toBe("form-123");
    });

    it("updates existing draft FormV2 when formId given", async () => {
      vi.mocked(prisma.formV2.update).mockResolvedValue({
        id: "form-123",
        title: "Updated Title",
        description: "Updated Desc",
        isActive: false,
      } as never);
      vi.mocked(prisma.formVersionV2.findFirst).mockResolvedValue({
        id: "ver-1",
        version: 1,
      } as never);

      const result = await saveWizardStep1({
        formId: "form-123",
        title: "Updated Title",
        description: "Updated Desc",
        schema: { pages: [{ name: "p1" }] },
      });

      expect(prisma.formV2.update).toHaveBeenCalledWith({
        where: { id: "form-123" },
        data: {
          title: "Updated Title",
          description: "Updated Desc",
        },
      });
      expect(prisma.formVersionV2.update).toHaveBeenCalledWith({
        where: { id: "ver-1" },
        data: { schema: { pages: [{ name: "p1" }] } },
      });
      expect(result.id).toBe("form-123");
    });
  });

  describe("saveWizardStep2", () => {
    it("syncs form statuses for formId", async () => {
      vi.mocked(prisma.formStatusV2.findMany).mockResolvedValue([
        { id: "s1", name: "Entwurf", label: "Entwurf" },
        { id: "s2", name: "Abgeschlossen", label: "Abgeschlossen" },
      ] as never);

      const res = await saveWizardStep2("form-123", [
        { name: "Entwurf", label: "Entwurf" },
        { name: "Abgeschlossen", label: "Abgeschlossen" },
      ]);

      expect(prisma.formStatusV2.deleteMany).toHaveBeenCalledWith({
        where: { formId: "form-123" },
      });
      expect(prisma.formStatusV2.createMany).toHaveBeenCalled();
      expect(res.length).toBe(2);
    });
  });

  describe("saveWizardStep3", () => {
    it("syncs status transitions between existing statuses", async () => {
      vi.mocked(prisma.formStatusV2.findMany).mockResolvedValue([
        { id: "s1", name: "Entwurf", formId: "form-123" },
        { id: "s2", name: "In Prüfung", formId: "form-123" },
      ] as never);

      await saveWizardStep3("form-123", [
        { fromStatusName: "Entwurf", toStatusName: "In Prüfung" },
      ]);

      expect(prisma.formStatusTransitionV2.deleteMany).toHaveBeenCalledWith({
        where: { fromStatus: { formId: "form-123" } },
      });
      expect(prisma.formStatusTransitionV2.createMany).toHaveBeenCalledWith({
        data: [
          {
            fromStatusId: "s1",
            toStatusId: "s2",
            label: null,
            permissions: null,
          },
        ],
      });
    });
  });

  describe("saveWizardStep4", () => {
    it("syncs custom actions for formId", async () => {
      vi.mocked(prisma.formStatusV2.findMany).mockResolvedValue([
        { id: "s2", name: "In Prüfung", formId: "form-123" },
      ] as never);

      await saveWizardStep4("form-123", [
        {
          label: "Einreichen",
          role: "Mitarbeiter",
          toStatusName: "In Prüfung",
        },
      ]);

      expect(prisma.formActionV2.deleteMany).toHaveBeenCalledWith({
        where: { formId: "form-123" },
      });
      expect(prisma.formActionV2.createMany).toHaveBeenCalledWith({
        data: [
          {
            formId: "form-123",
            label: "Einreichen",
            color: "gray",
            permissions: JSON.stringify({
              "==": [{ var: "user.role" }, "Mitarbeiter"],
            }),
            toStatusId: "s2",
          },
        ],
      });
    });
  });

  describe("saveWizardStep5", () => {
    it("links n8n workflow url to form", async () => {
      vi.mocked(prisma.n8nWorkflowV2.upsert).mockResolvedValue({
        id: "n8n-1",
        workflowId: "http://n8n.test",
        name: "n8n Webhook",
      } as never);

      await saveWizardStep5("form-123", {
        webhookUrl: "http://n8n.test",
        events: ["create"],
      });

      expect(prisma.n8nWorkflowV2.upsert).toHaveBeenCalled();
      expect(prisma.formV2.update).toHaveBeenCalledWith({
        where: { id: "form-123" },
        data: {
          submitWorkflows: {
            connect: [{ id: "n8n-1" }],
          },
          archiveN8nWorkflows: {
            disconnect: [{ id: "n8n-1" }],
          },
        },
      });
    });
  });

  describe("publishFormV2", () => {
    it("sets isActive: true on formV2", async () => {
      vi.mocked(prisma.formV2.update).mockResolvedValue({
        id: "form-123",
        isActive: true,
      } as never);

      const result = await publishFormV2("form-123");
      expect(prisma.formV2.update).toHaveBeenCalledWith({
        where: { id: "form-123" },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe("getAccessibleFolderTree filtering inactive forms", () => {
    it("hides isActive: false forms from non-admin users", async () => {
      vi.mocked(authQuery).mockResolvedValue({
        user: { id: "u-user", role: "user", teams: [] },
      } as never);
      vi.mocked(prisma.formFolderV2.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.formV2.findMany).mockResolvedValue([
        {
          id: "f-active",
          title: "Active Form",
          description: null,
          isPublic: true,
          isActive: true,
          folderId: null,
          readSubmissionPermissions: null,
          responsibleTeam: null,
          teams: [],
        },
        {
          id: "f-draft",
          title: "Draft Form",
          description: null,
          isPublic: true,
          isActive: false,
          folderId: null,
          readSubmissionPermissions: null,
          responsibleTeam: null,
          teams: [],
        },
      ] as never);

      const tree = await getAccessibleFolderTree();
      expect(tree.forms.map((f) => f.id)).toEqual(["f-active"]);
    });

    it("allows admin users to see draft forms", async () => {
      vi.mocked(authQuery).mockResolvedValue({
        user: { id: "u-admin", role: "admin", teams: [] },
      } as never);
      vi.mocked(prisma.formFolderV2.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.formV2.findMany).mockResolvedValue([
        {
          id: "f-draft",
          title: "Draft Form",
          description: null,
          isPublic: true,
          isActive: false,
          folderId: null,
          readSubmissionPermissions: null,
          responsibleTeam: null,
          teams: [],
        },
      ] as never);

      const tree = await getAccessibleFolderTree();
      expect(tree.forms.map((f) => f.id)).toEqual(["f-draft"]);
    });
  });
});
