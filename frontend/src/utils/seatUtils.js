/**
 * Parses seat ID string to extract section, row, seat number and category
 * Example input: "E04_F06_cat_1" 
 * Output: { event: "04", section: "F", seat: "06", category: "1" }
 */
export const parseSeatDetails = (seatID) => {
  try {
    if (!seatID) return null;
    
    // Handle the format E04_F06_cat_1
    // This means event 4, section F, seat 06, category 1
    const regex = /E(\d+)_([A-Z])(\d+)_cat_(\d+)/;
    const matches = seatID.match(regex);
    
    if (matches && matches.length >= 5) {
      return {
        event: matches[1],
        section: matches[2],
        seat: matches[3],
        category: matches[4]
      };
    } 
    
    // Fallback for other formats
    return {
      event: "Unknown",
      section: "Unknown",
      seat: "Unknown",
      category: "Unknown"
    };
  } catch (error) {
    console.error('Error parsing seat ID:', error);
    return null;
  }
};

/**
 * Gets the category color based on category number
 */
export const getCategoryColor = (category) => {
  const categoryMap = {
    "1": "purple",
    "2": "blue",
    "3": "green",
    "4": "yellow",
    "5": "orange",
    "6": "red",
  };
  
  return categoryMap[category] || "gray";
};

/**
 * Gets the formatted category display name
 */
export const getCategoryName = (category) => {
  return `CAT ${category}`;
}; 