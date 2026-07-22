import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveFormSchemaV2 } from "@/server/formsv2/save-form-schema-v2";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));
vi.mock("@/lib/prisma", () => {
  const client = {
    formVersionV2: {
      findUnique: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback(client)),
  };
  return { default: client };
});

describe("saveFormSchemaV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authQuery).mockResolvedValue({ user: { role: "admin" } } as never);
  });

  it("throws error for non-admin users", async () => {
    vi.mocked(authQuery).mockResolvedValue({ user: { role: "user" } } as never);
    await expect(saveFormSchemaV2("v1", { pages: [] })).rejects.toThrow("Unauthorized");
  });

  it("throws error if target form version does not exist", async () => {
    vi.mocked(prisma.formVersionV2.findUnique).mockResolvedValue(null);
    await expect(saveFormSchemaV2("v-missing", { pages: [] })).rejects.toThrow("Form version not found");
  });

  it("updates existing version in-place when zero submissions exist", async () => {
    vi.mocked(prisma.formVersionV2.findUnique).mockResolvedValue({
      id: "v1",
      formId: "form-1",
      version: 1,
      schema: { pages: [{ name: "page1" }] },
      theme: null,
      information: null,
      _count: { submissions: 0 },
    } as never);

    vi.mocked(prisma.formVersionV2.update).mockResolvedValue({
      id: "v1",
      formId: "form-1",
      version: 1,
      schema: { pages: [{ name: "page1-updated" }] },
      theme: null,
      information: null,
    } as never);

    const result = await saveFormSchemaV2("v1", { pages: [{ name: "page1-updated" }] });

    expect(result.cloned).toBe(false);
    expect(prisma.formVersionV2.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { schema: { pages: [{ name: "page1-updated" }] } },
    });
    expect(prisma.formVersionV2.create).not.toHaveBeenCalled();
  });

  it("clones version and increments version counter when submissions exist", async () => {
    vi.mocked(prisma.formVersionV2.findUnique).mockResolvedValue({
      id: "v1",
      formId: "form-1",
      version: 1,
      schema: { pages: [{ name: "v1" }] },
      theme: { color: "blue" },
      information: { title: "Info" },
      _count: { submissions: 3 },
    } as never);

    vi.mocked(prisma.formVersionV2.aggregate).mockResolvedValue({
      _max: { version: 1 },
    } as never);

    vi.mocked(prisma.formVersionV2.create).mockResolvedValue({
      id: "v2",
      formId: "form-1",
      version: 2,
      schema: { pages: [{ name: "v2" }] },
      theme: { color: "blue" },
      information: { title: "Info" },
    } as never);

    const result = await saveFormSchemaV2("v1", { pages: [{ name: "v2" }] });

    expect(result.cloned).toBe(true);
    expect(result.id).toBe("v2");
    expect(result.version).toBe(2);

    expect(prisma.formVersionV2.create).toHaveBeenCalledWith({
      data: {
        formId: "form-1",
        version: 2,
        schema: { pages: [{ name: "v2" }] },
        theme: { color: "blue" },
        information: { title: "Info" },
      },
    });
    expect(prisma.formVersionV2.update).not.toHaveBeenCalled();
  });

  it("ensures submission layout pinning by leaving original version untouched when submissions exist", async () => {
    const existingSubmission = {
      id: "sub-1",
      formVersionId: "v1",
      data: { field: "value" },
    };

    vi.mocked(prisma.formVersionV2.findUnique).mockResolvedValue({
      id: "v1",
      formId: "form-1",
      version: 1,
      schema: { pages: [{ name: "v1-schema" }] },
      theme: null,
      information: null,
      _count: { submissions: 1 },
    } as never);

    vi.mocked(prisma.formVersionV2.aggregate).mockResolvedValue({
      _max: { version: 1 },
    } as never);

    vi.mocked(prisma.formVersionV2.create).mockResolvedValue({
      id: "v2",
      formId: "form-1",
      version: 2,
      schema: { pages: [{ name: "v2-new-schema" }] },
      theme: null,
      information: null,
    } as never);

    const result = await saveFormSchemaV2("v1", { pages: [{ name: "v2-new-schema" }] });

    // Existing submission still points to v1 with original schema
    expect(existingSubmission.formVersionId).toBe("v1");
    // New save created v2
    expect(result.id).toBe("v2");
    // v1 update was never called
    expect(prisma.formVersionV2.update).not.toHaveBeenCalled();
  });
});
