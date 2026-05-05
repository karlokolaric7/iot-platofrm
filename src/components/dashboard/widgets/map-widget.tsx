"use client";

import React from "react";
import { DashboardWidget } from "@/lib/types";
import { Map, Marker } from "pigeon-maps";
import { useDevice, useLatestMeasurements } from "@/hooks/use-iot-data";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export function MapWidget({ widget }: { widget: DashboardWidget }) {
  const deviceId = widget.device_id || "";
  const { data: device } = useDevice(deviceId);
  const { data: measurements = [] } = useLatestMeasurements(deviceId);
  
  // Try to find location data in measurements or device static location
  // Check for field named 'location' or lat/lng fields
  const locationField = measurements.find(m => 
    m.field_id.toLowerCase().includes('location') || 
    m.field_id.toLowerCase().includes('gps')
  );

  // Fallback to static location if defined on device
  let center: [number, number] = [44.7866, 20.4489]; // Default: Belgrade
  let zoom = 12;
  let hasLocation = false;

  if (device?.location) {
    center = [device.location.lat, device.location.lng];
    hasLocation = true;
  }

  // If we have a specific field for location, we could parse it here (omitted for brevity)
  // For now, if we have a static location, we show it.

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full relative">
      <div className="flex-1 w-full relative overflow-hidden rounded-b-xl grayscale-[0.2] contrast-[0.9] brightness-[1.1] dark:invert dark:hue-rotate-180 dark:brightness-[0.8] dark:contrast-[1.2]">
        <Map 
          defaultCenter={center} 
          defaultZoom={zoom}
          boxClassname="map-container"
        >
          <Marker 
            width={40}
            anchor={center}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-10 w-10 bg-primary/20 rounded-full animate-ping" />
              <div className="relative h-8 w-8 bg-background border-2 border-primary rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </div>
          </Marker>
        </Map>
        
        {!hasLocation && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-card/90 border border-border p-3 rounded-lg shadow-xl text-center max-w-[200px]">
              <Navigation className="h-5 w-5 mx-auto mb-2 text-muted-foreground animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider">No GPS Data</p>
              <p className="text-[9px] text-muted-foreground mt-1">Showing default device home location</p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
        <div className="bg-card/80 backdrop-blur-md border border-border/50 px-2 py-1 rounded text-[9px] font-medium shadow-sm flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {hasLocation ? "Live Location" : "Static Position"}
        </div>
      </div>
    </div>
  );
}
