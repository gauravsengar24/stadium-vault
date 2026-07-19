import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getCountFromServer,
  type Firestore,
  type DocumentData,
  type QueryConstraint,
  type WhereFilterOp,
  type OrderByDirection,
  type Unsubscribe,
  type SnapshotListenOptions,
} from "firebase/firestore"
import { db } from "@/integrations/firebase/client"

type WhereClause = [string, WhereFilterOp, unknown]
type OrderClause = [string, OrderByDirection?]

interface QueryOptions {
  where?: WhereClause | WhereClause[]
  orderBy?: OrderClause
  limit?: number
  select?: string[]
}

function buildConstraints(opts: QueryOptions = {}): QueryConstraint[] {
  const constraints: QueryConstraint[] = []

  if (opts.where) {
    const clauses = Array.isArray(opts.where[0]) ? (opts.where as WhereClause[]) : [opts.where as WhereClause]
    for (const [field, op, value] of clauses) {
      constraints.push(where(field, op, value))
    }
  }

  if (opts.orderBy) {
    const [field, dir = "asc"] = opts.orderBy
    constraints.push(orderBy(field, dir))
  }

  if (opts.limit !== undefined) {
    constraints.push(limit(opts.limit))
  }

  return constraints
}

function snapshotToArray<T = Record<string, unknown>>(snapshot: { docs: { id: string; data: () => DocumentData }[] }): T[] {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T))
}

export async function getCollection<T = Record<string, unknown>>(
  collectionName: string,
  opts: QueryOptions = {},
): Promise<T[]> {
  const constraints = buildConstraints(opts)
  const q = query(collection(db, collectionName), ...constraints)
  const snapshot = await getDocs(q)
  return snapshotToArray<T>(snapshot)
}

export async function getDocument<T = Record<string, unknown>>(
  collectionName: string,
  id: string,
): Promise<T | null> {
  const d = doc(db, collectionName, id)
  const snapshot = await getDoc(d)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as unknown as T
}

export async function getMaybeSingle<T = Record<string, unknown>>(
  collectionName: string,
  field: string,
  value: unknown,
): Promise<T | null> {
  const q = query(collection(db, collectionName), where(field, "==", value), limit(1))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() } as unknown as T
}

export async function addDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), data as DocumentData)
  return ref.id
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Partial<Record<string, unknown>>,
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), data as DocumentData)
}

export async function deleteDocument(
  collectionName: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(db, collectionName, id))
}

export async function getCount(
  collectionName: string,
  field?: string,
  op?: WhereFilterOp,
  value?: unknown,
): Promise<number> {
  let constraints: QueryConstraint[] = []
  if (field && op && value !== undefined) {
    constraints = [where(field, op, value)]
  }
  const q = query(collection(db, collectionName), ...constraints)
  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

export function listenCollection<T = Record<string, unknown>>(
  collectionName: string,
  callback: (items: T[]) => void,
  opts: QueryOptions = {},
  onError?: (error: Error) => void,
): Unsubscribe {
  const constraints = buildConstraints(opts)
  const q = query(collection(db, collectionName), ...constraints)

  return onSnapshot(
    q,
    { includeMetadataChanges: false } as SnapshotListenOptions,
    (snapshot) => {
      callback(snapshotToArray<T>(snapshot))
    },
    (error) => {
      if (onError) onError(error)

    },
  )
}

export function listenDocument<T = Record<string, unknown>>(
  collectionName: string,
  docId: string,
  callback: (item: T | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const d = doc(db, collectionName, docId)
  return onSnapshot(
    d,
    { includeMetadataChanges: false } as SnapshotListenOptions,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null)
        return
      }
      callback({ id: snapshot.id, ...snapshot.data() } as unknown as T)
    },
    (error) => {
      if (onError) onError(error)

    },
  )
}
