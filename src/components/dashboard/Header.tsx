import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <div className="mb-6 sm:mb-10">
      {/* Dashboard Active Badge */}
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-3 sm:mb-4"
        style={{
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderColor: 'rgba(124, 58, 237, 0.2)',
          color: 'rgb(167, 139, 250)',
        }}
      >
        <span 
          className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" 
          style={{ backgroundColor: 'rgb(167, 139, 250)' }}
        />
        Dashboard Active
      </div>

      {/* Welcome Heading */}
      <h1 
        className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-2 leading-tight tracking-tight"
        style={{
          fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
          fontWeight: 600,
          color: 'oklch(1 0 0)',
        }}
      >
        Welcome to <span 
          className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]"
        >
          ToolkitHub
        </span>
      </h1>

      {/* Introductory Subtext */}
      <p 
        className="text-zinc-400 text-base sm:text-lg max-w-2xl"
        style={{
          color: 'rgb(161, 161, 170)',
          fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
          fontSize: '18px',
          lineHeight: '1.75rem'
        }}
      >
        Your all-in-one AI-powered productivity suite
      </p>
    </div>
  );
};

export default DashboardHeader;