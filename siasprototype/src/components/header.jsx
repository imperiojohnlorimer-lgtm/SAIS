import React, { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { ConfirmDialog } from './ui/confirmDialog';

export const Header = ({ activeTab, currentTime, onLogout, setActiveTab }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <header className="h-16 bg-white border-b-2 border-maroon-600 flex items-center justify-between px-8 shrink-0 shadow-md relative">
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400"></div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-maroon-600 to-maroon-700 bg-clip-text text-transparent capitalize">{activeTab}</h2>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="px-5 py-2 rounded-lg bg-gradient-to-r from-maroon-50 to-gold-50 border-2 border-maroon-200 shadow-sm">
            <p className="text-sm font-bold text-maroon-600">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            <p className="text-xs text-maroon-500 font-semibold">{currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="h-8 w-px bg-maroon-200"></div>
          <button 
            onClick={() => setActiveTab('profile')}
            className="text-maroon-600 hover:text-white hover:bg-maroon-600 p-2.5 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm"
            title="View Profile"
          >
            <User size={20} />
          </button>
          <button 
            onClick={handleLogoutClick}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-lg transition-all duration-200 hover:scale-110"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You'll need to log back in to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

