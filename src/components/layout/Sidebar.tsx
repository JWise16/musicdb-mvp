import { Link, useLocation } from 'react-router-dom';
import { useAuth, useUserProfile, useAdminAuth } from '../../hooks/useAuthTransition';
import { useGetUserVenueRelationQuery } from '../../store/api/venuesApi';
import { formatRole } from '../../utils/roleUtils';
import Avatar from '../common/Avatar';
import { supabase } from '../../supabaseClient';
import logoImage from '../../assets/logo.png';

const navLinks = [
  { name: 'Home', to: '/dashboard', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0a2 2 0 002-2V7a2 2 0 00-.586-1.414l-7-7a2 2 0 00-2.828 0l-7 7A2 2 0 003 7v11a2 2 0 002 2h3m10 0h3" /></svg>
  ) },
  { name: 'Events', to: '/events', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ) },
  { name: 'Artist Search', to: '/artist-search', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  ) },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { canViewAdminDashboard, adminLevel } = useAdminAuth();
  
  // Use RTK Query to get user venue relation (cached!)
  const {
    data: userVenue,
    isLoading: venueLoading,
  } = useGetUserVenueRelationQuery(user?.id || '', {
    skip: !user?.id, // Skip query if no user
  });

  // Get display name from profile or fallback to email
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get role display text
  const getRoleDisplay = () => {
    if (profile?.role) {
      return profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (userVenue) {
      return `${formatRole(userVenue.role)} at ${userVenue.venue.name}`;
    }
    return 'No role assigned';
  };

  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-[#F6F6F3] border-r border-gray-200 py-6 px-4 sticky top-0 z-20 shrink-0">
      <div>
        {/* Logo */}
        <div className="flex items-center mb-10 px-2">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">MusicDB</span>
          <img 
            src={logoImage} 
            alt="MusicDB Logo" 
            className="w-10 h-10 ml-2 object-contain"
          />
        </div>
        {/* Nav Links */}
        <nav className="flex flex-col gap-2">
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.to}
              className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors duration-150 ${location.pathname === link.to ? 'bg-white text-black font-extrabold shadow' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
          
          {/* Admin Link - Only show for admins */}
          {canViewAdminDashboard && (
            <>
              <hr className="my-2 border-gray-300" />
              <Link
                to="/admin"
                className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors duration-150 ${location.pathname === '/admin' ? 'bg-white text-black font-extrabold shadow' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin
                {adminLevel && (
                  <span className="ml-auto inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {adminLevel === 'super_admin' ? 'Super' : 'Admin'}
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>
      </div>
      
      <div>
        {/* User Profile */}
        <div className="flex items-center gap-3 px-2">
          <Avatar 
            src={profile?.avatar_url} 
            size="sm" 
            fallback={getDisplayName()}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {getDisplayName()}
            </div>
            <div className="text-xs text-gray-500 truncate">
                              {venueLoading ? 'Loading...' : getRoleDisplay()}
            </div>
          </div>
        </div>
        
        {/* Sign Out */}
        <div className="px-2 mt-4">
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-black underline text-xs hover:no-underline transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 