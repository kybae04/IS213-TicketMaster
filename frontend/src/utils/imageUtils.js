// Map of artist names to their image filenames
export const artistImageMap = {
  'Benjamin Kheng': 'benkheng.jpg',
  'Bruno Mars': 'brunomars.jpg',
  'Carly Rae Jepsen': 'carly.jpg',
  'Lady Gaga': 'ladygaga.jpg',
  'Lauv': 'lauv.png',
  'Taylor Swift': 'taylorswift.webp',
  'Yoasobi': 'yoasobi.jpg'
};

// Cache for image URLs to avoid recalculating
const imageCache = new Map();

// Default image to use when no match is found
const DEFAULT_IMAGE = 'taylorswift.webp';

/**
 * Get the appropriate image for an event based on artist name
 * @param {string} artistName - The name of the artist or event title
 * @returns {string} - The URL to the image
 */
export const getEventImage = (artistName) => {
  // Return the default image for missing values, but not for real artist names
  if (!artistName || artistName === 'undefined') {
    return `/events/${DEFAULT_IMAGE}`;
  }
  
  // Remove "Unknown" placeholder text but preserve real artist names
  const cleanedName = artistName.replace(/Unknown Event/g, '').trim();
  if (!cleanedName) {
    return `/events/${DEFAULT_IMAGE}`;
  }
  
  // Check cache first
  if (imageCache.has(cleanedName)) {
    return imageCache.get(cleanedName);
  }
  
  // Try direct match first
  if (artistImageMap[cleanedName]) {
    const imageUrl = `/events/${artistImageMap[cleanedName]}`;
    imageCache.set(cleanedName, imageUrl);
    return imageUrl;
  }
  
  // Try case-insensitive partial match for artist names
  const lowerName = cleanedName.toLowerCase();
  for (const [artist, image] of Object.entries(artistImageMap)) {
    if (artist.toLowerCase().includes(lowerName) || 
        lowerName.includes(artist.toLowerCase())) {
      const imageUrl = `/events/${image}`;
      imageCache.set(cleanedName, imageUrl);
      return imageUrl;
    }
  }
  
  // Fallback to default image
  const imageUrl = `/events/${DEFAULT_IMAGE}`;
  imageCache.set(cleanedName, imageUrl);
  return imageUrl;
}; 