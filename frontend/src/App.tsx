import React from 'react';
import { InterviewRoom } from './components/InterviewRoom';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      {/* Top Navigation Bar - Minimalist */}
      <header className="h-16 border-b border-border flex items-center px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-xl tracking-tighter">
             LI
           </div>
           <span className="font-semibold text-lg tracking-tight">Lets Interview</span>
        </div>
        <div className="ml-auto flex items-center space-x-4 text-sm font-medium text-muted-foreground">
           <span>Session ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
           <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-subtle">
             End Session
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <InterviewRoom />
      </main>
    </div>
  );
};

export default App;
