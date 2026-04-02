'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-brand-card flex items-center justify-center text-brand-muted animate-pulse rounded-lg border border-brand-border">
      Memuat peta interaktif...
    </div>
  )
});

export interface LocationData {
  address: string;
  rawAddress: string;
  lat: number | null;
  lng: number | null;
  geocodeLat: number | null;
  geocodeLng: number | null;
}

interface LocationPickerProps {
  location: LocationData;
  onChange: (location: LocationData) => void;
}

// Rumus Jarak Bumi (Haversine) - Return Kilometer
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function LocationPicker({ location, onChange }: LocationPickerProps) {
  const [searchInput, setSearchInput] = useState(location.rawAddress || location.address || '');
  const [isSearching, setIsSearching] = useState(false);
  const [distanceWarning, setDistanceWarning] = useState<string | null>(null);

  const fetchGeocode = async (query: string) => {
    // Inject Region Bias Param: countrycodes=id & accept-language=id
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=id&accept-language=id`);
    const data = await res.json();
    if (data && data.length > 0) return data[0];
    return null;
  };

  const handleSearchAddress = async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setDistanceWarning(null);

    // Bedah alamat ke partisi untuk strategi fallback bertahap
    const parts = searchInput.split(',').map(p => p.trim()).filter(Boolean);
    const queries = [
      searchInput, // Step 1: Exactly as typed
      parts.length > 1 ? parts.slice(1).join(', ') : null, // Step 2: Fallback Street+City
      parts.length > 2 ? parts.slice(2).join(', ') : null, // Step 3: Area/City
      parts[parts.length - 1] // Step 4: City Centroid
    ].filter(Boolean) as string[];

    const uniqueQueries = [...new Set(queries)];

    try {
      let finalData = null;
      let usedQueryIndex = 0;

      // Terjun secara berurutan
      for (let i = 0; i < uniqueQueries.length; i++) {
        const data = await fetchGeocode(uniqueQueries[i]);
        if (data) {
          finalData = data;
          usedQueryIndex = i;
          break;
        }
      }

      if (finalData) {
        const lat = parseFloat(finalData.lat);
        const lng = parseFloat(finalData.lon);
        
        // 6. Validasi Jarak Geocoding (Jika hasil melenceng jauh dari nama kota rujukan)
        const cityQuery = parts[parts.length - 1];
        if (usedQueryIndex !== uniqueQueries.length - 1 && cityQuery) { 
          const cityData = await fetchGeocode(cityQuery);
          if (cityData) {
             const distance = calculateDistance(lat, lng, parseFloat(cityData.lat), parseFloat(cityData.lon));
             if (distance > 50) {
               setDistanceWarning(`⚠️ LOW CONFIDENCE: Hasil pencarian melenceng ±${Math.round(distance)} km dari kota. Mohon konfirmasi dan geser pin secara manual.`);
             }
          }
        } else if (usedQueryIndex > 0) {
           setDistanceWarning(`⚠️ Alamat persis tidak ditemukan. Memakai titik berat ${uniqueQueries[usedQueryIndex]}. Silakan geser pin untuk merincikan.`);
        }

        onChange({
          address: finalData.display_name,
          rawAddress: searchInput,
          lat: lat,
          lng: lng,
          geocodeLat: lat,
          geocodeLng: lng
        });
      } else {
        alert("Alamat tak dikenali sama sekali dalam region Indonesia.");
      }
    } catch (err: any) {
      alert("Gagal melakukan pencarian alamat: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Ambil nama alamat berdasarkan lat, lng (Reverse Geocoding)
  const fetchAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`);
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (error) {
      console.error("Geocoding mundur gagal:", error);
    }
    return '';
  };

  // Obtain GPS data
  const handleGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        onChange({
          ...location,
          address: 'Sedang mencari nama jalan...',
          lat: lat,
          lng: lng
        });

        const newAddress = await fetchAddressFromCoordinates(lat, lng);
        onChange({
          ...location, // retain geocode anchors if they existed
          address: newAddress || 'Lokasi GPS (Gagal melacak nama)',
          lat: lat,
          lng: lng
        });

      }, (error) => {
        alert("Gagal memuat GPS perangkat. Pesan: " + error.message);
      }, {
        enableHighAccuracy: true
      });
    } else {
      alert("Browser/Perangkat Anda tidak mendukung fitur GPS.");
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    // Ini mewakili poin #5: Koreksi manual Map Picker, tanpa mengubah geocode awal
    setDistanceWarning(null); // Clear map warning as they are doing it manually now

    onChange({
      ...location,
      lat,
      lng
    });

    const newAddress = await fetchAddressFromCoordinates(lat, lng);
    if (newAddress) {
      onChange({
        ...location,
        address: newAddress,
        lat,
        lng
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-brand-card rounded-xl border border-brand-border p-4 shadow-sm">
      
      {/* 1. Address Search Section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-brand-subtext">Pencarian Alamat & Geocoding</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
            placeholder="mis. Jl. Merdeka No. 10, Kuta Alam, Banda Aceh"
            className="flex-1 p-2.5 text-sm border border-brand-border bg-brand-bg rounded-lg hover:bg-brand-border/50 focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder-brand-muted text-brand-text transition-colors"
          />
          <button
            type="button"
            onClick={handleSearchAddress}
            disabled={isSearching}
            className="px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-70"
          >
            {isSearching ? 'Mencari...' : 'Geocode Lokasi'}
          </button>
        </div>
        {distanceWarning && (
          <div className="mt-1 p-3 bg-state-warning/10 border border-state-warning/30 rounded-lg text-state-warning text-sm font-medium">
             {distanceWarning}
          </div>
        )}
      </div>

      {/* 2. Interactive Map Section */}
      <div className="relative h-[300px] w-full rounded-lg border border-brand-border overflow-hidden z-0 shadow-inner">
         <Map 
           initialLocation={(location.lat && location.lng) ? { lat: location.lat, lng: location.lng } : null}
           onLocationSelect={handleMapSelect}
         />
      </div>

      {/* 3. Controls & Readouts Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-bg p-3 rounded-lg border border-brand-border">
        
        {/* GPS Button */}
        <button
          type="button"
          onClick={handleGPS}
          className="flex items-center gap-2 px-4 py-2 bg-brand-border hover:bg-brand-border/80 text-brand-text border border-brand-border text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
          Sematkan GPS Perangkat
        </button>

        {/* Readout */}
        <div className="flex flex-col gap-1 w-full sm:w-auto text-[10px] sm:text-xs text-brand-muted font-mono">
           <div className="flex justify-between sm:justify-start gap-3">
             <span className="font-semibold w-16 text-brand-subtext">MAP LAT:</span>
             <span className={location.lat ? "text-brand-accent font-bold" : ""}>{location.lat ? location.lat.toFixed(6) : "(kosong)"}</span>
             <span className="ml-2 px-1 border border-brand-border rounded text-brand-muted" title="Geocode API Original">
               {location.geocodeLat ? `API: ${location.geocodeLat.toFixed(6)}` : 'API: -'}
             </span>
           </div>
           <div className="flex justify-between sm:justify-start gap-3">
             <span className="font-semibold w-16 text-brand-subtext">MAP LNG:</span>
             <span className={location.lng ? "text-brand-accent font-bold" : ""}>{location.lng ? location.lng.toFixed(6) : "(kosong)"}</span>
             <span className="ml-2 px-1 border border-brand-border rounded text-brand-muted" title="Geocode API Original">
               {location.geocodeLng ? `API: ${location.geocodeLng.toFixed(6)}` : 'API: -'}
             </span>
           </div>
        </div>

      </div>

    </div>
  );
}
