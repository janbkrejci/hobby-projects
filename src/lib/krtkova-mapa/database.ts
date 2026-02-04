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

const dbPromise = openDB<GeoRecordDB>("geo-records-db", 1, {
  upgrade(db) {
    const store = db.createObjectStore("geoRecords", {
      keyPath: "id",
      autoIncrement: true,
    });
    store.createIndex("by-id", "id");
  },
});

export const createGeoRecord = async (
  record: Omit<GeoRecord, "id">,
): Promise<void> => {
  const db = await dbPromise;
  await db.add("geoRecords", record);
};

export const readGeoRecords = async (): Promise<GeoRecord[]> => {
  const db = await dbPromise;
  return db.getAll("geoRecords");
};

export const updateGeoRecord = async (
  id: number,
  record: Omit<GeoRecord, "id">,
): Promise<void> => {
  const db = await dbPromise;
  await db.put("geoRecords", { ...record, id });
};

export const deleteGeoRecord = async (id: number): Promise<void> => {
  const db = await dbPromise;
  await db.delete("geoRecords", id);
};
