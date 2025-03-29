import React from "react";

const Badge = ({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none";
  
  const variantStyles = {
    default: "border-transparent bg-gray-700 text-white hover:bg-gray-600",
    primary: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-purple-600 text-white hover:bg-purple-700",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100",
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.default} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export { Badge }; 