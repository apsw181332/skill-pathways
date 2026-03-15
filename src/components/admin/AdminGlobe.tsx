import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Tag, Globe2 } from "lucide-react";

interface UserMarker {
  id: string;
  lat: number;
  lng: number;
  displayName: string;
  country: string;
  continent: string;
  xp: number;
  level: number;
}

type LabelMode = "off" | "name" | "country" | "continent";

function getContinent(lat: number, lng: number): string {
  // Rough continent detection from coordinates
  if (lat > 10 && lng >= -170 && lng <= -30) return "North America";
  if (lat <= 10 && lat >= -60 && lng >= -90 && lng <= -30) return "South America";
  if (lat > 35 && lng >= -15 && lng <= 40) return "Europe";
  if (lat <= 35 && lat >= -40 && lng >= -20 && lng <= 55) return "Africa";
  if (lat > 0 && lng > 40 && lng <= 180) return "Asia";
  if (lat <= 0 && lat >= -50 && lng >= 100 && lng <= 180) return "Oceania";
  if (lat > 60 && lng > 40) return "Asia";
  if (lat < -60) return "Antarctica";
  return "Other";
}

// Simplified continent outlines as [lat, lng] polylines for 2D map
const CONTINENT_OUTLINES: number[][][] = [
  // North America
  [[70,-140],[65,-170],[60,-165],[55,-160],[50,-130],[55,-135],[60,-140],[65,-140],[70,-155],[72,-160],[70,-140]],
  [[70,-140],[72,-130],[70,-100],[68,-90],[65,-75],[60,-65],[55,-58],[50,-58],[48,-55],[45,-60],[42,-65],[38,-75],[30,-80],[25,-80],[20,-90],[15,-90],[10,-85],[8,-78],[10,-75],[15,-85],[20,-105],[25,-110],[30,-115],[32,-117],[38,-122],[45,-125],[50,-125],[55,-130],[58,-135],[60,-140],[65,-140],[70,-140]],
  // Central America
  [[20,-105],[18,-100],[16,-92],[14,-88],[10,-84],[8,-78]],
  // South America
  [[10,-70],[12,-72],[10,-75],[5,-75],[0,-80],[-5,-80],[-8,-78],[-10,-75],[-12,-77],[-15,-75],[-18,-70],[-22,-65],[-28,-58],[-33,-55],[-38,-58],[-42,-63],[-46,-68],[-50,-70],[-52,-72],[-55,-68],[-52,-60],[-48,-55],[-43,-50],[-38,-45],[-33,-42],[-28,-38],[-22,-40],[-18,-38],[-12,-37],[-8,-35],[-4,-35],[0,-50],[2,-52],[5,-55],[8,-60],[10,-63],[10,-70]],
  // Europe
  [[70,30],[68,20],[65,12],[63,5],[60,5],[58,8],[57,10],[56,8],[55,12],[54,10],[53,6],[52,5],[51,2],[50,0],[48,-5],[44,-8],[37,-8],[36,-6],[37,-2],[38,0],[40,0],[42,3],[43,5],[44,8],[44,12],[42,15],[40,18],[38,22],[37,24],[35,25],[36,28],[38,27],[40,25],[42,20],[45,14],[46,15],[46,17],[48,17],[49,18],[50,20],[52,21],[54,18],[55,15],[57,18],[58,20],[60,18],[62,16],[63,18],[65,15],[67,16],[69,18],[70,28],[70,30]],
  // Africa
  [[35,10],[37,-2],[36,-6],[33,-8],[28,-13],[22,-17],[18,-16],[15,-17],[12,-15],[5,-5],[5,0],[5,10],[3,10],[0,10],[-5,12],[-8,14],[-12,14],[-15,12],[-18,12],[-22,15],[-25,15],[-28,18],[-30,20],[-34,18],[-34,20],[-33,25],[-30,30],[-25,33],[-20,35],[-15,40],[-10,40],[-5,42],[0,42],[5,44],[10,45],[12,44],[15,42],[20,38],[25,35],[30,32],[32,32],[33,35],[35,12],[35,10]],
  // Asia
  [[70,30],[70,40],[68,50],[65,60],[60,60],[58,55],[55,55],[52,50],[48,48],[45,40],[42,28],[40,30],[38,35],[35,35],[30,35],[28,35],[25,45],[22,55],[20,60],[15,75],[10,78],[8,80],[2,104],[-2,106],[-6,106],[-8,110],[-8,115],[0,118],[2,110],[5,105],[8,105],[10,108],[15,108],[20,110],[22,108],[25,120],[30,122],[35,130],[38,135],[40,130],[42,132],[45,142],[48,145],[50,143],[52,140],[55,138],[58,140],[60,160],[62,170],[65,180],[68,180],[70,175],[72,145],[72,130],[70,100],[68,80],[70,60],[70,40],[70,30]],
  // Australia
  [[-12,130],[-15,125],[-20,118],[-25,114],[-28,114],[-30,115],[-33,116],[-34,118],[-35,120],[-36,137],[-38,144],[-38,148],[-36,150],[-33,152],[-28,153],[-24,150],[-20,149],[-18,146],[-15,145],[-13,142],[-12,136],[-12,130]],
];

