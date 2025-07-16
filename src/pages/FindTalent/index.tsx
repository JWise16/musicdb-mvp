import Sidebar from '../../components/layout/Sidebar';
import N8nChatWidget from '../../components/features/talent/N8nChatWidget';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useVenue } from '../../contexts/VenueContext';
import { useState, useEffect } from 'react';
import { VenueService, type VenueAnalytics, type VenueEvent } from '../../services/venueService';

const FindTalent = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { currentVenue, userVenues } = useVenue();
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [events, setEvents] = useState<{
    upcoming: VenueEvent[];
    past: VenueEvent[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Test webhook connectivity
  useEffect(() => {
    const testWebhook = async () => {
      try {
        const response = await fetch('https://jwise16.app.n8n.cloud/webhook/de704005-f14f-4ddd-9fb6-1ca15825db62/chat', {
          method: 'GET',
          mode: 'cors'
        });
        console.log('Webhook test response:', response.status);
      } catch (error) {
        console.error('Webhook test error:', error);
      }
    };
    
    testWebhook();
  }, []);

  useEffect(() => {
    const loadEventData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Load analytics and events for all user venues
        const [venueAnalytics, venueEvents] = await Promise.all([
          VenueService.getUserVenuesAnalytics(user.id, 'ALL'),
          VenueService.getUserVenuesEvents(user.id)
        ]);

        setAnalytics(venueAnalytics);
        setEvents(venueEvents);
      } catch (error) {
        console.error('Error loading event data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [user?.id]);

  // Helper function to transform VenueEvent to DetailedEvent
  const transformEventData = (venueEvents: VenueEvent[]) => {
    return venueEvents.map(event => ({
      id: event.id,
      name: event.name,
      date: event.date,
      venue_name: event.venues?.name || 'Unknown Venue',
      venue_capacity: event.venues?.capacity || undefined,
      // Financial data
      ticket_price: event.ticket_price || undefined,
      ticket_price_min: event.ticket_price_min || undefined,
      ticket_price_max: event.ticket_price_max || undefined,
      total_tickets: event.total_tickets,
      tickets_sold: event.tickets_sold || undefined,
      percentage_sold: event.percentage_sold,
      ticket_revenue: event.event_metrics?.ticket_revenue || undefined,
      bar_sales: event.bar_sales || undefined,
      total_revenue: event.total_revenue,
      bar_sales_per_attendee: event.event_metrics?.bar_sales_per_attendee || undefined,
      // Artists information
      headliners: event.event_artists
        ?.filter(ea => ea.is_headliner)
        .map(ea => ({
          name: ea.artists?.name || 'Unknown Artist',
          genre: ea.artists?.genre || undefined
        })) || [],
      supporting_acts: event.event_artists
        ?.filter(ea => !ea.is_headliner)
        .map(ea => ({
          name: ea.artists?.name || 'Unknown Artist',
          genre: ea.artists?.genre || undefined,
          performance_order: ea.performance_order || 0
        })) || [],
      notes: event.notes || undefined
    }));
  };

  // Calculate recent event summary
  const calculateRecentSummary = (pastEvents: VenueEvent[]) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    // Last 30 days
    const last30DaysEvents = pastEvents.filter(event => 
      new Date(event.date) >= thirtyDaysAgo
    );

    const genreCounts30Days: { [key: string]: number } = {};
    const artistCounts30Days: { [key: string]: number } = {};
    let totalRevenue30Days = 0;
    let totalSellout30Days = 0;

    last30DaysEvents.forEach(event => {
      totalRevenue30Days += event.total_revenue;
      totalSellout30Days += event.percentage_sold;
      
      event.event_artists?.forEach(ea => {
        if (ea.artists?.genre) {
          genreCounts30Days[ea.artists.genre] = (genreCounts30Days[ea.artists.genre] || 0) + 1;
        }
        if (ea.artists?.name) {
          artistCounts30Days[ea.artists.name] = (artistCounts30Days[ea.artists.name] || 0) + 1;
        }
      });
    });

    const topGenres30Days = Object.entries(genreCounts30Days)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    const topArtists30Days = Object.entries(artistCounts30Days)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([artist]) => artist);

    // Last 6 months
    const last6MonthsEvents = pastEvents.filter(event => 
      new Date(event.date) >= sixMonthsAgo
    );

    const totalRevenue6Months = last6MonthsEvents.reduce((sum, event) => sum + event.total_revenue, 0);
    const avgSellout6Months = last6MonthsEvents.length > 0 
      ? last6MonthsEvents.reduce((sum, event) => sum + event.percentage_sold, 0) / last6MonthsEvents.length 
      : 0;

    // Calculate trend (simple comparison of first half vs second half of 6 months)
    const threeMonthsAgo = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
    const firstHalf = last6MonthsEvents.filter(event => new Date(event.date) < threeMonthsAgo);
    const secondHalf = last6MonthsEvents.filter(event => new Date(event.date) >= threeMonthsAgo);
    
    const firstHalfAvgRevenue = firstHalf.length > 0 
      ? firstHalf.reduce((sum, event) => sum + event.total_revenue, 0) / firstHalf.length 
      : 0;
    const secondHalfAvgRevenue = secondHalf.length > 0 
      ? secondHalf.reduce((sum, event) => sum + event.total_revenue, 0) / secondHalf.length 
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfAvgRevenue > firstHalfAvgRevenue * 1.1) trend = 'increasing';
    else if (secondHalfAvgRevenue < firstHalfAvgRevenue * 0.9) trend = 'decreasing';

    return {
      last_30_days: {
        event_count: last30DaysEvents.length,
        total_revenue: totalRevenue30Days,
        avg_sellout_rate: last30DaysEvents.length > 0 ? totalSellout30Days / last30DaysEvents.length : 0,
        top_genres: topGenres30Days,
        top_artists: topArtists30Days
      },
      last_6_months: {
        event_count: last6MonthsEvents.length,
        total_revenue: totalRevenue6Months,
        avg_sellout_rate: avgSellout6Months,
        trend
      }
    };
  };

  // Prepare user context for n8n
  const userContext = user && analytics && events ? {
    user: {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || profile?.full_name || '',
      role: profile?.role || '',
      bio: profile?.bio || ''
    },
    venue: currentVenue ? {
      id: currentVenue.id,
      name: currentVenue.name,
      location: currentVenue.location || '',
      capacity: currentVenue.capacity || 0,
      description: currentVenue.description || ''
    } : undefined,
    userVenues: userVenues?.map(venue => ({
      id: venue.id,
      name: venue.name,
      location: venue.location || '',
      capacity: venue.capacity || 0
    })) || [],
    analytics: {
      showsReported: analytics.showsReported,
      ticketSales: analytics.ticketSales,
      barSales: analytics.barSales,
      avgSelloutRate: analytics.avgSelloutRate,
      avgTicketPrice: analytics.avgTicketPrice,
      topGenre: analytics.topGenre,
      topArtist: analytics.topArtist,
      topMonth: analytics.topMonth
    },
    events: {
      upcoming: transformEventData(events.upcoming),
      past: transformEventData(events.past),
      total_count: events.upcoming.length + events.past.length,
      recent_summary: calculateRecentSummary(events.past)
    }
  } : undefined;

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Find Talent</h1>
            <p className="text-gray-600 mt-2">
              Discover the perfect artists for your venue with AI-powered recommendations
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border h-[600px]">
            <N8nChatWidget 
              webhookUrl="https://jwise16.app.n8n.cloud/webhook/de704005-f14f-4ddd-9fb6-1ca15825db62/chat"
              userContext={userContext}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindTalent; 