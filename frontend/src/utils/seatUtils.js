/**
 * Parses seat ID string to extract section, row, seat number and category
 * Example input: "E04_F06_cat_1" or "E03_A04_vip"
 * Output: { event: "04", section: "F", seat: "06", category: "1" } or { event: "03", section: "A", seat: "04", category: "VIP" }
 */
export const parseSeatDetails = (seatID) => {
  try {
    if (!seatID) return null;
    
    // Check if seat ID contains 'vip' anywhere (case insensitive)
    if (seatID.toLowerCase().includes('vip')) {
      // Try to extract event, section and seat number from VIP seat
      const vipRegex = /E(\d+)_([A-Z])(\d+)/i;
      const vipMatches = seatID.match(vipRegex);
      
      if (vipMatches) {
        return {
          event: vipMatches[1],
          section: vipMatches[2],
          seat: vipMatches[3],
          category: "VIP"  // Always set to VIP if 'vip' is in the string
        };
      }
      
      // Fallback for other VIP formats
      return {
        event: "1",
        section: "A",
        seat: "1",
        category: "VIP"  // Still return VIP category for any VIP seat
      };
    }
    
    // Handle standard category format (E04_F06_cat_1)
    const catRegex = /E(\d+)_([A-Z])(\d+)_cat_(\d+)/i;
    const catMatches = seatID.match(catRegex);
    
    if (catMatches && catMatches.length >= 5) {
      return {
        event: catMatches[1],
        section: catMatches[2],
        seat: catMatches[3],
        category: catMatches[4]
      };
    }
    
    // Try a more general regex to extract any numbers following "cat_"
    const simpleCatRegex = /cat_(\d+)/i;
    const simpleCatMatch = seatID.match(simpleCatRegex);
    
    if (simpleCatMatch) {
      // Try to extract event, section, seat separately
      const basicInfoRegex = /E(\d+)_([A-Z])(\d+)/i;
      const basicMatches = seatID.match(basicInfoRegex);
      
      return {
        event: basicMatches?.[1] || "1",
        section: basicMatches?.[2] || "A",
        seat: basicMatches?.[3] || "1",
        category: simpleCatMatch[1]
      };
    }
    
    // Last resort - extract any parts we can find
    const anyEventMatch = seatID.match(/E(\d+)/i);
    const anySectionMatch = seatID.match(/_([A-Z])(\d+)/i);
    
    return {
      event: anyEventMatch?.[1] || "1",
      section: anySectionMatch?.[1] || "A",
      seat: anySectionMatch?.[2] || "1",
      category: "1" // Default to category 1
    };
  } catch (error) {
    console.error('Error parsing seat ID:', error);
    return {
      event: "1",
      section: "A",
      seat: "1",
      category: "1"
    };
  }
};

/**
 * Gets the category color based on category number
 */
export const getCategoryColor = (category) => {
  const categoryMap = {
    "VIP": "purple",
    "1": "red",
    "2": "blue",
    "3": "green",
  };
  
  return categoryMap[category] || "gray";
};

/**
 * Gets the actual hex color value based on category color string
 */
export const getCategoryColorHex = (categoryColor) => {
  switch(categoryColor) {
    case 'red':
      return '#ef4444';
    case 'green':
      return '#22c55e';
    case 'blue':
      return '#3b82f6';
    case 'purple':
      return '#8b5cf6';
    default:
      return '#6b7280'; // gray-500
  }
};

/**
 * Gets the formatted category display name
 */
export const getCategoryName = (category) => {
  if (category === "VIP") return "VIP";
  if (category === "Unknown") return "CAT_1"; // Default to CAT_1 instead of Unknown
  if (!category || category === "") return "CAT_1";
  return `CAT_${category}`;
}; 