import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, AppMode, controls } from '../store';
import { OrnamentSphere, OrnamentCube, CandyCane, PhotoFrame, StarOrnament } from './Ornaments';
import { MatteGreenMaterial } from './Materials';

// Particle definition
type ParticleType = 'LEAF' | 'GOLD_SPHERE' | 'RED_SPHERE' | 'RED_CUBE' | 'GOLD_CUBE' | 'CANDY' | 'PHOTO' | 'STAR';

interface ParticleData {
  id: number;
  type: ParticleType;
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  scale: number;
  photoUrl?: string;
  photoIndex?: number;
}

// Tree configuration
const TARGET_PARTICLE_COUNT = 700; // Target count (may be less due to spacing)
const TREE_HEIGHT = 7;
const TREE_RADIUS_BASE = 3;
const MIN_SPACING = 0.3; // Minimum distance between ornaments

export const ArixTree: React.FC = () => {
  const { mode, photos, setFocusedPhoto, focusedPhotoIndex } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  
  // Ref to store the smoothed rotation speed for inertia
  const smoothedSpeed = useRef(0);
  
  // Apply rotation from controls with Smoothing
  useFrame((state, delta) => {
    if (groupRef.current) {
        // 1. Determine Target Speed
        const targetSpeed = mode === 'DETAIL' ? 0 : controls.rotationSpeed;
        // 2. Smoothly Interpolate
        smoothedSpeed.current = THREE.MathUtils.lerp(smoothedSpeed.current, targetSpeed, delta * 3);
        // 3. Apply Rotation
        groupRef.current.rotation.y += smoothedSpeed.current * delta;
    }
  });

  // Generate static particle data with minimum spacing to avoid overlaps
  const particles = useMemo(() => {
    const data: ParticleData[] = [];
    const placedPositions: THREE.Vector3[] = [];
    
    // Helper to get random point in sphere for scatter
    const getRandomSpherePos = (radius: number) => {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.cbrt(Math.random()) * radius;
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    };
    
    // Helper to generate a random tree position on cone surface
    const generateTreePos = () => {
      const hNorm = Math.sqrt(Math.random()); 
      const y = (1 - hNorm) * TREE_HEIGHT - (TREE_HEIGHT / 2);
      const rBase = hNorm * TREE_RADIUS_BASE;
      const r = rBase * (0.8 + Math.random() * 0.3);
      const angle = Math.random() * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
    };
    
    // Helper to check if position is too close to existing positions
    const isTooClose = (pos: THREE.Vector3, minDist: number) => {
      for (const existing of placedPositions) {
        if (pos.distanceTo(existing) < minDist) {
          return true;
        }
      }
      return false;
    };

    // 1. Add The Star at the Top
    const starPos = new THREE.Vector3(0, TREE_HEIGHT / 2 + 0.2, 0);
    placedPositions.push(starPos);
    data.push({
        id: -1,
        type: 'STAR',
        treePos: starPos,
        scatterPos: new THREE.Vector3(0, 4, 0),
        rotation: new THREE.Euler(0, 0, 0),
        rotationSpeed: new THREE.Vector3(0, 0.5, 0),
        scale: 1.0
    });

    // 2. Generate Tree Body with spacing check
    let attempts = 0;
    const maxAttempts = TARGET_PARTICLE_COUNT * 10; // Limit total attempts
    let particleId = 0;
    
    while (data.length < TARGET_PARTICLE_COUNT + 1 && attempts < maxAttempts) {
      attempts++;
      
      // Generate candidate position
      const treePos = generateTreePos();
      
      // Determine type first to calculate appropriate spacing
      const rand = Math.random();
      let type: ParticleType;
      let typeSpacing = MIN_SPACING;
      
      if (rand < 0.10) {
        type = 'GOLD_SPHERE';
        typeSpacing = MIN_SPACING; // Leaves can be closer
      } else if (rand < 0.35) {
        type = 'RED_CUBE';
        typeSpacing = MIN_SPACING;
      } else if (rand < 0.50) {
        type = 'GOLD_CUBE';
        typeSpacing = MIN_SPACING;
      } else if (rand < 0.80) {
        type = 'GOLD_SPHERE';
        typeSpacing = MIN_SPACING;
      } else {
        type = 'CANDY';
        typeSpacing = MIN_SPACING * 1.3; // Candy canes need more space
      }
      
      // Check spacing
      if (isTooClose(treePos, typeSpacing)) {
        continue; // Try again with new position
      }
      
      // Position is valid, add the particle
      placedPositions.push(treePos.clone());
      
      const scatterPos = getRandomSpherePos(9);
      const scale = 0.5 + Math.random() * 0.5;

      data.push({
        id: particleId++,
        type,
        treePos,
        scatterPos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
        ),
        scale
      });
    }
    
    console.log(`Tree generated with ${data.length} particles (${attempts} attempts)`);
    return data;
  }, []);

  // Combine generated particles with dynamic photos
  const allParticles = useMemo(() => {
    // CLONE everything to ensure we don't mutate static particle data
    const combined = particles.map(p => ({ 
        ...p,
        treePos: p.treePos.clone(),
        scatterPos: p.scatterPos.clone(),
        rotation: p.rotation.clone(),
        rotationSpeed: p.rotationSpeed.clone()
    }));
    
    // --- Fibonacci Sphere Distribution Setup ---
    // This distributes points evenly on a spherical surface
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden Angle
    const n = photos.length;
    const distributionRadius = 6.0; // Place photos on a "shell" radius of 6

    photos.forEach((url, index) => {
        // 1. Calculate Even Position
        // y goes from 1 (top) to -1 (bottom)
        const y = 1 - (index / (n - 1 || 1)) * 2; 
        const r = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * index; // golden angle increment

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        // Evenly distributed position
        const evenPos = new THREE.Vector3(x * distributionRadius, y * distributionRadius, z * distributionRadius);


        // 2. Assign to Particle
        let targetIndex = ((index * 67) + 20) % (combined.length - 1) + 1;
        let attempts = 0;
        while (combined[targetIndex].type === 'PHOTO' && attempts < 100) {
            targetIndex = (targetIndex % (combined.length - 1)) + 1;
            attempts++;
        }

        const p = combined[targetIndex];
        
        if (p && p.type !== 'STAR') {
             p.type = 'PHOTO';
             p.photoUrl = url;
             p.photoIndex = index;
             
             // OVERRIDE the random scatter position with our calculated even position
             p.scatterPos.copy(evenPos);
        }
    });
    return combined;
  }, [particles, photos]);

  return (
    <group ref={groupRef}>
        {allParticles.map((p) => (
            <Particle 
                key={p.id} 
                data={p} 
                mode={mode} 
                focusedIndex={focusedPhotoIndex}
                onPhotoClick={(idx) => setFocusedPhoto(idx)}
            />
        ))}
         {/* Ambient Dust */}
         <Sparkles 
          count={300} 
          scale={12} 
          size={4} 
          speed={0.1} 
          opacity={0.6} 
          color="#FDB931"
        />
    </group>
  );
};

