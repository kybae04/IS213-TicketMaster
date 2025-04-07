// Map of artist names to their image filenames
const artistImageMap = {
  'Benjamin Kheng': 'benkheng.jpg',
  'Bruno Mars': 'brunomars.jpg',
  'Carly Rae Jepsen': 'carly.jpg',
  'Lady Gaga': 'ladygaga.jpg',
  'Lauv': 'lauv.png',
  'Taylor Swift': 'taylorswift.webp',
  'Yoasobi': 'yoasobi.jpg'
};

/**
 * Get the appropriate image for an event based on artist name
 * @param {string} artistName - The name of the artist or event title
 * @returns {string} - The URL to the image
 */
export const getEventImage = (artistName) => {
  // Default image in case an artist isn't found in the map
  const DEFAULT_IMAGE = 'taylorswift.webp';
  
  // Get the image filename for this artist
  const imageFilename = artistImageMap[artistName] || DEFAULT_IMAGE;
  return `/events/${imageFilename}`;
}; 