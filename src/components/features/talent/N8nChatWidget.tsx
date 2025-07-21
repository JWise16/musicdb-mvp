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
  const observerRef = useRef<MutationObserver | null>(null);
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
          initialMessages: [
            'Welcome to MusicDB! 🎵',
            'Let’s find your next great show, who are you looking to book?'
          ],
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

        // Set up scroll to bottom behavior for new messages
        const setupScrollBehavior = () => {
          const chatContainer = document.querySelector(`#${containerId}`);
          if (chatContainer) {
            const messagesContainer = chatContainer.querySelector('[class*="messages"], [class*="body"]');
            if (messagesContainer) {
              // Function to scroll to bottom
              const scrollToBottom = () => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              };
              
              // Start at the bottom
              scrollToBottom();
              
              // Observe for new messages and scroll to bottom
              const observer = new MutationObserver((mutations) => {
                let shouldScroll = false;
                mutations.forEach((mutation) => {
                  if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new message elements were added
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.matches('[class*="message"], .message') || 
                            element.querySelector('[class*="message"], .message')) {
                          shouldScroll = true;
                        }
                      }
                    });
                  }
                });
                
                if (shouldScroll) {
                  // Small delay to ensure content is rendered
                  setTimeout(scrollToBottom, 100);
                }
              });
              
              observer.observe(messagesContainer, { 
                childList: true, 
                subtree: true 
              });
              
              // Store observer for cleanup
              observerRef.current = observer;
              
              // Also scroll on resize to maintain position
              window.addEventListener('resize', scrollToBottom);
            }
          }
        };

        setTimeout(setupScrollBehavior, 1000);

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
      
      // Clean up observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [webhookUrl, userContext, containerId]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
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
            --chat--message--bot--border: 5px solid #000000 !important;
            
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
            
            /* Ensure full height */
            height: 100% !important;
            min-height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Force white background on all child elements */
          #${containerId} * {
            background-color: #ffffff !important;
          }
          
          /* Make messages area start from bottom */
          #${containerId} [class*="messages"], 
          #${containerId} [class*="body"],
          #${containerId} .chat-messages,
          #${containerId} .chat-body {
            flex-direction: column-reverse !important;
            justify-content: flex-start !important;
          }
          
          /* Make individual message containers display properly */
          #${containerId} [class*="message-list"],
          #${containerId} [class*="conversation"],
          #${containerId} .message-list {
            display: flex !important;
            flex-direction: column-reverse !important;
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
          
          /* Ensure the chat container expands to full height */
          #${containerId} > div {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Ensure the chat body takes remaining space and starts from bottom */
          #${containerId} [class*="body"],
          #${containerId} [class*="messages"] {
            flex: 1 !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-end !important;
          }
          
          /* Remove red border from input text box when focused */
          #${containerId} input,
          #${containerId} textarea,
          #${containerId} [class*="input"],
          #${containerId} [class*="textarea"] {
            border: 1px solid #e5e7eb !important;
            outline: none !important;
            box-shadow: none !important;
          }
          
          #${containerId} input:focus,
          #${containerId} textarea:focus,
          #${containerId} [class*="input"]:focus,
          #${containerId} [class*="textarea"]:focus {
            border: 1px solid #9ca3af !important;
            outline: none !important;
            box-shadow: 0 0 0 0px transparent !important;
            ring: none !important;
          }
          
          /* Remove any focus rings or outlines */
          #${containerId} *:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Make send button always black */
          #${containerId} [class*="send"],
          #${containerId} [class*="submit"],
          #${containerId} button[type="submit"],
          #${containerId} .chat-input button,
          #${containerId} .chat-input-wrapper button {
            color: #000000 !important;
            fill: #000000 !important;
          }
          
          /* Ensure send button icon/text stays black on hover and focus */
          #${containerId} [class*="send"]:hover,
          #${containerId} [class*="submit"]:hover,
          #${containerId} button[type="submit"]:hover,
          #${containerId} .chat-input button:hover,
          #${containerId} .chat-input-wrapper button:hover,
          #${containerId} [class*="send"]:focus,
          #${containerId} [class*="submit"]:focus,
          #${containerId} button[type="submit"]:focus,
          #${containerId} .chat-input button:focus,
          #${containerId} .chat-input-wrapper button:focus {
            color: #000000 !important;
            fill: #000000 !important;
          }
          
          /* Target SVG icons within send button */
          #${containerId} [class*="send"] svg,
          #${containerId} [class*="submit"] svg,
          #${containerId} button[type="submit"] svg,
          #${containerId} .chat-input button svg,
          #${containerId} .chat-input-wrapper button svg {
            fill: #000000 !important;
            color: #000000 !important;
          }
        `}
      </style>
      <div ref={chatContainerRef} className="h-full w-full flex-1 min-h-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading AI assistant...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default N8nChatWidget; 