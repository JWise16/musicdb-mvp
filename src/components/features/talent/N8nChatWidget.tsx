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
          showWelcomeScreen: false,
          defaultLanguage: 'en',
          i18n: {
            en: {
              title: '',
              subtitle: '',
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
      <style>
        {`
          /* Ensure user message styling and white backgrounds with component-level specificity */
          #${containerId} {
            --chat--message--user--background: #f3f4f6 !important;
            --chat--message--user--color: #000000 !important;
            --chat--message--user--border: 1px solid #e5e7eb !important;
            
            /* Bot message styling with black border */
            --chat--message--bot--background: #ffffff !important;
            --chat--message--bot--color: #000000 !important;
            --chat--message--bot--border: 1px solid #000000 !important;
            
            /* Extra rounded chat bubbles */
            --chat--border-radius: 1.5rem !important;
            --chat--message--border-radius: 1.5rem !important;
            
            /* Ensure all chat backgrounds are pure white */
            --chat--color-light: #ffffff !important;
            --chat--color-white: #ffffff !important;
            --chat--color-secondary: #ffffff !important;
            --chat--header--background: #ffffff !important;
            --chat--body--background: #ffffff !important;
            
            /* Additional background overrides */
            background: #ffffff !important;
            background-color: #ffffff !important;
          }
          
          /* Force white background on all child elements */
          #${containerId} * {
            background-color: #ffffff !important;
          }
          
          /* Ensure bot messages have black borders and rounded edges */
          #${containerId} [class*="message"][class*="bot"],
          #${containerId} [data-direction="incoming"],
          #${containerId} .message:not([data-direction="outgoing"]) {
            border: 1px solid #000000 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            border-radius: 1.5rem !important;
          }
          
          /* Ensure user messages also have rounded edges */
          #${containerId} [class*="message"][class*="user"],
          #${containerId} [data-direction="outgoing"] {
            background-color: #f3f4f6 !important;
            border-radius: 1.5rem !important;
          }
          
          /* Apply rounded corners to all message-like elements */
          #${containerId} [class*="message"],
          #${containerId} [class*="bubble"],
          #${containerId} [data-direction] {
            border-radius: 1.5rem !important;
          }
        `}
      </style>
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