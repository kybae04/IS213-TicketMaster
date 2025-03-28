import React from "react";

const Button = ({ 
  children, 
  type = "button", 
  variant = "default", 
  size = "default",
  className = "", 
  disabled = false, 
  onClick, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50";
  
  const sizeStyles = {
    default: "px-6 py-3",
    sm: "px-4 py-2",
    lg: "px-8 py-4",
    icon: "p-0" // No padding for icon buttons
  };
  
  const variantStyles = {
    default: "bg-gray-700 text-white hover:bg-gray-600",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-purple-600 text-white hover:bg-purple-700",
    outline: "border border-gray-400 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    link: "bg-transparent underline-offset-4 hover:underline text-gray-900 dark:text-gray-100 px-2 py-1",
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.default} ${variantStyles[variant] || variantStyles.default} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button }; 