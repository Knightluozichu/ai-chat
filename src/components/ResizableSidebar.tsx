import React, { useState, useEffect, useCallback } from 'react';
import { ChatSidebar } from './ChatSidebar';

interface ResizableSidebarProps {
  minWidth?: number;
  maxWidth?: number;
}

export function ResizableSidebar({ minWidth = 280, maxWidth = 400 }: ResizableSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarWidth(window.innerWidth * 0.8);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (isMobile) {
    return (
      <div className="absolute inset-y-0 left-0 z-30 bg-white shadow-lg transition-transform transform">
        <ChatSidebar />
      </div>
    );
  }

  return (
    <>
      <div
        className="relative"
        style={{ width: `${sidebarWidth}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` }}
      >
        <ChatSidebar />
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize group"
          onMouseDown={startResizing}
        >
          <div className="absolute inset-y-0 -right-0.5 w-1 bg-gray-200 group-hover:bg-blue-500 transition-colors" />
        </div>
      </div>
    </>
  );
}