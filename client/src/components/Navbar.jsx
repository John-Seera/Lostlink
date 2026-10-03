import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Search,
  PlusCircle,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  FileQuestion,
  Bell
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                LostLink <span className="text-blue-500 font-extrabold">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MERN MVP
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/browse"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/browse')
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Browse Items
            </Link>

            <Link
              to="/ai-chat"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive('/ai-chat')
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 border border-purple-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              AI Assistant
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/report-lost"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/report-lost')
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'text-slate-300 hover:text-rose-400 hover:bg-slate-800/60'
                  }`}
                >
                  <FileQuestion className="w-4 h-4" />
                  Report Lost
                </Link>

                <Link
                  to="/report-found"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/report-found')
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Report Found
                </Link>

                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard')
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/admin')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Auth controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]">
                    {user?.name?.split(' ')[0]}
                  </span>
                  {user?.role === 'admin' && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                      <p className="text-xs text-blue-400 truncate">{user?.organization}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Link>

                    <Link
                      to="/my-reports"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <FileQuestion className="w-4 h-4 text-slate-400" />
                      My Reported Items
                    </Link>

                    <Link
                      to="/my-claims"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      My Claims
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile Settings
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-400 hover:bg-amber-950/40"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        Admin Portal
                      </Link>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-600/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Browse Items
          </Link>
          <Link
            to="/ai-chat"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-purple-400 hover:bg-slate-800"
          >
            AI Assistant
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/report-lost"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-rose-400 hover:bg-slate-800"
              >
                Report Lost Item
              </Link>
              <Link
                to="/report-found"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-400 hover:bg-slate-800"
              >
                Report Found Item
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <Link
                to="/my-reports"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                My Reports
              </Link>
              <Link
                to="/my-claims"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                My Claims
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Profile Settings
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-slate-800"
                >
                  Admin Portal
                </Link>
              )}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  Sign Out ({user?.name})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-white"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
