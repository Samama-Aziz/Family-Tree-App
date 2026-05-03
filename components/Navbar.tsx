"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthContext";

const userLinks = [
  { href: "/", label: "Home" },
  { href: "/persons", label: "Persons" },
  { href: "/families", label: "Families" },
  { href: "/family-tree", label: "Family Tree" },
];

const adminLinks = [
  { href: "/", label: "Home" },
  { href: "/admin", label: "Admin" },
  { href: "/persons", label: "Persons" },
  { href: "/families", label: "Families" },
  { href: "/family-tree", label: "Family Tree" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const links = user?.role === "admin" ? adminLinks : userLinks;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center group" onClick={() => setMenuOpen(false)}>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              FamilyTree
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Auth buttons */}
            {!loading && (
              <div className="ml-3 pl-3 border-l border-slate-200 flex items-center gap-2">
                {user ? (
                  <>
                    <span className="text-sm text-slate-500 font-medium hidden lg:block">
                      {user.name}
                      {user.role === "admin" && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">Admin</span>
                      )}
                    </span>
                    <button
                      onClick={() => void logout()}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
                      Login
                    </Link>
                    <Link href="/register" className="btn-primary !py-2 !text-sm">
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors gap-[5px]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
          >
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-slate-600 rounded-full transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-200 bg-white shadow-lg ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 py-3 space-y-1 max-w-7xl mx-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {!loading && (
            <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-slate-500">
                    Signed in as <span className="font-semibold text-slate-700">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">Admin</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); void logout(); }}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 transition-all font-bold"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 border border-slate-100">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary !p-0 h-full">
                    Register
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
