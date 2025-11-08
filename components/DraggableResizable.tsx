import React, { useState, useCallback, useEffect, useRef } from 'react';

interface DraggableResizableProps {
  children: React.ReactNode;
  containerHeightPercent: number;
}

export const DraggableResizable: React.FC<DraggableResizableProps> = ({ children, containerHeightPercent }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 300, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const node = nodeRef.current;
    if (!node) return;
    const parentRect = node.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const containerHeight = parentRect.height * (containerHeightPercent / 100);

    if (isDragging) {
      let newX = e.clientX - dragStartRef.current.x;
      let newY = e.clientY - dragStartRef.current.y;
      
      // Boundary checks
      newX = Math.max(0, Math.min(newX, parentRect.width - size.width));
      newY = Math.max(0, Math.min(newY, containerHeight - size.height));

      setPosition({ x: newX, y: newY });
    }
    
    if (isResizing) {
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;
      
      let newWidth = resizeStartRef.current.width + dx;
      let newHeight = resizeStartRef.current.height + dy;
      
      // Boundary and minimum size checks
      newWidth = Math.max(50, Math.min(newWidth, parentRect.width - position.x));
      newHeight = Math.max(30, Math.min(newHeight, containerHeight - position.y));

      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, position.x, position.y, size.width, size.height, containerHeightPercent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={nodeRef}
      onMouseDown={handleDragMouseDown}
      className="draggable-resizable-box absolute border-2 border-dashed border-blue-500 cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {children}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize"
      ></div>
    </div>
  );
};