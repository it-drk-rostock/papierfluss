import { describe, expect, it, vi, beforeEach } from "vitest";
import { getAccessibleFolderTree } from "@/app/(app)/formsv2/_actions";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

// Mock the authQuery module
vi.mock("@/server/utils/auth-query", () => ({
  authQuery: vi.fn(),
}));

// Mock the prisma client module
vi.mock("@/lib/prisma", () => ({
  default: {
    formFolderV2: {
      findMany: vi.fn(),
    },
    formV2: {
      findMany: vi.fn(),
    },
  },
}));

describe("Forms V2 Dynamic Folder Visibility Filtering", () => {
  // Define mock dataset for folders
  const mockFolders = [
    { id: "folder-1", name: "IT", order: 2, parentId: null },
    { id: "folder-2", name: "Internal", order: 1, parentId: "folder-1" },
    { id: "folder-3", name: "Junior", order: 1, parentId: "folder-2" },
    { id: "folder-4", name: "Empty Folder", order: 3, parentId: null },
    { id: "folder-5", name: "HR Folder", order: 1, parentId: null }, // Will be pruned (no forms)
  ];

  // Define mock dataset for forms
  const mockForms = [
    {
      id: "form-1",
      title: "IT General Info",
      description: "Public IT info",
      isPublic: true,
      isActive: true,
      folderId: "folder-1",
      readSubmissionPermissions: null,
      responsibleTeam: null,
      teams: [],
    },
    {
      id: "form-2",
      title: "Internal Tech Docs",
      description: "Restricted to Devs team",
      isPublic: false,
      isActive: true,
      folderId: "folder-2",
      readSubmissionPermissions: null,
      responsibleTeam: null,
      teams: [{ id: "t-devs", name: "Devs" }],
    },
    {
      id: "form-3",
      title: "Junior Dev Onboarding Checklist",
      description: "Only visible for user role 'user'",
      isPublic: false,
      isActive: true,
      folderId: "folder-3",
      readSubmissionPermissions: JSON.stringify({
        "==": [{ var: "user.role" }, "user"],
      }),
      responsibleTeam: null,
      teams: [],
    },
    {
      id: "form-4",
      title: "Root Level Form Z",
      description: "Public root form Z",
      isPublic: true,
      isActive: true,
      folderId: null,
      readSubmissionPermissions: null,
      responsibleTeam: null,
      teams: [],
    },
    {
      id: "form-5",
      title: "Root Level Form A",
      description: "Public root form A",
      isPublic: true,
      isActive: true,
      folderId: null,
      readSubmissionPermissions: null,
      responsibleTeam: null,
      teams: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default prisma mock returns
    vi.mocked(prisma.formFolderV2.findMany).mockResolvedValue(mockFolders as any);
    vi.mocked(prisma.formV2.findMany).mockResolvedValue(mockForms as any);
  });

  it("should allow an admin to access all forms and all folders with forms (pruning empty folders)", async () => {
    vi.mocked(authQuery).mockResolvedValue({
      user: {
        id: "admin-id",
        role: "admin",
        teams: [],
      },
    } as any);

    const result = await getAccessibleFolderTree();

    // Admin should see root folder "IT" (order 2),
    // but not "HR Folder" or "Empty Folder" since they contain no forms or subfolders.
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].id).toBe("folder-1"); // IT has order 2

    // Verify nesting structure of IT folder
    const itFolder = result.folders[0];
    expect(itFolder.forms).toHaveLength(1);
    expect(itFolder.forms[0].id).toBe("form-1");

    expect(itFolder.children).toHaveLength(1);
    const internalFolder = itFolder.children[0];
    expect(internalFolder.id).toBe("folder-2");
    expect(internalFolder.forms).toHaveLength(1);
    expect(internalFolder.forms[0].id).toBe("form-2");

    expect(internalFolder.children).toHaveLength(1);
    const juniorFolder = internalFolder.children[0];
    expect(juniorFolder.id).toBe("folder-3");
    expect(juniorFolder.forms).toHaveLength(1);
    expect(juniorFolder.forms[0].id).toBe("form-3");

    // Verify root-level forms are sorted alphabetically
    expect(result.forms).toHaveLength(2);
    expect(result.forms[0].id).toBe("form-5"); // Root Level Form A
    expect(result.forms[1].id).toBe("form-4"); // Root Level Form Z
  });

  it("should filter folders and forms for a user with role 'user' and team 'Devs'", async () => {
    vi.mocked(authQuery).mockResolvedValue({
      user: {
        id: "user-id",
        role: "user",
        teams: [{ id: "t-devs", name: "Devs" }],
      },
    } as any);

    const result = await getAccessibleFolderTree();

    // User is 'user' and in 'Devs' team:
    // - form-1 (public) -> accessible
    // - form-2 (team 'Devs') -> accessible
    // - form-3 (rule checks if role is 'user') -> accessible
    // - form-4/5 (public) -> accessible
    // All forms accessible, same structure as admin.
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].id).toBe("folder-1");
    expect(result.folders[0].children[0].forms[0].id).toBe("form-2");
    expect(result.folders[0].children[0].children[0].forms[0].id).toBe("form-3");
  });

  it("should prune folders containing no accessible forms (e.g. non-dev moderator)", async () => {
    vi.mocked(authQuery).mockResolvedValue({
      user: {
        id: "user-id",
        role: "moderator", // Not admin, not user
        teams: [], // No teams
      },
    } as any);

    const result = await getAccessibleFolderTree();

    // Moderator with no teams:
    // - form-1 (public) -> accessible
    // - form-2 (team 'Devs') -> hidden (no team match)
    // - form-3 (rule checks role === 'user') -> hidden (role is 'moderator')
    // Therefore:
    // - IT folder ("folder-1") has form-1 -> visible
    // - Internal folder ("folder-2") has zero visible forms and zero visible subfolders -> hidden!
    // - Junior folder ("folder-3") is also hidden.
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0].id).toBe("folder-1");
    expect(result.folders[0].forms).toHaveLength(1);
    expect(result.folders[0].forms[0].id).toBe("form-1");
    expect(result.folders[0].children).toHaveLength(0); // child folder pruned
  });

  it("should keep parent folders visible if a nested child folder contains an accessible form", async () => {
    vi.mocked(authQuery).mockResolvedValue({
      user: {
        id: "user-id",
        role: "user", // Matches role rule for form-3
        teams: [], // Not in Devs team, so form-2 is hidden
      },
    } as any);

    const result = await getAccessibleFolderTree();

    // User is 'user' but not in 'Devs' team:
    // - form-1 (public) -> accessible (folder-1)
    // - form-2 (team 'Devs') -> hidden
    // - form-3 (rule checks role === 'user') -> accessible (folder-3)
    // Therefore:
    // - folder-3 has an accessible form -> visible
    // - folder-2 (Internal) has NO accessible forms directly, but its subfolder folder-3 is visible -> visible!
    // - folder-1 has form-1 and subfolder folder-2 -> visible
    expect(result.folders).toHaveLength(1); // Only IT
    const itFolder = result.folders[0];
    expect(itFolder.id).toBe("folder-1");
    expect(itFolder.children).toHaveLength(1);

    const internalFolder = itFolder.children[0];
    expect(internalFolder.id).toBe("folder-2");
    expect(internalFolder.forms).toHaveLength(0); // No forms directly visible
    expect(internalFolder.children).toHaveLength(1); // But child is visible

    const juniorFolder = internalFolder.children[0];
    expect(juniorFolder.id).toBe("folder-3");
    expect(juniorFolder.forms).toHaveLength(1);
    expect(juniorFolder.forms[0].id).toBe("form-3");
  });
});
