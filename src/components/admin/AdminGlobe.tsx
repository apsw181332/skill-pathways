import { useEffect, useState, useRef, useCallback } from "react";
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

// Simplified continent outlines as [lat, lng] polylines
const CONTINENTS: number[][][] = [
  // North America
  [[-10,60],[-5,70],[10,70],[30,65],[50,60],[60,55],[65,45],[55,30],[50,25],[45,10],[35,5],[30,-10],[25,-15],[15,-10],[10,-20],[5,-30],[-5,-50],[-10,-55],[-15,-65],[-20,-70],[-15,-75],[-10,-80],[-5,-85],[0,-90],[5,-95],[10,-100],[20,-105],[30,-100],[35,-95],[40,-90],[45,-85],[50,-80],[55,-75],[60,-70],[65,-75],[70,-80],[72,-90],[70,-100],[68,-110],[65,-120],[60,-130],[55,-135],[50,-130],[55,-125],[60,-120],[62,-110],[60,-100],[58,-95],[55,-90],[55,-85],[60,-80],[65,-78],[70,-75],[72,-65],[70,-60],[65,-55],[60,-50],[55,-55],[50,-58],[48,-60],[45,-62],[40,-65],[35,-70],[30,-75],[25,-80],[30,-80],[28,-82]].map(([lat,lng]) => [lat, lng]),
  // South America
  [[10,-70],[5,-75],[0,-80],[-5,-80],[-10,-78],[-15,-75],[-20,-70],[-25,-65],[-30,-60],[-35,-57],[-40,-63],[-45,-65],[-50,-70],[-55,-68],[-50,-60],[-45,-55],[-40,-50],[-35,-45],[-30,-40],[-25,-35],[-20,-35],[-15,-40],[-10,-37],[-5,-35],[0,-50],[5,-60],[10,-65],[10,-70]].map(([lat,lng]) => [lat, lng]),
  // Europe
  [[35,-10],[38,-5],[40,0],[43,5],[45,10],[44,15],[40,20],[38,25],[35,25],[37,28],[40,30],[42,28],[45,25],[48,20],[50,15],[52,10],[54,8],[56,10],[58,12],[60,15],[63,10],[65,15],[68,20],[70,25],[70,30],[68,35],[65,30],[62,25],[58,28],[55,25],[52,22],[50,20],[48,18],[45,15],[43,12],[40,5],[38,0],[36,-5],[35,-10]].map(([lat,lng]) => [lat, lng]),
  // Africa
  [[35,-10],[33,-5],[32,0],[30,10],[32,30],[30,32],[25,35],[20,38],[15,42],[10,45],[5,42],[0,42],[-5,40],[-10,40],[-15,35],[-20,35],[-25,33],[-30,30],[-33,28],[-35,20],[-34,18],[-30,17],[-25,15],[-20,12],[-15,12],[-10,14],[-5,10],[0,10],[5,5],[5,0],[10,-5],[15,-15],[20,-17],[25,-15],[30,-10],[33,-8],[35,-10]].map(([lat,lng]) => [lat, lng]),
  // Asia
  [[42,28],[45,35],[40,45],[35,50],[30,50],[25,55],[20,60],[15,75],[10,78],[5,80],[0,105],[-5,110],[-8,115],[0,120],[5,115],[10,110],[15,108],[20,110],[22,108],[25,105],[30,105],[35,110],[40,115],[42,120],[45,130],[48,135],[50,140],[52,142],[55,138],[58,135],[60,140],[62,150],[65,170],[68,175],[70,170],[72,140],[70,130],[68,110],[65,90],[62,75],[60,60],[58,55],[55,50],[52,45],[48,40],[45,35],[42,28]].map(([lat,lng]) => [lat, lng]),
  // Australia
  [[-12,130],[-15,125],[-20,118],[-25,114],[-30,115],[-33,118],[-35,120],[-37,140],[-38,145],[-38,148],[-35,150],[-30,153],[-25,152],[-20,148],[-16,146],[-14,142],[-12,136],[-12,130]].map(([lat,lng]) => [lat, lng]),
];

const DEG = Math.PI / 180;

function project3D(lat: number, lng: number, rotY: number, rotX: number, R: number, cx: number, cy: number) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + rotY) * DEG;
  const x3 = R * Math.sin(phi) * Math.cos(theta);
  const y3 = R * Math.cos(phi);
  const z3 = R * Math.sin(phi) * Math.sin(theta);
  // Apply vertical rotation
  const cosX = Math.cos(rotX * DEG);
  const sinX = Math.sin(rotX * DEG);
  const y3r = y3 * cosX - z3 * sinX;
  const z3r = y3 * sinX + z3 * cosX;
  return { x: cx + x3, y: cy - y3r, z: z3r, visible: z3r > 0 };
}

