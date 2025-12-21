
import React, { useMemo, useEffect, useState } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GoldMaterial, MatteGreenMaterial, GlowMaterial } from './Materials';

//const GoldMaterial = () => (
//  <meshStandardMaterial color="#E8D4A0" roughness={0.3} metalness={0.8} />
//);

const RedMaterial = () => (
  <meshStandardMaterial color="#E63946" roughness={0.3} metalness={0.1} />
);

export const OrnamentSphere: React.FC = () => (
  <mesh>
    <sphereGeometry args={[0.15, 32, 32]} />
    <GoldMaterial />
  </mesh>
);

export const OrnamentCube: React.FC<{ color?: 'RED' | 'GOLD' }> = ({ color = 'RED' }) => (
  <mesh rotation={[Math.random(), Math.random(), Math.random()]}>
    <boxGeometry args={[0.2, 0.2, 0.2]} />
    {color === 'GOLD' ? <GoldMaterial /> : <RedMaterial />}
  </mesh>
);

export const StarOrnament: React.FC = () => (
  // Reduced scale significantly (was 1.5, now 0.6 to match ~2 spheres size)
  <group scale={0.6}>
    <mesh>
      <octahedronGeometry args={[0.4, 0]} />
      <GlowMaterial color="#FFD700" emissiveIntensity={4} />
    </mesh>
    <pointLight distance={5} intensity={50} color="#FFD700" />
  </group>
);

export const CandyCane: React.FC = () => {
  // Create a curved candy cane hook shape
  const createCandyCanePath = () => {
    const curve = new THREE.CurvePath<THREE.Vector3>();
    
    // Hook part (curved top)
    const hookCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0.15, 0.25, 0),
      new THREE.Vector3(0.15, 0.1, 0)
    );
    curve.add(hookCurve);
    
    // Straight part
    const straightLine = new THREE.LineCurve3(
      new THREE.Vector3(0.15, 0.1, 0),
      new THREE.Vector3(0.15, -0.2, 0)
    );
    curve.add(straightLine);
    
    return curve;
  };

  const path = createCandyCanePath();

  // Create multiple segments with alternating colors
  const segments = [];
  const segmentCount = 6;
  
  for (let i = 0; i < segmentCount; i++) {
    const t1 = i / segmentCount;
    const t2 = (i + 1) / segmentCount;
    
    // Create a sub-path for this segment
    const points = [];
    const resolution = 16; // Increased resolution for smoother curves
    for (let j = 0; j <= resolution; j++) {
      const t = t1 + (t2 - t1) * (j / resolution);
      points.push(path.getPoint(t));
    }
    
    const segmentCurve = new THREE.CatmullRomCurve3(points);
    const segmentGeometry = new THREE.TubeGeometry(segmentCurve, 16, 0.04, 16, false);
    
    // Alternate between red and white
    const isRed = i % 2 === 0;
    
    segments.push(
      <mesh key={i} geometry={segmentGeometry}>
        {isRed ? (
          <meshStandardMaterial color="#E63946" roughness={0.2} metalness={0.1} />
        ) : (
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.1} />
        )}
      </mesh>
    );
  }
  
  // Add rounded caps at both ends
  const startPoint = path.getPoint(0);
  const endPoint = path.getPoint(1);
  
  segments.push(
    <mesh key="start-cap" position={[startPoint.x, startPoint.y, startPoint.z]}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#E63946" roughness={0.2} metalness={0.1} />
    </mesh>
  );
  
  segments.push(
    <mesh key="end-cap" position={[endPoint.x, endPoint.y, endPoint.z]}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#E63946" roughness={0.2} metalness={0.1} />
    </mesh>
  );

  return (
    <group rotation={[0.2, Math.random() * Math.PI * 2, 0.3]}>
      {/* Alternating red and white segments */}
      {segments}
    </group>
  );
};

export const PhotoFrame: React.FC<{ url: string; isFocused: boolean; index?: number; onClick: () => void }> = ({ url, isFocused, index, onClick }) => {
  const texture = useTexture(url);
  const [isHorizontal, setIsHorizontal] = useState(false);

  // Determine orientation once texture is loaded
  useEffect(() => {
    if (texture.image && texture.image instanceof HTMLImageElement) {
        setIsHorizontal(texture.image.width > texture.image.height);
    }
  }, [texture, url]);
  
  const tex = useMemo(() => {
    const t = texture.clone();
    
    // Dynamic Target Aspect based on Photo Orientation
    // If Horizontal: Frame is 4:3 (1.33)
    // If Vertical: Frame is 3:4 (0.75)
    const targetAspect = isHorizontal ? 4 / 3 : 3 / 4;
    
    // Safety check if image isn't loaded yet
    const image = t.image instanceof HTMLImageElement ? t.image : null;
    const imageW = image?.width || 1;
    const imageH = image?.height || 1;
    const imageAspect = imageW / imageH;

    let scaleX = 1;
    let scaleY = 1;

    // Crop Logic: simulate object-fit: cover
    if (imageAspect > targetAspect) {
        // Image is wider than target. Match Height, Crop Width.
        scaleX = targetAspect / imageAspect;
    } else {
        // Image is taller than target. Match Width, Crop Height.
        scaleY = imageAspect / targetAspect;
    }

    t.center.set(0.5, 0.5); 
    t.repeat.set(scaleX, scaleY); // Horizontal Flip (-scaleX) + Crop

    return t;
  }, [texture, isHorizontal]);

  // Dynamic Geometry Args based on orientation
  // Frame Padding: 0.1 on all sides
  // Horizontal: Photo 0.8x0.6, Frame 0.9x0.7
  // Vertical: Photo 0.6x0.8, Frame 0.7x0.9
  const frameArgs: [number, number, number] = isHorizontal ? [0.9, 0.7, 0.05] : [0.7, 0.9, 0.05];
  const photoArgs: [number, number] = isHorizontal ? [0.8, 0.6] : [0.6, 0.8];

  return (
    <group 
      userData={{ isPhoto: true, index }} 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Frame */}
      <mesh>
        <boxGeometry args={frameArgs} />
        <GoldMaterial />
      </mesh>
      {/* Photo */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={photoArgs} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
};