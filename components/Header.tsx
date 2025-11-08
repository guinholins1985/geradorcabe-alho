
import React from 'react';
import { LogoIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <LogoIcon />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 ml-3">
          Gerador de Cabeçalho Pedagógico
        </h1>
      </div>
    </header>
  );
};
