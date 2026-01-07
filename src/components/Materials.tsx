import React from 'react';
import { ThreeElements } from '@react-three/fiber';

// Matte Emerald Green - The main foliage color
export const MatteGreenMaterial: React.FC<ThreeElements['meshStandardMaterial']> = (props) => (
  <meshStandardMaterial
    color="#0B3B24"
    roughness={0.8}
    metalness={0.1}
    {...props}
  />
);

// High Polish Gold - For accents
export const GoldMaterial: React.FC<ThreeElements['meshStandardMaterial']> = (props) => (
  <meshStandardMaterial
    color="#F8D568"
    roughness={0.15}
    metalness={1.0}
    envMapIntensity={2.5}
    {...props}
  />
);

// Christmas Red - Glossy and rich
export const RedMaterial: React.FC<ThreeElements['meshStandardMaterial']> = (props) => (
  <meshPhysicalMaterial
    color="#8B0000"
    roughness={0.2}
    metalness={0.3}
    clearcoat={1}
    clearcoatRoughness={0.1}
    {...props}
  />
);

// High intensity light emission
export const GlowMaterial: React.FC<ThreeElements['meshStandardMaterial']> = (props) => (
  <meshStandardMaterial
    color="#FFFAE0"
    emissive="#FFD700"
    emissiveIntensity={3}
    toneMapped={false}
    {...props}
  />
);