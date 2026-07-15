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
