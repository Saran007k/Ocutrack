
import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: 'fa-house', label: 'Home' },
    { id: 'schedule', icon: 'fa-calendar-check', label: 'Today' },
    { id: 'meds', icon: 'fa-pills', label: 'My Meds' },
    { id: 'assistant', icon: 'fa-robot', label: 'AI Help' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-around items-center p-2 z-30 shadow-lg h-20 transition-colors duration-300">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center justify-center w-full transition-colors ${
            activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <i className={`fa-solid ${tab.icon} text-2xl`}></i>
          <span className="text-xs mt-1 font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
