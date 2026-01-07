/// <reference types="vite/client" />

// Extend ImportMeta interface for Vite's glob functionality
interface ImportMeta {
  glob<T = unknown>(
    pattern: string,
    options?: {
      eager?: boolean;
      import?: string;
      query?: string | Record<string, string | number | boolean>;
      as?: string;
    }
  ): Record<string, T>;
}


