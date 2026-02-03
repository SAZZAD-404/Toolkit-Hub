'use client';

import Sidebar from "@/components/dashboard/Sidebar";
import AuthGate from "@/components/auth/AuthGate";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AuthGate>
      <div className="relative flex min-h-screen">
        <div 
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(138, 43, 226, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(ellipse 80% 80% at 0% 100%, rgba(138, 43, 226, 0.08) 0%, transparent 50%), linear-gradient(180deg, #0a0a0f 0%, #000000 100%)',
          }}
        />
        
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute top-[30%] -right-[15%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute -bottom-[10%] left-[30%] w-[40%] h-[40%] rounded-full blur-[80px] opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(138, 43, 226, 0.3) 0%, transparent 70%)' }}
          />
        </div>
        
        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

        <main className="relative z-10 flex-1 lg:ml-[280px] ml-0 p-4 lg:p-8 pt-6 transition-all duration-300">
          <div className="flex items-center mb-6 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              className="hover:bg-purple-500/10"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {children}
        </main>
      </div>
    </AuthGate>
  );
}
