"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";

export interface FormNodeV2 {
  id: string;
  title: string;
  description: string | null;
}

export interface FolderNodeV2 {
  id: string;
  name: string;
  order: number;
  parentId: string | null;
  children: FolderNodeV2[];
  forms: FormNodeV2[];
}

export interface AccessibleFolderTreeV2 {
  folders: FolderNodeV2[];
  forms: FormNodeV2[];
}

/**
 * Retrieves the navigation folder structure, dynamically hiding any folders or
 * subfolders that contain zero forms (or child folders) accessible to the active user.
 */
export const getAccessibleFolderTree = async (): Promise<AccessibleFolderTreeV2> => {
  const { user } = await authQuery();

  // 1. Fetch all folders
  const folders = await prisma.formFolderV2.findMany({
    select: {
      id: true,
      name: true,
      order: true,
      parentId: true,
    },
  });

  // 2. Fetch all forms with related teams information for json-logic evaluation
  const forms = await prisma.formV2.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      isPublic: true,
      isActive: true,
      folderId: true,
      readSubmissionPermissions: true,
      responsibleTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      teams: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // 3. Filter forms based on readSubmissionPermissions and current user session context
  const accessibleForms = forms.filter((form) => {
    // Admins bypass permission checks
    if (user.role === "admin") {
      return true;
    }

    const contextData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teams: user.teams?.map((t: any) => t.name) ?? [],
      },
      form: {
        id: form.id,
        title: form.title,
        isPublic: form.isPublic,
        isActive: form.isActive,
        responsibleTeam: form.responsibleTeam?.name,
        teams: form.teams?.map((t: any) => t.name) ?? [],
      },
    };

    const ruleStr = form.readSubmissionPermissions;
    if (!ruleStr) {
      // Default fallback when no rule is defined:
      // - Accessible if the form is public
      // - Accessible if the user is part of the form's assigned teams or responsible team
      if (form.isPublic) {
        return true;
      }
      const userTeamNames = user.teams?.map((t: any) => t.name) ?? [];
      const formTeamNames = form.teams?.map((t: any) => t.name) ?? [];
      const hasSharedTeam = formTeamNames.some((t: string) => userTeamNames.includes(t));
      const isResponsibleTeam = form.responsibleTeam?.name && userTeamNames.includes(form.responsibleTeam.name);
      return hasSharedTeam || isResponsibleTeam;
    }

    try {
      const rule = JSON.parse(ruleStr);
      return !!jsonLogic.apply(rule, contextData);
    } catch (e) {
      console.error("Failed to parse readSubmissionPermissions for form:", form.id, e);
      return false; // Fail closed if rule is invalid
    }
  });

  // 4. Traverse up folder hierarchy starting from accessible forms to find visible folders
  const visibleFolderIds = new Set<string>();
  const folderMap = new Map<string, typeof folders[0]>();
  for (const folder of folders) {
    folderMap.set(folder.id, folder);
  }

  for (const form of accessibleForms) {
    let currentFolderId = form.folderId;
    while (currentFolderId) {
      visibleFolderIds.add(currentFolderId);
      const parentFolder = folderMap.get(currentFolderId);
      currentFolderId = parentFolder?.parentId ?? null;
    }
  }

  // 5. Build the folder tree structure in-memory
  const treeFolderMap = new Map<string, FolderNodeV2>();
  for (const folderId of visibleFolderIds) {
    const folder = folderMap.get(folderId);
    if (folder) {
      treeFolderMap.set(folderId, {
        id: folder.id,
        name: folder.name,
        order: folder.order,
        parentId: folder.parentId,
        children: [],
        forms: [],
      });
    }
  }

  // Populate forms within their respective folders
  for (const form of accessibleForms) {
    if (form.folderId) {
      const folderNode = treeFolderMap.get(form.folderId);
      if (folderNode) {
        folderNode.forms.push({
          id: form.id,
          title: form.title,
          description: form.description,
        });
      }
    }
  }

  // Build parent-child relationships and collect root folders
  const rootFolders: FolderNodeV2[] = [];
  for (const folderNode of treeFolderMap.values()) {
    if (folderNode.parentId) {
      const parentNode = treeFolderMap.get(folderNode.parentId);
      if (parentNode) {
        parentNode.children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    } else {
      rootFolders.push(folderNode);
    }
  }

  // Helper function to recursively sort children/forms inside a folder
  const sortFolderNode = (node: FolderNodeV2) => {
    node.children.sort((a, b) => a.order - b.order);
    node.forms.sort((a, b) => a.title.localeCompare(b.title));
    for (const child of node.children) {
      sortFolderNode(child);
    }
  };

  // Sort root level folders and recurse
  rootFolders.sort((a, b) => a.order - b.order);
  for (const rootFolder of rootFolders) {
    sortFolderNode(rootFolder);
  }

  // Collect and sort root-level forms
  const rootForms: FormNodeV2[] = accessibleForms
    .filter((f) => f.folderId === null)
    .map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
    }));
  rootForms.sort((a, b) => a.title.localeCompare(b.title));

  return {
    folders: rootFolders,
    forms: rootForms,
  };
};

