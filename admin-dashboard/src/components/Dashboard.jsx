// src/components/Dashboard.jsx
import React from 'react';
import Navbar from './navbar';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

const Dashboard = ({ onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="h-screen">
            <div className="fixed top-0 left-0 w-full z-50">
                <Navbar 
                    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} 
                    onLogout={onLogout}
                />
            </div>

            <div className="flex pt-16 h-full">
                {/* Sidebar Fixed */}
                <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] z-40">
                    <Sidebar isSidebarOpen={isSidebarOpen} />
                </div>

                {/* Main content area - Updated to match new sidebar widths */}
                <div
                    className={`${
                        isSidebarOpen ? 'ml-64' : 'ml-20'
                    } p-6 transition-all duration-300 w-full overflow-y-auto bg-gray-50`}
                >
                    <div className={`max-w-none transition-all duration-300 ${
                        isSidebarOpen ? 'px-4' : 'px-2'
                    }`}>
                        <Outlet /> {/* Your page content here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;