const AdminGlobe = () => {
  const [markers, setMarkers] = useState<UserMarker[]>(SAMPLE_MARKERS);
  const [userCount, setUserCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const rotXRef = useRef(-10);
  const hoveredMarker = useRef<string | null>(null);
  const tooltipRef = useRef<{ x: number; y: number; name: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (data && data.length > 0) {
        const real = data.map((u) => ({
          id: u.id, lat: u.latitude!, lng: u.longitude!, name: u.display_name || "User",
        }));
        setMarkers([...SAMPLE_MARKERS, ...real]);
      }
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setUserCount(count || 0);
    };
    fetchLocations();
  }, []);

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

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.38;
    const rotY = rotationRef.current;
    const rotX = rotXRef.current;

    // Background
    ctx.clearRect(0, 0, w, h);

    // Globe glow
    const glow = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.3);
    glow.addColorStop(0, "rgba(59,130,246,0.08)");
    glow.addColorStop(1, "rgba(59,130,246,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Globe sphere
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    sphereGrad.addColorStop(0, "#1e293b");
    sphereGrad.addColorStop(1, "#0a1628");
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Grid lines (latitude)
    ctx.strokeStyle = "rgba(59,130,246,0.1)";
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = -180; lng <= 180; lng += 3) {
        const p = project3D(lat, lng, rotY, rotX, R, cx, cy);
        if (p.visible) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else { started = false; }
      }
      ctx.stroke();
    }
    // Grid lines (longitude)
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        const p = project3D(lat, lng, rotY, rotX, R, cx, cy);
        if (p.visible) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else { started = false; }
      }
      ctx.stroke();
    }

    // Continents
    ctx.strokeStyle = "rgba(59,130,246,0.55)";
    ctx.lineWidth = 1.2;
    for (const continent of CONTINENTS) {
      ctx.beginPath();
      let started = false;
      for (const [lat, lng] of continent) {
        const p = project3D(lat, lng, rotY, rotX, R, cx, cy);
        if (p.visible) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else { started = false; }
      }
      ctx.stroke();
    }

    // Marker dots
    let newTooltip: { x: number; y: number; name: string } | null = null;
    for (const m of markers) {
      const p = project3D(m.lat, m.lng, rotY, rotX, R, cx, cy);
      if (!p.visible) continue;

      // Glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,158,11,0.25)";
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();

      if (hoveredMarker.current === m.id) {
        newTooltip = { x: p.x, y: p.y - 16, name: m.name };
      }
    }
    tooltipRef.current = newTooltip;

    // Globe rim
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(59,130,246,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [markers]);

  // Animation loop
  useEffect(() => {
    let animId: number;
    const animate = () => {
      if (!isDragging.current) {
        rotationRef.current += 0.15;
      }
      draw();
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouseX.current = e.clientX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging.current) {
      const dx = e.clientX - lastMouseX.current;
      rotationRef.current += dx * 0.5;
      lastMouseX.current = e.clientX;
    }

    // Hit-test markers for tooltip
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const R = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.38;

    let found: string | null = null;
    for (const m of markers) {
      const p = project3D(m.lat, m.lng, rotationRef.current, rotXRef.current, R, cx, cy);
      if (!p.visible) continue;
      const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
      if (dist < 10) { found = m.id; break; }
    }
    hoveredMarker.current = found;
    if (tooltipRef.current) setTooltip({ ...tooltipRef.current });
    else setTooltip(null);
  };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseLeave = () => { isDragging.current = false; hoveredMarker.current = null; setTooltip(null); };

  const regions = new Set(markers.map((m) => m.name)).size;

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
          <div className="text-2xl font-semibold text-foreground">{regions}</div>
          <div className="text-sm text-muted-foreground">Regions</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden relative" style={{ height: "500px" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ background: "radial-gradient(ellipse at center, #0f172a, #020617)" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div
            className="absolute px-2 py-1 bg-popover border border-border rounded text-xs text-popover-foreground whitespace-nowrap shadow-lg pointer-events-none z-10"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
          >
            {tooltip.name}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        🌍 Drag to rotate • Hover dots for locations • Golden dots = users
      </p>
    </div>
  );
};

export default AdminGlobe;
