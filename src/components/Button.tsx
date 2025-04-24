import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-4 py-3 rounded-lg text-xl transition-colors duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;