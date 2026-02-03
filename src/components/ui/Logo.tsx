"use client";

import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-4 group ${className}`}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] bg-black p-0.5 shadow-2xl transition-all duration-500 group-hover:shadow-violet-500/20 group-hover:scale-105">
        {/* Deep background depth */}
        <div className="absolute inset-0 bg-[#050508]" />
        
        {/* Dynamic mesh gradient */}
        <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,#4f46e5_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,#ec4899_0%,transparent_50%)]" />
        </div>
        
        {/* Neural Ring */}
        <div className="absolute inset-[3px] border border-white/[0.08] rounded-[11px] group-hover:border-violet-500/30 transition-colors duration-500" />
        
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 relative z-10"
        >
          {/* Abstract Orchid Petals / Neural Paths */}
          <motion.path
            d="M12 4C12 4 15 8 15 12C15 16 12 20 12 20"
            stroke="url(#orchid-gradient-1)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M12 4C12 4 9 8 9 12C9 16 12 20 12 20"
            stroke="url(#orchid-gradient-1)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.path
            d="M4 12C4 12 8 15 12 15C16 15 20 12 20 12"
            stroke="url(#orchid-gradient-2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.path
            d="M4 12C4 12 8 9 12 9C16 9 20 12 20 12"
            stroke="url(#orchid-gradient-2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.6 }}
          />
          
          {/* Central Core */}
          <circle 
            cx="12" 
            cy="12" 
            r="2" 
            fill="white" 
            className="shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
          />
          <motion.circle 
            cx="12" 
            cy="12" 
            r="4" 
            stroke="white" 
            strokeWidth="0.5" 
            strokeDasharray="2 2" 
            opacity="0.3"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          
          <defs>
            <linearGradient id="orchid-gradient-1" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
            <linearGradient id="orchid-gradient-2" x1="4" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F472B6" />
              <stop offset="1" stopColor="#FB7185" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Corner Accents */}
        <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-white/20 rounded-full" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-2xl font-black tracking-[-0.05em] text-white flex items-center gap-1.5">
          Toolkit
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-black">Hub</span>
        </span>
      </div>
    </div>
  );
};

export default Logo;