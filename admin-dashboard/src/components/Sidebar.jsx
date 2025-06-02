import { useState } from "react"
import { Link, NavLink } from "react-router-dom";
import { Bot, Files, Map, Bell, Users, House} from 'lucide-react';

export default function Sidebar({ isSidebarOpen }) {
  return (
    <aside className={`h-full bg-findthem-light ${isSidebarOpen ? "w-80" : "w-24"} overflow-hidden transition-all duration-300`}>
      
      {isSidebarOpen && (
        <div className="flex p-8 mt-6 gap-4">
          <div className="border rounded-md p-2 bg-findthem-button">
            <img src="hat.png" alt="Logo" />
          </div>
          <p className="text-3xl text-findthem-button font-semibold relative top-1">
            FindThem
          </p>
        </div>
      )}

      <div className={`${isSidebarOpen ? "p-4 mt-0" : "p-p-2 mt-12"}`}>
        {/* Navigation items */}
        <div className="space-y-4">
          
          {/* Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) => 
              `flex gap-4 rounded-xl transition-all duration-200 ${
                isSidebarOpen 
                  ? "p-6 py-4" 
                  : "p-3 justify-center"
              } ${isActive ? "bg-findthem-bg" : "hover:bg-gray-100"}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="rounded-md p-2 bg-findthem-button">
                  <House size={24} color="white" />  
                </div>
                {isSidebarOpen && (
                  <span className={`text-xl font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button"
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
                  ? "p-6 py-4" 
                  : "p-3 justify-center"
              } ${isActive ? "bg-findthem-bg" : "hover:bg-gray-100"}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border rounded-md p-2 bg-findthem-button">
                  <Users size={24} color="white" />  
                </div>
                {isSidebarOpen && (
                  <span className={`text-xl font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button"
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
                  ? "p-6 py-4" 
                  : "p-3 justify-center"
              } ${isActive ? "bg-findthem-bg" : "hover:bg-gray-100"}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border rounded-md p-2 bg-findthem-button">
                    <Files size={24} color="white" />            

                </div>
                {isSidebarOpen && (
                  <span className={`text-xl font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button"
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
                  ? "p-6 py-4" 
                  : "p-3 justify-center"
              } ${isActive ? "bg-findthem-bg" : "hover:bg-gray-100"}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="border rounded-md p-2 bg-findthem-button">
                  <Map size={24} color="white" /> 
                </div>
                {isSidebarOpen && (
                  <span className={`text-xl font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button"
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
                  ? "p-6 py-4" 
                  : "p-3 justify-center"
              } ${isActive ? "bg-findthem-bg" : "hover:bg-gray-100"}`
            }
          >
            {({ isActive }) => (
              <>
           <div className="border rounded-md p-2 bg-findthem-button flex items-center justify-center">
  <Bot size={24} color="white" />            
                </div>
                {isSidebarOpen && (
                  <span className={`text-xl font-semibold self-center ${
                    isActive ? "text-white" : "text-findthem-button"
                  }`}>
AI Matches                  </span>
                )}
              </>
            )}
          </NavLink>

         

        </div>
      </div>
    </aside>
  )
}