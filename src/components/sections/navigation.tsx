"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-black/60 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo className="scale-75" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#features"
            className="px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white rounded-lg hover:bg-white/5"
          >
            Features
          </a>
          <a
            href="#tools"
            className="px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white rounded-lg hover:bg-white/5"
          >
            Tools
          </a>
          <a
            href="#pricing"
            className="px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white rounded-lg hover:bg-white/5"
          >
            Pricing
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <button className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
              Login
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-white/60 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#0A0A0A] border-b border-white/10 p-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4 mb-6">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 hover:text-white font-medium text-lg"
            >
              Features
            </a>
            <a
              href="#tools"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 hover:text-white font-medium text-lg"
            >
              Tools
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 hover:text-white font-medium text-lg"
            >
              Pricing
            </a>
          </nav>
          <div className="flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <button className="w-full py-3 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-colors">
                Login
              </button>
            </Link>
            <Link href="/dashboard" className="w-full">
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/20">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;