import React from "react";

const Card = ({ 
  children, 
  className = "", 
  ...props 
}) => {
  return (
    <div
      className={`rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card }; 