import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

interface UserMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

// Earth sphere with wireframe style
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial
          color="hsl(230, 58%, 48%)"
          transparent
          opacity={0.15}
          wireframe={false}
        />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.01, 24, 24]} />
        <meshStandardMaterial
          color="hsl(230, 58%, 48%)"
          transparent
          opacity={0.4}
          wireframe
        />
      </mesh>
    </group>
  );
}

function UserDots({ markers }: { markers: UserMarker[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const positions = useMemo(() => {
    return markers.map((m) => latLngToVector3(m.lat, m.lng, 2.05));
  }, [markers]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={meshRef as any}>
      {positions.map((pos, i) => (
        <mesh key={markers[i].id} position={pos}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="hsl(42, 70%, 62%)" emissive="hsl(42, 70%, 62%)" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Sample markers for demo (spread across the world)
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

      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setUserCount(count || 0);
    };
    fetchLocations();
  }, []);

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
          <div className="text-2xl font-semibold text-foreground">12</div>
          <div className="text-sm text-muted-foreground">Countries</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden" style={{ height: "500px" }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <Suspense fallback={null}>
            <Earth />
            <UserDots markers={markers} />
          </Suspense>
          <OrbitControls
            enableZoom
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        🌍 Drag to rotate • Scroll to zoom • User locations shown as golden dots
      </p>
    </div>
  );
};

export default AdminGlobe;
