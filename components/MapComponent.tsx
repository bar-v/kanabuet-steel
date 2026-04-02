'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon issue in React/Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = icon;

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Center map if position drastically changes from parent (e.g. search or GPS)
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={icon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          if (marker != null) {
            setPosition(marker.getLatLng());
          }
        }
      }}
    ></Marker>
  )
}

export default function MapComponent({ 
  initialLocation, 
  onLocationSelect 
}: { 
  initialLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const defaultCenter: L.LatLngTuple = initialLocation 
    ? [initialLocation.lat, initialLocation.lng] 
    : [-0.7893, 113.9213]; 
    
  const defaultZoom = initialLocation ? 16 : 5;

  const handlePositionChange = (pos: L.LatLng) => {
    onLocationSelect(pos.lat, pos.lng);
  };

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker 
        position={initialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : null} 
        setPosition={handlePositionChange} 
      />
    </MapContainer>
  );
}
