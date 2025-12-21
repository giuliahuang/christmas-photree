import React from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/UI';

const App: React.FC = () => {
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden selection:bg-arix-gold selection:text-black">
      {/* Background Gradient for Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-arix-emerald/20 via-black to-black z-0 pointer-events-none" />
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Experience />
      </div>

      {/* UI Overlay */}
      <Overlay />
    </main>
  );
};

export default App;