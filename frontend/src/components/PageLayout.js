import React from 'react';

/**
 * PageLayout component that provides consistent padding and centering for all pages
 * This ensures all pages have the same spacing and alignment
 */
const PageLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16">
      <div className="max-w-7xl w-full mx-auto px-8">
        {children}
      </div>
    </div>
  );
};

export default PageLayout; 