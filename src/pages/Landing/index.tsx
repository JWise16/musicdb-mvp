import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TypewriterEffect } from '../../components/common/TypewriterEffect';
import logoImage from '../../assets/logo.png';

const Landing = () => {
  const [logoVisible, setLogoVisible] = useState(false);
  const [startTypewriter, setStartTypewriter] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);

  // Start logo animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoVisible(true);
    }, 300); // Small delay before logo starts

    return () => clearTimeout(timer);
  }, []);

  // Start typewriter after logo animation completes
  useEffect(() => {
    if (logoVisible) {
      const timer = setTimeout(() => {
        setStartTypewriter(true);
      }, 800); // Wait for logo animation to complete

      return () => clearTimeout(timer);
    }
  }, [logoVisible]);

  // Show subtitle when logo becomes visible
  useEffect(() => {
    if (logoVisible) {
      setShowSubtitle(true);
    }
  }, [logoVisible]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content - Center with logo stacked on top */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-4xl text-center">
          {/* Logo */}
          <div className="mb-4">
            <img 
              src={logoImage} 
              alt="MusicDB Logo" 
              className={`w-48 h-48 md:w-56 md:h-56 mx-auto object-contain transition-all duration-700 ease-out ${
                logoVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-8'
              }`}
            />
          </div>
          
          {/* Main messaging */}
          <div className="space-y-6 mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-black tracking-tight leading-tight min-h-[4.5rem] md:min-h-[5.5rem] flex items-center justify-center">
              {startTypewriter ? (
                <TypewriterEffect 
                  text="Meet your next artist" 
                  speed={80}
                  className="text-5xl md:text-6xl font-bold text-black tracking-tight leading-tight"
                  showFinalCursor={true}
                />
              ) : (
                <span className="text-5xl md:text-6xl font-bold text-black tracking-tight leading-tight opacity-0">
                  Meet your next artist
                </span>
              )}
            </h2>
            <div className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              <p className={`text-xl md:text-2xl text-gray-600 transition-all duration-700 ease-out ${
                showSubtitle 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}>
                The first artist discovery platform for venues
              </p>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="pt-4 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center bg-black text-white px-12 py-4 text-xl font-medium rounded-lg hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-40 whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center bg-white text-black border-4 border-black px-12 py-4 text-xl font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-40 whitespace-nowrap"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* About Us - Bottom */}
      <div className="flex-none pb-20">
        <div className="text-center">
          <Link
            to="/about"
            className="text-gray-600 text-lg hover:text-black transition-colors inline-flex items-center"
          >
            About Us
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
