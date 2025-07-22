# MusicDB MVP

A comprehensive platform for venue management, event tracking, and talent discovery in the music industry. MusicDB helps independent music venues collaborate, share insights, and thrive through data-driven decision making.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Avatar, etc.)
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components (Sidebar, etc.)
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── pages/               # Page components and routing
├── services/            # API service classes
├── styles/              # Global styles and themes
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🎯 Mission

> "Data doesn't replace instinct—it makes it unstoppable."

The National Independent Venue Association (NIVA) revealed that 64% of independent venues in the U.S. were not profitable in 2024. MusicDB is designed to help independent venues compete with corporate-backed venues by providing access to data, analytics, and collaborative insights.

## 🚀 Features

### 🏢 Venue Management
- **Multi-venue Support**: Manage multiple venues from one account
- **Detailed Profiles**: Location, capacity, contact information, and venue descriptions
- **Role-based Access**: Support for owners, managers, promoters, booking agents, and more
- **Venue Analytics**: Performance metrics and insights for each venue

### 🎪 Event Tracking & Reporting
- **Comprehensive Event Data**: Track ticket sales, bar revenue, artist lineups, and attendance
- **Flexible Pricing**: Support for single price or price range events
- **Artist Management**: Automatic artist database with performance history
- **Revenue Analytics**: Detailed financial reporting and trend analysis

### 📊 Analytics Dashboard
- **Real-time Metrics**: Venue performance, sellout rates, and revenue tracking
- **Time-based Analysis**: Year-to-date, month-to-date, and all-time analytics
- **Top Performers**: Identify best-performing genres, artists, and time periods
- **Visual Charts**: Interactive charts for trends and comparisons

### 🤖 AI-Powered Talent Discovery
- **Contextual Recommendations**: AI assistant with access to your venue and event data
- **Personalized Suggestions**: Artist recommendations based on your venue's history and preferences
- **Data-driven Insights**: Leverage community data for better booking decisions
- **Integration Ready**: Built on n8n workflows for extensible AI functionality

### 👤 User Management
- **Profile System**: Comprehensive user profiles with roles and contact information
- **Onboarding Flow**: Guided setup process for new users
- **Role Flexibility**: Support for various industry roles and custom positions
- **Avatar Support**: Profile pictures with Supabase storage integration

### 🔗 Third-party Integrations
- **Viberate API**: Artist data and insights integration
- **n8n Workflows**: Extensible automation and AI chat capabilities
- **Supabase Storage**: File uploads and media management

## 🏗️ Tech Stack

### Frontend
- **React 19.1** with **TypeScript 5.8**
- **Vite 6.3** for fast development and building
- **Tailwind CSS 3.4** for responsive, utility-first styling
- **React Router** for client-side routing
- **Recharts** for data visualization

### Backend & Infrastructure
- **Supabase** (PostgreSQL) for database and authentication
- **Supabase Auth** for user management and security
- **Supabase Storage** for file uploads and media
- **Supabase Edge Functions** for serverless API endpoints

### AI & Automation
- **n8n Chat Widget** for AI-powered talent discovery
- **Custom Context Integration** for personalized AI responses
- **Webhook-based Architecture** for real-time AI interactions

### Development Tools
- **ESLint** with TypeScript support
- **PostCSS** with Tailwind CSS
- **React Confetti** for celebration animations
- **Heroicons** for consistent iconography

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or later)
- **npm** or **yarn** package manager
- **Git** for version control
- A **Supabase** account and project
- An **n8n** instance (for AI features)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd musicdb-mvp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Integration (for AI features)
VITE_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url

# Optional: Supabase Function URL (for artist images)
VITE_SUPABASE_FUNCTION_URL=your_supabase_function_url
```

### 4. Database Setup

#### Supabase Database Schema

The application requires the following database tables:

```sql
-- User Profiles
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues
CREATE TABLE venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity INTEGER,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  image_url TEXT,
  is_admin_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Venue Relationships