// Equirectangular projection: lng -> x, lat -> y
function project2D(lat: number, lng: number, w: number, h: number, padX: number, padY: number) {
  const mapW = w - padX * 2;
  const mapH = h - padY * 2;
  const x = padX + ((lng + 180) / 360) * mapW;
  const y = padY + ((90 - lat) / 180) * mapH;
  return { x, y };
}

const AdminGlobe = () => {
  const [markers, setMarkers] = useState<UserMarker[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [labelMode, setLabelMode] = useState<LabelMode>("off");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; marker: UserMarker } | null>(null);
  const markersRef = useRef<UserMarker[]>([]);

  const fetchUsers = useCallback(async () => {
    const { data: allProfiles, count } = await supabase
      .from("profiles")
      .select("id, display_name, latitude, longitude, xp, level, country", { count: "exact" });

    setUserCount(count || 0);

    if (allProfiles) {
      const mapped = allProfiles
        .filter((u) => u.latitude != null && u.longitude != null)
        .map((u) => ({
          id: u.id,
          lat: u.latitude!,
          lng: u.longitude!,
          displayName: u.display_name || "User",
          country: u.country || "Unknown",
          continent: getContinent(u.latitude!, u.longitude!),
          xp: u.xp || 0,
          level: u.level || 1,
        }));
      setMarkers(mapped);
      markersRef.current = mapped;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel("admin-globe-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padX = 20;
    const padY = 20;

    // Background
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, w, h);

    // Subtle gradient overlay
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    bg.addColorStop(0, "rgba(30, 41, 59, 0.4)");
    bg.addColorStop(1, "rgba(10, 22, 40, 0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(59,130,246,0.08)";
    ctx.lineWidth = 0.5;
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const p1 = project2D(lat, -180, w, h, padX, padY);
      const p2 = project2D(lat, 180, w, h, padX, padY);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    // Longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
      const p1 = project2D(90, lng, w, h, padX, padY);
      const p2 = project2D(-90, lng, w, h, padX, padY);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Equator
    ctx.strokeStyle = "rgba(59,130,246,0.15)";
    ctx.lineWidth = 1;
    const eq1 = project2D(0, -180, w, h, padX, padY);
    const eq2 = project2D(0, 180, w, h, padX, padY);
    ctx.beginPath();
    ctx.moveTo(eq1.x, eq1.y);
    ctx.lineTo(eq2.x, eq2.y);
    ctx.stroke();

    // Draw continent outlines
    ctx.strokeStyle = "rgba(59,130,246,0.45)";
    ctx.lineWidth = 1.2;
    for (const outline of CONTINENT_OUTLINES) {
      ctx.beginPath();
      for (let i = 0; i < outline.length; i++) {
        const [lat, lng] = outline[i];
        const p = project2D(lat, lng, w, h, padX, padY);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Fill continents lightly
    ctx.fillStyle = "rgba(59,130,246,0.06)";
    for (const outline of CONTINENT_OUTLINES) {
      ctx.beginPath();
      for (let i = 0; i < outline.length; i++) {
        const [lat, lng] = outline[i];
        const p = project2D(lat, lng, w, h, padX, padY);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // User dots
    const currentMarkers = markersRef.current;
    const time = Date.now() / 1000;
    const mode = labelMode;

    for (const m of currentMarkers) {
      const p = project2D(m.lat, m.lng, w, h, padX, padY);

      // Pulsing glow
      const pulse = 1 + 0.25 * Math.sin(time * 2 + m.lat * 0.1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,158,11,0.12)";
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,158,11,0.35)";
      ctx.fill();

      // Inner dot
      const dotSize = Math.min(2.5 + m.level * 0.25, 4.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();

      // Labels
      if (mode !== "off") {
        let label = "";
        if (mode === "name") label = m.displayName;
        else if (mode === "country") label = m.country;
        else if (mode === "continent") label = m.continent;

        if (label) {
          ctx.font = "10px system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.textAlign = "center";
          ctx.fillText(label, p.x, p.y - 10);
        }
      }
    }

    // Map border
    ctx.strokeStyle = "rgba(59,130,246,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(padX, padY, w - padX * 2, h - padY * 2);
  }, [labelMode]);

  // Animation for pulsing dots
  useEffect(() => {
    let animId: number;
    const animate = () => {
      draw();
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Mouse hover for tooltips
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    let found: UserMarker | null = null;
    for (const m of markersRef.current) {
      const p = project2D(m.lat, m.lng, w, h, 20, 20);
      const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
      if (dist < 14) { found = m; break; }
    }

    if (found) {
      const p = project2D(found.lat, found.lng, w, h, 20, 20);
      setTooltip({ x: p.x, y: p.y - 24, marker: found });
    } else {
      setTooltip(null);
    }
  };

  const countriesRepresented = new Set(markers.map((m) => m.country)).size;
  const continentsRepresented = new Set(markers.map((m) => m.continent)).size;

  const labelModes: { mode: LabelMode; label: string; icon: typeof MapPin }[] = [
    { mode: "off", label: "Dots Only", icon: MapPin },
    { mode: "name", label: "Name", icon: Tag },
    { mode: "country", label: "Country", icon: Globe2 },
    { mode: "continent", label: "Continent", icon: Globe2 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{userCount}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{markers.length}</div>
          <div className="text-sm text-muted-foreground">Located Users</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{countriesRepresented}</div>
          <div className="text-sm text-muted-foreground">Countries</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-foreground">{continentsRepresented}</div>
          <div className="text-sm text-muted-foreground">Continents</div>
        </div>
      </div>

      {/* Label toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground mr-1">Show labels:</span>
        {labelModes.map(({ mode, label }) => (
          <Button
            key={mode}
            size="sm"
            variant={labelMode === mode ? "default" : "outline"}
            onClick={() => setLabelMode(mode)}
            className="text-xs h-8"
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden relative" style={{ height: "450px" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {tooltip && (
          <div
            className="absolute px-3 py-2 bg-popover border border-border rounded-lg text-xs text-popover-foreground whitespace-nowrap shadow-lg pointer-events-none z-10"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
          >
            <div className="font-semibold">{tooltip.marker.displayName}</div>
            <div className="text-muted-foreground">
              {tooltip.marker.country} • {tooltip.marker.continent}
            </div>
            <div className="text-muted-foreground">Level {tooltip.marker.level} • {tooltip.marker.xp} XP</div>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        🌍 Hover dots for user details • Toggle labels above • Real-time synced from database
      </p>
    </div>
  );
};

export default AdminGlobe;
