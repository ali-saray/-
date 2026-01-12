import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Activity, PlusCircle, Building2, Moon, Sun, Menu, X, QrCode } from "lucide-react";
import { ShareAppModal } from "./ShareAppModal";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    // Initialize dark mode from system or local storage
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 font-bold"
      : "text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-navy-800";

  return (
    <>
    <nav className="bg-white dark:bg-navy-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-navy-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-red-600 p-2 rounded-lg text-white shadow-md shadow-red-600/20">
                <Heart size={24} fill="currentColor" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                نبض
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive("/")}`}
            >
              <PlusCircle size={18} />
              <span>أفراد</span>
            </Link>
            <Link
              to="/hospital"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive("/hospital")}`}
            >
              <Building2 size={18} />
              <span>مستشفيات</span>
            </Link>
            <div className="w-px h-6 bg-gray-200 dark:bg-navy-800 mx-1"></div>
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive("/admin")}`}
            >
              <Activity size={18} />
              <span>الإدارة</span>
            </Link>
            
            <button 
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
              title="QR Code"
            >
              <QrCode size={20} />
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 mr-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300"
            >
              <QrCode size={18} />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800 px-4 py-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isActive("/")}`}
          >
            <PlusCircle size={20} />
            <span>طلب تبرع (أفراد)</span>
          </Link>
          <Link
            to="/hospital"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isActive("/hospital")}`}
          >
            <Building2 size={20} />
            <span>طلب مستشفى (نقص)</span>
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${isActive("/admin")}`}
          >
            <Activity size={20} />
            <span>لوحة التحكم</span>
          </Link>
        </div>
      )}
    </nav>
    <ShareAppModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </>
  );
};