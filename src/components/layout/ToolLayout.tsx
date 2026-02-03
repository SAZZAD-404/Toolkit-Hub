"use client";

import React from "react";
import Sidebar from "./Sidebar";

interface ToolLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper for tool pages.
 * Ensures the sidebar is present and content is correctly padded.
 */
export default function ToolLayout({ children }: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <Sidebar />
      <main className="pl-[280px]">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
