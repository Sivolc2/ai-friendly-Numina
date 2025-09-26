import React, { useState } from 'react';

// Simple demo components
const WelcomeScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="text-center text-white">
      <h1 className="text-6xl font-bold mb-4">AI-Friendly Numina</h1>
      <p className="text-xl mb-8">Social networking and community platform</p>
      <div className="space-x-4">
        <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Get Started
        </button>
        <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  </div>
);

const DirectoryView: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search profiles..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-center mb-2">Profile {i}</h3>
            <p className="text-gray-600 text-center mb-4">Sample description for profile {i}</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </main>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'welcome' | 'directory'>('welcome');

  const handleGetStarted = () => {
    setCurrentView('directory');
  };

  if (currentView === 'welcome') {
    return (
      <div onClick={handleGetStarted}>
        <WelcomeScreen />
      </div>
    );
  }

  return <DirectoryView />;
};

export default App;