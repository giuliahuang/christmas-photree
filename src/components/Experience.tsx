import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows, BakeShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ArixTree } from './Tree';
import { HandController } from './HandController';
import { useStore } from '../store';

const Lighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.2} color="#001100" />
      {/* Key Light - Warm Gold */}
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={800} 
        color="#FFE5B4" 
        castShadow 
      />
      {/* Fill Light - Cool Emerald */}
      <pointLight position={[-10, 5, -10]} intensity={300} color="#004225" />
      {/* Rim Light - Sharp White/Blue for metal definition */}
      <spotLight position={[0, 10, -5]} angle={0.5} intensity={500} color="#E0F7FA" />
      {/* Under lighting for dramatic uplight effect */}
      <pointLight position={[0, -3, 2]} intensity={100} color="#FFD700" distance={5} />
    </>
  );
};

// Logic to animate camera based on app state
const CameraRig: React.FC = () => {
  const { mode } = useStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Store where the user was looking before diving into detail
  // This satisfies "keep the previous zoom dimension" when returning
  const savedPose = useRef<{pos: THREE.Vector3, target: THREE.Vector3} | null>(null);
  // Flag to track if we are currently in a "zoomed in" or "restoring" state
  const isZoomedIn = useRef(false);

  useFrame((state, delta) => {
     // Smooth interpolation factor
     const step = delta * 3.0; 

     if (mode === 'DETAIL') {
         if (!isZoomedIn.current) {
             // Just entering detail mode, save current pose
             savedPose.current = {
                 pos: camera.position.clone(),
                 target: controlsRef.current?.target.clone() || new THREE.Vector3(0,0,0)
             };
             isZoomedIn.current = true;
         }

         // Target Focus: Center (0,0,0) where the photo moves to
         const targetLookAt = new THREE.Vector3(0, 0, 0);
         // Target Position: (0, 0, 6) - close up for detail
         const targetPos = new THREE.Vector3(0, 0, 6);

         // IMPACT: Add subtle handheld camera shake/drift when focused
         const time = state.clock.elapsedTime;
         targetPos.x += Math.sin(time * 0.8) * 0.1;
         targetPos.y += Math.cos(time * 0.5) * 0.1;

         // Smoothly Lerp Camera & Controls
         state.camera.position.lerp(targetPos, step);
         if (controlsRef.current) {
             controlsRef.current.target.lerp(targetLookAt, step);
         }

     } else {
         // TREE or SCATTER mode
         if (isZoomedIn.current && savedPose.current) {
             // We are returning from detail mode.
             // Smoothly fly back to where we were (Restoring zoom dimension)
             state.camera.position.lerp(savedPose.current.pos, step);
             if (controlsRef.current) {
                 controlsRef.current.target.lerp(savedPose.current.target, step);
             }

             // Check if close enough to release control back to user
             if (state.camera.position.distanceTo(savedPose.current.pos) < 0.1) {
                 isZoomedIn.current = false; // Release lock
             }
         } 
         // Else: User has full control via OrbitControls
     }
     
     if (controlsRef.current) {
         controlsRef.current.update();
     }
  });

  return (
      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={2} 
        maxDistance={20}
        // Disable auto-rotate while in Detail OR while animating back to original position
        autoRotate={mode !== 'DETAIL' && !isZoomedIn.current} 
        autoRotateSpeed={0.5}
        enableDamping={true}
    />
  );
};

export const Experience: React.FC = () => {
  return (
    <>
        <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1, 15]} fov={45} />
        
        <color attach="background" args={['#020403']} />
        
        <Suspense fallback={null}>
            <group position={[0, -0.5, 0]}>
                <ArixTree />
            </group>
            
            <Lighting />
            
            <ContactShadows 
                resolution={1024} 
                scale={20} 
                blur={2} 
                opacity={0.5} 
                far={10} 
                color="#000000" 
            />
            
            {/* Environment for reflections on gold */}
            <Environment preset="city" background={false} blur={1} />
            
            <EffectComposer enableNormalPass={false}>
                {/* Cinematic Bloom - Key for the "Glow" look */}
                <Bloom 
                    luminanceThreshold={1.1} // Only very bright things glow
                    mipmapBlur 
                    intensity={1.5} 
                    radius={0.6}
                />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
                <Noise opacity={0.02} />
            </EffectComposer>

            <BakeShadows />
        </Suspense>

        {/* Camera Rig handles OrbitControls and Camera Animation */}
        <CameraRig />

        {/* Webcam input for gestures - Inside Canvas for scene access */}
        <HandController />
        </Canvas>
    </>
  );
};