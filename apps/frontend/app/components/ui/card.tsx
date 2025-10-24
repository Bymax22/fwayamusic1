// app/components/ui/card.tsx
import React from "react";

// Card component
export const Card = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {children}
    </div>
  );
};

// CardContent component
export const CardContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4">{children}</div>;
};
