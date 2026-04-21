import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
// Styles are imported globally in src/main.tsx

// Fix default marker icons for bundlers (Vite)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export type LatLng = { lat: number; lng: number };

type MapPickerProps = {
  value?: LatLng | null;
  onChange?: (coords: LatLng) => void;
  onAddressChange?: (address: string) => void;
  height?: number | string;
  className?: string;
};

// Component to capture clicks and drags on the map
function DraggableMarker({ position, onChange }: { position: LatLng; onChange: (pos: LatLng) => void }) {
  const [draggable, _setDraggable] = useState(true);
  const [pos, setPos] = useState(position);

  useEffect(() => {
    setPos(position);
  }, [position]);

  const eventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const m = e.target as L.Marker;
        const { lat, lng } = m.getLatLng();
        const next = { lat, lng };
        setPos(next);
        onChange(next);
      },
    }),
    [onChange]
  );

  useMapEvents({
    click(e) {
      const next = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPos(next);
      onChange(next);
    },
  });

  return <Marker draggable={draggable} position={pos} eventHandlers={eventHandlers} />;
}

export default function MapPicker({ value, onChange, onAddressChange, height = 320, className }: MapPickerProps) {
  const fallbackCenter: LatLng = { lat: 19.076, lng: 72.8777 }; // Mumbai default
  const [pos, setPos] = useState<LatLng | null>(value ?? fallbackCenter);

  useEffect(() => {
    if (value && (value.lat !== pos?.lat || value.lng !== pos?.lng)) {
      setPos(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // Reverse geocode using Nominatim (best-effort, no key required)
  const reverseGeocode = useCallback(async (coords: LatLng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) return;
      const data = await res.json();
      const display = data.display_name as string | undefined;
      if (display && onAddressChange) onAddressChange(display);
    } catch {
      // ignore
    }
  }, [onAddressChange]);

  const handleChange = useCallback((coords: LatLng) => {
    setPos(coords);
    onChange?.(coords);
    reverseGeocode(coords);
  }, [onChange, reverseGeocode]);

  useEffect(() => {
    if (!pos && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (g) => {
          const coords = { lat: g.coords.latitude, lng: g.coords.longitude };
          handleChange(coords);
        },
        () => {
          setPos(fallbackCenter);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else if (!pos) {
      setPos(fallbackCenter);
    }
  }, [pos, handleChange]);

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
    borderRadius: 12,
  overflow: 'hidden',
  minHeight: 200,
  };

  if (!pos) {
    // Render placeholder while determining position
    return (
      <div className={`w-full bg-muted/40 grid place-items-center text-sm text-muted-foreground`} style={containerStyle}>
        Loading map…
      </div>
    );
  }

  // Fix initial render when container was hidden or size changed
  function InvalidateOnMount({ center }: { center: LatLng }) {
    const map = useMap();
    useEffect(() => {
      map.invalidateSize();
      map.setView([center.lat, center.lng]);
      const t = setTimeout(() => map.invalidateSize(), 100);
      return () => clearTimeout(t);
    }, [map, center.lat, center.lng]);
    return null;
  }

  return (
    <div className={className}>
      <MapContainer center={[pos.lat, pos.lng]} zoom={13} style={containerStyle} scrollWheelZoom>
        <InvalidateOnMount center={pos} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={pos} onChange={handleChange} />
      </MapContainer>
      <div className="mt-2 text-xs text-muted-foreground">Drag the pin or click on the map to set the exact location.</div>
    </div>
  );
}
