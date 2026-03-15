import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

const SAMPLE_MARKERS: UserMarker[] = [
  { id: "1", lat: 40.7, lng: -74.0, name: "New York" },
  { id: "2", lat: 51.5, lng: -0.1, name: "London" },
  { id: "3", lat: 35.6, lng: 139.7, name: "Tokyo" },
  { id: "4", lat: -33.8, lng: 151.2, name: "Sydney" },
  { id: "5", lat: 48.8, lng: 2.3, name: "Paris" },
  { id: "6", lat: -23.5, lng: -46.6, name: "São Paulo" },
  { id: "7", lat: 19.4, lng: -99.1, name: "Mexico City" },
  { id: "8", lat: 55.7, lng: 37.6, name: "Moscow" },
  { id: "9", lat: 28.6, lng: 77.2, name: "Delhi" },
  { id: "10", lat: 1.3, lng: 103.8, name: "Singapore" },
  { id: "11", lat: 37.5, lng: 127.0, name: "Seoul" },
  { id: "12", lat: -1.2, lng: 36.8, name: "Nairobi" },
];

function latLngToPercent(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

const AdminGlobe = () => {
  const [markers, setMarkers] = useState<UserMarker[]>(SAMPLE_MARKERS);
  const [userCount, setUserCount] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (data && data.length > 0) {
        const real = data.map((u) => ({
          id: u.id,
          lat: u.latitude!,
          lng: u.longitude!,
          name: u.display_name || "User",
        }));
        setMarkers([...SAMPLE_MARKERS, ...real]);
      }

      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setUserCount(count || 0);
    };
    fetchLocations();
  }, []);

  const countries = new Set(markers.map(m => m.name)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{userCount}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{markers.length}</div>
          <div className="text-sm text-muted-foreground">Mapped Locations</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{countries}</div>
          <div className="text-sm text-muted-foreground">Regions</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden relative" style={{ height: "500px" }}>
        {/* World map using Mercator-style dot grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10">
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={((i + 1) * 100) / 8} x2="100" y2={((i + 1) * 100) / 8} stroke="currentColor" strokeWidth="0.15" className="text-primary" />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line key={`v${i}`} x1={((i + 1) * 100) / 12} y1="0" x2={((i + 1) * 100) / 12} y2="100" stroke="currentColor" strokeWidth="0.15" className="text-primary" />
            ))}
          </svg>

          {/* User dots */}
          {markers.map((marker) => {
            const pos = latLngToPercent(marker.lat, marker.lng);
            const isHovered = hoveredMarker === marker.id;
            return (
              <div
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onMouseEnter={() => setHoveredMarker(marker.id)}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                {/* Pulse ring */}
                <div className="absolute inset-0 w-4 h-4 -ml-1 -mt-1 rounded-full bg-accent/30 animate-ping" style={{ animationDuration: '3s' }} />
                {/* Dot */}
                <div className={`w-2.5 h-2.5 rounded-full bg-accent shadow-lg shadow-accent/30 transition-transform ${isHovered ? 'scale-[2]' : ''}`} />
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs text-popover-foreground whitespace-nowrap shadow-lg z-10">
                    {marker.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        🌍 Hover over dots to see location names • Golden dots represent user locations
      </p>
    </div>
  );
};

export default AdminGlobe;
