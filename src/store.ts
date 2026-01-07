
import { create } from 'zustand';
import { loadPhotosFromFolder } from './utils/loadPhotos';

export type AppMode = 'TREE' | 'SCATTER' | 'DETAIL';

interface AppState {
  mode: AppMode;
  photos: string[];
  focusedPhotoIndex: number | null;
  isLoaded: boolean;
  hasStarted: boolean;
  loadingProgress: number;
  
  setMode: (mode: AppMode) => void;
  addPhoto: (url: string) => void;
  setFocusedPhoto: (index: number | null) => void;
  toggleMode: () => void;
  setLoaded: (loaded: boolean) => void;
  setStarted: (started: boolean) => void;
  setLoadingProgress: (progress: number) => void;
}

// Mutable state for high-frequency updates (animation loop)
export const controls = {
  rotationSpeed: 0
};

// Load photos from the photos folder
const initialPhotos = loadPhotosFromFolder();

export const useStore = create<AppState>((set) => ({
  mode: 'TREE',
  // Load photos from the photos folder, or use a placeholder if no photos are found
  photos: initialPhotos.length > 0 
    ? initialPhotos 
    : ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600'],
  focusedPhotoIndex: null,
  isLoaded: false,
  hasStarted: false,
  loadingProgress: 0,

  setMode: (mode) => set({ mode }),
  
  addPhoto: (url) => set((state) => ({ photos: [...state.photos, url] })),
  
  setFocusedPhoto: (index) => set({ 
    focusedPhotoIndex: index,
    mode: index !== null ? 'DETAIL' : 'SCATTER' // Auto switch to detail when photo selected
  }),

  toggleMode: () => set((state) => ({
    mode: state.mode === 'TREE' ? 'SCATTER' : 'TREE'
  })),

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  
  setStarted: (started) => set({ hasStarted: started }),
  
  setLoadingProgress: (progress) => set({ loadingProgress: progress })
}));
