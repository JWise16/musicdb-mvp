import { useEffect, useRef, useState } from 'react';
import '@n8n/chat/style.css';
import { createChat, type ChatConfig, type ChatInstance } from '@n8n/chat';

interface DetailedEvent {
  id: string;
  name: string;
  date: string;
  venue_name: string;
  venue_capacity?: number;
  // Financial data
  ticket_price?: number;
  ticket_price_min?: number;
  ticket_price_max?: number;
  total_tickets: number;
  tickets_sold?: number;
  percentage_sold: number;
  ticket_revenue?: number;
  bar_sales?: number;
  total_revenue: number;
  bar_sales_per_attendee?: number;
  // Artists information
  headliners: Array<{
    name: string;
    genre?: string;
  }>;
  supporting_acts: Array<{
    name: string;
    genre?: string;
    performance_order: number;
  }>;
  // Event metrics
  notes?: string;
}

interface UserContext {
  user?: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    bio?: string;
  };
  venue?: {
    id: string;
    name: string;
    location?: string;
    capacity?: number;
    description?: string;
  };
  userVenues?: Array<{
    id: string;
    name: string;
    location?: string;
    capacity?: number;
  }>;
  analytics?: {
    showsReported: number;
    ticketSales: number;
    barSales: number;
    avgSelloutRate: number;
    avgTicketPrice: number;
    topGenre?: { genre: string; count: number };
    topArtist?: { name: string; count: number };
    topMonth?: { month: string; count: number };
  };
  events?: {
    upcoming: DetailedEvent[];
    past: DetailedEvent[];
    total_count: number;
    recent_summary: {
      last_30_days: {
        event_count: number;
        total_revenue: number;
        avg_sellout_rate: number;
        top_genres: string[];
        top_artists: string[];
      };
      last_6_months: {
        event_count: number;
        total_revenue: number;
        avg_sellout_rate: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      };
    };
  };
}

interface N8nChatWidgetProps {
  webhookUrl: string;
  userContext?: UserContext;
}

const N8nChatWidget = ({ webhookUrl, userContext }: N8nChatWidgetProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<ChatInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const containerId = 'n8n-chat-container-' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (chatContainerRef.current && !chatInstanceRef.current) {
      // Set the ID on the container element
      chatContainerRef.current.id = containerId;
      
      try {
        // Prepare metadata with user context
        const metadata = userContext ? {
          user_profile: userContext.user,
          current_venue: userContext.venue,
          user_venues: userContext.userVenues,
          venue_analytics: userContext.analytics,
          event_data: userContext.events,
          context_timestamp: new Date().toISOString(),
          app_version: '1.0.0'
        } : {};

        // Debug logging
        console.log('🎯 N8n Chat Widget - User Context being sent:', {
          hasUserContext: !!userContext,
          userVenuesCount: userContext?.userVenues?.length || 0,
          eventsCount: userContext?.events?.total_count || 0,
          analyticsData: userContext?.analytics ? 'Present' : 'Missing',
          metadata: metadata
        });

        const config: ChatConfig = {
          webhookUrl,
          target: `#${containerId}`,
          mode: 'fullscreen',
          metadata,
          showWelcomeScreen: true,
          defaultLanguage: 'en',
          i18n: {
            en: {
              title: 'Find Talent',
              subtitle: 'AI assistant to help you discover the perfect artists for your venue',
              footer: 'Powered by MusicDB',
              getStarted: 'Get Started',
              inputPlaceholder: 'Ask about artists, genres, booking recommendations...'
            }
          }
        };

        console.log('🔧 N8n Chat Config:', config);

        const chatInstance = createChat(config);
        chatInstanceRef.current = chatInstance;
        setIsLoaded(true);
      } catch (error) {
        console.error('Error initializing n8n chat:', error);
      }
    }

    // Cleanup function
    return () => {
      if (chatInstanceRef.current?.destroy) {
        chatInstanceRef.current.destroy();
        chatInstanceRef.current = null;
        setIsLoaded(false);
      }
    };
  }, [webhookUrl, userContext, containerId]);

  return (
    <div className="h-full w-full">
      <div ref={chatContainerRef} className="h-full w-full" />
      {!isLoaded && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}
    </div>
  );
};

export default N8nChatWidget; 