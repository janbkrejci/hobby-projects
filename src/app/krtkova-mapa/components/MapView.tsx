"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import ReactMarkdown from "react-markdown";
import "leaflet-defaulticon-compatibility";

import { GeoRecord, readGeoRecords } from "@/lib/krtkova-mapa/database";

const defaultCenter: [number, number] = [49.8175, 15.473];

export default function MapView() {
  const [records, setRecords] = useState<GeoRecord[]>([]);

  useEffect(() => {
    const loadRecords = async () => {
      const loadedRecords = await readGeoRecords();
      setRecords(loadedRecords);
    };
    loadRecords();
  }, []);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={8}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {records.map((record) => (
        <Marker
          key={record.id}
          position={[parseFloat(record.latitude), parseFloat(record.longitude)]}
        >
          <Tooltip direction="top" opacity={1}>
            <div className="prose prose-sm max-w-xs">
              <ReactMarkdown>{record.description}</ReactMarkdown>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
