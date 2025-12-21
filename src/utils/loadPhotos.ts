// Utility to load photos from the photos folder
// This uses Vite's import.meta.glob to dynamically import all images

// Import all images from the photos folder
// Supported formats: jpg, jpeg, png, gif, webp (case-insensitive)
// Using multiple glob patterns to catch both uppercase and lowercase extensions
// Using ?url to explicitly get URL strings instead of default imports
const photoModulesLower = import.meta.glob<string>('../photos/*.{jpg,jpeg,png,gif,webp}?url', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

const photoModulesUpper = import.meta.glob<string>('../photos/*.{JPG,JPEG,PNG,GIF,WEBP}?url', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

// Combine both patterns
const photoModules: Record<string, string> = { ...photoModulesLower, ...photoModulesUpper };

/**
 * Get all photo URLs from the photos folder
 * @returns Array of photo URLs
 */
export const loadPhotosFromFolder = (): string[] => {
  // Convert the imported modules to an array of URLs
  // With ?url query, import.meta.glob returns URL strings directly
  const photos = Object.values(photoModules) as string[];

 
  // Sort photos alphabetically for consistent ordering
  return photos.sort();
};

/**
 * Get the number of photos available
 */
export const getPhotoCount = (): number => {
  return Object.keys(photoModules).length;
};

