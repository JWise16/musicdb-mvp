import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Home', to: '/dashboard', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0a2 2 0 002-2V7a2 2 0 00-.586-1.414l-7-7a2 2 0 00-2.828 0l-7 7A2 2 0 003 7v11a2 2 0 002 2h3m10 0h3" /></svg>
  ) },
  { name: 'Events', to: '/events', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ) },
  { name: 'Find Talent', to: '/find-talent', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7a4 4 0 118 0 4 4 0 01-8 0zm8 8a6 6 0 00-12 0v1a2 2 0 002 2h8a2 2 0 002-2v-1z" /></svg>
  ) },
];

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-[#F6F6F3] border-r border-gray-200 py-6 px-4 fixed left-0 top-0 z-20">
      <div>
        {/* Logo */}
        <div className="flex items-center mb-10 px-2">
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">MusicDB</span>
          <span className="ml-2">
            <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" /></svg>
          </span>
        </div>
        {/* Nav Links */}
        <nav className="flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.to}
              className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors duration-150 ${location.pathname === link.to ? 'bg-white text-accent-600 shadow' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
      {/* User Profile */}
      <div className="flex items-center gap-3 px-2 mt-8">
        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-10 h-10 rounded-full object-cover border border-gray-300" />
        <div>
          <div className="font-semibold text-gray-900 text-sm">PaulMcCartney10</div>
          <div className="text-xs text-gray-500">Venue Admin</div>
        </div>
        <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </aside>
  );
};

export default Sidebar; 