CREATE TABLE user_venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  venue_id UUID REFERENCES venues(id),
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists
CREATE TABLE artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT,
  description TEXT,
  contact_info TEXT,
  social_media JSONB,
  is_admin_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES venues(id),
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_price DECIMAL,
  ticket_price_min DECIMAL,
  ticket_price_max DECIMAL,
  total_tickets INTEGER NOT NULL,
  tickets_sold INTEGER,
  total_ticket_revenue DECIMAL,
  bar_sales DECIMAL,
  notes TEXT,
  is_admin_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event-Artist Relationships
CREATE TABLE event_artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  artist_id UUID REFERENCES artists(id),
  is_headliner BOOLEAN DEFAULT FALSE,
  performance_order INTEGER,
  is_admin_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Metrics
CREATE TABLE event_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  attendance INTEGER,
  ticket_revenue DECIMAL,
  total_revenue DECIMAL,
  bar_sales_per_attendee DECIMAL,
  is_public BOOLEAN DEFAULT TRUE,
  is_admin_added BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS)

Enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_metrics ENABLE ROW LEVEL SECURITY;

-- Example policies (customize based on your needs)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### 5. n8n Workflow Setup (Optional)

For AI-powered talent discovery, set up an n8n workflow with:

1. **Chat Trigger Node** to receive user messages
2. **Data Processing** to extract user context
3. **AI Integration** (OpenAI, Anthropic, etc.)
4. **Response Formatting** to return recommendations

The application automatically passes user context including:
- User profile information
- Current venue details
- Analytics data
- Recent events history

### 6. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 7. Build for Production

```bash
npm run build
npm run preview
```

## 🗄️ Database Schema Overview

The application uses a comprehensive PostgreSQL schema with the following key relationships:

```
Users (Supabase Auth)
├── user_profiles (1:1)
└── user_venues (1:many)
    └── venues (many:1)
        └── events (1:many)
            ├── event_artists (many:many)
            │   └── artists
            └── event_metrics (1:1)
```

### Key Entities

- **Users**: Authentication and basic account management
- **User Profiles**: Extended user information and roles
- **Venues**: Physical venue information and capacity
- **Events**: Show/concert data with financial metrics
- **Artists**: Performer database with genre information
- **Event Metrics**: Detailed performance analytics

## 🔌 API Services

The application includes several service classes for data management:

### VenueService
- `getUserVenues()` - Get venues for a user
- `createVenue()` - Add new venue
- `getVenueAnalytics()` - Calculate venue performance metrics
- `getVenueEvents()` - Retrieve past and upcoming events

### EventService
- `createEvent()` - Add new event with artists
- `getEventsWithFilters()` - Advanced event filtering and search
- `updateEventFinancials()` - Update ticket sales and revenue

### ArtistService
- `getArtistWithEvents()` - Artist details with performance history
- `searchArtists()` - Search artist database

### UserProfileService
- `getUserProfile()` - Get user profile information
- `updateProfileWithAvatar()` - Update profile with image upload

## 🎨 UI Components

The application features a comprehensive component library:

### Layout Components
- **Sidebar**: Main navigation with user context
- **ProtectedRoute**: Authentication wrapper

### Feature Components
- **OnboardingWizard**: Multi-step user setup
- **EventFilters**: Advanced filtering interface
- **AnalyticsCards**: Performance metric displays
- **VenueSelector**: Multi-venue switching

### Common Components
- **Button**: Consistent button styling
- **Avatar**: User profile images
- **TrendChart**: Data visualization
- **TypewriterEffect**: Animated text display

## 🚀 User Journey

### New User Onboarding

1. **Welcome**: Introduction to MusicDB platform
2. **Profile Setup**: User information and role selection
3. **Venue Creation**: Add first venue with details
4. **Early Access**: Validation for platform access
5. **Event Reporting**: Add 3 initial events to build database
6. **Completion**: Access to full platform features

