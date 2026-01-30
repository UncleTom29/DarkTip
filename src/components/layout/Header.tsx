"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Shield, Zap, Users, LayoutDashboard, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalWalletButton } from "@/components/wallet/UniversalWalletButton";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/grants", label: "Grants", icon: Zap },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "https://registry.scalar.com/@radr/apis/shadowpay-api", label: "Docs", icon: BookOpen, external: true },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text">Dark</span>
              <span className="text-white">Tip</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isExternal = 'external' in link && link.external;

              const linkContent = (
                <>
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {isActive && !isExternal && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg bg-purple-500/20 border border-purple-500/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </>
              );

              const linkClassName = cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive && !isExternal
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              );

              if (isExternal) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClassName}
                  >
                    {linkContent}
                  </a>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClassName}
                >
                  {linkContent}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <UniversalWalletButton className="hidden sm:flex" />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-800 py-4"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                const isExternal = 'external' in link && link.external;

                const mobileClassName = cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive && !isExternal
                    ? "text-white bg-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                );

                if (isExternal) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileClassName}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileClassName}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 px-4">
              <UniversalWalletButton className="w-full" />
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}
