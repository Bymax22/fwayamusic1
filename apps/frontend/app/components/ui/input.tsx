// app/components/ui/input.tsx
import React from "react";

// Input component
export const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-3 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-purple/75 transition-all"
    />
  );
};




