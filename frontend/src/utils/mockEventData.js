export const events = [
  {
    id: 1,
    title: "Taylor Swift - The Eras Tour",
    date: "2023-12-10",
    time: "19:30",
    location: "SoFi Stadium, Los Angeles",
    image: "https://picsum.photos/seed/taylor/400/300",
    description: "Taylor Swift's The Eras Tour is a celebration of her music from all her different eras, from her debut album through 'Midnights'.",
    category: "Concert",
    price: {
      VIP: 399,
      CAT1: 299,
      CAT2: 199,
      CAT3: 99
    },
    availableSeats: [
      { area: "VIP", quantity: 20 },
      { area: "CAT1", quantity: 50 },
      { area: "CAT2", quantity: 100 },
      { area: "CAT3", quantity: 200 }
    ]
  },
  {
    id: 2,
    title: "NBA Finals 2023 - Game 7",
    date: "2023-06-18",
    time: "20:00",
    location: "Madison Square Garden, New York",
    image: "https://picsum.photos/seed/nba/400/300",
    description: "The decisive Game 7 of the NBA Finals. Don't miss the most important basketball game of the year!",
    category: "Sports",
    price: {
      VIP: 399,
      CAT1: 299,
      CAT2: 199,
      CAT3: 99
    },
    availableSeats: [
      { area: "VIP", quantity: 15 },
      { area: "CAT1", quantity: 45 },
      { area: "CAT2", quantity: 90 },
      { area: "CAT3", quantity: 180 }
    ]
  },
  {
    id: 3,
    title: "Adele - Las Vegas Residency",
    date: "2023-08-25",
    time: "21:00",
    location: "Caesars Palace, Las Vegas",
    image: "https://picsum.photos/seed/adele/400/300",
    description: "Experience Adele's stunning vocals and powerful performances in an intimate venue during her exclusive Las Vegas residency.",
    category: "Concert",
    price: {
      VIP: 399,
      CAT1: 299,
      CAT2: 199,
      CAT3: 99
    },
    availableSeats: [
      { area: "VIP", quantity: 10 },
      { area: "CAT1", quantity: 30 },
      { area: "CAT2", quantity: 60 },
      { area: "CAT3", quantity: 120 }
    ]
  },
  {
    id: 4,
    title: "Hamilton - Broadway",
    date: "2023-10-15",
    time: "19:00",
    location: "Richard Rodgers Theatre, New York",
    image: "https://picsum.photos/seed/hamilton/400/300",
    description: "Lin-Manuel Miranda's Pulitzer Prize-winning transformation of Ron Chernow's biography of founding father Alexander Hamilton.",
    category: "Theater",
    price: {
      VIP: 399,
      CAT1: 299,
      CAT2: 199,
      CAT3: 99
    },
    availableSeats: [
      { area: "VIP", quantity: 25 },
      { area: "CAT1", quantity: 50 },
      { area: "CAT2", quantity: 100 },
      { area: "CAT3", quantity: 200 }
    ]
  },
  {
    id: 5,
    title: "Coldplay - Music of the Spheres Tour",
    date: "2023-09-20",
    time: "20:30",
    location: "Wembley Stadium, London",
    image: "https://picsum.photos/seed/coldplay/400/300",
    description: "Coldplay's latest tour in support of their album 'Music of the Spheres', featuring their biggest hits and new material.",
    category: "Concert",
    price: {
      VIP: 399,
      CAT1: 299,
      CAT2: 199,
      CAT3: 99
    },
    availableSeats: [
      { area: "VIP", quantity: 20 },
      { area: "CAT1", quantity: 60 },
      { area: "CAT2", quantity: 120 },
      { area: "CAT3", quantity: 240 }
    ]
  },
  {
    id: 6,
    title: "Formula 1 Monaco Grand Prix",
    date: "2023-05-28",
    time: "14:00",
    location: "Circuit de Monaco, Monte Carlo",
    image: "https://picsum.photos/seed/f1monaco/400/300",
    description: "The jewel in Formula 1's crown. Experience the most glamorous race on the F1 calendar through the streets of Monte Carlo.",
    category: "Sports",
    price: {
      VIP: 399,
      CAT1: 299,
      CAT2: 199,
      CAT3: 99
    },
    availableSeats: [
      { area: "VIP", quantity: 10 },
      { area: "CAT1", quantity: 30 },
      { area: "CAT2", quantity: 60 },
      { area: "CAT3", quantity: 120 }
    ]
  }
];

/**
 * Get all events
 * @returns {Array} - Array of all events
 */
export const getAllEvents = () => {
  return events;
};

/**
 * Get an event by ID
 * @param {number} id - Event ID
 * @returns {Object|undefined} - Event object if found, undefined otherwise
 */
export const getEventById = (id) => {
  return events.find(event => event.id === Number(id));
};

/**
 * Get events by category
 * @param {string} category - Event category
 * @returns {Array} - Array of events in the specified category
 */
export const getEventsByCategory = (category) => {
  return events.filter(event => event.category === category);
};

/**
 * Search events by title
 * @param {string} query - Search query
 * @returns {Array} - Array of events matching the search query
 */
export const searchEvents = (query) => {
  const lowerCaseQuery = query.toLowerCase();
  return events.filter(event => 
    event.title.toLowerCase().includes(lowerCaseQuery) || 
    event.description.toLowerCase().includes(lowerCaseQuery)
  );
}; 