### Existing User Workflow

1. **Dashboard**: View analytics and recent activity
2. **Event Management**: Report new shows and update existing ones
3. **Venue Analytics**: Review performance metrics
4. **Talent Discovery**: Use AI assistant for booking recommendations
5. **Profile Management**: Update settings and preferences

## 🔗 AI Chat Integration

### User Context Data

When interacting with the AI assistant, the following context is automatically provided:

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
    capacity?: number;
  }>,
  analytics: {
    showsReported: number;
    ticketSales: number;
    barSales: number;
    avgSelloutRate: number;
    avgTicketPrice: number;
    topGenre?: { genre: string; count: number };
    topArtist?: { name: string; count: number };
    topMonth?: { month: string; count: number };
  },
  events: {
    upcoming: Event[];
    past: Event[];
    total_count: number;
    recent_summary: RecentEventSummary;
  }
}
```

### n8n Workflow Integration

Access user context in your n8n workflow:

```javascript
// User information
{{ $json.metadata.userContext.user.full_name }}

// Venue details
{{ $json.metadata.userContext.venue.name }}
{{ $json.metadata.userContext.venue.capacity }}

// Analytics data
{{ $json.metadata.userContext.analytics.topGenre.genre }}
{{ $json.metadata.userContext.analytics.avgTicketPrice }}

// Recent events
{{ $json.metadata.userContext.events.recent_summary }}
```

### Example AI System Prompt

```
You are a talent discovery assistant for music venues.

User Context:
- Venue: {{ $json.metadata.userContext.venue.name }} 
  (Capacity: {{ $json.metadata.userContext.venue.capacity }})
- Location: {{ $json.metadata.userContext.venue.location }}
- Most popular genre: {{ $json.metadata.userContext.analytics.topGenre.genre }}
- Recent shows: {{ $json.metadata.userContext.events.total_count }}
- Average ticket price: ${{ $json.metadata.userContext.analytics.avgTicketPrice }}
- Top performing artist: {{ $json.metadata.userContext.analytics.topArtist.name }}

Please provide artist recommendations that fit this venue's profile, 
taking into account their capacity, location, popular genres, and 
pricing history. Focus on artists who would be a good fit for their 
audience and venue size.
```

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: All database tables protected with Supabase RLS
- **Authentication**: Secure email/password auth with Supabase Auth
- **API Security**: All API calls authenticated with JWT tokens
- **File Storage**: Secure avatar uploads with Supabase Storage
- **Data Privacy**: User data isolated per venue and user permissions

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Type Checking
npx tsc --noEmit     # Check TypeScript types
```


### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React rules
- **Tailwind CSS**: Utility-first styling approach
- **Component Structure**: Feature-based organization

## 🐛 Troubleshooting

### Common Issues

**Environment Variables Not Loading**
- Ensure `.env.local` file is in root directory
- Verify all `VITE_` prefixes are correct
- Restart development server after changes

**Supabase Connection Issues**
- Check Supabase URL and anon key are correct
- Verify RLS policies allow proper access
- Check network connectivity to Supabase

**n8n Integration Not Working**
- Verify webhook URL is accessible
- Check n8n workflow is activated
- Ensure CORS settings allow your domain

**Database Schema Issues**
- Run SQL schema creation scripts
- Verify foreign key relationships
- Check RLS policies are properly configured

### Getting Help

1. Check the browser console for error messages
2. Verify environment variables are properly set
3. Test Supabase connection in the browser developer tools
4. Review Supabase logs for API errors

## 🤝 Contributing

We welcome contributions to MusicDB! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write descriptive commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **National Independent Venue Association (NIVA)** for industry insights
- **Supabase** for backend infrastructure
- **n8n** for workflow automation capabilities
- **React** and **TypeScript** communities for excellent tooling
- All the independent venue owners contributing to a collaborative music ecosystem

---

**Built with ❤️ for the independent music community**
