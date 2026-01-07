export interface TreeTierProps {
  position: [number, number, number];
  scale: number;
  rotationOffset?: number;
}

export interface OrnamentProps {
  position: [number, number, number];
  color?: string;
  scale?: number;
}

export enum SceneMode {
  Cinematic = 'CINEMATIC',
  Interactive = 'INTERACTIVE'
}