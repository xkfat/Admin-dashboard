// src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './components/Home';
import Cases from './components/Cases';
import Reports from './components/Reports';
import AddCase from './components/AddCase';
import Notification from './components/Notifications';
import CaseDetail from './components/CaseDetail';
import Map from './components/Map';

import AIMatches from './components/AIMatches';






function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Clear all stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    
    // Update state to redirect to login
    setIsLoggedIn(false);
    
    // Optional: Show a logout success message
    console.log('Successfully logged out');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Router>
        {!isLoggedIn ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard onLogout={handleLogout} />}>
              <Route index element={<Home />} />
              <Route path='home' element={<Home />} />
              <Route path='cases' element={<Cases />} />
          <Route path='/cases/:id' element={<CaseDetail/>}/>

              <Route path='reports' element={<Reports />} />
              <Route path='/add-case' element={<AddCase />} />
              <Route path='/notifications' element={<Notification />} />
              <Route path='/AIMatches' element={<AIMatches />} />
              <Route path='/map' element={<Map />} />
            </Route>
          </Routes>
        )}
      </Router>
    </div>
  );
}

export default App;

