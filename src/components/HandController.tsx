
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, controls } from '../store';

export const HandController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null); // Ref for the visual indicator
  
  // Logic for smooth cursor movement
  const cursorPos = useRef({ x: 0, y: 0 });
  const isHandVisible = useRef(false);

  const { setMode, mode, setFocusedPhoto } = useStore();
  const [loading, setLoading] = useState(true);
  const lastGestureRef = useRef<number>(0);
  
  // Access Three.js internals for projecting 3D points to 2D
  const { camera, scene, size } = useThree();
  const cameraRef = useRef(camera);
  const sceneRef = useRef(scene);
  
  // Keep refs updated
  useEffect(() => { cameraRef.current = camera; }, [camera]);
  useEffect(() => { sceneRef.current = scene; }, [scene]);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
        setLoading(false);
      }
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
          }
          setLoading(false);
        } catch (err) {
          console.error("Webcam denied:", err);
          setLoading(false);
        }
      }
    };

    const drawDebug = (landmarks: any, openRatio: number, pinchRatio: number, gesture: string, handSize: number) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas size to video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context for styling
        ctx.save();
        
        // Draw Skeleton
        // Finger connections
        const connections = [
            [0,1],[1,2],[2,3],[3,4], // Thumb
            [0,5],[5,6],[6,7],[7,8], // Index
            [0,9],[9,10],[10,11],[11,12], // Middle
            [0,13],[13,14],[14,15],[15,16], // Ring
            [0,17],[17,18],[18,19],[19,20], // Pinky
            [5,9],[9,13],[13,17],[0,17] // Palm
        ];

        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        
        connections.forEach(([start, end]) => {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.stroke();
        });

        // Draw Joints
        ctx.fillStyle = '#FF0000';
        landmarks.forEach((p: any) => {
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw Debug Text
        ctx.restore();
        ctx.save();
        ctx.scale(-1, 1); // Flip context horizontally
        ctx.translate(-canvas.width, 0); // Move back into view

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 14px monospace';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        
        ctx.fillText(`Mode: ${gesture}`, 10, 20);
        ctx.fillText(`OpenRatio: ${openRatio.toFixed(2)} (Target > 1.6)`, 10, 40);
        ctx.fillText(`FistRatio: ${openRatio.toFixed(2)} (Target < 1.2)`, 10, 60);
        ctx.fillText(`PinchRatio: ${pinchRatio.toFixed(2)} (Target < 0.25)`, 10, 80);
        ctx.fillText(`HandSize: ${handSize.toFixed(3)}`, 10, 100);
        
        ctx.restore();
    };

    const predictWebcam = () => {
      if (videoRef.current && handLandmarker) {
        const startTimeMs = performance.now();
        if (videoRef.current.currentTime > 0) {
             const result = handLandmarker.detectForVideo(videoRef.current, startTimeMs);
             
             if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                const now = Date.now();
                
                // --- UPDATE CURSOR POSITION (Index Finger #8) ---
                const indexTip = landmarks[8];
                
                // Calculate Target Position
                // Map normalized coordinates (0-1) to window pixels.
                // Important: Mirror the X coordinate because the interaction logic assumes a mirrored view
                const targetX = (1 - indexTip.x) * window.innerWidth;
                const targetY = indexTip.y * window.innerHeight;

                // Smooth Interpolation Logic
                if (!isHandVisible.current) {
                    // First frame detecting hand: Snap instantly to avoid "flying in"
                    cursorPos.current.x = targetX;
                    cursorPos.current.y = targetY;
                    isHandVisible.current = true;
                } else {
                    // Subsequent frames: Smoothly interpolate (Lerp)
                    // Factor 0.15 = Smooth but responsive. Lower is smoother/slower.
                    const lerpFactor = 0.15;
                    cursorPos.current.x += (targetX - cursorPos.current.x) * lerpFactor;
                    cursorPos.current.y += (targetY - cursorPos.current.y) * lerpFactor;
                }
                
                if (cursorRef.current) {
                    cursorRef.current.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`;
                    cursorRef.current.style.opacity = '1';
                }

                // --- SCALE INVARIANT CALCULATION ---
                // Measure hand size: Distance from Wrist (0) to Middle Knuckle (9)
                const wrist = landmarks[0];
                const middleKnuckle = landmarks[9];
                const handSize = Math.sqrt(
                    Math.pow(middleKnuckle.x - wrist.x, 2) + 
                    Math.pow(middleKnuckle.y - wrist.y, 2) + 
                    Math.pow(middleKnuckle.z - wrist.z, 2)
                );

                // Protect against divide by zero
                const scale = handSize || 1;

                // 1. Pinch Detection (Thumb Tip #4 to Index Tip #8)
                const thumbTip = landmarks[4];
                // indexTip is already defined above as landmarks[8]
                const rawPinchDist = Math.sqrt(
                    Math.pow(thumbTip.x - indexTip.x, 2) + 
                    Math.pow(thumbTip.y - indexTip.y, 2) + 
                    Math.pow(thumbTip.z - indexTip.z, 2)
                );
                const pinchRatio = rawPinchDist / scale;
                
                // 2. Open/Close Detection (Fist vs Palm)
                // Average distance of all fingertips to wrist
                const tips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
                let avgDistToWrist = 0;
                tips.forEach(tip => {
                   avgDistToWrist += Math.sqrt(
                       Math.pow(tip.x - wrist.x, 2) + 
                       Math.pow(tip.y - wrist.y, 2) + 
                       Math.pow(tip.z - wrist.z, 2)
                   );
                });
                avgDistToWrist /= 5;
                const openRatio = avgDistToWrist / scale;

                let debugGesture = "NONE";

                // --- State Logic ---
                const currentMode = useStore.getState().mode;

                // Priority: Pinch -> Detail
                // CRITICAL CHECK: Must NOT be in TREE mode
                if (pinchRatio < 0.25 && currentMode !== 'TREE') { 
                    debugGesture = "PINCH";
                    if (currentMode !== 'DETAIL' && (now - lastGestureRef.current > 1000)) {
                        // == FIND CLOSEST PHOTO LOGIC ==
                        const pinchX = (thumbTip.x + indexTip.x) / 2;
                        const pinchY = (thumbTip.y + indexTip.y) / 2;

                        let closestIdx = -1;
                        let minD = Infinity;

                        if (sceneRef.current) {
                            const photos: THREE.Object3D[] = [];
                            sceneRef.current.traverse((obj) => {
                                if (obj.userData && obj.userData.isPhoto) {
                                    photos.push(obj);
                                }
                            });

                            photos.forEach(photo => {
                                const pos = new THREE.Vector3();
                                photo.getWorldPosition(pos);
                                pos.project(cameraRef.current);
                                
                                // Map NDC (-1 to 1) to (0 to 1)
                                const screenX = (pos.x + 1) / 2;
                                const screenY = (-pos.y + 1) / 2; 

                                // Distance in "Landmark Space" (0-1)
                                const dist = Math.sqrt(
                                    Math.pow((1 - screenX) - pinchX, 2) + 
                                    Math.pow(screenY - pinchY, 2)
                                );

                                if (dist < minD) {
                                    minD = dist;
                                    closestIdx = photo.userData.index;
                                }
                            });
                        }

                        if (closestIdx !== -1) {
                            setFocusedPhoto(closestIdx);
                        } else {
                            // Fallback
                            const currentPhotos = useStore.getState().photos;
                            if (currentPhotos.length > 0) setFocusedPhoto(0);
                        }
                        
                        lastGestureRef.current = now;
                    }
                } 
                // Only change Tree/Scatter if NOT pinching and cooldown passed
                else if (now - lastGestureRef.current > 800) {
                    
                    if (openRatio > 1.6) {
                        debugGesture = "OPEN";
                        // Open Hand -> Scatter
                        if (currentMode !== 'SCATTER' && currentMode !== 'DETAIL') {
                             setMode('SCATTER');
                             lastGestureRef.current = now;
                        } else if (currentMode === 'DETAIL') {
                             setFocusedPhoto(null);
                             setMode('SCATTER');
                             lastGestureRef.current = now;
                        }
                    } else if (openRatio < 1.2) { 
                        debugGesture = "FIST";
                        // Fist -> Tree
                         if (currentMode !== 'TREE') {
                             setFocusedPhoto(null);
                             setMode('TREE');
                             lastGestureRef.current = now;
                         }
                    }
                }

                // --- Rotation Control (Scatter Mode) ---
                if (currentMode === 'SCATTER') {
                    // Controls speed: Normalized (-1 to 1)
                    // Multiplier 1.5 gives good responsiveness, smoothed by Tree.tsx
                    controls.rotationSpeed = (wrist.x - 0.5) * 0.6;
                } else {
                    controls.rotationSpeed = 0;
                }

                drawDebug(landmarks, openRatio, pinchRatio, debugGesture, handSize);

             } else {
                 // Hand not detected
                 controls.rotationSpeed = 0;
                 isHandVisible.current = false; // Reset visibility flag for next time
                 
                 if(canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
                 }
                 // Fade out cursor
                 if(cursorRef.current) cursorRef.current.style.opacity = '0';
             }
        }
        animationFrameId = requestAnimationFrame(predictWebcam);
      }
    };

    setupMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, [setMode, setFocusedPhoto, camera, scene]);

  return (
    <Html as='div' wrapperClass="hand-controller-wrapper" prepend fullscreen style={{ pointerEvents: 'none' }}>
        
        {/* Thumb Indicator Light - Diffuse Glow with Smooth Transition */}
        <div 
            ref={cursorRef}
            className="absolute top-0 left-0 w-4 h-4 -ml-2 -mt-2 bg-white rounded-full shadow-[0_0_40px_15px_rgba(255,255,255,0.6)] pointer-events-none transition-opacity duration-500 ease-in-out opacity-0 z-50 mix-blend-screen"
        />

        {/* Hidden Video Element - Required for MediaPipe gesture detection */}
        <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                width={640}
                height={480}
            />
            <canvas 
                ref={canvasRef}
                width={640}
                height={480}
            />
        </div>
    </Html>
  );
};
