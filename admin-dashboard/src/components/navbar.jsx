import { AlignJustify, Bell, Moon, LogOut } from 'lucide-react';
import NotificationIcon from './NotificationIcon'; 

export default function Navbar({ onLogout, onToggleSidebar }) {
  const handleLogoutClick = () => {
    // Direct logout without confirmation
    onLogout();
  };

  return (
    <nav className="bg-findthem-bg shadow-sm p-6 mb-8 w-full h-20 flex justify-between items-center">
      <button onClick={onToggleSidebar}>
        <AlignJustify color='white' />
      </button>
      
      <h1 className="text-2xl font-semibold text-white text-center">Admin Dashboard</h1>

       <div className='flex gap-4 items-center'>
        {/* Notification Icon with Badge */}
        <NotificationIcon />
        
        <button className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">
          <Moon color='white' />
        </button>
      
       
        
        <button
          onClick={handleLogoutClick}
          className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
          title="Sign Out"
        >
          <LogOut color='white' />
        </button>
      </div>
    </nav>
  );
}