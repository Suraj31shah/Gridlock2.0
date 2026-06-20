import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Calculator, History, AlertTriangle } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Hotspot Map', path: '/map', icon: <Map size={20} /> },
    { name: 'Predictor', path: '/predict', icon: <Calculator size={20} /> },
    { name: 'Event History', path: '/history', icon: <History size={20} /> },
    { name: 'Zone Risk', path: '/risk', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <aside className="w-64 bg-dark-navy text-white h-full flex flex-col shadow-xl flex-shrink-0 z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
            <AlertTriangle size={18} />
          </div>
          Astram<span className="text-blue-500">AI</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Bengaluru Traffic Intel</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const active = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.icon}
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-sm font-medium">BTP</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Control Room</p>
            <p className="text-xs text-slate-400">Duty Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
