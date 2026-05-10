import { db } from "../db/index";
import { folders } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function getUserFolders(userId: string, parentId?: string | null) {
  const conditions = [eq(folders.userId, userId)];
  if (parentId === null || parentId === undefined) {
    conditions.push(isNull(folders.parentId));
  } else if (parentId) {
    conditions.push(eq(folders.parentId, parentId));
  }
  return db.query.folders.findMany({
    where: and(...conditions),
    orderBy: (folders, { asc }) => [asc(folders.name)],
  });
}

export async function getAllUserFolders(userId: string) {
  return db.query.folders.findMany({
    where: eq(folders.userId, userId),
    orderBy: (folders, { asc }) => [asc(folders.name)],
  });
}

export async function getFolderById(folderId: string, userId: string) {
  return db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
  });
}

export async function createFolder(data: {
  name: string;
  userId: string;
  parentId?: string | null;
  color?: string;
}) {
  const [folder] = await db.insert(folders).values({
    name: data.name,
    userId: data.userId,
    parentId: data.parentId ?? null,
    color: data.color ?? "#6366f1",
  }).returning();
  return folder;
}

export async function updateFolder(
  folderId: string,
  userId: string,
  updates: { name?: string; color?: string; parentId?: string | null }
) {
  if (updates.parentId !== undefined && updates.parentId !== null) {
    if (updates.parentId === folderId) {
      throw Object.assign(new Error("A folder cannot be its own parent"), { statusCode: 400, expose: true });
    }
    // Walk up the tree to detect cycles
    let currentId: string | null = updates.parentId;
    while (currentId) {
      const parent: { parentId: string | null } | undefined = await db.query.folders.findFirst({
        where: and(eq(folders.id, currentId), eq(folders.userId, userId)),
        columns: { parentId: true },
      });
      if (!parent) break;
      if (parent.parentId === folderId) {
        throw Object.assign(new Error("Moving this folder would create a circular reference"), { statusCode: 400, expose: true });
      }
      currentId = parent.parentId;
    }
  }

  const [folder] = await db
    .update(folders)
    .set(updates)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning();
  return folder;
}

export async function deleteFolder(folderId: string, userId: string) {
  await db.delete(folders).where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}
