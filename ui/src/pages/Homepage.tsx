import React from 'react';

export const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Keep Track</h1>
          <div className="space-x-4">
            <button className="text-gray-600 hover:text-gray-900">Features</button>
            <button className="text-gray-600 hover:text-gray-900">Pricing</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Track Everything with Ease
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Keep Track helps you manage your tasks, projects, and goals all in one place.
        </p>
        <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-indigo-700">
          Get Started Free
        </button>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h4 className="text-xl font-semibold mb-2">Easy to Use</h4>
              <p className="text-gray-600">Intuitive interface that anyone can master in minutes.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h4 className="text-xl font-semibold mb-2">Real-time Sync</h4>
              <p className="text-gray-600">Stay updated across all your devices instantly.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h4 className="text-xl font-semibold mb-2">Secure</h4>
              <p className="text-gray-600">Your data is encrypted and protected at all times.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Keep Track. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
