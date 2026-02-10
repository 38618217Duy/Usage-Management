import { useState } from 'react';
import { MousePointer, Wind } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { WindsurfDashboard } from './components/WindsurfDashboard';
import './index.css';

function App() {
  const [activeApp, setActiveApp] = useState<'cursor' | 'windsurf'>('cursor');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Switcher */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveApp('cursor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeApp === 'cursor'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MousePointer className="w-4 h-4" />
                Cursor Usage
              </button>
              <button
                onClick={() => setActiveApp('windsurf')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeApp === 'windsurf'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wind className="w-4 h-4" />
                Windsurf Usage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Content */}
      {activeApp === 'cursor' ? <Dashboard /> : <WindsurfDashboard />}
    </div>
  );
}

export default App;

