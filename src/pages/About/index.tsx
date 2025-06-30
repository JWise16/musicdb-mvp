import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  CalendarIcon,
  ChartBarIcon,
  SparklesIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import logoImage from '../../assets/logo.png';
import trackShowsFigure from '../../assets/about-us/use-cases/figure.png';
import artistInsightsFigure from '../../assets/about-us/artist-insights/figure.png';
import discoverNewTalentFigure from '../../assets/about-us/discover-new-talent/figure.png';
import personalDatabaseFigure from '../../assets/about-us/personal-database/figure.png';

export function AboutPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 bg-white z-50 py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo and Company Name */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-gray-900">MusicDB</span>
              <img 
                src={logoImage} 
                alt="MusicDB Logo" 
                className="h-8 w-auto"
              />
            </div>
            
            {/* Desktop Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('manifesto')}
                className="text-gray-900 hover:text-gray-600 font-medium transition-colors text-lg"
              >
                Manifesto
              </button>
              <button
                onClick={() => scrollToSection('use-cases')}
                className="text-gray-900 hover:text-gray-600 font-medium transition-colors text-lg"
              >
                Use Cases
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-gray-900 hover:text-gray-600 font-medium transition-colors text-lg"
              >
                FAQ
              </button>
            </div>
            
            {/* Desktop Get Started Button - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gray-100 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile menu button - Visible only on mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-900 hover:text-gray-600 p-2"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu - Visible only when open */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    scrollToSection('manifesto');
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors text-lg text-left"
                >
                  Manifesto
                </button>
                <button
                  onClick={() => {
                    scrollToSection('use-cases');
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors text-lg text-left"
                >
                  Use Cases
                </button>
                <button
                  onClick={() => {
                    scrollToSection('faq');
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors text-lg text-left"
                >
                  FAQ
                </button>
                <div className="flex flex-col space-y-2 pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-lg font-medium transition-colors w-fit"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-gray-100 text-gray-900 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors w-fit"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Manifesto Section */}
      <section id="manifesto" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Helping Venues Thrive
          </h2>
          
          <div className="space-y-12">
            {/* The Motivation */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 border-b-2 border-accent-600 inline-block pb-1">
                The Motivation
              </h3>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  The National Independent Venue Association (NIVA) revealed that 64% of independent venues in the U.S. were not profitable in 2024. Nearly half saw a drop in revenue, and over two-thirds faced rising costs, driven by inflation, insurance spikes, and labor shortages.
                </p>
                <p>
                  Meanwhile, large corporate-backed venues like Live Nation and AEG have access to more data, technology, and resources, making it even harder for independent spaces to compete.
                </p>
                <p>
                  Now more than ever, we believe the future of live music depends on independent venues working together. That's why we're building a tool designed to help them collaborate, share insights, and thrive.
                </p>
              </div>
            </div>

            {/* The Problem */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 border-b-2 border-accent-600 inline-block pb-1">
                The Problem
              </h3>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  Booking new talent can be unpredictable, and turnout is hard to gauge.
                </p>
                <p>
                  Some artists perform better in certain markets, and large social media followings or high streaming numbers don't always translate to ticket sales.
                </p>
                <p>
                  There's pressure for venues fill the room. Not just to stay profitable, but to create a meaningful experience for the audience, artist, and venue.
                </p>
                <p>
                  At the same time, venues want to keep things fresh, bringing in new acts, supporting emerging talent, and building something special for their community. Doing that consistently, while managing financial risk can be a difficult balance.
                </p>
              </div>
            </div>

            {/* The Solution */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 border-b-2 border-accent-600 inline-block pb-1">
                The Solution
              </h3>
              <div className="prose prose-lg text-gray-600 space-y-4">
                <p>
                  MusicDB is designed to bring clarity and confidence to the booking process.
                </p>
                <p>
                  On our platform, venues self-report ticket sales from their shows, contributing to a growing dataset that shows which artists are actually drawing crowds and where.
                </p>
                <p>
                  In return, they get an analytics dashboard showing what's worked at their venue and data-driven recommendations on new artists who are a strong fit for future bookings.
                </p>
                <p>
                  Our model works as an ecosystem. One that venues help build and in turn, benefit from.
                </p>
                <p className="font-medium text-gray-800 text-xl">
                  Because data doesn't replace instinct—it makes it unstoppable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-16 text-center">
            Use Cases
          </h2>

          {/* Track Shows in the Area */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Content */}
            <div className="space-y-6">
              {/* Icon and Header */}
              <div className="flex items-center space-x-4">
                <CalendarIcon className="w-12 h-12 text-[#73CBC0]" />
                <div className="bg-[#73CBC0] text-white px-6 py-3 rounded-full font-medium text-lg">
                  Track Shows in the Area
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  Browse shows in your area and see which artists are drawing crowds that match your venue's capacity.
                </p>
                <p>
                  Learn from other venues without needing to ask around.
                </p>
              </div>
            </div>

            {/* Right Content - Figure */}
            <div className="flex justify-center">
              <img 
                src={trackShowsFigure} 
                alt="Track Shows Interface" 
                className="w-full max-w-lg"
              />
            </div>
          </div>

          {/* Artist Insights */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Content */}
            <div className="space-y-6">
              {/* Icon and Header */}
              <div className="flex items-center space-x-4">
                <ChartBarIcon className="w-12 h-12 text-[#4B86C7]" />
                <div className="bg-[#4B86C7] text-white px-6 py-3 rounded-full font-medium text-lg">
                  Artist Insights
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  Access detailed artist analytics all in one place. View streaming numbers, social engagement, and audience demographics across platforms like Instagram, TikTok, Spotify, SoundCloud, and more.
                </p>
                <p>
                  Explore their live performance history, including where they've played and how well they've done.
                </p>
              </div>
            </div>

            {/* Right Content - Figure */}
            <div className="flex justify-center">
              <img 
                src={artistInsightsFigure} 
                alt="Artist Insights Dashboard" 
                className="w-full max-w-lg"
              />
            </div>
          </div>

          {/* Discover New Talent */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Content */}
            <div className="space-y-6">
              {/* Icon and Header */}
              <div className="flex items-center space-x-4">
                <SparklesIcon className="w-12 h-12 text-[#282862]" />
                <div className="bg-[#282862] text-white px-6 py-3 rounded-full font-medium text-lg">
                  Discover New Talent
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  Filter for artists you think would be a good fit for your venue, and add them to a watchlist to follow their momentum over time.
                </p>
              </div>
            </div>

            {/* Right Content - Figure */}
            <div className="flex justify-center">
              <img 
                src={discoverNewTalentFigure} 
                alt="Discover New Talent Interface" 
                className="w-full max-w-lg"
              />
            </div>
          </div>

          {/* Personal Database */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Left Content */}
            <div className="space-y-6">
              {/* Icon and Header */}
              <div className="flex items-center space-x-4">
                <TableCellsIcon className="w-12 h-12 text-[#61C5FA]" />
                <div className="bg-[#61C5FA] text-white px-6 py-3 rounded-full font-medium text-lg">
                  Personal Database
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  After you log your shows, we create you a personal dashboard you can reference anytime that tracks what's consistently working and where there's room to experiment.
                </p>
                <p>
                  In addition we store your booking history giving you a database of your shows to easily refer back to.
                </p>
              </div>
            </div>

            {/* Right Content - Figure */}
            <div className="flex justify-center">
              <img 
                src={personalDatabaseFigure} 
                alt="Personal Database Dashboard" 
                className="w-full max-w-lg"
              />
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* FAQ Pill */}
          <div className="flex justify-center mb-8">
            <div className="bg-accent-100 text-accent-800 px-6 py-3 rounded-full font-medium text-lg">
              FAQ
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Questions? We've Got Answers
          </h2>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Question 1 */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full flex justify-between items-center py-6 text-left text-xl font-medium text-gray-900 hover:text-gray-700"
              >
                What is the pricing model?
                <span className="ml-6 text-2xl">
                  {expandedFaq === 0 ? '−' : '+'}
                </span>
              </button>
              {expandedFaq === 0 && (
                <div className="pb-6 text-gray-600 text-lg leading-relaxed">
                  MusicDB is completely free! To access the tool, all we ask is that you report your shows. Our goal is to create a tool that delivers real value to venues of all kinds—and we're starting by making it accessible to the ones helping build it.
                </div>
              )}
            </div>

            {/* Question 2 */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full flex justify-between items-center py-6 text-left text-xl font-medium text-gray-900 hover:text-gray-700"
              >
                What information is required to report a show?
                <span className="ml-6 text-2xl">
                  {expandedFaq === 1 ? '−' : '+'}
                </span>
              </button>
              {expandedFaq === 1 && (
                <div className="pb-6 text-gray-600 text-lg leading-relaxed">
                  <p className="mb-4">
                    To report a show, we ask for ticket sales and ticket price. These are the only details other venues using the tool can see.
                  </p>
                  <p>
                    Any additional details you report—like bar sales or show notes—are completely private. They're optional and only visible to you on your dashboard for your own reference.
                  </p>
                </div>
              )}
            </div>

            {/* Question 3 */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full flex justify-between items-center py-6 text-left text-xl font-medium text-gray-900 hover:text-gray-700"
              >
                What kinds of venues is MusicDB designed to support?
                <span className="ml-6 text-2xl">
                  {expandedFaq === 2 ? '−' : '+'}
                </span>
              </button>
              {expandedFaq === 2 && (
                <div className="pb-6 text-gray-600 text-lg leading-relaxed">
                  MusicDB is built for all types of venues, but we were inspired by the needs of independent venues—those that often don't have access to the same tools and resources as larger, corporate-backed spaces. Our goal is to level the playing field by giving every venue, regardless of size or budget, access to the data they need to book with confidence.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src={logoImage} 
              alt="MusicDB Logo" 
              className="h-8 w-auto"
            />
            <span className="text-2xl font-bold">MusicDB</span>
          </div>
          <p className="text-gray-400">
            Connecting venues with artists to create unforgettable live music experiences
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage; 