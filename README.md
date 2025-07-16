# MusicDB MVP

A comprehensive platform for venue management, event tracking, and talent discovery in the music industry.

## Features

- **Venue Management**: Add and manage multiple venues with detailed information
- **Event Tracking**: Report and analyze event data including ticket sales and artist information
- **Analytics Dashboard**: View comprehensive analytics and insights for your venues
- **Talent Discovery**: AI-powered assistant to help find suitable artists for your venue
- **User Profiles**: Manage your profile and role information

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Chat**: n8n Chat Widget with custom context integration

## AI Chat Integration

The application includes an AI-powered talent discovery assistant that has access to your venue and user data for personalized recommendations.

### User Context Data Passed to AI

When you interact with the AI assistant on the Find Talent page, the following context data is automatically included:

```typescript
{
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    bio?: string;
  },
  venue: {
    id: string;
    name: string;
    location?: string;
    capacity?: number;
    description?: string;
  },
  userVenues: Array<{
    id: string;
    name: string;
    location?: string;
  }>,
  analytics: {
    showsReported: number;
    ticketSales: number;
    barSales: number;
    avgSelloutRate: number;
    avgTicketPrice: number;
    topGenre?: { genre: string; count: number };
    topArtist?: { name: string; count: number };
  },
  recentEvents: Array<{
    id: string;
    name: string;
    date: string;
    venue_name?: string;
  }>
}
```

### Accessing User Context in n8n Workflow

In your n8n Chat Trigger node, the user context data is available in the `metadata.userContext` field. You can access it in subsequent nodes using expressions like:

- `{{ $json.metadata.userContext.user.full_name }}` - User's name
- `{{ $json.metadata.userContext.venue.name }}` - Current venue name
- `{{ $json.metadata.userContext.venue.capacity }}` - Venue capacity
- `{{ $json.metadata.userContext.analytics.topGenre.genre }}` - Most popular genre
- `{{ $json.metadata.userContext.recentEvents }}` - Recent events array

### Example n8n Workflow Setup

1. **Chat Trigger Node**: Receives the user message and context
2. **Set Node**: Extract and format the user context for the AI prompt
3. **AI Agent/Chain**: Use the context to provide personalized responses
4. **Response**: Return contextualized recommendations

Example system prompt enhancement:
```
You are a talent discovery assistant for music venues. 

User Context:
- Venue: {{ $json.metadata.userContext.venue.name }} (Capacity: {{ $json.metadata.userContext.venue.capacity }})
- Location: {{ $json.metadata.userContext.venue.location }}
- Most popular genre: {{ $json.metadata.userContext.analytics.topGenre.genre }}
- Recent events: {{ $json.metadata.userContext.recentEvents.length }} shows
- Average ticket price: ${{ $json.metadata.userContext.analytics.avgTicketPrice }}

Please provide artist recommendations that fit this venue's profile and recent performance history.
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Configure Supabase database
5. Set up n8n workflow with Chat Trigger
6. Start development server: `npm run dev`

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## License

This project is licensed under the MIT License.
