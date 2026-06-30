"use client";

import React, { createContext, useContext, useState } from "react";

interface MapSyncContextType {
  center: [number, number] | null;
  zoom: number;
  hoveredDeviceId: string | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setHoveredDeviceId: (id: string | null) => void;
  syncMap: (center: [number, number], zoom: number) => void;
}

const MapSyncContext = createContext<MapSyncContextType | undefined>(undefined);

export function MapSyncProvider({ children }: { children: React.ReactNode }) {
  const [center, setCenterState] = useState<[number, number] | null>(null);
  const [zoom, setZoomState] = useState<number>(11);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);

  const setCenter = (c: [number, number]) => {
    setCenterState(c);
  };

  const setZoom = (z: number) => {
    setZoomState(z);
  };

  const syncMap = (c: [number, number], z: number) => {
    setCenterState(c);
    setZoomState(z);
  };

  return (
    <MapSyncContext.Provider
      value={{
        center,
        zoom,
        hoveredDeviceId,
        setCenter,
        setZoom,
        setHoveredDeviceId,
        syncMap,
      }}
    >
      {children}
    </MapSyncContext.Provider>
  );
}

export function useMapSync() {
  const context = useContext(MapSyncContext);
  if (!context) {
    throw new Error("useMapSync must be used within a MapSyncProvider");
  }
  return context;
}
