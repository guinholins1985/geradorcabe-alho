import React, { forwardRef } from 'react';
import { ImageIcon } from './icons';

interface CanvasAreaProps {
  headerImage: string | null;
  activityImage: string | null;
  headerHeight: number;
}

export const CanvasArea = forwardRef<HTMLDivElement, CanvasAreaProps>(({ headerImage, activityImage, headerHeight }, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-white relative shadow-inner overflow-hidden" 
      style={{ 
        aspectRatio: '210 / 297', // A4 aspect ratio
        width: '100%', 
        maxWidth: '80vh', // Limit max width to fit screen
      }}
    >
      {activityImage ? (
        <>
          <img src={activityImage} alt="Atividade" className="absolute inset-0 w-full h-full object-contain" />
          {headerImage && (
            <div 
              className="header-area-indicator absolute top-0 left-0 w-full bg-blue-500 bg-opacity-10 border-b-2 border-dashed border-blue-400 pointer-events-none"
              style={{ height: `${headerHeight}%` }}
            />
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-8 text-center">
            <ImageIcon />
            <p className="mt-4 font-semibold">A pré-visualização da atividade aparecerá aqui.</p>
            <p className="text-sm">Use o painel à esquerda para carregar sua atividade e cabeçalho.</p>
        </div>
      )}
    </div>
  );
});