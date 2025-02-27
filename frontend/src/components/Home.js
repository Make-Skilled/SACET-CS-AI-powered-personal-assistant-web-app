import React from 'react';
import VoiceNavigation from './VoiceNavigation';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Voice Navigation Section - Moved to top */}
        <div className="pt-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-8 sm:px-6 lg:px-8">
              <VoiceNavigation />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="py-12">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Voice-Powered</span>
              <span className="block text-blue-600">Web Navigation</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Navigate the web effortlessly using your voice. Just speak your command and let our AI assistant do the rest.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="py-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div 
              onClick={() => navigate('/dashboard')} 
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-medium text-gray-900">View History</h3>
              <p className="mt-2 text-sm text-gray-500">
                Access your past voice commands and reuse them with a single click.
              </p>
            </div>
            <div 
              onClick={() => navigate('/features')} 
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-medium text-gray-900">Features</h3>
              <p className="mt-2 text-sm text-gray-500">
                Discover all the powerful features our voice navigation system offers.
              </p>
            </div>
            <div 
              onClick={() => navigate('/about')} 
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-medium text-gray-900">About</h3>
              <p className="mt-2 text-sm text-gray-500">
                Learn more about our mission and the technology behind our voice assistant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
