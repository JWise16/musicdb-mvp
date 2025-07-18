import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { supabase } from '../../supabaseClient';
import { formatRole } from '../../utils/roleUtils';
import Avatar from '../common/Avatar';
import logoImage from '../../assets/logo.png';

type UserVenue = {
  role: string;
  venue: {
    name: string;
  };
};

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
  { name: 'Profile', to: '/profile', icon: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ) },
];

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [userVenue, setUserVenue] = useState<UserVenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserVenue = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_venues')
          .select(`
            role,
            venue:venues (
              name
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user venue:', error);
        } else if (data) {
          // Handle the nested venue data structure
          const venueData = {
            role: data.role,
            venue: Array.isArray(data.venue) ? data.venue[0] : data.venue
          };
          setUserVenue(venueData as UserVenue);
        }
      } catch (error) {
        console.error('Error fetching user venue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVenue();
  }, [user]);

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
    <aside className="flex flex-col justify-between h-screen w-64 bg-[#F6F6F3] border-r border-gray-200 py-6 px-4 fixed left-0 top-0 z-20">
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
              {loading ? 'Loading...' : getRoleDisplay()}
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