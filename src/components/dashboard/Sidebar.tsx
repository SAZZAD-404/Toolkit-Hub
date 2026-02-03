"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Film,
  WandSparkles,
  Volume2,
  FileVideo,
  Type,
  ScanText,
  Mail,
  Link as LinkIcon,
  Code2,
  User,
  Sparkles,
  Cog,
  CreditCard,
  Shield,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const Sidebar = ({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfigured) return;
        let token: string | null = null;
        for (let i = 0; i < 20; i++) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token ?? null;
          if (token) break;
          await new Promise((r) => setTimeout(r, 250));
        }
        if (!token) return;

        const res = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setIsAdmin(!!json.isAdmin);
      } catch {
        // ignore
      }
    })();
  }, []);

  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => 
      prev.includes(key) 
        ? []
        : [key]
    );
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    href, 
    isActive 
  }: { 
    icon: React.ElementType; 
    label: string; 
    href: string; 
    isActive?: boolean;
  }) => (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 transition-all duration-300 group ${
        isActive
          ? "text-white bg-gradient-to-r from-purple-600/30 to-cyan-600/20 border border-purple-500/40"
          : "text-muted-foreground hover:text-foreground hover:bg-purple-500/10"
      }`}
      title={isCollapsed ? label : undefined}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-400 to-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(138,43,226,0.6)]" />
      )}
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-purple-400 drop-shadow-[0_0_6px_rgba(138,43,226,0.8)]" : "text-muted-foreground group-hover:text-purple-400"}`} />
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );

  const SubNavItem = ({ 
    icon: Icon, 
    label, 
    href 
  }: { 
    icon: React.ElementType; 
    label: string; 
    href: string;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2 ${isCollapsed ? 'ml-2' : 'ml-6'} mr-2 rounded-lg transition-all duration-300 text-sm ${
          isActive 
            ? "text-white bg-purple-500/20 border border-purple-500/30" 
            : "text-muted-foreground hover:text-foreground hover:bg-purple-500/10"
        }`}
        title={isCollapsed ? label : undefined}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-400' : ''}`} />
        {!isCollapsed && <span>{label}</span>}
      </Link>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    !isCollapsed ? (
      <div className="px-4 py-3">
        <h3 className="text-xs font-medium text-purple-400/60 uppercase tracking-wider">
          {title}
        </h3>
      </div>
    ) : (
      <div className="h-4 mx-4 my-2 border-t border-purple-500/20" />
    )
  );

  const DropdownSection = ({
    icon: Icon,
    label,
    dropdownKey,
    children
  }: {
    icon: React.ElementType;
    label: string;
    dropdownKey: string;
    children: React.ReactNode;
  }) => {
    const isOpen = openDropdowns.includes(dropdownKey);
    
    return (
      <div className="mb-1">
        <button
          onClick={() => toggleDropdown(dropdownKey)}
          className="w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-all duration-300 group"
          style={{ width: 'calc(100% - 16px)' }}
          title={isCollapsed ? label : undefined}
        >
          <Icon className="w-5 h-5 flex-shrink-0 text-muted-foreground group-hover:text-purple-400" />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium flex-1 text-left">{label}</span>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </>
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="mt-1 space-y-0.5">
            {children}
          </div>
        )}
      </div>
    );
  };

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-[280px]';
  const sidebarMargin = isCollapsed ? '72px' : '280px';

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => onMobileClose?.()}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={
          `fixed left-0 top-0 z-50 h-screen ${sidebarWidth} flex flex-col transition-all duration-300 ease-in-out ` +
          (mobileOpen ? "translate-x-0" : "-translate-x-full") +
          " lg:translate-x-0"
        }
        style={{
          background: 'linear-gradient(180deg, rgba(10, 10, 20, 0.98) 0%, rgba(5, 5, 15, 0.99) 100%)',
          borderRight: '1px solid rgba(138, 43, 226, 0.2)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 43, 226, 0.05)'
        }}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-6 border-b border-purple-500/20`}>
          <Link href="/" className="flex items-center gap-3">
            {!isCollapsed && <Logo className="scale-75" />}
            {isCollapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-all"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className="mb-2">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              href="/dashboard"
              isActive={pathname === "/dashboard"}
            />
          </div>

          <SectionHeader title="Tools" />
          
          <DropdownSection
            icon={Sparkles}
            label="Content Tools"
            dropdownKey="content-tools"
          >
            <SubNavItem icon={ScanText} label="Text Summarizer" href="/dashboard/tools/text-summarizer" />
            <SubNavItem icon={LinkIcon} label="URL Shortener" href="/dashboard/tools/url-shortener" />
          </DropdownSection>

          <DropdownSection
            icon={Cog}
            label="AI Power Tools"
            dropdownKey="ai-power-tools"
          >
            <SubNavItem icon={ImageIcon} label="Image Creator" href="/dashboard/tools/image-creator" />
            <SubNavItem icon={Film} label="Faceless Video" href="/dashboard/tools/faceless-video" />
            <SubNavItem icon={WandSparkles} label="Prompt Redesigner" href="/dashboard/tools/prompt-redesigner" />
            <SubNavItem icon={FileVideo} label="Text to Video" href="/dashboard/tools/text-to-video" />
            <SubNavItem icon={Type} label="Video to Text" href="/dashboard/tools/video-to-text" />
            <SubNavItem icon={Volume2} label="Text to Speech" href="/dashboard/tools/text-to-speech" />
          </DropdownSection>

          <DropdownSection
            icon={Code2}
            label="Developer Kit"
            dropdownKey="developer-kit"
          >
            <SubNavItem icon={Mail} label="Temp Email" href="/dashboard/tools/temp-email" />
          </DropdownSection>

          <div className="mt-6">
            <SectionHeader title="Account" />
            <div className="space-y-0.5">
              <NavItem
                icon={User}
                label="Profile"
                href="/dashboard/profile"
                isActive={pathname === "/dashboard/profile"}
              />
              <NavItem
                icon={CreditCard}
                label="Credits"
                href="/dashboard/credits"
                isActive={pathname === "/dashboard/credits"}
              />
              {isAdmin && (
                <NavItem
                  icon={Shield}
                  label="Admin"
                  href="/dashboard/admin"
                  isActive={pathname.startsWith('/dashboard/admin')}
                />
              )}
              <NavItem
                icon={HelpCircle}
                label="Help Center"
                href="/dashboard/help"
                isActive={pathname === "/dashboard/help"}
              />
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .lg\\:ml-\\[280px\\] {
            margin-left: ${sidebarMargin} !important;
          }
          .lg\\:pl-\\[280px\\] {
            padding-left: ${sidebarMargin} !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
