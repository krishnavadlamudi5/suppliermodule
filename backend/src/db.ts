/**
 * MongoDB persistence for PortalData.
 *
 * Each list in PortalData (suppliers, assessments, flags, …) is its own collection,
 * one document per item, with an `_order` field to keep the list order.
 * Everything else (org, user, settings, review decisions, …) lives in one
 * `programme` document.
 *
 * Changes are written per collection: the domain reducer is immutable, so any
 * list whose reference changed is the list that needs rewriting.
 */
import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';
import type { PortalData } from '@shared/domain/types';

const LIST_KEYS = [
  'suppliers',
  'assessments',
  'assignments',
  'flags',
  'evidence',
  'threads',
  'actions',
  'topics',
  'survey',
  'questions',
  'facilities',
  'notifications',
  'qualityChecks',
  'reports',
] as const satisfies readonly (keyof PortalData)[];

const META_KEYS = ['asOf', 'org', 'user', 'programmeYears', 'settings', 'reviewDecisions', 'previousMaturity', 'areaDeltas'] as const satisfies readonly (keyof PortalData)[];

type ListKey = (typeof LIST_KEYS)[number];
type Meta = Pick<PortalData, (typeof META_KEYS)[number]>;

const META_COLLECTION = 'programme';
const META_ID = 'main';

export interface PortalDb {
  /** True once the programme has been written at least once */
  isSeeded(): Promise<boolean>;
  load(): Promise<PortalData>;
  /** Persist `next`, writing only what differs (by reference) from `prev`. Pass prev = null to write everything. */
  save(prev: PortalData | null, next: PortalData): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

export async function connectPortalDb(uri: string, dbName: string): Promise<PortalDb> {
  const client = new MongoClient(uri, { appName: 'bharat-carbon-supplier-portal', serverSelectionTimeoutMS: 10_000 });
  await client.connect();
  const db: Db = client.db(dbName);

  const load = async (): Promise<PortalData> => {
    const meta = await db.collection<Meta & { _id: string }>(META_COLLECTION).findOne({ _id: META_ID }, { projection: { _id: 0 } });
    if (!meta) throw new Error('Programme not found in the database (not seeded yet)');
    const lists = await Promise.all(
      LIST_KEYS.map((k) =>
        db
          .collection(k)
          .find({}, { projection: { _id: 0 } })
          .sort({ _order: 1 })
          .toArray()
          .then((docs) => docs.map(({ _order, ...rest }) => (void _order, rest))),
      ),
    );
    const data = { ...(meta as Meta) } as PortalData;
    LIST_KEYS.forEach((k, i) => {
      (data as unknown as Record<ListKey, unknown[]>)[k] = lists[i];
    });
    return data;
  };

  const save = async (prev: PortalData | null, next: PortalData) => {
    const changedLists = LIST_KEYS.filter((k) => !prev || prev[k] !== next[k]);
    const metaChanged = !prev || META_KEYS.some((k) => prev[k] !== next[k]);
    if (!changedLists.length && !metaChanged) return;

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        for (const k of changedLists) {
          const col = db.collection(k);
          await col.deleteMany({}, { session });
          const items = next[k] as unknown as Record<string, unknown>[];
          // Copy each item: the driver adds _id to inserted objects
          if (items.length) await col.insertMany(items.map((x, i) => ({ ...x, _order: i })), { session });
        }
        if (metaChanged) {
          const meta = Object.fromEntries(META_KEYS.map((k) => [k, next[k]]));
          await db.collection(META_COLLECTION).replaceOne({ _id: META_ID as never }, meta, { upsert: true, session });
        }
      });
    } finally {
      await session.endSession();
    }
  };

  return {
    isSeeded: async () => (await db.collection(META_COLLECTION).countDocuments({ _id: META_ID as never }, { limit: 1 })) > 0,
    load,
    save,
    ping: async () => {
      await db.command({ ping: 1 });
    },
    close: () => client.close(),
  };
}
