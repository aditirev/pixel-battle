import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 text-lg text-black dark:text-white bg-transparent border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus:outline-none w-full uppercase tracking-wider transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;