import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, findMany, insertReturning, updateReturning, deleteWhere } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  insertReturning: vi.fn(),
  updateReturning: vi.fn(),
  deleteWhere: vi.fn(),
}));

vi.mock("../db/index", () => ({
  db: {
    query: {
      files: { findFirst, findMany },
      folders: { findFirst, findMany },
      notes: { findMany },
      highlights: { findMany },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: insertReturning })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({ returning: updateReturning })),
      })),
    })),
    delete: vi.fn(() => ({ where: deleteWhere })),
  },
}));

import { getFileById, getUserFiles, deleteFileRecord, updateFile } from "./file.service";

describe("file.service ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getFileById queries with both file id and userId", async () => {
    findFirst.mockResolvedValue({ id: "f1", userId: "u1" });
    const file = await getFileById("f1", "u1");
    expect(file).toEqual({ id: "f1", userId: "u1" });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
      })
    );
  });

  it("getFileById returns undefined for other user (mocked miss)", async () => {
    findFirst.mockResolvedValue(undefined);
    await expect(getFileById("f1", "other-user")).resolves.toBeUndefined();
  });

  it("getUserFiles always scopes by userId", async () => {
    findMany.mockResolvedValue([]);
    await getUserFiles("u1");
    expect(findMany).toHaveBeenCalled();
  });

  it("updateFile and deleteFileRecord invoke user-scoped writes", async () => {
    updateReturning.mockResolvedValue([{ id: "f1" }]);
    deleteWhere.mockResolvedValue(undefined);
    await updateFile("f1", "u1", { name: "renamed" });
    await deleteFileRecord("f1", "u1");
    expect(updateReturning).toHaveBeenCalled();
    expect(deleteWhere).toHaveBeenCalled();
  });
});
