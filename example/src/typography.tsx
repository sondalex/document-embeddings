import React from "react";

interface H1Props {
  children: string;
}

interface H2Props {
    children: string;
}

const H1: React.FC<H1Props> = ({ children }) => {
  return (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl py-10">
      {children}
    </h1>
  );
};

const H2: React.FC<H2Props> = ({children}) => {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
    {children} 
    </h2>
  )
}
export { H1, H2 };
