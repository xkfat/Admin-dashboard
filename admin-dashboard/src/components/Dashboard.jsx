import React from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Home from './Home';
const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
   <div className="h-screen">
  <div className="fixed top-0 left-0 w-full z-50">
    <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
  </div>

  <div className="flex pt-16 h-full">
    {/* Sidebar Fixed */}
    <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-40">
      <Sidebar isSidebarOpen={isSidebarOpen} />
    </div>

    {/* Main content area */}
    <div
      className={`${isSidebarOpen ? 'ml-80' : 'ml-20'} p-6 transition-all duration-300 w-full overflow-y-auto`}
    >
    <Outlet /> {/* Ton contenu ici */}
    </div>
  </div>
</div>

  );
};

export default Dashboard;