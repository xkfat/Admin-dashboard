// src/components/navbar.jsx
import { AlignJustify, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../Theme';
import NotificationIcon from './NotificationIcon'; 

export default function Navbar({ onLogout, onToggleSidebar }) {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogoutClick = () => {
    // Direct logout without confirmation
    onLogout();
  };

  return (
    <nav className="bg-findthem-bg dark:bg-gray-800 shadow-sm p-6 mb-8 w-full h-20 flex justify-between items-center transition-colors">
      <button 
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
      >
        <AlignJustify color='white' className="dark:text-gray-200" />
      </button>
      
      <h1 className="text-2xl font-semibold text-white dark:text-gray-100 text-center">
        Admin Dashboard
      </h1>

      <div className='flex gap-4 items-center'>
        {/* Notification Icon with Badge */}
        <NotificationIcon />
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-700 transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun color='white' className="h-5 w-5 dark:text-yellow-400" />
          ) : (
            <Moon color='white' className="h-5 w-5" />
          )}
        </button>
        
        <button
          onClick={handleLogoutClick}
          className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-700 transition-colors"
          title="Sign Out"
        >
          <LogOut color='white' className="dark:text-gray-200" />
        </button>
      </div>
    </nav>
  );
}