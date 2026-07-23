"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Explicitly define custom icon to avoid React StrictMode/Next.js prototype patching issues
const customIcon = typeof window !== "undefined" ? new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

const DEFAULT_CENTER = { lat: 5.548290, lng: 95.323753 }; // Banda Aceh

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  initialPosition?: { lat: number; lng: number } | null;
  initialRadius?: number;
}

function LocationMarker({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 18); // Zoom in closer for 5m radius precision
    }
  }, [position, map]);

  return position === null || !customIcon ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  );
}

function InitialLocationMarker({ position, radius }: { position: { lat: number; lng: number } | null, radius?: number }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 18);
    }
  }, [position, map]);

  if (!position || !customIcon) return null;

  return (
    <>
      <Marker position={position} opacity={0.6} icon={customIcon}></Marker>
      <Circle
        center={position}
        radius={radius || 5}
        pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.1, weight: 1 }}
      />
    </>
  );
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapPicker({ position, onLocationSelect, initialPosition, initialRadius }: MapPickerProps) {
  const center = position || initialPosition || DEFAULT_CENTER;

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-slate-200 relative z-0">
      <MapContainer
        center={center}
        zoom={18}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
        />
        <InitialLocationMarker position={initialPosition || null} radius={initialRadius} />
        {/* Only show the current position marker if it's different from the initial, or if there's no initial.
            Wait, we want to always show the validated position. We can just render it. */}
        <LocationMarker position={position} />
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}
