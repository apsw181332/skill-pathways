import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import * as topojson from "topojson-client";
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

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Build line segments from GeoJSON coordinates for country borders
function buildCountryLines(topoData: any, radius: number): THREE.BufferGeometry {
  const countries = topojson.feature(topoData, topoData.objects.countries) as any;
  const points: number[] = [];

  const processRing = (coords: number[][]) => {
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[i + 1];
      const v1 = latLngToVector3(lat1, lng1, radius);
      const v2 = latLngToVector3(lat2, lng2, radius);
      points.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    }
  };

  for (const feature of countries.features) {
    if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates.forEach(processRing);
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon.forEach(processRing);
      });
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

// The rotating globe mesh
function Globe({ markers }: { markers: UserMarker[] }) {
  const globeRef = useRef<THREE.Group>(null);
  const [topoData, setTopoData] = useState<any>(null);

  useEffect(() => {
    fetch("/countries-110m.json")
      .then((r) => r.json())
      .then(setTopoData);
  }, []);

  // Slow auto-rotation
  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
  });

  const RADIUS = 2;

  const countryGeometry = useMemo(() => {
    if (!topoData) return null;
    return buildCountryLines(topoData, RADIUS + 0.005);
  }, [topoData]);

  const markerPositions = useMemo(
    () => markers.map((m) => ({ ...m, pos: latLngToVector3(m.lat, m.lng, RADIUS + 0.03) })),
    [markers]
  );

  // Grid lines (latitude / longitude)
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const ring: THREE.Vector3[] = [];
      for (let lng = -180; lng <= 180; lng += 3) {
        ring.push(latLngToVector3(lat, lng, RADIUS + 0.002));
      }
      lines.push(ring);
    }
    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      const ring: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        ring.push(latLngToVector3(lat, lng, RADIUS + 0.002));
      }
      lines.push(ring);
    }
    return lines;
  }, []);

  return (
    <group ref={globeRef}>
      {/* Globe sphere */}
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#0a1628"
          transparent
          opacity={0.95}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.02, 64, 64]} />
        <meshStandardMaterial
          color="#1a3a5c"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <line key={`grid-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={line.length}
              array={new Float32Array(line.flatMap((v) => [v.x, v.y, v.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#1e3a5f" transparent opacity={0.15} />
        </line>
      ))}

      {/* Country borders */}
      {countryGeometry && (
        <lineSegments geometry={countryGeometry}>
          <lineBasicMaterial color="#3b82f6" transparent opacity={0.5} />
        </lineSegments>
      )}

      {/* User marker dots */}
      {markerPositions.map((m) => (
        <group key={m.id} position={[m.pos.x, m.pos.y, m.pos.z]}>
          {/* Glow */}
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} />
          </mesh>
          {/* Dot */}
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const AdminGlobe = () => {
  const [markers, setMarkers] = useState<UserMarker[]>(SAMPLE_MARKERS);
  const [userCount, setUserCount] = useState(0);

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

      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      setUserCount(count || 0);
    };
    fetchLocations();
  }, []);

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

      <div
        className="bg-card border border-border rounded-lg overflow-hidden relative"
        style={{ height: "500px" }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ background: "radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)" }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 3, 5]} intensity={0.8} />
          <pointLight position={[-5, -3, -5]} intensity={0.3} color="#3b82f6" />
          <Suspense fallback={null}>
            <Globe markers={markers} />
          </Suspense>
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            autoRotate={false}
            rotateSpeed={0.5}
          />
        </Canvas>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        🌍 Drag to rotate • Scroll to zoom • Golden dots represent user locations
      </p>
    </div>
  );
};

export default AdminGlobe;
