'use client';

import React, { useEffect } from 'react';

export default function DashboardSettingsPage() {
  useEffect(() => {
    document.title = 'Settings - ToolkitHub';
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          This page was added to fix the broken sidebar route. You can move settings into
          <span className="text-zinc-300"> Profile &gt; Settings</span> later if you prefer.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Coming soon</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-zinc-400 space-y-1">
          <li>Theme preferences</li>
          <li>API provider defaults (OpenRouter / GitHub Models / Mistral)</li>
          <li>Usage limits & alerts</li>
        </ul>
      </div>
    </div>
  );
}
