import React from 'react';

const RouteTransition = ({ children }) => {
  // Simply pass through the children with no loading overlay
  return <>{children}</>;
};

export default RouteTransition; 