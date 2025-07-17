import { useState } from "react"
import { Link, NavLink } from "react-router-dom";
import { Bot, Files, Map, Bell, Users, House} from 'lucide-react';

export default function Sidebar({ isSidebarOpen }) {
  return (
    <aside className={`h-full bg-findthem-light dark:bg-gray-800 border-r dark:border-gray-700 ${isSidebarOpen ? "w-64" : "w-20"} overflow-hidden transition-all duration-300`}>
      
      {isSidebarOpen && (
        <div className="flex p-6 mt-6 gap-4">
          <div className="border dark:border-gray-600 rounded-md p-2 bg-findthem-button dark:bg-findthem-teal">
            <img src="hat.png" alt="Logo" />
          </div>
          <p className="text-2xl text-findthem-button dark:text-findthem-light font-semibold relative top-1">
            FindThem
          </p>
        </div>
      )}

      <div className={`${isSidebarOpen ? "p-4 mt-0" : "p-3 mt-12"}`}>
        {/* Navigation items */}
        <div className="space-y-4">
          
          {/* Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) => 
              `flex gap-4 rounded-xl transition-all duration-200 ${
                isSidebarOpen 
                  ? "p-5 py-3" 
                  : "p-3 justify-center mx-auto w-14 h-14 items-center"
              } ${isActive 
                ? "bg-findthem-bg dark:bg-findthem-teal" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="rounded-md p-2 bg-findthem-button dark:bg-findthem-darkGreen flex items-center justify-center">
                  <House size={20} color="white" />  
                </div>
                {isSidebarOpen && (
                  <span className={`text-lg font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button dark:text-findthem-light"
                  }`}>
                    Dashboard
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* Cases */}
          <NavLink
            to="/cases"
            className={({ isActive }) => 
              `flex gap-4 rounded-xl transition-all duration-200 ${
                isSidebarOpen 
                  ? "p-5 py-3" 
                  : "p-3 justify-center mx-auto w-14 h-14 items-center"
              } ${isActive 
                ? "bg-findthem-bg dark:bg-findthem-teal" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border dark:border-gray-600 rounded-md p-2 bg-findthem-button dark:bg-findthem-darkGreen flex items-center justify-center">
                  <Users size={20} color="white" />  
                </div>
                {isSidebarOpen && (
                  <span className={`text-lg font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button dark:text-findthem-light"
                  }`}>
                    Cases
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* Reports */}
          <NavLink
            to="/reports"
            className={({ isActive }) => 
              `flex gap-4 rounded-xl transition-all duration-200 ${
                isSidebarOpen 
                  ? "p-5 py-3" 
                  : "p-3 justify-center mx-auto w-14 h-14 items-center"
              } ${isActive 
                ? "bg-findthem-bg dark:bg-findthem-teal" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border dark:border-gray-600 rounded-md p-2 bg-findthem-button dark:bg-findthem-darkGreen flex items-center justify-center">
                    <Files size={20} color="white" />            
                </div>
                {isSidebarOpen && (
                  <span className={`text-lg font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button dark:text-findthem-light"
                  }`}>
                    Reports
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* Map view */}
          <NavLink
            to="/map"
            className={({ isActive }) => 
              `flex gap-4 rounded-xl transition-all duration-200 ${
                isSidebarOpen 
                  ? "p-5 py-3" 
                  : "p-3 justify-center mx-auto w-14 h-14 items-center"
              } ${isActive 
                ? "bg-findthem-bg dark:bg-findthem-teal" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border dark:border-gray-600 rounded-md p-2 bg-findthem-button dark:bg-findthem-darkGreen flex items-center justify-center">
                  <Map size={20} color="white" /> 
                </div>
                {isSidebarOpen && (
                  <span className={`text-lg font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button dark:text-findthem-light"
                  }`}>
                    Map view
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* AI match view */}
          <NavLink
            to="/AIMatches"
            className={({ isActive }) => 
              `flex gap-4 rounded-xl transition-all duration-200 ${
                isSidebarOpen 
                  ? "p-5 py-3" 
                  : "p-3 justify-center mx-auto w-14 h-14 items-center"
              } ${isActive 
                ? "bg-findthem-bg dark:bg-findthem-teal" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border dark:border-gray-600 rounded-md p-2 bg-findthem-button dark:bg-findthem-darkGreen flex items-center justify-center">
                  <Bot size={20} color="white" />            
                </div>
                {isSidebarOpen && (
                  <span className={`text-lg font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button dark:text-findthem-light"
                  }`}>
                    AI Matches
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>
      </div>
    </aside>
  )
}