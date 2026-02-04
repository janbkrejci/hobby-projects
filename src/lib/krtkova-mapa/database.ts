import { openDB, DBSchema } from "idb";

export interface GeoRecord {
  id?: number;
  latitude: string;
  longitude: string;
  description: string;
}

interface GeoRecordDB extends DBSchema {
  geoRecords: {
    key: number;
    value: GeoRecord;
    indexes: { "by-id": number };
  };
}

let dbPromise: ReturnType<typeof openDB<GeoRecordDB>> | null = null;

const getDb = () => {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.");
  }

  if (!dbPromise) {
    dbPromise = openDB<GeoRecordDB>("geo-records-db", 1, {
      upgrade(db) {
        const store = db.createObjectStore("geoRecords", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by-id", "id");
      },
    });
  }

  return dbPromise;
};

export const createGeoRecord = async (
  record: Omit<GeoRecord, "id">,
): Promise<void> => {
  const db = await getDb();
  await db.add("geoRecords", record);
};

export const readGeoRecords = async (): Promise<GeoRecord[]> => {
  const db = await getDb();
  return db.getAll("geoRecords");
};

export const updateGeoRecord = async (
  id: number,
  record: Omit<GeoRecord, "id">,
): Promise<void> => {
  const db = await getDb();
  await db.put("geoRecords", { ...record, id });
};

export const deleteGeoRecord = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.delete("geoRecords", id);
};
