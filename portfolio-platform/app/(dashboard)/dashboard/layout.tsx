import React from 'react';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <aside className="w-64 bg-neutral-900 p-6 border-r border-neutral-800">
        <h2 className="text-2xl font-bold mb-8">Creator Panel</h2>
        <nav className="space-y-4">
          <a href="/dashboard/profile" className="block hover:text-blue-400 transition-colors">Profile Settings</a>
          <a href="/dashboard/portfolio" className="block hover:text-blue-400 transition-colors">Portfolio Items</a>
          {/* Add more navigation links as needed */}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