// Individual Particle Component
const Particle: React.FC<{ 
    data: ParticleData; 
    mode: AppMode; 
    focusedIndex: number | null;
    onPhotoClick: (idx: number) => void;
}> = ({ data, mode, focusedIndex, onPhotoClick }) => {
    const meshRef = useRef<THREE.Group>(null);
    const targetPos = useRef(new THREE.Vector3());
    
    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // --- Determine Target Position ---
        if (mode === 'TREE') {
            targetPos.current.copy(data.treePos);
            // Gentle rotation in tree mode
            meshRef.current.rotation.y += delta * 0.2;
        } 
        else if (mode === 'SCATTER') {
            targetPos.current.copy(data.scatterPos);
            
            // Rotation Logic: 
            // Random tumbling for everything using unique rotationSpeed
            meshRef.current.rotation.x += data.rotationSpeed.x * delta;
            meshRef.current.rotation.y += data.rotationSpeed.y * delta;
            meshRef.current.rotation.z += data.rotationSpeed.z * delta;
        } 
        else if (mode === 'DETAIL') {
            if (data.type === 'PHOTO' && data.photoIndex === focusedIndex) {
                targetPos.current.set(0, 0, 0);
                meshRef.current.lookAt(state.camera.position);
            } else {
                targetPos.current.copy(data.scatterPos).multiplyScalar(1.8);
                if (data.type !== 'PHOTO') {
                   meshRef.current.rotation.x += delta * 0.05;
                }
            }
        }

        // --- Interpolate Position ---
        const speed = mode === 'DETAIL' ? 3 : 2; 
        meshRef.current.position.lerp(targetPos.current, delta * speed);

        // --- Dynamic Scale ---
        let targetScale = data.scale;

        if (data.type === 'PHOTO') {
            if (mode === 'TREE') {
                targetScale = 0.4; 
            } else if (mode === 'SCATTER') {
                targetScale = 1.5; 
            } else if (mode === 'DETAIL' && data.photoIndex === focusedIndex) {
                targetScale = 3.5; 
                meshRef.current.lookAt(state.camera.position);
            }
        } else if (data.type === 'STAR') {
             targetScale = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
        
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * speed);
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, delta * speed);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, delta * speed);
    });

    const content = useMemo(() => {
        switch (data.type) {
            case 'STAR': return <StarOrnament />;
            case 'GOLD_SPHERE': return <OrnamentSphere />;
            case 'RED_SPHERE': return <OrnamentSphere color="RED" />;
            case 'RED_CUBE': return <OrnamentCube color="RED" />;
            case 'GOLD_CUBE': return <OrnamentCube color="GOLD" />;
            case 'CANDY': return <CandyCane />;
            case 'PHOTO': 
                return data.photoUrl ? (
                    <PhotoFrame 
                        url={data.photoUrl} 
                        index={data.photoIndex}
                        isFocused={data.photoIndex === focusedIndex} 
                        onClick={() => data.photoIndex !== undefined && onPhotoClick(data.photoIndex)} 
                    />
                ) : null;
            case 'LEAF':
            default:
                return (
                    <mesh rotation={[Math.random(), Math.random(), 0]}>
                        <tetrahedronGeometry args={[0.25, 0]} />
                        <MatteGreenMaterial />
                    </mesh>
                );
        }
    }, [data.type, data.photoUrl, data.photoIndex, focusedIndex, onPhotoClick]);

    return (
        <group ref={meshRef} position={data.treePos}>
            {content}
        </group>
    );
};