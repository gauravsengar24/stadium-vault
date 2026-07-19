import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCollection,
  getDocument,
  getMaybeSingle,
  addDocument,
  updateDocument,
  deleteDocument,
  getCount,
} from "../firestore";

const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetCountFromServer = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock("firebase/firestore", () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getCountFromServer: (...args: unknown[]) => mockGetCountFromServer(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}));

function makeSnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
      exists: () => true,
    })),
    empty: docs.length === 0,
  };
}

function makeSingleSnapshot(doc_: { id: string; data: Record<string, unknown> } | null) {
  return {
    ...(doc_
      ? { id: doc_.id, data: () => doc_.data, exists: () => true }
      : { exists: () => false }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCollection", () => {
  it("returns all documents as array", async () => {
    mockGetDocs.mockResolvedValue(
      makeSnapshot([
        { id: "1", data: { name: "Alice" } },
        { id: "2", data: { name: "Bob" } },
      ]),
    );

    const result = await getCollection("users");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1", name: "Alice" });
    expect(result[1]).toEqual({ id: "2", name: "Bob" });
  });

  it("applies where clause", async () => {
    mockGetDocs.mockResolvedValue(makeSnapshot([]));
    await getCollection("alerts", { where: ["active", "==", true] });
    expect(mockWhere).toHaveBeenCalledWith("active", "==", true);
  });

  it("applies orderBy clause", async () => {
    mockGetDocs.mockResolvedValue(makeSnapshot([]));
    await getCollection("alerts", { orderBy: ["created_at", "desc"] });
    expect(mockOrderBy).toHaveBeenCalledWith("created_at", "desc");
  });

  it("applies limit clause", async () => {
    mockGetDocs.mockResolvedValue(makeSnapshot([]));
    await getCollection("alerts", { limit: 5 });
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it("returns empty array for empty collection", async () => {
    mockGetDocs.mockResolvedValue(makeSnapshot([]));
    const result = await getCollection("empty");
    expect(result).toEqual([]);
  });
});

describe("getDocument", () => {
  it("returns document data with id", async () => {
    mockGetDoc.mockResolvedValue(makeSingleSnapshot({ id: "doc1", data: { name: "Test" } }));
    const result = await getDocument("items", "doc1");
    expect(result).toEqual({ id: "doc1", name: "Test" });
  });

  it("returns null when document does not exist", async () => {
    mockGetDoc.mockResolvedValue(makeSingleSnapshot(null));
    const result = await getDocument("items", "missing");
    expect(result).toBeNull();
  });
});

describe("getMaybeSingle", () => {
  it("returns first matching document", async () => {
    mockGetDocs.mockResolvedValue(
      makeSnapshot([{ id: "s1", data: { staff_id: "SEC-001", name: "Alex" } }]),
    );
    const result = await getMaybeSingle("staff_directory", "staff_id", "SEC-001");
    expect(result).toEqual({ id: "s1", staff_id: "SEC-001", name: "Alex" });
  });

  it("returns null when no match", async () => {
    mockGetDocs.mockResolvedValue(makeSnapshot([]));
    const result = await getMaybeSingle("staff_directory", "staff_id", "NONEXIST");
    expect(result).toBeNull();
  });
});

describe("addDocument", () => {
  it("adds document and returns id", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-id" });
    const id = await addDocument("incidents", { type: "fire", severity: "high" });
    expect(id).toBe("new-id");
    expect(mockAddDoc).toHaveBeenCalledWith(undefined, { type: "fire", severity: "high" });
  });
});

describe("updateDocument", () => {
  it("updates document fields", async () => {
    await updateDocument("orders", "order-1", { status: "ready" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(undefined, { status: "ready" });
  });
});

describe("deleteDocument", () => {
  it("deletes document by id", async () => {
    await deleteDocument("items", "item-1");
    expect(mockDeleteDoc).toHaveBeenCalledWith(undefined);
  });
});

describe("getCount", () => {
  it("returns count from server", async () => {
    mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 5 }) });
    const count = await getCount("incidents", "status", "!=", "resolved");
    expect(count).toBe(5);
  });

  it("returns count with no filters", async () => {
    mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 10 }) });
    const count = await getCount("items");
    expect(count).toBe(10);
  });
});
