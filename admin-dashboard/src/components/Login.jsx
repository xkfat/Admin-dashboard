import React, { useState } from 'react';
import { API } from '../api';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.login(username, password);
      onLoginSuccess();
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[#3D8D7F]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-16">
          <div className="mb-4">
            <img 
              src="/logo.png" 
              alt="FindThem Logo" 
              className="w-56 h-56 mx-auto object-contain"
              onError={(e) => {
                console.log('Logo failed to load, using fallback');
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="w-56 h-56 mx-auto bg-white bg-opacity-20 rounded-full hidden items-center justify-center shadow-lg">
              <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-full text-center text-sm font-medium">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-white border-0 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:bg-gray-50 transition-all text-base shadow-lg"
              required
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white border-0 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:bg-gray-50 transition-all text-base shadow-lg"
              required
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1C4B43] border-2 border-white text-white py-4 rounded-full text-lg font-bold uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:bg-white hover:text-[#3D8D7F]"
            >
              {loading ? 'SIGNING IN...' : 'LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;