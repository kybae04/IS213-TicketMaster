# Ticketmaster 2.0

A modern web application for event discovery and ticket purchasing, built with React and Tailwind CSS.

## Features

- User authentication and account management
- Event discovery and searching
- Ticket purchasing with seat selection
- Dark mode support
- Responsive design for all devices

## Tech Stack

- React.js (Create React App)
- Tailwind CSS for styling
- Supabase for authentication and database
- ShadCN UI components

## Project Structure

```
/src
  /components          # Reusable UI components
  /pages               # Page components
  /services            # API and service functions
  /utils               # Utility functions and helpers
  /hooks               # Custom React hooks
  supabaseClient.js    # Supabase client configuration
  App.js               # Main App component
  index.js             # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/ticketmaster.git
cd ticketmaster
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server:
```
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Development

### Adding New Pages

Place new page components in the `/src/pages` directory. Each page should be a self-contained component that can be imported into App.js or a router.

### Styling with Tailwind CSS

This project uses Tailwind CSS for styling. The configuration is in `tailwind.config.js`. Dark mode is enabled using the "class" strategy, which means you need to add the "dark" class to the HTML element to enable dark mode.

### Authentication with Supabase

Authentication functions are available in `/src/services/authService.js`. These functions handle user registration, login, logout, and session management using Supabase.

## Deployment

1. Build the production-ready application:
```
npm run build
```

2. Deploy the contents of the `/build` directory to your hosting provider.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
