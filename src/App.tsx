import React from 'react';
import { Experience } from './components/Experience';
import { Overlay, LoadingScreen } from './components/UI';
import { useStore } from './store';

const App: React.FC = () => {
  const hasStarted = useStore((state) => state.hasStarted);
  
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden selection:bg-arix-gold selection:text-black">
      {/* Background Gradient for Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arix-emerald/20 via-black to-black z-0 pointer-events-none" />
      
      {/* 3D Scene - Always loaded, but tree visibility controlled by hasStarted */}
      <div className="absolute inset-0 z-0">
        <Experience />
      </div>

      {/* UI Overlay - Only show when started */}
      {hasStarted && <Overlay />}
      
      {/* Loading Screen - Shows progress and start button */}
      <LoadingScreen />
    </main>
  );
};

export default App;