/**
 * Helper to verify that the active user has the admin role.
 */
async function verifyAdmin() {
  const { user } = await authQuery();
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function normalizeFolderName(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Folder name is required");
  }
  return normalizedName;
}

function validateFolderLayout(
  folders: Array<{ id: string; parentId: string | null }>
) {
  const parentById = new Map(folders.map((folder) => [folder.id, folder.parentId]));

  for (const folder of folders) {
    const visited = new Set<string>();
    let currentId: string | null = folder.id;

    while (currentId) {
      if (visited.has(currentId)) {
        throw new Error("Folder hierarchy cannot contain cycles");
      }
      visited.add(currentId);
      currentId = parentById.get(currentId) ?? null;
    }
  }
}

/**
 * Creates a new form folder at the specified parent level.
 * Computes maximum order index at target sibling level and inserts new folder.
 */
export const createFolderV2 = async (name: string, parentId?: string | null) => {
  await verifyAdmin();
  const normalizedName = normalizeFolderName(name);
  const normalizedParentId = parentId || null;

  const siblings = await prisma.formFolderV2.findMany({
    where: { parentId: normalizedParentId },
    select: { order: true },
  });

  const maxOrder = siblings.reduce((max, s) => Math.max(max, s.order), -1);
  const nextOrder = maxOrder + 1;

  const newFolder = await prisma.formFolderV2.create({
    data: {
      name: normalizedName,
      parentId: normalizedParentId,
      order: nextOrder,
    },
  });

  return newFolder;
};

/**
 * Renames an existing form folder.
 */
export const updateFolderV2 = async (id: string, name: string) => {
  await verifyAdmin();
  const normalizedName = normalizeFolderName(name);

  const updatedFolder = await prisma.formFolderV2.update({
    where: { id },
    data: { name: normalizedName },
  });

  return updatedFolder;
};

/**
 * Deletes a form folder, safety reparenting all child subfolders and forms to the parent of the deleted folder.
 */
export const deleteFolderV2 = async (id: string) => {
  await verifyAdmin();

  return await prisma.$transaction(async (tx) => {
    const folder = await tx.formFolderV2.findUnique({
      where: { id },
      select: { parentId: true },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    const targetParentId = folder.parentId;

    const [children, siblings] = await Promise.all([
      tx.formFolderV2.findMany({
        where: { parentId: id },
        select: { id: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      tx.formFolderV2.findMany({
        where: { parentId: targetParentId, id: { not: id } },
        select: { order: true },
      }),
    ]);
    const maxOrder = siblings.reduce(
      (maximum, sibling) => Math.max(maximum, sibling.order),
      -1
    );

    await Promise.all(
      children.map((child, index) =>
        tx.formFolderV2.update({
          where: { id: child.id },
          data: { parentId: targetParentId, order: maxOrder + index + 1 },
        })
      )
    );

    // Reparent forms
    await tx.formV2.updateMany({
      where: { folderId: id },
      data: { folderId: targetParentId },
    });

    // Delete folder
    const deleted = await tx.formFolderV2.delete({
      where: { id },
    });

    return deleted;
  });
};

/**
 * Batch updates folder hierarchy and ordering in a single transaction.
 */
export const reorderFoldersV2 = async (
  folders: Array<{ id: string; parentId: string | null; order: number }>
) => {
  await verifyAdmin();
  const storedFolders = await prisma.formFolderV2.findMany({
    select: { id: true, parentId: true },
  });
  const parentById = new Map(
    storedFolders.map((folder) => [folder.id, folder.parentId])
  );
  for (const folder of folders) {
    parentById.set(folder.id, folder.parentId);
  }
  validateFolderLayout(
    Array.from(parentById, ([id, parentId]) => ({ id, parentId }))
  );

  await prisma.$transaction(
    folders.map((f) =>
      prisma.formFolderV2.update({
        where: { id: f.id },
        data: {
          parentId: f.parentId,
          order: f.order,
        },
      })
    )
  );
};

export { saveFormSchemaV2 } from "@/server/formsv2/save-form-schema-v2";


